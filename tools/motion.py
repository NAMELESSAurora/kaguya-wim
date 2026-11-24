# Motion per second of a render (pv-mad-motion §4): mean absolute luminance change between frames at 96 px width (0–255),
# brightness per second, and cuts (a change > 3.5× the local median). python tools/motion.py out/x.mp4 [song-start]
import sys, subprocess, numpy as np, os
f = sys.argv[1]; t0 = float(sys.argv[2]) if len(sys.argv) > 2 else 0
FF = os.path.expanduser('~/.local/ffbin/ffmpeg')
info = subprocess.run([FF, '-i', f], capture_output=True, text=True).stderr
fps = float([x for x in info.split(',') if ' fps' in x][0].split()[0])
raw = subprocess.run([FF, '-v', 'error', '-i', f, '-vf', 'scale=96:-2,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
h = 54 if '854' in info or '1920' in info or '2560' in info else 54
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, 96).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2)); lum = fr.mean(axis=(1, 2))
med = np.array([np.median(d[max(0, i - 6):i + 7]) for i in range(len(d))]); cuts = np.where(d > np.maximum(3.5 * med, 6))[0]
print(f'{len(fr)} frames @ {fps} fps; cuts {len(cuts)} ({len(cuts) / (len(fr) / fps) * 60:.0f}/min)')
n = int(len(fr) / fps)
for s in range(n):
    a, b = int(s * fps), int((s + 1) * fps); c = ((cuts >= a) & (cuts < b)).sum()
    print(f'{t0 + s:6.1f}  motion {d[a:b].mean():5.1f}  peak {d[a:b].max():5.1f}  lum {lum[a:b].mean():5.0f}  cuts {c}')
