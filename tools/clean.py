# A transparent NovelAI figure used as it is (the user: "人物图直出透明背景的话就不用加上popsticker的边缘了"): no border; only its half-clear
# parts made opaque (NovelAI's transparent mode leaves white skirts see-through), soft edges kept, loose specks dropped.
#   ~/.local/matte/venv/bin/python -I tools/clean.py NAME …   materials/nai/NAME.png → materials/nai/cut/NAME.png (cropped, small margin)
import sys, os, numpy as np, cv2
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.makedirs(os.path.join(ROOT, 'materials/nai/cut'), exist_ok=True)
for n in sys.argv[1:]:
    A = np.asarray(Image.open(os.path.join(ROOT, 'materials/nai', n + '.png')).convert('RGBA')).astype(np.float32) / 255
    a = A[..., 3]; k, lab, st, _ = cv2.connectedComponentsWithStats((a > 0.04).astype(np.uint8), 8)
    keep = np.zeros(k, bool); keep[1:] = st[1:, cv2.CC_STAT_AREA] >= 450; a = a * keep[lab]
    core = cv2.erode((a > 0.5).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32)        # (well inside the figure)
    core = cv2.GaussianBlur(cv2.dilate(core, np.ones((3, 3), np.uint8)), (0, 0), 1.2)
    a2 = np.maximum(a, np.clip(core, 0, 1))                                                              # half-clear inside → opaque; edges as drawn
    rgb = A[..., :3] * np.clip(a, 1e-3, 1)[..., None] / np.clip(a2, 1e-3, 1)[..., None] + (1 - a / np.clip(a2, 1e-3, 1))[..., None] * np.array([0.98, 0.975, 0.97])
    out = np.dstack([np.clip(rgb, 0, 1), a2]); ys, xs = np.where(a2 > 0.03); m = 6
    img = Image.fromarray((out * 255 + 0.5).astype(np.uint8)).crop((max(0, xs.min() - m), max(0, ys.min() - m), xs.max() + m, ys.max() + m))
    img.save(os.path.join(ROOT, 'materials/nai/cut', n + '.png')); print(n, img.size)
