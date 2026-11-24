# contact sheet of NovelAI figures on a mid-grey ground, the canvas edge outlined (red where the figure touches it)
#   ~/.local/qwen/bin/python tools/lsheet.py out.jpg NAME …
import sys, os, numpy as np
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); names = sys.argv[2:]; W, H = 277, 405; c = min(8, len(names)); r = (len(names) + c - 1) // c
S = Image.new('RGB', (W * c, (H + 22) * r), (40, 40, 48)); d = ImageDraw.Draw(S)
for i, n in enumerate(names):
    im = Image.open(os.path.join(ROOT, 'materials/nai', n + '.png')).convert('RGBA'); a = np.asarray(im)[..., 3] > 127
    g = Image.new('RGBA', im.size, (150, 150, 160, 255)); g.alpha_composite(im); g = g.convert('RGB').resize((W - 6, H - 6)); x, y = (i % c) * W, (i // c) * (H + 22)
    S.paste(g, (x + 3, y + 3))
    for side, hit, box in [('t', a[:2].any(), (x + 3, y + 1, x + W - 3, y + 3)), ('b', a[-2:].any(), (x + 3, y + H - 3, x + W - 3, y + H - 1)), ('l', a[:, :2].any(), (x + 1, y + 3, x + 3, y + H - 3)), ('r', a[:, -2:].any(), (x + W - 3, y + 3, x + W - 1, y + H - 3))]:
        d.rectangle(box, fill=(255, 40, 40) if hit else (90, 90, 100))
    d.text((x + 6, y + H + 4), n, fill=(230, 230, 240))
S.save(sys.argv[1]); print(S.size)
