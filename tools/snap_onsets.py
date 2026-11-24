# kaguya-wim lyric timing pass 2 (from tell-me-mv v6.4 pass 3) (the user: "歌词的时间轴与演出效果和演出跟随还需要深度优化"): each syllable's start (a CJK character, or a
# Latin word) in audio/timing_v6.json is snapped to the nearest clear onset of the vocal stem within ±0.14 s (spectral-flux peaks over the
# local median), keeping the order; a Latin word's letters move with it. Lines [first..last]; the rest copied.
#   ~/.local/qwen/bin/python tools/snap_onsets.py [first last]   → audio/timing_snap.json
import json, sys, numpy as np, librosa
T0 = json.load(open('audio/timing_v2.json', encoding='utf-8'))
first, last = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1, len(T0))
T = T0
y, sr = librosa.load('cache/demucs/htdemucs/song/vocals.wav', sr=22050, mono=True)
hop = 220; fps = sr / hop
env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop, aggregate=np.median)
pk = librosa.util.peak_pick(env, pre_max=4, post_max=4, pre_avg=12, post_avg=12, delta=0.35, wait=6)
pt = pk / fps; ps = env[pk]
loc = lambda t: np.median(env[max(0, int((t - 1) * fps)):int((t + 1) * fps)])
import os
out = json.load(open('audio/timing_v2.json', encoding='utf-8'))      # (the other lines kept as they are)
moved = []
for n in range(first, last + 1):
    L = T[n - 1]; chars = [list(c) for c in L['chars']]
    # units: (start index, end index exclusive)
    units, i = [], 0
    while i < len(chars):
        c = chars[i][0]
        if not c.strip(): i += 1; continue
        if ord(c[0]) > 0x2e80: units.append((i, i + 1)); i += 1; continue
        j = i
        while j < len(chars) and chars[j][0].strip() and ord(chars[j][0][0]) <= 0x2e80: j += 1
        units.append((i, j)); i = j
    prev = -1e9
    for (a, b) in units:
        t = chars[a][1]; cand = [(abs(p - t), p) for p, s in zip(pt, ps) if abs(p - t) <= 0.14 and s > 1.6 * loc(p) and p > prev + 0.05]
        if cand:
            d = min(cand)[1] - t
            for k in range(a, b): chars[k][1] = round(chars[k][1] + d, 3); chars[k][2] = round(chars[k][2] + d, 3)
            if abs(d) > 0.03: moved.append((n, ''.join(ch[0] for ch in chars[a:b]), round(d, 2)))
        prev = chars[a][1]
    out[n - 1] = {**L, 'chars': chars, 'start': chars[0][1]}
json.dump(out, open('audio/timing_snap.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(len(moved), 'moved'); print(moved)
