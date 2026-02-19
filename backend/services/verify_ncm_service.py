import asyncio
import logging
import sys
import os

# Add parent directory to sys.path to allow import
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

# Configure logging
logging.basicConfig(level=logging.INFO)

from backend.services.ncm_service import NcmService

async def main():
    print("Testing NcmService with new URL logic...")
    service = NcmService()
    
    print(f"Primary URL: {service.primary_url}")
    print(f"Fallback URL: {service.fallback_url}")
    
    await service.init()
    
    if service.is_ready:
        print(f"Service initialized successfully. Map size: {len(service.ncm_map)}")
        # Test a known NCM code
        test_code = "01012100" # Horses
        desc = service.get_description(test_code)
        print(f"Description for {test_code}: {desc}")
        
        # Test a search
        results = service.search("cavalo")
        print(f"Search 'cavalo': {len(results)} results found.")
    else:
        print("Service failed to initialize.")

if __name__ == "__main__":
    asyncio.run(main())
