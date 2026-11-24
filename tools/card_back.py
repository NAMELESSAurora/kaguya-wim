# The holo cards' back (the user, 2026-11-24: "卡牌背面也要做精致卡背设计和处理，这样卡牌演出才够精美"): a Tsukuyomi back — pearl indigo
# ground, guilloche (engraved spirograph) linework, a starburst behind a crescent-moon emblem, the wordmark, corner ornaments, the
# metal rim of the fronts. Writes materials/cards/back.png and back_fx.png (R holo · G foil · B 0 · A line), lit by space.js mode 8.
#   ~/.local/matte/venv/bin/python -I tools/card_back.py
import os, math, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = 1100; W = round(H * 0.716); R = round(H * 0.045); ins = round(H * 0.032); S = 3        # (drawn at 3× for clean lines)
GOLD, LIL = (236, 206, 140), (214, 190, 255)
def F(px, w=600):
    try: return ImageFont.truetype(os.path.join(ROOT, 'fonts/Unbounded[wght].ttf'), px)
    except Exception: return ImageFont.load_default()

big = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0)); foil = Image.new('L', (W * S, H * S), 0)
d = ImageDraw.Draw(big); df = ImageDraw.Draw(foil); cx, cy = W * S / 2, H * S * 0.46
# ground: indigo → violet with a pearl sheen
yy, xx = np.mgrid[0:H * S, 0:W * S].astype(np.float32); u = (xx / (W * S) * 0.6 + yy / (H * S) * 0.4)
g = np.dstack([40 + 70 * u, 26 + 30 * u, 92 + 60 * u]) + 26 * np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * (W * S * 0.42) ** 2))[..., None] * np.array([1.0, 0.8, 1.2])
big.paste(Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).convert('RGBA'))
# guilloche: two hypotrochoid rosettes (engraved linework), and a fine field of them in the corners
def roset(cx0, cy0, Rr, r, dd, n, col, w, steps=2400, tag=True):
    pts = [(cx0 + (Rr - r) * math.cos(t) + dd * math.cos((Rr - r) / r * t), cy0 + (Rr - r) * math.sin(t) - dd * math.sin((Rr - r) / r * t)) for t in np.linspace(0, 2 * math.pi * n, steps)]
    d.line(pts, fill=col, width=w);
    if tag: df.line(pts, fill=200, width=w)
roset(cx, cy, 330 * S / 1.0, 47 * S, 120 * S, 47, GOLD + (120,), 1 * S)
roset(cx, cy, 250 * S, 31 * S, 90 * S, 31, LIL + (110,), 1 * S)
for k in range(9):                                                         # concentric rings of the emblem
    rr = (60 + k * 13) * S; d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=GOLD + (60 + 10 * (k % 2),), width=S); df.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=120, width=S)
# the starburst behind the emblem
for k in range(32):
    a = k / 32 * 2 * math.pi; r0, r1 = 70 * S, (175 if k % 2 == 0 else 130) * S
    d.line([(cx + math.cos(a) * r0, cy + math.sin(a) * r0), (cx + math.cos(a) * r1, cy + math.sin(a) * r1)], fill=GOLD + (150,), width=2 * S)
    df.line([(cx + math.cos(a) * r0, cy + math.sin(a) * r0), (cx + math.cos(a) * r1, cy + math.sin(a) * r1)], fill=255, width=2 * S)
# (everything above this line is the ground and the engraving; mode 10 animates those — a second canvas collects only what stays crisp)
base = Image.new('RGBA', big.size, (0, 0, 0, 0)); _d0 = d; d = ImageDraw.Draw(base); big_ref = big; big = base
# the emblem: a crescent moon and a four-point star, in foil
moon = Image.new('L', (W * S, H * S), 0); dm = ImageDraw.Draw(moon); mr = 58 * S
dm.ellipse([cx - mr, cy - mr, cx + mr, cy + mr], fill=255); dm.ellipse([cx - mr + 30 * S, cy - mr - 18 * S, cx + mr + 30 * S, cy + mr - 18 * S], fill=0)
big.paste(Image.new('RGBA', big.size, GOLD + (255,)), (0, 0), moon); foil.paste(255, (0, 0), moon)
sx, sy, sr = cx + 28 * S, cy - 10 * S, 26 * S
star = [(sx, sy - sr), (sx + sr * 0.22, sy - sr * 0.22), (sx + sr, sy), (sx + sr * 0.22, sy + sr * 0.22), (sx, sy + sr), (sx - sr * 0.22, sy + sr * 0.22), (sx - sr, sy), (sx - sr * 0.22, sy - sr * 0.22)]
d.polygon(star, fill=(255, 248, 230, 255)); df.polygon(star, fill=255)
for k in range(24):                                                        # a ring of dots round it
    a = k / 24 * 2 * math.pi; rr = 205 * S; x, y = cx + math.cos(a) * rr, cy + math.sin(a) * rr; q = (3 if k % 3 else 6) * S
    d.ellipse([x - q, y - q, x + q, y + q], fill=GOLD + (230,)); df.ellipse([x - q, y - q, x + q, y + q], fill=255)
# wordmark and small type
def text(s, y, px, col, tag=255, track=0):
    f = F(px * S); w = d.textlength(s, font=f) + track * S * (len(s) - 1); x = W * S / 2 - w / 2
    for ch in s: d.text((x, y * S), ch, font=f, fill=col); df.text((x, y * S), ch, font=f, fill=tag); x += d.textlength(ch, font=f) + track * S
text('TSUKUYOMI', H * 0.79, 40, (250, 240, 255, 255), track=8)
text('·  WORLD IS MINE  ·', H * 0.845, 16, GOLD + (255,), track=4)
text('2030 · LIVE CARD COLLECTION', H * 0.875, 12, LIL + (230,), 180, track=3)
text('No. 01 — 08', H * 0.11, 14, LIL + (220,), 180, track=6)
# corner ornaments
for (ax, ay, sxx, syy) in [(ins + 26, ins + 26, 1, 1), (W - ins - 26, ins + 26, -1, 1), (ins + 26, H - ins - 26, 1, -1), (W - ins - 26, H - ins - 26, -1, -1)]:
    X, Y = ax * S, ay * S
    d.line([(X, Y + syy * 60 * S), (X, Y), (X + sxx * 60 * S, Y)], fill=GOLD + (230,), width=2 * S); df.line([(X, Y + syy * 60 * S), (X, Y), (X + sxx * 60 * S, Y)], fill=255, width=2 * S)
    d.ellipse([X + sxx * 12 * S - 4 * S, Y + syy * 12 * S - 4 * S, X + sxx * 12 * S + 4 * S, Y + syy * 12 * S + 4 * S], fill=GOLD + (255,))
# inner frame line and the metal rim (as the fronts)
d.rounded_rectangle([ins * S, ins * S, (W - ins) * S, (H - ins) * S], radius=(R - ins // 2) * S, outline=(255, 250, 240, 255), width=2 * S)
rim = Image.new('L', big.size, 0); dr = ImageDraw.Draw(rim); dr.rounded_rectangle([0, 0, W * S - 1, H * S - 1], radius=R * S, fill=255)
dr.rounded_rectangle([ins * S, ins * S, (W - ins) * S - 1, (H - ins) * S - 1], radius=(R - ins // 2) * S, fill=0)
rg = (np.linspace(1.1, 0.72, H * S)[:, None, None] * np.array([214, 204, 236], np.float32)[None, None, :] * np.ones((1, W * S, 1), np.float32))
big.paste(Image.fromarray(np.clip(rg, 0, 255).astype(np.uint8)).convert('RGBA'), (0, 0), rim); foil.paste(255, (0, 0), rim)
# card shape
mkb = Image.new('L', big.size, 0); ImageDraw.Draw(mkb).rounded_rectangle([0, 0, W * S - 1, H * S - 1], radius=R * S, fill=255)
bb = np.asarray(base).copy(); bb[..., 3] = np.minimum(bb[..., 3], np.asarray(mkb)); Image.fromarray(bb).resize((W, H), Image.LANCZOS).save(os.path.join(ROOT, 'materials/cards/back_base.png'))
big = big_ref; big.alpha_composite(base); d = _d0
mk = Image.new('L', big.size, 0); ImageDraw.Draw(mk).rounded_rectangle([0, 0, W * S - 1, H * S - 1], radius=R * S, fill=255)
big.putalpha(mk)
face = big.resize((W, H), Image.LANCZOS); fo = np.asarray(foil.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
m = np.asarray(mk.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
lum = np.asarray(face.convert('L')).astype(np.float32) / 255; gx = cv2.Sobel(lum, cv2.CV_32F, 1, 0, ksize=3); gy = cv2.Sobel(lum, cv2.CV_32F, 0, 1, ksize=3)
fx = np.dstack([(1 - fo) * 0.85, fo, np.zeros_like(fo), np.clip(np.hypot(gx, gy) * 1.6, 0, 1) * 0.6]) * m[..., None]
out = os.path.join(ROOT, 'materials/cards'); face.save(os.path.join(out, 'back.png'))
Image.fromarray((np.clip(fx, 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, 'back_fx.png')); print('back', face.size)
