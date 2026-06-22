#!/usr/bin/env python3
"""Render a square plasma-vortex sphere texture for the ORB core (apps/web/assets/orb-source.png).
Tuned to the reference: turbulent blue/magenta/purple swirl, blazing orange core, glass rim."""
import math, numpy as np, os
from PIL import Image, ImageDraw, ImageFilter

S = 1024
CX = CY = S // 2
R = int(S * 0.46)

yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
dx, dy = xx - CX, yy - CY
r = np.sqrt(dx*dx + dy*dy)
theta = np.arctan2(dy, dx)
rn = np.clip(r / R, 0, 4)
inside = r <= R

# ── turbulent multi-arm swirl ────────────────────────────────────────────────
twist = 5.6
s1 = 0.5 + 0.5*np.sin(3*theta + twist*np.log(r+8) - 1.6)
s2 = 0.5 + 0.5*np.sin(2*theta - 3.2*np.log(r+8) + 0.7)
s3 = 0.5 + 0.5*np.sin(5*theta + 2.0*np.log(r+8) + 2.4)
fil = np.clip(s1,0,1)**3 + 0.5*np.clip(s2,0,1)**3 + 0.25*np.clip(s3,0,1)**4
inten = (0.42 + 1.25*fil) * np.clip(1 - rn, 0, 1)**0.8

# ── radial colour ramp: orange core → magenta → purple → electric blue → cyan ─
stops = [(0.00,(255,238,190)),(0.10,(255,150,45)),(0.24,(230,70,170)),
         (0.42,(150,70,225)),(0.66,(70,90,255)),(1.00,(60,170,255))]
ramp = np.zeros((S, S, 3), np.float32)
rc = np.clip(rn, 0, 1)
for (a0,c0),(a1,c1) in zip(stops[:-1], stops[1:]):
    m = (rc>=a0)&(rc<a1); t=(rc[m]-a0)/(a1-a0)
    for i in range(3): ramp[...,i][m] = c0[i]*(1-t)+c1[i]*t

core = np.exp(-(rn/0.16)**2)
plasma = np.zeros((S, S, 3), np.float32)
for i in range(3): plasma[...,i] = ramp[...,i]*inten
plasma[...,0] += 340*core; plasma[...,1] += 255*core; plasma[...,2] += 150*core
plasma *= inside[..., None]
img = Image.fromarray(np.clip(plasma,0,255).astype(np.uint8),"RGB").filter(ImageFilter.GaussianBlur(1.2)).convert("RGBA")

# dark backing outside the sphere so cover-mapping stays clean
bg = Image.new("RGBA",(S,S),(6,10,20,255))
bg.alpha_composite(img)
img = bg

# ── orange lightning wrapping the core ───────────────────────────────────────
arc = Image.new("RGBA",(S,S),(0,0,0,0)); ad=ImageDraw.Draw(arc)
rng = np.random.default_rng(11)
def bolt(a, r0, r1):
    pts=[(CX+math.cos(a)*r0, CY+math.sin(a)*r0)]; rr=r0
    while rr < r1:
        rr += rng.uniform(18,40); a += rng.uniform(-0.3,0.3)
        pts.append((CX+math.cos(a)*rr+rng.uniform(-9,9), CY+math.sin(a)*rr+rng.uniform(-9,9)))
    return pts
for a in np.linspace(0, 2*math.pi, 7, endpoint=False):
    p = bolt(a + rng.uniform(-.2,.2), R*0.35, R*0.97)
    ad.line(p, fill=(255,170,70,235), width=5)
    ad.line(p, fill=(255,245,220,255), width=2)
img = Image.alpha_composite(img, arc.filter(ImageFilter.GaussianBlur(4)))
img = Image.alpha_composite(img, arc)

# ── glass rim + top specular highlight ───────────────────────────────────────
rim = (np.clip((rn-0.85)/0.15,0,1)**2 * inside)
rimimg = np.zeros((S,S,4),np.float32)
rimimg[...,0]=190; rimimg[...,1]=240; rimimg[...,2]=255; rimimg[...,3]=rim*210
img = Image.alpha_composite(img, Image.fromarray(np.clip(rimimg,0,255).astype(np.uint8),"RGBA"))
hi = Image.new("RGBA",(S,S),(0,0,0,0)); ImageDraw.Draw(hi).ellipse(
    [CX-R*0.5,CY-R*0.62,CX+R*0.05,CY-R*0.18], fill=(255,255,255,90))
img = Image.alpha_composite(img, hi.filter(ImageFilter.GaussianBlur(26)))
ImageDraw.Draw(img).ellipse([CX-R,CY-R,CX+R,CY+R], outline=(205,242,255,160), width=3)

out = "/home/user/EBE-ORB/apps/web/assets/orb-source.png"
os.makedirs(os.path.dirname(out), exist_ok=True)
img.convert("RGB").save(out, "PNG")
print("wrote", out, img.size)
