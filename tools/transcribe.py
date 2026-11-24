# Rough transcription of the vocal stem (section map only; the user's LRC will replace it).
import stable_whisper, json
m = stable_whisper.load_model('large-v3', device='cpu')
r = m.transcribe('cache/demucs/htdemucs/song/vocals.wav', language='ja', vad=False)
segs = [{'t0': round(s.start, 2), 't1': round(s.end, 2), 'text': s.text.strip()} for s in r.segments]
json.dump(segs, open('cache/transcript_rough.json', 'w'), ensure_ascii=False, indent=1)
for s in segs: print(f"{s['t0']:7.2f} {s['t1']:7.2f}  {s['text']}")
