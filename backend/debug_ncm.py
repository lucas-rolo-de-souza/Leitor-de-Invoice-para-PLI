
import asyncio
import sys
import logging
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from services.ncm_service import ncm_service

# Configure logging to see output
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_ncm_loading():
    logger.info("Starting NCM Service Debug...")
    
    # Manually trigger init
    await ncm_service.init()
    
    logger.info(f"Is Ready: {ncm_service.is_ready}")
    logger.info(f"Map Size: {len(ncm_service.ncm_map)}")
    
    # Test a known code
    test_code = "01012100"
    desc = ncm_service.get_description(test_code)
    logger.info(f"Test Code {test_code}: {desc}")
    
    # Test hierarchy
    hierarchy = ncm_service.get_hierarchy(test_code)
    logger.info(f"Hierarchy for {test_code}: {hierarchy}")
    
    # Inspect raw data structure if map is empty
    if len(ncm_service.ncm_map) == 0:
        logger.info("Map is empty. Attempting raw download to inspect format...")
        data = ncm_service._download_data()
        if data:
            logger.info(f"Downloaded Type: {type(data)}")
            if isinstance(data, dict):
                logger.info(f"Keys: {data.keys()}")
                if "Nomenclaturas" in data:
                    logger.info(f"First item: {data['Nomenclaturas'][0]}")
            elif isinstance(data, list):
                logger.info(f"First item: {data[0]}")
        else:
            logger.error("Download returned None")

if __name__ == "__main__":
    asyncio.run(test_ncm_loading())
