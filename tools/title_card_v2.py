# The title card's face, v2 (the user, 2026-11-24: "“world is mine”的卡面有些粗糙了，可以设计的精美华丽一些"): the image model paints the
# ground (materials/nai/title_2.png: a full moon inside a golden astrolabe, pink ribbons, sakura, a baroque gold frame — NovelAI, 0 Anlas);
# code sets the type on it: a pearl-chrome WORLD / IS MINE inside a gold outline with a dark keyline, a glint line and sparkles; a pink
# satin ribbon for CPK! Remix; the credit on a gold-ruled plate; a cinnabar seal; a TITLE badge. fx: R holo on the night · G foil on
# the gold (the frame, the astrolabe, the outlines) · A line. (v1 = tools/title_card_v1.py)
#   ~/.local/matte/venv/bin/python -I tools/title_card.py   → materials/cards/TITLE_face.png, TITLE_fx.png, TITLE.json
import os, json, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = 1100; W = round(H * 0.716); R = round(H * 0.045); S = 2; HS, WS = H * S, W * S
fnt = lambda f, px: ImageFont.truetype(os.path.join(ROOT, 'fonts', f), int(px * S))
src = Image.open(os.path.join(ROOT, 'materials/nai/title_2.png')).convert('RGB')
img = src.crop((28, 30, 804, 1178)).resize((WS, HS), Image.LANCZOS).convert('RGBA')      # (inside the frame's outer line; ~5 % stretch to the card's shape)
art = np.asarray(img).astype(np.float32)[..., :3] / 255
# the lower half calms down (a violet veil) so the wordmark reads
yy = np.linspace(0, 1, HS)[:, None]; veil = np.clip((yy - 0.52) / 0.3, 0, 1) * 0.42
base = art * (1 - veil[..., None]) + np.array([0.16, 0.06, 0.26]) * veil[..., None]
img = Image.fromarray((np.clip(base, 0, 1) * 255).astype(np.uint8)).convert('RGBA'); d = ImageDraw.Draw(img)
gold_art = ((art[..., 0] > 0.6) & (art[..., 1] > 0.42) & (art[..., 2] < 0.5) & (art[..., 0] - art[..., 2] > 0.25)).astype(np.float32)
foil = Image.fromarray((gold_art * 230).astype(np.uint8)); df = ImageDraw.Draw(foil)
def vgrad(y0, y1, stops):                                             # a vertical gradient image between rows y0 and y1
    t = np.clip((np.arange(HS)[:, None] - y0) / max(1, y1 - y0), 0, 1); out = np.zeros((HS, 1, 3), np.float32)
    for (a, ca), (b, cb) in zip(stops[:-1], stops[1:]):
        k = np.clip((t - a) / (b - a), 0, 1); m = (t >= a) & (t <= b); out = np.where(m[..., None], np.array(ca) + (np.array(cb) - np.array(ca)) * k[..., None], out)
    return Image.fromarray(np.clip(np.repeat(out, WS, 1), 0, 255).astype(np.uint8)).convert('RGBA')
def mask_text(text, y, px, font='DelaGothicOne-Regular.ttf', track=0):
    f = fnt(font, px); m = Image.new('L', (WS, HS), 0); dm = ImageDraw.Draw(m)
    w = sum(dm.textlength(ch, font=f) for ch in text) + track * S * (len(text) - 1); x = WS / 2 - w / 2
    for ch in text: dm.text((x, y * S), ch, font=f, fill=255); x += dm.textlength(ch, font=f) + track * S
    return m
def dil(m, r): return m.filter(ImageFilter.MaxFilter(int(r * S) // 2 * 2 + 1))
def wordmark(text, y, px, track):
    m = mask_text(text, y, px, track=track); bb = m.getbbox(); y0, y1 = bb[1], bb[3]
    sh = dil(m, 14).filter(ImageFilter.GaussianBlur(10 * S)); img.alpha_composite(Image.composite(Image.new('RGBA', (WS, HS), (30, 6, 54, 230)), Image.new('RGBA', (WS, HS), (0, 0, 0, 0)), sh.point(lambda v: int(v * 0.85))), (0, 6 * S))
    key = dil(m, 15); img.paste((44, 16, 80, 255), (0, 0), key)                                                       # dark keyline
    out = dil(m, 11); img.paste(vgrad(y0 - 8 * S, y1 + 8 * S, [(0, (255, 244, 196)), (0.45, (240, 196, 104)), (0.55, (176, 118, 44)), (1, (250, 214, 132))]), (0, 0), out)   # gold outline
    img.paste((255, 250, 236, 255), (0, 0), Image.fromarray(np.minimum(np.asarray(dil(m, 3)), 255 - np.asarray(m)).astype(np.uint8)).point(lambda v: int(v * 0.6)))   # a pale inner edge
    img.paste(vgrad(y0, y1, [(0, (255, 255, 255)), (0.3, (236, 214, 255)), (0.47, (255, 176, 222)), (0.5, (120, 70, 170)), (0.56, (190, 236, 255)), (1, (255, 255, 255))]), (0, 0), m)   # pearl chrome
    gl = Image.new('L', (WS, HS), 0); ImageDraw.Draw(gl).rectangle([0, y0 + (y1 - y0) * 0.47, WS, y0 + (y1 - y0) * 0.47 + 2 * S], fill=255)
    img.paste((255, 255, 255, 255), (0, 0), Image.fromarray(np.minimum(np.asarray(gl), np.asarray(m))))
    foil.paste(255, (0, 0), out); return bb
def star(cx, cy, r, col=(255, 252, 240, 255)):
    pts = [(cx, cy - r), (cx + r * 0.16, cy - r * 0.16), (cx + r, cy), (cx + r * 0.16, cy + r * 0.16), (cx, cy + r), (cx - r * 0.16, cy + r * 0.16), (cx - r, cy), (cx - r * 0.16, cy - r * 0.16)]
    d.polygon(pts, fill=col); df.polygon(pts, fill=255)
b1 = wordmark('WORLD', H * 0.565, 112, 4); b2 = wordmark('IS MINE', H * 0.675, 96, 4)
for (x, y, r) in [(b1[0] - 6 * S, b1[1] + 8 * S, 20), (b1[2] + 4 * S, b1[3] - 14 * S, 14), (b2[2] + 8 * S, b2[1] + 6 * S, 22), (b2[0] - 2 * S, b2[3] - 4 * S, 12)]: star(x, y, r * S)
# CPK! Remix on a satin ribbon with V-cut tails
ry, rh, rw = H * 0.80 * S, 64 * S, W * 0.6 * S; rx0 = WS / 2 - rw / 2
for side in (-1, 1):                                                    # the tails, behind
    xe = WS / 2 + side * (rw / 2 + 50 * S); xi = WS / 2 + side * (rw / 2 - 30 * S)
    d.polygon([(xi, ry + 14 * S), (xe, ry + 14 * S), (xe - side * 26 * S, ry + 14 * S + rh / 2), (xe, ry + 14 * S + rh), (xi, ry + 14 * S + rh)], fill=(170, 30, 100, 255))
rib = vgrad(ry, ry + rh, [(0, (255, 150, 206)), (0.4, (240, 70, 150)), (1, (176, 30, 104))]); rm = Image.new('L', (WS, HS), 0); ImageDraw.Draw(rm).rectangle([rx0, ry, rx0 + rw, ry + rh], fill=255)
img.paste(rib, (0, 0), rm); d.line([(rx0, ry + 5 * S), (rx0 + rw, ry + 5 * S)], fill=(255, 214, 236, 255), width=2 * S); d.line([(rx0, ry + rh - 6 * S), (rx0 + rw, ry + rh - 6 * S)], fill=(255, 214, 236, 200), width=1 * S)
f2 = fnt('Unbounded[wght].ttf', 34); t2 = 'CPK!  Remix'; w2 = d.textlength(t2, font=f2)
d.text((WS / 2 - w2 / 2, ry + rh / 2), t2, font=f2, fill=(255, 255, 255, 255), anchor='lm', stroke_width=2 * S, stroke_fill=(150, 20, 90, 255)); df.rectangle([rx0, ry, rx0 + rw, ry + rh], fill=110)
# the credit on a gold-ruled plate
py = H * 0.885 * S; f3 = fnt('HachiMaruPop-Regular.ttf', 24); t3 = 'かぐや & 月見ヤチヨ ver.'; w3 = d.textlength(t3, font=f3)
d.rounded_rectangle([WS / 2 - w3 / 2 - 26 * S, py - 22 * S, WS / 2 + w3 / 2 + 26 * S, py + 22 * S], radius=22 * S, fill=(36, 16, 64, 220), outline=(236, 200, 120, 255), width=2 * S)
d.text((WS / 2, py), t3, font=f3, fill=(255, 240, 250, 255), anchor='mm'); df.rounded_rectangle([WS / 2 - w3 / 2 - 26 * S, py - 22 * S, WS / 2 + w3 / 2 + 26 * S, py + 22 * S], radius=22 * S, outline=255, width=2 * S)
# the seal 「超かぐや姫!」, cinnabar with a gold border, standing in the upper right
sx0, sy0, sw, sh = W * 0.845 * S, H * 0.085 * S, 54 * S, 300 * S
d.rounded_rectangle([sx0 - 4 * S, sy0 - 4 * S, sx0 + sw + 4 * S, sy0 + sh + 4 * S], radius=10 * S, fill=(236, 200, 120, 255)); d.rounded_rectangle([sx0, sy0, sx0 + sw, sy0 + sh], radius=8 * S, fill=(200, 34, 60, 255))
d.rounded_rectangle([sx0 + 4 * S, sy0 + 4 * S, sx0 + sw - 4 * S, sy0 + sh - 4 * S], radius=6 * S, outline=(255, 214, 190, 255), width=1 * S)
f4 = fnt('DelaGothicOne-Regular.ttf', 34)
for i, ch in enumerate('超かぐや姫'): d.text((sx0 + sw / 2, sy0 + 34 * S + i * 56 * S), ch, font=f4, fill=(255, 246, 236, 255), anchor='mm')
df.rounded_rectangle([sx0 - 4 * S, sy0 - 4 * S, sx0 + sw + 4 * S, sy0 + sh + 4 * S], radius=10 * S, outline=255, width=4 * S)
# the TITLE badge, upper left
bx, by = W * 0.075 * S, H * 0.055 * S; f5 = fnt('Unbounded[wght].ttf', 15); t5 = 'TITLE · No.000'; w5 = d.textlength(t5, font=f5)
d.rounded_rectangle([bx, by, bx + w5 + 28 * S, by + 30 * S], radius=15 * S, fill=(34, 16, 60, 230), outline=(236, 200, 120, 255), width=2 * S); d.text((bx + 14 * S, by + 15 * S), t5, font=f5, fill=(255, 232, 170, 255), anchor='lm')
# card shape, fx maps
mk = Image.new('L', (WS, HS), 0); ImageDraw.Draw(mk).rounded_rectangle([0, 0, WS - 1, HS - 1], radius=R * S, fill=255); img.putalpha(mk)
face = img.resize((W, H), Image.LANCZOS); fo = np.asarray(foil.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255; m = np.asarray(mk.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
fa = np.asarray(face.convert('RGB')).astype(np.float32) / 255; lum = fa @ np.array([0.3, 0.59, 0.11], np.float32)
night = np.clip((0.45 - lum) / 0.3, 0, 1) * np.clip((fa[..., 2] - fa[..., 0] * 0.8) * 4, 0, 1)
ln = np.clip(np.hypot(cv2.Sobel(lum, cv2.CV_32F, 1, 0), cv2.Sobel(lum, cv2.CV_32F, 0, 1)) * 1.4, 0, 1) * 0.45
fx = np.dstack([night * 0.55 * (1 - fo), fo * 0.9, np.zeros_like(fo), ln]) * m[..., None]
out = os.path.join(ROOT, 'materials/cards'); face.save(os.path.join(out, 'TITLE_face.png')); Image.fromarray((np.clip(fx, 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, 'TITLE_fx.png'))
json.dump({'w': W, 'h': H, 'style': 'radial', 'metal': 'gold', 'metalRGB': [236, 196, 110], 'spk': [[0.5, 0.71, 0.05, 0.5], [0.26, 0.42, 0.035, 1.7], [0.76, 0.33, 0.04, 3.1], [0.3, 0.22, 0.03, 4.4]]}, open(os.path.join(out, 'TITLE.json'), 'w'))
print('title', face.size)
