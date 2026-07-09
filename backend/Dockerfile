FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY . ./backend

# Expose port (default FastAPI)
EXPOSE 8000

# Run uvicorn server from the parent folder so absolute/relative package imports work
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
