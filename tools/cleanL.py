# Full-body 立绘 from NovelAI's transparent mode → materials/nai/cut/NAME.png. As clean.py (half-clear parts made opaque, edges as
# drawn), plus: the faint haze / halo some generations leave round the figure (clouds, a ring of fish, a glow) is dropped — only
# what lies near the solid figure is kept (alpha > 0.5 core, its big blobs, grown by a few px for the soft edges and hair tips).
#   ~/.local/matte/venv/bin/python -I tools/cleanL.py NAME …
import sys, os, numpy as np, cv2
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.makedirs(os.path.join(ROOT, 'materials/nai/cut'), exist_ok=True)
for n in sys.argv[1:]:
    A = np.asarray(Image.open(os.path.join(ROOT, 'materials/nai', n + '.png')).convert('RGBA')).astype(np.float32) / 255
    a = A[..., 3]; solid = (a > 0.55).astype(np.uint8)
    k, lab, st, _ = cv2.connectedComponentsWithStats(solid, 8); big = st[1:, cv2.CC_STAT_AREA].max()
    keep = np.zeros(k, bool); keep[1:] = st[1:, cv2.CC_STAT_AREA] >= max(400, big * 0.05)    # (the figure and its big parts; a ring of small generated things goes); solid = keep[lab].astype(np.uint8)
    near = cv2.GaussianBlur(cv2.dilate(solid, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))).astype(np.float32), (0, 0), 1.5)
    a = a * np.clip(near * 1.4, 0, 1)
    core = cv2.erode((a > 0.5).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32)
    core = cv2.GaussianBlur(cv2.dilate(core, np.ones((3, 3), np.uint8)), (0, 0), 1.2)
    a2 = np.maximum(a, np.clip(core, 0, 1))
    rgb = A[..., :3] * np.clip(a, 1e-3, 1)[..., None] / np.clip(a2, 1e-3, 1)[..., None] + (1 - a / np.clip(a2, 1e-3, 1))[..., None] * np.array([0.98, 0.975, 0.97])
    out = np.dstack([np.clip(rgb, 0, 1), a2]); ys, xs = np.where(a2 > 0.03); m = 6
    img = Image.fromarray((out * 255 + 0.5).astype(np.uint8)).crop((max(0, xs.min() - m), max(0, ys.min() - m), xs.max() + m, ys.max() + m))
    img.save(os.path.join(ROOT, 'materials/nai/cut', n + '.png')); print(n, img.size)
