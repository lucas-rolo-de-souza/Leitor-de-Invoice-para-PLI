import json
import logging
import asyncio
from typing import Dict, Any, List
from google import genai
from google.genai import types
from models import InvoiceData

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        pass

    async def extract_invoice_data(
        self, 
        content: bytes, 
        mime_type: str, 
        filename: str, 
        api_key: str
    ) -> InvoiceData:
        
        # Initialize the new Client with the request-specific API key
        client = genai.Client(api_key=api_key)
        
        model_id = "gemini-2.5-flash"
        
        metadata_prompt = self._get_metadata_prompt()
        line_items_prompt = self._get_line_items_prompt()
        
        # Helper to run blocking generate_content in thread
        async def run_generate(prompt):
             loop = asyncio.get_event_loop()
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
                      response_mime_type="application/json"
                  )
             ))
             return response.text

        # Execute concurrently
        try:
            metadata_json_str, line_items_json_str = await asyncio.gather(
                run_generate(metadata_prompt), 
                run_generate(line_items_prompt)
            )
            
            metadata = json.loads(metadata_json_str)
            raw_items = json.loads(line_items_json_str)
            
            # Parse line items similar to frontend
            line_items_obj = self._parse_line_items(raw_items)
            
            # Merge
            combined_data = {**metadata, "lineItems": line_items_obj}
            
            # Post-process (simple version for now)
            return InvoiceData(**combined_data)
            
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            raise e

    def _parse_line_items(self, raw_data: Any) -> List[Dict]:
        items = []
        if isinstance(raw_data, list):
            # Check if it's the minified array of arrays
            if raw_data and isinstance(raw_data[0], list):
                 for row in raw_data:
                     if len(row) >= 1:
                         items.append({
                             "description": str(row[0]),
                             "partNumber": str(row[1]) if len(row) > 1 and row[1] else None,
                             "quantity": float(row[2]) if len(row) > 2 and row[2] else 0,
                             "unitMeasure": str(row[3]) if len(row) > 3 and row[3] else "UN",
                             "unitPrice": float(row[4]) if len(row) > 4 and row[4] else 0,
                             "total": float(row[5]) if len(row) > 5 and row[5] else 0,
                             "netWeight": float(row[6]) if len(row) > 6 and row[6] else 0,
                             "manufacturerRef": str(row[7]) if len(row) > 7 and row[7] else None,
                             "ncm": str(row[8]) if len(row) > 8 and row[8] else None
                         })
            else:
                items = raw_data
        elif isinstance(raw_data, dict) and "lineItems" in raw_data:
            items = raw_data["lineItems"]
            
        return items

    def _get_metadata_prompt(self) -> str:
        return """
          You are an expert Customs Data Analyst.
          EXTRACT global metadata from the Invoice.
          
          SCOPE: Header, Entities, Logistics, Financials.
          IGNORE: Line Items (return empty list).
          
          OUTPUT JSON matching this structure (use null if missing):
          {
            "invoiceNumber": "string",
            "date": "YYYY-MM-DD",
            "exporterName": "string",
            "importerName": "string",
            "currency": "USD",
            "grandTotal": 0.00,
            "incoterm": "string",
            "exporterAddress": "string",
            "exporterTaxId": "string",
            "importerAddress": "string",
            "importerTaxId": "string",
             "countryOfOrigin": "string",
             "countryOfAcquisition": "string",
             "countryOfProvenance": "string",
             "portOfLoading": "string",
             "portOfDischarge": "string",
             "totalNetWeight": 0.0,
             "totalGrossWeight": 0.0,
             "totalPackages": 0,
             "volumeType": "string",
             "paymentTerms": "string",
             "freightValue": 0.0,
             "insuranceValue": 0.0,
             "otherChargesValue": 0.0
          }
        """

    def _get_line_items_prompt(self) -> str:
        return """
          EXTRACT the LINE ITEMS table.
          RETURN A MINIFIED JSON ARRAY OF ARRAYS.
          
          Columns:
          0. Description (String)
          1. Buyer Part Number (String/null)
          2. Quantity (Number)
          3. Unit (String)
          4. Unit Price (Number)
          5. Total Value (Number)
          6. Net Weight (Number)
          7. Manufacturer Part Number (String/null)
          8. NCM (String/null)
          
          Example:
          [
            ["Widget A", "SKU123", 10, "PCS", 5.00, 50.00, 1.0, "MREF", "8517.13.00"]
          ]
        """

gemini_service = GeminiService()
