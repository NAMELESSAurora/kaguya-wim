# The cold open's title card (PLAN-v2 §4: the Tsukuyomi card back turns over into the title on the drums' entry) — a holo card face in the
# same system as the singers' cards: pearl holo ground, the wordmark, "CPK! Remix", the version credit, a vertical seal, the rim.
#   ~/.local/matte/venv/bin/python -I tools/title_card.py   → materials/cards/TITLE_face.png, TITLE_fx.png, TITLE.json
import os, json, math, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = 1100; W = round(H * 0.716); R = round(H * 0.045); ins = round(H * 0.032); S = 2
fnt = lambda f, px: ImageFont.truetype(os.path.join(ROOT, 'fonts', f), px * S)
yy, xx = np.mgrid[0:H * S, 0:W * S].astype(np.float32) / S
# ground: pearl gradient lilac → pink → mint, with soft rays from the moon
u = xx / W * 0.55 + yy / H * 0.45
g = np.dstack([150 - 70 * u + 14 * np.sin(u * 6), 112 - 40 * u + 12 * np.sin(u * 4 + 1), 222 - 60 * u])      # (lilac → deep violet: the chrome and the moon read on it)
mx, my = W * 0.5, H * 0.33; ang = np.arctan2(yy - my, xx - mx); rays = (0.5 + 0.5 * np.cos(ang * 24)) * np.exp(-np.hypot(xx - mx, yy - my) / (W * 0.6))
g = g + rays[..., None] * np.array([18, 10, 6])
img = Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).convert('RGBA'); d = ImageDraw.Draw(img)
foil = Image.new('L', img.size, 0); df = ImageDraw.Draw(foil)
# the moon: a big pale disc with rings
cx, cy, r = W * 0.5 * S, H * 0.33 * S, 150 * S
for k in range(6): rr = r + (18 + k * 16) * S; d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=(255, 255, 255, 120 - k * 15), width=S * 2)
d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 250, 240, 255)); d.ellipse([cx - r + 40 * S, cy - r - 30 * S, cx + r + 40 * S, cy + r - 30 * S], fill=(226, 214, 250, 255))
df.ellipse([cx - r, cy - r, cx + r, cy + r], fill=200)
# the wordmark: chrome — a vertical metal gradient through the glyphs, a dark keyline, a white glint line
def chrome(text, y, px, font='DelaGothicOne-Regular.ttf', track=0):
    f = fnt(font, px); w = d.textlength(text, font=f) + track * S * (len(text) - 1); x0 = W * S / 2 - w / 2
    m = Image.new('L', img.size, 0); dm = ImageDraw.Draw(m); x = x0
    for ch in text: dm.text((x, y * S), ch, font=f, fill=255); x += d.textlength(ch, font=f) + track * S
    bb = m.getbbox(); hgt = bb[3] - bb[1]
    grad = np.zeros((H * S, W * S, 3), np.float32); t = np.clip((np.arange(H * S)[:, None] - bb[1]) / max(hgt, 1), 0, 1)
    band = np.where(t < 0.48, 255 - 90 * (t / 0.48), 120 + 120 * ((t - 0.48) / 0.52))
    grad[..., 0] = band * 0.98; grad[..., 1] = band * 0.94; grad[..., 2] = np.minimum(255, band * 1.06)
    key = m.filter(ImageFilter.MaxFilter(9 * S // 2 * 2 + 1)); img.paste((60, 30, 100, 255), (0, 0), key)
    img.paste(Image.fromarray(np.clip(grad, 0, 255).astype(np.uint8)).convert('RGBA'), (0, 0), m); foil.paste(255, (0, 0), m)
    gl = Image.new('L', img.size, 0); ImageDraw.Draw(gl).line([(0, bb[1] + hgt * 0.47), (W * S, bb[1] + hgt * 0.47)], fill=255, width=S * 2)
    img.paste((255, 255, 255, 255), (0, 0), Image.fromarray(np.minimum(np.asarray(gl), np.asarray(m))))
chrome('WORLD', 530, 118, track=2); chrome('IS MINE', 668, 104, track=2)
# "CPK! Remix" in hot pink, the version credit small
f2 = fnt('Unbounded[wght].ttf', 44); t2 = 'CPK! Remix'; w2 = d.textlength(t2, font=f2); d.text((W * S / 2 - w2 / 2, 806 * S), t2, font=f2, fill=(236, 60, 150, 255)); df.text((W * S / 2 - w2 / 2, 806 * S), t2, font=f2, fill=180)
f3 = fnt('HachiMaruPop-Regular.ttf', 26); t3 = 'かぐや & 月見ヤチヨ ver.'; w3 = d.textlength(t3, font=f3); d.text((W * S / 2 - w3 / 2, 874 * S), t3, font=f3, fill=(90, 60, 140, 255))
# the vertical seal 「超かぐや姫!」 (red stamp)
sx0, sy0, sw, sh = 600 * S, 120 * S, 74 * S, 330 * S
d.rounded_rectangle([sx0, sy0, sx0 + sw, sy0 + sh], radius=10 * S, fill=(214, 40, 70, 235)); df.rounded_rectangle([sx0, sy0, sx0 + sw, sy0 + sh], radius=10 * S, fill=160)
f4 = fnt('DelaGothicOne-Regular.ttf', 44)
for i, ch in enumerate('超かぐや姫'): d.text((sx0 + sw / 2, sy0 + 34 * S + i * 58 * S), ch, font=f4, fill=(255, 245, 235, 255), anchor='mm')
# rim + inner line (as the singers' cards)
rimM = Image.new('L', img.size, 0); dr = ImageDraw.Draw(rimM); dr.rounded_rectangle([0, 0, W * S - 1, H * S - 1], radius=R * S, fill=255)
dr.rounded_rectangle([ins * S, ins * S, (W - ins) * S - 1, (H - ins) * S - 1], radius=(R - ins // 2) * S, fill=0)
rg = np.linspace(1.15, 0.7, H * S)[:, None, None] * np.array([236, 196, 110], np.float32)[None, None, :] * np.ones((1, W * S, 1), np.float32)
img.paste(Image.fromarray(np.clip(rg, 0, 255).astype(np.uint8)).convert('RGBA'), (0, 0), rimM); foil.paste(255, (0, 0), rimM)
d.rounded_rectangle([ins * S, ins * S, (W - ins) * S, (H - ins) * S], radius=(R - ins // 2) * S, outline=(255, 250, 240, 255), width=S * 2)
mk = Image.new('L', img.size, 0); ImageDraw.Draw(mk).rounded_rectangle([0, 0, W * S - 1, H * S - 1], radius=R * S, fill=255); img.putalpha(mk)
face = img.resize((W, H), Image.LANCZOS); fo = np.asarray(foil.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255; m = np.asarray(mk.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
lum = np.asarray(face.convert('L')).astype(np.float32) / 255; ln = np.clip(np.hypot(cv2.Sobel(lum, cv2.CV_32F, 1, 0), cv2.Sobel(lum, cv2.CV_32F, 0, 1)) * 1.6, 0, 1) * 0.5
fx = np.dstack([(1 - fo) * 0.32, fo * 0.85, np.zeros_like(fo), ln]) * m[..., None]      # (a pale ground: little rainbow, or it washes out)
out = os.path.join(ROOT, 'materials/cards'); face.save(os.path.join(out, 'TITLE_face.png')); Image.fromarray((np.clip(fx, 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, 'TITLE_fx.png'))
json.dump({'w': W, 'h': H, 'style': 'radial', 'metal': 'gold', 'metalRGB': [236, 196, 110], 'spk': [[0.5, 0.67, 0.04, 0.5], [0.3, 0.52, 0.03, 1.7], [0.72, 0.4, 0.035, 3.1]]}, open(os.path.join(out, 'TITLE.json'), 'w'))
print('title', face.size)
