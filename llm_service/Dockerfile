# LLM Service Dockerfile for Python/FastAPI

FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies (if any needed, e.g., build tools)
RUN apt-get update && \
    apt-get install -y build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Start FastAPI app with Uvicorn
CMD ["uvicorn", "llm_service:app", "--host", "0.0.0.0", "--port", "8000"]
