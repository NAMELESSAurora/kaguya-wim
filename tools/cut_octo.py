# The flapjack octopus (メンダコ) Yachiyo holds in her first live (the user: creatures from the film; "creature的提取原片意象可以作为
# image2image的参考图"): pink-mask cut from frame 41647 → materials/film_cut/octopus.png
#   ~/.local/matte/venv/bin/python -I tools/cut_octo.py
import os, numpy as np, cv2
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
im = np.asarray(Image.open(R + 'materials/frames/y_stage/041647.jpg').convert('RGB'))
x0, y0, x1, y1 = 930, 520, 1320, 920; c = im[y0:y1, x0:x1].copy()
hsv = cv2.cvtColor(c, cv2.COLOR_RGB2HSV).astype(np.float32); h, s, v = hsv[..., 0] * 2, hsv[..., 1] / 255, hsv[..., 2] / 255
m = (((h > 290) | (h < 12)) & (s > 0.25) & (v > 0.45)).astype(np.uint8)
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)); k, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
m = (lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
op = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19)))   # (drops the thin collar straps; the body stays)
k, lab, st, _ = cv2.connectedComponentsWithStats(op, 8); op = (lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
m = m & cv2.dilate(op, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
ff = m.copy(); hh, ww = m.shape; mk = np.zeros((hh + 2, ww + 2), np.uint8); cv2.floodFill(ff, mk, (0, 0), 1); m = m | (1 - ff)      # (holes: eyes, dots)
a = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.0); ys, xs = np.where(m > 0)
Image.fromarray(np.dstack([c, (a * 255).astype(np.uint8)])).crop((xs.min() - 4, ys.min() - 4, xs.max() + 5, ys.max() + 5)).save(R + 'materials/film_cut/octopus.png')
print('octopus', xs.max() - xs.min(), ys.max() - ys.min())
