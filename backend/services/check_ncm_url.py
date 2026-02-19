import requests
import json

url = "https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json"

try:
    print(f"Fetching from {url}...")
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    
    data = response.json()
    print("Download successful.")
    
    if isinstance(data, dict):
        print(f"Root is dict with keys: {list(data.keys())}")
        if "Nomenclaturas" in data:
            print(f"Found 'Nomenclaturas' list with {len(data['Nomenclaturas'])} items.")
            if len(data["Nomenclaturas"]) > 0:
                print(f"First item: {data['Nomenclaturas'][0]}")
    elif isinstance(data, list):
        print(f"Root is list with length {len(data)}")
        if len(data) > 0:
            print(f"First item: {data[0]}")
            
except Exception as e:
    print(f"Error: {e}")
