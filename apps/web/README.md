# ORB Web — the face

A self-contained, zero-build holographic UI for ORB: a translucent reactor-core hologram
("next-gen JARVIS") with HUD rings, the live Multi-Model Council roster, and the five laws.

- **`index.html`** — open it directly in a browser. Pure HTML/CSS/Canvas, no dependencies.
- **`assets/orb-preview.png`** — a rendered still of the concept.

## Going live

The page degrades to a static demo until you point it at the backend:

```html
<script>window.ORB_API = "http://localhost:8080";</script>
```

Once set, it calls:
- `POST /api/orb/cycle` to show how many actions are surfaced + journal state, and
- `POST /api/orb/ask` (the command bar → **CONVENE**) to run the council and show the
  ORB-Finalizer answer with an "N NEED APPROVAL" badge straight from the code-level gate.

## Regenerate the preview still

```bash
pip install pillow numpy
python tools/render_orb_preview.py   # writes apps/web/assets/orb-preview.png
```

## Tuning the look
Open `index.html` and adjust the CSS variables at the top:
`--cyan / --ice / --teal / --gold` (palette), the `.core` gradient (how glassy/translucent),
and the `.arc*` animation durations (motion). `--gold` is the warm arc-reactor accent.
