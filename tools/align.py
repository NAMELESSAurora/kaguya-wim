# Per-character lyric timing: the user's LRC gives each line's start; Whisper (stable-ts forced
# alignment) on the Demucs vocal stem gives the timing of every token inside the line.
#   ~/.local/align/venv/bin/python tools/align.py [model]
# Reads audio/wim_cpk_ja.lrc + cache/demucs/htdemucs/song/vocals.wav,
# writes audio/timing.json: [{ t0, t1, text, chars: [[ch, t0, t1], ...] }, ...]
import sys, os, re, json
import numpy as np
import stable_whisper, whisper

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LRC = os.path.join(ROOT, 'audio/wim_cpk_ja.lrc')
VOC = os.path.join(ROOT, 'cache/demucs/htdemucs/song/vocals.wav')
OUT = os.path.join(ROOT, 'audio/timing.json')
SR = 16000

lines = []
for raw in open(LRC, encoding='utf-8'):
    m = re.match(r'\[(\d+):(\d+\.\d+)\](.*)', raw.strip())
    if m and m.group(3).strip():
        lines.append([int(m.group(1)) * 60 + float(m.group(2)), m.group(3).strip()])

audio = whisper.load_audio(VOC, sr=SR)
# vocal envelope (10 ms hops) to find where each line's singing actually ends
hop = SR // 100
env = np.sqrt(np.convolve(audio.astype(np.float64) ** 2, np.ones(hop * 3) / (hop * 3), mode='same'))[::hop]
model = stable_whisper.load_model(sys.argv[1] if len(sys.argv) > 1 else 'large-v3', device='cpu')

out = []
for i, (t0, txt) in enumerate(lines):
    nxt = lines[i + 1][0] if i + 1 < len(lines) else t0 + 9
    a, b = max(0, t0 - 0.5), min(nxt + 0.2, t0 + 16, t0 + 2.0 + 0.32 * len(txt))   # kaguya-wim: capped (a long vocal-free tail stalled stable-ts)
    seg = audio[int(a * SR):int(b * SR)]
    plain = re.sub(r'(?<=[^\x00-\x7F])\s+|\s+(?=[^\x00-\x7F])', '', txt)       # (spaces kept between English words only)
    res = model.align(seg, plain, language='ja', vad=False, suppress_silence=True, fast_mode=False)
    words = [w for s in res.segments for w in s.words]
    # spread each token's time over its characters, then map onto the line's characters
    timed = []
    for w in words:
        cs = [c for c in w.word if not c.isspace()]
        n = max(1, len(cs))
        for j, c in enumerate(cs):
            timed.append([c, a + w.start + (w.end - w.start) * j / n, a + w.start + (w.end - w.start) * (j + 1) / n])
    chars, k = [], 0
    for c in txt:
        if c.isspace():
            chars.append([c, None, None]); continue
        if k < len(timed) and timed[k][0] == c:
            chars.append([c, round(timed[k][1], 3), round(timed[k][2], 3)]); k += 1
        else:
            # token text differs (rare): find it a little further on, else leave it to be interpolated
            f = next((j for j in range(k, min(k + 4, len(timed))) if timed[j][0] == c), None)
            if f is not None:
                chars.append([c, round(timed[f][1], 3), round(timed[f][2], 3)]); k = f + 1
            else:
                chars.append([c, None, None])
    # interpolate gaps (spaces, unmatched)
    idx = [j for j, c in enumerate(chars) if c[1] is not None]
    for j, c in enumerate(chars):
        if c[1] is None:
            p = max([q for q in idx if q < j], default=None); n_ = min([q for q in idx if q > j], default=None)
            ta = chars[p][2] if p is not None else t0
            tb = chars[n_][1] if n_ is not None else ta + 0.2
            c[1] = c[2] = round((ta + tb) / 2, 3) if c[0].isspace() else round(ta, 3)
            if not c[0].isspace(): c[2] = round(tb, 3)
    end = max(c[2] for c in chars)
    out.append({'t0': round(t0, 3), 'start': chars[0][1], 't1': round(end, 3), 'text': txt, 'chars': chars})
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(f'{i:2d} {t0:7.2f} -> sung {chars[0][1]:7.2f}..{end:7.2f}  {len(chars)} chars  matched {len(idx)}', flush=True)

json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
np.save(os.path.join(ROOT, 'cache/demucs/env.npy'), env.astype(np.float32))
print('wrote', OUT)
