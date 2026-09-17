FROM python:3.10-slim

WORKDIR /app

# ── System build dependencies ─────────────────────────────────────────────────
# Several packages (torch, tokenizers, orjson, etc.) compile native extensions
# and require gcc/g++ to be present in the image.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# ── PyTorch (CPU-only) ────────────────────────────────────────────────────────
# Railway has no GPU — install the lightweight CPU wheel from PyTorch's own
# index. This must happen BEFORE requirements.txt so pip doesn't try to pull
# a heavy/wrong torch build from PyPI.
RUN pip install --no-cache-dir \
    torch --extra-index-url https://download.pytorch.org/whl/cpu

# torch-geometric must be installed AFTER torch
RUN pip install --no-cache-dir torch-geometric

# ── Remaining dependencies ────────────────────────────────────────────────────
# torch is already installed above; pip will skip reinstalling it.
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Railway dynamically assigns a PORT env var — bind to it.
# Falls back to 8000 for local development.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
