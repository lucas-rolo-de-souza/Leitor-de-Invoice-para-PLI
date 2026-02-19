import json
import logging
import requests
from typing import Dict, List, Optional
import asyncio

logger = logging.getLogger(__name__)

class NcmService:
    def __init__(self):
        self.ncm_map: Dict[str, str] = {}
    def __init__(self):
        self.ncm_map: Dict[str, str] = {}
        self.is_ready = False
        self.primary_url = "https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json"
        self.fallback_url = "https://cdn.jsdelivr.net/gh/leogregianin/siscomex-ncm@master/ncm.json"
        
        self.metrics = {
            "source_url": None,
            "download_time_ms": 0,
            "total_items": 0,
            "last_updated": None,
            "status": "not_initialized"
        }
        self.raw_data = None

    async def init(self):
        if self.is_ready:
            return
            
        try:
            logger.info("Initializing NCM Service and downloading database...")
            
            loop = asyncio.get_event_loop()
            data = await loop.run_in_executor(None, self._download_data)
            
            if data:
                self._build_map(data)
                self.is_ready = True
                logger.info(f"NCM Service initialized. Loaded {len(self.ncm_map)} records.")
            else:
                logger.error("Failed to download NCM data.")
                
        except Exception as e:
            logger.error(f"Error initializing NCM Service: {e}")

    def _download_data(self):
        urls = [self.primary_url, self.fallback_url]
        import time
        from datetime import datetime
        
        for url in urls:
            try:
                start_time = time.time()
                logger.info(f"Attempting download from {url}")
                response = requests.get(url, timeout=60)
                response.raise_for_status()
                data = response.json()
                duration = (time.time() - start_time) * 1000
                
                self.metrics.update({
                    "source_url": url,
                    "download_time_ms": round(duration, 2),
                    "last_updated": datetime.now().isoformat(),
                    "status": "ok"
                })
                self.metrics.update({
                    "source_url": url,
                    "download_time_ms": round(duration, 2),
                    "last_updated": datetime.now().isoformat(),
                    "status": "ok"
                })
                self.is_ready = True
                self.raw_data = data
                return data
            except Exception as e:
                logger.warning(f"Download failed from {url}: {e}")
        
        self.metrics["status"] = "error"
        logger.error("All download attempts failed.")
        return None

    def _build_map(self, data):
        new_map = {}
        
        # Format 1: Official { "Nomenclaturas": [...] }
        if isinstance(data, dict) and "Nomenclaturas" in data:
            for item in data["Nomenclaturas"]:
                code = item.get("Codigo", "").replace(".", "").strip()
                desc = item.get("Descricao", "").strip()
                if code:
                    new_map[code] = desc
                    
        # Format 2: Minified Tuple List [["code", "desc"], ...]
        elif isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
             for item in data:
                 if len(item) >= 2:
                     new_map[item[0]] = item[1]
                     
        self.ncm_map = new_map
        self.metrics["total_items"] = len(new_map)

    def get_metrics(self) -> Dict:
        return self.metrics

    def get_raw_data(self) -> Optional[Dict]:
        return self.raw_data

    def search(self, term: str) -> List[Dict]:
        results = []
        term_lower = term.lower()
        term_clean = term.replace(".", "").strip()  # Clean formatting for code match
        
        count = 0
        limit = 20
        
        for code, desc in self.ncm_map.items():
            # Match cleaned term against code, OR original term against description
            if term_clean in code or term_lower in desc.lower():
                results.append({"code": code, "description": desc})
                count += 1
                if count >= limit:
                    break
        return results

    def get_description(self, code: str) -> Optional[str]:
        clean_code = code.replace(".", "").strip()
        return self.ncm_map.get(clean_code)

    def get_hierarchy(self, code: str) -> List[Dict]:
        clean_code = code.replace(".", "").strip()
        hierarchy = []
        
        # Define hierarchy levels: 2 (Chapter), 4 (Position), 6 (Subposition), 8 (Item)
        levels_map = {
            2: "Capítulo",
            4: "Posição",
            6: "Subposição",
            8: "Item"
        }
        
        # Build hierarchy by checking progressively longer prefixes
        current_code = ""
        for char in clean_code:
            current_code += char
            length = len(current_code)
            
            if length in levels_map:
                desc = self.ncm_map.get(current_code)
                if desc:
                    hierarchy.append({
                        "code": current_code,
                        "description": desc,
                        "level": levels_map[length]
                    })
                    
        return hierarchy

ncm_service = NcmService()
