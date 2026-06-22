# ORB Voice Engine — self-hosted XTTS cloning. CPU image (works anywhere).
# For GPU speed, swap the base for an NVIDIA CUDA + Python image and run on a GPU host.
FROM python:3.11-slim

ENV COQUI_TOS_AGREED=1 \
    PYTHONUNBUFFERED=1 \
    ORB_VOICES_DIR=/data/voices \
    ORB_OUT_DIR=/data/out

RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg libsndfile1 git && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
VOLUME ["/data"]
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
