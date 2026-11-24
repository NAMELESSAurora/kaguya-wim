# SAR-style holo card faces (the user, 2026-11-24: "人物立绘其实可以做有质感的卡片，可以用生图工具制作卡片的背景图"; their pasted spec: Pokémon
# SAR / UR full-art holo card, figure kept 100% — never redrawn). This makes the STATIC parts; the light that moves with the card's tilt
# (rainbow diffraction, glare sweep, foil, emboss, star glints) is the engine's plane mode 8 (src/space.js), driven by these maps.
#
#   ~/.local/matte/venv/bin/python -I tools/card.py NAME FIGURE BG STYLE METAL LABEL
#     FIGURE  materials/nai/cut/<FIGURE>.png (transparent, untouched)     BG  materials/nai/<BG>.png (card background art, NovelAI)
#     STYLE   cosmos | silk | radial (the micro-etched pattern; only recorded here, drawn by the shader)
#     METAL   gold | silver | violet (bevel and foil tone)                 LABEL  the name on the plate
#   → materials/cards/<NAME>_face.png (RGBA, rounded corners, antialiased), <NAME>_fx.png (R holo zone · G foil zone · B figure ·
#     A line strength), <NAME>.json (size, style, metal, sparkle anchors in uv from the bottom-left)
import sys, os, json, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
name, fig, bg, style, metal, label = sys.argv[1:7]
FRAME = sys.argv[7] if len(sys.argv) > 7 else 'sar'      # sar · ur (rainbow holo rim) · neon (dark rim, neon line) · pearl (white pearl, gold line)
RARITY = {'sar': 'SAR', 'ur': 'UR', 'neon': 'SR', 'pearl': 'SAR'}[FRAME]
H = 1100; W = round(H * 0.716); R = round(H * 0.045)                    # (63 × 88 mm proportions; corner radius as the shader's)
METAL = {'gold': (236, 196, 110), 'silver': (214, 224, 238), 'violet': (206, 170, 250)}[metal]
edges = json.load(open(os.path.join(ROOT, 'materials/nai/cut/edges.json'))).get(fig, {})

# --- background art, cover-fitted
B = Image.open(os.path.join(ROOT, 'materials/nai', bg + '.png')).convert('RGB')
k = max(W / B.width, H / B.height); B = B.resize((round(B.width * k), round(B.height * k)), Image.LANCZOS)
B = B.crop(((B.width - W) // 2, (B.height - H) // 2, (B.width - W) // 2 + W, (B.height - H) // 2 + H))

# --- the figure, as drawn (only scaled): its feet near the bottom; a side cut by its canvas lies on (or past) the card's edge
F = Image.open(os.path.join(ROOT, 'materials/nai/cut', fig + '.png')).convert('RGBA') if fig != '-' else Image.new('RGBA', (4, 4), (0, 0, 0, 0))   # ('-': an object card, the art alone)
s = 0.9 * H / F.height
cutL, cutR = edges.get('left') is not None, edges.get('right') is not None
if cutL and cutR: s = max(s, W / (F.width * (edges.get('x1', 1) - edges.get('x0', 0))))
HALF = '_hb_' in fig        # a half-body: the card exists to frame it (the user, 2026-11-24: "给这样的半身像做一个卡牌来掩盖一下画面不完全的瑕疵")
if HALF: s = max(W * 1.06 / F.width, H * 1.02 / F.height)      # (wider than the card and taller: every cut edge falls outside it)
F = F.resize((round(F.width * s), round(F.height * s)), Image.LANCZOS)
fx0 = (W - F.width) // 2
if cutL and not cutR: fx0 = -round(edges.get('x0', 0) * F.width)
if cutR and not cutL: fx0 = W - round(edges.get('x1', 1) * F.width)
fy0 = H - F.height - (0 if edges.get('bottom') else round(0.02 * H))
if cutL and cutR: fy0 = round(0.035 * H)
if HALF: fx0 = (W - F.width) // 2; fy0 = round(0.03 * H)          # (head near the top; sides and the bottom cut run off the card)          # (scaled to bridge both cuts she is taller than the card: head near the top, the card's bottom crops her legs)
figL = Image.new('RGBA', (W, H), (0, 0, 0, 0)); figL.paste(F, (fx0, fy0), F)

# a soft glow of the art behind her so she reads off it (the art is dimmed a little under her, never her)
fa = np.asarray(figL)[..., 3].astype(np.float32) / 255
halo = cv2.GaussianBlur(fa, (0, 0), H * 0.03)
Bn = np.asarray(B).astype(np.float32) / 255
Bn = Bn * (1 - 0.18 * np.clip(halo * 1.5, 0, 1)[..., None])

# --- frame and name plate (thin, futurist; drawn on their own layer so they are the foil zone)
frame = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(frame)
ins = round(H * 0.032)            # (the rim: an opaque metal border round the window — wide enough to hide the layers' shift when the card turns)
rimG = np.linspace(1.15, 0.7, H)[:, None, None] * np.array(METAL, np.float32)[None, None, :] * np.ones((1, W, 1), np.float32)
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32); _ang = np.arctan2(_yy - H / 2, _xx - W / 2)
if FRAME == 'ur':        # a rainbow-holo rim: hue running round the card, a pearl sheen down it
    rimG = np.dstack([0.5 + 0.5 * np.cos(_ang * 2 + k * 2.094) for k in range(3)]) * 150 + 105 + 30 * np.linspace(1, -1, H)[:, None, None]
elif FRAME == 'neon':    # a dark lacquer rim (the neon line is drawn below)
    rimG = np.dstack([np.full((H, W), v, np.float32) for v in (34, 24, 58)]) + 26 * np.linspace(1, 0, H)[:, None, None]
elif FRAME == 'pearl':   # white pearl with a faint lilac / mint drift
    rimG = np.dstack([246 - 10 * np.sin(_ang * 3), 242 - 8 * np.cos(_ang * 2), 252 - 6 * np.sin(_ang * 4 + 1)]) * np.linspace(1.02, 0.9, H)[:, None, None]
rimM = Image.new('L', (W * 4, H * 4), 0); dm = ImageDraw.Draw(rimM); dm.rounded_rectangle([0, 0, W * 4 - 1, H * 4 - 1], radius=R * 4, fill=255)
dm.rounded_rectangle([ins * 4, ins * 4, (W - ins) * 4 - 1, (H - ins) * 4 - 1], radius=(R - ins // 2) * 4, fill=0); rimM = rimM.resize((W, H), Image.LANCZOS)
frame.paste(Image.fromarray(np.clip(rimG, 0, 255).astype(np.uint8)).convert('RGBA'), (0, 0), rimM)
LINE = {'sar': (255, 250, 240, 255), 'ur': (255, 255, 255, 255), 'neon': (255, 80, 190, 255), 'pearl': (226, 190, 110, 255)}[FRAME]
if FRAME == 'neon':      # the neon line glows
    gl = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(gl).rounded_rectangle([ins, ins, W - 1 - ins, H - 1 - ins], radius=R - ins // 2, outline=(255, 80, 190, 200), width=10)
    frame.alpha_composite(gl.filter(ImageFilter.GaussianBlur(6)))
d.rounded_rectangle([ins, ins, W - 1 - ins, H - 1 - ins], radius=R - ins // 2, outline=LINE, width=max(2, H // 400) + (2 if FRAME in ('neon', 'pearl') else 0))
# --- the card's interface (2026-11-24, "卡面的界面也可以进行优化做的更有设计感一些"): drawn at 3× and brought down for clean edges —
# a faceted gem rarity badge, an attribute crest (her emblem), engraved corner brackets on the window, a chamfered glass name plate with a
# coloured ribbon, the name letter-spaced in metal with her Japanese name over it, gem stars and a set number, and a foil seal
S3 = 3; ui = Image.new('RGBA', (W * S3, H * S3), (0, 0, 0, 0)); du = ImageDraw.Draw(ui)
def FT(path, px, wt=None):
    f_ = ImageFont.truetype(os.path.join(ROOT, 'fonts', path), round(px * S3))
    if wt and 'Unbounded' in path:
        try: f_.set_variation_by_axes([wt])
        except Exception: pass
    return f_
who = name[0] if name[0] in 'KYI' and name[1:2].isupper() else ('T' if name.startswith('TR') else 'K')
ACC = {'K': (255, 120, 180), 'Y': (110, 220, 245), 'I': (190, 130, 255), 'T': (255, 200, 110)}[who]
MT = METAL + (255,); WH = (255, 252, 246, 255); x3 = lambda v: v * S3; w3 = lambda v: max(1, round(v * S3))
def star4(cx, cy, r, fill, k=0.26): du.polygon([(cx, cy - r), (cx + r * k, cy - r * k), (cx + r, cy), (cx + r * k, cy + r * k), (cx, cy + r), (cx - r * k, cy + r * k), (cx - r, cy), (cx - r * k, cy - r * k)], fill=fill)
# corner brackets on the window
cb = 34
for (cx, cy, sx, sy) in [(ins + 10, ins + 10, 1, 1), (W - ins - 10, ins + 10, -1, 1), (ins + 10, H - ins - 10, 1, -1), (W - ins - 10, H - ins - 10, -1, -1)]:
    du.line([(x3(cx), x3(cy + sy * cb)), (x3(cx), x3(cy)), (x3(cx + sx * cb), x3(cy))], fill=MT, width=w3(3), joint='curve')
    du.ellipse([x3(cx + sx * 9) - x3(3.5), x3(cy + sy * 9) - x3(3.5), x3(cx + sx * 9) + x3(3.5), x3(cy + sy * 9) + x3(3.5)], fill=MT)
# the rarity gem (top-left): a long hexagon cut into facets, the rarity in it
gx, gy, gw, gh = ins + 22, ins + 22, 96, 44
hexp = [(gx + 14, gy), (gx + gw - 14, gy), (gx + gw, gy + gh / 2), (gx + gw - 14, gy + gh), (gx + 14, gy + gh), (gx, gy + gh / 2)]
du.polygon([(x3(a), x3(b)) for a, b in hexp], fill=(24, 14, 44, 235))
for (a, b, c, col) in [((gx + 14, gy), (gx + gw - 14, gy), (gx + gw / 2, gy + gh / 2), (255, 255, 255, 70)), ((gx, gy + gh / 2), (gx + 14, gy), (gx + gw / 2, gy + gh / 2), ACC + (90,)), ((gx + gw, gy + gh / 2), (gx + gw - 14, gy + gh), (gx + gw / 2, gy + gh / 2), ACC + (60,))]:
    du.polygon([(x3(a[0]), x3(a[1])), (x3(b[0]), x3(b[1])), (x3(c[0]), x3(c[1]))], fill=col)
du.line([(x3(a), x3(b)) for a, b in hexp + [hexp[0]]], fill=MT, width=w3(2.5))
du.text((x3(gx + gw / 2), x3(gy + gh / 2 + 1)), RARITY, font=FT('Unbounded[wght].ttf', 21, 800), fill=WH, anchor='mm')
# the attribute crest (top-right): her emblem in a metal ring
ccx, ccy, cr = W - ins - 22 - 26, ins + 22 + 22, 24
du.ellipse([x3(ccx - cr), x3(ccy - cr), x3(ccx + cr), x3(ccy + cr)], fill=(24, 14, 44, 235), outline=MT, width=w3(2.5))
du.ellipse([x3(ccx - cr + 5), x3(ccy - cr + 5), x3(ccx + cr - 5), x3(ccy + cr - 5)], outline=ACC + (200,), width=w3(1.2))
if who == 'K':      # a crescent and a star
    du.ellipse([x3(ccx - 13), x3(ccy - 13), x3(ccx + 13), x3(ccy + 13)], fill=MT); du.ellipse([x3(ccx - 7), x3(ccy - 17), x3(ccx + 17), x3(ccy + 7)], fill=(24, 14, 44, 255)); star4(x3(ccx + 6), x3(ccy + 4), x3(6), WH)
elif who == 'Y':    # a wave and a pearl
    du.arc([x3(ccx - 15), x3(ccy - 6), x3(ccx + 1), x3(ccy + 10)], 180, 360, fill=MT, width=w3(3)); du.arc([x3(ccx - 1), x3(ccy - 6), x3(ccx + 15), x3(ccy + 10)], 180, 360, fill=MT, width=w3(3)); du.ellipse([x3(ccx - 4), x3(ccy - 15), x3(ccx + 4), x3(ccy - 7)], fill=WH)
elif who == 'I':    # a note with a fox's ear
    du.ellipse([x3(ccx - 12), x3(ccy + 2), x3(ccx - 2), x3(ccy + 11)], fill=MT); du.line([(x3(ccx - 2), x3(ccy + 6)), (x3(ccx - 2), x3(ccy - 13))], fill=MT, width=w3(3)); du.polygon([(x3(ccx - 2), x3(ccy - 13)), (x3(ccx + 12), x3(ccy - 6)), (x3(ccx - 2), x3(ccy - 4))], fill=MT)
else: star4(x3(ccx), x3(ccy), x3(14), MT)
# the name plate: chamfered glass, a ribbon of her colour along its top, the name in metal
ph = 122; px0, px1, py1 = ins + 18, W - ins - 18, H - ins - 18; py0 = py1 - ph; ch = 20
plate_poly = [(px0 + ch, py0), (px1, py0), (px1, py1 - ch), (px1 - ch, py1), (px0, py1), (px0, py0 + ch)]
gl3 = Image.new('RGBA', ui.size, (0, 0, 0, 0)); dg = ImageDraw.Draw(gl3); dg.polygon([(x3(a), x3(b)) for a, b in plate_poly], fill=(18, 10, 38, 185)); ui.alpha_composite(gl3)
du.polygon([(x3(px0 + ch), x3(py0)), (x3(px1), x3(py0)), (x3(px1), x3(py0 + 7)), (x3(px0 + ch - 7), x3(py0 + 7))], fill=ACC + (235,))      # (the ribbon)
du.line([(x3(a), x3(b)) for a, b in plate_poly + [plate_poly[0]]], fill=MT, width=w3(2.5))
inner = [(px0 + ch + 6, py0 + 13), (px1 - 7, py0 + 13), (px1 - 7, py1 - ch - 3), (px1 - ch - 3, py1 - 7), (px0 + 7, py1 - 7), (px0 + 7, py0 + ch + 6)]
du.line([(x3(a), x3(b)) for a, b in inner + [inner[0]]], fill=(255, 255, 255, 120), width=w3(1))
JP = {'KAGUYA': 'かぐや', 'YACHIYO': '月見ヤチヨ', 'IROHA': '酒寄彩葉'}
if label in JP: main, sub = label, JP[label]
else: parts = label.split(' ', 1); main, sub = (parts[1], parts[0] + ' · TREASURE') if len(parts) > 1 else (label, '')
jp_main = any(ord(ch_) > 0x2e80 for ch_ in main)
fm = FT('DelaGothicOne-Regular.ttf' if jp_main else 'Unbounded[wght].ttf', 40 if jp_main else 44, 700); tx, ty = px0 + 34, py0 + 76
if jp_main: du.text((x3(tx), x3(ty)), main, font=fm, fill=MT, anchor='lm')
else:
    for c_ in main: du.text((x3(tx), x3(ty)), c_, font=fm, fill=MT, anchor='lm'); tx += du.textlength(c_, font=fm) / S3 + 7
if sub: du.text((x3(px0 + 36), x3(py0 + 36)), sub, font=FT('DelaGothicOne-Regular.ttf', 21), fill=(255, 255, 255, 235), anchor='lm')
for i in range(3): star4(x3(px1 - 34 - i * 30), x3(py0 + 40), x3(11), MT)
num = 1 + (sum(map(ord, name)) * 7) % 120
du.text((x3(px1 - 24), x3(py0 + 82)), f'No.{num:03d}/120', font=FT('VT323-Regular.ttf', 26), fill=(255, 255, 255, 220), anchor='rm')
du.text((x3(px1 - 24), x3(py0 + 103)), 'TSUKUYOMI · 2030', font=FT('VT323-Regular.ttf', 18), fill=ACC + (230,), anchor='rm')
# the foil seal over the art, above the plate's right end
sx_, sy_, sr = px1 - 52, py0 - 58, 36
du.ellipse([x3(sx_ - sr), x3(sy_ - sr), x3(sx_ + sr), x3(sy_ + sr)], outline=MT, width=w3(2.5)); du.ellipse([x3(sx_ - sr + 6), x3(sy_ - sr + 6), x3(sx_ + sr - 6), x3(sy_ + sr - 6)], outline=MT, width=w3(1))
for k in range(24):
    a = k / 24 * 6.2832; r0, r1 = sr - 12, sr - 8
    du.line([(x3(sx_ + np.cos(a) * r0), x3(sy_ + np.sin(a) * r0)), (x3(sx_ + np.cos(a) * r1), x3(sy_ + np.sin(a) * r1))], fill=MT, width=w3(1.2))
du.ellipse([x3(sx_ - 12), x3(sy_ - 12), x3(sx_ + 12), x3(sy_ + 12)], fill=MT); du.ellipse([x3(sx_ - 6), x3(sy_ - 16), x3(sx_ + 16), x3(sy_ + 6)], fill=(0, 0, 0, 0)); star4(x3(sx_ + 6), x3(sy_ + 4), x3(5), MT)
plate = ui.resize((W, H), Image.LANCZOS)

# --- the face: art → figure → plate → frame
face = Image.fromarray((np.clip(Bn, 0, 1) * 255).astype(np.uint8)).convert('RGBA')
face.alpha_composite(figL); face.alpha_composite(plate); face.alpha_composite(frame)
# rounded corners, antialiased (drawn at 4× then reduced)
m4 = Image.new('L', (W * 4, H * 4), 0); ImageDraw.Draw(m4).rounded_rectangle([0, 0, W * 4 - 1, H * 4 - 1], radius=R * 4, fill=255)
mask = m4.resize((W, H), Image.LANCZOS); face.putalpha(mask)

# --- the maps
f = np.asarray(face).astype(np.float32) / 255; lum = f[..., :3] @ np.array([0.3, 0.59, 0.11], np.float32)
figA = np.asarray(figL)[..., 3].astype(np.float32) / 255
foil = np.maximum(np.asarray(frame)[..., 3], np.asarray(plate)[..., 3] * (np.asarray(plate)[..., :3].mean(-1) > 120)).astype(np.float32) / 255
bright = np.clip((lum - 0.82) / 0.15, 0, 1) * (1 - figA)                   # the art's own lights (the moon, lanterns, spots) take the foil too
foil = np.clip(np.maximum(foil, bright * 0.8), 0, 1)
holo = (1 - figA) * np.clip(1.15 - lum * 1.1, 0.3, 1) * (1 - foil)        # the darker art carries most of the rainbow
g = cv2.GaussianBlur(lum, (0, 0), 0.8); gx = cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3); gy = cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)
line = np.clip(np.hypot(gx, gy) * 2.2, 0, 1) * (0.35 + 0.65 * figA)       # (SAR micro-emboss: strongest on her line art)
fxm = np.dstack([holo, foil, figA, line]) * (np.asarray(mask).astype(np.float32) / 255)[..., None]
out = os.path.join(ROOT, 'materials/cards'); os.makedirs(out, exist_ok=True)
face.save(os.path.join(out, name + '_face.png')); Image.fromarray((np.clip(fxm, 0, 1) * 255).astype(np.uint8), 'RGBA').save(os.path.join(out, name + '_fx.png'))

# --- sparkle anchors: the brightest small highlights (hair glints, eyes' lights, the art's lamps), spread apart
score = cv2.GaussianBlur(lum * (0.5 + 0.5 * np.maximum(figA, foil)), (0, 0), 3) * (np.asarray(mask) > 200)
spk = []; sc = score.copy()
for _ in range(6):
    y, x = np.unravel_index(np.argmax(sc), sc.shape); spk.append([round(x / W, 4), round(1 - y / H, 4), 0.03 + 0.012 * (len(spk) % 2), round(np.random.RandomState(len(spk)).rand() * 6.28, 3)])
    cv2.circle(sc, (int(x), int(y)), int(H * 0.12), 0, -1)
# --- layers for a card with depth (2026-11-24, "卡牌的晃来晃去的展示太简单了"): the art, the figure and the frame + plate as three
# separately lit sheets the engine sets a little apart, so a turn shows the figure shifting against her background (lenticular)
mk = np.asarray(mask).astype(np.float32) / 255
def save_layer(tag, rgba, fx):
    Image.fromarray(np.clip(rgba * 255, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(out, f'{name}_{tag}.png'))
    Image.fromarray(np.clip(np.dstack(fx) * mk[..., None] * 255, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(out, f'{name}_{tag}fx.png'))
# (the art and the figure are cut to the window plus a margin the rim always covers, so no layer's edge can peek past the rim)
mg = max(4, ins - 14); wm = Image.new('L', (W * 4, H * 4), 0); ImageDraw.Draw(wm).rounded_rectangle([mg * 4, mg * 4, (W - mg) * 4 - 1, (H - mg) * 4 - 1], radius=(R - mg // 2) * 4, fill=255)
mkw = np.asarray(wm.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
artL = np.dstack([np.clip(Bn, 0, 1), mkw])
artLum = Bn @ np.array([0.3, 0.59, 0.11], np.float32); bright2 = np.clip((artLum - 0.82) / 0.15, 0, 1)
ga = cv2.GaussianBlur(artLum, (0, 0), 0.8); lineA = np.clip(np.hypot(cv2.Sobel(ga, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(ga, cv2.CV_32F, 0, 1, ksize=3)) * 2.2, 0, 1) * 0.35
save_layer('bg', artL, [np.clip(1.15 - artLum * 1.1, 0.3, 1) * (1 - bright2 * 0.8), bright2 * 0.8, np.zeros_like(artLum), lineA])
fg = np.asarray(figL).astype(np.float32) / 255; fgA = fg[..., 3] * mk
lineF = np.clip(np.hypot(gx, gy) * 2.2, 0, 1) * figA
fgA = fg[..., 3] * mkw
save_layer('fig', np.dstack([fg[..., :3], fgA]), [np.zeros_like(fgA), np.zeros_like(fgA), fgA, lineF])
top = Image.new('RGBA', (W, H), (0, 0, 0, 0)); top.alpha_composite(plate); top.alpha_composite(frame); tp = np.asarray(top).astype(np.float32) / 255
save_layer('top', np.dstack([tp[..., :3], tp[..., 3] * mk]), [np.zeros_like(fgA), tp[..., 3] * (tp[..., :3].mean(-1) > 0.45), np.zeros_like(fgA), np.zeros_like(fgA)])
json.dump({'w': W, 'h': H, 'style': style, 'metal': metal, 'metalRGB': METAL, 'spk': spk, 'layers': True}, open(os.path.join(out, name + '.json'), 'w'))
print(name, W, H, 'figure', F.size, 'at', fx0, fy0, 'spk', len(spk))
