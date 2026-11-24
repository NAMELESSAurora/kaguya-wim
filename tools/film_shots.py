# Per-shot stats for the whole film from the 360p proxy: decode to 96x54 RGB, per-frame luminance change (motion, 0-255
# scale as in pv-mad-motion), brightness, saturation and a coarse hue; shots from ffmpeg's scene cuts (cache/film/scenes.txt).
#   ~/.local/qwen/bin/python tools/film_shots.py  → cache/film/frames.npz, cache/film/shots.json
import subprocess, re, json, numpy as np, os
W,H=96,54; FPS=24000/1001
cmd=[os.path.expanduser('~/.local/ffbin/ffmpeg'),'-v','error','-i','cache/film/proxy360.mp4','-vf',f'scale={W}:{H}:flags=area','-f','rawvideo','-pix_fmt','rgb24','-']
p=subprocess.Popen(cmd,stdout=subprocess.PIPE); fs=W*H*3
lum=[]; mot=[]; sat=[]; hue=[]; prev=None
while True:
    b=p.stdout.read(fs)
    if len(b)<fs: break
    f=np.frombuffer(b,np.uint8).reshape(H,W,3).astype(np.float32)
    L=f@np.array([0.299,0.587,0.114],np.float32)
    mx=f.max(2); mn=f.min(2); s=(mx-mn)/(mx+1e-3)
    r,g,bb=f[...,0],f[...,1],f[...,2]
    hh=np.degrees(np.arctan2(np.sqrt(3)*(g-bb),2*r-g-bb))%360
    w=s*(mx>40)
    hue.append(np.histogram(hh,bins=12,range=(0,360),weights=w)[0])
    lum.append(L.mean()); sat.append(s.mean()); mot.append(0 if prev is None else np.abs(L-prev).mean()); prev=L
lum=np.array(lum); mot=np.array(mot); sat=np.array(sat); hue=np.array(hue)
np.savez_compressed('cache/film/frames.npz',lum=lum,mot=mot,sat=sat,hue=hue)
cuts=[0.0]+[float(m) for m in re.findall(r'pts_time:([\d.]+)',open('cache/film/scenes.txt').read())]+[len(lum)/FPS]
names=['red','orange','yellow','lime','green','teal','cyan','azure','blue','violet','magenta','pink']
shots=[]
for i in range(len(cuts)-1):
    a,b=int(round(cuts[i]*FPS)),int(round(cuts[i+1]*FPS))
    if b-a<2: continue
    hh=hue[a:b].sum(0); m=mot[a+1:b]
    shots.append({'i':len(shots),'t0':round(cuts[i],3),'t1':round(cuts[i+1],3),'dur':round(cuts[i+1]-cuts[i],2),
      'motion':round(float(np.median(m)) if len(m) else 0,2),'motion_p90':round(float(np.percentile(m,90)) if len(m) else 0,2),
      'lum':round(float(lum[a:b].mean()),1),'sat':round(float(sat[a:b].mean()),3),
      'hue':names[int(hh.argmax())] if hh.sum()>0 else 'grey','hue2':names[int(np.argsort(hh)[-2])] if hh.sum()>0 else 'grey'})
json.dump(shots,open('cache/film/shots.json','w'),indent=0)
d=np.array([s['dur'] for s in shots]); print(len(shots),'shots; median',np.median(d),'s; frames',len(lum))
