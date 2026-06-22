"""
ORB Voice Engine — ORB's OWN voice cloning, self-hosted. No third party, no per-use fees.

Built on Coqui XTTS v2 (open weights): it clones a voice zero-shot from a short reference clip,
then speaks any text in that voice. ORB's API talks to this over HTTP.

Endpoints:
  GET  /health
  POST /clone  (multipart: file=<audio>, name=<label>)        -> {"voice_id": "..."}
  POST /speak  (json: {"text", "voice_id", "language"})        -> audio/wav

Point ORB at it:  ORB_VOICE_ENGINE_URL = https://your-engine-host
Run on a GPU host for snappy speech (CPU works, just slower). Mount a volume at /data so cloned
voices survive restarts.
"""
import os
import glob
import uuid

import torch
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from TTS.api import TTS

os.environ.setdefault("COQUI_TOS_AGREED", "1")  # accept the model license non-interactively

VOICES_DIR = os.environ.get("ORB_VOICES_DIR", "/data/voices")
OUT_DIR = os.environ.get("ORB_OUT_DIR", "/data/out")
os.makedirs(VOICES_DIR, exist_ok=True)
os.makedirs(OUT_DIR, exist_ok=True)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
# Loaded once at startup (downloads the open weights on first run).
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(DEVICE)

app = FastAPI(title="ORB Voice Engine")


def _voice_path(voice_id: str):
    hits = sorted(glob.glob(os.path.join(VOICES_DIR, voice_id + ".*")))
    return hits[0] if hits else None


@app.get("/health")
def health():
    return {"ok": True, "device": DEVICE, "voices": len(glob.glob(os.path.join(VOICES_DIR, "*")))}


@app.post("/clone")
async def clone(file: UploadFile = File(...), name: str = Form("ORB Voice")):
    data = await file.read()
    if not data:
        raise HTTPException(400, "empty audio")
    ext = (os.path.splitext(file.filename or "")[1] or ".wav").lstrip(".").lower() or "wav"
    voice_id = uuid.uuid4().hex[:12]
    with open(os.path.join(VOICES_DIR, f"{voice_id}.{ext}"), "wb") as f:
        f.write(data)
    return {"voice_id": voice_id, "name": name}


class SpeakReq(BaseModel):
    text: str
    voice_id: str = "default"
    language: str = "en"


@app.post("/speak")
def speak(req: SpeakReq):
    ref = _voice_path(req.voice_id)
    if not ref:
        raise HTTPException(404, f"voice '{req.voice_id}' not found — clone one first")
    out = os.path.join(OUT_DIR, f"{uuid.uuid4().hex[:12]}.wav")
    tts.tts_to_file(text=(req.text or "")[:5000], speaker_wav=ref, language=req.language, file_path=out)
    return FileResponse(out, media_type="audio/wav", filename="speech.wav")
