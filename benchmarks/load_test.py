import threading
import time
import requests
import os

def simulate_user(user_id, duration):
    print(f"User {user_id} started")
    end_time = time.time() + duration
    success_count = 0
    error_count = 0
    
    while time.time() < end_time:
        try:
            # Upload PDF to extract endpoint
            files = {'file': ('sample.pdf', open('sample.pdf', 'rb'), 'application/pdf')}
            data = {'api_key': 'mock_key'}
            
            start = time.time()
            response = requests.post("http://localhost:8000/api/extract", files=files, data=data)
            latency = time.time() - start
            
            if response.status_code == 200:
                success_count += 1
                # print(f"User {user_id}: Success ({latency:.2f}s)")
            else:
                error_count += 1
                print(f"User {user_id}: Error {response.status_code} - {response.text[:100]}")
                
        except Exception as e:
            error_count += 1
            print(f"User {user_id} Exception: {e}")
            
        time.sleep(1) # simulate think time between uploads

    print(f"User {user_id} finished. Success: {success_count}, Errors: {error_count}")

def run_load(users=20, duration=60):
    threads = []
    print(f"Starting load test with {users} users for {duration} seconds (Endpoint: /api/extract)...")
    
    # Create sample.pdf if not exists (redundancy)
    if not os.path.exists("sample.pdf"):
        with open("sample.pdf", "wb") as f:
            f.write(b"Dummy PDF Content for Benchmark")

    for i in range(users):
        t = threading.Thread(target=simulate_user, args=(i, duration))
        t.start()
        threads.append(t)
    
    for t in threads:
        t.join()
    print("Load test complete.")

if __name__ == "__main__":
    run_load(20, 60)
