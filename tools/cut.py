# Cut a NovelAI figure out of its plain ground for a card in the world: isnet-anime matte (~/.local/matte/isnetis.onnx),
# the largest blob kept, the ground's colour taken out of the soft edge (so no white or rose fringe is left round the hair),
# cropped to the figure with a margin. Writes <out>.png (RGBA) and <out>.json (size, and where the feet are: the lowest
# opaque row, as a fraction of the height, so the card can be stood on the water).
#   ~/.local/matte/venv/bin/python -I tools/cut.py <in.png> <out-without-ext> [--full]   (--full: no crop, for mirrored pairs)
import sys, json
from collections import deque
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB'); w, h = im.size
rgb = np.asarray(im).astype(np.float32) / 255

# the ground: the median of the outer frame of pixels
edge = np.concatenate([rgb[:6].reshape(-1, 3), rgb[-6:].reshape(-1, 3), rgb[:, :6].reshape(-1, 3), rgb[:, -6:].reshape(-1, 3)])
bg = np.median(edge, axis=0)

s = 1024 / max(w, h); nw, nh = round(w * s), round(h * s)
pad = Image.new('RGB', (1024, 1024), (0, 0, 0)); pad.paste(im.resize((nw, nh), Image.BICUBIC), (0, 0))
x = np.asarray(pad).astype(np.float32).transpose(2, 0, 1)[None] / 255
sess = ort.InferenceSession('/Users/macminim6/.local/matte/isnetis.onnx', providers=['CPUExecutionProvider'])
m = sess.run(None, {'img': x})[0][0, 0][:nh, :nw]
a = np.asarray(Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255
# a ground of one plain colour lets the matte be checked against the colour itself: far from the ground is figure
dist = np.linalg.norm(rgb - bg, axis=2)
# (the matte decides the shape; the colour only firms up its own soft edge — a floor shadow is far from the ground's colour too)
m0 = a
a = np.clip((m0 - 0.2) / 0.55, 0, 1)
a = np.where(m0 > 0.35, np.maximum(a, np.clip((dist - 0.08) / 0.10, 0, 1)), a)
if '--plain' in sys.argv:          # (a thing on a plain ground that is not a figure — a flower: the ground is what is like it AND joined to the border;
    # white petals enclosed by their own pale outlines are not reached, so they stay)
    import cv2
    like = (cv2.GaussianBlur(dist.astype(np.float32), (0, 0), 1.2) < 0.04).astype(np.uint8)
    n, lab = cv2.connectedComponents(like, connectivity=4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    ground = np.isin(lab, list(border)) & (like > 0)
    a = 1.0 - cv2.GaussianBlur(ground.astype(np.float32), (0, 0), 0.8)
# keep the largest blob (stray specks of the ground)
sub = (a[::4, ::4] > 0.5); lab = np.zeros(sub.shape, np.int32); best = bestn = cur = 0
for y in range(sub.shape[0]):
    for x0 in range(sub.shape[1]):
        if sub[y, x0] and not lab[y, x0]:
            cur += 1; q = deque([(y, x0)]); lab[y, x0] = cur; n = 0
            while q:
                cy, cx = q.popleft(); n += 1
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    yy, xx = cy + dy, cx + dx
                    if 0 <= yy < sub.shape[0] and 0 <= xx < sub.shape[1] and sub[yy, xx] and not lab[yy, xx]: lab[yy, xx] = cur; q.append((yy, xx))
            if n > bestn: best, bestn = cur, n
keep = np.asarray(Image.fromarray(((lab == best) * 255).astype(np.uint8)).resize((w, h), Image.NEAREST).filter(ImageFilter.MaxFilter(13))) > 0
a = a * keep
# take the ground out of the soft edge: C = a·F + (1 − a)·bg  →  F = (C − (1 − a)·bg) / a
aa = np.clip(a, 1e-3, 1)[..., None]
fg = np.clip((rgb - (1 - aa) * bg) / aa, 0, 1)
fg = np.where(a[..., None] > 0.97, rgb, fg)
out = np.dstack([fg, a])
img = Image.fromarray((out * 255 + 0.5).astype(np.uint8), 'RGBA')
ys, xs = np.where(a > 0.5)
y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
M = 12
box = (max(0, x0 - M), max(0, y0 - M), min(w, x1 + M + 1), min(h, y1 + M + 1))
if '--full' in sys.argv: box = (0, 0, w, h)      # (a mirrored pair keeps the whole canvas, so both cards share one frame)
img = img.crop(box)
img.save(dst + '.png')
cw, ch = img.size
feet = (y1 - box[1]) / ch
json.dump({'w': cw, 'h': ch, 'feet': round(float(feet), 4), 'src': src.split('/')[-1], 'bg': [round(float(v), 3) for v in bg]}, open(dst + '.json', 'w'))
print(dst, cw, ch, 'feet', round(float(feet), 3))
