# 超かぐや姫! × ワールドイズマイン (CPK! Remix) — fan MV

A fan music video for 『超かぐや姫!』 on 「ワールドイズマイン」 (CPK! Remix, かぐや & 月見ヤチヨ ver.), 3:46, rendered in the browser
with three.js and exported at 2560 × 1440, 60 fps. Every frame is code: the film's own footage set in a space of holo cards,
full-body 立绘, game UI (galgame + a Cytus II-style chart), magic circles, silk banners and bilingual (JA + ZH) lyrics.

Latest master: `out/kaguya-master-1440p60-v3-music.mp4` (not in the repo — see below).

## Layout

| path | what |
|---|---|
| `index.html`, `server.mjs` | the page and its small local server (static files + the export API that writes frames to ffmpeg) |
| `src/space.js` | the engine: planes in 3D (`at(t)` → position, rotation, scale, alpha, texture…), the shader modes (holo SAR cards, card backs, metal, silk, fire, liquid-glass card fusion, the footage look), the backgrounds, rims, post |
| `src/sets/s1.js` | the film: every section as a set of planes with a camera (cold open → intro scroll → verses, choruses, interlude tunnel, runway, memory ring, room of cards, pop-up book, sphere and vortex, outro) |
| `src/sets/parts.js` | canvas-drawn parts (UI windows, HUD, notes, danmaku, banners, the moon dial / magic circle, tapes…) |
| `src/sets/lib.js` | lyrics, beat grid, letters and their entrances |
| `audio/` | the song (48 kHz WAV), the LRC, the line timing (`timing_snap.json` is the one in use), beat grid, sections, singers |
| `materials/` | NovelAI 立绘 and stickers (`nai/`), the holo cards made by `tools/card.py` (`cards/`), image-model ornaments (`gpt/`), Midjourney tone references (`mj/`), creatures cut from the film (`film_cut/`), the official ふわぷち stickers (`fufu_official/`), the picture scroll |
| `materials/frames.json` | the manifest of the film frames the MV uses (clip → first film frame, count) |
| `tools/` | Python tools (cards, stickers, mattes, alignment, contact sheets, frames) and `tools/headless/` (puppeteer snaps and exports), `tools/mux.sh` |
| `fonts/` | OFL fonts (licences beside them) and the subsets used |
| `docs/` | the plans (`PLAN.md`, `PLAN-v2.md`, `PLAN-v3-second-half.md`) and the film's scene index |
| `CLAUDE.md` | the working log: every round of notes and what was built for it |

## Not in the repo

- `out/` — every render (~17 GB; each master is ~2.2 GB, far over GitHub's 100 MB a file).
- `materials/film/` and `materials/frames/` — the film (a symlink to a local copy) and the 1.5 GB of 1080p frames cut from it.
- `cache/` — proxies, the 720p frame set, the Demucs vocal stem, check stills, logs (only `cache/film/shots.json`, `scenes.txt` and
  `wimlive_shots.json` are kept).

## Rebuild and run

1. Put a 1080p copy of the film at `materials/film/film.mkv` (a symlink is fine), then cut the frames:
   `python3 tools/frames.py extract` (all clips; or name some). It reads `materials/frames.json`; frame *k* is at *k* · 1001/24000 s.
2. Start the server: `node --max-http-header-size=4194304 server.mjs` → http://127.0.0.1:5197/ (`?w=854&fps=30` is a light draft,
   `?w=2560` the 1440p master; `from=` / `to=` limit the time range).
3. Stills: `Q="from=0&to=226" node tools/headless/snap.mjs 12.8,104.8 prefix 1280 1` → `out/snaps/`.
4. Master: `node tools/headless/export.mjs NAME 2560 60 2 0.001 226.03`, then `bash tools/mux.sh NAME 0.001 60` adds the song
   (AAC 48 kHz) → `out/NAME-music.mp4`. A full 1440p60 render takes about 1.5 h on an M-series Mac.

ffmpeg is expected at `~/.local/ffbin/ffmpeg` (or on PATH); the Python tools use numpy / Pillow (librosa for audio, stable-ts and
Demucs for the timing chain).

## Credits and rights

A non-commercial fan work. 『超かぐや姫!』 and its footage belong to their rights holders; 「ワールドイズマイン」 is by ryo (supercell)
feat. 初音ミク; ふわぷち plush images © Crypton Future Media / SEGA (designed by 三月八日). Characters drawn with NovelAI, ornaments with
ChatGPT's image model, tone references with Midjourney. Fonts under the SIL Open Font License (see `fonts/`). three.js under MIT
(`vendor/three/LICENSE`).
