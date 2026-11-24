# The title card's face, v3 — cute and genki (the user, 2026-11-24: "卡面可以做的可爱和元气一些", after v2 = tools/title_card_v2.py, an ornate
# astrolabe card, and v1 = tools/title_card_v1.py "有些粗糙"). The image model paints the two of them (materials/nai/title_duo_2.png: Kaguya
# and Yachiyo cheek to cheek with peace signs under a pastel moon, hearts and confetti — NovelAI, 0 Anlas); the art melts into a pastel
# title panel where code sets a candy-pop sticker logo WORLD / IS MINE (bubblegum fill, white sticker edge, pink outline, gloss, hearts),
# a starburst badge for CPK! Remix, the credit on a mint pill, a 「超かぐや姫!」 tag. fx: R holo · G foil (sticker edges, badge) · B faces.
#   ~/.local/matte/venv/bin/python -I tools/title_card.py   → materials/cards/TITLE_face.png, TITLE_fx.png, TITLE.json
import os, json, math, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = 1100; W = round(H * 0.716); R = round(H * 0.045); S = 2; HS, WS = H * S, W * S
fnt = lambda f, px: ImageFont.truetype(os.path.join(ROOT, 'fonts', f), int(px * S))
# ground: the pastel panel (pink → lilac → mint) with soft dots, and the art on its upper part melting into it
yy, xx = np.mgrid[0:HS, 0:WS].astype(np.float32); u = yy / HS
panel = np.dstack([255 - 30 * u + 0 * xx, 206 - 20 * u + 30 * (xx / WS) * u, 236 + 10 * u - 20 * (xx / WS)])
img = Image.fromarray(np.clip(panel, 0, 255).astype(np.uint8)).convert('RGBA'); d = ImageDraw.Draw(img)
for i in range(70): x, y, r = (i * 337 * S) % WS, HS * 0.62 + ((i * 571 * S) % int(HS * 0.38)), (3 + i % 5) * S; d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 120))
art = Image.open(os.path.join(ROOT, 'materials/nai/title_duo_2.png')).convert('RGB'); k = WS / art.width; art = art.resize((WS, round(art.height * k)), Image.LANCZOS)
AH = int(HS * 0.80); art = art.crop((0, 0, WS, AH)).convert('RGBA')
fade = np.ones((AH, WS), np.float32); f0 = int(AH * 0.70); fade[f0:] = np.linspace(1, 0, AH - f0)[:, None] ** 1.3
art.putalpha(Image.fromarray((fade * 255).astype(np.uint8))); img.alpha_composite(art)
foil = Image.new('L', (WS, HS), 0); df = ImageDraw.Draw(foil)
def dil(m, r): return m.filter(ImageFilter.MaxFilter(int(r * S) // 2 * 2 + 1))
def vgrad(y0, y1, stops):
    t = np.clip((np.arange(HS)[:, None] - y0) / max(1, y1 - y0), 0, 1); out = np.zeros((HS, 1, 3), np.float32)
    for (a, ca), (b, cb) in zip(stops[:-1], stops[1:]):
        kk = np.clip((t - a) / (b - a), 0, 1); m = (t >= a) & (t <= b); out = np.where(m[..., None], np.array(ca) + (np.array(cb) - np.array(ca)) * kk[..., None], out)
    return Image.fromarray(np.clip(np.repeat(out, WS, 1), 0, 255).astype(np.uint8)).convert('RGBA')
def sticker_text(lines, rot):
    """lines: [(text, y, px, track)] → the logo as one sticker, turned by rot degrees about its centre"""
    m = Image.new('L', (WS, HS), 0); dm = ImageDraw.Draw(m)
    for text, y, px, track in lines:
        f = fnt('DelaGothicOne-Regular.ttf', px); w = sum(dm.textlength(ch, font=f) for ch in text) + track * S * (len(text) - 1); x = WS / 2 - w / 2
        for ch in text: dm.text((x, y * S), ch, font=f, fill=255); x += dm.textlength(ch, font=f) + track * S
    bb = m.getbbox(); cx, cy = (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2
    m = m.rotate(rot, resample=Image.BICUBIC, center=(cx, cy)); bb = m.getbbox(); y0, y1 = bb[1], bb[3]
    sh = dil(m, 20).filter(ImageFilter.GaussianBlur(6 * S)); img.alpha_composite(Image.composite(Image.new('RGBA', (WS, HS), (150, 90, 200, 160)), Image.new('RGBA', (WS, HS), (0, 0, 0, 0)), sh), (4 * S, 8 * S))
    img.paste((236, 64, 150, 255), (0, 0), dil(m, 19))                                    # pink outer line
    img.paste((255, 255, 255, 255), (0, 0), dil(m, 14))                                   # white sticker edge
    img.paste(vgrad(y0, y1, [(0, (255, 140, 200)), (0.5, (255, 70, 160)), (0.52, (240, 50, 140)), (1, (255, 150, 90))]), (0, 0), m)   # bubblegum fill
    gl = Image.new('L', (WS, HS), 0); dg = ImageDraw.Draw(gl)
    for text, y, px, _ in lines: dg.rounded_rectangle([0, (y + px * 0.12) * S, WS, (y + px * 0.42) * S], radius=10 * S, fill=150)
    gl = gl.rotate(rot, resample=Image.BICUBIC, center=(cx, cy)); img.paste((255, 255, 255, 255), (0, 0), Image.fromarray(np.minimum(np.asarray(gl), np.asarray(m.filter(ImageFilter.MinFilter(9))))))   # gloss
    foil.paste(255, (0, 0), Image.fromarray(np.maximum(np.asarray(dil(m, 14)) - np.asarray(m), 0).astype(np.uint8))); return bb
def heart(cx, cy, r, col, rot=0):
    pts = [(16 * math.sin(t) ** 3, -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))) for t in np.linspace(0, 2 * math.pi, 60)]
    c, s = math.cos(rot), math.sin(rot); P = [(cx + (x * c - y * s) * r / 16, cy + (x * s + y * c) * r / 16) for x, y in pts]
    d.polygon([(x + 0, y + 0) for x, y in P], fill=(255, 255, 255, 255)); P2 = [(cx + (x * c - y * s) * r * 0.78 / 16, cy + (x * s + y * c) * r * 0.78 / 16) for x, y in pts]; d.polygon(P2, fill=col); df.polygon(P, fill=200)
def star(cx, cy, r, col=(255, 250, 220, 255)):
    pts = [(cx, cy - r), (cx + r * 0.2, cy - r * 0.2), (cx + r, cy), (cx + r * 0.2, cy + r * 0.2), (cx, cy + r), (cx - r * 0.2, cy + r * 0.2), (cx - r, cy), (cx - r * 0.2, cy - r * 0.2)]
    d.polygon(pts, fill=col); df.polygon(pts, fill=255)
bb = sticker_text([('WORLD', H * 0.645, 120, 2), ('IS MINE', H * 0.755, 104, 2)], 5)
heart(bb[2] - 10 * S, bb[1] + 4 * S, 34 * S, (255, 80, 160, 255), 0.25); heart(bb[0] + 24 * S, bb[3] - 6 * S, 22 * S, (150, 110, 255, 255), -0.3)
for (x, y, r) in [(bb[0] - 14 * S, bb[1] + 30 * S, 16), (bb[2] + 10 * S, bb[3] - 40 * S, 20), (WS * 0.5, bb[1] - 18 * S, 12)]: star(x, y, r * S)
# CPK! Remix: a yellow starburst badge, slapped on at an angle
bx, by, br = WS * 0.78, HS * 0.62, 62 * S; n = 18
pts = [(bx + (br if i % 2 == 0 else br * 0.8) * math.cos(i / (2 * n) * 2 * math.pi), by + (br if i % 2 == 0 else br * 0.8) * math.sin(i / (2 * n) * 2 * math.pi)) for i in range(2 * n)]
d.polygon([(x + 3 * S, y + 4 * S) for x, y in pts], fill=(200, 110, 160, 160)); d.polygon(pts, fill=(255, 255, 255, 255))
pts2 = [(bx + (x - bx) * 0.88, by + (y - by) * 0.88) for x, y in pts]; d.polygon(pts2, fill=(255, 226, 80, 255)); df.polygon(pts, fill=230)
f2 = fnt('Unbounded[wght].ttf', 22); lay = Image.new('RGBA', (WS, HS), (0, 0, 0, 0)); dl = ImageDraw.Draw(lay)
dl.text((bx, by - 13 * S), 'CPK!', font=fnt('DelaGothicOne-Regular.ttf', 30), fill=(236, 50, 140, 255), anchor='mm'); dl.text((bx, by + 18 * S), 'Remix', font=f2, fill=(120, 60, 190, 255), anchor='mm')
img.alpha_composite(lay.rotate(-12, resample=Image.BICUBIC, center=(bx, by)))
# the credit on a mint pill
py = HS * 0.94; f3 = fnt('HachiMaruPop-Regular.ttf', 25); t3 = 'かぐや & 月見ヤチヨ ver.'; w3 = d.textlength(t3, font=f3)
d.rounded_rectangle([WS / 2 - w3 / 2 - 28 * S, py - 24 * S, WS / 2 + w3 / 2 + 28 * S, py + 24 * S], radius=24 * S, fill=(180, 244, 226, 255), outline=(255, 255, 255, 255), width=4 * S)
d.text((WS / 2, py), t3, font=f3, fill=(60, 120, 120, 255), anchor='mm'); df.rounded_rectangle([WS / 2 - w3 / 2 - 28 * S, py - 24 * S, WS / 2 + w3 / 2 + 28 * S, py + 24 * S], radius=24 * S, outline=255, width=4 * S)
# 「超かぐや姫!」 on a vertical tag, upper left
tx0, ty0, tw, th = WS * 0.06, HS * 0.05, 58 * S, 372 * S
d.rounded_rectangle([tx0 + 3 * S, ty0 + 5 * S, tx0 + tw + 3 * S, ty0 + th + 5 * S], radius=29 * S, fill=(200, 110, 170, 150))
d.rounded_rectangle([tx0, ty0, tx0 + tw, ty0 + th], radius=29 * S, fill=(255, 255, 255, 255)); d.rounded_rectangle([tx0 + 5 * S, ty0 + 5 * S, tx0 + tw - 5 * S, ty0 + th - 5 * S], radius=24 * S, fill=(255, 92, 168, 255))
f4 = fnt('DelaGothicOne-Regular.ttf', 34)
for i, ch in enumerate('超かぐや姫'): d.text((tx0 + tw / 2, ty0 + 40 * S + i * 58 * S), ch, font=f4, fill=(255, 255, 255, 255), anchor='mm')
d.text((tx0 + tw / 2, ty0 + 40 * S + 5 * 58 * S - 6 * S), '!', font=f4, fill=(255, 240, 120, 255), anchor='mm'); df.rounded_rectangle([tx0, ty0, tx0 + tw, ty0 + th], radius=29 * S, outline=255, width=5 * S)
# inner line, card shape, fx
d.rounded_rectangle([14 * S, 14 * S, WS - 14 * S, HS - 14 * S], radius=(R - 8) * S, outline=(255, 255, 255, 230), width=3 * S)
mk = Image.new('L', (WS, HS), 0); ImageDraw.Draw(mk).rounded_rectangle([0, 0, WS - 1, HS - 1], radius=R * S, fill=255); img.putalpha(mk)
face = img.resize((W, H), Image.LANCZOS); fo = np.asarray(foil.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255; m = np.asarray(mk.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
fa = np.asarray(face.convert('RGB')).astype(np.float32) / 255; lum = fa @ np.array([0.3, 0.59, 0.11], np.float32)
Y, X = np.mgrid[0:H, 0:W].astype(np.float32); faces = np.exp(-(((X / W - 0.5) / 0.3) ** 2 + ((Y / H - 0.3) / 0.16) ** 2))           # (keep the glare off their faces)
sky = np.clip((lum - 0.6) / 0.3, 0, 1) * (1 - faces) * np.clip(1 - Y / H * 0.3, 0, 1)
ln = np.clip(np.hypot(cv2.Sobel(lum, cv2.CV_32F, 1, 0), cv2.Sobel(lum, cv2.CV_32F, 0, 1)) * 1.2, 0, 1) * 0.35
fx = np.dstack([sky * 0.5 * (1 - fo), fo * 0.85, faces, ln]) * m[..., None]
out = os.path.join(ROOT, 'materials/cards'); face.save(os.path.join(out, 'TITLE_face.png')); Image.fromarray((np.clip(fx, 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, 'TITLE_fx.png'))
json.dump({'w': W, 'h': H, 'amt': 0.45, 'style': 'cosmos', 'metal': 'pearl', 'metalRGB': [255, 214, 236], 'spk': [[0.22, 0.86, 0.04, 0.5], [0.8, 0.6, 0.035, 1.7], [0.15, 0.62, 0.03, 3.1], [0.86, 0.9, 0.03, 4.4]]}, open(os.path.join(out, 'TITLE.json'), 'w'))
print('title v3', face.size)
