import json
import logging
import requests
from typing import Dict, List, Optional
import asyncio

logger = logging.getLogger(__name__)

class NcmService:
    def __init__(self):
        self.ncm_map: Dict[str, str] = {}
        self.is_ready = False
        self.data_url = "https://cdn.jsdelivr.net/gh/leogregianin/siscomex-ncm@master/ncm.json"

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
        try:
            response = requests.get(self.data_url, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Download failed: {e}")
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

ncm_service = NcmService()
