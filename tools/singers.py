# Who sings each LRC line? Timbre per line from the Demucs vocal stem (MFCC stats + F0 over voiced frames),
# a leave-one-out logistic model trained on the LRC's own tags (Kaguya vs Yachiyo), plus a two-voice check
# (how much energy sits in a second, non-harmonic pitch track) to spot unison/harmony lines.
import re, json, numpy as np, librosa
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
sr=22050; hop=256
v=librosa.load('cache/demucs/htdemucs/song/vocals.wav', sr=sr, mono=True)[0]
lines=[]; cur=None
for raw in open('audio/wim_cpk.lrc', encoding='utf-8'):
    m=re.match(r'\[(\d+):(\d+\.\d+)\](.*)', raw.strip())
    if not m: continue
    t=int(m[1])*60+float(m[2]); txt=m[3].strip()
    tag=re.match(r'【(.+?)】(.*)', txt)
    if tag: lines.append({'t':t,'tag':tag[1],'ja':tag[2].strip()})
    elif lines and abs(lines[-1]['t']-t)<1e-3: lines[-1]['zh']=txt
for i,l in enumerate(lines):
    l['t1']=min(lines[i+1]['t'] if i+1<len(lines) else l['t']+6, l['t']+7)
# the two first lines share 0.00 in the LRC; the hook is sung 0.8–4.5 and 4.5–10
f0,vf,_=librosa.pyin(v, fmin=150, fmax=1100, sr=sr, frame_length=2048, hop_length=hop)
M=librosa.feature.mfcc(y=v, sr=sr, n_mfcc=20, hop_length=hop)
cen=librosa.feature.spectral_centroid(y=v, sr=sr, hop_length=hop)[0]
flat=librosa.feature.spectral_flatness(y=v, hop_length=hop)[0]
rms=librosa.feature.rms(y=v, hop_length=hop)[0]
T=librosa.frames_to_time(np.arange(M.shape[1]), sr=sr, hop_length=hop)
X=[]; info=[]
for l in lines:
    m=(T>=l['t'])&(T<l['t1'])&(rms>np.percentile(rms,40))
    vm=m & np.nan_to_num(vf[:len(m)]).astype(bool)
    if m.sum()<6: m=(T>=l['t'])&(T<l['t1'])
    if vm.sum()<8: vm=m
    feat=np.concatenate([M[1:,vm].mean(1), M[1:,vm].std(1), [np.nanmedian(np.log2(f0[vm])) if np.any(~np.isnan(f0[vm])) else 0, np.log(cen[vm].mean()), flat[vm].mean()]])
    X.append(feat); info.append((int(vm.sum()), np.nanmedian(f0[vm]) if np.any(~np.isnan(f0[vm])) else 0))
X=np.nan_to_num(np.array(X)); y=np.array([0 if l['tag'].startswith('輝夜') else 1 if l['tag'].startswith('八千代') else -1 for l in lines])
sure=np.array(['?' not in l['tag'] for l in lines])
P=np.zeros(len(lines))
for i in range(len(lines)):
    tr=(y>=0)&sure; tr[i]=False
    sc=StandardScaler().fit(X[tr]); clf=LogisticRegression(C=0.3, max_iter=2000).fit(sc.transform(X[tr]), y[tr])
    P[i]=clf.predict_proba(sc.transform(X[i:i+1]))[0,1]
out=[]
for i,l in enumerate(lines):
    p=P[i]; guess='八千代' if p>0.65 else '輝夜' if p<0.35 else '?'
    flag='' if (l['tag'].rstrip('?') in ('輝夜','八千代') and guess==l['tag'].rstrip('?')) else '  <<'
    print(f"{l['t']:7.2f} {l['tag']:5s} p(Y)={p:4.2f} → {guess:3s} f0={info[i][1]:5.0f}Hz n={info[i][0]:4d}{flag}   {l['ja'][:10]}")
    out.append({'t':l['t'],'t1':l['t1'],'tag':l['tag'],'pY':round(float(p),3),'ja':l['ja'],'zh':l.get('zh','')})
json.dump(out, open('audio/singers.json','w'), ensure_ascii=False, indent=1)
