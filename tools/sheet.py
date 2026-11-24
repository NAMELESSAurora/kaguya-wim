# Contact sheet from the film proxy: a time range at a given fps, or a list of shot ids (middle frame each), tiled with film
# timecodes (and song time when --song is given for the synced live: song = film - 4826.79).
#   python3 tools/sheet.py range 1:20:18 1:22:10 1 out.jpg        python3 tools/sheet.py shots 2471,2486,2528 out.jpg
import sys, json, subprocess, os, tempfile
FF=os.path.expanduser('~/.local/ffbin/ffmpeg'); PROXY='cache/film/proxy360.mp4'
def sec(s):
    p=[float(x) for x in s.split(':')]; return sum(v*60**i for i,v in enumerate(reversed(p)))
def hms(t): return f"{int(t//3600)}:{int(t%3600//60):02d}:{t%60:05.2f}"
mode=sys.argv[1]
if mode=='range':
    a,b,fps,out=sec(sys.argv[2]),sec(sys.argv[3]),float(sys.argv[4]),sys.argv[5]
    times=[a+i/fps for i in range(int((b-a)*fps))]
else:
    S={s['i']:s for s in json.load(open('cache/film/shots.json'))}
    times=[(S[int(i)]['t0']+S[int(i)]['t1'])/2 for i in sys.argv[2].split(',')]; out=sys.argv[3]
tmp=tempfile.mkdtemp(); files=[]
for k,t in enumerate(times):
    f=f'{tmp}/{k:04d}.jpg'
    subprocess.run([FF,'-v','error','-y','-ss',f'{t:.3f}','-i',PROXY,'-frames:v','1','-vf','scale=320:180',f],check=True); files.append((f,t))
from PIL import Image, ImageDraw
cols=6; rows=(len(files)+cols-1)//cols
sheet=Image.new('RGB',(cols*320,rows*180),'black'); d=ImageDraw.Draw(sheet)
for k,(f,t) in enumerate(files):
    x,y=k%cols*320,k//cols*180; sheet.paste(Image.open(f),(x,y))
    lab=hms(t)+(f'  s{t-4826.79:.1f}' if '--song' in sys.argv else '')
    d.rectangle([x,y,x+8+7*len(lab),y+14],fill='black'); d.text((x+3,y+1),lab,fill='yellow')
sheet.save(out,quality=85); print(out,len(files),'frames')
