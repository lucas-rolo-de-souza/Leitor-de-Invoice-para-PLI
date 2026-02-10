import time
import psutil
import csv
import datetime
import os
import subprocess
import json

class SystemMonitor:
    def __init__(self, output_file="benchmark_metrics.csv", interval=1):
        self.output_file = output_file
        self.interval = interval
        self.running = True

    def get_docker_stats(self):
        """Fetches stats for all running docker containers."""
        try:
            # Run docker stats --no-stream --format json
            result = subprocess.run(
                ["docker", "stats", "--no-stream", "--format", "{{json .}}"],
                capture_output=True, text=True
            )
            
            containers = []
            if result.stdout:
                for line in result.stdout.strip().split('\n'):
                    if line:
                        try:
                            # docker stats json output can be weird, one JSON object per line
                            containers.append(json.loads(line))
                        except json.JSONDecodeError:
                            pass
            return containers
        except FileNotFoundError:
            return []

    def start_monitoring(self, duration_seconds=120):
        print(f"Starting monitoring for {duration_seconds} seconds...")
        print(f"Results will be saved to {self.output_file}")
        
        file_exists = os.path.isfile(self.output_file)
        
        with open(self.output_file, 'a', newline='') as csvfile:
            fieldnames = ['timestamp', 'cpu_percent', 'memory_percent', 'docker_cpu', 'docker_mem']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            if not file_exists:
                writer.writeheader()
            
            start_time = time.time()
            
            while (time.time() - start_time) < duration_seconds:
                # System-wide metrics
                cpu = psutil.cpu_percent(interval=None)
                mem = psutil.virtual_memory().percent
                
                # Docker metrics (aggregated)
                docker_stats = self.get_docker_stats()
                docker_cpu_total = 0.0
                docker_mem_total = 0.0
                
                for c in docker_stats:
                    # Parse "0.05%" -> 0.05
                    try:
                        cpu_str = c.get('CPUPerc', '0%').replace('%', '')
                        docker_cpu_total += float(cpu_str)
                        
                        mem_str = c.get('MemPerc', '0%').replace('%', '')
                        docker_mem_total += float(mem_str)
                    except ValueError:
                        pass

                writer.writerow({
                    'timestamp': datetime.datetime.now().isoformat(),
                    'cpu_percent': cpu,
                    'memory_percent': mem,
                    'docker_cpu': round(docker_cpu_total, 2),
                    'docker_mem': round(docker_mem_total, 2)
                })
                
                print(f"Logged: CPU {cpu}% | RAM {mem}% | Docker CPU {docker_cpu_total}%", end='\r')
                time.sleep(self.interval)
                
        print("\nMonitoring complete.")

if __name__ == "__main__":
    # Monitor for 120 seconds by default
    monitor = SystemMonitor()
    monitor.start_monitoring(120)
