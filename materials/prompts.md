# Material prompts (log)

Split (memory mj-for-backgrounds): characters → NovelAI (askzy pack, 0 Anlas); tone / vibe → Midjourney (references for
writing shaders, not pasted as plates); small refined objects on transparent ground → ChatGPT (with a style reference).
2026-11-23 the user: "需要人物贴纸以及做新的shader，贴纸就用NAI做图然后抠成pop sticker，shader就用MJ做定调图然后照着MJ的图写shader";
"Y2K的素材可以设计的futurism一些，因为本身电影设定是2030年".

## Midjourney — tone references for shaders (≤ 3 prompts a round)
1. 其の一 ground (Y2K futurism, MINIMAL — the user: "futurism的体现应该是有简约设计感，而非是脉冲线条"): `minimal Y2K futurism abstract
   background, soft frosted translucent pastel lilac and mint forms, satin chrome highlights, smooth gradients, generous clean
   negative space, calm and refined, the future as imagined in 2000, no lines, no circuitry, no text, no people --ar 16:9 --v 7`
2. Pre booth ground: `kawaii futuristic photo booth interior abstract, pastel pink and mint glitter haze, floating holographic
   stickers of stars and hearts, soft bokeh sparkles, translucent acrylic panels, Y2K futurism, no text, no people --ar 16:9 --v 7`
3. 其の二 arena sky: `vast virtual concert arena at night seen from the stage, ocean of glowing pink and white penlights, cyan and
   magenta laser beams through haze, distant neon pagoda rooftops of a futuristic Kyoto, volumetric light, anime film look, no
   text, no people in close-up --ar 16:9 --v 7`

## NovelAI — pop stickers (style block verbatim from the askzy pack + white-ground full-body block)
Characters described by look (the model may not know them by name):
- Kaguya (Tsukuyomi avatar): very long blonde hair in high twin tails with one red streak, amber-orange eyes, idol live outfit:
  black and magenta sleeveless top with a diamond cut-out, pale blue band over the shoulders, white flared skirt, black shoes.
- Yachiyo: very long silver-white hair, a small bun on one side and a long side tail, gold hair ornaments, violet eyes, the same
  live outfit (teal accents).
Poses (hands empty, no props): peace sign with a wink · both hands making a heart over the head · jumping, arms up · pointing at
the viewer, smug · pouting, cheeks puffed, arms crossed · blowing a kiss · back view looking over the shoulder.

## ChatGPT — props (style reference: materials/gpt/styleref.png, two film stills)
1. (sent 2026-11-23, 2008 brief — superseded) open + closed flip phone, pearl pink, rhinestones, green screen.
2. Y2K-futurism terminal: `a 2030 clamshell phone designed in Y2K futurism: translucent candy-lilac jelly shell showing glowing
   circuitry inside, chrome hinge, rounded blob forms, glowing mint edge lights, a heart charm; OPEN, straight front view, its
   screen a flat solid pure green (#00FF00) rectangle; and the same phone CLOSED (lid front: a round holographic sub-display)`.
3. Sweets set (glossy, cel style): strawberry shortcake slice, custard pudding with a cherry in a glass cup, macaron, wrapped
   candy, swirl lollipop, star-shaped candy, donut with sprinkles.
4. Sticker sheet (Y2K futurism): chrome heart, jelly star, holographic crown, bubble sparkle, ribbon, anger-mark and sweat-drop
   (漫符) in glossy jelly.

## Decisions after the user's notes (2026-11-23)
- Phone: not a flip phone, a vertical flip FOLDABLE (minimal; "折叠屏可以参考…竖折叠，这样比较可爱") → materials/gpt/zflip_* (sheet zflip30.png,
  geometry zflip.json: hinge row 511 found by eye — the crease line). Earlier sheets kept: phone_2008, phone_2030 (circuits: rejected),
  phone_minimal_flip, fold30 (book-style: superseded).
- NovelAI characters by their TAGS (the user: "在nai的tag里写对应的角色名"): kaguya (ex-otogibanashi) (cho kaguya-hime!) · kaguya (tsukuyomi)
  (cho kaguya-hime!) · kaguya (cho kaguya-hime!) (real world) · runami yachiyo (ex-otogibanashi) · runami yachiyo (tsukuyomi) ·
  runami yachiyo (wego) — plus `cho kaguya-hime!`. Outfits per world (the user: "默认的也很好看，还有常服也很好看"): 其の一 = Tsukuyomi
  default avatars (KD_*, YD_*), the booth = everyday clothes (KK_*, YK_*), the live = the concert outfit (KC_*, YC_*, *_t1).
  Image2Image from film frames (materials/nai/base, *_i2i_1) also works; tags gave the closest likeness for new poses.
- Transparent-background figures are used WITHOUT a pop-sticker border (the user: "人物图直出透明背景的话就不用加上popsticker的边缘了"):
  tools/clean.py → materials/nai/cut/ (half-clear parts made opaque, edges as drawn). Half-bodies wanted too.

## Round 3 (2026-11-23/24, after "MJ登陆好了")
- Midjourney prompts as submitted (v7, 16:9): ① the minimal Y2K-futurism prompt above → materials/mj/5b369a80_0–3 (pearl / lilac / mint
  satin ribbons); ② `kawaii futuristic photo booth abstract background, pastel strawberry milk pink and mint, glitter haze, soft bokeh
  sparkles, translucent acrylic layers, minimal and refined, no text, no people` → 5c029f29_0–3 (teal / coral glitter haze); ③ `vast
  futuristic virtual concert arena at night seen from the stage, an ocean of glowing pink and white penlights, cyan and magenta laser
  beams through haze, distant neon pagoda rooftops of a futuristic Kyoto, volumetric light, cinematic anime film look, no text, no
  close-up people` → 5e597f6e_0–3 (indigo night, crossing beams, pagodas, penlight sea).
- Shaders written from them (src/space.js, ground kinds; set.ground(t) → { kind, a, pulse }): 1 satin ribbons (set A, replaces the foil
  plane), 2 glitter haze (the booth), 3 arena night (set C; set B after the drums return at a = 0.55). Side by side with the references:
  cache/tests/mj_vs_shader.jpg, mj_vs_shader2.jpg. `?bgonly` renders the ground alone (snap.mjs: Q=bgonly).
- NovelAI batch (tags, Transparent BG): full-body KD_wave KD_shy YD_bow YD_heart KK_peace KK_jump YK_point YK_twirl KC_wink YC_wave;
  half-bodies KD_hb_smile KD_hb_wink KC_hb_pout YC_hb_smug YD_hb_gentle KK_hb_surprised YK_hb_whisper KC_hb_sing YC_hb_sing → clean.py
  → materials/nai/cut. Half-bodies are used as close-up inserts held in the camera's frame, their cut edge below the frame's bottom
  (s1.js peek()); in the live they sit under the type so the words read over them.
