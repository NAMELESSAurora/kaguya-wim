# The film's footage frames (materials/frames/<clip>/<film frame index>.jpg, 1920×1080) are not in the repo: they are cut from the
# user's own copy of the film. This keeps a manifest of them and rebuilds them from it.
#   python3 tools/frames.py manifest   → materials/frames.json  { clip: [first frame, count] }
#   python3 tools/frames.py extract [clip …]   → materials/frames/<clip>/NNNNNN.jpg from materials/film/film.mkv
#     (materials/film/film.mkv: a symlink to the film, 1080p, 23.976 fps; frame k is at k·1001/24000 s)
import json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FR, MAN, DIR = 24000 / 1001, os.path.join(ROOT, 'materials', 'frames.json'), os.path.join(ROOT, 'materials', 'frames')
FF = os.path.expanduser('~/.local/ffbin/ffmpeg') if os.path.exists(os.path.expanduser('~/.local/ffbin/ffmpeg')) else 'ffmpeg'

def manifest():
    out = {}
    for c in sorted(os.listdir(DIR)):
        d = os.path.join(DIR, c)
        if not os.path.isdir(d): continue
        ks = sorted(int(f[:-4]) for f in os.listdir(d) if f.endswith('.jpg'))
        if ks: out[c] = [ks[0], len(ks)] if ks[-1] - ks[0] + 1 == len(ks) else [ks[0], len(ks), ks]
    json.dump(out, open(MAN, 'w'), indent=1); print(len(out), 'clips →', MAN)

def extract(names):
    man, film = json.load(open(MAN)), os.path.join(ROOT, 'materials', 'film', 'film.mkv')
    for c in names or man:
        f0, n = man[c][0], man[c][1]; last = man[c][2][-1] if len(man[c]) > 2 else f0 + n - 1
        d = os.path.join(DIR, c); os.makedirs(d, exist_ok=True)
        subprocess.run([FF, '-nostdin', '-v', 'error', '-y', '-ss', f'{f0 / FR:.6f}', '-i', film, '-frames:v', str(last - f0 + 1), '-q:v', '2',
                        '-start_number', str(f0), os.path.join(d, '%06d.jpg')], check=True)
        if len(man[c]) > 2:      # (a clip with gaps keeps only its listed frames)
            keep = set(man[c][2])
            for f in os.listdir(d):
                if int(f[:-4]) not in keep: os.remove(os.path.join(d, f))
        print(c, f0, n)

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'manifest'
    manifest() if cmd == 'manifest' else extract(sys.argv[2:])
