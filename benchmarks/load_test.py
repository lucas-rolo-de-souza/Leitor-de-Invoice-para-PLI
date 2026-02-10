import threading
import time
import requests

def simulate_user(user_id, duration):
    print(f"User {user_id} started")
    end_time = time.time() + duration
    while time.time() < end_time:
        try:
            # Hit the API (NCM Search - CPU intensive due to 30MB JSON search)
            requests.get("http://localhost:8000/api/ncm/search?term=iphone")
        except Exception as e:
            print(f"User {user_id} error: {e}")
        time.sleep(1) # simulate think time
    print(f"User {user_id} finished")

def run_load(users=20, duration=60):
    threads = []
    print(f"Starting load test with {users} users for {duration} seconds...")
    for i in range(users):
        t = threading.Thread(target=simulate_user, args=(i, duration))
        t.start()
        threads.append(t)
    
    for t in threads:
        t.join()
    print("Load test complete.")

if __name__ == "__main__":
    run_load(20, 60)
