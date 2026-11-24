# The cards' watermark from ChatGPT's image model (the user, 2026-11-24: "水印用gpt的生图模型，不要用代码"): white engraving on black →
# alpha (luminance, black point lifted, contrast curved), white RGB; the crest trimmed to its circle, the tile kept square for tiling.
#   ~/.local/matte/venv/bin/python -I tools/wm_alpha.py SRC OUT SIZE [tile|crest] [black point]
import sys, numpy as np
from PIL import Image
src, out, size = sys.argv[1], sys.argv[2], int(sys.argv[3]); tile = len(sys.argv) > 4 and sys.argv[4] == 'tile'; bp = float(sys.argv[5]) if len(sys.argv) > 5 else 0.08
im = Image.open(src).convert('L'); a = np.asarray(im).astype(np.float32) / 255
a = np.clip((a - bp) / (0.88 - bp), 0, 1) ** 0.9
if not tile:
    ys, xs = np.where(a > 0.25); cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2; r = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2 + 8
    a = a[int(cy - r):int(cy + r), int(cx - r):int(cx + r)]
img = Image.fromarray((a * 255).astype(np.uint8)).resize((size, size), Image.LANCZOS)
rgba = Image.merge('RGBA', [Image.new('L', img.size, 255)] * 3 + [img]); rgba.save(out); print(out, rgba.size, round(float(a.mean()), 3))
