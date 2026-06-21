#!/usr/bin/env python3
"""Render a sample of the EBE ORB web interface, using the owner's orb image as the core."""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1600, 900
def F(p, s):
    try: return ImageFont.truetype(p, s)
    except Exception: return ImageFont.load_default()
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
CYAN=(90,220,255); ICE=(189,243,255); GOLD=(255,200,120); HUD=(159,208,230)

# background
import numpy as np
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
cx,cy=W*0.42,H*0.46
d=np.sqrt(((xx-cx)/(W*0.7))**2+((yy-cy)/(H*0.7))**2)
bg=np.zeros((H,W,3),np.float32)
for i,c in enumerate((12,28,50)): bg[...,i]=c*(0.4+0.6*np.clip(1-d,0,1))
img=Image.fromarray(np.clip(bg,0,255).astype(np.uint8),"RGB").convert("RGBA")

# orb (owner's image), circular mask, centered-left
src=None
for cand in ("apps/web/assets/orb-source.png","apps/web/assets/orb-reference.png"):
    if os.path.exists(cand): src=Image.open(cand).convert("RGB"); break
D=540
if src:
    s=min(src.size); src=src.crop(((src.width-s)//2,(src.height-s)//2,(src.width+s)//2,(src.height+s)//2)).resize((D,D))
else:
    src=Image.new("RGB",(D,D),(20,40,80))
mask=Image.new("L",(D,D),0); ImageDraw.Draw(mask).ellipse([0,0,D,D],fill=255)
ox,oy=int(cx-D/2),int(cy-D/2)
# glow
glow=Image.new("RGBA",(W,H),(0,0,0,0)); ImageDraw.Draw(glow).ellipse([ox-40,oy-40,ox+D+40,oy+D+40],fill=(60,150,230,120))
img=Image.alpha_composite(img,glow.filter(ImageFilter.GaussianBlur(40)))
img.paste(src,(ox,oy),mask)
ImageDraw.Draw(img).ellipse([ox,oy,ox+D,oy+D],outline=(200,240,255,180),width=3)

dr=ImageDraw.Draw(img)
def spaced(s,n=1): return (" "*n).join(list(s))
def text(x,y,s,f,c,ls=0):
    if ls: s=spaced(s,ls)
    dr.text((x,y),s,font=f,fill=c)
def ctext(cxp,y,s,f,c,ls=0):
    if ls: s=spaced(s,ls)
    w=dr.textbbox((0,0),s,font=f)[2]; dr.text((cxp-w/2,y),s,font=f,fill=c)

# top-left HUD
text(40,40,"◢ ORB MASTER SYSTEM",F(MONO,18),(*CYAN,255),ls=1)
for i,s in enumerate(["STATE......... SPEAKING","RISK GATE..... ARMED (code)",
                      "CONFIRM-FIRST. ENABLED","CORE PULSE.... PEAK"]):
    text(40,74+i*24,s,F(MONO,14),(*HUD,230))

# council top-right
cl=["COUNCIL","> GPT-EXECUTIVE","> GPT-OPERATIONS","> GPT-RISK","> CLAUDE-EVALUATOR","> GEMINI-VISUAL","> ORB-FINALIZER"]
for i,s in enumerate(cl):
    f=F(MONO,18 if i==0 else 14); col=(*CYAN,255) if i==0 else (*HUD,220)
    w=dr.textbbox((0,0),s,font=f)[2]; dr.text((980-w,40+i*26),s,font=f,fill=col)  # right-align near panel

# five laws bottom-left
laws=["THE FIVE LAWS","1 risk-first","2 edge vs the world","3 forward-validate","4 recognise + remember","5 confirm-first, never chase"]
for i,s in enumerate(laws):
    f=F(MONO,18 if i==0 else 14); col=(*GOLD,220) if i==0 else (*HUD,200)
    text(40,H-250+i*30,s,f,col)

# speaking banner
ctext(cx,40,"▮ AUDIBLE OUTPUT ACTIVE  ·  CORE PULSE SYNC: PEAK ▮",F(MONO,15),(*GOLD,235),ls=1)

# command bar
bx0,bx1,by=int(cx-330),int(cx+330),H-70
dr.rounded_rectangle([bx0,by,bx1,by+44],radius=22,fill=(10,28,46,200),outline=(*CYAN,110),width=1)
dr.text((bx0+18,by+13),"Ask EBE  —  what needs my attention today?",font=F(MONO,15),fill=(120,170,200,255))
for i,lbl in enumerate(["IMG","EAR","MIC"]):
    rx=bx1-250+i*64
    dr.rounded_rectangle([rx,by+7,rx+56,by+37],radius=14,outline=(*CYAN,150),width=1)
    ctext(rx+28,by+13,lbl,F(MONO,12),(*ICE,230))
dr.rounded_rectangle([bx1-58,by+7,bx1-2,by+37],radius=14,fill=(90,220,255,40),outline=(*CYAN,180),width=1)
ctext(bx1-30,by+13,"GO",F(MONO,12),(*ICE,255))

# right APPROVALS panel
px=W-330
dr.rectangle([px,0,W,H],fill=(7,16,28,235)); dr.line([px,0,px,H],fill=(*CYAN,90),width=1)
text(px+20,24,"◢ ORB CONTROL",F(MONO,16),(*CYAN,255),ls=1)
for i,(t,sel) in enumerate([("APPROVALS",True),("BRIEFING",False),("ACTIVITY",False)]):
    tx=px+20+i*98
    dr.rounded_rectangle([tx,58,tx+90,86],radius=8,fill=(90,220,255,40) if sel else (0,0,0,0),outline=(*CYAN,90),width=1)
    ctext(tx+45,64,t,F(MONO,11),(*ICE,255) if sel else (*HUD,200))
cards=[("Best-seller stocks out in 6 days","HIGH","approve","amazon_seller"),
       ("Vendor invoice due in 2 days","MEDIUM","approve","gmail"),
       ("Nightly venue summary ready","LOW","auto","ebe_venue_os")]
cyp=104
for title,risk,st,conn in cards:
    dr.rounded_rectangle([px+16,cyp,W-16,cyp+118],radius=10,fill=(10,24,40,200),outline=(*CYAN,60),width=1)
    # wrap title
    words=title.split(); line=""; ty=cyp+12
    for wd in words:
        if dr.textbbox((0,0),line+" "+wd,font=F(SANS,15))[2]>W-px-50:
            dr.text((px+28,ty),line.strip(),font=F(SANS,15),fill=(*ICE,255)); ty+=22; line=wd
        else: line+=" "+wd
    dr.text((px+28,ty),line.strip(),font=F(SANS,15),fill=(*ICE,255))
    rc={"HIGH":(255,150,150),"MEDIUM":GOLD,"LOW":CYAN}[risk]
    dr.rounded_rectangle([px+28,cyp+62,px+92,cyp+82],radius=5,outline=(*rc,200),width=1); ctext(px+60,cyp+65,risk,F(MONO,11),(*rc,230))
    sc=(127,230,161) if st=="auto" else GOLD
    dr.rounded_rectangle([px+100,cyp+62,px+168,cyp+82],radius=5,outline=(*sc,200),width=1); ctext(px+134,cyp+65,st,F(MONO,11),(*sc,230))
    if st=="approve":
        dr.rounded_rectangle([px+28,cyp+90,px+150,cyp+112],radius=7,fill=(127,230,161,30),outline=(127,230,161,150),width=1); ctext(px+89,cyp+94,"APPROVE",F(MONO,11),(*ICE,255))
        dr.rounded_rectangle([px+158,cyp+90,W-28,cyp+112],radius=7,fill=(255,120,120,25),outline=(255,120,120,150),width=1); ctext((px+158+W-28)//2,cyp+94,"REJECT",F(MONO,11),(255,180,180,255))
    else:
        dr.rounded_rectangle([px+28,cyp+90,W-28,cyp+112],radius=7,fill=(90,220,255,30),outline=(*CYAN,150),width=1); ctext((px+28+W-28)//2,cyp+94,"EXECUTE (dry-run)",F(MONO,11),(*ICE,255))
    cyp+=132

out="/home/user/EBE-ORB/apps/web/assets/interface-sample.png"
img.convert("RGB").save(out)
print("wrote",out)
