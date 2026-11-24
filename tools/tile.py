# Tile snaps out/snaps/<prefix>*.png into one contact sheet with their times: python tile.py prefix out.jpg t1,t2,...
import sys, glob
from PIL import Image, ImageDraw
pre, out, ts = sys.argv[1], sys.argv[2], sys.argv[3].split(',')
fs = sorted(glob.glob(f'out/snaps/{pre}*.png')); ims = [Image.open(f) for f in fs]; w, h = ims[0].size
cols = 4; rows = (len(ims) + cols - 1) // cols; S = Image.new('RGB', (cols * w, rows * h))
for i, im in enumerate(ims):
    x, y = i % cols * w, i // cols * h; S.paste(im, (x, y)); d = ImageDraw.Draw(S); d.rectangle([x, y, x + 48, y + 14], fill='black'); d.text((x + 2, y + 1), ts[i] if i < len(ts) else '', fill='yellow')
S.save(out, quality=85); print(S.size)
