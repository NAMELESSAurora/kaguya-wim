# Quick song map from the mix: tempo, beat grid, 2-s energy/brightness profile, novelty-based section boundaries.
import numpy as np, librosa, json
sr=22050; hop=256
y=librosa.load('audio/song.wav', sr=sr, mono=True)[0]; dur=len(y)/sr
oenv=librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
for sb in (120,160,200):
    t,b=librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=hop, start_bpm=sb, units='time')
    print('start',sb,'-> tempo',np.round(t,2),'beats',len(b))
tempo,beats=librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=hop, start_bpm=160, tightness=200, units='time')
P=np.median(np.diff(beats)); k=np.round((beats-beats[0])/P)
T0,P=np.linalg.lstsq(np.vstack([np.ones_like(k),k]).T, beats, rcond=None)[0]
print(f'grid {60/P:.3f} bpm, t0 {T0:.3f}, residual p90 {np.percentile(abs(beats-(T0+k*P)),90)*1000:.0f} ms')
rms=librosa.feature.rms(y=y, hop_length=hop)[0]; cen=librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop)[0]
low=librosa.feature.melspectrogram(y=y, sr=sr, hop_length=hop, fmax=150, n_mels=16).sum(0)
t=librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
db=lambda x:20*np.log10(x+1e-9)
print('\n t      rms   low   bright(kHz)')
for s in np.arange(0,dur,2):
    m=(t>=s)&(t<s+2)
    print(f'{int(s)//60}:{int(s)%60:02d} {db(rms[m].mean()):6.1f} {10*np.log10(low[m].mean()+1e-9):6.1f} {cen[m].mean()/1000:5.2f}')
# section boundaries from chroma+mfcc recurrence novelty, snapped to bars
C=librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop*4); M=librosa.feature.mfcc(y=y, sr=sr, hop_length=hop*4, n_mfcc=13)
F=np.vstack([librosa.util.normalize(C), librosa.util.normalize(M)])
bd=librosa.segment.agglomerative(F, 16)
print('\nboundaries (s):', [round(x,2) for x in librosa.frames_to_time(bd, sr=sr, hop_length=hop*4)])
json.dump({'bpm':60/P,'t0':T0,'period':P,'dur':dur}, open('audio/grid_quick.json','w'))
