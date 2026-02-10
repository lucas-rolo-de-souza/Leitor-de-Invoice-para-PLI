# Backend Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies if needed (e.g. for psycopg2 if used later, currently not needed)
# RUN apt-get update && apt-get install -y gcc

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Run commands
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
