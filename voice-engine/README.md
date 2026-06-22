# ORB Voice Engine — your own voice cloning

This is **ORB's own voice engine**: an open-source cloning model (Coqui **XTTS v2**) that *you*
run. No ElevenLabs, no third party, no per-use fees. Clone a voice from ~15–30 seconds of audio,
then ORB speaks every answer in that voice.

## What it does
- `POST /clone` — upload an audio sample → returns a `voice_id` (your cloned voice)
- `POST /speak` — `{ text, voice_id }` → returns spoken `audio/wav` in that voice
- `GET /health` — status + device (cuda/cpu)

## Run it

### Locally (test)
```bash
cd voice-engine
docker build -t orb-voice-engine .
docker run -p 8000:8000 -v $(pwd)/data:/data orb-voice-engine
# health: http://localhost:8000/health
```

### In production (recommended: a GPU host)
XTTS is comfortable on CPU but fast on GPU. Good hosts: **Runpod**, **Modal**, **Lambda**,
**Fly.io GPU**, or a Hugging Face Space. Deploy this folder, expose port `8000`, and mount a
persistent volume at `/data` so cloned voices survive restarts.

> Render's Starter plan has no GPU — keep ORB's API on Render and run this engine on a GPU host.

## Connect it to ORB
Set one env var on ORB (Render → Environment):
```
ORB_VOICE_ENGINE_URL = https://your-engine-host
```
That's it. ORB automatically prefers your own engine over ElevenLabs: the in-app **🎤 Record &
Clone** button uploads to `/clone`, and every spoken answer routes through `/speak`. If the engine
is ever unreachable, ORB falls back to the browser voice — it never breaks.

## Notes
- First start downloads the open weights (a few minutes).
- Only clone **your own voice or one you have permission to use.**
- Swap the model in `app.py` (e.g. OpenVoice, Fish Speech) without changing ORB — the contract is
  just `/clone` + `/speak`.
