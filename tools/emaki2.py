# The intro's picture scroll v2 (the user, 2026-11-24: "绘卷要做的更精致且合理"): the paper is painted by the image model — NovelAI yamato-e
# panels (materials/nai/emaki_{1..4}.png, 0 Anlas) in story order: the bamboo under the moon · the palace in gold cloud and autumn grass ·
# the moonlit river · the moon's envoys — joined with feathered seams, on washi with cut-gold flakes, between bands of kinran brocade
# (materials/nai/brocade_1.png) with gold rules. Drawn 8192 × 1148 (2 × the old scroll's 574: the 1440p master). The footage windows sit
# on top as before (engine planes at SCROLL.WIN); a soft gold wash under each window so the paintings give way to them.
#   ~/.local/matte/venv/bin/python -I tools/emaki2.py   → materials/emaki2.png, materials/emaki_cover.png, materials/emaki_cord.png
import os, glob, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 8192, 1148; BR = 86; IH = H - 2 * BR; rng = np.random.RandomState(11)
WIN = [0.14, 0.32, 0.5, 0.68, 0.86]
def up(im, h):                                                       # (Lanczos ×≈1.4 with a light unsharp — to be replaced by a model upscale if allowed)
    w = round(im.width * h / im.height); r = im.resize((w, h), Image.LANCZOS); return r.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
# (NovelAI Upscale ×2, emaki_*_up.png — the user, 2026-11-24: "如果nai的素材需要超分，可以花积分直接用nai的upscale" — downsampled to fit: crisp)
srcs = sorted(glob.glob(os.path.join(ROOT, 'materials/nai/emaki_[0-9].png')))
panels = []
for p in srcs:
    u = p.replace('.png', '_up.png')
    panels.append(Image.open(u).convert('RGB').resize((round(2944 * IH / 1408), IH), Image.LANCZOS) if os.path.exists(u) else up(Image.open(p).convert('RGB'), IH))
# washi ground
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
paper = np.dstack([236 - 10 * (yy / H), 222 - 12 * (yy / H), 178 - 16 * (yy / H)]) + (cv2.GaussianBlur(rng.rand(H, W).astype(np.float32), (0, 0), 1.5) - 0.5)[..., None] * 18
acc = np.zeros((H, W, 3), np.float32); wsum = np.zeros((H, W), np.float32)
total = sum(p.width for p in panels); ov = max(60, int((total - W) / max(1, len(panels) - 1)) + 60) if total > W else 220
x = 0; spans = []
for i, p in enumerate(panels):
    a = np.asarray(p).astype(np.float32); pw = a.shape[1]
    if i == len(panels) - 1: x = W - pw                                  # (the last one ends at the scroll's end)
    ramp = np.ones(pw, np.float32); f = min(ov, pw // 3)
    if i > 0: ramp[:f] = np.linspace(0, 1, f)
    if i < len(panels) - 1: ramp[-f:] = np.minimum(ramp[-f:], np.linspace(1, 0, f))
    x0, x1 = max(0, x), min(W, x + pw); sl = slice(x0 - x, x1 - x)
    acc[BR:BR + IH, x0:x1] += a[:, sl] * ramp[None, sl, None]; wsum[BR:BR + IH, x0:x1] += ramp[None, sl]
    spans.append((x0, x1)); x += pw - ov
art = np.where(wsum[..., None] > 1e-3, acc / np.maximum(wsum[..., None], 1e-3), paper)
k = np.clip(wsum, 0, 1)[..., None]; img = paper * (1 - k) + art * k
# a gold wash where each window will sit (the painting gives way to the footage), with kirikane
for c in WIN:
    cx = c * W; ww = 0.11 * W * 1.25; g = np.exp(-((xx - cx) / (ww * 0.55)) ** 8)[..., None] * np.exp(-((yy - H / 2) / (H * 0.42)) ** 8)[..., None]
    img = img * (1 - 0.55 * g) + np.array([246, 222, 150]) * 0.55 * g
img = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert('RGBA'); d = ImageDraw.Draw(img)
for _ in range(1400):                                                   # (cut gold, sparse and warm — dense white flakes read as snow)
    x, y, s = rng.rand() * W, BR + rng.rand() * IH, 1.5 + rng.rand() * 3.5
    d.rectangle([x, y, x + s * (1 + 2 * (rng.rand() > 0.7)), y + s], fill=(236, 196, 110, int(90 + 110 * rng.rand())))
# brocade bands and gold rules
bro = Image.open(os.path.join(ROOT, 'materials/nai/brocade_1.png')).convert('RGB'); bt = bro.resize((int(bro.width * BR / 300), int(bro.height * BR / 300)), Image.LANCZOS)
for y0 in (0, H - BR):
    for x in range(0, W, bt.width): img.paste(bt.crop((0, 0, bt.width, BR)), (x, y0))
    d.rectangle([0, y0, W, y0 + BR], outline=None)
for y in (BR - 5, H - BR + 1): d.rectangle([0, y, W, y + 4], fill=(236, 200, 120, 255))
for y in (BR - 11, H - BR + 7): d.rectangle([0, y, W, y + 1], fill=(250, 230, 170, 255))
img.save(os.path.join(ROOT, 'materials/emaki2.png')); print('emaki2', img.size, 'panels', len(panels), spans)
# the cover (表紙): kinran brocade, a gold-ruled title slip (題簽) with 「竹取絵巻」 and a red seal, the 八双 strip along its edge
CW, CH = 560, H
cov = Image.new('RGBA', (CW, CH)); bc = bro.resize((int(bro.width * 0.62), int(bro.height * 0.62)), Image.LANCZOS)
for y in range(0, CH, bc.height):
    for x in range(0, CW, bc.width): cov.paste(bc, (x, y))
dc = ImageDraw.Draw(cov); dc.rectangle([0, 0, 22, CH], fill=(214, 172, 92, 255)); dc.rectangle([4, 0, 8, CH], fill=(255, 236, 180, 255))   # 八双
dc.rectangle([CW - 6, 0, CW, CH], fill=(236, 200, 120, 255))
sx0, sy0, sw, sh = 180, 150, 190, 760
dc.rectangle([sx0 - 6, sy0 - 6, sx0 + sw + 6, sy0 + sh + 6], fill=(214, 172, 92, 255)); dc.rectangle([sx0, sy0, sx0 + sw, sy0 + sh], fill=(250, 244, 228, 255))
for k in range(26): dc.line([(sx0 + 10, sy0 + 20 + k * 28), (sx0 + sw - 10, sy0 + 34 + k * 28)], fill=(236, 226, 200, 255), width=1)      # (the slip's paper grain, light)
f = ImageFont.truetype(os.path.join(ROOT, 'fonts/DelaGothicOne-Regular.ttf'), 112)
for i, ch in enumerate('竹取絵巻'): dc.text((sx0 + sw / 2, sy0 + 105 + i * 148), ch, font=f, fill=(34, 20, 50, 255), anchor='mm')
dc.rectangle([sx0 + sw / 2 - 30, sy0 + sh - 92, sx0 + sw / 2 + 30, sy0 + sh - 32], fill=(196, 36, 56, 255))
fs = ImageFont.truetype(os.path.join(ROOT, 'fonts/DelaGothicOne-Regular.ttf'), 34)
dc.text((sx0 + sw / 2, sy0 + sh - 62), '月', font=fs, fill=(255, 236, 226, 255), anchor='mm')
cov.save(os.path.join(ROOT, 'materials/emaki_cover.png'))
# the cord (紐): a braided violet cord wound out from the 八双, its tassel hanging
CD = Image.new('RGBA', (420, 900)); dd = ImageDraw.Draw(CD)
pts = [(30 + 300 * t + 40 * np.sin(t * 7), 120 + 620 * t ** 1.4) for t in np.linspace(0, 1, 80)]
for w, col in ((26, (60, 24, 90, 255)), (18, (150, 80, 200, 255)), (6, (220, 180, 255, 255))): dd.line(pts, fill=col, width=w, joint='curve')
for i in range(0, 80, 3): x, y = pts[i]; dd.line([(x - 9, y - 6), (x + 9, y + 6)], fill=(90, 40, 130, 255), width=3)
tx, ty = pts[-1]; dd.ellipse([tx - 26, ty - 10, tx + 26, ty + 30], fill=(214, 172, 92, 255))
for k in range(24): dd.line([(tx - 22 + k * 1.9, ty + 26), (tx - 30 + k * 2.6, ty + 150 + 10 * np.sin(k))], fill=(130 + k * 3, 60, 190, 255), width=3)
CD.save(os.path.join(ROOT, 'materials/emaki_cord.png')); print('cover', cov.size, 'cord', CD.size)
# the end roller (軸) with the paper wound on it: the roll shaded round, the rod's gold knobs (軸頭) standing out above and below
RW, RH = 220, int(H * 1.16); rl = Image.new('RGBA', (RW, RH)); dr = ImageDraw.Draw(rl); top = (RH - H) // 2
xs = np.linspace(-1, 1, 150); shade = (0.55 + 0.45 * np.sqrt(np.clip(1 - xs ** 2, 0, 1)))
for i, sv in enumerate(shade): dr.line([(35 + i, top), (35 + i, top + H)], fill=(int(236 * sv), int(220 * sv), int(176 * sv), 255))
for y in (top, top + H - BR): dr.rectangle([35, y, 185, y + BR], fill=(40, 30, 80, 255))
for i, sv in enumerate(shade): dr.line([(35 + i, top + 6), (35 + i, top + BR - 6)], fill=(int(60 * sv), int(44 * sv), int(110 * sv), 255)); dr.line([(35 + i, top + H - BR + 6), (35 + i, top + H - 6)], fill=(int(60 * sv), int(44 * sv), int(110 * sv), 255))
for y in range(top + BR + 30, top + H - BR, 90): dr.arc([35, y - 8, 185, y + 8], 0, 180, fill=(196, 170, 120, 200), width=2)
for y0 in (0, top + H - 6):
    for i, sv in enumerate(np.linspace(-1, 1, 110)): v = 0.5 + 0.5 * np.sqrt(max(0, 1 - sv * sv)); dr.line([(55 + i, y0), (55 + i, y0 + top + 6)], fill=(int(250 * v), int(214 * v), int(120 * v), 255))
    dr.rectangle([55, y0 + (top + 6) // 2 - 2, 165, y0 + (top + 6) // 2 + 2], fill=(255, 246, 210, 255))
rl.save(os.path.join(ROOT, 'materials/emaki_roll.png')); print('roll', rl.size)

