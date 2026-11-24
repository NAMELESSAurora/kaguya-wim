# The card backs from the image model (the user, 2026-11-24: "卡牌的背面也可以用生图模型制作图案，然后用shader写星空质感附加在图案上"):
# NovelAI patterns (materials/nai/cardback_*.png, 0 Anlas) cropped to their own gold frame, fitted to the card's shape (0.716) with a
# little crop top/bottom and the rest as a slight stretch, rounded like the fronts. space.js mode 10 lays the starry sky over them.
#   ~/.local/matte/venv/bin/python -I tools/card_back_art.py   → materials/cards/back_art{3,2}.png + .json (emblem centre)
import os, sys, json, numpy as np
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = 1100; W = round(H * 0.716); R = round(H * 0.045)
for k in (sys.argv[1:] or ['3', '2']):
    im = Image.open(os.path.join(ROOT, f'materials/nai/cardback_{k}.png')).convert('RGB'); a = np.asarray(im).astype(np.float32)
    h0, w0 = a.shape[:2]                                                              # (the margin, sampled at the edges' midpoints — the corners can be another colour)
    bg = np.median(np.concatenate([a[h0 // 2 - 40:h0 // 2 + 40, :4].reshape(-1, 3), a[h0 // 2 - 40:h0 // 2 + 40, -4:].reshape(-1, 3), a[:4, w0 // 2 - 40:w0 // 2 + 40].reshape(-1, 3), a[-4:, w0 // 2 - 40:w0 // 2 + 40].reshape(-1, 3)]), 0)
    diff = np.abs(a - bg).sum(2) > 60
    rows, cols = np.where(diff.mean(1) > 0.5)[0], np.where(diff.mean(0) > 0.5)[0]
    y0, y1, x0, x1 = rows[0], rows[-1] + 1, cols[0], cols[-1] + 1
    pad = 3; y0, y1, x0, x1 = y0 + pad, y1 - pad, x0 + pad, x1 - pad
    cw, ch = x1 - x0, y1 - y0; want = cw / 0.716                                    # height for the card's aspect at this width
    if ch > want:                                                                    # too tall: crop half of the excess, stretch the rest
        cut = int((ch - want) * 0.5) // 2; y0 += cut; y1 -= cut
    crop = im.crop((x0, y0, x1, y1)).resize((W, H), Image.LANCZOS).convert('RGBA')
    mk = Image.new('L', (W * 3, H * 3), 0); ImageDraw.Draw(mk).rounded_rectangle([0, 0, W * 3 - 1, H * 3 - 1], radius=R * 3, fill=255)
    crop.putalpha(mk.resize((W, H), Image.LANCZOS))
    crop.save(os.path.join(ROOT, f'materials/cards/back_art{k}.png'))
    print(k, 'bbox', (x0, y0, x1, y1), 'crop', (x1 - x0, y1 - y0), '→', crop.size)
