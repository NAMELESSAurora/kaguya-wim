# kaguya-wim — 超かぐや姫! × ワールドイズマイン CPK! Remix fan MV

Plan: docs/PLAN.md (v1, 2026-11-23, concept 《五つの難題》: five chapters = the five impossible requests of 竹取物語 fused
with the song's own demand list; each chapter one world / one style; penlight colour = whose world it is).

## Audio
- audio/song.wav — the user's WAV (かぐや & 月見ヤチヨ ver., 226.03 s, 48 kHz stereo).
- Stems: cache/demucs/htdemucs/song/{drums,bass,other,vocals}.wav (htdemucs via ~/.local/align/venv).
- Grid (tools/grid.py, drum stem): 118.000 BPM, beat 0.5085 s, bar 2.034 s, first downbeat 0.736 s → audio/grid.json.
  Drums drop out entirely in bars 22–25 and 56–59 (pre-choruses), softer in the bridge (bars 80–88); bar 79 is vocal-silent.
- Sections: audio/sections.json (rough line times from a Whisper pass, cache/transcript_rough.json — for mapping only,
  replace with the user's LRC; never paste lyrics into docs).

## Film (the user's full 1080p source, 2026-11-23)
- materials/film/film.mkv → symlink to ~/Downloads/Cosmic.Princess.Kaguya.2026.1080p.NF.WEB-DL.x264.DDP5.1.mkv (2:22:03, 23.976 fps).
  Never copy it; cut clips from it with ffmpeg -ss … -i materials/film/film.mkv.
- cache/film/proxy360.mp4 (640×360 proxy for sheets), scenes.txt (ffmpeg scene cuts > 0.22), shots.json (tools/film_shots.py:
  3813 shots with motion / lum / sat / hue), frames.npz (per-frame stats at 96×54).
- Subtitles: cache/film/sub_zh.srt (Simplified), sub_ja_sdh.srt, sub_ja.srt, sub_en_sdh.srt; zh_compact.txt one cue per line.
  docs/film-index.md = timecoded plot + scene index (written from the subtitles).
- SYNC: the film's World is Mine live uses this exact track: film 4826.79 s (1:20:26.79) = song 0:00, valid to song ≈ 99.4
  (film 1:22:06, black frame, then the next song on a teal stage). cache/film/wimlive_shots.json lists those shots with song times.
  Singing close-ups are only used at their synced song time.
- tools/sheet.py: contact sheets from the proxy (range at fps, or shot ids; --song labels synced song time).

## Lyrics
- audio/wim_cpk.lrc (the user's, JA + ZH, 57 lines, speaker tags 【輝夜】【八千代】【合唱】 not guaranteed) → wim_cpk_ja.lrc.
- audio/singers.json: resolved voice per line (K / Y / KY, '?' = ask the user) with evidence (film lip-sync, timbre model
  tools/singers.py). Colours: K gold, Y silver-white, KY teal (= Miku = the song itself).
- Timing chain: tools/align.py (stable-ts per line, windows capped — a long vocal-free tail stalled it) → audio/timing.json →
  tools/align_refine.py (re-align from LRC − 0.35 s + refine) → timing_v2.json → tools/snap_onsets.py (±0.14 s to vocal onsets)
  → audio/timing_snap.json (use this one).

## Tools / env
- ffmpeg: ~/.local/ffbin/ffmpeg (not on PATH).
- Python: ~/.local/qwen/bin/python (librosa, numpy), ~/.local/align/venv/bin/python (demucs, stable_whisper).
- Engines to fork (PLAN §10): ~/Documents/tell-me-mv (space.js, flat.js, FX, headless render, splice.sh, jerks.py),
  ~/Documents/wont-let-you (type as architecture), ~/Documents/dunhuang-ascii (ASCII renderer).

## References looked at
- Official MV g6yAXqs7GpQ: two still illustrations, pink/red monochrome, circle frames, giant type — avoid overlap.
- Film live scene rXcPRKriVsI: black arena, hot-pink ring lights, teal lasers, penlight sea, mirror ball; Kaguya blonde
  twin tails, Yachiyo silver-white, Iroha dark violet hair with keyboard.
- CGWORLD interviews (cgw331-chokaguyahime01/02): real world comic-like vs Tsukuyomi CG-like; Kyoto-like neon city,
  glowing fish, falling ASCII on a pink grid stage, bamboo particles, KASSEN cel-shaded low-poly stage, torii, lanterns.

## Rules
Apply the standing MV rules in memory (mv-feedback): no freezes / reverses / rewinds, no shake as beat (≤1 % kick),
every sung word on screen on its syllable, bilingual pairing designed, sticker cut-outs, no dense dot screens,
few white flashes, 1440p60 + 48 kHz AAC, re-render only changed shots.

## Engine (2026-11-23, sample build)
- Run: session launch.json entry "kaguya" (node --max-http-header-size=4194304 kaguya-wim/server.mjs, port 5197).
  `?w=854&fps=30` draft, `?w=2560` 1440p60. Hooks: `__film.render(t)`, `__film.snap(t, name, width, samples)`,
  `__film.export({ name, from, to, samples })` → out/<name>.mp4; then `tools/mux.sh <name> <from> <fps>` adds the song.
- src/space.js: forked from 《澪標》's paper space (skies removed). Added: plane `footage(t)` → frame URL (frames loaded by
  `stage.prepare` before a frame is drawn, small cache), `st.key` (hair key: hue band → colour, `region` limits it),
  `st.crt` (scanlines / mask / fringe — footage only), mode 6 holo foil and mode 7 chrome through alpha, `st.order` (Euler order),
  set `extras` (three.js objects with update(t): penlight sea, lasers). src/film.js: shutter samples + bloom, CA, the moon's
  glitch (set.post(t) → { bloom, thr, ca, glitch, grain, vig, flash, sat, lift }).
- src/sets/lib.js: forked from 《澪標》 (palette per world, singer colours K gold / Y silver / KY teal, 118-BPM grid, pulse(),
  lyrics() from audio/lines.json + timing_snap|v2|timing, letters() + 'scramble' entrance). src/sets/parts.js: canvas UI parts
  (placeholders for the ChatGPT props: phone, stickers, candies). src/sets/s1.js: the sample (A phone / B booth / C live).
- Footage frames: materials/frames/live (film 4850–4915 s, 720p JPG, file = film frame index, song t → floor((t+4826.79)·24000/1001)),
  r1 r2 r3 (house-rules clips). Never hold a frame: a plane shows footage only while its clip runs.
- audio/eq.json: 16 mel bands at 60 fps with meter ballistics (the broadcast EQ in the live window).
- tools/motion.py: motion / cuts per second of a render (pv-mad-motion §4). tools/tile.py: contact sheets of snaps.
- References to apply (the user, 2026-11-23: "记得多学习应用这两条视频的手法"): ~/Downloads/1172498953.mp4 (duotone GMV) and
  187964037.mp4 (vertical illustration MAD) = skill pv-mad-motion references/case-gmv-duotone-type.md, case-illustration-mad-vertical.md.

## Round 2 notes (2026-11-23, the user's answers after draft 3)
- Singers by ear: 0:50.6 Y, 1:51.4 Y, 2:47.7 K (Yachiyo just before, nearly seamless), 3:05.9 K, 3:26.8 both → audio/singers.json, lines.json.
- "日文歌词和中文翻译的演出能不能做一个fusion，现在就像是电影字幕一样": s1.js glossLine(kit, L, o) + audio/gloss.json (index map
  [jaFrom, jaTo, zhFrom, zhTo] per phrase; numbers only). One device per section: A = chips inline after each phrase (other row below
  the screen when it wraps), その三 = chat bubbles; B = purikura label stickers under each phrase (PT.labelStk), かわいい with a
  sticker; C = the stream window's title bar types every line's Chinese (fixed anchor), the poster has both languages at poster
  scale, the 「いますぐによ」 stamp carries its gloss inside. Never two subtitle rows again.
- "全片多用我给你发的两条视频（最主要的学习对象）以及'像笨蛋一样'的PV还有MAD的手法": added scramble letters, giant daiji numeral
  behind the phone, UI punctuation frames, purikura 2×2 looks, per-beat ground flips, objects through words, star → glasses match,
  duotone flips, EQ, hook-word wallpaper rows, bands of one moment, square-by-square window reveal.
- Materials: "需要人物贴纸以及做新的shader，贴纸就用NAI做图然后抠成pop sticker，shader就用MJ做定调图然后照着MJ的图写shader";
  "Y2K的素材可以设计的futurism一些，因为本身电影设定是2030年" → materials/prompts.md (MJ tone refs, NAI sticker poses, GPT props).
  tools/cut.py, popsticker.py, split_alpha.py copied from tell-me-mv (run with ~/.local/matte/venv/bin/python -I).
- tools/headless/export.mjs <name> [w fps samples from to]: headless export when the pane is busy (scripts in every tab pause while a
  sign-in popup is open).

## Round 3 (2026-11-24)
- Grounds from the Midjourney tone references (materials/mj, materials/prompts.md "Round 3"): space.js bg shader kinds 1 ribbons / 2 glitter /
  3 arena, chosen by set.ground(t) → { kind, a, pulse }, with a little parallax from the camera. `?bgonly` = the ground alone.
- Figures: materials/nai/cut (borderless). stickerSeq = full figures as key shots in the world; peek(kit, camFn, keys, o) = half-body
  close-up inserts held in the camera frame (pass the set's fov). In set C they sit under the lyrics (order 7.6).

## Round 4 (2026-11-24, the user's notes on draft 6)
1 "ground shader特别是建筑背景很粗糙" + "shader还是不要做这种具体的场景吧，包含建筑的用shader写太复杂了" → grounds are ABSTRACT only (ribbons, glitter
  haze, night gradient + beams + round stars + bokeh); no buildings, skylines or crowds in a shader.
2 "人物立绘存在被压扁的情况" → pops are uniform (no squash/stretch); peek() had an aspect bug (width × a0 twice) — fixed.
3 "部分人物立绘边缘因为图源边缘是被截断的直接用进画面会显得很奇怪" → materials/nai/cut/edges.json (side cuts per drawing, from the
  original canvas): a drawing cut on one side bleeds off that edge of the frame (peek); cut on both sides, or a full figure cut at a side, stands
  in a holo photo card whose sides are the cut lines, head popping out above (PT.cardTex / cardRimTex, label per world). Bottom cuts sit below
  the frame. Never show a raw canvas cut.
4 "中文字体可以找更可爱的字体" → ChillRound F Bold (寒蝉圆黑, OFL) for chips, title bar and poster Chinese; Xiaolai (小赖, OFL) for the booth's
  handwritten label; both subset to cache/zh_chars.txt (fonts/*-sub.ttf; regenerate with ~/.local/align/venv/bin/python -m fontTools.subset if
  lyrics change). Huninn lacks simplified characters.
5 "整体演出设计缺少给你参考的案例的空间感和立体感" → glossLine takes rot (rows as receding walls / lying on the floor); cameras orbit and
  tilt (A round the phone, B pulled back round the booth panel with an edge, C round a window that turns toward each line); singers behind
  the phone (order below it) and in front; その三 letters fly in from scattered depth; poster type in perspective; sweets pass close to the lens.

## Round 5 (2026-11-24) — holo cards + the two PVs' space and layers
- Study: the user named two "高价值学习目标…有空间感和极强层次感": the Fate/strange Fake MAD (BV1AKhU6pEbP) and the 「バカみたいに」 PV
  (b23.tv/7bKPUuI = BV1WS456JEXS). Notes: ~/.claude/skills/pv-mad-motion/references/case-space-layers-fsf-baka.md; sheets cache/refstudy/.
  Taken: plant things BETWEEN depth planes (something passes in front of the word), 5+ layers of different kinds, real 3D objects as
  accents (a chip thrown at the lens, a ring round the subject), micro text as a structure layer.
- SAR holo cards (the user: "人物立绘其实可以做有质感的卡片，可以用生图工具制作卡片的背景图" + a pasted Pokémon SAR/UR card spec):
  card art from NovelAI (materials/nai/cardbg_{A,B,C}{1,2}.png — Midjourney was blocked by a username dialog the user has to answer);
  tools/card.py (OpenCV/Pillow) → materials/cards/<fig>_face.png + _fx.png (R holo · G foil · B figure · A line) + .json (etch style,
  metal, glint anchors); the figure is never redrawn. space.js plane mode 8 = the moving light (tilt from the card's normal against
  the camera: two-film rainbow screened over the art, etched cosmos/silk/radial pattern, foil, Sobel emboss, glare band, spotlight,
  four-point glints, angle-lit bevel). s1.js holoCard(): 8 metal slices + back, orbit tilt (Y ±17.5°, X ±10.5°), flip-in, a spin per
  pose change, sparks front/back, o.move / o.pos / o.orderAt (st.order: a plane may change layer per frame). ?card=NAME = the card alone;
  tools/card_gif.py → out/card-NAME.gif (460 px, 48 frames @ 22 fps, median cut + Floyd–Steinberg).
- In the sample: the singers are cards (behind the phone, stuck on the booth, in front of かわいい); a ring of five cards orbits the stream
  window on 「世界で一番おひめさま」; the last two fly at the lens; micro labels (HOUSE RULE 0n / 03, TSUKUYOMI · ID …, PURIKURA ★ 2030).
- Fixes after the user's note (2026-11-24, "折叠屏刚展开时的取景中缝有绿线闪烁，然后有些取景框的画面超出边框"): the phone pictures'
  green-screen fill is keyed to dark glass (materials/gpt/zflip_{lid,body}_glass.png) and the lid's screen half overlaps the crease by
  OV; everything placed on the stream window goes through winPt() (offsets turn with the window); the booth's footage slides in with
  it (boothX); photo-strip cells' offsets turn with the strip. Lyric timing now comes from audio/timing_snap.json (the align → refine →
  onset-snap chain finished 2026-11-24; line starts unchanged, syllables moved ≤ 0.4 s; line 11 still from timing_fix.json).

## Round 6 (2026-11-24) — chorus energy through card animations ("卡牌加入演出可以做的更有设计感一些，例如设计一些卡牌动画")
Set C, one card move per line, on its syllables (s1.js, after the close-up inserts):
- 世界で一番おひめさま: gacha pull — five cards orbit the window face-down (holoCard o.reveal), one turns per syllable of おひめさま with
  burst() (rays + bloom) and a two-frame post flash (FLASH); then the ring flies outward past the lens.
- 気が付いて ねえねえ: four cards dealt into a fan, one a half-beat; each 「ねえ」 pokes an outer card at the lens.
- 待たせるなんて論外よ: a flipbook deck flicking in sixteenths; on 論外よ it explodes past the lens (+ burst, flash).
- わたしを誰だと思ってるの？: a 10×4 wall of her cards (cardFace: light face + back, no edge) behind the window, turning in a diagonal
  wave on every beat.
- あまいものが食べたい！: 20 cards tumble with the sweets (two in three in front of the window); a big card slams in on 食べたい.
Engine: st.layer (not st.order — that is the Euler order!) lets a plane change draw layer per frame.
- Round 7 (2026-11-24, notes on draft 9): "取景超出边框" → the booth's footage is cropped to the window's shape (it was cover-fitted wider).
  "引入卡牌设计的初衷是给这样的半身像做一个卡牌来掩盖一下画面不完全的瑕疵…卡牌演出做的要灵动精致" → every half-body is a full holo card
  (tools/card.py half mode: drawing wider and taller than the card, head near the top, every cut outside it) held in the camera's frame
  (camFrame + holoCard o.frame) by cardInsert(): entrances rise / toss / spin / flip with a glare sweep and a settling wobble, exits
  drop / flipaway / slide. peek() (raw cut-outs) is no longer used.
- Round 8 (2026-11-24, "卡牌的晃来晃去的展示太简单了，有些审美疲劳"): no idle wobble — holoCard idle = hold + SNAP to the next of five poses
  on each hit (o.hits, default every other beat), the light running across on the snap ('float' kept only for the GIF showcase).
  Cards are three layers (tools/card.py _bg / _fig / _top + fx maps): art and figure clipped to the window, figure 0.035 and the metal
  rim + frame + plate 0.06 card-heights in front (lenticular depth inside an opaque rim); edge slices span from the rim back past the art.
  Clean full figures stand free again (stickerSeq): KD_peace/heart, KD_jump, YK_point/whisper, YK_twirl/kiss, KC_heart; cards stay for
  half-bodies, cut drawings and the chorus moves.
- Round 9 (2026-11-24, notes on draft 11 — "现在演出效果很棒也很酷"): card order bands (each card's planes within ±0.008 of its order,
  neighbours ≥ 0.03 apart: no 穿模); `round` (world units) rounds every viewfinder (phone 0.13, booth 60 px, stream 0.12, strip, jump-out);
  the phone is ONE glow / ONE footage screen across the crease once open (two halves only while the lid moves); the full-frame 2-frame
  「メール受信中」 insert (read as a solid bad frame) → a notification banner sliding over the screen (PT.notifTex); card back =
  tools/card_back.py (guilloche, starburst, moon emblem, rim; lit in mode 8 via back.card), prismatic walls (mode 6 per slice) on every card
  incl. cardFace; thicker cards (0.024); anti-aliasing: 4× MSAA stage target + 2 jittered samples in drafts; scramble pool without ■●▲◆.
  Whole-film plan v2: docs/PLAN-v2.md (card system, depth rules, four references mapped to sections).

## Round 10 (2026-11-24) — the opening built; notes on draft 12
- Cold open + intro (s1.js `opening()`, sets 0 → bar(5) and bar(5) → 28.6): a live card (card back · LIVE face = synced footage inside the
  LIVEFRAME rim · TITLE face; `backEuler` for the back plane) turning on 「世界で一番」 and on the drums; 「WORLD / IS / MINE」 outline slam;
  signal rings; L1/L2 glossLine (scramble / flap). The intro: tools/emaki.py scroll (gold leaf, suyari clouds, brocade) with five windows
  (r4–r7 story clips + synced live; frames/live now from song 0:00), five treasure cards TR1–TR5 (NovelAI still lifes, UR frame) presented
  face-down → reveal → WISHLIST slots (PT.wishTex), the shell card becomes the phone at the cut. Night ground = space.js kind 4 (abstract).
  tools/title_card.py (deep lilac ground, chrome wordmark, seal). Render the whole sample with from=0.001.
- Notes on draft 12: hair key region widened to [0.3, 1] and feathered (it was cut at the old crease); mode 9 MATERIAL (bevel from the
  part's own alpha, light from its tilt, gloss, pearl film, glare line, grain) on frames, booth, stream window, labels, banner, strip,
  button, phone body/lid (MAT presets in s1.js); the hand of cards is choreographed (deal on arcs with a turn, open into a fan about a
  pivot, beat ripple, pick toward the lens on each ねえ, close and slide away); cards in frame styles per character (tools/card.py 7th arg:
  sar · ur · neon · pearl, rarity badge): Kaguya gold SAR, Kaguya concert UR, Yachiyo pearl, Iroha violet neon. Iroha (tag
  `sakayori iroha (cho kaguya-hime!)` + look) and six more half-bodies; IK_walk unused (came with a bush). plane() now passes every option.

## Round 11 (2026-11-24) — notes on draft 13
- Cardistry / magic in the choreography ("卡牌演出可以多学习应用一些花切或者魔术"): the cold open's SPRING (the deck springs 24 backs in an arc
  toward the scroll), the colour-change wipe (`st.wipe`), the vanish (dissolve run backwards + burst), FAN SPIN on the second ねえ, the Sybil
  cut (5 packets, `cardFace` with walls) and its explosion.
- Card backs ("卡牌背面…最好是动态shader制作的" → "卡牌的背面也可以用生图模型制作图案，然后用shader写星空质感附加在图案上"): NovelAI patterns
  (materials/nai/cardback_{1,2,3}.png, 0 Anlas) → tools/card_back_art.py crops them to their own frame (margin sampled at the edges'
  midpoints) → materials/cards/back_art3.png ('night', singers) and back_art2.png ('sun', the treasures). space.js **mode 10** lays a
  living night over the art: nebula, dust, glint stars and a shooting star in its dark sky; holo film + foil flare on its gold by the tilt;
  a light running round the engraved rings; a ring and the emblem's glow on every beat; glare band; bevel. `cardBack(kit, 'night'|'sun')`
  returns { tex, mode 10, card: { ctr, rr } } (uMat = emblem centre/radius), `still` (old back.png) for the prism walls.
- Viewfinders "没有画面": the `edge` box had a FRONT face that filled every window cut in a frame (the booth) with flat colour → edges are
  the box's four sides only. The cold-open card's pale close-up was blown white by the bloom → footage col 214/208/226, thr 0.8.
- The opening's Yachiyo footage in full frame ("可以靠多张卡平铺来实现原视频素材的全画幅展现"): the card is a DECK — on 「世界で」 it deals into a
  5 × 2 wall of cards (TH 2.6, card aspect × 5 ≈ 16:9) whose windows each show their own crop of the synced live; beat ripple across
  the wall, the wall turning a little; gathers into the one card on the drums (turn → TITLE), deals again on bar 3 (split-flap turns),
  gathers face-down at 9.3 and springs. The card is hidden while the wall stands (`hiddenAt`).
- The intro richer ("更精彩精致…整体效果要华丽，素材可以多有设计感的堆砌"): layered collage per mv-collage-layering — moon dials
  (PT.dialTex: 和時計/astrolabe, 子…亥, phases, running type; mode 9 metal) at two depths in the cold open and far behind the scroll; light
  rays; a Saturn-tilted orbit of 12 living backs round the title card (near half passes below her face; `cardFace` o.layerAt); a ghost 「月」;
  foreground glitter out of focus; gold suyari cloud bands (PT.kumoTex) at four depths sliding at their own speeds; falling cut-gold flakes;
  the scroll's brocade cover with a 題簽 「竹取絵巻」 and its gold roller (PT.emakiCoverTex / rollerTex); each treasure's name on a lacquer
  短冊 (JP column gold, ZH column beside it) with a big outline numeral 壱…伍 behind the card. Pivot note: `pivot [0.5, 0]` anchors the TOP.
- Phone seam while unfolding: the halves show one lock-screen wallpaper (PT.lockTex) as two adjacent crops (mode 0) — the old mode 6
  foil was computed per half and could not meet at the crease.
- Chinese subset fonts regenerated with the treasure glosses (full fonts in the session scratchpad fontdl/; previous subsets in cache/*.prev.ttf).

## Round 12 (2026-11-24) — notes on draft 14; the whole film begins (draft 15 = 0:00–1:38.4)
- 图层分离: holoCard's layers stood 3.5 % / 6 % of the card's height in front of the art and the slices spanned 8 % more → DF 0.002,
  DT 0.004, slices from −DT (draw order layers them; depth is only the card's thickness).
- Exposure: finishing pass `exp` (default 0.92, per set via post) and a soft shoulder above 0.8 (0.7 flattened pastel art).
- THE HAZE over the booth ("取景框没有画面"): boothTex and stripTex cut their windows with `destination-out` while the fillStyle was still
  the dots' 45 % / 35 % white → a 55 % / 65 % pastel veil over the live. Always set an opaque fillStyle before a destination-out cut.
  (Also: the `edge` box is now sides only — its front face had filled framed windows.)
- 1440p readiness (the user: "最终成片要用1440p高帧率输出…会不会有像素不够的风险"): footage re-extracted at 1080p (materials/frames,
  the 720p set in cache/frames720; frame cache cap 150→100); parts.js canvases and glyphs draw at kit.RES (2 when W > 2000; ?res=)
  through kit.vcanvas / text, mode 9 bevel scaled by userData.res; footage is sampled at the frame's own time in every shutter sample
  (blending two film frames ghosted it). Image-model art at 1440p: scroll panels ≈1.4× (Lanczos for now), GPT phone props 1.5× —
  a model upscaler (Real-ESRGAN) needs the user's OK to download.
- Title card v3 (tools/title_card.py; v1/v2 kept): NovelAI duo art (title_duo_2: Kaguya & Yachiyo cheek to cheek) melting into a pastel
  panel, candy sticker logo, starburst CPK! badge, mint credit pill, 「超かぐや姫!」 tag; TITLE.json amt 0.45 (cards may carry `amt`).
- Picture scroll v2 (tools/emaki2.py): NovelAI yamato-e panels emaki_1–4 (bamboo · palace · river · the envoys) on washi between kinran
  brocade (brocade_1), 8192 × 1148; cover (表紙) with 題簽 and 八双, the cord, the end roller (emaki_cover / emaki_cord / emaki_roll).
- Yachiyo's close-up (smirk → WINK, song 12.0–13.6; the user: "intro原片八千代的“よね”这一段演出是经典") shown whole on a card wall
  dealt in front of the scroll (sparkle at her eye at 13.22), gathered into the treasures' deck; treasures moved to bars 7–11.
- `tileWall(kit, back, o)`: reusable wall of cards showing one picture (segs, deck, srcAt per tile, extra turns, bursts); gathers are a
  scoop (into an overlapping ribbon spread, then squared). The spring is one ribbon (40 cards on one arc, turning over in a wave).
- Viewfinder 质感: `uScr` screen layer on every rounded footage window (inner shadow from the frame, glass sheen sliding with the
  window's tilt, fine dust).
- Interlude built (s1.js `interlude`, bar 41 → 48): dive card (film 23:42 dive) → tunnel of card rings (one a beat, turning over as
  they come, rings of light) → neon signs 「イェエー!」/「ヘイベイビー」 (PT.neonSignTex, JA + ZH tubes) → HEY BABY letter ring →
  city wall (tileWall, columns turning to the next film shot every 2 beats: city 25:37–25:51, festival 26:08–26:24, torii 23:48/23:58)
  → scoop into the deck. Clips i_* in CLIPS. Render with `… export.mjs NAME 854 30 2 0.001 98.38`.

## Round 13 (2026-11-24) — notes on draft 15 (draft 16 = 0:00–1:38.4)
- Rounded viewfinders everywhere: the live stream frame's inner cut (31 px = the footage's 0.12), the scroll window rims (holoframe3:
  84 px + a hairline), purikura cells (round 0.16, no longer torn), the chorus duotone bars (0.05). Footage planes with `round` get the
  screen layer automatically.
- Effects ("图一的特效要做的更精致…“特效”除了rays，还有其他类似的用svg搓的特效"): space.js **mode 11** = procedural burst (fine rays in three
  angular frequencies of uneven length, white-hot core, chromatic halo ring, anamorphic streak, twinkling dust; adds light) — burst()
  uses it, and the cold open's light behind the title is mode 11 held open. **Mode 12** = the drawn effects redrawn: textures tagged by
  parts.js `tagFx` (sparkTex 'spark', ringTex 'ring' (+lw), mangaTex 'manga', bokehTex 'bokeh') are drawn by mode 12 wherever a plane
  uses them as a flat ink (mode 1; `st.flat` keeps the old look): sparkle with long thin chromatic spikes + diagonals + core · ring as a
  luminous line with a fine fringe, white core, soft glow, light running round · bokeh aperture disc with a rim · 漫符 as glossy stickers.
- Night ground (kind 4) rewritten: milky way with dust lanes and its own stars, two nebula depths, three star layers (bright ones
  with diffraction spikes and colour), moon with a chromatic halo and soft rays, shooting star every 9 s, dither.
- NovelAI Upscale (the user: "如果nai的素材需要超分，可以花积分直接用nai的upscale"): in the NAI image page select the image in History,
  the toolbar's **Upscale** button (square-with-arrow icon, "1 Anlas" for 1472 × 704 → 2944 × 1408); then `__nai.last = <new img src>;
  __nai.keep(name)`. emaki_1–4 → emaki_*_up.png (4 Anlas); tools/emaki2.py prefers *_up.

## Round 14 (2026-11-24) — the whole film (kaguya-full-d1 = 0:00–3:46)
- Notes: "完美！" on d16, then: rounder viewfinders as a design (radii raised everywhere with their frame cuts: phone 0.2, booth 100 px,
  stream 78 px, scroll rims 168 px, card windows 0.075 H with a thicker metal corner — PT.tileRimTex 'tilerim2'); card light refined
  (space.js `cardLight`: diffuse turn to a key light, a sliding softbox, a cool kicker, fresnel sheen, inner shadow — fronts and backs);
  card motion silkier (holoCard snaps: 0.42 s glide, `poseRaw` + banking from velocity; cardFace banks unless o.bank === false;
  inserts settle calmer).
- Gaming visual elements + 8-bit (the user: "可以加一些gaming visual elements…精致，有质感和观赏性", "加一点8bit风格"): parts.js game kit —
  judgeTex (slanted chrome words), pixWordTex (VT323 two-band pixel words with stepped shadow), comboTex (pixel digits), windowTex
  (glass + neon + hex weave, pixel labels), hudTex + hpFillTex (segmented), warnTex, danmakuTex, countTex, dialogTex, noboriTex, menuTex,
  pixTex (pixel icons: heart star coin gem potion note crown key). s1.js helpers: clipC (holds last frame), seqSrc, inCamAt, popAt,
  finder (rounded footage + metal frame), judges (word + pixel icon on hits).
- Grounds: kind 5 = acid chrome (verse 2). Tear fx with angle + 10 = BURN (ember edge, char band).
- Footage added (1080p, CLIPS): verse 2 v_* (glam, ad, wardrobe UI, stream), KASSEN k_* (arena, the film's green HUD, battles), sweets
  p_* (Iroha's shortcake, café, rehearsal), final f_* (Yachiyo's hug, the graduation live), outro o_* (moon + shooting star, the gaming
  utility pole), and Yachiyo's first live y_* (beach mini-live 0:27:48–0:30:43, the user: "原片中八千代初见的live我也很喜欢") — used in
  pre 2 (memory windows), the final (「ちゃんと見ててよね」, 「どこかに行っちゃうよ？」, after the hug). ffmpeg in a while-read loop needs -nostdin.
- s1.js `film2(kit)`: verse 2 (KAGUYA COLLECTION magazine finder, STATUS window + TR3 EQUIP, WARNING band, danmaku that freeze on
  聞いてる, the NovelAI carousel horse keyframed per beat, the still moon beat, the kneeling camera + KD card, a house of cards pushed
  over at the lens) · pre 2 (TR3 burns; memory windows; embers; nobori avenue; 3·2·1) · chorus 2 (tileWall of battle shots, VS HUD
  with HP that drains per plea, judgments + combo, dialogue box typing the lines, riffle shuffle + bridge, わかってない on the floor →
  poster, TR4 grows and shatters on Yeah, K.O. / WIN / FULL COMBO, card rain) · break (one card turning edge-on) · bridge (menu card,
  shortcake + Iroha's cake, pudding + TR5, five treasures stamped ✕ and turned on 我慢します with the vow in hairline, SKILL GET,
  LEVEL UP with pixel icons, WARNING) · build (into the pudding) · final (treasure crown ring, the film's chorus via live(t − 126.38),
  three-card gacha, Yachiyo's first live) · the hug as pure footage (196.08–198.08, its own set) · CRITICAL / !? / headlight trails /
  his card turns away / ALL CLEAR · S RANK · outro (neon again, the grid goes dark, the emblem → the moon → the pole, end card,
  THANK YOU FOR PLAYING, SAVE COMPLETE). tools/headless/debug.mjs prints page errors while a build hangs; headless timeouts 400 s.
- The singers' creatures (the user: "很关键的bonus素材：代表彩叶的狐狸还有keyboard（电钢琴），八千代的海蛞蝓和章鱼还有坐骑萨卡班甲鱼，辉夜的兔子";
  from the film also FUSHI 点点 (Yachiyo's mascot), InuDOGE 多吉 (Kaguya's digital pet) and the pancakes): NovelAI transparent stickers
  materials/nai/m_{fox,keyboard,seaslug,octopus,sacabambaspis,rabbit,fushi,inudoge,pancakes}.png; s1.js `motif(kit, n, t0, t1, at, size, o)`
  (pop with a hop, breathe, pop out); 8-bit versions pixTex rabbit / fox / fish / octo. Placed by singer: Sacabambaspis crosses the cold
  open's sky and swims through the interlude tunnel; sea slug / octopus by Yachiyo's lines; the rabbit by each rule (verse 1) and with
  Kaguya's lines; InuDOGE on 「なんとかして！」 and in STATUS (pet row); FUSHI with Yachiyo in the booth; Iroha's keyboard + fox at the live
  window and as TEAM IRO P in chorus 2 (pixel rabbit / crown by the HUD names); pancakes + the moon rabbit in the bridge; all of them
  parade on ALL CLEAR and gather round the end card. Whole film draft: kaguya-full-d2.
- Creatures follow the film (the user: "creatures要遵循原片的形象，特别是海蛞蝓，还有萨卡班甲鱼是灰色的"): cut from 1080p frames with tools/cut.py →
  materials/film_cut/ → tools/sticker.py (white border + shadow) → materials/nai/m_{seaslug,fushi,inudoge,fox}.png (the generated
  versions kept as m_*_nai.png). Sea slug = the white sea bunny (1:58:31); FUSHI = the speckled sea-bunny fluff (1:13:38, whitened from
  the night light, cut flat where someone stands in front — it peeks from frame edges); InuDOGE (0:25:16); the KASSEN fox (0:56:39).
  The Sacabambaspis sticker recoloured grey until its film frame is found; the octopus and the rabbit are still generated (film
  timestamps needed). Whole film: kaguya-full-d3.

## Round 15 (2026-11-24) — notes on the first full draft (kaguya-full-d3)
- "后半段的设计明显没前半段的有观赏性和设计感": s1.js `backbone(kit, o)` (moon dials ×2, held rays, an orbit of living backs, a ghost
  word, foreground glitter, rings on the downbeats) in every second-half section with its own palette and word; `travel(cam, amp)` makes
  every second-half camera orbit / bob / push on downbeats (wrap the cam where it is defined so camera-held UI stays put).
- "游戏对战的片段可以多用八千代初见live来替换设计": chorus 2's wall cycles y_* (Yachiyo's first live), pre 2's end shows y_torii → y_stage
  → y_count (her countdown under the 3·2·1).
- "卡牌的花切设计要做的更精致和炫技": `ribbon()` (spread → domino turnover → back → swept up), `throws()` (spinning cards with light
  trails), `fanWheel()` (a 360° fan of petals turning) — verse 2 (fan behind her on かしずいて), chorus 2 (ribbon on おてて, throws on the
  hook, a fan behind the わかってない poster), final (ribbon turning over and back in the lift, throws into the fly-by).
- "旗帜要做的有质感": PT.noboriTex v2 (lacquered pole + gold finial and bar, cloth loops, gold-ringed crest, gold-edged type, gold fringe
  and tassels) drawn with space.js mode 13 CLOTH (folds rippling in the wind, satin sheen, weave, darker hems).
- "卡牌的光影要做镭射炫彩效果": mode 8 LASER layer (a diffraction grating — pure-spectrum stripes sliding with the tilt, strongest in a band
  of caught light, lighter on faces, prism glints); the same laser film on the backs (mode 10).
- "绘卷的卷首和后面存在脱节空隙": the scroll's cover, roller, cord and windows are placed through the scroll's 0.06 turn about its own
  centre (x·cos, z − x·sin) — each had been turned about its own centre, so edges parted in depth.
- "各个creature也要记得优化": cuts colour-balanced (InuDOGE's cyan cast) and fringes softened; motif() = squash-and-stretch hop, a pop of
  pixel sparkles, a bounce each beat.

## Round 16 (2026-11-24) — the second half rebuilt in space (PLAN-v3) + full-body 立绘 (kaguya-full-d4)
- The ask: "后半段相较于前半段更具观赏性更具创新和设计感以及运用优质学习样片的内容…对空间以及层次感和空间运镜感的极致理解和应用" — each second-half
  section is now a designed SPACE the camera travels through (docs/PLAN-v3-second-half.md):
  · verse 2 THE RUNWAY — a fashion-week corridor (PT.gridRunTex floor, LED edges, ceiling lamps chasing on the beat), a LOOK per line:
    a full-body figure in a new outfit before her footage poster, a swinging hang tag (PT.tagTex: LOOK 0n · ja · zh); lines stand between
    the camera and each poster; STATUS/equip, WARNING band, danmaku in the lens, the horse galloping up the runway ahead of the camera,
    the stage at the end (magazine screen, queen card, fan wheel, house of cards knocked at the lens).
  · pre 2 THE MEMORY RING — the camera orbits the burning robe card (which turns with it); Yachiyo's first-live windows and three
    Yachiyo figures on a tilted luminous ring; the last window flies through the lens; drums: 24 banners in three rows, each rising on
    the half-beat when the camera is ~9 ahead, the camera slaloming and rolling between them.
  · chorus 2 THE ROOM OF CARDS (round 15) + Iroha's fox avatar standing by each wall the camera turns to.
  · bridge THE POP-UP BOOK — an open book page (PT.bookPageTex) the camera trucks along at a steady pace; each line's group folds up
    from the page (`foldUp` — any planes, hinge on the page) centred where the view is mid-line; lines glide at 60% of the camera.
  · final THE SPHERE (64 cards round the camera turning, flipping in waves every two beats; stage window inside, fov 40→54) and THE
    VORTEX (40 cards streaming from the window's frame to the lens, headlight trails racing down the walls); the three girls jump in
    for ALL CLEAR.
  · outro LIGHTS OUT IN DEPTH — each grid card goes out with a flash, tips back and falls into the dark; the three wave and drop out.
- 立绘 ("立绘用nai做完整的（要完整展现全身，头发），包含彩叶，八千代还有辉夜，要各种服饰各种动作" + "少了彩叶的游戏服造型（有狐狸耳朵和尾巴那一套）"):
  NovelAI tags, Transparent BG (0 Anlas on this account), 832×1216 → materials/nai/L{K,Y,I}{outfit}_{pose}.png; outfits KD tsukuyomi ·
  KC live · KK casual · KY yukata · KH junihitoe · YD · YC · YK · YY yukata · IC live · IK uniform · IH hoodie · IY yukata · IG = Iroha's
  game avatar (fox ears + tail, red diamond on the forehead, navy hooded coat, thigh belts; film 1:00:50, 1:01:08). The page checks each
  image (alpha on the canvas edge, area, fill) and re-rolls until whole; "far away / big empty canvas" prompts make painted scrolls —
  don't. tools/fullcheck.py, tools/lsheet.py (sheet with red edges where cut), tools/cleanL.py (drops haze/halo; → materials/nai/cut).
  Some still carry generated scenery (fireworks, fish rings, discs) — unused: LIH_salute LIK_wave LKY_back LKY_run LKY_wave LYC_kiss
  LYC_point LIK_peace LIK_back LKC_dance LKC_point.
- Accents (点缀): s1.js `figure(kit, file, o)` — the figure, a misregistered colour print of its silhouette behind it, its singer's
  accent set in front and behind (PT.doodleTex halo/swirl/stars/arrow/moon/speed/heart/loop/ribbon, two wobble variants alternated on
  twos; pixel icons; sparkles; bubbles), each popping on its half-beat, and its creature (K rabbit, Y octopus, I fox).
- Creatures: the film's own cuts only ("creatures还是不用image2image了，就用原素材就行"): the octopus is Yachiyo's pink flapjack octopus
  (メンダコ) from her first live, frame 41647 → tools/cut_octo.py → film_cut/octopus.png → sticker.py → m_octopus.png (generated one kept
  as m_octopus_nai.png). Image2Image tries are parked in materials/nai/unused_i2i. Kaguya's "rabbit" in the film is her rabbit-ear
  avatar (KD tag draws it); the Sacabambaspis is still the grey recolour (not found in the KASSEN stretch 54:30–61:30 or the live).

## Round 17 (2026-11-24) — notes on d4: galgame + rhythm UI, gem cards, real fire, silk, layered grounds; the 1440p60 master
- "关于游戏UI可以设计成GALGAME+音游的设计": chorus 2's room is a rhythm game — the faced wall's five tile columns are lanes, PT.noteTex notes
  fall onto PT.judgeLineTex across the wall on every beat (double notes on downbeats; lane glow + ring on each hit), PT.rhythmHudTex in the
  lens (jacket, ワールドイズマイン, MASTER 32, the prince's 好感度 gauge FILLING with each plea, SCORE rolling via PT.scoreTex) — and a galgame:
  each line in PT.galTex (frosted window, name plate かぐや / ヤチヨ, face window with the singer's half-body cropped to the face, changing
  expression mid-line, quick menu AUTO lit, PT.nextTex ▼ once sung) on the camera's line of sight to its wall; a choice (PT.choiceTex)
  わかってる？ / わかってない！ before the poster; ALL PERFECT · ♥ LOVE MAX · FULL COMBO at the end.
- "视频画面演出可以稍微放大一点": walls TH 2.8 (±5.1 wide), camera at z 2.2 → the footage fills ~75% of the width (was ~60%).
- "背景的shader可以再叠加几层": space.js `depthLayers` over grounds 2–5 (far cloud veils, a light shaft, light curtains, hexagonal bokeh
  with a chromatic rim, twinkling dust, low mist), each at its own parallax off uOff, tinted per ground.
- "卡面做宝石涂层质感+花纹水印…高光照过时会产生炫彩镭射光效+宝石棱镜效果和花纹水印" + "水印用gpt的生图模型，不要用代码" + "卡面的光泽要做的绚丽":
  mode 8 GEM COAT (Voronoi facets with their own tilts → sparse sharp flashes with spectral fringes, cut lines splitting light) and the
  WATERMARK from ChatGPT's image model (materials/gpt/wm_emblem_gpt.png, wm_tile_gpt.png → tools/wm_alpha.py → materials/cards/
  watermark_{emblem,tile}.png; space.js setCardWatermark, loaded in sets/index.js) shown in laser colours where the light catches, a
  whisper always; stronger rainbow (0.62), wider catch band (0.055), laser to 0.9, thin-film tint, more prism glints, glare 0.36 —
  all kept off the figure (z.b). (SVG watermarks from ChatGPT were made first — the user wanted the image model: parked in gpt/unused_svg.)
- "卡面的界面也可以进行优化做的更有设计感": tools/card.py interface drawn at 3× — faceted gem rarity badge, attribute crest (K crescent · Y wave
  + pearl · I note + fox ear · TR star), engraved corner brackets, chamfered glass name plate with a ribbon in the singer's colour, the
  name letter-spaced in bold metal (Unbounded 700), Japanese name over it, gem stars, No.xxx/120, TSUKUYOMI · 2030, a foil seal. All 42
  character cards and TR1–TR5 regenerated (args per card: CLAUDE.md round 10 loop; TR: treasure_N bgs, ur frame).
- "卡片的燃烧效果做的精致一些，最好能有真实的火焰燃烧感": the BURN tear = scorch → char with glowing veins → white-hot ember line → flame tongues
  (domain-warped noise, white core → orange → red) rising over what is left, sparks, smoke; shadows of a burnt / torn plane are only CUT
  (tearA + 20) — the white teeth under the burning card were its shadow's flames.
- "旗帜…要做出丝绸的随风飘动的物理效果和光泽": mode 13 planes are subdivided (40×40) and displaced in the vertex shader (clothZ: pinned at the
  pole and the top bar, travelling waves growing to the free edge), lit as silk (key on the slopes, anisotropic sheen along the threads,
  fresnel rim, troughs darker); P.wave { amp, len, speed } or false.
- Master: kaguya-master-1440p60 (2560 × 1440, 60 fps, 2 samples) → out/kaguya-master-1440p60-music.mp4.

## Round 18 (2026-11-24) — notes on the master: the WARNING tape, the footage look (master v2)
- "这条警戒线可以拉长一点，现在有些戛然而止，然后可以设计补充一些动效": s1.js `warnBand(kit, L, zh, base, o)` — PT.hazardTex (4096 px, two
  identical halves: crop half and slide the crop to march the stripes; micro CAUTION / 注意 / KEEP OUT / DANGER text along it) 18–26 wide so
  it runs off both sides, a yellow tape crossing behind it the other way a beat later, PT.warnChipTex (⚠ WARNING) flashing on the beats,
  a siren glow pulsing, the line popping per syllable over it (its Chinese under it), both tapes sliding in with an overshoot and out.
  Verse 2 (文句は許しませんの: the tape carries the line — the LOOK 02 caption for L21 is dropped) and the bridge (あとで後悔するわよ).
- "原片可以做一些精致的且富有设计感的画面风格化处理": space.js FOOTAGE LOOK (uLook / uLookC) on every footage plane by default (look: false to
  skip; { a, glow, leak, ink, grade, thr }): split-tone grade (violet shadows, rose-cream lights), S-curve and a little saturation, line
  art inked deeper, highlight bloom from a far mip, two drifting light leaks (rose, lilac), a fine chromatic fringe toward the edges.
- The hug (196.08–198.08) styled as a memory: the look at full strength, a slow push, letterbox bars with ♡ MEMORY · 2030 · TSUKUYOMI and
  REC ●, the line 「ふいに抱きしめられた」 (L51 had no on-screen text before) in the bottom bar with its Chinese, an inset hairline frame, a
  light sweep, drifting sparkles. Master v2: out/kaguya-master-1440p60-v2-music.mp4.
- Also in round 18 (notes on master v1's frames): verse 2's LOOK figures step into the corridor (x ±2.25, 0.75 in front of the poster),
  turned mostly toward where the camera will be mid-line, with a contact shadow (figure() o.floor); their lines moved toward the middle.
  Danmaku redesigned (PT.danmaku2Tex: glowing type · pastel heart pill · star pill · SUPER CHAT box) streaming in the upper frame at three
  depths with a wave and a pop-in, two super chats sliding in with hearts, hearts / stars floating up; on 聞いてる？ they stop and tremble
  while PT.typingTex's three dots bounce (the 「……」 circles are gone). Interlude tunnel: 11 Sacabambaspis spiralling among the card rings
  (some passing the lens) and 6 sea slugs riding the rings.
- Danmaku, again ("弹幕的打赏元素可以用日语" · "原弹幕的设计我也很喜欢，弹幕可以不用拘束于通道，其他画幅也能铺开，但是要遵循片段的透视逻辑" · "原弹幕可以加上
  motion"): all of verse 2's danmaku now live in the runway's space — 26 in streams along both walls (x ±3.0, inside the posters' line)
  and the ceiling flowing toward the camera, 20 crossing the corridor in mid-air at depths 4.5–11 — the original outlined PT.danmakuTex
  (with motion: pop with overshoot, beat hops, sway, a flip-in, colour flashing on the beats) mixed with PT.danmaku2Tex pills; super
  chats in Japanese (推し活中の姫ファン · スーパーチャット · 「姫さま！わたしにも王子さまを！」「この気持ち、受け取って♡」) standing in the
  corridor; hearts rising in it; the typing bubble planted where the camera stops. Freeze / tremble on 聞いてる？ kept.
- "卡面的斜向高光能不能也做炫彩并加强宝石和花纹感": mode 8's diagonal glare band is now in spectrum (a white core with R / B split 0.018 to
  either side, a rainbow running along its length that slides with the tilt); bandK (the glare's position) joins catchB (litK = max) so
  the gem facets flash up to 1.8× and the cut lines and the GPT watermark (up to 0.88) flare inside the glare as well.
- CARD FUSION ("卡面拼接演示原片能不能做一个融合动效…边缘渐渐融合…液态或者辉光角度挺好（具体你来设计和决定）"): tileWall o.fuseAt(t) → 0…1
  (s1.js fuseWin([[from, to], …], in, out)). A single footage plane across the whole wall (crop as the tiles' mapping) masked in the
  shader (space.js uFuse / uFuseG / uFuseR) by the union of the cards' windows — identical to the tiles at 0, so the cards cross-fade
  under it unseen (their rims fade a little later) — then the union is taken smooth (smooth-min reach grows) so the gaps fill with
  liquid glass (the picture refracted through it along the SDF gradient, a spectral caustic, a bright meniscus at the cards' old edges),
  a thin glow runs along the merging edge, and it ends as one rounded screen; a metal frame (PT.holoFrameTex, mode 9) fades in round it.
  Used on the cold-open wall (two windows), the intro wink wall (12.35–14.05), the interlude city wall and the room's walls (each while
  faced; the rhythm lanes stay over the fused picture). Splitting back plays the same in reverse.
- LIQUID GLASS ("liquid fusion可以做精致且极具质感和观赏性的liquid glass感"): the fusion now renders real glass optics — space.js fuseDist /
  fuseOuter / glassH (thickness: the liquid in the gaps, wobbling as it flows, clearing completely as the screen becomes whole, plus a lens
  bevel round the screen's edge that stays subtly at rest) → normals from finite differences → the footage refracted through it with
  RGB dispersion (0.8 / 1 / 1.25) and frost where thick, a sharp specular + soft sheen, a top-lit fresnel rim, thin-film colour on the
  steep parts, caustic light inside the liquid, a soft shadow under the lower lip; a faint glow on the merging edge.
- "我说的是融合时体现质感，融合后就做无缝取景": the glass shows ONLY while the cards merge (bevel = 0.7·sin(πf)), the fused screen is a
  seamless picture — no frame (the metal frame only glints mid-merge and is gone by f 0.95), no CRT, and the cards' foil edges and backs
  fade out with the fusion so no border remains.
- Miku easter eggs ("可以适当加一点miku的元素作为彩蛋" — ワールドイズマイン is her song): PIXMAP miku (8-bit chibi, teal twin tails) and negi
  (her leek), palette T #39C5BB / G / S; the rhythm bar reads MASTER 39 in her teal; the 8-bit Miku hops across the top of the rhythm bar
  once (L36) with the leek bouncing after; a leek in LEVEL UP!'s burst and one drifting over the pop-up book; 「39！」「ミクさん！」 in the
  danmaku; the 8-bit Miku in ALL CLEAR's parade; the end card's teal credit 「♪ ワールドイズマイン — ryo (supercell) feat. 初音ミク」 with
  the sprite beside it.
- "merge完之后不同的卡应该是紧贴在一起的…卡与卡之间靠近逐渐融合": tileWall's slotOf(i, j, t) — as a wall fuses the pitch shrinks to the
  window size (io of the fusion), so the cards slide together while their edges melt; the fused screen spans the compacted cards (s and
  crop re-mapped each frame so the picture is whole — no strips lost at the seams), the shader's grid pitch follows.
- More Miku ("miku可以再做点剪影彩蛋，还可以加个fufu之类的"): NovelAI miku_point / miku_twirl (silhouettes: cut/*_sil.png, edges feathered,
  drawn flat in #39C5BB) and miku_fufu / miku_fufu2 (fumo-style plush, the second hugging a leek; as motifs m_fufu / m_fufu2). Silhouettes:
  giant and faint, twirling in the sky right of the runway's stage as the moon rises (L26); standing on the memory ring for two beats
  (L31 + 2 beats, φ 0.35); lighting the Kaguya card in the outro's grid for a beat before it goes out. Fufu: on the galgame window (L36),
  on the pop-up page by the pancakes, in ALL CLEAR's parade, on the end card. (The Image2Image reference left in the NAI page from the
  creature test was removed first — check Reference Images before any text-to-image batch.)
- FUFU (the user: "FUFU指的是这种miku的娃娃和造型（豆豆眼，半圆微笑）" · 「初音ミクシリーズふわふわぬいぐるみ」 · "不用image 2 image，用tag或者找实物图做
  sticker处理" · "或者可以找找官方的绘图"): NovelAI tags only — bean eyes (small vertical ovals, no pupils), a small open semicircle smile,
  pink blush, a big soft head — fufu_plush_t (the plush) and fufu_chibi_negi_t (a soft-drawn chibi hugging a leek), given the creatures'
  white sticker border + shadow → m_fufu / m_fufu2. The earlier anime-eyed plushes and the Image2Image tries are in materials/nai/
  unused_fufu. The official line is SEGA's ふわぷち (designed with 三月八日); official images would need the user's OK per file.
- Official ふわぷち (the user: "Yes, download both" · "你可以把你找到的都下载了"): 33 product images from SEGA Plaza (segaplaza.jp prize pages
  B121394 standard L, B121962 lying M, B121798 Étoile, B122039 Street SEKAI (監修中 stamp — unused), B122271 / B122795 standard,
  D122599 ちょこのせ figures) in materials/fufu_official (© Crypton Future Media, designed by 三月八日). Cut with tools/cut.py from the
  white-ground shots, stickered → m_fufu (sitting), m_fufu2 (lying, smile), m_fufu_lie (lying, kiss), m_fufu_etoile, m_fufu_choco_a/b.
  Placed: the sitting plush on the room's galgame window (L36); the lying one on the pop-up page; sitting + Étoile in ALL CLEAR's
  parade; the kiss one and the two ちょこのせ figures (on the end card's top edge) at the end. The tag-made fufu are no longer used.

## Round 20 (2026-11-24) — notes on master v2 (seven, with stills) → master v3
1. "KAGUYA段落的背景shader可以做的更梦幻，以淡粉色和淡黄色为fusion色调基调为主，现有的有些灰暗了": ground kind 6 `dream` (space.js): pale
   pink and butter yellow folded into each other like silk by a slow double warp, pearl crests, a radiance and slow rays from the runway's
   far end, cotton clouds low down, twinkles; depthLayers in pink / butter / lilac. The runway's palette follows: lilac-pink grid,
   white lyrics with plum ink on hot-pink chips, KAGUYA in pink, dials gold-pink; bloom 0.16 (it is a light ground now).
2. "取景框的素材做圆角处理": the photo booth's plate is rounded (radius 120 px) with a pearl lip, and its side is a ROUNDED band (P.edge.r)
   — no square box behind rounded corners.
3. "这种法阵我超喜欢！可以多用一些，例如用到卡片隧道的段落以及一些比较空的段落里": sigil(kit, o) = the moon dial in metal; PT.dialTex(kit, true)
   is a hollow version (its heart open) the camera flies through. Used: one round each ring of the interlude tunnel + two behind the
   city wall; the break's lone card (2:42) stands in three (behind, a smaller counter-turning one, one lying under it with rings
   pulsing out on the beats); four streaming down the final vortex; the end card stands in one.
4. "旗杆处还需要优化，现在的旗杆第一缺少质感第二存在断联": the pole is its own plane (PT.poleTex: cinnabar-black lacquer drawn as a lit
   cylinder — specular, rim light, brush streaks — a gold 擬宝珠 finial and collars), turned to the camera each frame (a cylinder looks
   the same from every side); the nobori's crossbar ring and loops (乳) are drawn across the pole's place so they wrap it; clothZ keeps
   the crossbar rigid (the wind starts below it); the banners' sway roll is gone (the pole is rigid).
5. "音游可以做成CYTUS2类型的谱面，并做的灵动和稍微复杂一些…扫描线不要设计的戛然而止": the five falling lanes are replaced by a Cytus II chart on
   the faced wall — the scan line sweeps the band left open between the HUD and the message window (y 1.4 … −1.1) a bar a sweep, down
   then up, 1.75× the wall's width with a long taper at both ends (it runs off the screen, never stops), a wake behind it, its colour
   turning each page with a flare at the turn. Notes (PT.cyNoteTex: tap, gold double, drag, flick; cyHoldTex; cyDotsTex): a page's
   notes fade in together just before the line turns onto it, a closing ring in the last 0.75 s, a burst + ring + glow when the line
   crosses. Patterns per bar: 0 taps on the beats and offbeats, 1 a drag chain on sixteenths, 2 a hold with taps on the other side,
   3 an eighth run; gold doubles on downbeats; a flick closes each wall (67 notes).
6. "卡的侧面还需要优化，现在侧面存在分层穿帮": a card's thickness is now ONE solid band round its rounded outline (space.js rimGeom/rimMat:
   prism foil that turns with the view, a specular, bright cut lips at both faces), seen from behind it is mirrored so the face toward
   the lens caps it. Planes with rimOnly draw only the band. Replaces holoCard's 8 slices, cardFace's walls, the tile walls' 2 slices
   and the title card's 6 (RIMK = 0.043 card heights). A zero scale is clamped (NaN normals had spread through the bloom as black blocks).
7. "原片的后处理可以增加一点可爱滤镜或者风格化处理": the cute layer in the footage look (uCute: amount 0.85 · star filter · soft glow):
   vibrance where the grade greyed the colour, a pastel pink soft-focus glow, peach-cream lights, a pink-lilac haze at the frame's edge,
   and a star filter that throws four-point stars from SMALL highlights only (a far-mip contrast test keeps white areas from blooming).
Master v3: out/kaguya-master-1440p60-v3-music.mp4.
