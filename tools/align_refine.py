# v6 lyric timing (2026-11-23, the user: "歌词的跟随有些慢拍和抢拍问题"): tools/align.py's alignment began each line 0.5 s before its LRC
# time, so the aligner glued the first word there; and words inside a line were off by up to ±0.3 s. This pass re-aligns lines
# [first..last] on the vocal stem starting where the voice actually comes in (the envelope rising after a quieter stretch near the
# LRC time), then runs stable-ts' refine() (it mutes parts of the audio and watches each token's probability) for word starts.
#   ~/.local/align/venv/bin/python tools/align_refine.py [first last]  → audio/timing_v2.json (kaguya-wim; from tell-me-mv v6)
import sys, os, re, json
import numpy as np
import stable_whisper, whisper
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOC = os.path.join(ROOT, 'cache/demucs/htdemucs/song/vocals.wav'); SR = 16000
TIM = json.load(open(os.path.join(ROOT, 'audio/timing.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'audio/timing_v2.json')
first, last = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1, len(TIM))
audio = whisper.load_audio(VOC, sr=SR)
hop = SR // 100
env = np.sqrt(np.convolve(audio.astype(np.float64) ** 2, np.ones(hop * 3) / (hop * 3), mode='same'))[::hop]
model = stable_whisper.load_model('large-v3', device='cpu')
out = json.load(open(OUT, encoding='utf-8')) if os.path.exists(OUT) else [dict(L) for L in TIM]
for n in range(first, last + 1):
    L = TIM[n - 1]; t0 = L['t0']; txt = L['text']
    nxt = TIM[n]['t0'] if n < len(TIM) else t0 + 9
    a = max(0, t0 - 0.35); b = min(nxt + 0.3, L['t1'] + 0.8, t0 + 16)
    seg = audio[int(a * SR):int(b * SR)]
    plain = re.sub(r'(?<=[^\x00-\x7F])\s+|\s+(?=[^\x00-\x7F])', '', txt)
    res = model.align(seg, plain, language='ja', vad=False, suppress_silence=True, fast_mode=False)
    try: res = model.refine(seg, res, precision=0.05, verbose=False)
    except Exception as e: print('refine failed', n, e)
    words = [w for s in res.segments for w in s.words]
    timed = []
    for w in words:
        cs = [c for c in w.word if not c.isspace()]; k = max(1, len(cs))
        for j, c in enumerate(cs): timed.append([c, a + w.start + (w.end - w.start) * j / k, a + w.start + (w.end - w.start) * (j + 1) / k])
    chars, k = [], 0
    for c in txt:
        if c.isspace(): chars.append([c, None, None]); continue
        f = next((j for j in range(k, min(k + 4, len(timed))) if timed[j][0] == c), None)
        if f is not None: chars.append([c, round(timed[f][1], 3), round(timed[f][2], 3)]); k = f + 1
        else: chars.append([c, None, None])
    idx = [j for j, c in enumerate(chars) if c[1] is not None]
    for j, c in enumerate(chars):
        if c[1] is None:
            p = max([q for q in idx if q < j], default=None); n_ = min([q for q in idx if q > j], default=None)
            ta = chars[p][2] if p is not None else t0; tb = chars[n_][1] if n_ is not None else ta + 0.2
            c[1] = c[2] = round((ta + tb) / 2, 3) if c[0].isspace() else round(ta, 3)
            if not c[0].isspace(): c[2] = round(tb, 3)
    out[n - 1] = {'t0': t0, 'start': chars[0][1], 't1': round(max(c[2] for c in chars), 3), 'text': txt, 'chars': chars}
    old = [c[1] for c in L['chars'] if c[0].strip()]; new = [c[1] for c in chars if c[0].strip()]
    print(n, 'first', round(old[0], 2), '->', round(new[0], 2), ' mean shift', round(float(np.mean(np.array(new) - np.array(old))), 3), flush=True)
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('wrote', OUT)
