# The holo card's looping GIF (the user's spec, 2026-11-24): the engine's showcase render (?card=NAME, 48 frames at 22 fps = one loop)
# cropped to the card, ~460 px wide, a 256-colour adaptive palette (median cut) with Floyd–Steinberg dithering, looping forever.
#   ~/.local/qwen/bin/python tools/card_gif.py NAME        out/card-NAME.mp4 → out/card-NAME.gif
import sys, subprocess, os, numpy as np
from PIL import Image
name = sys.argv[1]; FF = os.path.expanduser('~/.local/ffbin/ffmpeg'); src = f'out/card-{name}.mp4'
W, H = 1280, 720
raw = subprocess.run([FF, '-loglevel', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)[:48]
cw = 520; ch = 700; x0 = (W - cw) // 2; y0 = (H - ch) // 2
ims = [Image.fromarray(f[y0:y0 + ch, x0:x0 + cw]).resize((460, round(460 * ch / cw)), Image.LANCZOS) for f in fr]
# one palette for the whole loop (median cut over a strip of all frames), each frame dithered to it — no flicker between frames
strip = Image.new('RGB', (ims[0].width, ims[0].height * 6)); [strip.paste(ims[i * 8], (0, ims[0].height * i)) for i in range(6)]
pal = strip.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
q = [im.quantize(palette=pal, dither=Image.Dither.FLOYDSTEINBERG) for im in ims]
q[0].save(f'out/card-{name}.gif', save_all=True, append_images=q[1:], duration=round(1000 / 22), loop=0, optimize=False, disposal=1)
print(len(q), 'frames', ims[0].size, os.path.getsize(f'out/card-{name}.gif') // 1024, 'KB')
