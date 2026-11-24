# Film creatures as stickers (the user, 2026-11-24: "creatures要遵循原片的形象，特别是海蛞蝓，还有萨卡班甲鱼是灰色的"): a matted cut from the film
# (tools/cut.py → materials/film_cut/*.png) gets a white sticker border and a soft drop shadow, written as materials/nai/m_<name>.png so
# s1.js motif() picks it up. Also: the Sacabambaspis sticker recoloured to the film's grey (until a frame of it from the film is cut).
#   ~/.local/matte/venv/bin/python -I tools/sticker.py
import os, numpy as np
from PIL import Image, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def sticker(src, out, border=0.03, scale=2.0):
    im = Image.open(src).convert('RGBA'); w, h = im.size; im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS); w, h = im.size
    b = max(6, int(max(w, h) * border)); pad = b * 3; cv = Image.new('RGBA', (w + pad * 2, h + pad * 2), (0, 0, 0, 0)); cv.paste(im, (pad, pad), im)
    a = cv.split()[3]; ring = a.filter(ImageFilter.MaxFilter(b * 2 + 1)).filter(ImageFilter.GaussianBlur(1.2))
    sh = ring.filter(ImageFilter.GaussianBlur(b)).point(lambda v: int(v * 0.35)); out_im = Image.new('RGBA', cv.size, (0, 0, 0, 0))
    out_im.paste((40, 20, 70, 255), (int(b * 0.6), int(b * 0.9)), sh); out_im.paste((255, 255, 255, 255), (0, 0), ring); out_im.alpha_composite(cv)
    out_im.save(out); print(out, out_im.size)
# (2026-11-24, "creatures还是不用image2image了，就用原素材就行": the film's own cuts only — the octopus is Yachiyo's flapjack octopus from her
# first live, tools/cut_octo.py; the generated one is kept as m_octopus_nai.png)
for k, n in [('seaslug_w', 'seaslug'), ('fushi', 'fushi'), ('inudoge', 'inudoge'), ('fox', 'fox'), ('octopus', 'octopus')]:
    sticker(os.path.join(ROOT, f'materials/film_cut/{k}.png'), os.path.join(ROOT, f'materials/nai/m_{n}.png'), scale=2.0 if k in ('inudoge', 'seaslug_w') else 1.6 if k == 'octopus' else 1.2)
# the Sacabambaspis in grey: desaturate, a cool grey tint, keep its eyes dark and its glints
s = Image.open(os.path.join(ROOT, 'materials/nai/m_sacabambaspis_nai.png')).convert('RGBA'); a = np.asarray(s).astype(np.float32)
L = a[..., :3] @ np.array([0.3, 0.59, 0.11]); g = np.stack([L * 0.92 + 6, L * 0.95 + 8, L * 1.0 + 12], -1)
a[..., :3] = np.clip(g, 0, 255); Image.fromarray(a.astype(np.uint8)).save(os.path.join(ROOT, 'materials/nai/m_sacabambaspis.png')); print('sacabambaspis grey')
