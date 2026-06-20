#!/usr/bin/env python3
"""Render ORB as a translucent glass sphere with a plasma vortex core on a tech pedestal."""
import math, numpy as np, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1920, 1080
CX, CY = W // 2, int(H * 0.44)
R = 360  # sphere radius

def font(p, s):
    try: return ImageFont.truetype(p, s)
    except Exception: return ImageFont.load_default()
F_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
F_SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
dx, dy = xx - CX, yy - CY
r = np.sqrt(dx*dx + dy*dy)
theta = np.arctan2(dy, dx)

# ── background: dark sci-fi room ──────────────────────────────────────────────
d = np.sqrt(((xx-CX)/(W*0.7))**2 + ((yy-CY)/(H*0.7))**2)
bg = np.zeros((H, W, 3), np.float32)
for i, c in enumerate((10, 16, 30)):
    bg[..., i] = c * (0.5 + 0.5*np.clip(1-d, 0, 1))
# cool bloom behind sphere
bloom = np.clip(1 - r/(R*1.7), 0, 1)**2
for i, c in enumerate((40, 80, 180)):
    bg[..., i] += c * 0.5 * bloom

img = Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8), "RGB").convert("RGBA")

# ── circuit floor (perspective) ───────────────────────────────────────────────
floor = Image.new("RGBA", (W, H), (0, 0, 0, 0))
fd = ImageDraw.Draw(floor)
horizon = CY + 70
for i in range(-14, 15):                       # converging traces
    x = CX + i * 130
    col = (60, 200, 255, 70) if i % 2 == 0 else (255, 150, 60, 55)
    fd.line([(x, H), (CX + i*22, horizon)], fill=col, width=2)
for k in range(1, 10):                          # depth rows
    yy2 = horizon + (H - horizon) * (k/10)**2.0
    a = int(70*(k/10))
    fd.line([(0, yy2), (W, yy2)], fill=(70, 150, 210, a), width=1)
rng = np.random.default_rng(3)
for _ in range(120):                            # circuit nodes
    fx = rng.uniform(0, W); fy = rng.uniform(horizon, H)
    s = rng.uniform(1, 3)
    fd.ellipse([fx-s, fy-s, fx+s, fy+s], fill=(90, 210, 255, int(rng.uniform(40,140))))
floor = floor.filter(ImageFilter.GaussianBlur(0.5))
img = Image.alpha_composite(img, floor)

# ── pedestal ──────────────────────────────────────────────────────────────────
ped = Image.new("RGBA", (W, H), (0, 0, 0, 0))
pd = ImageDraw.Draw(ped)
by = CY + R - 6
for (rw, rh, col) in [(250, 70, (30,40,55,255)), (250, 70, (210,160,80,255)),
                      (190, 52, (20,28,40,255)), (150, 40, (180,140,70,255))]:
    pd.ellipse([CX-rw, by-rh, CX+rw, by+rh], outline=col, width=6)
    by += 16
for a in range(0, 360, 15):                     # gold teeth
    x = CX + math.cos(math.radians(a))*150; y = (CY+R+18) + math.sin(math.radians(a))*40
    pd.ellipse([x-4, y-4, x+4, y+4], fill=(230,180,90,255))
img = Image.alpha_composite(img, ped)

# ── plasma vortex (numpy, additive) ──────────────────────────────────────────
rn = np.clip(r / R, 0, 4)
inside = r <= R
phase = 1.7
twist = 5.5
arms = 3
swirl = 0.5 + 0.5*np.sin(arms*theta + twist*np.log(r+8) - phase)
swirl2 = 0.5 + 0.5*np.sin(2*theta - 3.0*np.log(r+8) + 0.8)
fil = np.clip(swirl, 0, 1)**3 + 0.4*np.clip(swirl2, 0, 1)**3
inten = (0.45 + 1.20*fil) * np.clip(1 - rn, 0, 1)**0.85

# radial color ramp: orange core → purple → blue → cyan rim
stops = [(0.00,(255,235,180)),(0.10,(255,150,45)),(0.34,(150,70,220)),
         (0.62,(70,90,255)),(1.00,(60,160,255))]
ramp = np.zeros((H, W, 3), np.float32)
rc = np.clip(rn, 0, 1)
for (a0,c0),(a1,c1) in zip(stops[:-1], stops[1:]):
    m = (rc>=a0)&(rc<a1)
    t = (rc[m]-a0)/(a1-a0)
    for i in range(3):
        ramp[...,i][m] = c0[i]*(1-t)+c1[i]*t
core = np.exp(-(rn/0.17)**2)                    # blazing center
plasma = np.zeros((H, W, 3), np.float32)
for i in range(3):
    plasma[...,i] = ramp[...,i]*inten
plasma[...,0] += 320*core; plasma[...,1] += 250*core; plasma[...,2] += 150*core
plasma *= inside[..., None]
plasma_img = Image.fromarray(np.clip(plasma,0,255).astype(np.uint8),"RGB")
plasma_img = plasma_img.filter(ImageFilter.GaussianBlur(1.4))

# screen plasma onto bg
def screen(a_img, b_img):
    a = np.asarray(a_img.convert("RGB")).astype(np.float32)/255
    b = np.asarray(b_img.convert("RGB")).astype(np.float32)/255
    return Image.fromarray(((1-(1-a)*(1-b))*255).astype(np.uint8),"RGB").convert("RGBA")
img = screen(img, plasma_img)

# ── glass shell: rim + specular highlight ────────────────────────────────────
glass = Image.new("RGBA", (W, H), (0, 0, 0, 0))
rim = np.clip((rn-0.86)/0.14, 0, 1)**2 * inside
rim_img = np.zeros((H, W, 4), np.float32)
rim_img[...,0]=180; rim_img[...,1]=235; rim_img[...,2]=255; rim_img[...,3]=rim*200
img = Image.alpha_composite(img, Image.fromarray(np.clip(rim_img,0,255).astype(np.uint8),"RGBA"))
gd = ImageDraw.Draw(glass)
gd.ellipse([CX-R, CY-R, CX+R, CY+R], outline=(200,240,255,150), width=3)
hi = Image.new("RGBA",(W,H),(0,0,0,0)); hd=ImageDraw.Draw(hi)
hd.ellipse([CX-150, CY-250, CX+40, CY-90], fill=(255,255,255,90))
hi = hi.filter(ImageFilter.GaussianBlur(30))
img = Image.alpha_composite(img, hi)
img = Image.alpha_composite(img, glass)

# ── electric arcs (speaking = active) ────────────────────────────────────────
arc = Image.new("RGBA",(W,H),(0,0,0,0)); ad=ImageDraw.Draw(arc)
def bolt(a):
    pts=[(CX+math.cos(a)*R*0.94, CY+math.sin(a)*R*0.94)]; rr=R*0.94
    for _ in range(7):
        rr+=rng.uniform(28,70); a+=rng.uniform(-0.28,0.28)
        pts.append((CX+math.cos(a)*rr+rng.uniform(-12,12), CY+math.sin(a)*rr+rng.uniform(-12,12)))
    return pts
for a in [0.35,1.25,2.2,3.1,4.1,5.2]:
    p=bolt(a)
    ad.line(p, fill=(255,170,70,235), width=6)
    ad.line(p, fill=(255,245,220,255), width=2)
arc_glow=arc.filter(ImageFilter.GaussianBlur(7))
img=screen(img,arc_glow); img=Image.alpha_composite(img,arc)

# sparks
sp=Image.new("RGBA",(W,H),(0,0,0,0)); spd=ImageDraw.Draw(sp)
for _ in range(80):
    a=rng.uniform(0,2*math.pi); rr=rng.uniform(R*0.7,R*1.4)
    x=CX+math.cos(a)*rr; y=CY+math.sin(a)*rr; s=rng.uniform(1,3)
    spd.ellipse([x-s,y-s,x+s,y+s], fill=(255,200,120,int(rng.uniform(80,220))))
img=Image.alpha_composite(img, sp.filter(ImageFilter.GaussianBlur(0.6)))

# ── HUD text + speaking waveform ─────────────────────────────────────────────
dr = ImageDraw.Draw(img)
dr.text((W-470, 150), "AUDIBLE OUTPUT ACTIVE:", font=font(F_MONO,22), fill=(200,235,255,255))
dr.text((W-470, 182), '"DATA TRANSFER COMMENCING…"', font=font(F_MONO,18), fill=(150,205,235,230))
dr.text((W-470, 232), "CORE PULSE SYNC: PEAK", font=font(F_MONO,20), fill=(255,180,110,235))
dr.text((70, 60), "◢ ORB  ·  SPEAKING", font=font(F_MONO,22), fill=(120,220,255,255))
# waveform
wf_y=CY+R+150; n=120
for i in range(n):
    bx=CX-540+i*9
    amp=(math.sin(i*0.5)*0.5+0.5)*rng.uniform(0.3,1.0)
    bh=8+amp*70
    dr.line([(bx,wf_y-bh),(bx,wf_y+bh)], fill=(90,220,255,200), width=4)

out = "/home/user/EBE-ORB/apps/web/assets/orb-core.png"
os.makedirs(os.path.dirname(out), exist_ok=True)
img.convert("RGB").save(out, "PNG")
print("wrote", out)
