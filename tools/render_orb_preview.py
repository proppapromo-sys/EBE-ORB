#!/usr/bin/env python3
"""Render a translucent, holographic 'next-gen JARVIS' preview of the ORB."""
import math, numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1920, 1080
CX, CY = W // 2, int(H * 0.46)

# ── palette (cyan/teal hologram on deep space navy) ──────────────────────────
CYAN   = (90, 220, 255)
ICE    = (180, 245, 255)
TEAL   = (40, 150, 200)
GOLD   = (255, 200, 120)   # subtle arc-reactor warm accent
DEEP   = (6, 12, 22)

def font(path, size):
    try: return ImageFont.truetype(path, size)
    except Exception: return ImageFont.load_default()

F_THIN = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
F_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

# ── background: vignette + cyan bloom behind the orb ─────────────────────────
yy, xx = np.mgrid[0:H, 0:W]
d = np.sqrt(((xx - CX) / (W * 0.62)) ** 2 + ((yy - CY) / (H * 0.62)) ** 2)
vig = np.clip(1 - d, 0, 1) ** 1.6
bg = np.zeros((H, W, 3), np.float32)
for i, c in enumerate(DEEP):
    bg[..., i] = c * (0.35 + 0.65 * vig)
# cyan bloom
br = np.sqrt(((xx - CX) / 520) ** 2 + ((yy - CY) / 520) ** 2)
bloom = np.clip(1 - br, 0, 1) ** 2.2
for i, c in enumerate(TEAL):
    bg[..., i] += c * 0.55 * bloom
base = Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8), "RGB").convert("RGBA")

# faint hex/dot grid
grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(grid)
for gx in range(0, W, 46):
    for gy in range(0, H, 46):
        gd.ellipse([gx - 1, gy - 1, gx + 1, gy + 1], fill=(90, 160, 200, 18))
base = Image.alpha_composite(base, grid)

# ── glow layer (drawn bright, blurred, screened back on) ─────────────────────
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
g = ImageDraw.Draw(glow)

def arc(draw, cx, cy, r, a0, a1, col, w):
    draw.arc([cx - r, cy - r, cx + r, cy + r], a0, a1, fill=col, width=w)

def ring(draw, cx, cy, r, col, w):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=col, width=w)

# concentric HUD rings + segmented arcs
ring(g, CX, CY, 360, (*CYAN, 90), 2)
for a in range(0, 360, 30):
    arc(g, CX, CY, 360, a + 4, a + 24, (*ICE, 150), 4)
ring(g, CX, CY, 300, (*TEAL, 120), 1)
for a in range(0, 360, 12):
    x0 = CX + math.cos(math.radians(a)) * 286; y0 = CY + math.sin(math.radians(a)) * 286
    x1 = CX + math.cos(math.radians(a)) * 300; y1 = CY + math.sin(math.radians(a)) * 300
    g.line([x0, y0, x1, y1], fill=(*CYAN, 120), width=2)
arc(g, CX, CY, 250, 200, 340, (*CYAN, 170), 3)
arc(g, CX, CY, 250, 20, 120, (*CYAN, 120), 3)
arc(g, CX, CY, 215, -40, 70, (*GOLD, 110), 2)
ring(g, CX, CY, 175, (*ICE, 130), 1)

# orbiting nodes
for a, r in [(35, 360), (210, 360), (95, 300), (305, 250), (150, 215)]:
    x = CX + math.cos(math.radians(a)) * r; y = CY + math.sin(math.radians(a)) * r
    g.ellipse([x - 5, y - 5, x + 5, y + 5], fill=(*ICE, 230))

# floating data particles
rng = np.random.default_rng(7)
for _ in range(120):
    ang = rng.uniform(0, 2 * math.pi); rr = rng.uniform(120, 470)
    x = CX + math.cos(ang) * rr; y = CY + math.sin(ang) * rr * 0.92
    s = rng.uniform(0.6, 2.4); a = int(rng.uniform(40, 170))
    g.ellipse([x - s, y - s, x + s, y + s], fill=(*CYAN, a))

glow_blur = glow.filter(ImageFilter.GaussianBlur(6))

# ── translucent core sphere (radial gradient, glassy) ────────────────────────
R = 150
sph = np.zeros((H, W, 4), np.float32)
sr = np.sqrt((xx - CX) ** 2 + (yy - CY) ** 2)
mask = sr <= R
t = np.clip(sr / R, 0, 1)
# inner bright -> rim
inten = (1 - t) ** 1.5
for i, c in enumerate(ICE):
    sph[..., i] = c
sph[..., 3] = 0
# translucent body
body = np.clip(0.16 + 0.55 * inten, 0, 1)
sph[..., 3][mask] = (body[mask] * 235)
for i in range(3):
    sph[..., i][mask] = (TEAL[i] * (1 - inten[mask]) + ICE[i] * inten[mask])
# rim light (fresnel)
rim = np.clip((t - 0.82) / 0.18, 0, 1) ** 2
sph[..., 3][mask] = np.clip(sph[..., 3][mask] + rim[mask] * 180, 0, 255)
sphere = Image.fromarray(np.clip(sph, 0, 255).astype(np.uint8), "RGBA")
sphere = sphere.filter(ImageFilter.GaussianBlur(0.6))

# core highlight (offset specular)
hi = Image.new("RGBA", (W, H), (0, 0, 0, 0))
hd = ImageDraw.Draw(hi)
hd.ellipse([CX - 55, CY - 70, CX + 5, CY - 20], fill=(255, 255, 255, 120))
hi = hi.filter(ImageFilter.GaussianBlur(18))

# bright pulsing center
cen = Image.new("RGBA", (W, H), (0, 0, 0, 0))
cd = ImageDraw.Draw(cen)
cd.ellipse([CX - 34, CY - 34, CX + 34, CY + 34], fill=(*ICE, 255))
cd.ellipse([CX - 16, CY - 16, CX + 16, CY + 16], fill=(255, 255, 255, 255))
cen_glow = cen.filter(ImageFilter.GaussianBlur(22))

# ── screen-composite glow onto base ──────────────────────────────────────────
def screen(a_img, b_img):
    a = np.asarray(a_img).astype(np.float32) / 255
    b = np.asarray(b_img).astype(np.float32) / 255
    out = 1 - (1 - a) * (1 - b)
    out[..., 3] = np.clip(a[..., 3] + b[..., 3], 0, 1)
    return Image.fromarray((out * 255).astype(np.uint8), "RGBA")

base = screen(base, glow_blur)
base = screen(base, cen_glow)
base = Image.alpha_composite(base, sphere)
base = Image.alpha_composite(base, hi)
base = screen(base, cen)
base = Image.alpha_composite(base, glow)   # crisp ring detail on top

# ── HUD text ─────────────────────────────────────────────────────────────────
draw = ImageDraw.Draw(base)

def spaced(s, n=1): return (" " * n).join(list(s))

def ctext(cx, y, s, fnt, fill, ls=0):
    if ls: s = spaced(s, ls)
    w = draw.textbbox((0, 0), s, font=fnt)[2]
    draw.text((cx - w / 2, y), s, font=fnt, fill=fill)

ctext(CX, CY + 235, "O R B", font(F_THIN, 86), (*ICE, 255))
ctext(CX, CY + 340, "DIGITAL CHIEF OF STAFF", font(F_MONO, 24), (*CYAN, 220), ls=2)
ctext(CX, CY + 378, "UNIVERSAL GENOME  ·  MULTI-MODEL COUNCIL", font(F_MONO, 16), (130, 190, 220, 200), ls=1)

# corner HUD readouts (the council + the five laws, JARVIS style)
mono = font(F_MONO, 17); monos = font(F_MONO, 14)
draw.text((70, 60), "◢ ORB MASTER SYSTEM", font=mono, fill=(*CYAN, 230))
for i, s in enumerate([
    "STATUS........ ONLINE",
    "RISK GATE..... ARMED (code)",
    "CONFIRM-FIRST. ENABLED",
    "JOURNAL....... LEARNING",
]):
    draw.text((70, 96 + i * 26), s, font=monos, fill=(150, 205, 230, 200))

right = ["COUNCIL", "› GPT-EXECUTIVE", "› GPT-OPERATIONS", "› GPT-RISK",
         "› CLAUDE-EVALUATOR", "› GEMINI-VISUAL", "› ORB-FINALIZER"]
for i, s in enumerate(right):
    f = mono if i == 0 else monos
    col = (*CYAN, 230) if i == 0 else (150, 205, 230, 205)
    w = draw.textbbox((0, 0), s, font=f)[2]
    draw.text((W - 90 - w, 96 + i * 28), s, font=f, fill=col)

laws = ["THE FIVE LAWS", "1 risk-first", "2 edge vs the world",
        "3 forward-validate", "4 recognise + remember", "5 confirm-first, never chase"]
for i, s in enumerate(laws):
    f = mono if i == 0 else monos
    col = (*GOLD, 210) if i == 0 else (150, 205, 230, 190)
    draw.text((70, H - 230 + i * 30), s, font=f, fill=col)

# subtle scanlines
scan = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(scan)
for y in range(0, H, 3):
    sd.line([0, y, W, y], fill=(0, 0, 0, 16))
base = Image.alpha_composite(base, scan)

out = "/home/user/EBE-ORB/apps/web/assets/orb-preview.png"
import os; os.makedirs(os.path.dirname(out), exist_ok=True)
base.convert("RGB").save(out, "PNG")
print("wrote", out)
