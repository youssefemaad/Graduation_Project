FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1

# System dependencies for psycopg2 and common ML packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    git \
    curl \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only requirements first for better caching
COPY ml_models/requirements.txt /app/requirements.txt

# Install Python deps
RUN pip install --upgrade pip setuptools wheel \
 && pip install --no-cache-dir -r /app/requirements.txt

# Copy app code
COPY ml_models /app/ml_models
COPY scripts /app/scripts

EXPOSE 5100

CMD ["python", "ml_models/embedding_server.py"]
