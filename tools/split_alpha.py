# Split a transparent image holding several separate objects (ChatGPT sheets: three pressed flowers, five strips of tape) into
# one PNG each, by the connected regions of its alpha; ordered left to right, top to bottom; tiny specks dropped.
#   ~/.local/matte/venv/bin/python -I tools/split_alpha.py <in.png> <out-prefix> [--min 0.01]
import argparse
import numpy as np
import cv2
from PIL import Image

ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('prefix'); ap.add_argument('--min', type=float, default=0.01); ap.add_argument('--thr', type=int, default=24)
a = ap.parse_args()
im = np.asarray(Image.open(a.src).convert('RGBA'))
al = (im[..., 3] > a.thr).astype(np.uint8)
al = cv2.morphologyEx(al, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
n, lab, st, cen = cv2.connectedComponentsWithStats(al, 8)
big = st[1:, cv2.CC_STAT_AREA].max() if n > 1 else 0
parts = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > a.min * big]
parts.sort(key=lambda i: (round(cen[i][1] / (im.shape[0] / 3)), cen[i][0]))
for k, i in enumerate(parts):
    x, y, w, h = st[i, 0], st[i, 1], st[i, 2], st[i, 3]
    p = 6; x0, y0, x1, y1 = max(0, x - p), max(0, y - p), min(im.shape[1], x + w + p), min(im.shape[0], y + h + p)
    crop = im[y0:y1, x0:x1].copy()
    mask = (lab[y0:y1, x0:x1] == i)
    mask = cv2.dilate(mask.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    crop[..., 3] = np.where(mask, crop[..., 3], 0)
    Image.fromarray(crop).save(f'{a.prefix}_{k}.png')
    print(f'{a.prefix}_{k}.png', x1 - x0, y1 - y0)
