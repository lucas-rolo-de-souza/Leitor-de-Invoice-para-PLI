# Benchmarking Toolkit

This directory contains scripts to help you scientifically determine the hardware requirements for your application.

## Prerequisites

1. **Python 3.x** installed.
2. **Dependencies:**

   ```bash
   pip install psutil faker
   ```

## 1. Disk Growth Simulation (`db_seeder.py`)

This script generates dummy invoice data (JSON format) to simulate database growth.

**Usage:**

```markdown
1. Open `db_seeder.py` and adjust the `run_benchmark(1000)` line. To simulate a year of data for 20 users (20 invoices/day each), set this to **146,000**.
```

2. Run the script:

   ```bash
   python db_seeder.py
   ```

3. **Result:** It will output the total size of the raw JSON.
   - _Multiply this by ~1.5x_ to estimate the equivalent PostgreSQL storage requirement (due to indexes and overhead).

## 2. Resource Monitoring (`monitor.py`)

This script logs the System CPU/RAM usage and aggregates Docker Container usage while your application is running.

**Usage:**

1. Start your application stack (Supabase, App, etc.) using Docker Compose.
2. Run the monitor script:

   ```bash
   python monitor.py
   ```

3. **Result:** It will log metrics to `benchmark_metrics.csv` for 60 seconds (adjustable).
4. **Analysis:**
   - Open the CSV in Excel.
   - Look at the `docker_mem` column to see the combined RAM usage of your containers.
   - This is your **Baseline RAM Requirement** for the application. Add 2GB for OS overhead.

## 3. Recommended Workflow

1. **Baseline:** Run `monitor.py` while the system is idle.
2. **Stress Test:**
   - Start `monitor.py` in one terminal.
   - In another terminal, run `db_seeder.py` (simulating data ingestion) or use the app vigorously.
3. **Analyze:** Check the peak RAM and CPU usage in the CSV file. This peak + 20% safety margin is your **Minimum Hardware Requirement**.

## 4. Benchmark Results (Feb 2026)

### Storage (146,000 Dummy Invoices)

- **Raw JSON:** ~329 MB
- **Estimated DB:** ~0.5 GB (with overhead)
- **Conclusion:** 20GB Disk is more than sufficient for 5+ years.

### Compute (Baseline & Load Test)

- **Scenario:** 20 Concurrent Users hitting API (NCM Search)
- **RAM Usage:**
  - System: ~90% (Host machine has 8GB)
  - Docker Containers: ~2.3% (~180MB) - Extremely efficient.
- **CPU Usage:**
  - Baseline: ~0-5% (Docker)
  - Peak Load: ~15% (Docker Containers) | ~30% (System Total)
  - _Note: A 62.5% system spike was observed but unrelated to the container payload._
- **Conclusion:**
  - **Minimum:** 2 vCPU, 4GB RAM.
  - **Recommended:** 4 vCPU, 8GB RAM (Production).
