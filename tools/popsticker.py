# Figures as pop stickers (2026-11-22, the user: "立绘的抠图还是有白边，我觉得这个根因难以去除，可以尝试给立绘的处理以pop sticker的风格进行
# 处理（类似手书风）"): the matte's pale fringe is not fought any more but made the design — round each figure's silhouette a cream-
# white border (grown from its alpha, its outline a little uneven, as if cut by hand with scissors), and outside that a thin ink
# line, like the 手书 PVs' drawn stickers. The canvas, and so the card's frame and feet line, stays the same (pairs still match).
# A card cut at a drawn waterline (--water ROW) gets no border under that row: there the water is the edge.
#   ~/.local/matte/venv/bin/python -I tools/popsticker.py <in.png> <out.png> [--border 14] [--water ROW]
import argparse
import numpy as np
import cv2
from PIL import Image

ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--border', type=float, default=14); ap.add_argument('--ink', type=float, default=2.2); ap.add_argument('--water', type=int, default=-1)
a = ap.parse_args()
im = np.asarray(Image.open(a.src).convert('RGBA')).astype(np.float32) / 255
H, W = im.shape[:2]
s = max(H, W) / 1216.0                                                 # (sizes are given for a 1216 px canvas)
B, Ink = a.border * s, a.ink * s
al = im[..., 3]
fig = (al > 0.35).astype(np.uint8)
fig = cv2.morphologyEx(fig, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
# distance from the figure, and a slow wobble on it so the cut line wanders as scissors do
dist = cv2.distanceTransform(1 - fig, cv2.DIST_L2, 5)
rng = np.random.default_rng(7)
nz = cv2.resize(rng.normal(0, 1, (max(2, H // 48), max(2, W // 48))).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
nz = cv2.GaussianBlur(nz, (0, 0), 6 * s)
nz /= max(1e-6, np.abs(nz).max())
edge = B * (1 + 0.22 * nz)
# soft (one pixel) edges for the white and the ink
white = np.clip(edge - dist + 0.5, 0, 1)
inkA = np.clip(edge + Ink - dist + 0.5, 0, 1) - white
if a.water >= 0:
    keep = np.clip((a.water + 2 - np.arange(H)) / 3.0, 0, 1)[:, None]
    white *= keep; inkA *= keep
paper = np.array([0.945, 0.925, 0.905], np.float32)          # (a warm cream, under the dream filter's bloom: pure white haloed)
inkC = np.array([0.204, 0.188, 0.38], np.float32)
outA = np.clip(white + inkA * 0.8, 0, 1)
rgb = (paper * white[..., None] + inkC * (inkA * 0.8)[..., None]) / np.maximum(outA, 1e-6)[..., None]
# the figure over its sticker
fa = al[..., None]
rgb = im[..., :3] * fa + rgb * (1 - fa) * outA[..., None] / np.maximum(fa + (1 - fa) * outA[..., None], 1e-6)
outA = np.clip(al + (1 - al) * outA, 0, 1)
rgb = np.where(al[..., None] > 0.999, im[..., :3], rgb)
Image.fromarray((np.dstack([rgb, outA]).clip(0, 1) * 255).astype(np.uint8)).save(a.out)
print(a.out, W, H)
