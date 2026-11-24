# NovelAI transparent figure → pop sticker for the film (2026-11-23): pad the canvas (room for the border), make the figure solid paper
# inside its outer outline (holes enclosed by hair and arms filled with the border's cream — NovelAI's transparent mode leaves white
# skirts half see-through), then tools/popsticker.py (cream border with a hand-cut wobble + thin ink line, outside only), crop.
#   ~/.local/matte/venv/bin/python -I tools/stk.py K_peace_1 [more…]   materials/nai/<name>.png → materials/nai/stk/<name>.png
import sys, os, subprocess
import numpy as np, cv2
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(ROOT, 'materials/nai/stk'), exist_ok=True)
cream = np.array([1.0, 0.985, 0.955], np.float32)
for name in sys.argv[1:]:
    im = np.asarray(Image.open(os.path.join(ROOT, 'materials/nai', name + '.png')).convert('RGBA')).astype(np.float32) / 255
    P = 48; im = np.pad(im, ((P, P), (P, P), (0, 0)))
    # drop loose specks (islands under ~450 px) that the transparent mode leaves round the figure
    n, lab, stats, _ = cv2.connectedComponentsWithStats((im[..., 3] > 0.04).astype(np.uint8), 8)
    keep = np.zeros(n, bool); keep[1:] = stats[1:, cv2.CC_STAT_AREA] >= 450; im[..., 3] *= keep[lab]
    inside = (im[..., 3] > 0.04).astype(np.uint8); h, w = inside.shape
    fl = inside.copy(); cv2.floodFill(fl, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 2)
    solid = cv2.GaussianBlur((fl != 2).astype(np.float32), (0, 0), 0.8)
    rgb = im[..., :3] * im[..., 3:4] + cream * (1 - im[..., 3:4])
    fig = np.dstack([rgb, np.maximum(im[..., 3], solid)])
    tmp = os.path.join(ROOT, 'cache', f'_pad_{name}.png'); Image.fromarray((fig * 255 + 0.5).astype(np.uint8)).save(tmp)
    out = os.path.join(ROOT, 'materials/nai/stk', name + '.png')
    subprocess.run([sys.executable, '-I', os.path.join(ROOT, 'tools/popsticker.py'), tmp, out, '--border', '13', '--ink', '2.4'], check=True, capture_output=True)
    st = Image.open(out); a = np.asarray(st)[..., 3]; ys, xs = np.where(a > 8)
    m = 6; st.crop((max(0, xs.min() - m), max(0, ys.min() - m), min(st.width, xs.max() + m), min(st.height, ys.max() + m))).save(out)
    os.remove(tmp); print(name, Image.open(out).size)
