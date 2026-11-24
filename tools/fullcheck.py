# Is a NovelAI transparent figure whole? Reports, per side, how much of the figure touches the canvas edge (fraction of that edge's
# length with alpha > 0.5 within 2 px). A complete 立绘 (the user, 2026-11-24: "要完整展现全身，头发") touches no edge.
#   ~/.local/qwen/bin/python tools/fullcheck.py NAME …   (materials/nai/NAME.png)  → prints NAME ok | cut top/left/right/bottom
import sys, os, json, numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); res = {}
for n in sys.argv[1:]:
    a = np.asarray(Image.open(os.path.join(ROOT, 'materials/nai', n + '.png')).convert('RGBA'))[..., 3].astype(np.float32) / 255
    s = {'top': (a[:2] > 0.5).any(0).mean(), 'bottom': (a[-2:] > 0.5).any(0).mean(), 'left': (a[:, :2] > 0.5).any(1).mean(), 'right': (a[:, -2:] > 0.5).any(1).mean()}
    cut = {k: round(float(v), 3) for k, v in s.items() if v > 0.002}; res[n] = cut
    ys, xs = np.where(a > 0.5); print(n, 'ok' if not cut else 'cut ' + json.dumps(cut), 'fill %.2f' % ((ys.max() - ys.min()) / a.shape[0]))
