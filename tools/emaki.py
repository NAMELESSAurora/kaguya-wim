# The intro's picture scroll (PLAN-v2 §4, 《竹取絵巻 ver.2026》): gold-leaf paper with cut-gold flakes (kirikane), layered bands of suyari
# clouds (long rounded mist bands, light gold with a darker keyline), brocade borders top and bottom. Windows are left open in the
# clouds at the x positions the film's windows take (WIN, in scroll fractions); the engine puts the footage there.
#   ~/.local/matte/venv/bin/python -I tools/emaki.py   → materials/emaki.png (4096 × 574)
import os, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 4096, 574; rng = np.random.RandomState(7)
WIN = [0.14, 0.32, 0.5, 0.68, 0.86]           # window centres (fraction of the width), each 0.11 wide, 0.56 tall
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
base = np.dstack([238 - 14 * (yy / H) + 6 * np.sin(xx / 90), 212 - 18 * (yy / H) + 4 * np.sin(xx / 130 + 1), 150 - 22 * (yy / H)])
fib = cv2.GaussianBlur(rng.rand(H, W).astype(np.float32), (0, 0), 1.2); base += (fib - 0.5)[..., None] * 22
img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).convert('RGBA'); d = ImageDraw.Draw(img)
for _ in range(2600):                                                     # kirikane: tiny gold flakes, squares and slivers
    x, y, s = rng.rand() * W, 40 + rng.rand() * (H - 80), 1 + rng.rand() * 4
    d.rectangle([x, y, x + s * (1 + 2 * (rng.rand() > 0.7)), y + s], fill=(255, 236, 170, int(120 + 120 * rng.rand())))
def cloud(x0, y0, w, h, col=(252, 238, 196, 255), key=(196, 150, 80, 255)):
    d.rounded_rectangle([x0 - 3, y0 - 3, x0 + w + 3, y0 + h + 3], radius=h / 2 + 3, fill=key)
    d.rounded_rectangle([x0, y0, x0 + w, y0 + h], radius=h / 2, fill=col)
    for k in range(3): d.line([(x0 + h * 0.6, y0 + h * (0.3 + 0.2 * k)), (x0 + w - h * 0.6, y0 + h * (0.3 + 0.2 * k))], fill=(240, 214, 150, 160), width=2)
# suyari clouds: long bands in rows, broken where the windows are
rows = [70, 132, 410, 468]
for ry in rows:
    x = -200
    while x < W:
        w = 260 + rng.rand() * 520; h = 40 + rng.rand() * 22; cxf = (x + w / 2) / W
        near = min(abs(cxf - c) for c in WIN)
        if near > 0.07 or ry in (70, 468): cloud(x, ry + rng.rand() * 16 - 8, w, h)
        x += w * (0.55 + rng.rand() * 0.35)
# clouds framing each window (top and bottom lips)
for c in WIN:
    X = c * W; ww = 0.11 * W
    cloud(X - ww * 0.75, H * 0.2 - 30, ww * 0.9, 50); cloud(X - ww * 0.1, H * 0.2 - 46, ww * 0.85, 44)
    cloud(X - ww * 0.8, H * 0.78 + 4, ww * 0.95, 48); cloud(X - ww * 0.05, H * 0.78 + 20, ww * 0.8, 42)
# brocade borders
for y0 in (0, H - 34):
    d.rectangle([0, y0, W, y0 + 34], fill=(40, 28, 78, 255))
    for x in range(0, W, 34):
        d.ellipse([x + 9, y0 + 9, x + 25, y0 + 25], outline=(230, 196, 120, 255), width=2); d.rectangle([x + 15, y0 + 15, x + 19, y0 + 19], fill=(230, 196, 120, 255))
    d.line([(0, y0 + (34 if y0 == 0 else 0)), (W, y0 + (34 if y0 == 0 else 0))], fill=(236, 206, 140, 255), width=3)
img.save(os.path.join(ROOT, 'materials/emaki.png')); print('emaki', img.size)
