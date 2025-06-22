FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only necessary application files
COPY server.py database.py auth.py admin.py admin_auth.py ./
COPY models ./models/

# Create volume for SQLite database
VOLUME ["/app/data"]

# Expose port
EXPOSE 8000

# Run the application
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port 8000 --log-level ${LOG_LEVEL:-info} ${RELOAD_FLAG}"]