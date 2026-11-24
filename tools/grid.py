# Beat grid from the drum stem: coarse tempo search, strict period/phase fit, kick/snare phase in the bar,
# then per-bar stem energy (drums/bass/other/vocals) to read the sections.
import numpy as np, librosa, json
sr=22050; hop=128; st='cache/demucs/htdemucs/song/'
L=lambda n: librosa.load(st+n+'.wav', sr=sr, mono=True)[0]
d,v,b,o=L('drums'),L('vocals'),L('bass'),L('other'); dur=len(d)/sr; fr=sr/hop
lo=librosa.onset.onset_strength(y=d, sr=sr, hop_length=hop, fmax=160, n_mels=32)
hi=librosa.onset.onset_strength(y=d, sr=sr, hop_length=hop, fmin=1500, n_mels=32)
env=lo+0.5*hi
def sc(e,P,ph,a=5,bb=None):
    bb=bb or dur-5; t=np.arange(ph+a,bb,P); i=(t*fr).astype(int); i=i[i<len(e)]; return e[i].mean()
best=None
for bpm in np.arange(100,200,0.05):
    P=60/bpm
    for ph in np.arange(0,P,0.004):
        s=sc(env,P,ph)
        if best is None or s>best[0]: best=(s,P,ph)
s,P,ph=best
print(f'coarse best {60/P:.2f} bpm phase {ph:.3f}')
# refine around it and check 2/3, 3/2, 2x relations
for f in (0.5,2/3,1,1.5,2):
    bp=60/P*f
    if 80<bp<260:
        bb=max(((sc(env,60/x,q),x,q) for x in np.arange(bp-0.3,bp+0.3,0.01) for q in np.arange(0,60/x,0.003)))
        print(f'  x{f:.2f}: {bb[1]:.3f} bpm score {bb[0]:.3f} phase {bb[2]:.3f}')
bpm=60/P
kb=[sc(lo,4*P,ph+k*P) for k in range(4)]; sb=[sc(hi,4*P,ph+k*P) for k in range(4)]
print('kick by beat',np.round(kb,2),'snare/hat',np.round(sb,2))
down=ph+int(np.argmax(kb))*P
while down>4*P: down-=4*P
json.dump({'bpm':bpm,'beat':P,'beat0':ph,'downbeat0':down,'bar':4*P,'dur':dur}, open('audio/grid.json','w'), indent=1)
print(f'downbeat0 {down:.3f}, bar {4*P:.3f}s, bars {int((dur-down)/(4*P))}')
db=lambda x:20*np.log10(np.sqrt(np.mean(x**2))+1e-9)
print('\nbar  time   drums  bass  other vocal')
n=int((dur-down)/(4*P))+1
for k in range(n):
    a=int((down+k*4*P)*sr); z=int((down+(k+1)*4*P)*sr)
    if a>=len(d): break
    t=down+k*4*P
    print(f'{k:3d} {int(t)//60}:{t%60:05.2f} {db(d[a:z]):6.1f} {db(b[a:z]):6.1f} {db(o[a:z]):6.1f} {db(v[a:z]):6.1f}')
