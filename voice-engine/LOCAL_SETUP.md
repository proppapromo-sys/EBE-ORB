# Run ORB's voice engine on your Alienware (NVIDIA GPU)

Your gaming PC's GPU runs the voice engine for free — no cloud GPU rental. There are **3 steps**:
run the engine, open a tunnel so ORB can reach it, and point ORB at it.

---

## Step 1 — Install the two tools (one time)
On the Alienware (Windows), install:
1. **Docker Desktop** → https://www.docker.com/products/docker-desktop/
   - During setup, keep **WSL 2** enabled (default). Docker uses your NVIDIA GPU through it.
2. **Cloudflare Tunnel** (gives your PC a public web address):
   - Open **PowerShell** and run: `winget install Cloudflare.cloudflared`

> Make sure your NVIDIA drivers are up to date (GeForce Experience → Drivers).

## Step 2 — Start the engine
In PowerShell, from the `voice-engine` folder:
```powershell
docker compose up -d --build
```
First run downloads the model (a few minutes). Check it's alive: open http://localhost:8000/health
— you should see `"device": "cuda"` (that means it's using your GPU 🎉).

## Step 3 — Open a public tunnel
Still in PowerShell:
```powershell
cloudflared tunnel --url http://localhost:8000
```
It prints a public URL like:
```
https://something-random.trycloudflare.com
```
**Copy that URL.**

## Step 4 — Point ORB at it
In **Render → ebe-orb → Environment**, add:
```
ORB_VOICE_ENGINE_URL = https://something-random.trycloudflare.com
```
Save. Done — now when you tell ORB "clone my voice," it uses **your Alienware's GPU**.

---

## Easiest: one click
Double-click **`START.bat`** in this folder — it builds, starts the engine, and opens the tunnel.
Copy the `https://…trycloudflare.com` URL it prints into Render as `ORB_VOICE_ENGINE_URL`.

## Honest notes
- The Alienware must be **on and running this** whenever you use the voice. Great for you/testing.
- For lots of paying customers, a cloud GPU (Runpod/Modal) is steadier — a home PC sleeps/loses internet.
- The free `trycloudflare.com` URL changes each restart. For a permanent address, set up a named
  Cloudflare tunnel (free) — ask and I'll add steps.
