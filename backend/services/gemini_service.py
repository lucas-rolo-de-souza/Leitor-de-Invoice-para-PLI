import json
import logging
import asyncio
import re
import time
from typing import Dict, Any, List, Optional, Union
from google import genai
from google.genai import types
from models import InvoiceData

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        pass

    def _safe_json_parse(self, text: str) -> Any:
        """
        Robust JSON parser designed to handle LLM output "hallucinations" and formatting errors.
        Ported from geminiService.ts
        """
        # 1. Strip Markdown Code Blocks & aggressively find JSON start/end
        clean = re.sub(r"```json\s*", "", text, flags=re.IGNORECASE)
        clean = re.sub(r"```\s*$", "", clean).strip()

        # If text starts with non-JSON character, try to find the first '[' or '{'
        first_bracket = re.search(r"[{[]", clean)
        if first_bracket:
            clean = clean[first_bracket.start():]

        # Find the last closing bracket
        last_curly = clean.rfind("}")
        last_square = clean.rfind("]")
        last_bracket = max(last_curly, last_square)

        if last_bracket > -1 and last_bracket < len(clean) - 1:
            clean = clean[:last_bracket + 1]
        
        clean = clean.strip()

        # 1.5 Fix common JSON errors (trailing commas)
        # LLMs often output {"key": "value",} or [1, 2,]
        clean = re.sub(r",\s*([\]}])", r"\1", clean)

        # 2. Try Standard Parse
        try:
            return json.loads(clean)
        except json.JSONDecodeError:
            logger.info("Standard parse failed. Triggering repair mechanisms (this is expected for imperfect LLM output)...")

        # 3. State-Machine Token Balancer
        stack = []
        in_string = False
        escaped = False
        
        for char in clean:
            if escaped:
                escaped = False
                continue
            
            if char == "\\":
                escaped = True
                continue
            
            if char == '"':
                in_string = not in_string
            elif not in_string:
                if char == "{":
                    stack.append("}")
                elif char == "[":
                    stack.append("]")
                elif char == "}" or char == "]":
                    if stack and stack[-1] == char:
                        stack.pop()

        repaired = clean

        # Close open string
        if in_string:
            repaired += '"'
        
        # Handle trailing comma or colon
        repaired = repaired.rstrip()
        if repaired.endswith(","):
            repaired = repaired[:-1]
        elif repaired.endswith(":"):
            repaired += "null"
        
        # Close remaining brackets in reverse order
        while stack:
            repaired += stack.pop()
        
        # Try parsing the repaired string
        try:
            res = json.loads(repaired)
            logger.info("JSON repaired successfully via Token Balancer.")
            return res
        except json.JSONDecodeError as e:
            logger.warning(f"Token Balancer failed, attempting Truncation Fallback... Error: {e}")

        # 4. Truncation Fallback
        candidates = []
        # Scan backwards for potential cut points
        for i in range(len(clean) - 1, -1, -1):
            char = clean[i]
            if char == "}" or char == "]":
                candidates.append(clean[:i + 1])
                if len(candidates) >= 5:
                    break
        
        closers = ["", "}", "]", "]}", "}}", "]}}"]
        
        for candidate in candidates:
            for closer in closers:
                try:
                    attempt = candidate + closer
                    res = json.loads(attempt)
                    logger.info(f"JSON repaired via Truncation at length {len(candidate)} with closer '{closer}'.")
                    return res
                except json.JSONDecodeError:
                    continue
        
        # Final failure
        raise ValueError(f"JSON Repair Failed. Length: {len(clean)}")

    async def _with_retry(self, operation, attempt=1, max_retries=5):
        try:
            return await operation()
        except Exception as e:
            msg = str(e)
            # Check for 429 (Rate Limit) or 503 (Overloaded) - adjusting for Python client exceptions
            # The google-genai library might wrap errors differently, checking string content is a safe fallback
            is_rate_limit = "429" in msg or "RESOURCE_EXHAUSTED" in msg
            is_overloaded = "503" in msg or "overloaded" in msg or "UNAVAILABLE" in msg

            if (is_rate_limit or is_overloaded) and attempt <= max_retries:
                # Exponential backoff: 2s, 4s, 8s, 16s...
                delay = 2 * (2 ** (attempt - 1))
                
                # Check for "retry in X.XXs" in message
                match = re.search(r"retry in\s+(\d+(\.\d+)?)s", msg, re.IGNORECASE)
                if match:
                    delay = float(match.group(1))

                reason = "Server overloaded (503)" if is_overloaded else "Rate limit (429)"
                logger.warning(f"{reason}. Retrying in {delay}s (Attempt {attempt}/{max_retries})... Error: {msg}")
                
                await asyncio.sleep(delay)
                return await self._with_retry(operation, attempt + 1, max_retries)
            
            logger.error(f"API Request Failed (Final): {msg}")
            raise e

    async def extract_invoice_data(
        self, 
        content: bytes, 
        mime_type: str, 
        filename: str, 
        api_key: str
    ) -> InvoiceData:
        
        # Initialize the new Client
        client = genai.Client(api_key=api_key)
        model_id = "gemini-2.5-flash"
        
        metadata_prompt = self._get_metadata_prompt()
        line_items_prompt = self._get_line_items_prompt()
        
        # Helper to run generate_content
        async def generate(prompt, task_name):
            async def execute():
                loop = asyncio.get_event_loop()
                # Run blocking call in executor
                response = await loop.run_in_executor(None, lambda: client.models.generate_content(
                    model=model_id,
                    contents=[
                        types.Content(
                            role="user",
                            parts=[
                                types.Part.from_text(text=f"[SYSTEM: FILE CONTEXT] Filename: {filename}"),
                                types.Part.from_bytes(data=content, mime_type=mime_type),
                                types.Part.from_text(text=prompt)
                            ]
                        )
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0
                    )
                ))
                return response
            
            return await self._with_retry(execute)

        # Execute concurrently with rate limit buffer logic from TS (Flash-Chunking)
        # Note: In Python asyncio.gather works slightly differently than TS promise resolution
        # We'll run metadata first, wait a bit, then line items if needed, or just run both if we trust the retry logic.
        # The TS code waits 3s between metadata success and line items start.
        
        try:
            # 1. Metadata
            logger.info(f"Requests Metadata extraction ({model_id})...")
            metadata_response = await generate(metadata_prompt, "Metadata")
            
            # Rate Limit Buffer
            logger.info("Rate limit buffer: Pausing for 3s...")
            await asyncio.sleep(3.0)
            
            # 2. Line Items
            logger.info(f"Requesting Line Items extraction ({model_id})...")
            line_items_response = await generate(line_items_prompt, "LineItems")
            
            # Parse
            metadata = self._safe_json_parse(metadata_response.text or "{}")
            raw_items = self._safe_json_parse(line_items_response.text or "[]")
            
            # Parse line items similar to frontend
            line_items_obj = self._parse_line_items(raw_items)
            
            # Merge
            combined_data = {**metadata, "lineItems": line_items_obj}
            
            # Post-process
            final_result = self._post_process_invoice_data(combined_data)
            
            return InvoiceData(**final_result)
            
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            raise e

    def _parse_line_items(self, raw_data: Any) -> List[Dict]:
        items = []
        if isinstance(raw_data, list):
            # Check if it's the minified array of arrays
            if raw_data and isinstance(raw_data[0], list):
                 for row in raw_data:
                     # Safety check and conversion
                     if len(row) >= 1:
                         items.append({
                             "description": str(row[0]) if row[0] is not None else "Item Desconhecido",
                             "partNumber": str(row[1]) if len(row) > 1 and row[1] else None,
                             "quantity": float(row[2]) if len(row) > 2 and row[2] else 0.0,
                             "unitMeasure": str(row[3]) if len(row) > 3 and row[3] else "UN",
                             "unitPrice": float(row[4]) if len(row) > 4 and row[4] else 0.0,
                             "total": float(row[5]) if len(row) > 5 and row[5] else 0.0,
                             "netWeight": float(row[6]) if len(row) > 6 and row[6] else 0.0,
                             "manufacturerRef": str(row[7]) if len(row) > 7 and row[7] else None,
                             "ncm": str(row[8]) if len(row) > 8 and row[8] else None, # Index 8 for NCM from prompt
                             # Defaults for others
                             "productCode": None,
                             "taxClassificationDetail": None,
                             "unitNetWeight": 0.0,
                             "manufacturerCode": None
                         })
            else:
                # Fallback to old object format
                items = raw_data
        elif isinstance(raw_data, dict) and "lineItems" in raw_data:
            items = raw_data["lineItems"]
            
        return items

    def _post_process_invoice_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        result = data.copy()
        
        # Normalize numeric metadata fields (convert None to 0)
        numeric_fields = [
            "grandTotal", "totalNetWeight", "totalGrossWeight", "totalPackages",
            "freightValue", "insuranceValue", "otherChargesValue"
        ]
        for field in numeric_fields:
            if field in result:
                result[field] = float(result[field]) if result[field] is not None else 0.0
            else:
                result[field] = 0.0
        
        # Line Items Normalization
        if "lineItems" in result and isinstance(result["lineItems"], list):
            processed_items = []
            for item in result["lineItems"]:
                # Ensure types
                qty = float(item.get("quantity", 0) or 0)
                net_weight = float(item.get("netWeight", 0) or 0)
                unit_net_weight = float(item.get("unitNetWeight", 0) or 0)
                
                # Weight Logic
                if net_weight > 0 and qty > 0:
                     unit_net_weight = float(f"{(net_weight / qty):.6f}")
                elif unit_net_weight > 0 and qty > 0:
                     net_weight = float(f"{(unit_net_weight * qty):.4f}")
                
                item["quantity"] = qty
                item["netWeight"] = net_weight
                item["unitNetWeight"] = unit_net_weight
                item["unitPrice"] = float(item.get("unitPrice", 0) or 0)
                item["total"] = float(item.get("total", 0) or 0)
                item["weightUnit"] = "KG"
                
                processed_items.append(item)
            
            result["lineItems"] = processed_items
            
        return result

    def _get_metadata_prompt(self) -> str:
        return """
          You are an expert Customs Data Analyst (Despachante Aduaneiro) AI.
          
          YOUR TASK: Extract the global metadata from the provided Commercial Invoice.
          
          SCOPE:
          - **Header**: Invoice Number, Issue Date, Purchase Order (PO) references, and total page count.
          - **Entities**: Comprehensive details for Exporter (Seller), Importer (Buyer), Consignee, and Manufacturer. Include full legal names, physical addresses, and Tax Identification Numbers (VAT, CNPJ, EIN, etc.).
          - **Geographic Context**:
            - **Country of Origin**: The nation where the goods were produced/manufactured. Use ISO 3166-1 alpha-3 codes.
            - **Country of Acquisition**: The nation where the seller is legally established. Use ISO 3166-1 alpha-3 codes.
            - **Country of Provenance**: The nation from which the goods were physically dispatched. Use ISO 3166-1 alpha-3 codes.
          - **Logistics & Ports**:
            - **Port of Loading**: The specific point where goods are loaded for export, can be an Airport or Port.
            - **Port of Discharge**: The final destination point where goods are unloaded, can be an Airport or Port.
            - **Transshipment**: Any intermediate locations or hubs where cargo is transferred, can be an Airport or Port.
            - **Incoterm**: The 3-letter commercial term and its associated named place from the latest version of the Incoterm rules.
            - **Weights**: Total Net Weight, Total Gross Weight.
            - **Volumes**: Total Package count, can be nested and/or multiple.
            - **Volume Type**: The type of volume measurement used (e.g., cubic meters, cubic feet, pallets, boxes, etc.).
            - **Volume Dimensions**: The dimensions of the volume (e.g., length, width, height).
          - **Financials**: Currency (ISO code), Total Invoice Value, Payment Terms, and a breakdown of non-item costs (Freight, Insurance, Packing, and Miscellaneous Charges).

          EXCLUSION:
          - **DO NOT EXTRACT LINE ITEMS.** The "lineItems" array must be empty []. This is handled by a separate process.

          FIELD GUIDELINES:
          You are a specialized Invoice Data Extractor.
          OBJECTIVE: Extract ONLY the Header, Entities, Logistics, and Financials.
          
          CRITICAL INSTRUCTION: **IGNORE THE LINE ITEMS TABLE.** Do not extract the list of products. Return "lineItems": [] in your JSON.

          [PACKING LIST INSTRUCTION]
          If a "Packing List" or "Lista de Empaque" is attached:
          1. PRIORITIZE it for extracting **Total Net Weight**, **Total Gross Weight**, **Total Volumes** (Count), and **Volume Type**.
          2. Packing Lists are often the source of truth for logistics data. use them!
          
          OUTPUT: Return JSON using these exact field names:
          invoiceNumber, date, exporterName, exporterAddress, exporterTaxId, importerName, importerAddress, importerTaxId, currency, grandTotal, incoterm, countryOfOrigin, countryOfAcquisition, countryOfProvenance, portOfLoading, portOfDischarge, totalNetWeight, totalGrossWeight, totalPackages, volumeType, paymentTerms, freightValue, insuranceValue, otherChargesValue, lineItems
        """

    def _get_line_items_prompt(self) -> str:
        return """
          You are a specialized Invoice Data Extractor.
          OBJECTIVE: Extract the LINE ITEMS table using a MINIFIED JSON ARRAY format to save tokens.
          
          CRITICAL INSTRUCTION: Return a SINGLE JSON Array of Arrays (Matrix).
          Each inner array represents ONE row from the table.
          
          [COLUMN ORDER - STRICTLY FOLLOW THIS INDEX]:
          0. **Description**: (String) Full description of goods.
          1. **Buyer Part Number**: (String or null) The Importer/Buyer's Item Code, Main SKU, Product ID, Product Code, Product Reference, etc.
          2. **Quantity**: (Number) Pure number.
          3. **Unit**: (String) PCS, KG, SET, etc.
          4. **Unit Price**: (Number) 
          5. **Total Value**: (Number)
          6. **Net Weight**: (Number) Total Net Weight for the line (Check Packing List if needed).
          7. **Manufacturer Part Number**: (String or null) The Manufacturer/Seller's Part Number (Referência do Fabricante).
          8. **NCM**: (String or null) The NCM (Nomenclatura Comum do Mercosul) or, if no NCM is found, the HS Code.

          [ANTI-HALLUCINATION RULE FOR NCM]:
          - ONLY extract the NCM/HS Code if it is EXPLICITLY written in the document for that specific line item.
          - DO NOT attempt to classify, guess, or search for the NCM based on the description.
          - If not explicitly found in the text, return `null`.
          
          [EXAMPLE OUTPUT]:
          [
            ["iPhone 15 Pro Max 256GB", "BUYER-SKU-001", 50, "PCS", 1199.00, 59950.00, 12.5, "A2894", "8517.13.00"],
            ["Samsung Galaxy S24 Ultra", "BUYER-SKU-002", 30, "PCS", 1299.00, 38970.00, 8.2, "SM-S928", null]
          ]
          
          RULES:
          1. DO NOT use keys (like "description": ...). ONLY VALUES.
          2. Use `null` for missing string values. Use `0` for missing numbers.
          3. Extract ALL rows.
          4. **PACKING LIST**: Cross-reference Packing List for Net Weights if valid.
          5. **NO MARKDOWN**: Do not use ```json or backticks. Return RAW JSON only.

          OUTPUT FORMAT: JSON Array of Arrays ONLY.
        """

gemini_service = GeminiService()
