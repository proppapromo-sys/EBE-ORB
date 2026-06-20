# ORB Web — the face (voice-reactive)

A self-contained, zero-build holographic UI for ORB: a translucent glass sphere on a tech
pedestal over a circuit floor, that **activates when speaking** — the core spins up, electric
arcs fire, the outer bloom swells, and a waveform pulses while ORB talks, then settles when idle.

Open **`index.html`** directly in a browser. Pure HTML/Canvas + the Web Speech API, no deps.

## Use YOUR exact image as the core
The orb renders from an image you provide (with a procedural plasma vortex as fallback):

- **Drag-and-drop** your image anywhere on the page, or click **📷** to pick it. It's saved in
  the browser (localStorage) and becomes the orb instantly — masked into the glass sphere, gently
  spinning, spinning faster + glowing harder while speaking.
- To ship a **default** image for everyone, drop the file in as **`assets/orb-source.png`** and
  commit it; the page auto-loads it when no dropped image is set.

## Speaking / voice
- ORB speaks its answers via the browser speech engine; while speaking, `STATE → SPEAKING`,
  arcs fire, and the waveform reacts. **Click the orb** to hear a test line.
- **🎤** enables real audio reactivity (mic): the energy and waveform follow live sound.

## Going live
The command bar (**CONVENE**) posts to the API when configured:

```html
<script>window.ORB_API = "http://localhost:8080";</script>
```
It calls `POST /api/orb/ask` (the full Multi-Model Council), shows the ORB-Finalizer answer with
an **"N NEED APPROVAL"** badge straight from the code-level gate, and speaks it aloud. Without an
API it runs as a spoken demo.

## Concept stills (procedural renders)
```bash
pip install pillow numpy
python tools/render_orb_core.py      # vortex glass orb  → assets/orb-core.png
python tools/render_orb_preview.py   # HUD ring orb      → assets/orb-preview.png
```
