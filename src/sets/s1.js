// The sample (PLAN §14): verse 1 → chorus 1, song 28.6–84.15.
//   A 其の一「燕の子安貝」 28.6 → bar 22 (45.50): a 2008 deco flip phone (子安貝 → clamshell) opens, turns sideways to watch the live
//     as one-seg TV; the rules (その一 / 二 / 三) as the song's demands, the film's own house-rules comedy in torn panels behind;
//     その一: the twin tails take gold → silver → teal on the beats (hair key on the synced shot); その二: a photo strip lights a cell
//     per beat on the shoes; その三 (both voices: teal): the translation answers in three chat bubbles; the right hand: a pixel cursor
//     clicks 「手をつなぐ」 on 「なんとかして！」 and the live jumps out of the screen.
//   B Pre 嘟嘴 45.50 → 59.40: the live inside a photo booth's scribble frame (the drums are out: a valley); 漫符; the lines written in
//     glitter pen; 「かわいい」 alone on the booth's pastel (the first breath); the drums return: signal bars fill, rings close in,
//     the live in a round window that opens as the lens passes through it.
//   C 其の二「龍の首の珠」 59.40 → 84.15: the film's arena — a penlight sea (turns gold on 「おひめさま」: the world is hers), lasers, the
//     live in a stream window; the hook as flap cards; a loading bar that refuses to wait; a poster for 「誰だと思ってるの」; sweets rain;
//     「いますぐによ」 stamped; the rank counter lands on No.1.
// Glitch has one meaning (PLAN §13): the moon's signal leaking in — here only 1–3 frame hits at the two changes of world.
import * as THREE from 'three';
import { K_GOLD, K_GOLD_D, Y_SILVER, Y_SILVER_D, MIKU, MIKU_D, INK, NIGHT, PAPER, WHITE, HOLO, MINT, DECO, BABY, LEMON, STAGE, HOT, LASER, PEN, VIOLET, STRAW, CUSTARD, CREAM,
  BEAT, beatT, beatOf, bar, pulse, clamp, io, sm, outE, spring, lerp, lerp3, hash, mixc, lyrics, camTrack, letters, object, FX, mash, out } from './lib.js';
import * as PT from './parts.js';

// ---- footage -------------------------------------------------------------------------------------------------------
const O = 4826.79, FR = 24000 / 1001, pad = (k) => String(k).padStart(6, '0');
// the film's World is Mine live, frame-synced to the song (film = song + O)
export const live = (t) => { const k = Math.floor((t + O) * FR + 1e-4); return k >= 115700 && k <= 117842 ? `materials/frames/live/${pad(k)}.jpg` : null; };   // (from song 0:00 since 2026-11-24)
// clips of the story played forward once (never frozen, never looped): name → [first frame, count]
const CLIPS = { y_count: [40007, 61], y_appear: [40347, 103], y_torii: [40452, 141], y_sing1: [40662, 94], y_sing2: [40951, 145], y_aurora: [41447, 170], y_stage: [41620, 109], y_fish: [41858, 85], y_close: [41945, 77], y_jelly: [42110, 63], y_galaxy: [43346, 85], y_smile: [43680, 112], y_final: [44068, 134],   // (Yachiyo's first live, the Tsukuyomi beach mini-live 0:27:48–0:30:43 — the user: "原片中八千代初见的live我也很喜欢，可以安排一些片段剪辑进去")
  v_ward: [35391, 75], v_rank1: [57825, 57], v_stage1: [57975, 57], v_stage2: [58128, 57], v_rank2: [58348, 52], v_glam: [59172, 45], v_glam2: [59265, 60], v_stream: [59493, 45], k_arena1: [79203, 57], k_arena2: [79338, 51], k_hud: [82474, 67], k_hud2: [82544, 66], k_b1: [85773, 141], k_b2: [86327, 95], k_b3: [86570, 59], k_b4: [85981, 42], p_cafe: [26864, 204], p_cake: [27071, 57], p_cafe2: [27199, 97], p_reh: [113015, 171], p_reh2: [112856, 108], f_hug1: [105844, 69], f_hug2: [105916, 81], f_grad1: [149920, 42], f_grad2: [150169, 101], o_star: [5864, 111], o_pole1: [6947, 92], o_pole2: [7123, 96], o_pole3: [7222, 201],   // (the whole film: verse 2 · KASSEN · sweets · the hug and the graduation live · the moon and the gaming utility pole)
  i_dive: [34102, 131], i_city1: [36860, 69], i_city2: [36932, 69], i_city3: [37005, 81], i_city4: [37089, 117], i_fest1: [37600, 69], i_fest2: [37734, 69], i_fest3: [37855, 122], i_torii1: [34239, 104], i_torii2: [34496, 57],   // (the interlude: the dive into Tsukuyomi 23:42, the city 25:37–25:51, the festival 26:08–26:24, the torii on the sea 23:48 / 23:58)
  r1: [32500, 120], r2: [32692, 144], r3: [33447, 132], r4: [6617, 60], r5: [7072, 60], r6: [7492, 60], r7: [7960, 60] };   // (r4 meteor over the wires 4:36 · r5 Iroha in the picture-scroll clouds 4:55 · r6 bamboo in the pole's light 5:12 · r7 the baby in the capsule 5:32)
const clip = (name, t0, speed = 1, skip = 0) => (t) => { const [f0, n] = CLIPS[name]; const k = f0 + skip + Math.floor((t - t0) * FR * speed); return k >= f0 && k < f0 + n ? `materials/frames/${name}/${pad(k)}.jpg` : null; };

// ---- frames of reference: things attached to the phone's lid move with it -------------------------------------------
const X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1), EU = new THREE.Euler();
const qAxis = (ax, a) => new THREE.Quaternion().setFromAxisAngle(ax, a);
// wrap planes made in a local frame (p, r) so they ride a moving frame: frame(t) → { pos, q } | null
function attach(planes, frame) {
  return planes.flat().map((P) => ({ ...P, at: (t) => {
    const F = frame(t); if (!F) return null; const st = P.at ? P.at(t) : { p: [0, 0, 0] }; if (!st) return null;
    const v = new THREE.Vector3(...st.p).applyQuaternion(F.q), r = st.r || [0, 0, 0];
    const q = F.q.clone().multiply(new THREE.Quaternion().setFromEuler(EU.set(r[0], r[1], r[2], 'YXZ'))); EU.setFromQuaternion(q, 'YXZ');
    return { ...st, p: [F.pos[0] + v.x, F.pos[1] + v.y, F.pos[2] + v.z], r: [EU.x, EU.y, EU.z] };
  } }));
}
const plane = (tex, o) => ({ ...o, tex, mode: o.mode ?? 0, order: o.order ?? 0, at: o.at || ((t) => ({ p: o.p || [0, 0, 0], r: o.r || [0, 0, 0], s: o.s ?? 1, a: o.a ?? 1 })) });   // (every option passes through: mat, round, edge, single…)

// outlined deco lettering (purikura / デコ文字): an ink stroke behind the fill, the same timing
const deco = (kit, str, o) => [letters(kit, str, { ...o, stroke: Math.round((o.px || 160) * (o.strokeK ?? 0.2)), col: o.ink || INK, order: (o.order ?? 5) - 0.05, colAt: o.inkAt }), letters(kit, str, o)].flat();
// ---- bilingual fusion (the user, 2026-11-23: "现在就像是电影字幕一样上面是原文下面是翻译缺少设计感"; skill pv-text-performance §5) ----
// glossLine: a line laid out phrase by phrase, each Japanese phrase followed by (inline) or carrying under it (under) the Chinese part
// that translates it, in a chip that pops as the phrase completes. segs: [[jaFrom, jaTo, zhFrom, zhTo]] (audio/gloss.json).
// o: { font, px, size, at, maxW, lineH, align, col, ink, strokeK, enter, mix, order, out, outStyle, mode, zhFont, zhSize, chip (rgb),
//      chipInk, chipTex (a picture instead of the pill), chipMode, rz }
let GLOSS = null;
// materials for flat UI parts (space.js mode 9 — "所有素材特别是展示框类组件要做的更有质感"): acrylic panels, pearl labels, metal chrome
const MAT = { acrylic: { kind: 'acrylic', bevel: 9, shine: 0.95, pearl: 0.28 }, pearl: { kind: 'pearl', bevel: 7, shine: 0.85, pearl: 0.42 }, metal: { kind: 'metal', bevel: 6, shine: 1.0, pearl: 0.12 }, chip: { kind: 'pearl', bevel: 5, shine: 0.8, pearl: 0.3 } };
const rot3 = (v, R) => { const [rx, ry, rz] = R; let [a, b, c] = v; const cz = Math.cos(rz), sz = Math.sin(rz); [a, b] = [a * cz - b * sz, a * sz + b * cz];
  const cx = Math.cos(rx), sx = Math.sin(rx); [b, c] = [b * cx - c * sx, b * sx + c * cx]; const cy = Math.cos(ry), sy = Math.sin(ry); [a, c] = [a * cy + c * sy, -a * sy + c * cy]; return [a, b, c]; };
const measureW = (kit, str, font, px) => letters(kit, str, { font, px, size: 1, times: [...str].map(() => 0) }).width;
function glossLine(kit, L, o) {
  const segs = o.segs || GLOSS[String(L.n)] || [[0, [...L.text].length, 0, [...L.zh].length]], ja = [...L.text], zh = [...L.zh];
  const size = o.size, zs = o.zhSize ?? size * 0.42, gap = o.gap ?? size * 0.2, zf = o.zhFont || 'ChillRound';
  const parts = segs.map(([a, b, c, d]) => ({ ja: ja.slice(a, b).join('').trim(), times: L.times.slice(a, b), zh: zh.slice(c, d).join('').trim() }));
  for (const P of parts) { P.jw = measureW(kit, P.ja, o.font, o.px || 170) * size; P.zw = P.zh ? measureW(kit, P.zh, zf, 140) * zs : 0; P.cw = P.zh ? P.zw + zs * 1.1 : 0; }
  let x = 0, row = 0; const rowsW = [0];
  for (const P of parts) { const w = o.mode === 'under' ? Math.max(P.jw, P.cw) : P.jw + (P.cw ? gap + P.cw : 0);
    if (x > 0 && x + w > o.maxW) { row++; x = 0; rowsW.push(0); } P.x = x; P.row = row; P.w = w; x += w + gap * 1.6; rowsW[row] = x - gap * 1.6; }
  const out = [], z = o.at[2], pill = PT.pillTex(kit);
  // (2026-11-24, "缺少…空间感和立体感") the whole line may be turned in 3D about its anchor (o.rot, YXZ like letters()): a row receding as a
  // wall, a line lying on the floor. W3 places a point of the flat layout; every glyph and chip takes the line's turn plus its own tilt.
  const R = o.rot || [0, 0, 0], W3 = (x, y, dz = 0) => { const v = rot3([x - o.at[0], y - o.at[1], dz], R); return [o.at[0] + v[0], o.at[1] + v[1], z + v[2]]; };
  parts.forEach((P, k) => {
    const y = o.at[1] - P.row * (o.lineH ?? size * (o.mode === 'under' ? 1.9 : 1.3)), x0 = o.at[0] + (o.align === 'center' ? -rowsW[P.row] / 2 : 0) + P.x + (o.mode === 'under' ? (P.w - P.jw) / 2 : 0);
    if (P.ja) out.push(deco(kit, P.ja, { font: o.font, px: o.px || 170, size, at: W3(x0, y), rot: R, times: P.times, enter: o.enter || 'pop', mix: o.mix, col: o.col, ink: o.ink, inkAt: o.inkAt, strokeK: o.strokeK ?? 0.2, order: o.order ?? 6, out: o.out, outStyle: o.outStyle || 'flap', outDur: o.outDur ?? 0.22, scr: o.scr, hit: o.hit, seed: k * 7 }));
    if (!P.zh) return;
    const ts = P.times.filter((t) => t != null), tChip = ts.length ? ts[0] + (ts[ts.length - 1] - ts[0]) * 0.55 + 0.04 : L.t0;
    const rz = o.mode === 'under' ? (hash(k * 3.3 + L.n) - 0.5) * 0.16 : 0;
    const cx = o.mode === 'under' ? x0 + P.jw / 2 : x0 + P.jw + gap + P.cw / 2, cy = o.mode === 'under' ? y - size * 0.62 : y + size * 0.3;
    out.push(object(o.chipTex ? o.chipTex(k) : pill, { at: W3(cx, cy, 0.01), size: zs * 1.45, w: P.cw, t0: tChip, dur: 0.3, enter: o.mode === 'under' ? 'stamp' : 'pop', mode: 9, mat: MAT.chip, col: o.chip || WHITE, rot: [R[0], R[1], R[2] + rz], order: (o.order ?? 6) + 0.2, shadow: false, out: o.out, outStyle: 'slide', to: [0, -1.2, 0], outDur: 0.22 }));
    out.push(letters(kit, P.zh, { font: zf, px: 140, size: zs, align: 'center', at: W3(cx, cy - zs * 0.36, 0.02), rot: [R[0], R[1], R[2] + rz], times: [...P.zh].map((_, j) => tChip + 0.05 + j * 0.025), enter: 'pop', col: o.chipInk || INK, order: (o.order ?? 6) + 0.3, out: o.out, outDur: 0.2, follow: false }));
  });
  return out.flat();
}
// where each drawing was cut by its canvas (materials/nai/cut/edges.json: left / right = how far up the side cut reaches, as a fraction of
// the cutout's height from its bottom; x0 / x1 = the cut lines in the cutout's width)
const EDGES = fetch('materials/nai/cut/edges.json').then((r) => r.json()).catch(() => ({}));
// the card for a cut drawing, in the drawing's own units (its width = asp, height 1, anchor = its bottom centre): sides on the cut lines
// (a small margin on an uncut side), top just above the highest side cut, bottom a little under the drawing
const cardRect = (e, asp) => { const x0 = e.left != null ? e.x0 ?? 0 : -0.05, x1 = e.right != null ? e.x1 ?? 1 : 1.05, yt = Math.min(1.02, Math.max(e.left ?? 0, e.right ?? 0) + 0.06), yb = -0.03;
  return { w: asp * (x1 - x0), h: yt - yb, pivot: [(0.5 - x0) / (x1 - x0), yt / (yt - yb)], asp: (asp * (x1 - x0)) / (yt - yb) }; };
const sideCut = (e) => e && (e.left != null || e.right != null);
// ---- character stickers (NovelAI drawings cut as pop stickers: materials/nai/stk/*.png) ----
// sticker(kit, keys, o): one plane that shows a sequence of poses as key shots (never one drawing slid across the screen — the user's
// rule): keys [[t, file], …] each slapped in on its time (a uniform pop, a tilt — never squashed: the user, 2026-11-24), resting with a small bob on the beat; o: { at, size, rz, out, order }
async function stickerSeq(kit, keys, o) {
  const tex = await Promise.all(keys.map(([, f]) => kit.img(`materials/nai/cut/${f}.png`))); if (tex.some((x) => !x)) return [];
  const asp = (T) => T.userData.w / T.userData.h, a0 = asp(tex[0]), E = await EDGES;
  const keyAt = (t) => { let k = -1; for (let i = 0; i < keys.length; i++) if (t >= keys[i][0]) k = i; return k; };
  const cards = [];
  keys.forEach(([, f], i) => { const e = E[f]; if (!sideCut(e)) return; const cr = cardRect(e, asp(tex[i]));
    const show = (t, st) => (keyAt(t) === i && st ? { p: st.p, r: st.r, s: [st.s[1], st.s[1]], a: st.a } : null);
    cards.push({ tex: PT.cardTex(kit, cr.asp), w: cr.w * o.size, h: cr.h * o.size, pivot: cr.pivot, mode: 6, col: o.card || [232, 222, 255], order: (o.order ?? 6) - 0.04,
      foil: { angle: 0.9, scale: 0.3, speed: 0.05, shine: 0.22 }, shadow: { d: 0.04, dx: 0.06, dy: 0.08, a: 0.22, bias: 3 }, at: (t) => show(t, main.at(t)) },
      { tex: PT.cardRimTex(kit, cr.asp, o.cardLabel), w: cr.w * o.size, h: cr.h * o.size, pivot: cr.pivot, mode: 1, col: WHITE, sharp: true, order: (o.order ?? 6) - 0.03, at: (t) => show(t, main.at(t)) }); });
  const main = { tex: tex[0], h: o.size, pivot: [0.5, 1], order: o.order ?? 6, shadow: { d: 0.04, dx: 0.06, dy: 0.08, a: 0.25, bias: 3 }, at: (t) => {
    let k = -1; for (let i = 0; i < keys.length; i++) if (t >= keys[i][0]) k = i; if (k < 0 || (o.out != null && t > o.out + 0.25)) return null;
    const u = (t - keys[k][0]) / 0.22, sq = u < 1 ? 0.86 + 0.14 * spring(clamp(u) * 1.3) : 1, v = o.out != null ? clamp((t - o.out) / 0.25) : 0;   // (a uniform pop: never squashed)
    const bob = 0.03 * o.size * pulse(t, 7);
    return { p: [o.at[0], o.at[1] + bob - v * v * o.size, o.at[2]], r: [0, 0, (o.rz ?? 0) + (u < 1 ? (1 - u) * 0.12 * (k % 2 ? 1 : -1) : 0)], s: [sq * asp(tex[k]) / a0 * (o.flip ? -1 : 1), sq], tex: tex[k], a: 1 - sm(v) };
  } };
  return [...cards, main];
}
// ---- SAR holo cards (the user, 2026-11-24: "人物立绘其实可以做有质感的卡片，可以用生图工具制作卡片的背景图" + a Pokémon SAR / UR holo-card spec):
// faces and maps from tools/card.py (NovelAI art behind the untouched figure), the moving light in space.js mode 8. A card floats in a
// slow orbit tilt (Y ±17.5°, X ±10.5°, a little Z, a bob; one loop = CARD_LOOP s), has a metal edge (8 slices) and a back, flips in
// edge-on, and changes pose by spinning once round (the new face appears while its back is toward us); sparks drift in front and behind.
export const CARD_LOOP = 48 / 22;
// the poses a card snaps between (yaw, pitch, roll), each a different face of the light
const SNAP = [[0.2, -0.08, 0.0], [-0.24, 0.06, 0.03], [0.1, 0.15, -0.03], [-0.14, -0.12, 0.02], [0.28, 0.03, -0.02]];
const CARDS = {}, ETCH = { cosmos: 0, silk: 1, radial: 2 };
// the back is a pattern from the image model with a living night laid over it by the shader (space.js mode 10; the user, 2026-11-24:
// "卡牌背面还要设计的更精致，最好是动态shader制作的" → "卡牌的背面也可以用生图模型制作图案，然后用shader写星空质感附加在图案上"). Two decks: 'night'
// (silver-gold clouds and constellations) for the singers, 'sun' (rose-gold rays) for the five treasures. ctr/rr: the emblem (from the
// top-left) and its rings' radius, for the beat ring and the light running round them. back.png (the old drawn back) stays for the walls.
const BACKS = {};
const cardBack = async (kit, v = 'night') => BACKS[v] || (BACKS[v] = await Promise.all([kit.img(`materials/cards/back_art${v === 'sun' ? 2 : 3}.png`), kit.img('materials/cards/back.png')])
  .then(([tex, still]) => ({ tex, still, mode: 10, card: v === 'sun' ? { ctr: [0.5, 0.487], rr: 0.16 } : { ctr: [0.5, 0.49], rr: 0.255 } })));
// prismatic edges: a card's walls in holo foil, each slice its own angle (the user: "卡牌也可以做适当的厚度以及厚度棱彩花纹处理")
const RIMK = 0.043;      // (the cards' corner radius, in card heights — materials/cards/*_face.png)
const PRISM = (i) => ({ mode: 6, col: [238, 232, 255], foil: { angle: 0.7 + i * 0.41, scale: 1.1, speed: 0.12, shine: 0.75 } });
async function cardInfo(kit, n) {
  if (!CARDS[n]) { const j = await fetch(`materials/cards/${n}.json`).then((r) => r.json()); const [face, fx] = await Promise.all([kit.img(`materials/cards/${n}_face.png`), kit.img(`materials/cards/${n}_fx.png`)]);
    CARDS[n] = { ...j, face, fx, card: { fx, style: ETCH[j.style] ?? 0, metal: j.metalRGB, spk: j.spk, amt: j.amt } };   // (amt: how strong its holo is — the pastel title wants less)
    if (j.layers) { const L = {}; for (const tag of ['bg', 'fig', 'top']) { const [tx, tf] = await Promise.all([kit.img(`materials/cards/${n}_${tag}.png`), kit.img(`materials/cards/${n}_${tag}fx.png`)]);
      L[tag] = { tex: tx, card: { fx: tf, style: ETCH[j.style] ?? 0, metal: j.metalRGB, spk: tag === 'fig' ? j.spk : [] } }; } CARDS[n].L = L; } }
  return CARDS[n];
}
const EUL = new THREE.Euler(), NV = new THREE.Vector3(), QL = new THREE.Quaternion(), QW = new THREE.Quaternion(), EW = new THREE.Euler(), VW = new THREE.Vector3();
async function holoCard(kit, keys, o) {
  const C0 = await Promise.all(keys.map(([, n]) => cardInfo(kit, n))); if (C0.some((c) => !c.face)) return [];
  const size = o.size, thick = size * (o.thick ?? 0.024), order = o.order ?? 6, amp = o.amp ?? 1, ph0 = o.phase ?? 0, loop = o.loop ?? CARD_LOOP;
  const keyAt = (t) => { let k = -1; for (let i = 0; i < keys.length; i++) if (t >= keys[i][0]) k = i; return k; };
  // its hits: given (o.hits: the syllables it answers), or every other beat from a beat after it lands
  const tEnd = o.out ?? keys[keys.length - 1][0] + 6, hits = o.hits || [...Array(40).keys()].map((i) => beatT(Math.ceil(beatOf(keys[0][0])) + 2 + i * 2)).filter((x) => x < tEnd);
  const pi0 = Math.floor(hash((o.phase ?? 0) * 3.7 + size) * SNAP.length);
  const poseRaw = (t) => {
    const k = keyAt(t); if (k < 0 || (o.out != null && t > o.out + 0.35)) return null;
    const ph = (t / loop) * Math.PI * 2 + ph0;
    let ry, rx, rz, p, a = 1, show = k, s = 1;
    if (o.idle === 'float') { ry = 0.305 * Math.sin(ph) * amp; rx = 0.183 * Math.sin(ph * 2 + 0.6) * amp * 0.9 + 0.06 * Math.cos(ph) * amp; rz = (o.rz ?? 0) + 0.035 * Math.sin(ph + 1.1) * amp; p = [o.at[0], o.at[1] + 0.035 * size * Math.sin(ph), o.at[2]]; }
    else {   // (2026-11-24, "卡牌的晃来晃去的展示太简单了，有些审美疲劳"): it holds still and SNAPS to its next pose on each hit — the light runs across it then
      let j = 0; while (j < hits.length && hits[j] <= t) j++;
      // (2026-11-24, "卡牌的演出可以做的再丝滑": a 0.42 s glide with a barely-there overshoot, not a 0.22 s spring kick)
      const P1 = SNAP[(j + pi0) % SNAP.length], P0 = SNAP[(j + pi0 + SNAP.length - 1) % SNAP.length], u = j > 0 ? clamp((t - hits[j - 1]) / 0.42) : 1, e = j > 0 ? 1 - Math.exp(-6.5 * u) * Math.cos(5 * u) : 1;
      ry = lerp(P0[0], P1[0], e) * amp + 0.02 * Math.sin(t * 0.45 + ph0); rx = lerp(P0[1], P1[1], e) * amp; rz = (o.rz ?? 0) + lerp(P0[2], P1[2], e) * amp;
      p = [o.at[0], o.at[1], o.at[2] + (1 - u) * (1 - u) * 0.05 * size]; }
    const u0 = (t - keys[0][0]) / 0.45; if (u0 < 1) { ry += (1 - spring(clamp(u0) * 1.4)) * (o.from ?? -1.5); a = clamp(u0 * 5); s = 0.9 + 0.1 * outE(clamp(u0)); }
    let wipeK = null, wipeV = 0;
    if (k > 0) { const v = (t - keys[k][0]) / (o.change === 'spin' ? 0.5 : 0.42);
      if (v < 1 && o.change === 'spin') { const e = io(clamp(v)); ry += e * Math.PI * 2; if (e < 0.5) show = k - 1; p = [p[0], p[1] + Math.sin(e * Math.PI) * size * 0.06, p[2] + Math.sin(e * Math.PI) * 0.3]; }
      else if (v < 1) { show = k - 1; wipeK = k; wipeV = clamp(v); ry += 0.2 * Math.sin(wipeV * Math.PI); p = [p[0], p[1] + Math.sin(wipeV * Math.PI) * size * 0.02, p[2] + Math.sin(wipeV * Math.PI) * 0.12]; } }   // (the colour change: a flick of the wrist, the face changes behind the light)
    if (o.reveal != null) { const v = clamp((t - o.reveal) / 0.3); ry += Math.PI * (1 - io(v)); if (v > 0 && v < 1) p = [p[0], p[1], p[2] + Math.sin(v * Math.PI) * 0.4]; }   // (face-down until its reveal)
    if (o.anim) { const A = o.anim(t); if (A.dp) p = [p[0] + A.dp[0], p[1] + A.dp[1], p[2] + A.dp[2]]; if (A.dr) { rx += A.dr[0]; ry += A.dr[1]; rz += A.dr[2]; } if (A.s != null) s *= A.s; if (A.a != null) a *= A.a; }
    if (o.out != null && t > o.out && o.outStyle !== 'none') { const v = clamp((t - o.out) / 0.35); ry += io(v) * 1.5; a = 1 - sm(v); p = [p[0], p[1] - v * v * size * 0.4, p[2]]; }
    if (o.move) { const d = o.move(t); p = [p[0] + d[0], p[1] + d[1], p[2] + d[2]]; }
    if (o.pos) p = o.pos(t, p);
    if (o.frame) { const F = o.frame(t); QL.setFromEuler(EUL.set(rx, ry, rz, 'YXZ')); QW.copy(F.q).multiply(QL); EW.setFromQuaternion(QW, 'YXZ');
      VW.set(p[0], p[1], p[2]).applyQuaternion(F.q); return { p: [F.pos[0] + VW.x, F.pos[1] + VW.y, F.pos[2] + VW.z], r: [EW.x, EW.y, EW.z], a, show, s, wipeK, wipeV }; }
    return { p, r: [rx, ry, rz], a, show, s, wipeK, wipeV };
  };
  // the card leans into its own motion (banking from its velocity) — the way a held card moves (not for cards held in the camera's frame)
  const pose = (t) => { const q = poseRaw(t); if (!q || o.frame || o.noBank) return q; const q0 = poseRaw(t - 0.05); if (!q0) return q;
    const B = (x) => Math.max(-0.3, Math.min(0.3, x)), vx = (q.p[0] - q0.p[0]) / 0.05, vy = (q.p[1] - q0.p[1]) / 0.05;
    return { ...q, r: [q.r[0] + B(vy * 0.03), q.r[1] + B(vx * 0.028), q.r[2] - B(vx * 0.022)] }; };
  const layerAt = (tag, dz) => (t) => { const q = pose(t); if (!q) return null; const c = C0[q.show], Lr = c.L ? c.L[tag] : null;
    NV.set(0, 0, 1).applyEuler(EUL.set(q.r[0], q.r[1], q.r[2], 'YXZ')); const dd = dz * size;
    return { p: [q.p[0] + NV.x * dd, q.p[1] + NV.y * dd, q.p[2] + NV.z * dd], r: q.r, s: q.s, a: q.a, tex: Lr ? Lr.tex : c.face, card: Lr ? Lr.card : c.card, fx: o.fxAt ? o.fxAt(t) : undefined, layer: o.orderAt ? o.orderAt(t) + (tag === 'fig' ? 0.002 : tag === 'top' ? 0.004 : 0) : undefined }; };
  // the incoming face of a colour change: the same layers, the next pose, shown only behind the moving glare line
  const wipeAt = (tag, dz, lo) => (t) => { const q = pose(t); if (!q || q.wipeK == null) return null; const c = C0[q.wipeK], Lr = c.L ? c.L[tag] : null;
    NV.set(0, 0, 1).applyEuler(EUL.set(q.r[0], q.r[1], q.r[2], 'YXZ')); const dd = dz * size + 0.0015 * size;
    return { p: [q.p[0] + NV.x * dd, q.p[1] + NV.y * dd, q.p[2] + NV.z * dd], r: q.r, s: q.s, a: q.a, tex: Lr ? Lr.tex : c.face, card: Lr ? Lr.card : c.card, wipe: { dir: [0.55, 0.83], pos: lerp(-0.8, 0.8, io(q.wipeV)), soft: 0.035 }, layer: o.orderAt ? o.orderAt(t) + lo : undefined }; };
  const back = await cardBack(kit, /^TR/.test(keys[0][1]) ? 'sun' : 'night');
  const layered = !!C0[0].L && o.layers !== false;
  const face = { tex: layered ? C0[0].L.bg.tex : C0[0].face, h: size, mode: 8, card: layered ? C0[0].L.bg.card : C0[0].card, order, sharp: o.sharp, back,
    shadow: o.shadow === false ? null : { d: 0.06, dx: 0.1, dy: 0.14, a: 0.3, bias: 4 }, at: layered ? layerAt('bg', 0) : (t) => { const q = pose(t); if (!q) return null; const c = C0[q.show];
      return { p: q.p, r: q.r, s: q.s, a: q.a, tex: c.face, card: c.card, layer: o.orderAt ? o.orderAt(t) : undefined }; } };
  // (figure and rim depths in front of the art, in card heights — 2026-11-24, "卡牌存在图层分离": they stood 3.5 % / 6 % in front and the
  // slices spanned 8 % more, so a card turned edge-on fanned out into separate sheets; the draw order layers them, depth is only thickness)
  const DF = 0.002, DT = 0.004;
  const upper = layered ? [{ tex: C0[0].L.fig.tex, h: size, mode: 8, card: C0[0].L.fig.card, order: order + 0.002, sharp: o.sharp, single: true, at: layerAt('fig', DF) },
    { tex: C0[0].L.top.tex, h: size, mode: 8, card: C0[0].L.top.card, order: order + 0.004, sharp: o.sharp, single: true, at: layerAt('top', DT) }] : [];
  if (keys.length > 1 && o.change !== 'spin') {
    if (layered) upper.push({ tex: C0[0].L.bg.tex, h: size, mode: 8, card: C0[0].L.bg.card, order: order + 0.005, sharp: o.sharp, single: true, at: wipeAt('bg', 0, 0.005) },
      { tex: C0[0].L.fig.tex, h: size, mode: 8, card: C0[0].L.fig.card, order: order + 0.006, sharp: o.sharp, single: true, at: wipeAt('fig', DF, 0.006) },
      { tex: C0[0].L.top.tex, h: size, mode: 8, card: C0[0].L.top.card, order: order + 0.007, sharp: o.sharp, single: true, at: wipeAt('top', DT, 0.007) });
    else upper.push({ tex: C0[0].face, h: size, mode: 8, card: C0[0].card, order: order + 0.005, sharp: o.sharp, single: true, at: wipeAt('face', 0, 0.005) });
  }
  // (2026-11-24, "卡的侧面还需要优化，现在侧面存在分层穿帮"): the thickness is one solid band round the card's rounded outline (space.js rim) —
  // the 8 stacked slices showed as separate sheets when the card turned edge-on
  const rimK = (fx) => (!fx ? 1 : Math.min(fx.dissolve ?? 1, fx.tear != null ? clamp((fx.tear - 0.85) / 0.15) : 1));
  const slices = [{ tex: C0[0].face, h: size, mode: 1, col: [0, 0, 0], rimOnly: true, rim: { d: thick + (layered ? DT * size : 0), rk: RIMK, col: [238, 232, 255] }, order: order - 0.004, sharp: o.sharp,
    at: (t) => { const q = pose(t); if (!q) return null; NV.set(0, 0, 1).applyEuler(EUL.set(q.r[0], q.r[1], q.r[2], 'YXZ')); const d = layered ? DT * size : 0, fx = o.fxAt ? o.fxAt(t) : null;
      return { p: [q.p[0] + NV.x * d, q.p[1] + NV.y * d, q.p[2] + NV.z * d], r: q.r, s: q.s, a: q.a * rimK(fx), layer: o.orderAt ? o.orderAt(t) - 0.004 : undefined }; } }];
  const spark = PT.sparkTex(kit), parts = [];
  for (let i = 0; i < (o.sparks ?? 10); i++) { const front = i % 2 === 0, r0 = size * (0.42 + 0.25 * hash(i * 3.1)), a0 = hash(i * 7.7) * Math.PI * 2, sp = (hash(i * 1.3) > 0.5 ? 1 : -1);
    parts.push({ tex: spark, w: size * (0.03 + 0.04 * hash(i * 5.1)), mode: 1, col: i % 3 ? WHITE : C0[0].metalRGB, order: order + (front ? 0.008 : -0.008), sharp: true,
      at: (t) => { const q = pose(t); if (!q) return null; const ph = (t / loop) * Math.PI * 2 * sp + a0, tw = 0.5 + 0.5 * Math.sin((t / loop) * Math.PI * 4 + i);
        return { p: [q.p[0] + Math.cos(ph) * r0 * 0.9, q.p[1] + Math.sin(ph) * r0 * 1.15 + 0.05 * size * Math.sin(ph * 2), q.p[2] + (front ? 0.35 : -0.35) * size * 0.4], r: [0, 0, ph], s: 0.4 + 0.8 * tw, a: q.a * (0.35 + 0.65 * tw), layer: o.orderAt ? o.orderAt(t) + (front ? 0.008 : -0.008) : undefined }; } }); }
  return [...slices, face, ...upper, ...parts];
}
// a light card: the face (holo, mode 8) with the card back, no metal edge — for walls, rains and decks of many cards.
// at(t) → { p, r, s, a } or null; o: { size, order, pivot }
async function cardFace(kit, n, at, o = {}) {
  const c = n ? await cardInfo(kit, n) : null, back = await cardBack(kit), size = o.size ?? 1.6, ord = o.order ?? 5;
  if (o.bank !== false) { const at0 = at; at = (t) => { const st = at0(t); if (!st) return st; const s0 = at0(t - 0.04); if (!s0) return st;      // (it leans into its motion)
    const B = (x) => Math.max(-0.2, Math.min(0.2, x)), vx = (st.p[0] - s0.p[0]) / 0.04, vy = (st.p[1] - s0.p[1]) / 0.04, r = st.r || [0, 0, 0];
    return { ...st, r: [r[0] + B(vy * 0.025), r[1] + B(vx * 0.02), r[2] - B(vx * 0.016)] }; }; }
  const face = { tex: c ? c.face : back.tex, h: size, mode: c ? 8 : back.mode, card: c ? c.card : back.card, pivot: o.pivot, order: ord, sharp: o.sharp, back,
    shadow: o.shadow === false ? null : { d: 0.04, dx: 0.06, dy: 0.08, a: 0.25, bias: 3 }, at: o.layerAt ? (t) => { const st = at(t); return st && { ...st, layer: o.layerAt(t, st) }; } : at };
  const NVc = new THREE.Vector3(), Ec = new THREE.Euler();      // (o.layerAt(t, st): a card that passes behind and in front of others, e.g. on an orbit)
  const nw = o.walls ?? 3, walls = nw > 0 ? [{ tex: c ? c.face : back.still, h: size, mode: 1, col: [0, 0, 0], rimOnly: true, rim: { d: size * (o.wallStep ?? 0.007) * nw, rk: RIMK, col: [238, 232, 255] }, pivot: o.pivot, order: ord - 0.002, sharp: o.sharp,
    at: (t) => { const st = at(t); if (!st) return null; return { ...st, tex: undefined, ...(o.layerAt ? { layer: o.layerAt(t, st) - 0.002 } : {}) }; } }] : [];      // (one solid band, not stacked sheets)
  return [...walls, face];
}
// a rarity burst behind a card at its reveal: rays turning and swelling, a white bloom; pos(t) → the card's centre
function burst(kit, t0, pos, o = {}) {      // (the user, 2026-11-24: "图一的特效要做的更精致，质感要更足") a procedural burst (space.js mode 11)
  const blk = PT.blockTex(kit), sz = o.size ?? 3, seed = hash(t0 * 7.3 + sz);
  return [
    { tex: blk, w: sz * 1.25, mode: 11, col: o.col || LEMON, order: (o.order ?? 3.6) - 0.05, sharp: true, at: (t) => { const u = (t - t0) / 0.75; if (u < 0 || u > 1) return null; const p = pos(t);
      return { p: [p[0], p[1], p[2] - 0.05], r: [0, 0, u * 0.5 + (o.spin ?? 0)], s: 0.55 + 0.75 * outE(u), a: (1 - u * u) * clamp(u * 12), u, seed }; } },
  ];
}
// the camera's frame d in front of it (pos, q: plane-facing-the-lens orientation, hh: the frame's height there) — for things held in shot
const CAMM = new THREE.Matrix4(), CE = new THREE.Vector3(), CT = new THREE.Vector3(), CUP = new THREE.Vector3(0, 1, 0);
const camFrame = (camFn, d) => (t) => { const c = camFn(t); CE.set(...c.p); CT.set(...c.look); CAMM.lookAt(CE, CT, CUP); const q = new THREE.Quaternion().setFromRotationMatrix(CAMM);
  const f = CT.clone().sub(CE).normalize(); return { pos: [CE.x + f.x * d, CE.y + f.y * d, CE.z + f.z * d], q }; };
// a half-body close-up as a holo card held in the shot (the user, 2026-11-24: the cards exist to frame the half-bodies — "给这样的半身像做
// 一个卡牌来掩盖一下画面不完全的瑕疵" — and "卡牌演出做的要灵动精致"). Entrances: rise (drawn up from the bottom edge, tilted back),
// toss (thrown in from the side on an arc), spin (one turn, growing), flip (turned over from its back); each lands with a glare sweep
// across the holo and a small settling wobble. Exits: drop · flipaway · slide. o: { x, y (−1 … 1 of the frame), hFrac, fov, d, enter,
// exit, side (±1), out, order, rz }
async function cardInsert(kit, camFn, keys, o) {
  const d = o.d ?? 2.4, fov = o.fov ?? 36, hh = 2 * d * Math.tan((fov * Math.PI) / 360), hw = hh * 16 / 9, size = (o.hFrac ?? 0.62) * hh, side = o.side ?? (o.x > 0 ? 1 : -1), t0 = keys[0][0];
  const anim = (t) => {
    const u = clamp((t - t0) / 0.62), e = 1 - Math.exp(-6 * u) * Math.cos(4.6 * u), k = 1 - e, land = Math.max(0, (t - t0 - 0.4) / 0.7), wob = land < 1 ? Math.sin(land * 9) * Math.exp(-land * 5) * 0.6 : 0;
    let dp = [0, 0, 0], dr = [0, Math.sin(clamp((t - t0) / 0.5) * Math.PI) * 0.34 * side, wob * 0.05], sc = 1, a = clamp((t - t0) / 0.06);
    if (o.enter === 'rise') { dp = [0, -k * (hh * 0.75 + size * 0.5), -k * 0.3]; dr[0] += k * 1.15; dr[2] += k * 0.25 * side; }
    else if (o.enter === 'toss') { dp = [k * side * (hw * 0.55), Math.sin(u * Math.PI) * hh * 0.1, -k * 0.4]; dr[2] += k * side * 1.3; dr[0] += k * 0.4; }
    else if (o.enter === 'spin') { dr[1] += k * Math.PI * 2 * side; sc = 0.6 + 0.4 * e; dp = [0, 0, -k * 0.6]; }
    else if (o.enter === 'flip') { dr[1] += k * Math.PI * side; dp = [0, k * hh * 0.08, -k * 0.3]; }
    if (o.out != null && t > o.out) { const v = clamp((t - o.out) / 0.35);
      if (o.exit === 'vanish') { dr[1] += v * 0.3 * side; sc *= 1 + v * 0.06; }
      else if (o.exit === 'flipaway') { dr[1] += io(v) * 1.57 * side; dp[0] += v * side * hw * 0.15; a *= 1 - sm((v - 0.7) / 0.3); }
      else if (o.exit === 'slide') { dp[0] += io(v) * side * hw * 0.7; dr[2] -= v * side * 0.3; }
      else { dp[1] -= v * v * (hh * 0.8 + size * 0.5); dr[0] -= v * 0.9; } }
    return { dp, dr, s: sc, a };
  };
  return holoCard(kit, keys, { at: [(o.x ?? 0) * hw / 2, (o.y ?? -0.1) * hh / 2, 0], size, order: o.order ?? 40, rz: o.rz ?? 0, phase: o.phase ?? 0, amp: 0.9, hits: o.hits, sparks: 6, sharp: true,
    from: 0, out: o.out, outStyle: 'none', anim, frame: camFrame(camFn, d), shadow: { d: 0.02, dx: 0.03, dy: 0.04, a: 0.3, bias: 3 },
    fxAt: o.exit === 'vanish' ? (t) => (t > o.out ? { dissolve: 1 - clamp((t - o.out) / 0.33) } : null) : undefined   /* (the shader's dissolve is an entrance: run it backwards) */ }).then((pl) => (o.exit === 'vanish' ? [...pl, ...burst(kit, o.out + 0.05, (t) => { const F = camFrame(camFn, d)(t); VW.set((o.x ?? 0) * hw / 2, (o.y ?? -0.1) * hh / 2, 0.05).applyQuaternion(F.q); return [F.pos[0] + VW.x, F.pos[1] + VW.y, F.pos[2] + VW.z]; }, { size: size * 1.4, col: [255, 236, 250], order: (o.order ?? 40) + 0.05 })] : pl));
}
// one card alone in a dark studio (for the GIF preview, ?card=NAME): a breathing glow behind it, a soft shadow that slides against its tilt
export async function cardShow(kit, n) {
  const c = await cardInfo(kit, n), glow = PT.glowTex(kit), size = 4.2, loop = CARD_LOOP, mc = c.metalRGB;
  const QQ = new URLSearchParams(location.search);
  const card = await holoCard(kit, [[-1, n]], { at: [0, 0.05, 0], size, order: 6, sparks: 14, idle: QQ.has('snap') ? undefined : 'float', sharp: QQ.has('soft') ? undefined : true, shadow: QQ.has('shadow') ? undefined : false, reveal: QQ.has('back') ? 1e9 : undefined,
    orderAt: QQ.has('oa') ? () => 6 : undefined, pos: QQ.has('pos') ? (t, p) => [p[0] + 0.01, p[1], p[2]] : undefined });
  const tilt = (t) => { const ph = (t / loop) * Math.PI * 2; return [0.305 * Math.sin(ph), 0.183 * Math.sin(ph * 2 + 0.6) * 0.9 + 0.06 * Math.cos(ph)]; };
  const ph = [
    { tex: glow, w: 7.5, mode: 1, col: mixc(mc, [180, 140, 255], 0.5), order: 1, sharp: true, at: (t) => ({ p: [0, 0.1, -1.6], s: 1 + 0.08 * Math.sin((t / loop) * Math.PI * 4), a: 0.55 + 0.15 * Math.sin((t / loop) * Math.PI * 2) }) },
    { tex: glow, w: 4.4, h: 4.4 * 1.3, mode: 1, col: [4, 2, 12], order: 2, sharp: false, at: (t) => { const [ty, tx] = tilt(t); return { p: [-ty * 1.6 + 0.25, -0.35 - tx * 1.2, -0.9], a: 0.75 }; } },
    ...card,
  ];
  return { t0: -1, t1: 100, planes: ph, cam: () => ({ p: [0, 0, 8.8], look: [0, 0, 0], fov: 32, focus: 8.8, dof: 0.5, maxBlur: 10 }),
    bg: () => ({ top: mixc(mc, [20, 14, 40], 0.86), bot: [6, 4, 14] }), post: () => ({ bloom: 0.25, thr: 0.86, grain: 0.015, vig: 0.4 }) };
}
// half-body inserts (the MAD's close-up slammed in over the picture): a NovelAI half-body held in the camera's frame, its cut edge
// below the frame's bottom, popped up on its time (a fast rise + uniform pop, 0.16 s) and dropped out on o.out; keys [[t, file], …] swap
// poses as key shots. o: { x (−1 left edge … 1 right edge, the figure's centre), hFrac (its height / the frame's), rz, out, order, flip }
async function peek(kit, camFn, keys, o) {
  const tex = await Promise.all(keys.map(([, f]) => kit.img(`materials/nai/cut/${f}.png`))); if (tex.some((x) => !x)) return [];
  const asp = (T) => T.userData.w / T.userData.h, a0 = asp(tex[0]), d = o.dist ?? 1.4, E = await EDGES;
  const M4 = new THREE.Matrix4(), R = new THREE.Vector3(), U = new THREE.Vector3(), F = new THREE.Vector3(), E0 = new THREE.Euler();
  const keyAt = (t) => { let k = -1; for (let i = 0; i < keys.length; i++) if (t >= keys[i][0]) k = i; return k; };
  // a drawing cut on one side bleeds off that edge of the frame (the frame crops it, on purpose); cut on both sides → it stands in a card
  const xOf = (i, hw, H) => { const e = E[keys[i][1]] || {}, W = H * asp(tex[i]);
    if (e.left != null && e.right == null) return -hw / 2 + (0.5 - (e.x0 ?? 0)) * W - 0.004 * hw;
    if (e.right != null && e.left == null) return hw / 2 - ((e.x1 ?? 1) - 0.5) * W + 0.004 * hw;
    return (o.x ?? 0) * hw / 2; };
  const cards = [];
  keys.forEach(([, f], i) => { const e = E[f]; if (!(e && e.left != null && e.right != null)) return; const cr = cardRect(e, asp(tex[i]));
    const show = (t, st) => (keyAt(t) === i && st ? { p: st.p, r: st.r, s: [st.s[1], st.s[1]] } : null);
    cards.push({ tex: PT.cardTex(kit, cr.asp), w: cr.w, h: cr.h, pivot: cr.pivot, mode: 6, col: o.card || [232, 222, 255], sharp: true, order: (o.order ?? 40) - 0.04,
      foil: { angle: 0.9, scale: 0.3, speed: 0.05, shine: 0.22 }, shadow: { d: 0.01, dx: 0.012, dy: 0.016, a: 0.2, bias: 3 }, at: (t) => show(t, main.at(t)) },
      { tex: PT.cardRimTex(kit, cr.asp, o.cardLabel), w: cr.w, h: cr.h, pivot: cr.pivot, mode: 1, col: WHITE, sharp: true, order: (o.order ?? 40) - 0.03, at: (t) => show(t, main.at(t)) }); });
  const main = { tex: tex[0], h: 1, pivot: [0.5, 1], order: o.order ?? 40, sharp: true, shadow: { d: 0.01, dx: 0.012, dy: 0.016, a: 0.22, bias: 3 }, at: (t) => {
    let k = -1; for (let i = 0; i < keys.length; i++) if (t >= keys[i][0]) k = i; if (k < 0 || (o.out != null && t > o.out + 0.22)) return null;
    const c = camFn(t); M4.lookAt(new THREE.Vector3(...c.p), new THREE.Vector3(...c.look), new THREE.Vector3(0, 1, 0)); M4.extractBasis(R, U, F); F.negate();
    E0.setFromRotationMatrix(M4, 'YXZ');
    const hh = 2 * d * Math.tan(((c.fov || 36) * Math.PI) / 360), hw = hh * 16 / 9, H = (o.hFrac ?? 0.78) * hh;
    const u0 = (t - keys[0][0]) / 0.16, rise = u0 < 1 ? (1 - outE(clamp(u0))) * 0.35 * H : 0;
    const u = (t - keys[k][0]) / 0.2, sq = u < 1 ? 0.9 + 0.1 * spring(clamp(u) * 1.3) : 1, v = o.out != null ? clamp((t - o.out) / 0.22) : 0;
    const x = xOf(k, hw, H), y = -hh / 2 - 0.03 * H - rise - v * v * H * 1.1 + 0.012 * H * pulse(t, 7);
    return { p: [c.p[0] + F.x * d + R.x * x + U.x * y, c.p[1] + F.y * d + R.y * x + U.y * y, c.p[2] + F.z * d + R.z * x + U.z * y],
      r: [E0.x, E0.y, E0.z + (o.rz ?? 0) + (u < 1 ? (1 - clamp(u)) * 0.08 * (k % 2 ? 1 : -1) : 0)], s: [H * sq * asp(tex[k]) / a0 * (o.flip ? -1 : 1), H * sq], tex: tex[k] };   // (the plane is a0 wide at h 1: scale by the pose's aspect / a0)
  } };
  return [...cards, main];
}
// (deco: the ink may change with time too — inkAt(t, i))
const camFace = (camFn, tex, o = {}) => ({ tex, w: 1, h: 1, mode: o.mode ?? 0, col: o.col, order: o.order ?? 50, sharp: true, at: (t) => {
  if (!o.on(t)) return null; const c = camFn(t), d = o.dist ?? 0.6, f = new THREE.Vector3(...c.look).sub(new THREE.Vector3(...c.p)).normalize();
  const m = new THREE.Matrix4().lookAt(new THREE.Vector3(...c.p), new THREE.Vector3(...c.look), new THREE.Vector3(0, 1, 0)); EU.setFromRotationMatrix(m, 'YXZ');
  const hh = 2 * d * Math.tan(((c.fov || 36) * Math.PI) / 360) * 1.02; return { p: [c.p[0] + f.x * d, c.p[1] + f.y * d, c.p[2] + f.z * d], r: [EU.x, EU.y, EU.z], s: [hh * 16 / 9, hh] };
} });
// the size at which a line fits a width (measured with the same font)
const fitSize = (kit, str, o, maxW) => { const w = letters(kit, str, { ...o, size: 1, times: [...str].map(() => 0) }).width; return Math.min(o.size, maxW / Math.max(w, 1e-3)); };
const stamp = (t, t0, d = 0.28) => { const u = (t - t0) / d; return u < 0 ? null : 1 + 0.5 * (1 - spring(u * 1.4)); };

// ---- the penlight sea and the lasers (three.js objects in the stage's scene) ----------------------------------------
function penlights(o) {
  const n = o.n ?? 9000, pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { const r = hash(i * 1.37 + 0.1), q = hash(i * 7.91 + 3.3); pos[i * 3] = (r - 0.5) * o.w; pos[i * 3 + 1] = o.y + (hash(i * 2.2) - 0.5) * 0.25; pos[i * 3 + 2] = o.z0 - q * o.d; seed[i] = hash(i * 4.4 + 9.9); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uWave: { value: 1e9 }, uWaveCol: { value: new THREE.Color(1, 0.8, 0.36) }, uBase: { value: new THREE.Color(1, 0.75, 0.88) }, uBeat: { value: 0 }, uH: { value: 1080 }, uA: { value: 1 } },
    vertexShader: `in float seed; uniform float uT, uWave, uBeat, uH; out float vS; out float vW;
      void main() { vec3 p = position; float sway = sin(uT * 3.69 + seed * 6.28 + p.x * 0.15) * 0.18; p.x += sway; p.y += 0.12 * uBeat * (0.5 + seed);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
        // the wave: from the front rows to the back, a band of light that leaves the new colour behind it
        float front = (uT - uWave) * 18.0; vW = smoothstep(0.0, 4.0, front - (-position.z - 2.0) + seed * 2.0);
        vS = seed; gl_PointSize = clamp(uH * 0.12 / -mv.z * (0.8 + 0.5 * seed), 1.0, 26.0); }`,
    fragmentShader: `precision highp float; uniform vec3 uWaveCol, uBase; uniform float uBeat, uA; in float vS; in float vW; out vec4 frag;
      void main() { vec2 d = gl_PointCoord - 0.5; float r = length(d); float k = exp(-r * r * 26.0) + 0.35 * exp(-r * r * 6.0);
        vec3 base = mix(uBase, vec3(1.0), step(0.6, vS) * 0.55); vec3 c = mix(base, uWaveCol, vW);
        frag = vec4(c * k * (0.55 + 0.35 * uBeat + 0.2 * vS) * uA, 1.0); }` });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 2; pts.matrixAutoUpdate = false;
  return { obj: pts, mat, update: (t, c) => { mat.uniforms.uT.value = t; mat.uniforms.uBeat.value = pulse(t, 6); mat.uniforms.uH.value = c.H; if (o.wave) mat.uniforms.uWave.value = o.wave; if (o.alpha) mat.uniforms.uA.value = o.alpha(t); return !o.on || (t >= o.on[0] && t < o.on[1]); } };
}
function lasers(o) {
  const n = o.n ?? 14, pos = new Float32Array(n * 6), col = new Float32Array(n * 6);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
  const L = new THREE.LineSegments(g, mat); L.frustumCulled = false; L.renderOrder = 3;
  return { obj: L, update: (t) => {
    if (o.on && (t < o.on[0] || t >= o.on[1])) return false;
    const b = Math.floor(beatOf(t)), p = pulse(t, 5);
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1, base = [side * (6 + (i % 4) * 3), -3.6, -14 - (i % 5) * 4];
      const a = 0.35 + 0.5 * Math.sin(t * 0.9 + i * 1.3) + (hash(b * 3 + i) - 0.5) * 0.5;
      const dir = [-side * Math.cos(a) * 0.8, Math.sin(Math.abs(a)) + 0.6, 0.5 + 0.3 * Math.sin(t * 0.5 + i)];
      const len = 60; pos.set([...base, base[0] + dir[0] * len, base[1] + dir[1] * len, base[2] + dir[2] * len], i * 6);
      const c = i % 3 === 0 ? o.c2 || [1, 0.18, 0.6] : o.c1 || [0.27, 0.93, 1]; const k = (0.35 + 0.65 * p) * (o.alpha ? o.alpha(t) : 1);
      col.set([c[0] * k, c[1] * k, c[2] * k, c[0] * k * 0.1, c[1] * k * 0.1, c[2] * k * 0.1], i * 6);
    }
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; return true;
  } };
}

export async function sample(kit) {
  const LY = await lyrics(), ln = (n) => LY.line(n);
  GLOSS = await fetch('audio/gloss.json').then((r) => r.json(), () => ({}));
  const SWEET = await Promise.all([...Array(8).keys()].map((i) => kit.img(`materials/gpt/sweet_${i}.png`)));
  const B22 = bar(22), B27 = bar(27), B41 = bar(41);
  const sets = [];

  // ======================================== A 其の一「燕の子安貝」 ========================================
  {
    const T0 = 28.6, T1 = B22;
    // the phone: a 2030 vertical flip foldable (ChatGPT, materials/gpt/zflip_*). The user: "futurism的体现应该是有简约设计感，而非是脉冲线条",
    // "不要做翻盖机子…做折叠机", "折叠屏可以参考…竖折叠，这样比较可爱". Shut, a small rounded compact with a round cover screen; it opens about its
    // crease (子安貝: the shell opens), then turns sideways — its tall inner screen becomes a wide one, and the live is on it.
    const GZ = await fetch('materials/gpt/zflip.json').then((r) => r.json());
    // (2026-11-24, "刚展开时的取景中缝有绿线闪烁": the green-screen fill is keyed out to dark glass — zflip_*_glass.png — and the halves overlap at the crease)
    const [zLid, zBody, zShell] = await Promise.all(['lid_glass', 'body_glass', 'shell'].map((n) => kit.img(`materials/gpt/zflip_${n}.png`)));
    const OHZ = 4.6, KZ = OHZ / GZ.open[1], ZW = GZ.open[0] * KZ, LH = GZ.hinge * KZ, BH = (GZ.open[1] - GZ.hinge) * KZ, SC = GZ.screen;
    const SWZ = (SC[2] - SC[0]) * KZ, SXZ = ((SC[0] + SC[2]) / 2 - GZ.open[0] / 2) * KZ, SLid = (GZ.hinge - SC[1]) * KZ, SBody = (SC[3] - GZ.hinge) * KZ;
    const tOpen = 28.62, tTurn = beatT(58) - 0.02, tTune = tTurn + 0.2;
    const theta = (t) => Math.PI * (1 - spring(clamp((t - tOpen) / 0.5) * 1.6));
    const phi = (t) => -Math.PI / 2 * spring(clamp((t - tTurn) / 0.45) * 1.6);
    // (shut, the compact is centred; open, the whole phone; turned, the screen's middle sits at the frame's middle)
    const posAt = (t) => { const k = io((t - tOpen) / 0.5), k2 = io((t - tTurn) / 0.45); const midS = (SLid - SBody) / 2; return lerp3(lerp3([0, LH / 2, 0], [0, (BH - LH) / 2, 0], k), [-midS, SXZ, 0], k2); };
    const lidFrame = (t) => ({ pos: posAt(t), q: qAxis(Z, phi(t)).multiply(qAxis(X, theta(t))) }), bodyFrame = (t) => ({ pos: posAt(t), q: qAxis(Z, phi(t)) });
    const ph = [];
    ph.push(...attach([plane(zBody, { w: ZW, h: BH, pivot: [0.5, 0], order: 1, mode: 9, mat: { ...MAT.pearl, bevel: 5 }, at: (t) => (theta(t) > 3.05 ? null : { p: [0, 0, 0] }), shadow: { d: 0.05, dx: 0.08, dy: 0.12, a: 0.3, bias: 3 } })], bodyFrame));
    ph.push(...attach([plane(zLid, { w: ZW, h: LH, pivot: [0.5, 1], order: 2, mode: 9, mat: { ...MAT.pearl, bevel: 5 }, back: { tex: zShell, mode: 0 } })], lidFrame));
    // until it turns, the inner screen glows (a soft foil lock screen); then the live, split over the two halves of the screen
    const glow = PT.blockTex(kit);
    // (the halves show ONE wallpaper as two adjacent crops — the lid's runs OV past the crease with the body's own picture there — so the
    // unfolding screen has no seam; the foil they had was computed per half and could not meet at the crease: "手机刚展开的时候还是有接缝")
    const OV = 0.03, LTOT0 = SLid + SBody, lock = PT.lockTex(kit, LTOT0 / SWZ);      // (the lid's half reaches this far past the crease over the body's)
    ph.push(...attach([plane(lock, { w: SWZ, h: SBody, pivot: [0.5, 0], mode: 0, crop: [0, SLid / LTOT0, 1, SBody / LTOT0], order: 1.2, at: (t) => (t > tTune + 0.4 || theta(t) > 3.0 || t >= tOpen + 0.5 ? null : { p: [SXZ, 0, 0.008] }) })], bodyFrame));
    ph.push(...attach([plane(lock, { w: SWZ, h: SLid + OV, pivot: [0.5, 1], mode: 0, crop: [0, 0, 1, (SLid + OV) / LTOT0], order: 2.2, at: (t) => (t > tTune + 0.4 || theta(t) > 1.5 || t >= tOpen + 0.5 ? null : { p: [SXZ, -OV, 0.008] }) })], lidFrame));
    // (2026-11-24, "手机屏幕要做一整块连贯的，现在画面中间有拼接割裂": once the lid has settled the screen is ONE sheet across the crease, rounded like the glass)
    const SR = 0.2, midY = (SLid - SBody) / 2;
    ph.push(...attach([plane(lock, { w: SWZ, h: LTOT0, mode: 0, order: 2.25, round: SR, at: (t) => (t < tOpen + 0.5 || t > tTune + 0.4 ? null : { p: [SXZ, midY, 0.012] }) })], bodyFrame));
    // the picture (16:9) laid along the turned screen: the body's part is its left, the lid's its right; turned a quarter on the phone so it stands upright
    const LTOT = SLid + SBody, ASPZ = LTOT / SWZ, chZ = Math.min(1, (16 / 9) / ASPZ), fb = SBody / LTOT;
    const hairCols = [null, Y_SILVER, MIKU];            // gold (her own), silver, teal — one a beat over the hair line
    const hairKey = (t, region) => { const b = Math.floor(beatOf(t + 0.02)), kc = t > 30.7 && t < 33.96 ? hairCols[((b % 3) + 3) % 3] : null; return kc ? { hue: 8, width: 24, sat: 0.13, col: kc, a: 1, region } : null; };
    const tuneFx = mash(FX.mosaic(tTune, 0.5), FX.scan(tTune, 0.45, 0)), CRT = { a: 0.3, lines: 280, mask: 0.25, fringe: 1 };
    const screen = plane(null, { w: LTOT, h: SWZ, order: 2.3, footage: live, crop: [0, (1 - chZ) / 2, 1, chZ], crt: CRT, fx: tuneFx, round: SR,
      at: (t) => (t < tTune ? null : { p: [SXZ, midY, 0.014], r: [0, 0, Math.PI / 2], key: hairKey(t, [0.3, 0, 1.0, 1]) }) });
    ph.push(...attach([screen], bodyFrame));
    const SW = LTOT, SCY = 0;

    // the house rules (the film's own comedy) in torn panels behind the phone, one per rule
    const panel = (name, t0, t1, p, rz, w = 2.5) => plane(null, { w, h: w * 9 / 16, footage: clip(name, t0, 1, 0), order: 0.3, rag: { kind: 'torn', w: 0.16, e: [1, 1, 1, 1] }, shadow: { d: 0.04, dx: 0.06, dy: 0.08, a: 0.25, bias: 3 },
      at: (t) => { if (t < t0 || t > t1 + 0.35) return null; const u = (t - t0) / (0.35 * 0.6), e = spring(u * 1.5), v = clamp((t - t1) / 0.35);
        return { p: [p[0] + (1 - e) * 2.5, p[1] - (1 - e) * 0.6 - v * v * 3, p[2]], r: [0, 0, rz + (1 - e) * 0.4 + v * 0.6], a: 1 - sm(v) }; } });
    const L3 = ln(3), L4 = ln(4), L5 = ln(5), L6 = ln(6), L7 = ln(7), L8 = ln(8);
    ph.push(panel('r1', 29.25, L4.t0 - 0.1, [3.4, 1.25, -1.6], 0.08), panel('r2', L4.t0 - 0.05, L6.t0 - 0.1, [3.5, -1.2, -1.6], -0.07), panel('r3', L6.t0 - 0.05, L7.t0 + 0.6, [-3.4, 1.25, -1.7], 0.06));

    // ---- lyrics: その一 on the mail, the rest along the top (gold: Kaguya) — Chinese below the screen in her colour
    const topY = 2.06, zhY = -2.2, X0 = -3.75, MAXW = 7.5;      // (the rows sit inside the main framing: x −1.97 … 3.3, y −1.3 … 1.6)
    const p1 = L3.part('その一'), rest3 = L3.text.replace('その一', '').trim(), r3 = L3.part(rest3);
    // (その一 now leads the top row)
    const rowA = (L, o) => glossLine(kit, L, { font: 'HachiMaru', px: 170, size: 0.3, at: [X0, topY, 0.6], maxW: MAXW, lineH: topY + 2.22, strokeK: 0.2, zhSize: 0.15, order: 6, ...o });
    // (space: その一 stands as a wall receding to the right; その二 lies on the floor in front of the phone — 「靴まで見ること」, the camera
    // looks down to it; その三 flies in from scattered depth and locks; the hand's line recedes to the left)
    ph.push(rowA(L3, { enter: 'scramble', scr: 0.35, col: K_GOLD, ink: K_GOLD_D, chip: K_GOLD, chipInk: [90, 50, 0], out: L4.t0 - 0.18, at: [X0 - 0.1, 1.55, 0.6], rot: [0, 0.34, 0] }));
    // その二 (silver: Yachiyo) — then いいね？ stamped beside the strip
    ph.push(rowA(L4, { enter: 'flap', col: Y_SILVER, ink: Y_SILVER_D, chip: Y_SILVER_D, chipInk: WHITE, out: L6.t0 - 0.08, at: [X0 + 0.2, -1.55, 1.6], rot: [-1.0, 0, 0], size: 0.36, zhSize: 0.17 }));
    ph.push(glossLine(kit, L5, { mode: 'under', font: 'DelaGothic', px: 160, size: 0.42, at: [-3.4, -1.55, 0.9], maxW: 3, enter: 'zoom', col: DECO, ink: WHITE, chip: WHITE, chipInk: DECO, zhSize: 0.16, order: 7, out: L6.t0 + 0.2 }));
    // the photo strip on その二: three cells, one a beat, each its own crop of the shoes (the synced shoe shot)
    const strip = PT.stripTex(kit), sx = -3.45, sy = 0.0, sz = 0.6, sw = 0.8, shh = sw * 2.5;
    const stripOn = [L4.t0 + 0.25, 37.5];          // (gone before the shoe shot ends at 37.62: the cells never show another shot)
    const stripAt = (dy = 0, dz = 0) => (t) => { if (t < stripOn[0] || t > stripOn[1] + 0.3) return null; const e = spring(((t - stripOn[0]) / 0.3) * 1.5), v = clamp((t - stripOn[1]) / 0.3);
      const rz = 0.08 - (1 - e) * 0.3;      // (a cell's offset turns with the strip, so the cells stay in their slots)
      return { p: [sx - Math.sin(rz) * dy, sy + Math.cos(rz) * dy - (1 - e) * 2.2 - v * v * 3, sz + dz], r: [0, 0, rz], a: 1 - sm(v) }; };
    ph.push(plane(strip, { w: sw, h: shh, order: 6.6, mode: 9, mat: MAT.pearl, at: stripAt(), shadow: { d: 0.04, dx: 0.06, dy: 0.08, a: 0.3, bias: 3 } }));
    const cellT = [beatT(69), beatT(70), beatT(71)];      // ≈ 35.33, 35.84, 36.35 (the shoe shot runs 35.24–37.62; a cell shows only it, never a held frame)
    const cw = sw * 500 / 600, chh = cw * 380 / 500, cwf = 0.26, chf = cwf * 1280 / 720 * (380 / 500);
    const shoeC = [(t) => [lerp(0.9, 0.55, clamp((t - 35.3) / 0.9)) - (t > 36.2 ? (t - 36.2) * 0.12 : 0), 0.8], () => [0.86, 0.8], () => [0.12, 0.84]];
    shoeC.forEach((cAt, i) => ph.push(plane(null, { w: cw, h: chh, order: 6.5, footage: live, round: 0.08, at: (t) => { const s0 = stripAt(shh * (0.5 - (70 + i * 440 + 190) / 1500), -0.01)(t); if (!s0 || t < cellT[i]) return null; const [cx, cy] = cAt(t); return { ...s0, s: 1 + 0.15 * (1 - sm((t - cellT[i]) / 0.2)), crop: [clamp(cx - cwf / 2, 0, 1 - cwf), clamp(cy - chf / 2, 0, 1 - chf), cwf, chf] }; } })));
    // その三 (both: teal) — the line along the top; its Chinese answers in three chat bubbles, one a beat
    ph.push(deco(kit, L6.text, { font: 'HachiMaru', px: 170, size: fitSize(kit, L6.text, { font: 'HachiMaru', px: 170, size: 0.26 }, MAXW), at: [X0, 1.6, 0.3], times: L6.times, enter: 'fly', spread: 9, dur: 0.5, seed: 6, col: MIKU, ink: MIKU_D, order: 6, out: L7.t0 - 0.06, outStyle: 'fall' }));
    const zh6 = L6.zh.trim().split(/\s+/), head6 = zh6[0], rest6 = [...zh6.slice(1).join('')], cut6 = Math.ceil(rest6.length / 2), parts6 = [head6, rest6.slice(0, cut6).join(''), rest6.slice(cut6).join('')];
    const bub = PT.bubbleTex(kit, 'b1', 900, 260, 'left'), bubR = PT.bubbleTex(kit, 'b2', 900, 260, 'right');
    const bubT = [beatT(76), beatT(77), beatT(78)];       // ≈ 38.89, 39.40, 39.91
    parts6.forEach((s, i) => {
      const bx = [-2.4, 0.2, 2.7][i], by = -2.2 + (i % 2) * 0.08, bw = Math.max(0.9, [...s].length * 0.2 + 0.5);
      ph.push(object(i % 2 ? bubR : bub, { at: [bx, by, 0.7], size: bw * 0.36, w: bw, t0: bubT[i], enter: 'pop', mode: 1, col: MIKU, order: 7, out: L7.t0 + 0.4 + i * 0.05, outStyle: 'slide', to: [0, -3, 0], shadow: false }));
      ph.push(letters(kit, s, { font: 'ChillRound', px: 140, size: 0.18, align: 'center', at: [bx, by - 0.02, 0.72], times: [...s].map((_, j) => bubT[i] + 0.06 + j * 0.03), enter: 'pop', col: WHITE, order: 7.2, out: L7.t0 + 0.4 + i * 0.05, outDur: 0.25 }));
    });
    // the right hand: a pixel cursor glides to a candy button and clicks it on 「なんとかして！」
    const hand = PT.handTex(kit), btn = PT.buttonTex(kit, 'hold', '♡ 手をつなぐ ♡'), tClick = L8.t0 + 0.02;
    const btnP = [0, -SWZ * 0.32, 0.3];
    ph.push(object(btn, { at: btnP, size: 0.46, w: 1.6, t0: L7.t0 + 0.4, enter: 'stamp', order: 7.5, mode: 9, mat: MAT.acrylic, anim: (t) => (t >= tClick ? { s: 1 - 0.12 * Math.exp(-(t - tClick) * 10) * Math.sin(Math.min(Math.PI, (t - tClick) * 20)) } : null), shadow: { d: 0.05, dx: 0.05, dy: 0.08, a: 0.3, bias: 3 } }));
    const path = (t) => { const u = io(clamp((t - L7.t0) / (tClick - 0.12 - L7.t0))); const p0 = [4.4, -2.3], p1 = [btnP[0] + 0.15, btnP[1] - 0.12]; const arc = Math.sin(u * Math.PI) * 0.5;
      return [lerp(p0[0], p1[0], u) + 0.08 * Math.sin(t * 7) * (1 - u), lerp(p0[1], p1[1], u) + arc, 1.0]; };
    ph.push(plane(hand, { w: 0.42, order: 8, sharp: true, at: (t) => (t < L7.t0 || t > T1 ? null : { p: path(t), r: [0, 0, 0.25], s: t >= tClick ? 1 - 0.15 * Math.exp(-(t - tClick) * 12) : 1 }) }));
    // the lines of the hand (silver: Yachiyo)
    ph.push(rowA(L7, { enter: 'spin', col: Y_SILVER, ink: Y_SILVER_D, chip: Y_SILVER_D, chipInk: WHITE, out: T1 - 0.1, at: [X0 + 0.4, 1.75, 0.2], rot: [0, -0.3, 0] }));
    ph.push(glossLine(kit, L8, { mode: 'under', font: 'DelaGothic', px: 180, size: 0.62, align: 'center', at: [0.9, -0.2, 1.4], maxW: 6, enter: 'zoom', col: DECO, ink: WHITE, strokeK: 0.22, chip: DECO, chipInk: WHITE, zhSize: 0.19, order: 9 }));
    // sparkles from the click
    const spark = PT.sparkTex(kit);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + 0.3, r = 0.5 + hash(i) * 0.6; ph.push(plane(spark, { w: 0.28 + hash(i * 3) * 0.2, mode: 1, col: i % 2 ? LEMON : WHITE, order: 8.5, sharp: true,
      at: (t) => { const u = (t - tClick) / 0.45; if (u < 0 || u > 1) return null; const k = outE(u); return { p: [btnP[0] + Math.cos(a) * r * k, btnP[1] + Math.sin(a) * r * k, 0.9], r: [0, 0, u * 3], s: Math.sin(u * Math.PI), a: 1 }; } })); }
    // the live jumps out of the screen to fill the picture (handed on to the booth): 45.10 → 45.50
    ph.push(plane(null, { w: 11.55 * 0.62, h: 6.5 * 0.62, footage: live, order: 9.5, round: 0.35, at: (t) => {
      const u = (t - tClick - 0.05) / (T1 - tClick - 0.05); if (u < 0) return null; const k = io(u);
      const from = [0, SCY, 0.03], to = [0, 0, 3.4];
      return { p: lerp3(from, to, k), r: [0, 0, 0], s: lerp(SW / (11.55 * 0.62), 0.62, k), a: clamp(u * 6) };
    } }));
    const cam = camTrack([           // (2026-11-24: orbits and tilts round the phone, keyed to the rules — not only a dolly)
      { t: 28.6, p: [0, 0, 6.4], look: [0, 0, 0] },
      { t: tTune, p: [-2.1, 0.6, 7.1], look: [0.1, 0.1, 0] },
      { t: 33.3, p: [-0.6, 0.3, 7.0], look: [0.2, 0.05, 0] },
      { t: L4.t0 + 0.3, p: [1.9, 1.4, 6.9], look: [0.0, -0.45, 0] },
      { t: 37.4, p: [0.9, 1.7, 6.7], look: [-0.2, -0.6, 0] },
      { t: L6.t0 + 0.2, p: [0.2, -1.6, 6.8], look: [0.0, 0.35, 0] },
      { t: 39.9, p: [-1.8, -0.9, 7.0], look: [0.0, 0.15, 0] },
      { t: 42.0, p: [1.6, 0.4, 7.2], look: [0.0, 0.0, 0] },
      { t: 44.7, p: [0.4, -0.3, 6.5], look: [0.0, -0.35, 0] },
      { t: tClick, p: [0.0, -0.5, 5.6], look: [0.0, -0.55, 0] },
      { t: T1, p: [0.0, -0.1, 4.6], look: [0.0, -0.1, 0] },
    ]);
    // a step forward on each downbeat (never back: not shake), the lens a hair wider on the beat
    const sway = (t) => { const u = (t - bar(14)) / (BEAT * 8); return [0.32 * Math.sin(Math.PI * 2 * u), 0.1 * Math.cos(Math.PI * 2 * u * 1.5), -0.22 * Math.abs(Math.sin(Math.PI * 2 * u))]; };
    const camA = (t) => { const c0 = cam(t), w = t > tTurn + 0.5 ? sway(t) : [0, 0, 0], c = { ...c0, p: [c0.p[0] + w[0], c0.p[1] + w[1], c0.p[2] + w[2]], look: [c0.look[0] + w[0] * 0.4, c0.look[1] + w[1] * 0.4, c0.look[2]] }, k = pulse(t, 8, 4) * 0.015; const d = [c.look[0] - c.p[0], c.look[1] - c.p[1], c.look[2] - c.p[2]]; return { ...c, p: [c.p[0] + d[0] * k, c.p[1] + d[1] * k, c.p[2] + d[2] * k], fov: 36, focus: Math.hypot(...d), dof: 0.6, maxBlur: 10 }; };
    // (the typed-keys device of the flip phone is gone with its keypad)
    const STK = [PT.sparkTex(kit), SWEET[5], SWEET[7], SWEET[3], SWEET[2]];
    const SPOTS = [[-2.6, 1.55], [2.6, 1.6], [-2.9, -1.95], [2.9, -2.0]];      // (the left margin: the singers' stickers own the right)
    for (let b = Math.ceil(beatOf(tTurn + 0.6)); beatT(b) < tClick - 0.2; b++) {
      const tb = beatT(b), sp = SPOTS[b % SPOTS.length], tx = STK[b % STK.length];
      ph.push(plane(tx, { w: 0.34 + hash(b) * 0.18, mode: tx === STK[0] ? 1 : 0, col: tx === STK[0] ? WHITE : undefined, order: 5.5, sharp: true, at: (t) => {
        const u = t - tb; if (u < 0 || u > BEAT * 2) return null; const e = spring(u / 0.25 * 1.4), out = clamp((u - BEAT * 1.6) / (BEAT * 0.4));
        return { p: [sp[0], sp[1], 0.8], r: [0, 0, (hash(b * 2) - 0.5) * 0.8 + u * 0.6], s: e * (1 - out), a: 1 }; } }));
    }
    // the singers as pop stickers (NovelAI), key shots per phrase at the frame's edges, in front of the collage
    // その一 「髪形に」: her half-body (the moon ornament in her hair) slammed up from the bottom left — the hair she wants noticed
    const kHair = L3.part('髪形') || { times: [L3.t0 + 1.6] };
    ph.push(...(await cardInsert(kit, (t) => camA(t), [[kHair.times[0] - 0.04, 'KD_hb_wink']], { x: -0.6, y: -0.12, hFrac: 0.64, enter: 'rise', exit: 'vanish', rz: 0.05, out: L4.t0 - 0.5, order: 40 })));
    // (2026-11-24, "卡牌…有些审美疲劳": clean full figures stand free in the scene again — cards are for the cut drawings and the chorus moves)
    ph.push(...(await stickerSeq(kit, [[L3.t0 + 0.9, 'KD_peace'], [(L3.real[10] || L3.real[L3.real.length - 1]).t0, 'KD_heart']], { at: [3.25, -2.5, -1.4], size: 3.6, rz: 0.04, out: L4.t0 - 0.12, order: 0.8 })));
    ph.push(...(await holoCard(kit, [[L4.t0 + 0.1, 'YD_twirl'], [((L4.part('靴') || { times: [] }).times[0] ?? L4.t0 + 1.2), 'YD_bow'], [L5.t0, 'YD_heart']], { at: [-3.45, -0.15, -1.6], size: 3.3, rz: -0.06, out: L6.t0 - 0.12, order: 0.8, phase: 1.7, from: 1.5 })));
    // その三 (both voices): the two of them as half-bodies at both edges, then full figures on 「三つの言葉で」
    const k6b = L6.part('三つ') || { times: [L6.t0 + 2.0] }, t6b = k6b.times[0] - 0.04;
    ph.push(...(await cardInsert(kit, (t) => camA(t), [[L6.t0 + 0.02, 'KD_hb_smile']], { x: 0.62, y: -0.1, hFrac: 0.6, enter: 'toss', exit: 'flipaway', rz: -0.06, out: t6b - 0.2, order: 40, phase: 1 })));
    ph.push(...(await cardInsert(kit, (t) => camA(t), [[L6.t0 + 0.02 + BEAT, 'YD_hb_gentle']], { x: -0.62, y: -0.1, hFrac: 0.6, enter: 'toss', exit: 'flipaway', rz: 0.06, out: t6b - 0.2, order: 40.5, phase: 2.3 })));
    ph.push(...(await stickerSeq(kit, [[t6b, 'KD_jump']], { at: [2.85, -2.45, 2.0], size: 2.5, rz: 0.08, out: L7.t0 - 0.1, order: 8.2 })));
    ph.push(...(await holoCard(kit, [[t6b + BEAT / 2, 'YD_kiss']], { at: [-2.7, -1.15, 2.0], size: 2.1, rz: -0.1, out: L7.t0 - 0.1, order: 8.1, phase: 2.4 })));
    ph.push(...(await holoCard(kit, [[L7.t0 + 0.05, 'YD_whisper'], [L8.t0, 'YD_point']], { at: [3.45, -0.15, -1.6], size: 3.3, rz: 0.05, out: T1 - 0.15, order: 0.8, phase: 3.1 })));
    // foreground: a sweet drifts across close to the lens every other bar, out of focus (depth in front of everything)
    for (let k = 0, tb = bar(Math.ceil((tTurn + 0.6 - bar(0)) / (BEAT * 4))); tb < tClick - 1.2; k++, tb += BEAT * 8) {
      const sw = SWEET[[1, 6, 0, 4, 2][k % 5]], dir = k % 2 ? -1 : 1, y0 = [-1.2, 1.0, -0.4, 0.8][k % 4];
      ph.push(plane(sw, { w: 1.5, order: 30, at: (t) => { const u = (t - tb) / 2.2; if (u < 0 || u > 1) return null; const c = camA(t);
        const f = [c.look[0] - c.p[0], c.look[1] - c.p[1], c.look[2] - c.p[2]], fl = Math.hypot(...f), d = 2.4;
        return { p: [c.p[0] + f[0] / fl * d + dir * lerp(-2.6, 2.6, u), c.p[1] + f[1] / fl * d + y0 + 0.25 * Math.sin(u * 3), c.p[2] + f[2] / fl * d], r: [0.3 * Math.sin(u * 2), u * 2.2 * dir, u * 1.4 * dir] }; } }));
    }
    // two sizes of type at once (the duotone GMV: a giant letter behind her, a small word typing at the edge): each rule's numeral,
    // huge, standing behind the phone in the singer's colour (一 gold, 二 silver, 三 teal: both), flapping in on the rule's first syllable
    for (const [ch, t0, t1, col, ink] of [['壱', p1.t0 - 0.05, L4.t0 - 0.06, K_GOLD, K_GOLD_D], ['弐', L4.t0 - 0.05, L6.t0 - 0.06, Y_SILVER, Y_SILVER_D], ['参', L6.t0 - 0.05, L7.t0 - 0.06, MIKU, MIKU_D]])
      ph.push(deco(kit, ch, { font: 'DelaGothic', px: 400, size: 4.2, align: 'center', at: [-2.9, -1.6, -2.4], times: [t0], enter: 'flap', col, ink, strokeK: 0.06, order: -1, out: t1, outStyle: 'flap', outDur: 0.25, hit: 0.05, follow: false }));
    // micro labels (the structure layer of the two PVs: small type as texture, set in depth beside the big numeral)
    const micro = (str, t0, t1, at, col, size = 0.1, rot = [0, 0, 0]) => letters(kit, str, { font: 'Unbounded', px: 120, size, at, rot, times: [...str].map((_, j) => t0 + j * 0.018), enter: 'type', col, order: -0.5, out: t1, outDur: 0.15, follow: false });
    [[p1.t0, L4.t0 - 0.06], [L4.t0, L6.t0 - 0.06], [L6.t0, L7.t0 - 0.06]].forEach(([a0, a1], k) => ph.push(micro(`HOUSE RULE 0${k + 1} / 03`, a0, a1, [-5.0, 0.95, -2.4], [150, 120, 200], 0.13)));
    ph.push(micro('TSUKUYOMI · ID 2030.11 · KAGUYA ⇄ YACHIYO', tTune + 0.3, T1 - 0.2, [-4.6, -2.05, -0.6], [140, 120, 190], 0.09), micro('LIVE ▶ 3006 WATCHING', tTune + 0.5, T1 - 0.2, [2.2, 1.55, -0.4], [140, 120, 190], 0.09));
    // 1–2-frame punctuation (the GMV's UI inserts): an incoming-mail screen flashes full frame as each new rule arrives
    // each new rule arrives as a notification sliding down over the top of the screen (it was a 2-frame full-frame insert that read as a
    // broken frame — "约0:00:04处存在纯色坏帧")
    [[L4.t0 - 0.16, 2], [L6.t0 - 0.16, 3]].forEach(([tn, k]) => { const nt = PT.notifTex(kit, k);
      ph.push(...attach([plane(nt, { w: 2.5, order: 2.6, sharp: true, mode: 9, mat: MAT.acrylic, shadow: { d: 0.02, dx: 0.03, dy: 0.04, a: 0.25, bias: 3 }, at: (t) => { const u = (t - tn) / 0.3, v = (t - tn - 1.05) / 0.3; if (u < 0 || v > 1) return null;
        const e = spring(clamp(u) * 1.3), x = SXZ - SWZ / 2 + 0.36 - (1 - e) * 0.7 - (v > 0 ? io(v) * 0.7 : 0);
        return { p: [x, midY, 0.03], r: [0, 0, Math.PI / 2], a: clamp(u * 4) * (1 - clamp(v * 1.2)) }; } })], bodyFrame)); });
    for (const [a0, a1] of [[p1.t0, L4.t0 - 0.1], [L4.t0, L6.t0 - 0.1], [L6.t0, L7.t0 - 0.1]]) ph.push(await motif(kit, 'rabbit', a0 + 0.2, a1, [-1.4, -2.2, -1.2], 1.3, { order: -0.4 }));
    ph.push(await motif(kit, 'inudoge', L8.t0 - 0.05, T1 - 0.15, [-3.6, -1.9, 1.6], 1.4, { order: 9 }));
    // the ground: satin ribbons written from the Midjourney tone reference (space.js kind 1; it replaces the foil placeholder)
    sets.push({ t0: T0, t1: T1, planes: ph, cam: camA, bg: () => ({ top: [236, 222, 255], bot: [210, 246, 238] }), ground: () => ({ kind: 1 }),
      post: (t) => ({ bloom: 0.2, thr: 0.82, exp: 0.86, ca: 0.0012 * pulse(t, 7), grain: 0.03, vig: 0.22, glitch: t > T1 - 0.05 ? 0.6 : 0 }) });
  }

  // ======================================== B Pre 嘟嘴 (the booth) ========================================
  {
    const T0 = B22, T1 = 59.4;
    const L9 = ln(9), L10 = ln(10), L11 = ln(11);
    const ph = [];
    const SC = 11.55 / 1920, wx = (px) => (px - 960) * SC, wy = (py) => (540 - py) * SC;
    const booth = PT.boothTex(kit), boothX = (t) => (1 - spring(((t - T0) / 0.32) * 1.5)) * 12;      // (everything in the booth slides in with it)
    const tLift = B27 - 0.05, B26 = bar(26);          // the drums come back at bar 26 (「かわいい」); the booth tips away at bar 27
    ph.push(plane(booth, { w: 11.55, h: 6.5, order: 5, mode: 9, mat: { ...MAT.acrylic, bevel: 12 }, edge: { d: 0.3, col: [255, 196, 222], r: 120 * 11.55 / 1920 }, shadow: { d: 0.3, dx: 0.25, dy: 0.3, a: 0.3, bias: 4 }, at: (t) => { const u = (t - T0) / 0.32, e = spring(u * 1.5), v = clamp((t - tLift) / 0.5);
      return { p: [(1 - e) * 12, 0, 0.05 - v * 2], r: [-io(v) * 1.45, 0, 0], a: 1 - sm((v - 0.6) / 0.4) }; } }));
    // the live in the booth's window (cover-fitted), the photo-booth's soft, bright skin
    const win = { cx: wx((70 + 1570) / 2), cy: wy(540), w: 1500 * SC, h: 940 * SC };
    // (2026-11-24, "取景超出边框": the footage is cropped to the window's own shape — it was cover-fitted wider and its overflow, hidden
    // behind the frame from the front, showed past the booth's edge once the camera went round it)
    const winCrop = win.w / (win.h * 16 / 9);
    ph.push(plane(null, { w: win.w, h: win.h, footage: live, crop: [(1 - winCrop) / 2, 0, winCrop, 1], order: 4, round: 100 * SC, at: (t) => { if (t > tLift + 0.45 || (t > tSheet && t < tKawa)) return null; const v = clamp((t - tLift) / 0.5); return { p: [win.cx + boothX(t), win.cy, 0 - v * 2], r: [-io(v) * 1.45, 0, 0], col: [246, 238, 244], bias: 0.35 }; } }));
    // the purikura sheet: the same moment four times, each its own look, one cell a beat (few pictures, many looks)
    const tSheet = beatT(Math.ceil(beatOf(L10.t0)));
    const tKawa = ((L11.part('かわいい') || { times: [] }).times[0] ?? L11.t0) - 0.04;   // (the sheet and Yachiyo hold until the word lands — no empty pale beat between)
    const gap = 0.08, cw = win.w / 2 - gap, chh = win.h / 2 - gap, cropW = (cw / chh) / (16 / 9);
    const looks = [{ mode: 0, col: [270, 258, 266] }, { mode: 2, col: [120, 0, 70], col2: [255, 150, 210] }, { mode: 2, col: [0, 70, 80], col2: [150, 255, 225] }, { mode: 2, col: [60, 20, 150], col2: [255, 236, 120] }];
    looks.forEach((L, i) => { const tc = tSheet + i * BEAT, cx = win.cx + (i % 2 ? 1 : -1) * (cw / 2 + gap / 2), cy = win.cy + (i < 2 ? 1 : -1) * (chh / 2 + gap / 2);
      ph.push(plane(null, { w: cw, h: chh, footage: live, order: 4.2, mode: L.mode, col: L.col, col2: L.col2, crop: [(1 - cropW) / 2, 0, cropW, 1], round: 0.3,
        at: (t) => (t < tc || t >= tKawa ? null : { p: [cx, cy, 0.02], s: 1 + 0.12 * (1 - sm((t - tc) / 0.18)), r: [0, 0, (hash(i) - 0.5) * 0.04] }) }));
      ph.push(plane(i % 2 ? PT.sparkTex(kit) : PT.mangaTex(kit, 'sweat'), { w: 0.45, mode: 1, col: [LEMON, BABY, DECO, WHITE][i], order: 6, sharp: true, at: (t) => { const s0 = stamp(t, tc + 0.12); if (!s0 || t >= tKawa) return null; return { p: [cx + cw * 0.34, cy + chh * 0.3, 0.5], s: s0, r: [0, 0, 0.3 * Math.sin(t * 5 + i)] }; } }));
    });
    // 「別に」: her half-body (hands on her cheeks) bursts up at the left, then the full sulk on 「わがまま」
    const k9 = L9.part('わがまま') || { times: [L9.t0 + 1.4] };
    ph.push(...(await cardInsert(kit, (t) => cam(t), [[L9.t0 - 0.03, 'KK_hb_surprised']], { x: -0.6, y: -0.08, hFrac: 0.66, enter: 'spin', exit: 'slide', rz: 0.05, out: k9.times[0] - 0.12, order: 40 })));
    ph.push(...(await holoCard(kit, [[k9.times[0] - 0.03, 'KK_cry']], { at: [3.4, -0.5, 1.2], size: 2.7, rz: 0.1, out: L10.t0 - 0.1, order: 8.5, phase: 0.4 })));
    ph.push(...(await stickerSeq(kit, [[L10.t0 + 0.02, 'YK_point'], [((L10.part('思って') || { times: [] }).times[0] ?? L10.t0 + 1.6) - 0.03, 'YK_whisper']], { at: [3.2, -2.75, 1.2], size: 3.3, rz: -0.05, out: tKawa - 0.12, order: 8.5 })));
    ph.push(...(await stickerSeq(kit, [[((L11.part('かわいい') || { times: [] }).times[0] ?? L11.t0) - 0.03, 'YK_twirl'], [((L11.part('かわいい') || { times: [] }).times[2] ?? L11.t0 + 0.5), 'YK_kiss']], { at: [win.cx + 1.1, -2.9, 1.0], size: 3.8, rz: 0.06, out: tLift - 0.05, order: 9.4 })));
    // the drums return: she jumps in at the left as the window opens
    ph.push(...(await holoCard(kit, [[tLift + 0.05, 'KK_jump'], [tLift + 0.05 + BEAT * 2, 'KK_peace']], { at: [-3.4, -0.5, 0.9], size: 2.5, rz: 0.08, out: T1 - 0.2, order: 9.4, phase: 2.2 })));
    ph.push(letters(kit, 'PURIKURA ★ 2030 · 4 SHOTS · らくがき OK', { font: 'Unbounded', px: 120, size: 0.11, at: [-5.4, 3.05, 0.4], times: [T0 + 0.4], enter: 'type', col: [214, 90, 150], order: 4.8, out: tLift, follow: false }));
    // 漫符 on her outbursts (the anger cross, sweat, surprise lines) — stamped on the beats she wails
    const manga = (kind, t0, t1, p, col, size = 0.7, rz = 0) => plane(PT.mangaTex(kit, kind), { w: size, mode: 1, col, order: 7, sharp: true, at: (t) => { const s = stamp(t, t0); if (!s || t > t1) return null; return { p, r: [0, 0, rz + 0.08 * Math.sin(t * 9)], s: s * (1 + 0.06 * pulse(t, 8)) }; } });
    ph.push(manga('anger', beatT(91), L10.t0, [-3.4, 1.6, 0.6], HOT, 0.8, 0.2), manga('sweat', L10.t0 + 0.3, L11.t0, [-0.6, 1.9, 0.6], BABY, 0.5), manga('lines', beatT(103) - 0.02, L11.t0 + 0.2, [-1.2, 2.0, 0.6], HOT, 0.7));
    // the lines written in glitter pen on the photo: Kaguya gold, Yachiyo silver (each char as the pen reaches it)
    const LBL = (k) => PT.labelStk(kit, [[255, 160, 205], [176, 236, 222], [255, 232, 140], [206, 186, 255]][k % 4]);
    ph.push(glossLine(kit, L9, { mode: 'under', font: 'HachiMaru', px: 180, size: 0.5, at: [-4.9, 2.0, 0.6], maxW: 8.4, lineH: 1.05, enter: 'type', col: K_GOLD, ink: WHITE, strokeK: 0.26, chipTex: LBL, chipInk: [110, 30, 80], zhSize: 0.22, order: 8, out: L10.t0 - 0.05 }));
    ph.push(glossLine(kit, L10, { mode: 'under', font: 'HachiMaru', px: 180, size: 0.46, at: [-4.8, -1.15, 0.6], maxW: 8.4, lineH: 1.0, enter: 'type', col: Y_SILVER, ink: [236, 70, 150], strokeK: 0.26, chipTex: (k) => LBL(k + 1), chipInk: [110, 30, 80], zhSize: 0.22, order: 8, out: Math.min(L11.t0, B26) - 0.25 }));
    for (const [L, out] of [[L9, L10.t0], [L10, L11.t0], [L11, tLift]]) { const k = L.voice || 'K';
      if (k.includes('K')) ph.push(await motif(kit, 'rabbit', L.t0 + 0.15, out - 0.1, [-4.4, -2.0, 1.3], 1.2, { order: 9.6 }));
      if (k.includes('Y')) ph.push(L === L10 ? await motif(kit, 'octopus', L.t0 + 0.25, out - 0.1, [4.3, 1.55, 1.3], 1.1, { order: 9.6 }) : await motif(kit, 'fushi', L.t0 + 0.25, out - 0.1, (t) => [3.3 + boothX(t), 3.3, -0.05], 1.5, { order: 4.95, shadow: false, bob: 0.02 }),
        await motif(kit, 'seaslug', L.t0 + 0.5, out - 0.1, [4.6, -2.0, 1.2], 1.0, { order: 9.6 })); }      // (FUSHI peeks over the booth's top edge: its film cut ends where someone stood in front of it)
    // 「かわいい」: the photo goes; the word alone on the booth's pastel (the first breath), the pen's sparkle at each stroke
    const k11 = L11.part('かわいい') || { str: L11.text.slice(0, 4), times: L11.times.slice(0, 4) };
    const tail11 = L11.text.replace(k11.str, '');
    const flip = [STRAW, MINT, LEMON, [214, 196, 255], BABY, [255, 190, 150]], INKS = [[205, 40, 115], [20, 140, 120], [190, 120, 0], [110, 70, 200], [30, 110, 200], [205, 90, 40]], inkOf = (c) => INKS[flip.indexOf(c)] || INK, flipAt = (t) => flip[((Math.floor(beatOf(t + 0.02)) % flip.length) + flip.length) % flip.length];
    ph.push(plane(PT.blockTex(kit), { w: 9.1, h: 5.7, mode: 1, order: 4.5, at: (t) => (t < tKawa || t > tLift + 0.5 ? null : { p: [win.cx, win.cy, 0.01 - clamp((t - tLift) / 0.5) * 2], r: [-io(clamp((t - tLift) / 0.5)) * 1.45, 0, 0], col: flipAt(t) }) }));
    ph.push(deco(kit, k11.str, { font: 'HachiMaru', px: 240, size: 1.5, align: 'center', at: [win.cx - 0.5, -0.1, 0.7], rot: [0, 0, -0.06], times: k11.times, enter: 'pop', mix: ['pop', 'tumble', 'drop', 'zoom'], col: WHITE, inkAt: (t) => inkOf(flipAt(t)), strokeK: 0.3, order: 9, out: tLift + 0.05, outStyle: 'flap', sustain: 0.08, hit: 0.16 }));
    if (tail11) ph.push(deco(kit, tail11, { font: 'HachiMaru', px: 200, size: 0.6, at: [win.cx + 2.6, -0.9, 0.7], times: L11.times.slice(k11.times.length), enter: 'pop', col: WHITE, inkAt: (t) => inkOf(flipAt(t)), order: 9, out: tLift + 0.05 }));
    ph.push(object(PT.labelStk(kit, [255, 255, 255]), { at: [win.cx - 0.4, -1.55, 0.72], size: 0.5, w: 2.4, t0: k11.times[k11.times.length - 1] ?? L11.t0, dur: 0.3, enter: 'stamp', rot: [0, 0, 0.07], order: 9.2, shadow: false, out: tLift + 0.05, outStyle: 'slide', to: [0, -2, 0] }));
    ph.push(letters(kit, L11.zh, { font: 'Xiaolai', px: 150, size: 0.32, align: 'center', at: [win.cx - 0.4, -1.66, 0.74], rot: [0, 0, 0.07], times: [...L11.zh].map((_, j) => (k11.times[k11.times.length - 1] ?? L11.t0) + 0.06 + j * 0.03), enter: 'pop', colAt: (t) => inkOf(flipAt(t)), order: 9.3, out: tLift + 0.05, follow: false }));
    // the drums return: dark ground, signal bars fill (one a beat after each downbeat), rings close in, the live in a round window
    const bars = [0, 1, 2, 3].map((n) => PT.barsTex(kit, n)), ring = PT.ringTex(kit, 'thin', 0.012);
    ph.push(plane(bars[0], { w: 1.1, mode: 1, col: MIKU, order: 3, at: (t) => { if (t < tLift) return null; const k = clamp(Math.floor((t - B27) / (BEAT * 2)), 0, 3); return { p: [-4.6, 2.35, 0], tex: bars[k], s: 1 + 0.12 * pulse(t, 9, 2) }; } }));
    for (let i = 0; i < 7; i++) ph.push(plane(ring, { w: 1, mode: 1, col: i % 2 ? HOT : LASER, order: 1, sharp: true, at: (t) => { if (t < tLift) return null; const ph0 = ((t - tLift) * 0.55 + i / 7) % 1; return { p: [0, 0, -0.5], s: lerp(16, 2.6, ph0), a: sm(ph0 / 0.2) * (1 - sm((ph0 - 0.8) / 0.2)) * 0.8 }; } }));
    ph.push(plane(null, { w: 4.6 * 16 / 9, h: 4.6, footage: live, order: 2, fx: (t) => ({ iris: clamp(0.46 + 0.54 * io((t - (T1 - 0.45)) / 0.45)), seed: [0.5, 0.5] }), at: (t) => (t < tLift + 0.15 ? null : { p: [0, 0, 0], s: 1 + 0.03 * pulse(t, 7), a: sm((t - tLift - 0.15) / 0.3), crt: { a: 0.3, lines: 300, mask: 0.3, fringe: 1 } }) }));
    const cam = camTrack([           // (2026-11-24: round the booth — its edge and the glitter behind come into view — not only a dolly)
      { t: T0, p: [0, 0, 10], look: [0, 0, 0] }, { t: L9.t0, p: [-3.0, 0.8, 11.4], look: [-0.3, 0, 0] }, { t: L10.t0, p: [2.9, -0.7, 11.2], look: [0.2, 0.1, 0] },
      { t: L11.t0 - 0.1, p: [0.5, 0.4, 8.4], look: [-0.6, 0, 0] }, { t: tLift, p: [-0.3, 0, 9.2], look: [-0.3, 0, 0] }, { t: T1 - 0.5, p: [0, 0, 7.4], look: [0, 0, 0] }, { t: T1, p: [0, 0, 1.2], look: [0, 0, 0] },
    ]);
    sets.push({ t0: T0, t1: T1, planes: ph, cam: (t) => ({ ...cam(t), fov: 36, focus: 10, dof: 0 }),
      bg: (t) => (t < tLift ? { top: [255, 214, 236], bot: [214, 236, 255] } : { top: [22, 12, 40], bot: [8, 6, 16] }),
      ground: (t) => (t < tLift ? { kind: 2 } : { kind: 3, a: 0.55 * sm((t - tLift) / 0.6), pulse: pulse(t, 7) }),
      post: (t) => ({ bloom: t < tLift ? 0.16 : 0.42, thr: 0.78, lift: 0, sat: 1.04, ca: 0.001 * pulse(t, 7), grain: 0.03, vig: t < tLift ? 0.12 : 0.35, glitch: (t < T0 + 0.05 ? 0.6 : 0) + (t > T1 - 0.05 ? 0.8 : 0) }) });
  }

  // ======================================== C 其の二「龍の首の珠」 the live ========================================
  {
    const T0 = 59.4, T1 = B41;
    const L12 = ln(12), L13 = ln(13), L14 = ln(14), L15 = ln(15), L16 = ln(16), L17 = ln(17);
    const ph = [];
    const kHime = L12.part('おひめさま'), tWave = kHime ? kHime.t0 : L12.t0 + 1.5;
    const sea = penlights({ n: 11000, w: 70, y: -3.6, z0: -3, d: 70, wave: tWave });
    const las = lasers({ n: 16 });
    // the stream window: the live behind a broadcast frame, tilted a little, breathing on the beat
    const frame = PT.streamTex(kit), FW = 7.4, FH = FW * 1160 / 1920;
    // (2026-11-24) the window turns toward each line (yaw keyed on the lines, eased over half a second), the camera goes the other way round it
    const YAW = [[T0, -0.1], [L12.t0, 0.24], [L13.t0, -0.26], [L14.t0, 0.2], [L15.t0, -0.06], [L16.t0, -0.24], [L17.t0, 0.04]];
    const yawAt = (t) => { let y = YAW[0][1]; for (let i = 1; i < YAW.length; i++) y = lerp(y, YAW[i][1], io((t - YAW[i][0] + 0.25) / 0.5)); return y; };
    // a point in the window's own frame (it turns: offsets must turn with it — "有些取景框的画面超出边框", 2026-11-24)
    const winPt = (t, dx, dy, dz) => { const w = winAt(t), v = rot3([dx, dy, dz], w.r); return [w.p[0] + v[0], w.p[1] + v[1], w.p[2] + v[2]]; };
    const winAt = (t) => { const k = io((t - T0) / 0.6); return { p: [lerp(0, 0.2, k), lerp(-0.5, 0.35, k), lerp(-6, 0, k)], r: [0.04 * Math.sin(t * 0.5), yawAt(t), 0.0], s: 1 + 0.012 * pulse(t, 7) }; };
    const inner = { w: FW * (1892 / 1920), h: FW * (1076 / 1920), dy: -FW * ((70 + 538 - 580) / 1920) };
    const nee = L13.part('ねえねえ'), neeT = nee ? [nee.t0, nee.times[2] ?? nee.t0 + BEAT] : [];
    // duotone flips on the window (the GMV's two-colour worlds, flipping on the beat): ねえねえ as before, and now every beat through the hook's
    // opening (世界で一番, before the cards turn) and the start of 「もう何だか」 — the stretches that measured quiet in draft 9
    const DUOS = [{ mode: 2, col: [120, 10, 70], col2: [255, 120, 200] }, { mode: 2, col: [10, 30, 60], col2: [120, 250, 255] }, { mode: 2, col: [70, 20, 140], col2: [255, 236, 120] }, null];
    const duoBeat = (t, a0, a1, k0) => (t >= a0 && t < a1 ? DUOS[(Math.floor(beatOf(t + 0.02)) + k0) % DUOS.length] : undefined);
    const duo = (t) => { const b1 = duoBeat(t, L12.t0 + 0.05, (kHime ? kHime.t0 : L12.t0 + 2.2) - 0.1, 0); if (b1 !== undefined) return b1;
      const b2 = duoBeat(t, L16.t0, L16.t0 + BEAT * 8, 1); if (b2 !== undefined) return b2;
      if (!nee || t < neeT[0] || t > nee.t1 + 0.25) return null; return t < neeT[1] ? DUOS[0] : DUOS[1]; };
    ph.push(plane(null, { w: inner.w, h: inner.h, footage: live, order: 3, round: 0.3, fx: FX.tiles(T0 + 0.05, 0.9, 12), crt: { a: 0.35, lines: 320, mask: 0.35, fringe: 1.2 }, at: (t) => { const w = winAt(t), d = duo(t), g = 255 + 45 * pulse(t, 8); return { ...w, p: winPt(t, 0, inner.dy, -0.01), col: [g, g, g], ...(d || {}) }; } }));
    ph.push(plane(frame, { w: FW, order: 3.1, mode: 9, mat: { ...MAT.acrylic, bevel: 10, pearl: 0.15 }, at: winAt, shadow: { d: 0.1, dx: 0.12, dy: 0.15, a: 0.4, bias: 4, col: [0, 0, 0] } }));
    // (the giant 姫 hairline was tried here: across her face it read as stray strokes — removed)
    const EQ = await fetch('audio/eq.json').then((r) => r.json(), () => null), bar1 = PT.blockTex(kit);
    if (EQ) for (let b = 0; b < 16; b++) ph.push(plane(bar1, { w: 0.24, h: 1, pivot: [0.5, 1], mode: 1, order: 3.25, at: (t) => { const w = winAt(t), f = Math.min(EQ.v.length - 1, Math.max(0, Math.round(t * EQ.fps))), v = EQ.v[f][b] / 99;
      return { p: winPt(t, -FW * 0.46 + b * 0.27, -FH * 0.47, 0.04), r: w.r, s: [1, Math.max(0.02, v * 0.65)], col: mixc(LASER, HOT, b / 15), a: 0.9 }; } }));
    // the rank counter in the frame's corner: rolls from 3006 to 1 through the sweets, lands on 「いますぐによ」
    const rankAt = (t) => { const k = clamp((t - L16.t0) / (L17.t0 - L16.t0)); return k >= 1 ? 1 : Math.max(2, Math.round(3006 * Math.pow(1 - k, 2.4))); };
    const rk0 = kit.text('RANK 3006', 'Bungee', 120), asp = (T) => T.userData.w / T.userData.h;
    ph.push({ tex: rk0, h: 0.32, pivot: [1, 0.5], mode: 1, col: LEMON, order: 3.3, at: (t) => { const w = winAt(t), r = rankAt(t); const s = r === 1 ? stamp(t, L17.t0, 0.3) || 1 : 1;
      const T = kit.text(r === 1 ? 'No.1' : `RANK ${r}`, 'Bungee', 120);
      return { p: winPt(t, FW * 0.46, -FH * 0.4, 0.05), r: w.r, tex: T, col: r === 1 ? K_GOLD : LEMON, s: [s * asp(T) / asp(rk0), s] }; } });
    // 「世界で一番おひめさま」: flap cards per syllable (gold), big, in front; its Chinese typed under it in white
    { const cut = L12.text.indexOf('おひめさま') > 0 ? L12.text.indexOf('おひめさま') : Math.ceil(L12.text.length / 2);
      const rows = [[L12.text.slice(0, cut).trim(), L12.times.slice(0, cut), -1.0], [L12.text.slice(cut), L12.times.slice(cut), -1.86]];
      for (const [str, tm, y] of rows) ph.push(deco(kit, str, { font: 'DelaGothic', px: 220, size: 0.78, align: 'center', at: [-0.5, y, 1.8], times: tm, enter: 'flap', col: K_GOLD, ink: [120, 50, 10], strokeK: 0.14, order: 8, out: L13.t0 - 0.06, outStyle: 'flap', hit: 0.14 })); }
    const winFrame = (t) => { const w = winAt(t); return { pos: w.p, q: new THREE.Quaternion().setFromEuler(EU.set(w.r[0], w.r[1], w.r[2], 'YXZ')) }; };
    const titleBar = plane(PT.blockTex(kit), { w: FW * 0.62, h: FH * 0.055, mode: 1, col: [150, 40, 200], order: 3.15, at: (t) => (t < L12.t0 - 0.1 || t > T1 ? null : { p: [-FW * 0.18, FH * 0.468, 0.01] }) });
    ph.push(...attach([titleBar, letters(kit, L12.zh, { font: 'ChillRound', px: 140, size: 0.2, at: [-FW * 0.47, FH * 0.452, 0.02], times: L12.zhTimes(L12.zh, { lag: 0.04 }), enter: 'type', col: WHITE, order: 3.2, out: L13.t0 - 0.06, follow: false }),
      letters(kit, L13.zh, { font: 'ChillRound', px: 140, size: 0.2, at: [-FW * 0.47, FH * 0.452, 0.02], times: L13.zhTimes(L13.zh, { lag: 0.04 }), enter: 'type', col: WHITE, order: 3.2, out: L14.t0 - 0.06, follow: false }),
      letters(kit, L14.zh, { font: 'ChillRound', px: 140, size: 0.2, at: [-FW * 0.47, FH * 0.452, 0.02], times: L14.zhTimes(L14.zh, { lag: 0.04 }), enter: 'type', col: WHITE, order: 3.2, out: L15.t0 - 0.06, follow: false }),
      letters(kit, L15.zh, { font: 'ChillRound', px: 140, size: 0.2, at: [-FW * 0.47, FH * 0.452, 0.02], times: L15.zhTimes(L15.zh, { lag: 0.04 }), enter: 'type', col: WHITE, order: 3.2, out: L16.t0 - 0.06, follow: false }),
      letters(kit, L16.zh, { font: 'ChillRound', px: 140, size: 0.2, at: [-FW * 0.47, FH * 0.452, 0.02], times: L16.zhTimes(L16.zh, { lag: 0.04 }), enter: 'type', col: WHITE, order: 3.2, out: L17.t0 - 0.06, follow: false }),
      letters(kit, L17.zh, { font: 'ChillRound', px: 140, size: 0.2, at: [-FW * 0.47, FH * 0.452, 0.02], times: L17.zhTimes(L17.zh, { lag: 0.04 }), enter: 'type', col: WHITE, order: 3.2, out: T1 + 1 - 0.06, follow: false })], winFrame));
    // the hook word as wallpaper behind the window (the vertical MAD's "Ah-Ah-Ah" rows): six rows, each scrolling its own way
    const hw = kHime ? kHime.str : '', wallTex = kit.canvas('wall:' + hw, 2048, 220, (g, w, h) => { g.font = '170px DelaGothic'; g.fillStyle = '#fff'; g.textBaseline = 'middle'; let x = 0; while (x < w * 2) { g.fillText(hw + ' ♛ ', x, h / 2); x += g.measureText(hw + ' ♛ ').width; } });
    if (hw) for (let r = 0; r < 6; r++) ph.push(plane(wallTex, { w: 22, h: 22 * 220 / 2048, mode: 1, order: 0.5, at: (t) => { if (t < L12.t0 - 0.15 || t > L14.t0) return null; const k = (r % 2 ? -1 : 1) * (t - L12.t0) * 0.06 + r * 0.17;
      return { p: [0, 3.6 - r * 1.45, -3.2], crop: [((k % 0.5) + 0.5) % 0.5, 0, 0.5, 1], col: r % 2 ? [120, 30, 110] : [90, 20, 140], a: sm((t - L12.t0 + 0.15) / 0.2) * (1 - sm((t - L14.t0 + 0.25) / 0.25)) * 0.85 }; } }));
    // 「あまいものが食べたい」: the frame cut into bands of the same moment, each its own colours, one a beat (few pictures, many looks)
    const bandT = beatT(Math.ceil(beatOf(L16.t0 + 0.6)));
    [[0, [120, 10, 70], [255, 170, 210]], [1, [10, 40, 90], [140, 255, 240]], [2, [90, 40, 0], [255, 240, 140]]].forEach(([b, c1, c2]) => {
      const tb = bandT + b * BEAT, bh = inner.h / 3;
      ph.push(plane(null, { w: inner.w, h: bh, footage: live, mode: 2, col: c1, col2: c2, order: 3.05, round: 0.05, at: (t) => { if (t < tb || t > L17.t0 - 0.05) return null; const w = winAt(t), e = outE((t - tb) / 0.2);
        return { p: winPt(t, (1 - e) * (b % 2 ? 3 : -3), inner.dy + inner.h / 2 - bh * (b + 0.5), -0.005), r: w.r, crop: [0, b / 3, 1, 1 / 3] }; } }));
    });
    const ringT = PT.ringTex(kit, 'hook', 0.018);
    for (let b = Math.ceil(beatOf(T0 + 0.3)); beatT(b) < L13.t0 + 2; b++) { const tb = beatT(b);
      ph.push(plane(ringT, { w: 1, mode: 1, col: b % 2 ? K_GOLD : HOT, order: 2.5, sharp: true, at: (t) => { const u = (t - tb) / 0.7; if (u < 0 || u > 1) return null; const w = winAt(t); return { p: winPt(t, 0, 0, -0.2), r: w.r, s: lerp(2, 13, outE(u)), a: (1 - u) * 0.9 }; } })); }
    // 「気が付いて ねえねえ」: on the right, each ねえ stamped
    ph.push(deco(kit, L13.text, { font: 'DelaGothic', px: 200, size: 0.56, at: [-0.8, -1.75, 1.6], times: L13.times, enter: 'pop', col: K_GOLD, ink: [120, 50, 10], strokeK: 0.14, order: 8, out: L14.t0 - 0.05, outStyle: 'fall', hit: 0.16 }));
    // (L13's Chinese rides the title bar)
    // 「待たせるなんて論外よ」: a loading bar that refuses to wait — creeps to 3 %, then 論外よ: 100 %
    const lf = PT.loadFrameTex(kit), blk = PT.blockTex(kit), pRon = L14.part('論外よ') || { t0: L14.t1 - 0.6 };
    const loadOn = [L14.t0 - 0.1, L15.t0 - 0.05];
    const loadK = (t) => (t < pRon.t0 ? 0.03 * clamp((t - loadOn[0]) / 0.8) : lerp(0.03, 1, outE((t - pRon.t0) / 0.18)));
    ph.push(plane(lf, { w: 4.6, mode: 9, mat: MAT.pearl, col: WHITE, order: 7, at: (t) => (t < loadOn[0] || t > loadOn[1] ? null : { p: winPt(t, 0, -1.55, 0.08), r: winAt(t).r, s: stamp(t, loadOn[0]) || 1 }) }));
    ph.push(plane(blk, { w: 4.4, h: 0.36, pivot: [0, 0.5], mode: 1, col: HOT, order: 7.1, at: (t) => (t < loadOn[0] || t > loadOn[1] ? null : { p: winPt(t, -2.2, -1.55, 0.09), r: winAt(t).r, s: [Math.max(0.002, loadK(t)), 1], col: t > pRon.t0 ? mixc(HOT, LEMON, pulse(t, 8, 0.5)) : HOT }) }));
    ph.push(deco(kit, L14.text, { font: 'DelaGothic', px: 200, size: 0.5, align: 'center', at: [0.2, -1.82, 1.6], times: L14.times, enter: 'slide', col: K_GOLD, ink: [120, 50, 10], strokeK: 0.14, order: 8, out: L15.t0 - 0.05, outStyle: 'scatter' }));
    // 「わたしを誰だと思ってるの？」: a poster — the words huge and slanted across, a second ink out of register behind (Yachiyo silver + hot pink)
    const big15 = { font: 'DelaGothic', px: 220, size: 0.78, align: 'center', rot: [-0.12, 0.42, 0.12], times: L15.times, enter: 'zoom', order: 9, out: L16.t0 - 0.05, outStyle: 'scatter', spread: 8, hit: 0.14 };
    const half15 = Math.ceil([...L15.text].length / 2);
    for (const [str, tm, y] of [[[...L15.text].slice(0, half15).join(''), L15.times.slice(0, half15), 0.6], [[...L15.text].slice(half15).join(''), L15.times.slice(half15), -0.45]]) {
      ph.push(letters(kit, str, { ...big15, times: tm, at: [0.1, y - 0.06, 1.5], col: HOT, order: 8.9 }));
      ph.push(deco(kit, str, { ...big15, times: tm, at: [0, y, 1.55], col: Y_SILVER, ink: [40, 30, 90], strokeK: 0.12 }));
    }
    ph.push(deco(kit, L15.zh, { font: 'ChillRound', px: 200, size: 0.62, align: 'center', at: [0.05, -1.4, 1.55], rot: [-0.12, 0.42, 0.12], times: L15.zhTimes(L15.zh, { lag: 0.06 }), enter: 'zoom', col: HOT, ink: WHITE, strokeK: 0.12, order: 9.1, out: L16.t0 - 0.05, outStyle: 'scatter', spread: 6 }));      // (poster: both languages at poster scale)
    // 「もう何だか あまいものが食べたい！」: sweets fall through the arena (candy placeholders until the props are made)
    ph.push(deco(kit, L16.text, { font: 'YuseiMagic', px: 200, size: 0.52, align: 'center', at: [0, -1.78, 1.6], times: L16.times, enter: 'drop', mix: ['drop', 'tumble', 'pop'], col: STRAW, ink: [150, 40, 90], strokeK: 0.18, order: 8, out: L17.t0 - 0.05, outStyle: 'fall' }));
    const kinds = ['heart', 'star', 'drop'], cols = [STRAW, CUSTARD, MINT, [200, 170, 255], [255, 150, 120]];
    for (let i = 0; i < 34; i++) {
      const t0 = L16.t0 + 0.15 + i * 0.16 + hash(i) * 0.1, x = (hash(i * 3.1) - 0.5) * 11, z = -2 + hash(i * 5.3) * 3.5, sz = 0.35 + hash(i * 7.7) * 0.5;
      ph.push(plane(SWEET[i % 8], { w: sz * 1.2, order: z > 0 ? 7.5 : 2, at: (t) => { const u = t - t0; if (u < 0 || u > 3) return null; return { p: [x + Math.sin(u * 2 + i) * 0.2, 4 - u * u * 1.2 - u * 1.6, z], r: [u * 1.1 * (hash(i) - 0.5), u * 1.7, u * 2.4 * (hash(i * 2) - 0.5)] }; } }));
    }
    const am = L16.part('あまいもの') || { t0: L16.t0 + 1, times: [L16.t0 + 1] };
    [[0, 'cake', -2.2], [1, 'pudding', 0.2], [7, 'berry', 2.4]].forEach(([c, k, x0], i) => { const t0 = am.times[Math.min(am.times.length - 1, i * 2)] - 0.25;
      ph.push(plane(SWEET[c], { w: 1.25, order: 8, at: (t) => { const u = (t - t0) / 0.7; if (u < 0 || u > 1) return null; const z = lerp(-3, 6.5, u);
        return { p: [x0 + u * 0.8, -1.4 + Math.sin(u * Math.PI) * 0.6, z], r: [u * 2, u * 3, u * 4 * (i % 2 ? 1 : -1)] }; } })); });
    // the star: thrown in on the beat before the film's cut, it lands where her left lens will be — the shot appears round it
    const tStar = 78.2, starLand = (t) => winPt(t, (0.375 - 0.5) * inner.w, inner.dy + (0.5 - 0.47) * inner.h, 0.06);
    ph.push(plane(SWEET[5], { w: inner.w * 0.3, order: 8, at: (t) => { const u = (t - (tStar - 0.5)) / 0.5; if (u < 0 || t > tStar + 0.2) return null; const L0 = starLand(t), k = outE(u);
      return { p: [lerp(L0[0] - 3.5, L0[0], k), lerp(L0[1] + 2.5, L0[1], k) + Math.sin(k * Math.PI) * 0.8, lerp(4, L0[2], k)], r: [0, 0, (1 - k) * 5], a: t > tStar ? 1 - sm((t - tStar) / 0.2) : 1 }; } }));
    { const sil = await kit.silRim('materials/nai/cut/Y_point_t1.png', { rim: 0.006, dir: '-1,-1' }); const tS = L15.t0 - 0.62;
      if (sil) ph.push({ tex: sil.fill, h: 3.6, pivot: [0.5, 1], mode: 1, col: [14, 6, 26], sharp: true, order: 8.6, at: (t) => { if (t < tS || t >= L15.t0) return null; const e = outE((t - tS) / 0.5); return { p: [-3.3, -2.9 - (1 - e) * 3.6, 1.2], r: [0, 0, 0.05] }; } },
        { tex: sil.rim, h: 3.6, pivot: [0.5, 1], mode: 1, col: [255, 120, 200], sharp: true, order: 8.65, at: (t) => { if (t < tS || t >= L15.t0) return null; const e = outE((t - tS) / 0.5); return { p: [-3.3, -2.9 - (1 - e) * 3.6, 1.21], r: [0, 0, 0.05] }; } }); }
    ph.push(...(await stickerSeq(kit, [[L15.t0, 'Y_point_t1']], { cardLabel: 'LIVE · No.1', card: [200, 170, 255], at: [-3.3, -2.9, 1.2], size: 3.6, rz: 0.05, out: L16.t0 - 0.1, order: 8.7 })));
    // close-up inserts on the live (under the type, so the words read over her): Kaguya singing on 「おひめさま」, winking on 「ねえねえ」, pouting on 「論外よ」; Yachiyo smug on 「思ってるの？」
    const kHime2 = L12.part('おひめさま') || { times: [L12.t0 + 1.5] }, kNee = L13.part('ねえねえ') || { times: [L13.t0 + 1.2] }, kRon = L14.part('論外') || { times: [L14.t0 + 1.2] }, kOmo = L15.part('思って') || { times: [L15.t0 + 1.6] };
    ph.push(...(await cardInsert(kit, (t) => cam(t), [[kHime2.times[0] - 0.03, 'KC_hb_sing']], { fov: 38, x: 0.64, y: -0.12, hFrac: 0.6, enter: 'flip', exit: 'vanish', rz: -0.05, out: L13.t0 - 0.12, order: 7.6 })));
    // (the wink card of 「ねえねえ」 is now the fan's — see the card moves below)
    ph.push(...(await cardInsert(kit, (t) => cam(t), [[kRon.times[0] - 0.03, 'KC_hb_pout']], { fov: 38, x: -0.62, y: -0.1, hFrac: 0.6, enter: 'rise', exit: 'drop', rz: 0.06, out: L15.t0 - 0.1, order: 7.6, phase: 1.4 })));
    ph.push(...(await cardInsert(kit, (t) => cam(t), [[kOmo.times[0] - 0.03, 'YC_hb_smug']], { fov: 38, x: 0.62, y: -0.1, hFrac: 0.6, enter: 'toss', exit: 'flipaway', rz: -0.06, out: L16.t0 - 0.12, order: 7.6, phase: 2.6 })));
    ph.push(...(await holoCard(kit, [[L16.t0 + 0.05, 'YC_wave']], { at: [-3.4, -0.6, 1.0], size: 2.6, rz: 0.06, out: L17.t0 - 0.05, order: 8.2, phase: 1.2 })));
    ph.push(...(await stickerSeq(kit, [[L16.t0 + 0.4, 'KC_heart']], { at: [3.4, -2.8, 1.0], size: 3.0, rz: -0.06, out: L17.t0 - 0.05, order: 8.2 })));
    // 「世界で一番おひめさま」 as a gacha pull (the user: "卡牌加入演出可以做的更有设计感一些，例如设计一些卡牌动画"): five cards orbit the
    // window FACE-DOWN (backs: the Tsukuyomi moon), passing behind and in front of it; on お・ひ・め・さ・ま one turns over per syllable
    // with a rarity burst (rays, a bloom, a flash); then the ring flies outward past the lens and clears the frame for 「気が付いて」
    const RING = ['KC_wink', 'YC_wave', 'KC_heart', 'YC_kiss', 'KC_jump'], ringOn = L12.t0 - 0.1, ringGo = L13.t0 - 0.35;
    const hime = kHime ? kHime.times : RING.map((_, i) => L12.t0 + 1.6 + i * BEAT / 2);
    const ringA = (i, t) => (i / RING.length) * Math.PI * 2 + ((t - ringOn) / 4.2) * Math.PI * 2 + 0.4 + (t > ringGo ? (t - ringGo) * 2.2 : 0);
    const ringR = (t) => (t < ringGo ? 1 : 1 + Math.pow((t - ringGo) / 0.5, 2) * 1.6);
    const ringPos = (i, t, bob = 0) => { const w = winAt(t).p, a = ringA(i, t), k = ringR(t); return [w[0] + 5.0 * k * Math.cos(a), w[1] + 0.85 * Math.sin(a) + bob - 0.2, w[2] + 2.3 * k * Math.sin(a) + (k - 1) * 3]; };
    for (let i = 0; i < RING.length; i++) {
      const tr = hime[Math.min(i, hime.length - 1)] - 0.04;
      ph.push(...(await holoCard(kit, [[ringOn + i * 0.09, RING[i]]], { at: [0, 0, 0], size: 1.35, order: 3.6, phase: i * 1.3, sparks: 4, out: ringGo + 0.5, reveal: tr,
        orderAt: (t) => (Math.sin(ringA(i, t)) < 0 && ringR(t) < 1.3 ? 2.2 : 3.6) + i * 0.03, pos: (t, p) => ringPos(i, t, p[1]) })));
      ph.push(...burst(kit, tr, (t) => ringPos(i, t), { size: 3.2, col: i % 2 ? Y_SILVER : K_GOLD, order: 3.6 }));
    }
    const FLASH = hime.map((x) => x - 0.04);       // (a two-frame flash on each reveal: set C's post)
    // 「気が付いて ねえねえ」 — a hand of cards, choreographed (the user, 2026-11-24: "展示牌组的动效要做的更精致且更具设计感和观赏性"):
    // DEAL: from a deck below the lens each card flies up on an arc, turning over once in the air, one a half-beat, landing on the pile
    // with a glint; OPEN: the pile spreads into a fan about a pivot under it, like a hand opening; BREATHE: a lift ripples across the
    // fan on every beat; PICK: on each 「ねえ」 one card is drawn out of the hand toward the lens (a flare), then set back; CLOSE: the fan
    // folds back into a pile that slides down and away.
    const FAN = ['KC_wink', 'IC_hb_smile', 'KC_heart', 'YC_wave', 'KC_jump'].filter(Boolean), NF = FAN.length;
    const fanOn = L13.t0 - 0.12, fanOpen = fanOn + NF * BEAT / 2 + 0.05, fanClose = L14.t0 - 0.5, fanOut = L14.t0 - 0.1;
    const pokeT = kNee ? [kNee.times[0], kNee.times[2] ?? kNee.times[0] + BEAT] : [L13.t0 + 1.2, L13.t0 + 1.7], pickOf = [0];
    const PIV = [0.15, -4.1, 2.3], RAD = 2.75, SPREAD = 0.2;
    const fanK = (t) => (t < fanOpen ? 0 : t < fanClose ? spring(clamp((t - fanOpen) / 0.45) * 1.4) : 1 - io(clamp((t - fanClose) / 0.3)));
    for (let i = 0; i < NF; i++) {
      const td = fanOn + i * BEAT / 2, ang = (i - (NF - 1) / 2) * SPREAD, pick = pickOf.indexOf(i) >= 0 ? pokeT[pickOf.indexOf(i)] : null;
      const cardAt = (t) => {                                     // the card's place and turn in the hand at time t
        const spinA = Math.PI * 2 * io(clamp((t - pokeT[1] + 0.04) / 0.62)), a = ang * fanK(t) + spinA, u = clamp((t - td) / 0.42), e = outE(u);   // (the second ねえ: a FAN SPIN round the pivot)
        const deck = [0.6, -6.2, 4.2], seat = [PIV[0] + Math.sin(a) * RAD, PIV[1] + Math.cos(a) * RAD, PIV[2] + i * 0.02];
        let p = [lerp(deck[0], seat[0], e), lerp(deck[1], seat[1], e) + Math.sin(u * Math.PI) * 0.9, lerp(deck[2], seat[2], e)];
        const bl = beatOf(t) - i * 0.22, br = bl - Math.floor(bl), lift = t > fanOpen + 0.3 && t < fanClose ? Math.exp(-br * br / 0.02) * 0.16 : 0;   // the ripple
        p = [p[0] + Math.sin(a) * lift, p[1] + Math.cos(a) * lift, p[2]];
        let dr = [0, (1 - e) * Math.PI * 2 * (i % 2 ? 1 : -1), -a];
        if (pick != null) { const v = clamp((t - pick + 0.06) / 0.5), k = Math.sin(v * Math.PI);           // drawn out, toward the lens, then back
          p = [p[0] + Math.sin(a) * k * 0.9, p[1] + Math.cos(a) * k * 0.9 + k * 0.35, p[2] + k * 1.9]; dr = [dr[0] - k * 0.25, dr[1] + k * 0.35 * (i ? -1 : 1), dr[2] * (1 - k)]; }
        if (t > fanClose + 0.3) { const w = clamp((t - fanClose - 0.3) / 0.35); p = [p[0] + w * 1.2, p[1] - w * w * 4, p[2]]; dr[0] += w * 0.6; }
        return { p, dr };
      };
      ph.push(...(await holoCard(kit, [[td, FAN[i]]], { at: [0, 0, 0], size: 2.05, order: 8.6 + i * 0.05, phase: i, sparks: 3, amp: 0.22, out: fanOut, outStyle: 'none', from: 0,
        hits: [...Array(12).keys()].map((k) => beatT(Math.ceil(beatOf(fanOpen)) + k)).filter((x) => x < fanClose),
        anim: (t) => ({ dr: cardAt(t).dr, a: clamp((t - td) / 0.08) * (1 - clamp((t - fanOut) / 0.15)) }), pos: (t) => cardAt(t).p })));
      ph.push(...burst(kit, td + 0.4, (t) => cardAt(t).p, { size: 1.6, col: i % 2 ? Y_SILVER : K_GOLD, order: 8.55 }));
      if (pick != null) ph.push(...burst(kit, pick + 0.12, (t) => cardAt(t).p, { size: 3.4, col: LEMON, order: 9.2 }));
    }
    // 「待たせるなんて論外よ」: cardistry while she waits (the user, 2026-11-24: "卡牌演出可以多学习应用一些花切或者魔术") — a SYBIL CUT: the deck
    // (five thick packets) swings open into a vertical fan on the first beat, steps into a staircase sculpture on the next; on 「論外よ」
    // it explodes — every card thrown outward and past the lens, spinning
    const DECK = ['KC_heart', 'YC_kiss', 'KC_jump', 'YC_wave', 'KC_wink'], dk = [2.55, -0.3, 1.4], tBoom = pRon.t0 - 0.03, SIX = BEAT / 4;
    for (let i = 0; i < 10; i++) {
      const tf = L14.t0 + 0.1 + i * SIX;                       // (card i flicks off the top at its sixteenth; the last ones are still there at the boom)
      ph.push(await cardFace(kit, DECK[i % DECK.length], (t) => { if (t < L14.t0 - 0.05 || t > tBoom + 0.9) return null;
        if (t < tBoom) return null;
        const v = (t - tBoom) / 0.9, a0 = hash(i * 3.7) * Math.PI * 2, sp = 3 + 4 * hash(i * 1.9);
        return { p: [dk[0] + Math.cos(a0) * sp * v, dk[1] + Math.sin(a0) * sp * v * 0.7 - v * v * 1.5, dk[2] + v * (2 + 5 * hash(i * 5.3))], r: [v * 6 * (hash(i) - 0.5), v * 9, v * 5 * (hash(i * 2) - 0.5)], a: 1 - sm((v - 0.7) / 0.3) };
      }, { size: 1.9, order: 8.3 - i * 0.01, pivot: [0.5, 1] }));
    }
    const tS0 = L14.t0 - 0.28, tS1 = beatT(Math.ceil(beatOf(L14.t0 - 0.05))), tS2 = Math.min(tS1 + BEAT, tBoom - 0.12);
    for (let i = 0; i < 5; i++) {
      const sybil = (t) => { if (t < tS0 || t >= tBoom) return null; const u0 = spring(clamp((t - tS0) / 0.3) * 1.4), u1 = spring(clamp((t - tS1) / 0.28) * 1.4), u2 = spring(clamp((t - tS2) / 0.28) * 1.4), c = i - 2;
        const stack = [dk[0], dk[1] + 0.03 * i, dk[2] + 0.05 * i], split = [dk[0] + c * 0.42, dk[1] + Math.abs(c) * -0.12, dk[2] + 0.05 * i], stair = [dk[0] + c * 0.4, dk[1] + c * 0.44, dk[2] + 0.06 * i];
        const p = lerp3(lerp3(stack, split, u1), stair, u2);
        return { p: [p[0], p[1] - (1 - u0) * 2.2, p[2]], r: [0.28 * u2, c * 0.2 * u2, 0.06 + c * 0.34 * u1 * (1 - u2) + c * 0.05 * u2], s: 0.92 + 0.08 * u0, a: clamp((t - tS0) / 0.08) };
      };
      ph.push(await cardFace(kit, DECK[i], sybil, { size: 1.7, order: 8.25 + i * 0.012, walls: 6, wallStep: 0.012, shadow: { d: 0.05, dx: 0.06, dy: 0.08, a: 0.3, bias: 3 } }));
    }
    ph.push(...burst(kit, tS2 + 0.05, () => [dk[0], dk[1], dk[2] + 0.4], { size: 3.2, col: K_GOLD, order: 8.2 }));
    ph.push(...burst(kit, tBoom, () => [dk[0], dk[1] + 0.9, dk[2]], { size: 4.5, col: HOT, order: 8.4 }));
    // 「わたしを誰だと思ってるの？」: a wall of her cards behind the poster turns over in a diagonal wave on every beat (the MAD's tiles)
    const WALL = ['YC_wave', 'YC_kiss'], wallOn = L15.t0 - 0.1, wallOut = L16.t0 - 0.1;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) {      // (wider than the window's shadow on it: the wall shows all round the window)
      const d = c + r, x = (c - 4.5) * 1.75, y = (1.5 - r) * 2.35 + 0.3;
      ph.push(await cardFace(kit, WALL[(c + r) % 2], (t) => { if (t < wallOn + d * 0.04 || t > wallOut + 0.5) return null;
        const b = beatOf(t) - d * 0.5, k = Math.floor(b), f = b - k, flip = (k % 2 + 2) % 2, ry = Math.PI * (flip + io(clamp(f / 0.36))) ;
        const ue = clamp((t - wallOn - d * 0.04) / 0.3), uo = clamp((t - wallOut - d * 0.03) / 0.35);
        return { p: [x, y - uo * uo * 4, -5.2], r: [0, ry, 0], s: outE(ue), a: 1 - sm(uo) };
      }, { size: 2.15, order: 1.5, shadow: false }));
    }
    // 「もう何だか あまいものが食べたい！」: her cards tumble down with the sweets (some close to the lens); on 「食べたい」 a big card slams in
    const RAIN = ['KC_heart', 'YC_wave', 'KC_wink', 'YC_kiss', 'KC_jump'];
    for (let i = 0; i < 20; i++) {
      const t0 = L16.t0 + 0.1 + i * BEAT * 0.55, x = (hash(i * 7.1) - 0.5) * 11, z = i % 3 === 0 ? -1.5 : 0.8 + hash(i * 3.3) * 4.2, sp = 2.2 + hash(i * 1.1) * 1.4;   // (two in three fall in front of the window)
      ph.push(await cardFace(kit, RAIN[i % RAIN.length], (t) => { const u = t - t0; if (u < 0 || u > 4) return null;
        return { p: [x + Math.sin(u * 1.7 + i) * 0.5, 4.6 - u * sp, z], r: [u * 1.3 * (hash(i) - 0.5), u * 2.6 * (i % 2 ? 1 : -1), u * 0.9 * (hash(i * 4) - 0.5)], a: 1 }; },
        { size: z > 3 ? 1.9 : 1.55, order: z > 0.5 ? 9.2 : 2.6, shadow: false }));
    }
    const tSlam = ((L16.part('食べたい') || { times: [] }).times[0] ?? L16.t0 + 4) - 0.06;
    ph.push(...(await holoCard(kit, [[tSlam, 'KC_jump']], { at: [0, 0, 0], size: 4.2, order: 9.4, phase: 0.5, amp: 0.6, sparks: 8, from: 0, out: tSlam + 0.95,
      pos: (t, p) => { const u = clamp((t - tSlam) / 0.2); return [0.2, -0.1 + p[1], lerp(-9, 2.6, outE(u))]; } })));
    ph.push(...burst(kit, tSlam + 0.16, () => [0.2, -0.1, 2.5], { size: 7, col: LEMON, order: 9.3 }));
    FLASH.push(tSlam + 0.16, tBoom);
    ph.push(await motif(kit, 'keyboard', T0 + 0.8, T1 - 1.0, (t) => [-3.7, -1.9 + 0.08 * pulse(t, 8), 1.8], 1.8, { order: 9.2, rz: 0.12, bob: 0 }), await motif(kit, 'fox', T0 + 1.0, T1 - 1.0, (t) => [-4.5, -1.25 + 0.12 * pulse(t, 7), 2.0], 1.05, { order: 9.3, bob: 0 }));
    // the last two cards fly at the lens and past it (the Fate MAD's chip thrown at the camera), into the next section
    const flyAt = (dir) => (t) => { const v = clamp((t - (T1 - 0.9)) / 0.9); return [dir * v * v * 1.2, v * 0.6, v * v * 5.2]; };
    ph.push(...(await holoCard(kit, [[L17.t0, 'KC_jump']], { at: [-3.2, -0.7, 2.0], size: 2.4, rz: 0.08, order: 9.7, phase: 0.8, move: flyAt(-1) })));
    ph.push(...(await holoCard(kit, [[L17.t0 + BEAT, 'YC_kiss']], { at: [3.2, -0.7, 2.0], size: 2.4, rz: -0.08, order: 9.76, phase: 2.9, from: 1.5, move: flyAt(1) })));
    // 「いますぐによ」: stamped big and slanted
    ph.push(glossLine(kit, L17, { font: 'DelaGothic', px: 220, size: 0.66, align: 'center', at: [0, 0.35, 2.6], maxW: 5.6, lineH: 0.95, enter: 'zoom', col: Y_SILVER, ink: HOT, strokeK: 0.16, chip: HOT, chipInk: WHITE, zhSize: 0.3, order: 9.5, out: T1 - 0.15, outStyle: 'scatter', hit: 0.18 }));      // (stamp: the gloss inside it)
    // sparkles riding the beat around the window
    const spark = PT.sparkTex(kit);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; ph.push(plane(spark, { w: 0.22 + hash(i) * 0.22, mode: 1, col: i % 3 ? WHITE : LASER, order: 4, sharp: true, at: (t) => { const w = winAt(t), r = 4.3 + 0.4 * Math.sin(t * 0.7 + i); const b = pulse(t + i * 0.031, 7); return { p: [w.p[0] + Math.cos(a + t * 0.15) * r, w.p[1] + Math.sin(a + t * 0.15) * r * 0.58, w.p[2] + 0.3], r: [0, 0, t + i], s: 0.4 + 0.9 * b, a: 0.35 + 0.65 * b }; } })); }
    const cam = camTrack([
      { t: T0, p: [0, 0, 1.4], look: [0, 0, -4] }, { t: T0 + 0.6, p: [0, -0.1, 9.0], look: [0, 0.1, 0] },
      { t: L12.t0, p: [-3.4, -1.3, 9.8], look: [0, 0, 0] }, { t: (kHime ? kHime.t0 : L12.t0 + 2), p: [0.6, -0.7, 7.1], look: [0.0, 0.0, 0] }, { t: L13.t0, p: [2.3, 0.5, 8.2], look: [0.1, 0.05, 0] },
      { t: L14.t0, p: [-1.4, -1.2, 7.9], look: [0.1, -0.1, 0] }, { t: L15.t0, p: [1.5, 0.3, 7.1], look: [0, 0.1, 0] },
      { t: L16.t0, p: [-1.8, -0.4, 8.6], look: [0, 0.2, 0] }, { t: L16.t0 + BEAT * 4, p: [1.6, 0.6, 7.3], look: [0, 0.1, 0] }, { t: L17.t0, p: [0.9, -0.3, 7.5], look: [0, 0, 0] }, { t: T1, p: [0, 0.1, 6.8], look: [0, 0.1, 0] },
    ]);
    sets.push({ t0: T0, t1: T1, planes: ph, extras: [sea, las],
      cam: (t) => { const c = cam(t), k = pulse(t, 9, 2) * 0.012; const d = [c.look[0] - c.p[0], c.look[1] - c.p[1], c.look[2] - c.p[2]]; return { ...c, p: [c.p[0] + d[0] * k, c.p[1] + d[1] * k, c.p[2] + d[2] * k], fov: 38, focus: 8, dof: 0.4, maxBlur: 8 }; },
      bg: () => ({ top: [30, 10, 52], bot: STAGE }), ground: (t) => ({ kind: 3, pulse: pulse(t, 7) }),
      post: (t) => ({ bloom: (t > 82 ? 0.2 : 0.55) + (t > 82 ? 0.05 : 0.25) * pulse(t, 7), thr: t > 82 ? 0.85 : 0.62, ca: 0.0025 * pulse(t, 8), grain: 0.035, vig: 0.32, glitch: (t < T0 + 0.06 ? 0.8 : 0), flash: FLASH.some((f) => t > f && t < f + 0.07) ? [1, 0.95, 0.8, 0.45] : [1, 0.18, 0.59, t > L12.t0 - 0.05 && t < L12.t0 + 0.03 ? 0.8 : 0] }) });
  }
  return sets;
}

// ======================================== the opening: 冷開場「電波降臨」(0:00–0:10.9) and 前奏《竹取絵巻 ver.2026》(0:10.9–0:28.6) ========
// PLAN-v2 §4. Cold open: a Tsukuyomi card back spins in the night; on 「世界で一番」 it turns over into a LIVE card (Yachiyo's synced
// close-up); on the drums it turns into the TITLE card while 「WORLD / IS / MINE」 slams behind it a word a beat (hairline outline);
// signal rings pulse out of it on the beats; the two lines perform beside it, their Chinese on chips under them. Intro: a gold-leaf
// picture scroll slides right → left with five windows (synced live + the film's own 竹取 moments); five treasure cards are
// presented one a bar — face-down, turned over with a rarity burst — and flown into the WISHLIST slots; the shell card then lifts out
// and becomes the shut phone at 0:28.6 (a shape match into 其の一).
const QF = new THREE.Quaternion(), QB = new THREE.Quaternion(), EB = new THREE.Euler(), YPI = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
const backEuler = (r) => { QF.setFromEuler(EB.set(r[0], r[1], r[2], 'YXZ')); QB.copy(QF).multiply(YPI); EB.setFromQuaternion(QB, 'YXZ'); return [EB.x, EB.y, EB.z]; };
// a WALL of cards that together show one moving picture whole (the user, 2026-11-24: "可以靠多张卡平铺来实现原视频素材的全画幅展现"):
// MW × MH cards (card aspect × 5 ≈ 16:9), each a back (mode 10), a window with its own crop of the footage, a metal rim and a little
// thickness. segs: [[t start, t end, 'y' | 'x' (the axis they turn over on as they are dealt), delay(i, j), 'up' | 'down' (face up or
// down as they gather back into the deck at the end)]]; deck(t): where they come from and go back to. A ripple runs across the wall on
// every beat; the wall turns a little so its depth shows. o.burst: [[t, i, j, u, v]] — a flash on one card at (u, v) of its window.
// fusion windows for a card wall: [[from, to], …] → its fusion amount (in over inD s, out over outD s)
const fuseWin = (W, inD = 0.9, outD = 0.45) => (t) => { for (const [a, b] of W) if (t > a && t < b) return Math.min(io(clamp((t - a) / inD)), io(clamp((b - t) / outD))); return 0; };
function tileWall(kit, back, o) {
  const MW = o.MW ?? 5, MH = o.MH ?? 2, TH = o.TH ?? 2.6, TW = TH * 0.716, GP = o.GP ?? 0.06, TI = 0.032 * TH, MCX = o.MCX ?? 0, MCY = o.MCY ?? 0, MCZ = o.MCZ ?? 0;
  const MWt = MW * TW + (MW - 1) * GP, MHt = MH * TH + (MH - 1) * GP, FH = MWt / (16 / 9), VK = MHt / FH, rimT = PT.tileRimTex(kit), ph = [], O0 = o.order ?? 5.2;
  // (2026-11-24, "merge完之后不同的卡应该是紧贴在一起的…卡与卡之间靠近逐渐融合") as a wall fuses its cards slide together — the pitch shrinks until
  // the windows touch — while their edges melt; slotOf(i, j, t) follows it (without t: the dealt layout)
  const winW = TW - 2 * TI, winH = TH - 2 * TI, fzE = (t) => (t == null || !o.fuseAt ? 0 : io(clamp(o.fuseAt(t))));
  const slotOf = (i, j, t) => { const e = fzE(t), px = lerp(TW + GP, winW, e), py = lerp(TH + GP, winH, e); return [MCX + (i - (MW - 1) / 2) * px, MCY + ((MH - 1) / 2 - j) * py, MCZ]; };
  const t0 = o.t0 ?? 0, sw = o.sway === false ? 0 : 1, wallYaw = (t) => sw * (0.1 * Math.sin((t - t0) * 0.55) - 0.06), wallPitch = (t) => sw * 0.04 * Math.sin((t - t0) * 0.4 + 1), YW = o.yaw ?? 0;
  const NVv = new THREE.Vector3(), Ee = new THREE.Euler();
  const offP = (st, d) => { NVv.set(0, 0, 1).applyEuler(Ee.set(st.r[0], st.r[1], st.r[2], 'YXZ')); return [st.p[0] + NVv.x * d, st.p[1] + NVv.y * d, st.p[2] + NVv.z * d]; };
  const tilePose = (t, i, j) => {
    const S = slotOf(i, j, t), k = i + j * MW, sg = o.segs.find(([a, b]) => t >= a && t < b); if (!sg) return null;
    const [ta, tb, ax, dlf, gather] = sg, dl = dlf(i, j), DECK = o.deck(t), u = clamp((t - ta - dl) / 0.5), g0 = tb - 0.5 + dl * 0.2, v = clamp((t - g0) / (tb - g0));
    if (u <= 0) return null;
    const e = outE(u), f = io(clamp(u * 1.25));
    let p = [lerp(DECK[0], S[0], e), lerp(DECK[1], S[1], e) + Math.sin(u * Math.PI) * 0.35 * (j ? -1 : 1), lerp(DECK[2], S[2], e) + Math.sin(u * Math.PI) * 1.1 + 0.002 * k];
    let r = ax === 'y' ? [0, Math.PI * (1 - f), (1 - e) * (i - 2) * 0.18] : [Math.PI * (1 - f) * (j ? -1 : 1), 0, (1 - e) * (i - 2) * 0.1];
    const rip = pulse(t - i * 0.035 - j * 0.02, 7); p[2] += 0.1 * rip * u; r[0] -= 0.05 * rip * u;
    if (o.extra) { const xr = o.extra(t, i, j); if (xr) r = [r[0] + xr[0], r[1] + xr[1], r[2] + xr[2]]; }      // (a column turning over to its next shot)
    const W = wallYaw(t), X = wallPitch(t), dx = p[0] - MCX, dy = p[1] - MCY, dz = p[2] - MCZ;
    p = [MCX + dx * Math.cos(W) + dz * Math.sin(W), MCY + dy * Math.cos(X), MCZ - dx * Math.sin(W) + dz * Math.cos(W) + dy * Math.sin(X)]; r = [r[0] + X, r[1] + W, r[2]];
    if (YW) { const ex = p[0] - MCX, ez = p[2] - MCZ; p = [MCX + ex * Math.cos(YW) + ez * Math.sin(YW), p[1], MCZ - ex * Math.sin(YW) + ez * Math.cos(YW)]; r = [r[0], r[1] + YW, r[2]]; }      // (a wall of a room: turned about its centre)
    if (v > 0) {      // the gather is a scoop: the wall slides down into an overlapping ribbon spread at the deck, then squares up (k: its place in the spread)
      const h1 = io(clamp(v / 0.6)), h2 = io(clamp((v - 0.45) / 0.55)), sp = [DECK[0] + (k - (MW * MH - 1) / 2) * TW * 0.16, DECK[1], DECK[2] + k * 0.004];
      p = lerp3(lerp3(p, sp, h1), DECK, h2); r = [lerp(r[0], 0, h1), r[1] + (gather === 'down' ? Math.PI * io(clamp((v - 0.25) / 0.6)) : 0), lerp(r[2], 0, h1) + (k - (MW * MH - 1) / 2) * 0.015 * (1 - h2)]; }
    return { p, r, a: 1 };
  };
  const fz = (t) => (o.fuseAt ? o.fuseAt(t) : 0), keep = (t) => 1 - sm(clamp(fz(t) / 0.14));      // (the cards fade beneath the fused screen as it takes over)
  for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) {
    const k = i + j * MW, o0 = O0 + k * 0.03, at = (t) => tilePose(t, i, j), S = slotOf(i, j);
    const wx0 = S[0] - MCX - TW / 2 + TI, wyT = S[1] - MCY + TH / 2 - TI, vm0 = (MHt / 2 - wyT) / MHt;
    const crop = [(wx0 + MWt / 2) / MWt, 0.5 + (vm0 - 0.5) * VK, (TW - 2 * TI) / MWt, (TH - 2 * TI) / MHt * VK];
    ph.push({ tex: back.still, h: TH, mode: 1, col: [0, 0, 0], rimOnly: true, rim: { d: TH * 0.009, rk: RIMK, col: [238, 232, 255] }, order: o0 - 0.002, sharp: true, at: (t) => { const st = at(t), kp = 1 - sm(clamp(fz(t) / 0.3)); return st && kp > 0.001 && { ...st, a: (st.a ?? 1) * kp }; } });
    ph.push({ tex: back.tex, h: TH, mode: back.mode, card: back.card, order: o0, sharp: true, single: true, at: (t) => { const st = at(t), kp = 1 - sm(clamp(fz(t) / 0.3)); return st && kp > 0.001 && { ...st, r: backEuler(st.r), phase: k * 0.7, a: (st.a ?? 1) * kp }; } });      // (edges and backs go too: the fused screen is seamless)
    ph.push({ tex: null, w: TW - 2 * TI, h: TH - 2 * TI, footage: o.srcAt ? o.srcAt(i, j) : o.src, crop, order: o0 + 0.002, round: TH * 0.075, sharp: true, single: true, crt: { a: 0.14, lines: 300, mask: 0.15, fringe: 0.6 },
      at: (t) => { const st = at(t), kp = keep(t); return st && kp > 0.001 && { ...st, p: offP(st, 0.004), col: o.col || [226, 222, 234], a: (st.a ?? 1) * kp }; } });
    ph.push({ tex: rimT, h: TH, mode: 9, mat: { kind: 'metal', bevel: 3, shine: 1.0, pearl: 0.25 }, col: o.rimCol || [236, 214, 168], order: o0 + 0.004, sharp: true, single: true, at: (t) => { const st = at(t), kp = 1 - sm(clamp(fz(t) / 0.45)); return st && kp > 0.001 && { ...st, p: offP(st, 0.008), a: (st.a ?? 1) * kp }; } });
  }
  if (o.fuseAt) {      // the fused screen (see space.js CARD FUSION) and one metal frame round it once it is whole
    const pose = (t, d) => { const W = wallYaw(t) + YW, X = wallPitch(t); return { p: [MCX + Math.sin(W) * Math.cos(X) * d, MCY - Math.sin(X) * d, MCZ + Math.cos(W) * Math.cos(X) * d], r: [X, W, 0] }; };
    const src = o.fuseSrc || (o.srcAt ? o.srcAt(Math.floor(MW / 2), 0) : o.src), FW = { C: MW, R: MH, win: [winW, winH], rr: TH * 0.075, k: (GP + 2 * TI) * 2.6, ro: TH * 0.1 };
    ph.push({ tex: null, w: MWt, h: MHt, footage: src, crop: [0, 0.5 - VK / 2, 1, VK], order: O0 + MW * MH * 0.03 + 0.02, sharp: true, single: true,
      at: (t) => { const f = fz(t); if (!(f > 0)) return null; const e = fzE(t), Ws = lerp(MWt, MW * winW, e), Hs = lerp(MHt, MH * winH, e), VKs = Hs / (Ws / (16 / 9));      // (the picture spans the cards as they close up: whole, no strips lost at the seams)
        return { ...pose(t, 0.006), s: [Ws / MWt, Hs / MHt], crop: [0, 0.5 - VKs / 2, 1, VKs], col: o.col || [226, 222, 234], fuse: { ...FW, pitch: [lerp(TW + GP, winW, e), lerp(TH + GP, winH, e)], f } }; } });
    ph.push({ tex: PT.holoFrameTex(kit), w: MWt * 1.02, h: MHt * 1.035, mode: 9, mat: { kind: 'metal', bevel: 4, shine: 1.0, pearl: 0.2 }, col: o.rimCol || [236, 214, 168], order: O0 + MW * MH * 0.03 + 0.03, sharp: true, single: true,
      at: (t) => { const f = fz(t), a = sm(clamp((f - 0.45) / 0.2)) * (1 - sm(clamp((f - 0.7) / 0.25))), e = fzE(t); if (!(a > 0.001)) return null; return { ...pose(t, 0.01), s: [lerp(MWt, MW * winW, e) / MWt, lerp(MHt, MH * winH, e) / MHt], a: a * 0.6 }; } });      // (only a glint of a frame while the cards merge — none once it is whole)
  }
  // a flash on one card's window at a moment (a wink, a hit): its centre found from the card's own pose
  for (const [tb, i, j, u, v] of o.burst || []) ph.push(...burst(kit, tb, (t) => { const st = tilePose(t, i, j); if (!st) return slotOf(i, j); const TWw = TW - 2 * TI, THh = TH - 2 * TI; return [st.p[0] + (u - 0.5) * TWw, st.p[1] + (0.5 - v) * THh, st.p[2] + 0.1]; }, { size: 2.6, col: [255, 236, 250], order: O0 + 0.6 }));
  ph.slotOf = slotOf; ph.pose = tilePose; ph.dims = { TW, TH, MWt, MHt };
  return ph;
}
const SCROLL = { w: 30, h: 4.2, y: 0.35, x: (t) => 20.5 - (t - 10.1) * 1.6 - (t > 27.75 ? Math.pow(t - 27.75, 2) * 40 : 0), WIN: [0.14, 0.32, 0.5, 0.68, 0.86] };   // (it whips away left before the shell becomes the phone)
async function scrollPlanes(kit, tIn, tOut, order = 1) {
  const [em, cover, cord, roll] = await Promise.all(['emaki2', 'emaki_cover', 'emaki_cord', 'emaki_roll'].map((n) => kit.img(`materials/${n}.png`))), rim = PT.holoFrameTex(kit);   // (v2: tools/emaki2.py — NovelAI yamato-e panels, brocade)
  const ph = [plane(em, { w: SCROLL.w, h: SCROLL.h, order, mode: 9, mat: { kind: 'metal', bevel: 3, shine: 0.6, pearl: 0.16 }, edge: { d: 0.06, col: [214, 170, 90] }, shadow: { d: 0.2, dx: 0.2, dy: 0.25, a: 0.35, bias: 4 },
    at: (t) => (t < tIn || t > tOut ? null : { p: [SCROLL.x(t), SCROLL.y, 0], r: [-0.04, 0.06, 0] }) })];
  // (the user, 2026-11-24: "绘卷要做的更精致且合理") a handscroll's parts where they belong: at its beginning (the left end, the first to
  // come in) the brocade cover with its title slip, the 八双 strip on its edge and the cord hanging from it; at its end the roller with
  // the paper wound on it and the rod's gold knobs standing out above and below
  // (2026-11-24, "绘卷的卷首和后面存在脱节空隙": the scroll is turned 0.06 about Y; its parts must be placed through that turn about the scroll's
  // centre, not each turned about its own — or their edges part in depth)
  const RY = 0.06, CVW = SCROLL.h * 560 / 1148, at0 = (x, y, dz, extra) => (t) => (t < tIn || t > tOut ? null : { p: [SCROLL.x(t) + x * Math.cos(RY), SCROLL.y + y, dz - x * Math.sin(RY)], r: [-0.04, RY, 0], ...(extra ? extra(t) : {}) });
  ph.push(plane(cover, { w: CVW, h: SCROLL.h, order: order + 0.015, mode: 9, mat: { kind: 'acrylic', bevel: 3, shine: 0.6, pearl: 0.15 }, at: at0(-SCROLL.w / 2 - CVW / 2 + 0.06, 0, 0.004) }));
  ph.push(plane(cord, { w: SCROLL.h * 420 / 1148, h: SCROLL.h * 900 / 1148, pivot: [30 / 420, 120 / 900], order: order + 0.03, at: at0(-SCROLL.w / 2 - CVW + 0.03, 0.15, 0.03, (t) => ({ s: [-1, 1], r: [-0.04, 0.06, 0.06 * Math.sin(t * 1.7)] })) }));
  ph.push(plane(roll, { w: SCROLL.h * 220 / 1148, h: SCROLL.h * 1.16, order: order + 0.03, mode: 9, mat: { kind: 'metal', bevel: 3, shine: 0.8, pearl: 0.1 }, at: at0(SCROLL.w / 2 + 0.08, 0, 0.06) }));
  // the windows: synced live and the film's 竹取 moments, each clip slowed to span the window's pass
  const content = ['r4', 'live', 'r5', 'r7', 'live'], ww = 0.11 * SCROLL.w, wh = 0.56 * SCROLL.h, crop = (ww / wh) / (16 / 9);
  SCROLL.WIN.forEach((f, k) => {
    const lx = (f - 0.5) * SCROLL.w, tEnter = 10.1 + (20.5 + lx - 6.5) / 1.6, src = content[k] === 'live' ? live : clip(content[k], tEnter - 0.2, 0.34, 0);
    const at = (dz) => (t) => (t < tIn || t > tOut ? null : { p: [SCROLL.x(t) + lx * Math.cos(0.06), SCROLL.y, dz - lx * Math.sin(0.06)], r: [-0.04, 0.06, 0] });      // (on the paper, through its turn)
    ph.push(plane(null, { w: ww, h: wh, footage: src, crop: [(1 - crop) / 2, 0, crop, 1], order: order + 0.01, round: 0.3, crt: { a: 0.12, lines: 300, mask: 0.15, fringe: 0.6 }, at: at(0.015) }));
    ph.push(plane(rim, { w: ww * 1.04, h: wh * 1.05, order: order + 0.02, mode: 9, mat: { kind: 'metal', bevel: 4, shine: 1.0, pearl: 0.1 }, col: [236, 200, 120], at: at(0.02) }));
  });
  return ph;
}
export async function opening(kit) {
  const LY = await lyrics(), ln = (n) => LY.line(n);
  if (!GLOSS) GLOSS = await fetch('audio/gloss.json').then((r) => r.json(), () => ({}));
  const sets = [], L1 = ln(1), L2 = ln(2), DRUM = 4.8, T1c = bar(5) - 0.02;
  // ---------------------------------------- cold open ----------------------------------------
  {
    const ph = [], size = 3.9, cw = size * 0.716, ins = 0.032 * size;
    const [back, title, lf] = [await cardBack(kit), await cardInfo(kit, 'TITLE'), await cardInfo(kit, 'LIVEFRAME')];
    const tF1 = (L1.times[0] ?? 0.89) - 0.32, tF2 = DRUM - 0.22, tF3 = bar(3) - 0.22, tAway = 9.3;
    const faceAt = (t) => (t < tF2 + 0.22 ? 'live' : t < tF3 + 0.22 ? 'title' : 'live');
    // (the user, 2026-11-24: "intro开头的八千代画面可以靠多张卡平铺来实现原视频素材的全画幅展现") the one card is a DECK: on 「世界で」 it deals
    // out into a wall of 5 × 2 cards that together show the whole 16:9 frame; on the drums the wall gathers back into the one card, which
    // turns to the title; on bar 3 the title deals out into the wall again (split-flap turns this time); at tAway the wall gathers into
    // the deck and springs. The single card is hidden while the wall stands.
    const hiddenAt = (t) => (t > tF1 + 0.02 && t < tF2) || (t > tF3 + 0.02 && t < tAway);
    const pose = (t) => {
      let p = [-1.85, 0.05, 0], ry = 0, s = 1, a = 1;
      if (t < tF1 + 0.02) { const u = clamp(t / (tF1 + 0.02)); p = [lerp(-0.6, -1.85, outE(u)), lerp(0.7, 0.05, outE(u)), lerp(-6, 0, outE(u))]; ry = Math.PI + 0.5 * (1 - u); a = clamp(t / 0.4); }
      if (t > tF2) ry += Math.PI * 2 * io(clamp((t - tF2) / 0.45));
      const bl = beatOf(t), hit = t > 1 && t < tAway ? Math.exp(-Math.pow((bl - Math.round(bl)) * BEAT, 2) / 0.004) : 0;
      if (t >= tAway) { ry = Math.PI; const v = clamp((t - tAway) / 0.32); s *= lerp(1, 0.42, io(v)); a = 1 - sm((v - 0.55) / 0.45); }   // (the gathered deck… springs: see the stream below)
      if (hiddenAt(t)) a = 0;
      return { p, r: [-0.05 + 0.03 * Math.sin(t * 0.7), ry + 0.05 * Math.sin(t * 0.5), 0.03 * Math.sin(t * 0.43)], s: s * (1 + 0.025 * hit), a };
    };
    const NVv = new THREE.Vector3(), Ee = new THREE.Euler();
    const offP = (st, d) => { NVv.set(0, 0, 1).applyEuler(Ee.set(st.r[0], st.r[1], st.r[2], 'YXZ')); return [st.p[0] + NVv.x * d, st.p[1] + NVv.y * d, st.p[2] + NVv.z * d]; };
    ph.push({ tex: title.face, h: size, mode: 1, col: [0, 0, 0], rimOnly: true, rim: { d: size * 0.027, rk: RIMK, col: [238, 232, 255] }, order: 4.996, sharp: true, at: (t) => pose(t) });
    ph.push({ tex: back.tex, h: size, mode: back.mode, card: back.card, order: 5.0, sharp: true, single: true, at: (t) => { const st = pose(t); return { ...st, r: backEuler(st.r) }; } });
    ph.push({ tex: title.face, h: size, mode: 8, card: title.card, order: 5.001, sharp: true, single: true, at: (t) => (faceAt(t) === 'title' ? pose(t) : null) });
    const winW = cw - 2 * ins, winH = size - 2 * ins, crop = (winW / winH) / (16 / 9);
    ph.push({ tex: null, w: winW, h: winH, footage: live, crop: [(1 - crop) / 2, 0, crop, 1], order: 5.002, round: ins * 0.9, sharp: true, single: true, crt: { a: 0.18, lines: 300, mask: 0.2, fringe: 0.8 },
      at: (t) => { if (faceAt(t) !== 'live') return null; const st = pose(t); return { ...st, p: offP(st, 0.004), col: [214, 208, 226] }; } });   // (held under the bloom: her pale close-up read as a white card)
    ph.push({ tex: lf.L.top.tex, h: size, mode: 8, card: lf.L.top.card, order: 5.003, sharp: true, single: true, at: (t) => { if (faceAt(t) !== 'live') return null; const st = pose(t); return { ...st, p: offP(st, 0.008) }; } });
    ph.push(...burst(kit, tF1 + 0.08, () => [-1.85, 0.05, -0.3], { size: 6.5, col: Y_SILVER, order: 4.9 }), ...burst(kit, DRUM, (t) => pose(t).p, { size: 8, col: LEMON, order: 4.9 }), ...burst(kit, tF3 + 0.22, (t) => pose(t).p, { size: 6, col: [255, 160, 220], order: 4.9 }));
    // ---- the tile wall: 5 × 2 cards showing the synced live whole (tileWall below) ----
    ph.push(...tileWall(kit, back, { MCX: -0.3, MCY: 0.05, deck: () => [-1.85, 0.05, 0], src: live, t0: tF1, fuseAt: fuseWin([[tF1 + 1.0, tF2 - 0.45], [tF3 + 0.8, tAway - 0.45]]),
      segs: [[tF1, tF2, 'y', (i, j) => (Math.abs(i - 2) + j * 0.6) * 0.055, 'up'], [tF3, tAway, 'x', (i, j) => i * 0.075 + j * 0.035, 'down']] }));
    // a SPRING (cardistry): the live card gathers into a deck and springs a stream of card backs in an arc across the night, toward
    // where the scroll comes in — the hand-off to the intro
    // (cardistry polish, the user 2026-11-24: "全片花切演出还可以优化一下") a real spring is ONE ribbon: forty cards follow a single arc, each
    // turned along its path and turning over in a wave as the stream passes (not tumbling each its own way)
    const SPN = 40, arcP = (u) => { const x = lerp(-1.85, 8.6, u), y = 0.05 + Math.sin(u * Math.PI) * 1.3 + u * 0.3, z = 0.2 + Math.sin(u * Math.PI) * 0.9 + u * 0.6; return [x, y, z]; };
    for (let j = 0; j < SPN; j++) {
      const tj = tAway + 0.16 + j * 0.017;
      ph.push(await cardFace(kit, null, (t) => { const u = (t - tj) / 0.66; if (u < 0 || u > 1) return null; const e = io(u), p = arcP(e), q = arcP(Math.min(1, e + 0.01));
        const tang = Math.atan2(q[1] - p[1], q[0] - p[0]);
        return { p, r: [0.25 * Math.sin(e * Math.PI), Math.PI * (1 + 0.85 * sm(e * 1.3)), tang * 0.8 - 0.2], s: 0.62 + 0.18 * Math.sin(u * Math.PI), a: clamp(u * 12) * (1 - sm((u - 0.88) / 0.12)) };
      }, { size: 1.5, order: 6 + j * 0.012, shadow: false, walls: 2 }));
    }
    // signal rings out of the card on the beats (the moon's 電波)
    const ring = PT.ringTex(kit, 'thin', 0.012);
    for (let b = 0; beatT(b) < tAway; b++) { const tb = beatT(b); if (tb < 0.1) continue;
      ph.push(plane(ring, { w: 1, mode: 1, col: b % 3 === 0 ? MIKU : Y_SILVER, order: 4.5, sharp: true, at: (t) => { const u = (t - tb) / 1.3; if (u < 0 || u > 1) return null; const st = pose(t); return { p: [st.p[0], st.p[1], st.p[2] - 0.1], s: lerp(4.2, 11, outE(u)), a: (1 - u) * 0.7 }; } })); }
    // ---- the collage round the card (the user, 2026-11-24: "intro可以做的更精彩精致一些，整体效果要华丽，素材可以多有设计感的堆砌一些"):
    // structure — two moon dials (和時計 / astrolabe, PT.dialTex) turning against each other at two depths; light — rays behind the card;
    // a support family — a halo of living card backs on a tipped orbit the card stands inside (passing behind and in front of it); a
    // ghost 「月」 far back; air — glitter out of focus near the lens. Density: a sparse night until the drums, then all of it at once.
    const dial = PT.dialTex(kit), blk = PT.blockTex(kit), glow = PT.bokehTex(kit), spark = PT.sparkTex(kit), CX = -1.85;
    const lit = (t) => (t < DRUM - 0.05 ? 0.45 * clamp(t / 1.2) : 1) * (1 - sm((t - tAway - 0.1) / 0.5));
    ph.push(plane(dial, { w: 10.5, order: 1.0, mode: 9, mat: { kind: 'metal', bevel: 2, shine: 1.0, pearl: 0.12 }, at: (t) => { const a = lit(t) * (0.5 + 0.2 * pulse(t, 5)); if (a <= 0.01) return null;
      return { p: [CX + 0.3, 0.1, -3.4], r: [0.2, -0.34, t * 0.05], a, col: [240, 206, 140] }; } }));
    ph.push(plane(dial, { w: 5.9, order: 1.2, mode: 9, mat: { kind: 'metal', bevel: 2, shine: 1.0, pearl: 0.3 }, at: (t) => { const a = lit(t) * (0.6 + 0.25 * pulse(t, 6)); if (a <= 0.01) return null;
      return { p: [CX, 0.05, -1.3], r: [0.12, -0.2, 0.4 - t * 0.09], a, col: [214, 196, 255] }; } }));
    ph.push(plane(blk, { w: 9.5, mode: 11, order: 1.5, sharp: true, at: (t) => { if (t < DRUM - 0.05 || t > tAway + 0.6) return null;      // (the burst shader held open: fine rays turning slowly)
      return { p: [CX, 0.05, -0.7], r: [0, 0, t * 0.1], s: 1 + 0.05 * pulse(t, 6), a: (0.32 + 0.3 * pulse(t, 5)) * lit(t), col: [255, 226, 250], u: 0.62, seed: 0.37 }; } }));
    const NO = 12, tO = DRUM + 0.02;
    for (let j = 0; j < NO; j++) {
      const tj = tO + j * 0.045;
      ph.push(await cardFace(kit, null, (t) => {
        if (t < tj || t > tF3 + 0.02) return null;
        const u = clamp((t - tj) / 0.55), gIn = outE(u), gOut = io(clamp((t - tF3 + 0.3) / 0.3)), R = 2.6 * gIn * (1 - gOut);
        const th = (j / NO) * Math.PI * 2 + (t - tO) * 0.7 + (1 - gIn) * 1.4, c = pose(t).p, x = Math.cos(th) * R, z = Math.sin(th) * R;
        // (a Saturn ring: the near half passes BELOW the card, the far half above and behind it — never across her face)
        return { p: [c[0] + x, c[1] - z * 0.72 + x * 0.08, c[2] + z * 0.6], r: [0.12, Math.atan2(Math.cos(th), Math.sin(th)) * 0.55, 0.12], s: 0.75 + 0.25 * gIn, a: clamp(u * 6) };
      }, { size: 1.05, order: 5.5, shadow: false, walls: 2, layerAt: (t, st) => (st.p[2] > pose(t).p[2] ? 5.6 : 4.4) + j * 0.03 }));
    }
    ph.push(letters(kit, '月', { font: 'DelaGothic', px: 400, size: 7.5, align: 'center', at: [3.4, 0.7, -7], times: [0.25], enter: 'pop', stroke: 5, col: [190, 170, 255], alpha: 0.3, order: 0.6, drift: [-0.05, 0, 0], follow: false, out: tAway + 0.3 }));
    for (let i = 0; i < 18; i++) {
      const x0 = -4.2 + hash(i * 3.7) * 7.4, y0 = -2.2 + hash(i * 5.3) * 4.2, z0 = 2.4 + hash(i * 9.1) * 2.8, big = hash(i * 2.2) > 0.6, t0 = hash(i * 1.9) * 2;
      ph.push(plane(big ? glow : spark, { w: big ? 0.3 : 0.26, mode: 1, order: 9 + i * 0.001, at: (t) => { const a = lit(t) * (big ? 0.55 : 1) * (0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(t * (1.2 + hash(i) * 2) + i * 4), 3)); if (a < 0.02) return null;
        return { p: [x0 + 0.06 * Math.sin(t * 0.3 + i), y0 + (t - t0) * 0.07, z0], r: [0, 0, t * 0.4 * (i % 2 ? 1 : -1)], s: 1 + 0.4 * pulse(t, 6), a, col: [[255, 226, 160], [214, 196, 255], [176, 242, 226], [255, 190, 230]][i % 4] }; } }));
    }
    ph.push(await motif(kit, 'sacabambaspis', DRUM + 0.3, tAway - 0.1, (t) => [lerp(7.5, -7.5, clamp((t - DRUM) / (tAway - DRUM))), 2.0 + 0.25 * Math.sin(t * 1.3), -4.2], 2.6, { order: 0.95, shadow: false, bob: 0 }));
    ph.push(await motif(kit, 'seaslug', L1.t0 + 0.6, tF2 - 0.1, [-5.4, 0.9, 1.2], 1.0, { order: 30, rz: 0.1 }), await motif(kit, 'octopus', L2.t0 + 0.3, tAway - 0.1, [4.9, -1.75, 1.0], 1.1, { order: 30, rz: -0.08 }));
    // 「WORLD / IS / MINE」: the title slammed behind the card a word a beat, hairline outline (pv-text-performance: title slam)
    [['WORLD', 0, 2.05, 2.3], ['IS', 1, 0.45, 1.5], ['MINE', 2, -1.35, 2.3]].forEach(([w, k, y, sz]) => ph.push(letters(kit, w, { font: 'DelaGothic', px: 320, size: sz, align: 'center', at: [0.9, y, -3.6], times: [beatT(Math.ceil(beatOf(DRUM)) + k)], enter: 'zoom', stroke: 7, col: [214, 196, 255], alpha: 0.75, order: 1, out: tF3 + 0.2, outDur: 0.3, follow: false })));
    // the two lines, Yachiyo's silver, scrambling in like a received signal (GMV), the Chinese on a chip under each phrase
    ph.push(glossLine(kit, L1, { mode: 'under', font: 'DelaGothic', px: 180, size: 0.5, at: [-4.85, 2.0, 0.9], maxW: 5.2, enter: 'scramble', scr: 0.4, col: Y_SILVER, ink: [70, 50, 130], strokeK: 0.16, chip: [52, 36, 96], chipInk: WHITE, zhSize: 0.2, order: 7, out: (L2.times[0] ?? 4.2) - 0.12 }));
    ph.push(glossLine(kit, L2, { mode: 'under', font: 'HachiMaru', px: 170, size: 0.44, at: [0.45, -0.55, 0.6], maxW: 5.2, enter: 'flap', col: Y_SILVER, ink: [70, 50, 130], strokeK: 0.2, chip: [52, 36, 96], chipInk: WHITE, zhSize: 0.19, order: 7, out: tAway + 0.1 }));
    const micro = (str, t0, t1, at, size = 0.1) => letters(kit, str, { font: 'Unbounded', px: 120, size, at, times: [...str].map((_, j) => t0 + j * 0.02), enter: 'type', col: [190, 170, 240], order: 2, out: t1, outDur: 0.15, follow: false });
    ph.push(micro('TSUKUYOMI LIVE · ON AIR ●', 0.6, tAway, [-4.4, 2.35, 0.2]), micro('電波受信中  ▮▮▮▯', 0.9, DRUM, [2.6, 2.35, 0.2]), micro('NOW PLAYING · WORLD IS MINE (CPK! Remix)', DRUM + 0.4, tAway, [2.0, -2.35, 0.2], 0.085));
    ph.push(...await scrollPlanes(kit, 10.1, T1c + 0.1, 1));                 // (the scroll already slides in under the last bar)
    const cam = camTrack([{ t: 0, p: [-1.4, 0.5, 12], look: [-1.1, 0.15, 0] }, { t: tF1 + 0.6, p: [-0.35, 0.15, 10.3], look: [-0.3, 0.05, 0] }, { t: tF2 - 0.4, p: [0.15, 0.0, 9.7], look: [-0.2, 0.05, 0] },
      { t: DRUM + 0.25, p: [-0.2, 0.0, 7.6], look: [-0.5, 0.05, 0] }, { t: tF3, p: [0.6, -0.2, 8.2], look: [-0.15, 0, 0] }, { t: tF3 + 0.7, p: [-0.15, 0.1, 10.1], look: [-0.3, 0.05, 0] },
      { t: tAway - 0.3, p: [-0.6, 0.2, 9.6], look: [-0.45, 0.05, 0] }, { t: tAway, p: [-0.4, 0.3, 8.8], look: [0, 0.05, 0] }, { t: T1c, p: [0, 0.4, 9.5], look: [0, 0.25, 0] }]);
    sets.push({ t0: 0, t1: T1c, planes: ph, cam: (t) => ({ ...cam(t), fov: 36, focus: 9, dof: 0.35, maxBlur: 8 }), bg: () => ({ top: [20, 14, 50], bot: [40, 26, 80] }), ground: () => ({ kind: 4 }),
      post: (t) => ({ bloom: 0.26, thr: 0.86, ca: 0.0015 * pulse(t, 7), grain: 0.03, vig: 0.38, glitch: t < 0.12 ? 0.7 : t > DRUM - 0.03 && t < DRUM + 0.06 ? 0.45 : 0 }) });
  }
  // ---------------------------------------- intro: the picture scroll ----------------------------------------
  {
    const T0 = T1c, T1 = 28.6, ph = [];
    ph.push(...await scrollPlanes(kit, T0, T1, 1));
    // the WISHLIST bar (pearl acrylic) and its five slots
    const wb = PT.wishTex(kit), BW = 7.5, BY = -1.55, BZ = 2.6, pxu = BW / 1700, slotX = (k) => (60 + k * 322 + 138 - 850) * pxu, slotY = BY + (150 - 185) * pxu, tBar = bar(7) - BEAT;
    ph.push(object(wb, { at: [0, BY, BZ], size: BW * 300 / 1700, w: BW, t0: tBar, dur: 0.35, enter: 'stamp', order: 6, mode: 9, mat: { kind: 'pearl', bevel: 8, shine: 0.9, pearl: 0.4 }, out: T1 - 0.4, outStyle: 'fall' }));
    // Yachiyo's close-up from the film — the smirk, then the WINK (song 12.0–13.6; the user, 2026-11-24: "intro原片八千代的"よね"这一段演出是
    // 经典，需要用进去"): a wall of cards dealt up in front of the scroll shows it whole; a sparkle bursts at her winking eye; then the wall
    // gathers face down into the deck the treasures are dealt from, where the WISHLIST lands
    const backI = await cardBack(kit);
    ph.push(...tileWall(kit, backI, { TH: 2.36, MCX: 0, MCY: 0.32, MCZ: 1.3, deck: (t) => (t < 13 ? [0, -4.2, 2.2] : [0, BY + 0.2, BZ]), src: live, t0: 11.75, order: 7.6, fuseAt: fuseWin([[12.35, 14.05]], 0.75, 0.4),
      segs: [[11.72, 14.46, 'y', (i, j) => (Math.abs(i - 2) * 0.05 + (1 - j) * 0.06), 'down']], burst: [[13.22, 2, 0, 0.27, 0.86]] }));
    // the five treasures, presented one a bar: face-down, turned over with a rarity burst, then flown into their slot
    const TRS = ['TR1', 'TR2', 'TR3', 'TR4', 'TR5'], XS = [2.7, -2.5, 2.5, -2.7, 0.3], TSZ = 2.5, SLOT = 0.74;
    const tLift = bar(13) - 0.35;                                             // the shell card leaves its slot for the phone
    for (let k = 0; k < 5; k++) {
      const tk = bar(7 + k) - 0.06, tRev = tk + 0.3, tSlot = tk + BEAT * 3, slot = [slotX(k), slotY + 0.02, BZ + 0.06];
      const where = (t) => {                                                   // place, extra turn, scale
        if (t < tSlot) { const u = clamp((t - tk) / 0.45), e = outE(u); return { p: [XS[k], lerp(-4.2, 0.45, e), 2.0], dr: [0, 0, (1 - e) * 0.4 * (k % 2 ? 1 : -1)], s: 1 }; }
        const v = clamp((t - tSlot) / 0.45), e = io(v), arc = Math.sin(v * Math.PI) * 0.8;
        let p = [lerp(XS[k], slot[0], e), lerp(0.45, slot[1], e) + arc, lerp(2.0, slot[2], e)], s = lerp(1, SLOT / TSZ, e), dr = [0, e * Math.PI * 2 * (k % 2 ? 1 : -1), 0];
        if (k === 0 && t > tLift) {                                            // the shell: out of its slot, to the middle, into the phone's shape
          const w = clamp((t - tLift) / 0.9), f = io(w), g = clamp((t - (T1 - 0.18)) / 0.18);
          p = [lerp(slot[0], 0, f), lerp(slot[1], 0, f) + Math.sin(w * Math.PI) * 0.6, lerp(slot[2], 0.2, f)]; s = lerp(SLOT / TSZ, 2.3 / TSZ, f); dr = [0, f * Math.PI * 4, 0];
          dr[1] += g * Math.PI * 0.5;                                          // (edge-on as the cut comes)
        }
        return { p, dr, s };
      };
      ph.push(...(await holoCard(kit, [[tk, TRS[k]]], { at: [0, 0, 0], size: TSZ, order: 7 + k * 0.03, phase: k * 1.7, sparks: 5, amp: 0.6, from: 0, reveal: tRev, out: T1 + 0.2, outStyle: 'none',
        hits: [tRev + BEAT, tRev + BEAT * 2], anim: (t) => { const w = where(t); return { dr: w.dr, s: w.s }; }, pos: (t) => where(t).p })));
      ph.push(...burst(kit, tRev + 0.22, (t) => where(t).p, { size: 5, col: [LEMON, MIKU, HOT, K_GOLD, [255, 190, 230]][k], order: 6.9 }));
    }
    ph.push(...burst(kit, T1 - 0.1, () => [0, 0, 0.3], { size: 7, col: [255, 236, 250], order: 9 }));
    // ---- the intro's collage (the user, 2026-11-24: "整体效果要华丽，素材可以多有设计感的堆砌一些"): the moon dial turning far behind
    // (the cold open's structure carried on), bands of gold suyari cloud in three depths sliding at their own speeds against the scroll
    // (parallax: the 絵巻's own mist, PT.kumoTex), cut-gold flakes falling and catching the light, and each treasure's name as a pair
    // of vertical columns — the Japanese big in gold, the Chinese small beside it (pv-text-performance: interleaved columns)
    const dialI = PT.dialTex(kit), flake = PT.blockTex(kit), KM = (k) => PT.kumoTex(kit, k);
    ph.push(plane(dialI, { w: 12.5, order: 0.3, mode: 9, mat: { kind: 'metal', bevel: 2, shine: 1.0, pearl: 0.12 }, at: (t) => ({ p: [0.4, 0.4, -6.5], r: [0.08, 0.1, t * 0.035], a: (0.36 + 0.14 * pulse(t, 5)) * clamp((t - T0) / 0.6) * (1 - sm((t - T1 + 0.5) / 0.4)), col: [240, 206, 140] }) }));
    // [texture, speed (u/s, + = leftward), z, y, width, order, tint] — the front band fast and out of focus, the back one slow
    for (const [k, v, z, y, w, ord, col] of [[0, 0.95, 3.5, 2.3, 6.2, 8.6, [255, 255, 255]], [1, -0.35, -1.6, 2.75, 7.5, 0.6, [230, 214, 255]], [2, 0.6, -3.2, -2.35, 8.5, 0.5, [214, 200, 255]], [3, 1.25, 4.1, -2.25, 5.2, 8.7, [255, 250, 240]]]) {
      const span = w * 3;
      for (let i = 0; i < 3; i++) ph.push(plane(KM(k), { w, order: ord + i * 0.001, mode: 9, mat: { kind: 'metal', bevel: 3, shine: 0.9, pearl: 0.15 }, col, at: (t) => {
        const x = ((((i * w - v * (t - T0) + span / 2) % span) + span) % span) - span / 2, a = clamp((t - T0) / 0.5) * (1 - sm((t - T1 + 0.4) / 0.35));
        return { p: [x, y, z], r: [0, 0, 0.02 * Math.sin(t * 0.4 + k)], a }; } }));
    }
    for (let i = 0; i < 36; i++) {
      const x0 = -6 + hash(i * 4.1) * 12, z0 = -2 + hash(i * 6.7) * 6, sp = 0.25 + hash(i * 2.3) * 0.35, ph0 = hash(i * 8.9) * 20, sz = 0.05 + hash(i * 1.1) * 0.07;
      ph.push(plane(flake, { w: sz, h: sz * (hash(i) > 0.7 ? 2.2 : 1), mode: 1, order: z0 > 2.5 ? 8.8 : 0.7, at: (t) => { const y = 3.4 - ((((t - T0) * sp + ph0 * 0.3) % 7) + 7) % 7, sp2 = t * (1.5 + hash(i) * 2) + i;
        return { p: [x0 + 0.3 * Math.sin(t * 0.7 + i), y, z0], r: [sp2, sp2 * 0.7, sp2 * 0.3], a: (0.35 + 0.65 * Math.pow(Math.abs(Math.cos(sp2)), 6)) * clamp((t - T0) / 0.6) * (1 - sm((t - T1 + 0.4) / 0.35)), col: [255, 226, 150] }; } }));
    }
    const NAMES = [['燕の子安貝', '燕子的子安贝'], ['龍の首の珠', '龙颈之珠'], ['火鼠の皮衣', '火鼠裘'], ['蓬莱の玉の枝', '蓬莱玉枝'], ['仏の御石の鉢', '佛前石钵']], NUM = ['壱', '弐', '参', '肆', '伍'];
    for (let k = 0; k < 5; k++) {
      const tk = bar(7 + k) - 0.06, tRev = tk + 0.3, tOff = tk + BEAT * 3 - 0.14, sd = XS[k] > 0 ? -1 : 1, nx = XS[k] + sd * 1.4, [ja, zh] = NAMES[k];   // (the plate is gone before the card flies to its slot)
      // a lacquer 短冊 unrolls down from its top on the reveal; the name's two columns are set on it (Japanese right, Chinese left)
      const PH = [...ja].length * 0.34 * 1.1 + 0.44, top = 1.8;
      ph.push(plane(PT.bodyTex(kit, 'tanzaku', 300, 1100, 0.1), { w: 0.82, h: PH, pivot: [0.5, 0], order: 8.29, mode: 9, mat: { kind: 'acrylic', bevel: 6, shine: 1.0, pearl: 0.25 }, col: [58, 34, 104],
        shadow: { d: 0.05, dx: 0.06, dy: 0.08, a: 0.3, bias: 3 }, at: (t) => { const u = clamp((t - tRev) / 0.22), v = clamp((t - tOff + 0.05) / 0.18); if (u <= 0 || v >= 1) return null; return { p: [nx, top, 2.28], s: [1, outE(u) * (1 - io(v))], r: [0, 0, sd * 0.03] }; } }));
      ph.push(letters(kit, ja, { font: 'DelaGothic', px: 220, size: 0.34, at: [nx - 0.0, top - 0.2, 2.3], dir: [0, -1.08, 0], times: [...ja].map((_, j) => tRev + 0.08 + j * 0.045), enter: 'pop', col: [255, 226, 150], order: 8.3, out: tOff - 0.04, outDur: 0.1, follow: false }));
      ph.push(letters(kit, zh, { font: 'ChillRound', px: 160, size: 0.2, at: [nx - 0.27, top - 0.24, 2.3], dir: [0, -1.15, 0], times: [...zh].map((_, j) => tRev + 0.22 + j * 0.04), enter: 'pop', col: [226, 214, 255], order: 8.31, out: tOff - 0.04, outDur: 0.1, follow: false }));
      ph.push(letters(kit, NUM[k], { font: 'DelaGothic', px: 300, size: 2.6, align: 'center', at: [XS[k] - sd * 0.15, 0.5, 0.6], times: [tRev], enter: 'zoom', stroke: 5, col: [[255, 244, 150], [57, 197, 187], [255, 46, 150], [255, 204, 92], [255, 190, 230]][k], alpha: 0.75, order: 6.5, out: tOff, outDur: 0.2, follow: false }));
    }
    // ghost scripts behind the scroll: 竹取物語 and 二〇二六, vertical, hairline outline, drifting
    ph.push(letters(kit, '竹取物語', { font: 'DelaGothic', px: 300, size: 1.5, at: [-5.6, 3.1, -4], dir: [0, -1.25, 0], times: [T0 + 0.3], enter: 'pop', stroke: 6, col: [236, 206, 140], alpha: 0.55, order: 0.5, drift: [0.06, 0, 0], follow: false, out: T1 - 0.6 }));
    ph.push(letters(kit, '二〇二六', { font: 'DelaGothic', px: 300, size: 1.5, at: [5.6, 3.1, -4], dir: [0, -1.25, 0], times: [T0 + 0.8], enter: 'pop', stroke: 6, col: [214, 196, 255], alpha: 0.55, order: 0.5, drift: [-0.06, 0, 0], follow: false, out: T1 - 0.6 }));
    ph.push(letters(kit, '竹取絵巻 ver.2026 · TSUKUYOMI ARCHIVE · 五つの難題', { font: 'Unbounded', px: 120, size: 0.1, at: [-4.6, 2.5, 0.4], times: [...'竹取絵巻 ver.2026 · TSUKUYOMI ARCHIVE · 五つの難題'].map((_, j) => T0 + 0.4 + j * 0.02), enter: 'type', col: [236, 210, 150], order: 3, out: T1 - 0.5, follow: false }));
    const cam = camTrack([{ t: T0, p: [0, 0.4, 9.5], look: [0, 0.25, 0] }, { t: 15.5, p: [0.7, 0.5, 9.1], look: [0.1, 0.2, 0] }, { t: 20.5, p: [-0.7, 0.3, 9.3], look: [-0.1, 0.15, 0] },
      { t: tLift, p: [0.2, 0.25, 9.0], look: [0, 0.1, 0] }, { t: T1, p: [0, 0, 6.4], look: [0, 0, 0] }]);
    sets.push({ t0: T0, t1: T1, planes: ph, cam: (t) => ({ ...cam(t), fov: 36, focus: 9, dof: 0.3, maxBlur: 8 }), bg: () => ({ top: [20, 14, 50], bot: [40, 26, 80] }), ground: () => ({ kind: 4 }),
      post: (t) => ({ bloom: 0.3, thr: 0.75, ca: 0.0012 * pulse(t, 7), grain: 0.03, vig: 0.3 }) });
  }
  return sets;
}

// ======================================== interlude (bars 41–48, 84.15 → 98.38): ツクヨミ ========================================
// (PLAN-v2 §4 間奏; the user, 2026-11-24: "可以着手全片设计和制作了") — a card flies to the middle and turns face up on the film's dive into
// Tsukuyomi; the camera dives through its window into a TUNNEL of card rings (one ring passes a beat, each turning over as it comes,
// a ring of light with it); 「イェエー」 and 「ヘイベイビー」 light up as neon signs held in the shot (Japanese and Chinese tubes); at the
// tunnel's end the city stands as a wall of cards, each column turning over to the next shot of the film's city and festival a beat
// apart; on the bar-44 dip the camera flies through a ring of 「HEY BABY」; the last shots are the torii on the sea, and the wall
// scoops itself up into the deck for verse 2.
export async function interlude(kit) {
  const LY = await lyrics(), ln = (n) => LY.line(n), L18 = ln(18), L19 = ln(19);
  const T0 = bar(41), T1 = bar(48), ph = [], back = await cardBack(kit), rimT = PT.tileRimTex(kit);
  const tTun = bar(42), V = 10, camZ = (t) => (t < tTun ? lerp(9, 0.6, io(clamp((t - T0 - BEAT * 2) / (tTun - T0 - BEAT * 2)))) : t < bar(44) ? 0.6 - V * (t - tTun) : 0.6 - V * (bar(44) - tTun) - 3.6 * outE(clamp((t - bar(44)) / 2.1)) - 0.25 * Math.max(0, t - bar(45)));
  const cam = (t) => { const z = camZ(t), tun = t > tTun && t < bar(44) + 0.4; return { p: [0.25 * Math.sin(t * 0.9), 0.15 * Math.sin(t * 0.7), z], look: [0, 0, z - 10], roll: tun ? 0.35 * Math.sin((t - tTun) * 0.8) : 0, fov: tun ? 44 : 38, focus: 8, dof: 0.25, maxBlur: 8 }; };
  // ---- the dive card ----
  const DS = 3.1, DW = DS * 0.716, DI = 0.032 * DS, dCrop = ((DW - 2 * DI) / (DS - 2 * DI)) / (16 / 9);
  const dPose = (t) => { if (t > tTun + 0.1) return null; const u = clamp((t - T0) / (BEAT * 1.7)), e = outE(u), f = io(clamp((t - (T0 + BEAT * 2)) / 0.32));
    return { p: [lerp(2.2, 0, e), lerp(-0.8, 0, e), lerp(-18, 0, e)], r: [0, Math.PI * (1 - f) + (1 - e) * 5.5, (1 - e) * 0.7], a: clamp(u * 5) }; };
  const NV0 = new THREE.Vector3(), E0 = new THREE.Euler(), off0 = (st, d) => { NV0.set(0, 0, 1).applyEuler(E0.set(st.r[0], st.r[1], st.r[2], 'YXZ')); return [st.p[0] + NV0.x * d, st.p[1] + NV0.y * d, st.p[2] + NV0.z * d]; };
  ph.push({ tex: back.tex, h: DS, mode: back.mode, card: back.card, order: 6, sharp: true, single: true, at: (t) => { const st = dPose(t); return st && { ...st, r: backEuler(st.r) }; } });
  ph.push({ tex: null, w: DW - 2 * DI, h: DS - 2 * DI, footage: clip('i_dive', T0 + BEAT * 1.6, 1, 34), crop: [(1 - dCrop) / 2, 0, dCrop, 1], order: 6.002, round: DS * 0.075, sharp: true, single: true, at: (t) => { const st = dPose(t); return st && { ...st, p: off0(st, 0.004) }; } });
  ph.push({ tex: rimT, h: DS, mode: 9, mat: { kind: 'metal', bevel: 3, shine: 1.0, pearl: 0.25 }, col: [236, 214, 168], order: 6.004, sharp: true, single: true, at: (t) => { const st = dPose(t); return st && { ...st, p: off0(st, 0.008) }; } });
  ph.push(...burst(kit, T0 + BEAT * 2.2, (t) => [0, 0, -0.3], { size: 7, col: [200, 236, 255], order: 5.9 }));
  // ---- the tunnel: one ring of cards a beat; each card back up until it comes near, then turning over in a wave round its ring ----
  const NAMES = ['KC_wink', 'YC_wave', 'IC_cool', 'KD_peace', 'YD_heart', 'KK_peace', 'YK_twirl', 'KC_heart', 'YD_twirl', 'KD_wave'], RING = PT.ringTex(kit, 'thin', 0.012);
  for (let k = 0; k < 8; k++) {
    const zk = 0.6 - V * BEAT * (k + 1), N = 10, R = 2.5, dir = k % 2 ? 1 : -1;
    for (let j = 0; j < N; j++) {
      ph.push(await cardFace(kit, NAMES[(j + k * 3) % NAMES.length], (t) => {
        if (t < tTun - 0.6 || camZ(t) < zk + 0.4) return null;
        const a = (j / N) * Math.PI * 2 + dir * (t - tTun) * 0.7 + k * 0.3, tNear = tTun + (0.6 - (zk + V * BEAT * 2.2)) / V, f = io(clamp((t - tNear - j * 0.02) / 0.35));
        return { p: [Math.cos(a) * R, Math.sin(a) * R, zk], r: [Math.sin(a) * 0.45, -Math.cos(a) * 0.45 + Math.PI * (1 - f), a - Math.PI / 2], a: clamp((t - tTun + 0.6) / 0.4) };
      }, { size: 1.35, order: 5, shadow: false, walls: 2, layerAt: (t, st) => 5 + st.p[2] * 0.01 }));
    }
    ph.push(sigil(kit, { hollow: true, w: 12.8, order: 4.85, col: k % 2 ? [214, 190, 255] : [255, 214, 140], at: (t) => { if (t < tTun - 0.6 || camZ(t) < zk + 0.3) return null; const near = clamp(1 - (camZ(t) - zk) / (V * BEAT * 3));
      return { p: [0, 0, zk - 0.15], r: [0, 0, (t - tTun) * 0.25 * dir + k], a: (0.3 + 0.55 * near) * clamp((t - tTun + 0.6) / 0.5) }; } }));      // (a magic circle round each ring of cards)
    ph.push(plane(RING, { w: R * 2.6, mode: 1, col: [[255, 110, 182], [70, 238, 255], [255, 226, 120], [190, 150, 255]][k % 4], order: 4.9, sharp: true, at: (t) => { if (t < tTun - 0.6 || camZ(t) < zk + 0.3) return null;
      const near = clamp(1 - (camZ(t) - zk) / (V * BEAT * 2)); return { p: [0, 0, zk - 0.05], r: [0, 0, t * 0.3 * dir], a: 0.25 + 0.6 * near * near + 0.3 * pulse(t, 6) }; } }));
  }
  // ---- the neon signs, held in the shot ----
  const inCam = (d, x, y, rz) => { const F = camFrame(cam, d); return (t) => { const fr = F(t), v = new THREE.Vector3(x, y, 0).applyQuaternion(fr.q), q = fr.q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rz)), e = new THREE.Euler().setFromQuaternion(q, 'YXZ');
    return { p: [fr.pos[0] + v.x, fr.pos[1] + v.y, fr.pos[2] + v.z], r: [e.x, e.y, e.z] }; }; };
  const flick = (t, t0) => { const u = t - t0; return u < 0 ? 0 : u < 0.05 ? 1 : u < 0.09 ? 0.15 : u < 0.13 ? 1 : u < 0.16 ? 0.4 : 1; };
  for (const [L, key, ja, zh, c1, c2, x, y, rz] of [[L18, 'yeah', 'イェエー!', '耶～！', [255, 70, 170], [120, 240, 255], -0.42, 0.22, 0.08], [L19, 'heybaby', 'ヘイベイビー', '嘿，宝贝', [80, 230, 255], [255, 120, 200], 0.4, -0.2, -0.07]]) {
    const t0 = L.t0 - 0.03, t1 = L === L18 ? L19.t0 - 0.08 : bar(44) + 0.1, at = inCam(3.2, x, y, rz);
    ph.push(plane(PT.neonSignTex(kit, key, ja, zh, c1, c2), { w: 1.55, order: 20, sharp: true, at: (t) => { if (t < t0 || t > t1 + 0.2) return null; const st = at(t), v = clamp((t - t1) / 0.2);
      return { ...st, s: 1 + 0.05 * pulse(t, 8) - 0.1 * v, a: flick(t, t0) * (1 - v) }; } }));
  }
  ph.push(await motif(kit, 'sacabambaspis', 87.9, 89.4, (t) => { const u = clamp((t - 87.9) / 1.5); return [lerp(-3.5, 2.5, u), 0.5 - 0.6 * u, camZ(t) - lerp(9, 1.2, u * u)]; }, 2.8, { order: 22, shadow: false, bob: 0 }));
  // (2026-11-24, "这一段卡牌周边可以多放一些萨卡班甲鱼，还有可以用上海蛞蝓") a school of Sacabambaspis swims the tunnel among the rings of cards —
  // spiralling round it at several depths, a few passing close to the lens — and the sea slugs ride on the rings
  for (let k = 0; k < 11; k++) { const z0 = 0.6 - V * BEAT * (0.6 + k * 0.75), a0 = k * 2.1, R0 = 1.3 + 1.6 * hash(k * 3.3), dir = k % 2 ? 1 : -1, size = 0.55 + 0.75 * hash(k * 5.7), tIn = tTun - 0.5 + k * 0.12;
    ph.push(await motif(kit, 'sacabambaspis', tIn, bar(44) + 0.6, (t) => { const a = a0 + dir * (t - tTun) * 0.9, z = z0 + (t - tTun) * 1.8; return [Math.cos(a) * R0, Math.sin(a) * R0 * 0.8, z]; }, size,
      { order: 5.3 + k * 0.01, shadow: false, bob: 0.02, flip: dir > 0, rz: dir * 0.2 })); }
  for (let k = 0; k < 6; k++) { const kr = 1 + k, zk = 0.6 - V * BEAT * (kr + 1), a0 = k * 1.3 + 0.4, dir = kr % 2 ? 1 : -1;
    ph.push(await motif(kit, 'seaslug', tTun - 0.4 + k * 0.15, bar(44) + 0.4, (t) => { const a = a0 + dir * (t - tTun) * 0.7 + kr * 0.3; return [Math.cos(a) * 2.95, Math.sin(a) * 2.95, zk + 0.25]; }, 0.62,
      { order: 5.25 + k * 0.01, shadow: false, bob: 0.05, rz: 0.1 })); }
  // ---- HEY BABY: a ring of letters the camera flies through on the dip ----
  const RS = 'HEY BABY · ヘイベイビー · 嘿宝贝 · ', zR = camZ(bar(44) + 0.9);
  ph.push(letters(kit, RS, { font: 'DelaGothic', px: 180, size: 0.42, layout: 'circle', circle: { r: 1.6, a0: 0, a1: Math.PI * 2 }, at: [0, 0, zR], times: [...RS].map((_, j) => bar(44) - 0.3 + j * 0.015), enter: 'pop', col: [255, 236, 250], order: 21, out: bar(45) + 0.2, outDur: 0.2, follow: false }));
  // ---- the city: a wall of cards at the tunnel's end, each column turning over to the next shot a beat apart ----
  const SLOTS = [['i_city1', 0], ['i_city2', 0], ['i_city3', 0], ['i_city4', 0], ['i_fest1', 0], ['i_fest2', 0], ['i_fest3', 0], ['i_fest3', 30], ['i_city4', 40], ['i_city3', 40], ['i_torii1', 0], ['i_torii2', 0]], slotT = (n) => tTun + n * BEAT * 2;
  const shotOf = (t, i) => clamp(Math.floor((t - tTun - i * 0.06) / (BEAT * 2)), 0, SLOTS.length - 1);
  const srcAt = (i) => (t) => { const n = shotOf(t, i), [nm, sk] = SLOTS[n]; return clip(nm, slotT(n) + i * 0.06, 1, sk)(t) || clip(nm, slotT(n) + i * 0.06 - 2, 1, 0)(t); };
  const zW = camZ(bar(45)) - 8.2;
  ph.push(...tileWall(kit, back, { MCX: 0, MCY: 0, MCZ: zW, deck: () => [0, 0, zW], srcAt: (i) => srcAt(i), t0: tTun, order: 3, fuseAt: fuseWin([[bar(44) + 0.9, T1 - 0.5]]),
    segs: [[tTun - 0.4, T1 + 0.02, 'y', (i, j) => Math.abs(i - 2) * 0.05 + j * 0.03, 'down']],
    extra: (t, i) => { const n = shotOf(t, i); if (n === 0) return null; const u = (t - slotT(n) - i * 0.06) / 0.3; return u > 0 && u < 1 ? [0, Math.PI * 2 * io(u), 0] : null; } }));
  ph.push(...burst(kit, slotT(10), () => [0, 0, zW - 0.6], { size: 6.5, col: [255, 214, 200], order: 2.5 }));
  ph.push(sigil(kit, { w: 17, order: 2.4, col: [255, 214, 150], at: (t) => (t < tTun - 0.3 ? null : { p: [0, 0, zW - 1.6], r: [0, 0, t * 0.05], a: 0.55 * clamp((t - tTun + 0.3) / 0.8) }) }),
    sigil(kit, { w: 11, order: 2.45, col: [214, 190, 255], pearl: 0.4, at: (t) => (t < tTun ? null : { p: [0, 0, zW - 1.0], r: [0, 0, -t * 0.08], a: 0.5 * clamp((t - tTun) / 0.8) }) }));      // (the circles behind the city at the tunnel's end)      // (behind the wall: the torii's light round its edges)
  return [{ t0: T0, t1: T1, planes: ph, cam, bg: () => ({ top: [16, 10, 40], bot: [30, 16, 60] }), ground: () => ({ kind: 4 }),
    post: (t) => ({ bloom: 0.32, thr: 0.8, ca: 0.0018 * pulse(t, 7), grain: 0.03, vig: 0.34, glitch: t < T0 + 0.05 ? 0.5 : 0 }) }];
}

// the singers' creatures (the user, 2026-11-24: "很关键的bonus素材：代表彩叶的狐狸还有keyboard（电钢琴），八千代的海蛞蝓和章鱼还有坐骑萨卡班甲鱼，辉夜的兔子") —
// NovelAI stickers (materials/nai/m_*.png): Kaguya — the moon rabbit, InuDOGE (her digital pet); Yachiyo — the sea slug, the octopus,
// FUSHI, her mount the Sacabambaspis; Iroha — the fox, the keyboard; and the film's pancakes. A sticker pops in with a hop, breathes on the
// beat and pops out; at: [x, y, z] or (t) → [x, y, z].
const MOTIF = {};
async function motif(kit, n, t0, t1, at, size, o = {}) {      // (2026-11-24, "各个creature也要记得优化": a squash-and-stretch hop, a pop of pixel sparkles, a bounce on the beat)
  const tex = MOTIF[n] || (MOTIF[n] = await kit.img(`materials/nai/m_${n}.png`)), P0 = (t) => (typeof at === 'function' ? at(t) : at);
  const out = [plane(tex, { w: size, order: o.order ?? 20, sharp: true, shadow: o.shadow === false ? null : { d: 0.05, dx: 0.07, dy: 0.1, a: 0.22, bias: 3 },
    at: (t) => { const pp = popAt(t, t0, t1, 0); if (!pp) return null; const u = t - t0, hk = Math.min(u / 0.42, 1), hop = Math.sin(hk * Math.PI) * 0.24 * size, p = P0(t);
      const sq = u < 0.5 ? Math.sin(hk * Math.PI * 2) * 0.12 * (1 - hk) : 0, bt = 0.045 * pulse(t, 7);      // (stretch on the way up, squash on landing; a bounce each beat)
      const r0 = o.rAt ? o.rAt(t) : [0, o.flip ? Math.PI : 0, 0];      // (o.rAt: held in the lens, it turns with the camera)
      return { p: [p[0], p[1] + hop + (o.bob ?? 0.04) * size * Math.sin(t * 2.2 + p[0]) + bt * size * 0.5, p[2]], r: [r0[0], r0[1], r0[2] + (o.rz ?? 0) + 0.05 * Math.sin(t * 1.7 + p[1])], ...pp, s: [pp.s * (1 - sq + bt * 0.4), pp.s * (1 + sq + bt)] }; } })];
  ['star', 'heart', 'note', 'star', 'heart'].forEach((ic, k) => { const ang = (k / 5) * Math.PI * 2 + 0.4;
    out.push(plane(PT.pixTex(kit, ic), { w: size * 0.16, order: (o.order ?? 20) + 0.01, sharp: true, at: (t) => { const u = (t - t0 - 0.05) / 0.6; if (u < 0 || u > 1) return null; const p = P0(t);
      return { p: [p[0] + Math.cos(ang) * size * 0.75 * outE(u), p[1] + Math.sin(ang) * size * 0.6 * outE(u) + size * 0.15, p[2] + 0.05], s: 1 + 0.3 * (1 - u), a: 1 - sm((u - 0.55) / 0.45) }; } })); });
  return out;
}

// ---- 立绘: a full-body NovelAI figure standing in the world, dressed with its accents (the user, 2026-11-24: "立绘用nai做完整的（要完整展现全身，
// 头发）…各种服饰各种动作" + "立绘的点缀素材也别忘了") ----
// figure(kit, file, o): feet at o.at ([x,y,z] or fn of t), height o.h, yaw o.ry (+ o.ryAt(t)); pops in on o.t0 (uniform — never squashed),
// drops out on o.t1. Behind it a misregistered print of its silhouette in its singer's colour; round it, its accents in front of and behind
// it (doodles that boil on twos, pixel icons, sparkles, bubbles — a set per singer), each popping in on its half-beat; beside it, its creature.
const FIGCOL = { K: [255, 150, 90], Y: [120, 220, 255], I: [190, 130, 255] };
// [kind, sub, x (× half-width), y (× height), z, size (× height), colour]
const FIGACC = {
  K: [['doodle', 'halo', 0, 1.03, 0.06, 0.4, [255, 214, 120]], ['pix', 'heart', -0.62, 0.78, 0.25, 0.1], ['spark', null, 0.58, 0.9, -0.2, 0.22, [255, 236, 170]], ['doodle', 'moon', 0.66, 0.55, 0.2, 0.2, [255, 200, 120]], ['pix', 'star', -0.55, 0.32, -0.25, 0.09], ['doodle', 'heart', -0.7, 0.6, -0.15, 0.16, [255, 120, 180]]],
  Y: [['doodle', 'swirl', 0.62, 0.86, -0.2, 0.24, [140, 230, 255]], ['bokeh', null, -0.62, 0.75, 0.25, 0.12, [190, 240, 255]], ['bokeh', null, -0.52, 0.45, -0.2, 0.08, [220, 200, 255]], ['pix', 'note', 0.64, 0.48, 0.25, 0.09], ['spark', null, -0.4, 1.0, 0.1, 0.2, [200, 240, 255]], ['doodle', 'stars', 0.52, 0.2, 0.3, 0.18, [170, 220, 255]]],
  I: [['doodle', 'stars', -0.62, 0.9, 0.15, 0.24, [200, 160, 255]], ['pix', 'note', 0.62, 0.78, 0.25, 0.1], ['spark', null, 0.5, 1.0, -0.2, 0.2, [230, 200, 255]], ['doodle', 'speed', 0.66, 0.5, -0.1, 0.22, [255, 170, 110]], ['pix', 'star', -0.6, 0.4, 0.25, 0.09], ['doodle', 'loop', -0.66, 0.62, -0.25, 0.2, [190, 130, 255]]],
};
const FIGMOTIF = { K: 'rabbit', Y: 'octopus', I: 'fox' };
const toW = (p, ry, lx, ly, lz) => [p[0] + Math.cos(ry) * lx + Math.sin(ry) * lz, p[1] + ly, p[2] - Math.sin(ry) * lx + Math.cos(ry) * lz];
async function figure(kit, file, o) {
  const tex = await kit.img(`materials/nai/cut/${file}.png`); if (!tex) return [];
  const who = file[1], col = o.col || FIGCOL[who], h = o.h, w = h * tex.userData.w / tex.userData.h, order = o.order ?? 10, fx = o.flip ? -1 : 1;
  const P = (t) => (typeof o.at === 'function' ? o.at(t) : o.at), RY = (t) => (o.ry ?? 0) + (o.ryAt ? o.ryAt(t) : 0);
  const life = (t) => { if (t < o.t0 || (o.t1 != null && t > o.t1 + 0.3)) return null; const u = (t - o.t0) / 0.26, v = o.t1 != null ? clamp((t - o.t1) / 0.3) : 0;
    return { s: u < 1 ? 0.84 + 0.16 * spring(clamp(u) * 1.3) : 1, a: clamp(u * 3) * (1 - sm(v)), drop: v * v * h * 0.6 }; };
  const out = [];
  if (o.floor) out.push(plane(PT.glowTex(kit), { w: w * 1.1, mode: 1, col: [10, 4, 24], order: order - 0.06, at: (t) => { const L = life(t); if (!L) return null; const p = P(t);
    return { p: [p[0], p[1] + 0.01, p[2]], r: [-Math.PI / 2, 0, 0], s: [L.s, 0.32 * L.s], a: 0.55 * L.a }; } }));      // (a contact shadow: she stands on the floor)
  out.push(plane(tex, { h, pivot: [0.5, 1], mode: 1, col, order: order - 0.03, at: (t) => { const L = life(t); if (!L) return null; const p = P(t), ry = RY(t);
    return { p: toW(p, ry, 0.045 * h, -L.drop - 0.018 * h, -0.07), r: [0, ry, o.rz ?? 0], s: [L.s * fx, L.s], a: L.a * (o.printA ?? 0.8) }; } }));
  out.push(plane(tex, { h, pivot: [0.5, 1], order, sharp: true, shadow: o.shadow === false ? null : { d: 0.05, dx: 0.06, dy: 0.08, a: 0.25, bias: 3 }, at: (t) => { const L = life(t); if (!L) return null; const p = P(t), ry = RY(t);
    return { p: [p[0], p[1] - L.drop + 0.012 * h * pulse(t, 7), p[2]], r: [0, ry, o.rz ?? 0], s: [L.s * fx, L.s], a: L.a }; } }));
  (o.acc || FIGACC[who]).forEach(([kind, sub, lx, ly, lz, sz, c2], k) => {
    const ta = o.t0 + 0.12 + (k * BEAT) / 2, size = sz * h, wide = kind === 'doodle' && (sub === 'halo' || sub === 'arrow') ? 2 : 1;
    const tx = kind === 'doodle' ? [PT.doodleTex(kit, sub, 0), PT.doodleTex(kit, sub, 1)] : kind === 'pix' ? [PT.pixTex(kit, sub)] : kind === 'spark' ? [PT.sparkTex(kit)] : [PT.bokehTex(kit)];
    out.push(plane(tx[0], { w: size * wide, mode: kind === 'pix' ? 0 : 1, col: c2 || WHITE, order: order + (lz > 0 ? 0.05 : -0.05) + k * 0.001, sharp: true, at: (t) => {
      const L = life(t); if (!L || t < ta) return null; const u = (t - ta) / 0.22, p = P(t), ry = RY(t), tw = Math.floor(t * 12) >> 1;      // (on twos: 12 drawings a second, each held two frames)
      return { p: toW(p, ry, lx * w * 0.575 * fx, ly * h - L.drop + 0.03 * h * Math.sin(t * 2.1 + k), lz), r: [0, ry, (kind === 'doodle' ? 0.02 : 0.08) * (tw % 2 ? 1 : -1) + (sub === 'halo' ? -0.06 * fx : 0)],
        s: (u < 1 ? outE(clamp(u)) * (1 + 0.25 * (1 - u)) : 1) * (1 + 0.06 * pulse(t, 7)), a: L.a * clamp(u * 3) * (kind === 'bokeh' ? 0.7 : 1), tex: tx[tw % tx.length] }; } }));
  });
  if (o.motif !== false) { const side = o.motifSide ?? fx;
    out.push(...(await motif(kit, o.motif || FIGMOTIF[who], o.t0 + BEAT, o.t1 ?? 1e9, (t) => { const L = life(t); return toW(P(t), RY(t), side * w * 0.66, 0.04 * h - (L ? L.drop : 0), 0.35); }, h * 0.28, { order: order + 0.08 }))); }
  return out;
}

// ---- the WARNING tape (2026-11-24, "这条警戒线可以拉长一点，现在有些戛然而止，然后可以设计补充一些动效"): a tape long enough to run off both sides of
// any frame, its stripes marching; a second tape crossing behind it the other way a beat later; the ⚠ WARNING chip flashing on the
// beats; a siren glow pulsing behind; the line popping in syllable by syllable over it, its Chinese under it. base(t) → { p, rz, ry }
// (where the tape crosses), o.move(t) → an extra offset for everything (the bridge's glide); in on L.t0, out on o.out.
function warnBand(kit, L, zh, base, o) {
  const out = [], t0 = L.t0 - 0.08, t1 = o.out, W = o.w ?? 24, H = o.h ?? 0.78, ord = o.order ?? 14, mv = o.move || (() => [0, 0, 0]);
  const slide = (t, from, d0) => { const u = clamp((t - t0 - d0) / 0.3), v = clamp((t - t1 + 0.25) / 0.25); return from * ((1 - (1 - Math.exp(-6 * u) * Math.cos(5 * u))) + io(v)); };
  const place = (t, lx, ly, lz, extraRz = 0) => { const b = base(t), m = mv(t), rz = (b.rz ?? 0) + extraRz, ry = b.ry ?? 0, c = Math.cos(rz), sn = Math.sin(rz);
    const x = lx * c - ly * sn, y = lx * sn + ly * c; return { p: [b.p[0] + m[0] + x * Math.cos(ry) + lz * Math.sin(ry), b.p[1] + m[1] + y, b.p[2] + m[2] - x * Math.sin(ry) + lz * Math.cos(ry)], r: [0, ry, rz] }; };
  const on = (t) => t >= t0 && t <= t1 + 0.05;
  // the siren glow
  out.push(plane(PT.glowTex(kit), { w: 9, mode: 1, col: [255, 50, 100], order: ord - 0.2, at: (t) => { if (!on(t)) return null; return { ...place(t, 0, 0, -0.3), s: [1.6, 0.5], a: (0.25 + 0.35 * pulse(t, 6)) * clamp((t - t0) / 0.2) * (1 - clamp((t - t1 + 0.2) / 0.2)) }; } }));
  // the crossing tape behind, the other way, a beat later
  out.push(plane(PT.hazardTex(kit, [255, 214, 90], [40, 16, 0]), { w: W, h: H * 0.8, order: ord - 0.1, sharp: true, at: (t) => { if (!on(t) || t < t0 + BEAT * 0.5) return null; const dx = slide(t, -W, BEAT * 0.5);
    return { ...place(t, dx, -0.05, -0.15, -0.16), crop: [((t * 0.11) % 0.5 + 0.5) % 0.5, 0, 0.5, 1], a: 0.85 }; } }));
  // the main tape, marching
  out.push(plane(PT.hazardTex(kit), { w: W, h: H, order: ord, sharp: true, at: (t) => { if (!on(t)) return null; const dx = slide(t, W, 0);
    return { ...place(t, dx, 0, 0, 0.02 * Math.sin(t * 2.2)), crop: [0.5 - ((t * 0.08) % 0.5), 0, 0.5, 1], s: [1, 1 + 0.06 * pulse(t, 8)] }; } }));
  // the chip, flashing on the beats
  out.push(plane(PT.warnChipTex(kit), { w: 1.6, order: ord + 0.3, sharp: true, at: (t) => { if (!on(t) || t < t0 + 0.2) return null; const fl = ((t - L.t0) / (BEAT / 2)) % 2 < 1.3 ? 1 : 0.35;
    return { ...place(t, -(o.chipX ?? 3.4) + slide(t, W, 0), 0.02, 0.05), a: fl, s: 1 + 0.08 * pulse(t, 9) }; } }));
  // the line, syllable by syllable, and its Chinese
  const jp = deco(kit, L.text, { font: 'DelaGothic', px: 220, size: o.size ?? 0.36, align: 'center', at: [0, H * 0.1, 0], times: L.times, enter: 'pop', col: WHITE, ink: [255, 50, 100], strokeK: 0.14, order: ord + 0.4, out: t1 - 0.1, follow: false });
  const zt = letters(kit, zh, { font: 'ChillRound', px: 140, size: (o.size ?? 0.36) * 0.42, align: 'center', at: [0, -H * 0.27, 0], times: L.zhTimes(zh, { lag: 0.1 }), enter: 'pop', col: [255, 210, 225], order: ord + 0.41, out: t1 - 0.1, follow: false });
  for (const P of [jp, zt].flat()) { const at0 = P.at; out.push({ ...P, at: (t) => { const st = at0(t); if (!st) return null; const pl = place(t, st.p[0] + (o.textX ?? 0.6), st.p[1], st.p[2] + 0.06);
    return { ...st, p: pl.p, r: [st.r?.[0] ?? 0, pl.r[1] + (st.r?.[1] ?? 0), pl.r[2] + (st.r?.[2] ?? 0)] }; } }); }
  return out;
}

// ======================================== the rest of the film (bar 48, 98.38 → 226.03) ========================================
// (the user, 2026-11-24: "可以做全片了" · "可以加一些gaming visual elements…精致，有质感和观赏性" · "加一点8bit风格" · "原片中八千代初见的live我也很喜欢，
// 可以安排一些片段剪辑进去") PLAN-v2 §4 in the sample's language. Shared pieces first.
const clipC = (name, t0, speed = 1, skip = 0) => (t) => { const [f0, n] = CLIPS[name]; const k = Math.max(f0, Math.min(f0 + n - 1, f0 + skip + Math.floor((t - t0) * FR * speed))); return `materials/frames/${name}/${pad(k)}.jpg`; };   // (holds its last frame)
const seqSrc = (list) => (t) => { let cur = list[0]; for (const e of list) if (t >= e[0]) cur = e; return clipC(cur[1], cur[0], cur[3] ?? 1, cur[2] ?? 0)(t); };   // [[t0, clip, skip?, speed?], …]
const inCamAt = (cam, d, x, y, rz = 0) => { const F = camFrame(cam, d), V = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1), QZ = new THREE.Quaternion(), E = new THREE.Euler();
  return (t) => { const fr = F(t); V.set(x, y, 0).applyQuaternion(fr.q); QZ.setFromAxisAngle(Z, rz); E.setFromQuaternion(fr.q.clone().multiply(QZ), 'YXZ'); return { p: [fr.pos[0] + V.x, fr.pos[1] + V.y, fr.pos[2] + V.z], r: [E.x, E.y, E.z] }; }; };
// a game piece's life: a fast scale-in with a hair of overshoot, a hold that breathes on the beat, a quick shrink out
const popAt = (t, t0, t1, breath = 0.02) => { if (t < t0 || t > t1 + 0.18) return null; const u = (t - t0) / 0.22, v = clamp((t - t1) / 0.18), e = u >= 1 ? 1 : 1 - Math.exp(-6 * u) * Math.cos(5 * u);
  return { s: Math.max(0.001, e * (1 - 0.6 * io(v)) * (1 + breath * pulse(t, 6))), a: clamp(u * 4) * (1 - v) }; };
// a rounded viewfinder: the footage (its screen layer comes with `round`) and a metal frame with the same corners (PT.holoFrameTex: 168 px at 1920)
function finder(kit, src, o) {
  const w = o.w, h = o.h ?? w * 9 / 16, frame = PT.holoFrameTex(kit), crop = o.crop || (h / w > 9 / 16 ? [(1 - (w / h) / (16 / 9)) / 2, 0, (w / h) / (16 / 9), 1] : undefined);
  return [plane(null, { w, h, footage: src, crop, order: o.order ?? 3, round: o.round ?? (168 / 1920) * w * 1.035, crt: o.crt, col: o.col, at: o.at }),
    plane(frame, { w: w * 1.035, h: h * 1.06, order: (o.order ?? 3) + 0.012, mode: 9, mat: { kind: 'metal', bevel: 4, shine: 1.0, pearl: 0.15 }, col: o.frameCol || [236, 214, 168], at: (t) => { const st = o.at(t); return st && { ...st, p: [st.p[0], st.p[1], st.p[2] + 0.01] }; } })];
}
// judgments on hits (rhythm-game style): a word pops and rises; a pixel icon and a +100 fly off; base(t) → { p, r } (camera-held or world)
function judges(kit, hits, base, o = {}) {
  const words = o.words || ['PERFECT', 'PERFECT', 'GREAT', 'PERFECT'], icons = ['heart', 'star', 'coin', 'note'], out = [];
  hits.forEach((tb, i) => { const w = words[i % words.length], tex = PT.judgeTex(kit, w, w === 'GREAT' ? [120, 220, 255] : [255, 120, 210], w === 'GREAT' ? [190, 150, 255] : [255, 236, 140], 150), dx = (hash(i * 3.7) - 0.5) * (o.spread ?? 0.4);
    out.push(plane(tex, { w: o.w ?? 0.95, order: o.order ?? 40, sharp: true, at: (t) => { const u = (t - tb) / 0.6; if (u < 0 || u > 1) return null; const b = base(t);
      return { ...b, p: [b.p[0] + dx, b.p[1] + u * 0.12, b.p[2]], s: u < 0.12 ? 0.5 + 0.6 * outE(u / 0.12) : 1.1 - 0.1 * u, a: 1 - sm((u - 0.65) / 0.35) }; } }));
    out.push(plane(PT.pixTex(kit, icons[i % icons.length]), { w: (o.w ?? 0.95) * 0.22, order: (o.order ?? 40) + 0.01, sharp: true, at: (t) => { const u = (t - tb) / 0.7; if (u < 0 || u > 1) return null; const b = base(t);
      return { ...b, p: [b.p[0] + dx + 0.42 * (o.w ?? 0.95) + u * 0.18, b.p[1] + 0.05 + u * 0.3 - u * u * 0.15, b.p[2] + 0.01], s: 1 + 0.2 * (1 - u), a: 1 - sm((u - 0.6) / 0.4) }; } }));
  });
  return out;
}
// ---- the second half's collage backbone (the user, 2026-11-24: "后半段的设计明显没前半段的有观赏性和设计感") — what the first half has and the
// second half lacked: structure (moon dials at two depths), light (rays held open), a support family (an orbit of living card backs), a ghost
// word far back, air (glitter out of focus near the lens), rings sent out on the downbeats. o: { t0, t1, c, dialCol, dialCol2, raysCol,
// orbit: { R, n, tilt, front }, ghost, ghostCol, air, airCol, rings, ringCol }
// a magic circle (the user, 2026-11-24: "这种法阵我超喜欢！可以多用一些，例如用到卡片隧道的段落以及一些比较空的段落里"): the moon dial (PT.dialTex) in
// metal; o.hollow leaves its heart open, a ring the camera flies through. o.at(t) → { p, r, s, a } or null
const sigil = (kit, o) => plane(PT.dialTex(kit, !!o.hollow), { w: o.w, order: o.order ?? 0.5, mode: 9, mat: { kind: 'metal', bevel: 2, shine: 1, pearl: o.pearl ?? 0.22 }, at: (t) => { const st = o.at(t); return st && { col: o.col, ...st }; } });
async function backbone(kit, o) {
  const ph = [], c = o.c || [0, 0, 0], lit = (t) => clamp((t - o.t0) / 0.6) * (1 - sm((t - o.t1 + 0.4) / 0.4));
  const dial = PT.dialTex(kit), glow = PT.bokehTex(kit), spark = PT.sparkTex(kit), ring = PT.ringTex(kit, 'thin', 0.012);
  ph.push(plane(dial, { w: 13, order: 0.4, mode: 9, mat: { kind: 'metal', bevel: 2, shine: 1, pearl: 0.15 }, at: (t) => { const a = lit(t) * (0.3 + 0.14 * pulse(t, 5)); return a < 0.01 ? null : { p: [c[0] + 0.4, c[1], c[2] - 5], r: [0.16, -0.22, t * 0.04], a, col: o.dialCol || [240, 206, 140] }; } }));
  ph.push(plane(dial, { w: 7.4, order: 0.45, mode: 9, mat: { kind: 'metal', bevel: 2, shine: 1, pearl: 0.3 }, at: (t) => { const a = lit(t) * (0.38 + 0.2 * pulse(t, 6)); return a < 0.01 ? null : { p: [c[0], c[1], c[2] - 2.8], r: [0.1, -0.15, 0.5 - t * 0.08], a, col: o.dialCol2 || [214, 196, 255] }; } }));
  if (o.rays !== false) ph.push(plane(PT.blockTex(kit), { w: 12, mode: 11, order: 0.5, sharp: true, at: (t) => { const a = lit(t) * (0.22 + 0.3 * pulse(t, 5)); return a < 0.01 ? null : { p: [c[0], c[1], c[2] - 2.0], r: [0, 0, t * 0.08], a, col: o.raysCol || [255, 226, 250], u: 0.6, seed: 0.2 }; } }));
  if (o.ghost) ph.push(letters(kit, o.ghost, { font: 'DelaGothic', px: 400, size: 3.4, align: 'center', at: [c[0] + 1.8, c[1] + 0.5, c[2] - 6.5], times: [o.t0 + 0.2], enter: 'pop', stroke: 5, col: o.ghostCol || [214, 196, 255], alpha: 0.26, order: 0.35, drift: [-0.05, 0, 0], out: o.t1, follow: false }));
  if (o.orbit) { const { R = 3.4, n = 10, tilt = 0.7, front = 8, y = 0 } = o.orbit;
    for (let j = 0; j < n; j++) ph.push(await cardFace(kit, null, (t) => { if (t < o.t0 || t > o.t1) return null; const u = clamp((t - o.t0 - j * 0.04) / 0.6), th = (j / n) * Math.PI * 2 + (t - o.t0) * 0.45, x = Math.cos(th) * R * outE(u), z = Math.sin(th) * R * outE(u);
      return { p: [c[0] + x, c[1] + y - z * tilt * 0.55, c[2] + z * 0.55 - 1.2], r: [0.12, Math.atan2(Math.cos(th), Math.sin(th)) * 0.55, 0.12], s: 0.8, a: clamp(u * 5) * (1 - sm((t - o.t1 + 0.4) / 0.4)) }; },
      { size: 0.95, order: 1.0, shadow: false, walls: 2, layerAt: (t, st) => (st.p[2] > c[2] - 1.2 ? front : 0.9) + j * 0.03 })); }
  for (let i = 0; i < (o.air ?? 16); i++) { const x0 = c[0] - 4.5 + hash(i * 3.7) * 9, y0 = c[1] - 2.4 + hash(i * 5.3) * 4.8, z0 = c[2] + 3 + hash(i * 9.1) * 2.6, big = hash(i * 2.2) > 0.6, t0 = hash(i * 1.9) * 3;
    const col = (o.airCol || [[255, 226, 160], [214, 196, 255], [176, 242, 226], [255, 190, 230]])[i % 4];
    ph.push(plane(big ? glow : spark, { w: big ? 0.28 : 0.24, mode: 1, order: 60 + i * 0.001, at: (t) => { const a = lit(t) * (big ? 0.5 : 1) * (0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(t * (1.2 + hash(i) * 2) + i * 4), 3)); if (a < 0.02) return null;
      return { p: [x0 + 0.08 * Math.sin(t * 0.3 + i), y0 + (t - t0) * 0.06, z0], r: [0, 0, t * 0.4 * (i % 2 ? 1 : -1)], s: 1 + 0.4 * pulse(t, 6), a, col }; } })); }
  if (o.rings !== false) for (let k = Math.ceil((o.t0 - 0.7579) / (BEAT * 4)); bar(k) < o.t1 - 0.5; k++) { const tb = bar(k);
    ph.push(plane(ring, { w: 1, mode: 1, col: o.ringCol || [255, 236, 250], order: 0.6, sharp: true, at: (t) => { const u = (t - tb) / 1.4; if (u < 0 || u > 1) return null; return { p: [c[0], c[1], c[2] - 1.0], s: lerp(2.5, 12, outE(u)), a: (1 - u) * 0.6 * lit(t) }; } })); }
  return ph;
}
// the camera made to travel (the first half's language): a slow orbit round its target, a gentle bob, a push on each downbeat
const travel = (cam, amp = 0.16) => (t) => { const c = cam(t), dx = c.p[0] - c.look[0], dz = c.p[2] - c.look[2], a = amp * Math.sin(t * 0.31) + 0.05 * Math.sin(t * 0.83), k = 1 - 0.03 * pulse(t, 6, 4);
  return { ...c, p: [c.look[0] + (dx * Math.cos(a) - dz * Math.sin(a)) * k, c.p[1] + 0.1 * Math.sin(t * 0.47), c.look[2] + (dx * Math.sin(a) + dz * Math.cos(a)) * k] }; };
// virtuoso cardistry (the user: "卡牌的花切设计要做的更精致和炫技"):
// a RIBBON SPREAD across a table that turns over in a domino wave (back → face), turns back the other way, and is swept up into the deck
async function ribbon(kit, names, tIn, tFlip, tBack, tOut, o = {}) {
  const n = names.length, span = o.span ?? 9, c = o.c || [0, -0.3, 1.2], ph = [];
  for (let i = 0; i < n; i++) { const xi = c[0] - span / 2 + (i + 0.5) * span / n, arcz = -Math.pow((i - (n - 1) / 2) / Math.max(1, (n - 1) / 2), 2) * (o.curve ?? 0.8);
    ph.push(await cardFace(kit, names[i], (t) => { if (t < tIn || t > tOut + 0.7) return null;
      const e = outE(clamp((t - tIn - i * 0.018) / 0.45)), f1 = io(clamp((t - tFlip - i * 0.035) / 0.28)), f2 = tBack ? io(clamp((t - tBack - (n - 1 - i) * 0.035) / 0.28)) : 0, v = clamp((t - tOut - i * 0.014) / 0.45);
      const x = lerp(lerp(c[0] - span / 2, xi, e), c[0] + span / 2 + 0.8, io(v)), lift = Math.sin(f1 * Math.PI) * 0.35 + Math.sin(f2 * Math.PI) * 0.35;
      return { p: [x, c[1] + lift, c[2] + arcz + lift * 0.4], r: [-0.5, Math.PI * (1 - f1) + Math.PI * f2, 0], a: clamp((t - tIn - i * 0.018) * 12) * (1 - sm((v - 0.7) / 0.3)) }; },
      { size: o.size ?? 1.5, order: (o.order ?? 12) + i * 0.031, shadow: false, walls: 2, bank: false })); }
  return ph;
}
// cards THROWN spinning across the frame, each with a streak of light behind it; list: [[t0, name | null, from, to], …]
async function throws(kit, list, o = {}) {
  const ph = [], glow = PT.glowTex(kit), dur = o.dur ?? 0.55;
  for (const [k, [t0, n, from, to]] of list.entries()) { const pos = (t) => { const u = clamp((t - t0) / dur); return [lerp(from[0], to[0], u), lerp(from[1], to[1], u) + Math.sin(u * Math.PI) * (o.arc ?? 0.7), lerp(from[2], to[2], u)]; };
    ph.push(await cardFace(kit, n, (t) => { const u = (t - t0) / dur; if (u < 0 || u > 1) return null; return { p: pos(t), r: [0.3 * Math.sin(u * 6), u * 2.0, -(t - t0) * 16], a: 1 - sm((u - 0.85) / 0.15) }; }, { size: o.size ?? 1.1, order: (o.order ?? 20) + k * 0.03, shadow: false, walls: 2, bank: false }));
    ph.push(plane(glow, { w: 1, mode: 1, col: o.trail || [255, 214, 250], order: (o.order ?? 20) - 0.01 + k * 0.03, sharp: true, at: (t) => { const u = (t - t0) / dur; if (u < 0.05 || u > 1) return null; const a = pos(t), b = pos(t - 0.09), dx = a[0] - b[0], dy = a[1] - b[1], L = Math.hypot(dx, dy);
      return { p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 - 0.05], r: [0, 0, Math.atan2(dy, dx)], s: [Math.max(0.3, L * 1.8), 0.2], a: 0.75 * (1 - u) }; } })); }
  return ph;
}
// a 360° FAN WHEEL: the cards open from a stack into a full circle of petals, the wheel turning, breathing on the beat, then closing
async function fanWheel(kit, names, t0, t1, c, o = {}) {
  const n = names.length, R = o.R ?? 1.5, ph = [];
  for (let i = 0; i < n; i++) ph.push(await cardFace(kit, names[i], (t) => { if (t < t0 || t > t1 + 0.45) return null; const u = io(clamp((t - t0) / 0.7)), v = io(clamp((t - t1) / 0.4));
    const a = (i / n) * Math.PI * 2 * u * (1 - v) + (t - t0) * (o.spin ?? 0.9), rr = R * (0.25 + 0.75 * u) * (1 - v) * (1 + 0.05 * pulse(t, 7));
    return { p: [c[0] + Math.sin(a) * rr, c[1] + Math.cos(a) * rr, c[2] + i * 0.002], r: [0, 0, -a], a: clamp((t - t0) * 6) * (1 - v * 0.5) }; }, { size: o.size ?? 1.3, order: (o.order ?? 10) + i * 0.031, shadow: false, walls: 2, bank: false }));
  return ph;
}
const CHARS = ['KC_wink', 'YC_wave', 'KD_peace', 'YD_heart', 'KK_peace', 'YK_twirl', 'KC_heart', 'YD_kiss', 'KD_heart', 'YC_kiss', 'KD_jump', 'YD_twirl', 'IC_cool', 'KK_jump'];
const NAMES_C2 = ['KC_wink', 'YC_wave', 'IC_cool', 'KD_peace', 'YD_heart', 'KK_peace', 'YK_twirl'];
export async function film2(kit) {
  const LY = await lyrics(), ln = (n) => LY.line(n), sets = [], back = await cardBack(kit), part = (L, s, d = 0) => ((L.part(s) || { times: [L.t0 + d] }).times[0]);
  const lyric = (L, o) => glossLine(kit, L, { mode: 'under', font: 'DelaGothic', px: 180, size: 0.46, maxW: 6.4, enter: 'pop', col: WHITE, ink: [40, 20, 70], strokeK: 0.18, chip: [52, 36, 96], chipInk: WHITE, zhSize: 0.2, order: 30, ...o });

  // ---------------------------------------- verse 2: THE RUNWAY — KAGUYA COLLECTION 2030 (其の三「火鼠の皮衣」, acid chrome; PLAN-v3) ----------------------------------------
  // A fashion-week runway in depth: a neon grid floor running to a stage at the far end, a LOOK on each line — a full-body figure in a new
  // outfit standing in front of her poster (footage of her as a model, framed), its hang tag swinging; the line stands in the corridor and
  // the camera dollies through it; lamps chase down the ceiling; the house of cards grows on the stage and is knocked at the lens.
  {
    const T0 = bar(48), T1 = 115.2, ph = [], [L20, L21, L22, L23, L24, L25, L26, L27, L28] = [20, 21, 22, 23, 24, 25, 26, 27, 28].map(ln), FL = -2.45;
    const tFreeze = part(L22, '聞いてる', 2.0), tResume = L23.t0;
    const camB = camTrack([{ t: T0 - 0.02, p: [0, 0.7, 14.5], look: [0, 0, 4] }, { t: L20.t0 + 0.3, p: [0.25, 0.4, 12.4], look: [-1.3, 0.1, 5.2] }, { t: L21.t0, p: [0.35, 0.25, 8.8], look: [1.7, 0.2, 0.3] },
      { t: L22.t0, p: [-0.25, 0.3, 4.9], look: [-1.7, 0.2, -4.6] }, { t: tFreeze, p: [-0.35, 0.3, 3.0], look: [-1.5, 0.25, -4.6] }, { t: L23.t0, p: [-0.35, 0.3, 2.7], look: [-1.2, 0.25, -4.6] },
      { t: L24.t0 + 0.1, p: [0.15, 0.2, 0.6], look: [1.8, 0, -9.6] }, { t: L25.t0, p: [0.25, 0.05, -4.2], look: [-1.8, 0.1, -13.6] }, { t: L26.t0, p: [0, 0.2, -7.2], look: [0, 0.9, -20] },
      { t: L27.t0, p: [0, 0.15, -9.6], look: [0, 0.4, -19] }, { t: L27.t0 + 0.6, p: [0.2, -1.75, -12.6], look: [0, 0.95, -19] }, { t: L28.t0, p: [0.4, -1.5, -13.3], look: [0.4, 0.6, -19] }, { t: T1, p: [0.7, -0.9, -11.2], look: [0.8, 0.2, -18] }]);
    const cam = travel(camB, 0.05), camZ = (t) => camB(t).p[2];
    // a point d ahead on the camera's line of sight at time t (dy below it), and the yaw that faces the camera — where a line stands so the
    // camera, still dollying, flies through it
    const ahead = (t, d, dy = 0) => { const c = camB(t), dx = c.look[0] - c.p[0], dz = c.look[2] - c.p[2], n = Math.hypot(dx, dz); return { at: [c.p[0] + (dx / n) * d, c.p[1] + dy, c.p[2] + (dz / n) * d], rot: [0, Math.atan2(-dx / n, -dz / n), 0] }; };
    // the floor, its LED edges, the ceiling lamps chasing toward the stage on the beat
    ph.push(plane(PT.gridRunTex(kit), { w: 9, h: 46, mode: 1, col: [214, 120, 230], order: 1.4, at: (t) => ({ p: [0, FL, -7], r: [-Math.PI / 2, 0, 0], a: 0.5 * clamp((t - T0) / 0.5) + 0.25 * pulse(t, 6, 4) }) }));
    for (const sd of [-1, 1]) ph.push(plane(PT.blockTex(kit), { w: 0.05, h: 46, mode: 1, col: sd < 0 ? [255, 90, 190] : [120, 220, 255], order: 1.5, at: (t) => ({ p: [sd * 4.5, FL + 0.01, -7], r: [-Math.PI / 2, 0, 0], a: 0.9 }) }));
    for (let k = 0; k < 15; k++) for (const sd of [-1, 1]) { const z = 13 - k * 2.4;
      ph.push(plane(PT.bokehTex(kit), { w: 0.42, mode: 1, col: k % 3 === 0 ? [255, 150, 210] : [255, 240, 220], order: 1.6, at: (t) => { const ch = Math.max(0, 1 - Math.abs(((t - T0) / BEAT) % 4 - k * 0.27 % 4) * 1.5);
        return { p: [sd * 3.9, 2.9, z], r: [0, 0, 0], s: 1 + 0.6 * ch, a: 0.45 + 0.55 * ch }; } })); }
    // the LOOKs: [line, figure, side, z, footage, look no., ja, zh]
    const LOOKS = [[L20, 'LKD_wave', -1, 5.4, 'v_glam2', '01', 'ツクヨミの姫', '月读的公主', [255, 120, 190]], [L21, 'LKH_bow', 1, 0.6, 'v_rank2', '02', '十二単', '十二单', [255, 170, 90]],
      [L22, 'LKY_twirl', -1, -4.4, 'v_rank1', '03', '夏祭り浴衣', '夏日祭浴衣', [255, 110, 150]], [L24, 'LKK_run', 1, -9.4, 'v_ward', '04', 'おでかけ私服', '出门的便服', [120, 200, 255]],
      [L25, 'LKC_kiss', -1, -13.4, 'v_stage2', '05', 'ライブ衣装', '演唱会服装', [190, 130, 255]]];
    const nxt = (i) => (LOOKS[i + 1] ? LOOKS[i + 1][0].t0 : L27.t0);
    for (const [i, [L, fig, sd, z, clip, no, ja, zh, tc]] of LOOKS.entries()) {
      const tIn = Math.max(T0, L.t0 - 1.1 - (i === 0 ? 0 : 0.4)), ry = -sd * 0.95, PX = sd * 3.15, PY = 0.55, tOut = nxt(i) + 1.6;      // (yaw: each poster faces the corridor and the camera coming down it)
      const at = (t) => { const u = outE(clamp((t - tIn) / 0.5)); return { p: [PX, PY + (1 - u) * 0.8, z], r: [0, ry, 0], a: clamp((t - tIn) * 4) }; };
      ph.push(...finder(kit, seqSrc([[tIn, clip]]), { w: 2.35, h: 3.5, order: 3 + i * 0.1, at: (t) => (t < tIn || t > tOut ? null : at(t)), frameCol: tc }));
      // she stands in front of her poster, out of its frame (the frame crops nothing: she is whole)
      // (2026-11-24, "这一段的立绘透视设计可以优化一下": she steps into the corridor from her poster, turned mostly to the camera as it comes,
      // standing on the floor with a contact shadow — no longer a sheet skewed along the wall)
      const FXp = sd * 2.25, FZp = z + 0.75, cMid = camB(L.t0 + 1.0).p, fry = Math.atan2(cMid[0] - FXp, cMid[2] - FZp) * 0.85 + ry * 0.15;
      ph.push(...(await figure(kit, fig, { at: [FXp, FL, FZp], h: 2.9, ry: fry, t0: L.t0 - 0.05, t1: tOut, order: 6 + i * 0.1, flip: sd > 0, floor: true })));
      // its hang tag on a string from the frame's top corner, swinging
      const tg = PT.tagTex(kit, no, ja, zh, tc), HK = [PX + Math.cos(ry) * 1.05 + Math.sin(ry) * 0.06, PY + 1.55, z - Math.sin(ry) * 1.05 + Math.cos(ry) * 0.06];      // (the frame's top corner on the corridor side)
      ph.push(plane(tg, { w: 1.45, pivot: [0.1, 0.25], order: 6.6 + i * 0.1, sharp: true, shadow: { d: 0.03, dx: 0.04, dy: 0.06, a: 0.25, bias: 3 }, at: (t) => { if (t < L.t0 + 0.1 || t > tOut) return null; const u = (t - L.t0 - 0.1) / 0.5;
        return { p: [HK[0], HK[1] - 0.5, HK[2]], r: [0, ry, 0.35 * Math.exp(-Math.max(0, u) * 2.2) * Math.sin(u * 9) + 0.04 * Math.sin(t * 1.9)], s: outE(clamp(u * 2)), a: 1 }; } }));
      ph.push(plane(PT.blockTex(kit), { w: 0.012, h: 0.5, pivot: [0.5, 0], mode: 1, col: [255, 250, 240], order: 6.59 + i * 0.1, at: (t) => { if (t < L.t0 + 0.1 || t > tOut) return null;
        return { p: HK, r: [0, ry, 0], s: [1, outE(clamp((t - L.t0 - 0.1) / 0.3))], a: 0.9 }; } }));
      // the line stands in the corridor ahead of the camera; the camera flies through it
      const outT = i < LOOKS.length - 1 ? LOOKS[i + 1][0].t0 : L26.t0;
      if (L !== L21) ph.push(lyric(L, { col: WHITE, ink: [96, 30, 110], chip: [236, 90, 160], at: [sd * 0.35, -0.95, z + 1.5], rot: [0, ry * 0.3, 0], size: 0.34, maxW: 3.2, align: 'center', out: (L === L22 ? L23.t0 : outT) - 0.05, order: 12 + i * 0.1 }));      // (between the camera and her poster: in view the whole line, passed at the side as the next begins)
    }
    // 「ちょっとぉ・・・」 and the lines after the looks, in the corridor too
    for (const [L, out, x, y] of [[L23, L24.t0, 0, -0.5], [L26, L27.t0, 0, 0.1], [L27, L28.t0, 0, -0.35], [L28, T1, 0, -0.4]])
      ph.push(lyric(L, { col: WHITE, ink: [96, 30, 110], chip: [236, 90, 160], ...ahead(L.t0, L === L27 || L === L28 ? 3.6 : 4.4, y), size: 0.4, maxW: 3.9, align: 'center', out: out - 0.05, order: 14 }));
    // the STATUS window (RPG) across from LOOK 01, the fire-rat robe EQUIPPED with a spin into its slot; her pet beside it
    const STAT = PT.windowTex(kit, 'status2', 'STATUS', [['なまえ 名字', 'KAGUYA'], ['LV', '99'], ['かわいさ 可爱度', '∞', [255, 140, 210]], ['欠点 缺点', '0', [120, 255, 200]], ['装備 装备', '火鼠の皮衣', [255, 170, 90]], ['ペット 宠物', 'InuDOGE', [255, 214, 120]]]);
    ph.push(plane(STAT, { w: 2.6, order: 6, sharp: true, at: (t) => { const pp = popAt(t, L20.t0 + 0.1, L22.t0 - 0.2); return pp && { p: [2.75, 0.75, 6.0], r: [0, -0.75, 0.02], ...pp }; } }));
    ph.push(await motif(kit, 'inudoge', L20.t0 + 0.6, L22.t0 - 0.2, [3.6, 2.15, 6.6], 0.9, { order: 6.5, rAt: () => [0, -0.75, 0] }));
    const tEq = part(L20, '間違い', 1.3);
    ph.push(...(await holoCard(kit, [[L20.t0 + 0.35, 'TR3']], { at: [0, 0, 0], size: 1.0, order: 7, sparks: 6, from: 0, out: L22.t0 - 0.3, outStyle: 'none',
      anim: (t) => { const e = io(clamp((t - tEq) / 0.5)); return { dr: [0, e * Math.PI * 2 - 0.75 * e, 0], s: lerp(1, 0.42, e) }; },
      pos: (t) => { const u = clamp((t - tEq) / 0.5), e = io(u); return [lerp(2.0, 3.15, e), lerp(-0.9, 0.2, e) + Math.sin(u * Math.PI) * 0.7, lerp(7.6, 6.3, e)]; } })));
    ph.push(plane(PT.pixWordTex(kit, 'EQUIP!', [255, 170, 90], [255, 236, 140], 160), { w: 1.2, order: 8, sharp: true, at: (t) => { const pp = popAt(t, tEq + 0.45, tEq + 1.5); return pp && { p: [2.4, -0.45, 6.9], r: [0, -0.6, 0.05], ...pp }; } }));
    ph.push(...burst(kit, tEq + 0.45, () => [3.15, 0.2, 6.2], { size: 2.0, col: [255, 170, 90], order: 6.9 }));
    // 「文句は許しませんの」: a red WARNING band slams across the corridor (the line is on it, both languages)
    ph.push(...warnBand(kit, L21, '抱怨什么的绝不原谅哦', () => ({ p: [0.2, -0.5, 1.5], ry: 0.04, rz: -0.035 }), { out: L22.t0 + 0.1, order: 9, w: 18, h: 0.6, size: 0.27, chipX: 2.4, textX: 0.15 }));      // (the camera flies over the tape as the line ends)
    // 「あのね？…聞いてる？」 — the audience's danmaku IN THE CORRIDOR'S SPACE (the user, 2026-11-24: "弹幕可以不用拘束于通道，其他画幅也能铺开，但是
    // 要遵循片段的透视逻辑" + "原弹幕可以加上motion" + "弹幕可以做的更华丽可爱且演出可以做的动态一些"): streams running along both walls and the ceiling
    // toward the camera (they converge on the runway's vanishing point), comments crossing the corridor in mid-air at several depths; the
    // original outlined comments — now moving: popping in with an overshoot, hopping on the beats, swaying, flashing between two colours —
    // mixed with the cute pills and stars; on 「聞いてる？」 everything stops dead and trembles while a typing bubble's dots bounce; on
    // 「ちょっとぉ」 they rush on. Two SUPER CHATs (Japanese) stand in the corridor, sliding in; hearts rise through it.
    const DM = ['在听在听！', '公主殿下说得对', '好可爱', '8888', '前方高能', '我也想要', '可爱！', '在听！', '说得对！', '公主殿下！', '好可爱好可爱', '8888888', '喜欢！', 'awsl', '哈哈哈哈', '贴贴', '公主大人！', '天下第一可爱', '在听呢～', '是是是', '39！', 'ミクさん！'];      // (two for Miku)
    const DC = [[255, 140, 210], [140, 210, 255], [190, 150, 255], [255, 170, 120]];
    const effT = (t) => Math.min(t, tFreeze) + Math.max(0, t - tResume) * 1.7, frz = (t) => t > tFreeze && t < tResume;
    const dTex = (i) => { const txt = DM[i % DM.length], kind = i % 3 === 1 ? 1 + (i % 2) : 0, col = DC[i % 4];
      return i % 3 !== 1 ? [PT.danmakuTex(kit, txt, i % 2 ? col : null), PT.danmakuTex(kit, txt, DC[(i + 1) % 4])] : [PT.danmaku2Tex(kit, txt, kind, col)]; };
    const motion = (t, t0, i) => { const u = clamp((t - t0) / 0.28), pop = u < 1 ? 0.35 + 0.65 * (1 - Math.exp(-6 * u) * Math.cos(6 * u)) : 1, bf = beatOf(t) % 1;
      const hop = i % 3 === 2 && !frz(t) ? Math.max(0, Math.sin(bf * Math.PI)) ** 3 : 0, flip = i % 5 === 0 ? (1 - io(clamp((t - t0) / 0.35))) * Math.PI / 2 : 0;
      return { s: pop * (1 + 0.05 * pulse(t, 7)), hop, sway: frz(t) ? 0.05 * Math.sin(t * 55 + i) : 0.06 * Math.sin(t * 2.3 + i), shake: frz(t) ? 0.012 * Math.sin(t * 70 + i * 2) : 0, flip, tw: Math.floor(beatOf(t)) % 2 }; };
    const z22 = camZ(L22.t0), DMon = (t, t0) => t >= t0 && t <= L24.t0 + 0.2;
    // along the walls and the ceiling, flowing toward the camera
    for (let i = 0; i < 26; i++) { const lane = i % 13 < 5 ? -1 : i % 13 < 10 ? 1 : 0, t0 = L22.t0 - 0.35 + hash(i * 7.3) * 1.9, sp = 3.4 + 2.2 * hash(i * 3.1), zS = z22 - 6.5 - 5 * hash(i * 5.7), tx = dTex(i), H_ = 0.36 + 0.14 * hash(i * 2.2);
      const y = lane ? 0.7 + 1.8 * hash(i * 4.4) : 2.7, x = lane ? lane * 3.0 : -2.4 + 4.8 * hash(i * 6.6);      // (inside the posters' line, so the walls of comments pass close by)
      ph.push(plane(tx[0], { h: H_, order: 10.2 + i * 0.001, sharp: true, at: (t) => { if (!DMon(t, t0)) return null; const z = zS + (effT(t) - t0) * sp; if (z > camZ(t) + 0.3) return null; const m = motion(t, t0, i);
        return { p: [x + (lane ? 0 : m.shake), y + m.hop * 0.12 + (lane ? m.shake : 0), z], r: lane ? [m.sway * 0.5, -lane * Math.PI / 2 + m.flip, m.sway] : [Math.PI / 2, 0, m.sway + m.flip], s: m.s, tex: tx[m.tw % tx.length] }; } })); }
    // crossing the corridor in mid-air, at several depths
    for (let i = 0; i < 20; i++) { const k = i + 26, t0 = L22.t0 - 0.2 + hash(k * 7.3) * 2.4, d = 4.5 + 6.5 * hash(k * 1.9), sp = (2.0 + 1.6 * hash(k * 3.1)) * (d / 7), y = 0.35 + 1.7 * hash(k * 4.4), tx = dTex(k), zC = z22 - d;
      ph.push(plane(tx[0], { h: 0.26 + 0.05 * (d / 7), order: 10.5 + i * 0.001, sharp: true, at: (t) => { if (!DMon(t, t0)) return null; const x = 4.2 * (d / 7) + 1.5 - (effT(t) - t0) * sp; if (x < -4.2 * (d / 7) - 1.5) return null; const m = motion(t, t0, k);
        return { p: [x + m.shake, y + m.hop * 0.12, zC], r: [0, m.flip, m.sway], s: m.s, tex: tx[m.tw % tx.length] }; } })); }
    // two SUPER CHATs stand in the corridor, sliding in from the right, hearts bursting from them
    for (const [k, [txt, col]] of [['姫さま！わたしにも王子さまを！', [255, 110, 190]], ['この気持ち、受け取って♡', [150, 130, 255]]].entries()) { const ts = L22.t0 + 0.5 + k * 0.9, te = ts + 1.4, zS = camZ(ts) - 3.6, yS = 1.05 - k * 0.55;
      ph.push(plane(PT.danmaku2Tex(kit, txt, 3, col), { h: 0.46, order: 16 + k * 0.01, sharp: true, at: (t) => { if (t < ts || t > te + 0.25) return null; const u = outE(clamp((t - ts) / 0.3)), v = io(clamp((t - te) / 0.25));
        return { p: [4.4 - 3.2 * u + 3.6 * v, yS + (frz(t) ? 0.01 * Math.sin(t * 60) : 0), zS], r: [0, 0.08, -0.03], s: 1 + 0.05 * pulse(t, 8) }; } }));
      for (let j = 0; j < 7; j++) { const a = j / 7 * Math.PI * 2; ph.push(plane(PT.pixTex(kit, 'heart'), { w: 0.1, order: 16.1, sharp: true, at: (t) => { const u = (t - ts - 0.15) / 0.7; if (u < 0 || u > 1) return null;
        return { p: [1.2 + Math.cos(a) * 0.6 * outE(u), yS + Math.sin(a) * 0.35 * outE(u) + 0.15 * u, zS + 0.05], a: 1 - u }; } })); } }
    // hearts and stars rising through the corridor
    for (let i = 0; i < 18; i++) { const x0 = -3 + 6 * hash(i * 2.9), t0 = L22.t0 + hash(i * 6.1) * 2.8, sp = 0.55 + hash(i * 1.7) * 0.4, z0 = z22 - 3 - 7 * hash(i * 8.3);
      ph.push(plane(PT.pixTex(kit, i % 3 ? 'heart' : 'star'), { w: 0.12 + 0.08 * hash(i), order: 10.8, sharp: true, at: (t) => { const u = effT(t) - t0; if (t < t0 || u > 2.6) return null; return { p: [x0 + 0.12 * Math.sin(u * 4 + i), -1.6 + u * sp, z0], a: 1 - sm((u - 2.0) / 0.6) }; } })); }
    // the typing bubble: … — standing in the corridor where the camera stops, its three dots bouncing
    const TY = ahead(tFreeze, 2.8, 0.35), tyR = TY.rot[1], tyP = (dx, dy, dz = 0) => [TY.at[0] + Math.cos(tyR) * dx + Math.sin(tyR) * dz, TY.at[1] + dy, TY.at[2] - Math.sin(tyR) * dx + Math.cos(tyR) * dz];
    ph.push(plane(PT.typingTex(kit), { w: 0.62, order: 16.5, sharp: true, at: (t) => { const pp = popAt(t, tFreeze + 0.05, tResume - 0.05, 0.03); return pp && { p: tyP(0, 0), r: TY.rot, ...pp }; } }));
    for (let k = 0; k < 3; k++) ph.push(plane(PT.bokehTex(kit), { w: 0.075, mode: 1, col: [255, 120, 200], order: 16.6, sharp: true, at: (t) => { const pp = popAt(t, tFreeze + 0.1, tResume - 0.05, 0); if (!pp) return null;
      const b = Math.max(0, Math.sin((t - tFreeze) * 9 - k * 0.9)); return { p: tyP(-0.13 + k * 0.13, 0.035 + 0.04 * b, 0.01), r: TY.rot, a: pp.a }; } }));
    // 「白いおうまさん」: the carousel horse gallops up the runway toward the lens — a new place on each beat, a ring left where it was
    const horse = await kit.img('materials/nai/horse_1.png'), tH = part(L24, '白い', 1.0) - 0.04, HZ = [-17.5, -16.6, -15.7, -14.8, -13.9, -13.0, -12.1, -11.2], HX = [1.3, -1.2, 1.4, -1.1, 1.3, -1.3, 1.1, -0.9];      // (it gallops up the runway, always ahead of the camera)
    const hk = (t) => clamp(Math.floor((t - tH) / BEAT), 0, HZ.length - 1);
    ph.push(plane(horse, { h: 2.0, pivot: [0.5, 1], order: 10, sharp: true, shadow: { d: 0.1, dx: 0.12, dy: 0.18, a: 0.3, bias: 4 }, at: (t) => { if (t < tH || t > L26.t0 - 0.06) return null; const k = hk(t), u = clamp((t - tH - k * BEAT) / 0.16);
      return { p: [HX[k], FL + 0.35 + Math.sin(clamp((t - tH - k * BEAT) / BEAT) * Math.PI) * 0.35, HZ[k]], r: [0, k % 2 ? Math.PI : 0, 0.04 * Math.sin(t * 5)], s: k === 0 ? outE(u) : 1 + 0.1 * (1 - u) }; } }));
    HZ.forEach((z, k) => { const tb = tH + (k + 1) * BEAT; ph.push(plane(PT.ringTex(kit, 'thin', 0.012), { w: 1, mode: 1, col: [255, 236, 250], order: 9.8, sharp: true, at: (t) => { const u = (t - tb) / 0.6; if (u < 0 || u > 1 || tb > L26.t0) return null; return { p: [HX[k], FL + 0.02, z], r: [-Math.PI / 2, 0, 0], s: 1.2 + 2.2 * outE(u), a: (1 - u) * 0.8 }; } })); });
    // the stage at the end: the magazine cover (the footage of her as a model), the title, a silver moon rising on 「迎えに来て」
    const MZ = -21.5, magSrc = seqSrc([[T0, 'v_glam2'], [L21.t0 - 0.05, 'v_rank2'], [L22.t0 - 0.05, 'v_rank1'], [L23.t0 - 0.05, 'v_glam'], [L24.t0 - 0.05, 'v_ward'], [L25.t0 - 0.05, 'v_stage2'], [L27.t0 - 0.05, 'v_stream'], [L28.t0 - 0.05, 'v_glam2', 20]]);
    ph.push(...finder(kit, magSrc, { w: 7.6, order: 2, at: (t) => ({ p: [0, 0.7, MZ], r: [0, 0, 0], a: 1 }), frameCol: [214, 230, 255] }));
    ph.push(deco(kit, 'KAGUYA', { font: 'DelaGothic', px: 260, size: 1.5, align: 'center', at: [0, 3.35, MZ + 0.3], times: [T0 + 0.18], enter: 'flap', col: [255, 120, 190], ink: [96, 30, 110], strokeK: 0.12, order: 2.4, out: T1 - 0.1, follow: false }));
    ph.push(letters(kit, 'COLLECTION 2030', { font: 'VT323', px: 140, size: 0.55, align: 'center', at: [0, 2.55, MZ + 0.3], times: [...'COLLECTION 2030'].map((_, j) => T0 + 0.3 + j * 0.025), enter: 'type', col: [150, 100, 230], order: 2.4, out: T1 - 0.1, follow: false }));
    ph.push(letters(kit, 'VOL.03 · 火鼠の皮衣 · TSUKUYOMI FASHION WEEK', { font: 'DotGothic', px: 120, size: 0.17, align: 'center', at: [0, -1.75, MZ + 0.3], times: [T0 + 0.5], enter: 'type', col: [226, 80, 150], order: 2.4, out: T1 - 0.1, follow: false }));
    const glow = PT.glowTex(kit), disc = PT.bokehTex(kit), moonY = (t) => lerp(1.6, 4.6, io(clamp((t - L26.t0 + 0.1) / 1.0)));
    ph.push(plane(glow, { w: 4.4, mode: 1, col: [220, 225, 255], order: 1.2, at: (t) => { const pp = popAt(t, L26.t0 - 0.1, L28.t0, 0); return pp && { p: [3.6, moonY(t), -26], ...pp, a: pp.a * 0.7 }; } }));
    ph.push(plane(disc, { w: 1.3, mode: 1, col: [235, 238, 255], order: 1.25, at: (t) => { const pp = popAt(t, L26.t0 - 0.1, L28.t0, 0); return pp && { p: [3.6, moonY(t), -25.9], ...pp }; } }));
    // (a Miku easter egg) as the moon rises, a giant faint teal silhouette of her twirling in the sky behind the stage
    const SIL = await kit.img('materials/nai/cut/miku_twirl_sil.png');
    ph.push(plane(SIL, { h: 7.5, pivot: [0.5, 1], mode: 1, col: [57, 197, 187], order: 1.15, at: (t) => { const pp = popAt(t, L26.t0 - 0.05, L27.t0 + 0.5, 0); return pp && { p: [7.4, -0.6, -26], r: [0, -0.2, 0.04 * Math.sin(t)], s: [-pp.s, pp.s], a: pp.a * (0.45 + 0.1 * pulse(t, 7)) }; } }));      // (right of the stage's screen, in the sky, over the house of cards)
    // 「わかったらかしずいて」: the camera kneels before the stage; she stands over it on a full-length card, a 360° fan opening behind her
    ph.push(...(await holoCard(kit, [[L27.t0 - 0.02, 'KD_wave']], { at: [0, -0.15, -17.6], size: 3.7, order: 11, sparks: 10, from: -1.6, out: T1 - 0.2, rz: -0.04 })));
    ph.push(...(await fanWheel(kit, CHARS.slice(0, 10), L27.t0 - 0.1, T1 - 0.35, [0, 0.3, -18.4], { R: 2.4, size: 1.15, order: 10, spin: 1.1 })));
    // a house of cards on the stage, a level for every two lines — pushed over on 「手を取って」 and flung at the lens
    const tPush = part(L28, '手を取', 0.3), HC = [], LV = [L20.t0, L22.t0, L24.t0, L26.t0];
    for (let k = 0; k < 4; k++) { const n = 4 - k, y0 = FL + k * 0.8, x0 = 3.0 - (n - 1) * 0.33;
      for (let i = 0; i < n; i++) for (const sdd of [-1, 1]) HC.push({ p: [x0 + i * 0.66 + sdd * 0.15, y0 + 0.4, -16.4], r: [0, 0, sdd * -0.36], t: LV[k] + i * 0.08 + (sdd > 0 ? 0.04 : 0) });
      for (let i = 0; i < n - 1; i++) HC.push({ p: [x0 + i * 0.66 + 0.33, y0 + 0.8, -16.4], r: [-1.25, 0, Math.PI / 2], t: LV[k] + BEAT * 2 + i * 0.08 }); }
    for (const [i, c] of HC.entries()) { const fl = [(hash(i * 1.7) - 0.5) * 5, (hash(i * 2.9) - 0.2) * 3, 2.4 + hash(i * 4.1) * 1.6], sp = (hash(i * 5.5) - 0.5) * 9;
      ph.push(await cardFace(kit, null, (t) => { if (t < c.t) return null; const u = clamp((t - c.t) / 0.3), v = clamp((t - tPush - (3.3 - c.p[1] + FL) * 0.05) / 0.9); if (v >= 1) return null;
        return { p: [c.p[0] + fl[0] * v, c.p[1] + (1 - outE(u)) * 0.6 + fl[1] * v - v * v * 1.2, c.p[2] + fl[2] * v * 1.3], r: [c.r[0] + sp * v, c.r[1] + sp * 0.7 * v, c.r[2] + sp * 0.4 * v], a: clamp(u * 4) }; },
        { size: 0.86, order: 12 + i * 0.03, shadow: false, walls: 2, bank: false })); }
    ph.push(...(await backbone(kit, { t0: T0, t1: T1, c: [0, 0.7, MZ - 0.5], dialCol: [255, 206, 140], dialCol2: [255, 150, 205], raysCol: [255, 238, 200], ghost: '欠点', ghostCol: [255, 160, 205] })));
    sets.push({ t0: T0, t1: T1, planes: ph, cam: (t) => ({ ...cam(t), fov: 46, focus: 6, dof: 0.16, maxBlur: 7 }), bg: () => ({ top: [255, 236, 214], bot: [240, 180, 214] }), ground: () => ({ kind: 6 }),
      post: (t) => ({ bloom: 0.16, thr: 0.9, ca: 0.0015 * pulse(t, 7), grain: 0.03, vig: 0.2, glitch: t < T0 + 0.05 ? 0.5 : 0 }) });
  }

  // ---------------------------------------- pre 2: the robe burns; her first live as a memory; KASSEN banners; the countdown ----------------------------------------
  {
    const T0 = 115.2, TD = bar(60), T1 = bar(64), ph = [], [L29, L30, L31, L32] = [29, 30, 31, 32].map(ln);
    // the fire-rat robe — in the tale a fake, it burned: the card burns up from its foot, ember-edged, through the four bars without drums
    const orbA = (t) => -0.5 + 2.2 * io(clamp((t - T0) / (bar(60) - T0)));
    ph.push(...(await holoCard(kit, [[T0 - 0.2, 'TR3']], { at: [0, 0.15, 0], size: 3.5, order: 5, sparks: 8, idle: 'float', amp: 0.35, from: 0, out: TD + 0.5, outStyle: 'none',
      anim: (t) => ({ dr: [0, orbA(t), 0] }),      // (it turns with the orbiting camera)
      fxAt: (t) => ({ tear: clamp(1 - (t - (T0 + 0.9)) / (TD - T0 - 0.4)), tearA: 10 + Math.PI * 1.5 }) })));
    const spark = PT.sparkTex(kit), bok = PT.bokehTex(kit);
    for (let i = 0; i < 46; i++) { const x0 = -6 + hash(i * 2.7) * 12, z0 = -2 + hash(i * 5.1) * 5, sp = 0.4 + hash(i * 3.3) * 0.7, ph0 = hash(i * 9.7) * 10, big = hash(i) > 0.7;
      ph.push(plane(big ? bok : spark, { w: big ? 0.2 : 0.15, mode: 1, col: [[255, 150, 60], [255, 210, 120], [255, 110, 80]][i % 3], order: z0 > 1.5 ? 12 : 1.5, at: (t) => { const y = -3.4 + ((((t - T0) * sp + ph0) % 7) + 7) % 7;
        return { p: [x0 + 0.3 * Math.sin(t * 0.8 + i), y, z0], r: [0, 0, t * (i % 2 ? 1 : -1)], a: (0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i))) * clamp((t - T0) / 0.6) * (t > TD ? 1 - sm((t - TD) / 1.5) : 1) }; } })); }
    // THE MEMORY RING (PLAN-v3): the camera orbits the burning card; Yachiyo's first live (the Tsukuyomi beach) in windows on a tilted ring
    // round it — one opens on each line — and her figures standing on the ring, so they pass in front of the card and behind it; the last
    // window leaves the ring and crosses the lens as the drums return
    const RR = 4.3, TILT = 0.3, orb = (t) => -0.5 + 2.2 * io(clamp((t - T0) / (TD - T0))), CR = 8.4;
    const camO = (t) => { const a = orb(t); return { p: [CR * Math.sin(a), 0.9 - 0.5 * Math.sin(a * 0.7), CR * Math.cos(a)], look: [0, 0.1, 0] }; };
    const ringP = (phi, t) => { const a = phi + (t - T0) * 0.07; return [RR * Math.sin(a), 0.2 + RR * Math.cos(a) * Math.sin(TILT) * -1, RR * Math.cos(a) * Math.cos(TILT)]; };
    const face = (p, t) => { const c = camO(t).p; return Math.atan2(c[0] - p[0], c[2] - p[2]); };
    const MEM = [[L29.t0 - 0.15, 'y_aurora', 0.3, 2.8], [L30.t0 - 0.1, 'y_fish', 1.9, 2.7], [L31.t0 - 0.1, 'y_jelly', 3.3, 2.5], [L32.t0 - 0.1, 'y_sing1', 4.6, 2.8], [L32.t0 + 1.2, 'y_galaxy', 5.6, 2.9]];
    const tFly = TD - 0.55;
    MEM.forEach(([t0, nm, phi, w], k) => { const last = k === MEM.length - 1, at = (t) => { if (t < t0 || t > TD + 0.4) return null; const u = clamp((t - t0) / 0.9), p = ringP(phi, t);
      if (last && t > tFly) { const v = io(clamp((t - tFly) / 0.6)), c = camO(t).p; return { p: [lerp(p[0], c[0], v * 1.04), lerp(p[1], c[1], v * 1.04), lerp(p[2], c[2], v * 1.04)], r: [0, face(p, t), 0], a: 1 }; }      // (through the lens)
      return { p: [p[0], p[1] + 0.06 * Math.sin(t * 0.6 + phi), p[2]], r: [0, face(p, t), 0.04 * Math.sin(t * 0.5 + phi)], s: 0.6 + 0.4 * outE(u), a: sm(u) * (1 - sm((t - TD + 0.1) / 0.5)) * 0.95 }; };
      ph.push(...finder(kit, clipC(nm, t0, 0.8, 0), { w, order: 2 + k * 0.05, at, frameCol: [214, 196, 255] })); });
    // the ring itself: a fine luminous line through the windows (the light running round it)
    for (let j = 0; j < 72; j++) { const phi = (j / 72) * Math.PI * 2; ph.push(plane(PT.bokehTex(kit), { w: 0.07, mode: 1, col: j % 9 === 0 ? [255, 200, 140] : [214, 196, 255], order: 1.9, at: (t) => { if (t < T0 + 0.2 || t > TD + 0.3) return null; const p = ringP(phi, t);
      return { p, s: 1 + (j % 9 === 0 ? 1.2 : 0) + 0.8 * Math.max(0, Math.cos(phi - (t - T0) * 2.4)) ** 8, a: 0.55 * clamp((t - T0 - 0.2 - j * 0.01) / 0.4) * (1 - sm((t - TD) / 0.3)) }; } })); }
    // her figures stand on the ring among the windows (the memory of her first live)
    for (const [f, phi, t0] of [['LYD_float', 1.15, L29.t0 + 0.6], ['LYD_twirl', 4.0, L31.t0 + 0.2], ['LYY_heart', 2.6, L30.t0 + 0.4]])
      ph.push(...(await figure(kit, f, { at: (t) => { const p = ringP(phi, t); return [p[0], p[1] - 1.45, p[2]]; }, ryAt: (t) => face(ringP(phi, t), t), h: 2.9, t0, t1: TD - 0.2, order: 3 + phi * 0.01, motif: f === 'LYD_float' ? 'seaslug' : undefined })));
    { const SILp = await kit.img('materials/nai/cut/miku_point_sil.png'), tS = L31.t0 + BEAT * 2;      // (a Miku easter egg: her silhouette on the ring, two beats)
      ph.push(plane(SILp, { h: 3.0, pivot: [0.5, 1], mode: 1, col: [57, 197, 187], order: 3.05, at: (t) => { const pp = popAt(t, tS, tS + BEAT * 2, 0); if (!pp) return null; const p = ringP(0.35, t); return { p: [p[0], p[1] - 1.45, p[2]], r: [0, face(p, t), 0], ...pp, a: pp.a * 0.85 }; } })); }
    // the lines float up among the embers (gold, silver), each turned to the camera where it will be
    [[L29, L30.t0, [-1.6, 2.0, 2.0], K_GOLD], [L30, L31.t0, [1.2, -1.9, 2.0], Y_SILVER], [L31, L32.t0, [-1.2, 2.0, 2.0], K_GOLD], [L32, TD, [1.0, -1.9, 2.0], Y_SILVER]].forEach(([L, out, at0, col]) => {
      const c = camO(L.t0 + 1).p, a = Math.atan2(c[0], c[2]), at = [at0[0] * Math.cos(a) + at0[2] * Math.sin(a), at0[1], -at0[0] * Math.sin(a) + at0[2] * Math.cos(a)];
      ph.push(lyric(L, { font: 'HachiMaru', at, rot: [0, a, 0], align: 'center', maxW: 5.6, col, ink: [60, 24, 20], chip: [90, 40, 20], enter: 'rise', out: out - 0.08, order: 20 })); });
    ph.push(...(await backbone(kit, { t0: T0, t1: TD + 0.3, c: [0, 0.15, -0.5], dialCol: [255, 170, 90], dialCol2: [255, 120, 80], raysCol: [255, 190, 120], ghost: '火鼠', ghostCol: [255, 150, 90], airCol: [[255, 170, 80], [255, 120, 70], [255, 220, 140], [255, 190, 120]], rings: false })));
    // the drums return: KASSEN banners rise one a beat in THREE rows; the camera slaloms between them to the battlefield at the end; 3 · 2 · 1
    const NB = [['合戦', [255, 80, 120], [150, 20, 70]], ['KASSEN', [120, 90, 255], [40, 20, 120]], ['竹取神戦', [255, 190, 60], [170, 80, 0]], ['かぐや', [255, 120, 200], [160, 40, 120]], ['八千代', [150, 220, 255], [40, 90, 170]], ['IRO P', [120, 240, 200], [20, 110, 90]], ['ONYX', [90, 90, 130], [20, 20, 40]], ['推し', [255, 140, 90], [170, 50, 30]]];
    const SLz = (t) => lerp(8, -13, io(clamp((t - TD - 0.4) / (T1 - TD - 0.5))));
    const riseAt = (z) => { let t = TD; while (t < T1 && SLz(t) - z > 9) t += 0.05; return Math.max(TD, TD + Math.ceil((t - TD) / (BEAT / 2)) * (BEAT / 2)); };      // (each rises on the half-beat when the camera is ~9 ahead of it)
    for (let i = 0; i < 24; i++) { const [txt, c1, c2] = NB[i % NB.length], row = i % 3, x = (row - 1) * 3.6, z = 4 - Math.floor(i / 3) * 2.6 - (row === 1 ? 1.3 : 0), tb = riseAt(z) + row * 0.06;
      const ryB = (row - 1) * -0.2, yB = (t) => -2.3 - (1 - outE(clamp((t - tb) / 0.32))) * 3.5, PO = (17 / 380 - 0.5) * 3.9 * 380 / 1440;      // (PO: the pole's axis from the cloth's centre)
      ph.push(plane(PT.noboriTex(kit, txt, c1, c2), { h: 3.9, pivot: [0.5, 1], mode: 13, order: 4 + i * 0.01, shadow: { d: 0.1, dx: 0.12, dy: 0.1, a: 0.25, bias: 4 }, at: (t) => { if (t < tb) return null;
        return { p: [x, yB(t), z], r: [0, ryB, 0] }; } }));
      // its pole: a lit cylinder turned to the camera, through the crossbar's ring and the loops, a finial above, running down out of the frame
      ph.push(plane(PT.poleTex(kit), { h: 6.0, pivot: [0.5, 0], order: 4 + i * 0.01 - 0.004, sharp: true, shadow: { d: 0.1, dx: 0.12, dy: 0.1, a: 0.25, bias: 4 }, at: (t) => { if (t < tb) return null;
        const px = x + Math.cos(ryB) * PO, pz = z - Math.sin(ryB) * PO, c = camP(t).p; return { p: [px, yB(t) + 3.9 + 0.15, pz], r: [0, Math.atan2(c[0] - px, c[2] - pz), 0] }; } })); }
    ph.push(...finder(kit, seqSrc([[TD, 'y_torii'], [TD + BEAT * 8, 'y_stage'], [T1 - BEAT * 5, 'y_count']]), { w: 7.2, order: 3, at: (t) => (t < TD ? null : { p: [0, 0.4, -20], r: [0, 0, 0], a: clamp((t - TD) / 0.5) }) }));
    const SL = (t) => { const u = clamp((t - TD - 0.4) / (T1 - TD - 0.5)), z = lerp(8, -13, io(u)); return { z, x: 1.8 * Math.sin((8 - z) / 5.2 * Math.PI) * (1 - u * 0.6) }; };
    const camP = (t) => { if (t < TD) return camO(t); const v = io(clamp((t - TD) / 0.5)), s0 = SL(t), s1 = SL(t + 0.35), o = camO(TD);
      return { p: [lerp(o.p[0], s0.x, v), lerp(o.p[1], 0.3, v), lerp(o.p[2], s0.z, v)], look: [lerp(0, s1.x * 1.6, v), lerp(0.1, 0.3, v), lerp(0, s1.z - 6, v)], roll: v * (s1.x - s0.x) * -0.25 }; };
    const cam = (t) => ({ ...camP(t), fov: 44, focus: t < TD ? 8.4 : 7, dof: 0.18, maxBlur: 8 });
    for (let k = 0; k < 3; k++) { const tc = T1 - BEAT * (3 - k) - 0.02; ph.push(plane(PT.countTex(kit, 3 - k), { w: 0.62, order: 40, sharp: true, at: (t) => { const pp = popAt(t, tc, tc + BEAT * 0.8); if (!pp) return null; return { ...inCamAt(cam, 3, 0, 0.05)(t), ...pp }; } })); }
    sets.push({ t0: T0, t1: T1, planes: ph, cam, bg: () => ({ top: [30, 12, 20], bot: [10, 4, 8] }), ground: () => ({ kind: 4 }),
      post: (t) => ({ bloom: 0.34, thr: 0.78, ca: 0.0012 * pulse(t, 7), grain: 0.035, vig: 0.4 }) });
  }

  // ---------------------------------------- chorus 2: THE ROOM OF CARDS (其の四「蓬莱の玉の枝」, PLAN-v3) ----------------------------------------
  // Inside a room whose three walls are card walls showing Yachiyo's first live; the camera enters by the open front, turns to a new wall
  // on each line (the line stands on that wall, in a game's dialogue box), rolls down to the floor for the hook (the line lies there,
  // cards thrown across it), turns back to the poster; the walls scoop themselves up and the camera pulls out. HUD and judgments held in
  // the lens; cardistry in the middle of the room.
  {
    const T0 = bar(64), T1 = bar(79), ph = [], [L33, L34, L35, L36, L37, L38, L39] = [33, 34, 35, 36, 37, 38, 39].map(ln), tYeah = L39.t1 + 0.15;
    const E = [0, 0.3, 2.2], BACK = [0, 0.3, -6.4], LEFT = [-6.6, 0.3, 0.4], RIGHT = [6.6, 0.3, 0.4], DOWN = [0, -2.5, -1.2];      // (2026-11-24, "游戏设计段落的视频画面演出可以稍微放大一点": bigger walls, the camera nearer)
    const camC = camTrack([{ t: T0 - 0.05, p: [0, 0.4, 9.5], look: BACK }, { t: T0 + 1.3, p: E, look: BACK }, { t: L34.t0 - 0.25, p: E, look: BACK }, { t: L34.t0 + 0.25, p: E, look: LEFT },
      { t: L35.t0 - 0.25, p: E, look: LEFT }, { t: L35.t0 + 0.2, p: E, look: BACK }, { t: L37.t0 - 0.25, p: E, look: BACK }, { t: L37.t0 + 0.3, p: E, look: RIGHT },
      { t: L38.t0 - 0.3, p: E, look: RIGHT, roll: 0 }, { t: L38.t0 + 0.35, p: [0, 0.7, 2.6], look: DOWN, roll: 0.35 }, { t: L39.t0 - 0.12, p: [0, 0.5, 2.2], look: DOWN, roll: 0.2 },
      { t: L39.t0 + 0.06, p: E, look: BACK, roll: 0 }, { t: tYeah + 0.4, p: E, look: BACK }, { t: T1, p: [0, 0.5, 10], look: BACK }]);
    const cam = travel((t) => ({ ...camC(t), fov: 48, focus: 7.5, dof: 0.18, maxBlur: 8 }), 0.06);
    // the three walls: Yachiyo's first live, each column turning over to the next shot a beat apart
    const SL = [['y_appear', 0], ['y_torii', 0], ['y_close', 0], ['y_aurora', 0], ['y_fish', 0], ['y_stage', 0], ['y_sing2', 0], ['y_galaxy', 0], ['y_smile', 0], ['y_sing1', 0], ['y_jelly', 0], ['y_final', 0], ['y_torii', 60], ['y_aurora', 80]];
    const slotT = (n) => T0 + n * BEAT * 2, shotOf = (t, i) => Math.max(0, Math.floor((t - T0 - i * 0.06) / (BEAT * 2)));
    const WALLS = [[0, -6.4, 0], [-6.6, 0.6, Math.PI / 2], [6.6, 0.6, -Math.PI / 2]], WTH = 2.8, WMCY = 0.32;
    for (const [w, [cx, cz, yaw]] of WALLS.map((g, w) => [w, g])) {
      const srcAt = (i) => (t) => { const n = shotOf(t, i) + w * 5, [nm, sk] = SL[n % SL.length]; return clipC(nm, slotT(shotOf(t, i)) + i * 0.06, 1, sk)(t); };
      const FUSE = [[[T0 + 1.6, L34.t0 - 0.45], [L35.t0 + 0.8, L37.t0 - 0.55]], [[L34.t0 + 0.75, L35.t0 - 0.45]], [[L37.t0 + 0.8, L38.t0 - 0.55]]][w];
      ph.push(...tileWall(kit, back, { TH: WTH, MCX: cx, MCY: WMCY, MCZ: cz, yaw, sway: false, fuseAt: fuseWin(FUSE), deck: () => [cx * 0.6, -4.5, cz * 0.6], srcAt, t0: T0, order: 3 + w * 0.4,
        segs: [[T0 - 0.3 + w * 0.15, T1 - 0.05, 'y', (i, j) => Math.abs(i - 2) * 0.05 + j * 0.03, 'down']],
        extra: (t, i) => { const n = shotOf(t, i); if (n === 0) return null; const u = (t - slotT(n) - i * 0.06) / 0.3; return u > 0 && u < 1 ? [0, Math.PI * 2 * io(u), 0] : null; } }));
    }
    // the floor: a neon perspective grid the camera looks down at on the hook
    // Iroha (her fox avatar, TEAM IRO P's keyboard) stands in the room by each wall the camera turns to, dressed in her accents
    for (const [f, p, ry, t0, t1] of [['LIG_keys', [-3.3, -2.55, 0.7], 1.15, L34.t0 - 0.1, L35.t0 + 0.5], ['LIG_point', [2.9, -2.55, -4.2], -0.35, L35.t0 + 0.2, L37.t0 + 0.4], ['LIG_jump', [3.3, -2.55, 0.7], -1.15, L37.t0 - 0.1, L38.t0 + 0.3]])
      ph.push(...(await figure(kit, f, { at: p, ry, h: 3.0, t0, t1, order: 9 })));
    ph.push(plane(PT.gridTex(kit), { w: 16, h: 16, mode: 1, col: [255, 120, 220], order: 1.5, at: (t) => ({ p: [0, -2.55, -0.5], r: [-Math.PI / 2, 0, 0], a: 0.55 * clamp((t - T0) / 0.8) * (1 - sm((t - T1 + 0.5) / 0.5)) + 0.25 * pulse(t, 6, 4) }) }));
    ph.push(...(await backbone(kit, { t0: T0, t1: T1, c: [0, 0.05, -2.5], dialCol: [255, 214, 120], dialCol2: [255, 140, 210], ghost: 'おうじさま', ghostCol: [255, 200, 120], rays: false })));
    // GALGAME + 音游 (the user, 2026-11-24: "关于游戏UI可以设计成GALGAME+音游的设计"): the rhythm game's bar in the lens — the song, MASTER 32, the
    // prince's 好感度 gauge filling with every plea, SCORE rolling — and the walls themselves are its playfield: the faced wall's five columns
    // are lanes, notes fall down them onto a judgement line across the wall and land on the beat (a flash up the lane, a ring, the judgement)
    const hud = inCamAt(cam, 3, 0, 0.66), HW = 3.4, pleas = [L33.t0, L34.t0, L35.t0, L36.t0, L37.t0, L38.t0, L39.t0, tYeah];
    const love = (t) => Math.min(1, pleas.filter((x) => t > x + 0.1).length / pleas.length), hudOn = (t) => popAt(t, T0 + 0.8, T1 - 0.4, 0), HU = HW / 2400;
    ph.push(plane(PT.rhythmHudTex(kit), { w: HW, order: 50, sharp: true, at: (t) => { const pp = hudOn(t); return pp && { ...hud(t), ...pp }; } }));
    const gW = 760 * HU;      // (the gauge frame: 1150…1910 px across, 150…214 px down in a 2400 × 300 bar centred on 0.66)
    ph.push(plane(PT.hpFillTex(kit, true), { w: gW, h: 54 * HU, pivot: [0, 0.5], order: 50.01, sharp: true, at: (t) => { const pp = hudOn(t); if (!pp) return null;
      return { ...inCamAt(cam, 2.99, -HW / 2 + 1150 * HU + 0.005, 0.66 + (150 - 182) * HU)(t), s: [Math.max(0.001, love(t)), 1 + 0.2 * pulse(t, 9)], a: pp.a }; } }));
    const hits = []; for (let tb = beatT(Math.ceil(beatOf(T0 + 1.3))); tb < tYeah; tb += BEAT) hits.push(tb);
    const cnt = (t) => hits.filter((x) => t >= x).length;
    ph.push(plane(PT.scoreTex(kit, 0), { w: 330 * HU, order: 50.02, sharp: true, at: (t) => { const pp = hudOn(t); if (!pp) return null; const n = cnt(t);
      return { ...inCamAt(cam, 2.99, -HW / 2 + 2180 * HU, 0.66 + (150 - 185) * HU)(t), tex: PT.scoreTex(kit, n * 31415 + (n > 0 ? 2650 : 0)), a: pp.a }; } }));
    ph.push(...judges(kit, hits.filter((_, k) => k % 2 === 0), inCamAt(cam, 3, 1.15, -0.05), { w: 0.6, order: 48 }));
    ph.push(plane(PT.comboTex(kit, 1), { w: 0.6, order: 48.5, sharp: true, at: (t) => { const n = cnt(t); if (n === 0 || t > T1 - 0.3) return null; const u = (t - hits[n - 1]) / 0.2; return { ...inCamAt(cam, 3, 1.45, 0.32)(t), tex: PT.comboTex(kit, n), s: 1 + 0.25 * (1 - clamp(u)) }; } }));
    // (a Miku easter egg) an 8-bit Miku hops across the top of the rhythm bar once, her leek bouncing after her
    for (const [k, kind] of [[0, 'miku'], [1, 'negi']]) ph.push(plane(PT.pixTex(kit, kind), { w: 0.2, order: 50.3, sharp: true, at: (t) => { const t0 = L36.t0 + 0.2 + k * 0.18, u = (t - t0) / 2.2; if (u < 0 || u > 1) return null;
      const hop = Math.abs(Math.sin((t - t0) / BEAT * Math.PI)) * 0.06; return { ...inCamAt(cam, 2.97, 1.85 - u * 3.7, 0.86 + hop, k ? (t - t0) * 6 : 0)(t), s: [-1, 1] }; } }));
    // the playfield on whichever wall the camera faces — a Cytus II chart (the user, 2026-11-24: "音游可以做成CYTUS2类型的谱面，并做的灵动和稍微
    // 复杂一些（这样更具观赏性）， 并且扫描线不要设计的戛然而止"): the scan line sweeps the wall a bar a sweep (down, then up), tapering off past both
    // edges, its wake glowing behind it, its colour turning each page; the notes stand where the line will be on their beat — taps on the
    // beats and offbeats, gold doubles on the downbeats, drag chains on sixteenths, holds the line runs along, a flick to close each wall —
    // each fading in with a closing ring and bursting as the line crosses it
    const FACE = [[T0 + 1.0, L34.t0 - 0.1, 0], [L34.t0 + 0.3, L35.t0 - 0.3, 1], [L35.t0 + 0.25, L37.t0 - 0.3, 0], [L37.t0 + 0.35, L38.t0 - 0.35, 2], [L39.t0 + 0.1, tYeah - 0.1, 0]];
    const faceAt = (t) => FACE.find(([a, b]) => t >= a && t < b);
    const TW = WTH * 0.716, GPw = 0.06, MWt = 5 * TW + 4 * GPw, MHt = 2 * WTH + GPw;
    const wallP = (w, lx, ly, dz) => { const [cx, cz, yaw] = WALLS[w]; return [cx + Math.cos(yaw) * lx + Math.sin(yaw) * dz, ly, cz - Math.sin(yaw) * lx + Math.cos(yaw) * dz]; };
    const BARL = BEAT * 4, YT = 1.4, YB = -1.1, XW = MWt / 2 - 0.9,      // (the band left open between the HUD at the top and the message window below)
      pg = (t) => Math.floor((t - T0) / BARL);
    const scanY = (t) => { const k = pg(t), f = (t - T0) / BARL - k; return k % 2 ? lerp(YB, YT, f) : lerp(YT, YB, f); };
    const PAL = [[255, 110, 200], [100, 220, 255], [255, 200, 90], [176, 140, 255]], palAt = (t) => PAL[((pg(t) % 4) + 4) % 4];
    const wOn = (w) => (t) => { const f = faceAt(t); if (!f || f[2] !== w) return 0; return Math.min(clamp((t - f[0]) / 0.3), clamp((f[1] - t) / 0.25)); };
    for (let w = 0; w < 3; w++) { const on = wOn(w), R = [0, WALLS[w][2], 0];
      const turn = (t) => { const f = (t - T0) / BARL - pg(t); return Math.exp(-f / 0.06) + Math.exp(-(1 - f) / 0.03); };      // (a flare as the page turns)
      ph.push(plane(PT.cyWakeTex(kit), { w: MWt * 1.75, h: 0.9, pivot: [0.5, 0], mode: 1, order: 6.45, at: (t) => { const a = on(t); if (a <= 0) return null; return { p: wallP(w, 0, scanY(t), 0.11), r: R, col: palAt(t), s: [1, pg(t) % 2 ? -1 : 1], a: a * 0.75 }; } }));
      ph.push(plane(PT.cyScanTex(kit), { w: MWt * 1.75, h: 0.5, mode: 1, order: 6.5, sharp: true, at: (t) => { const a = on(t); if (a <= 0) return null; return { p: wallP(w, 0, scanY(t), 0.12), r: R, col: palAt(t), s: [1, 1 + 0.5 * pulse(t, 8) + 0.8 * turn(t)], a }; } }));
      ph.push(plane(PT.cyScanTex(kit), { w: MWt * 1.75, h: 0.16, mode: 1, col: WHITE, order: 6.51, sharp: true, at: (t) => { const a = on(t); if (a <= 0) return null; return { p: wallP(w, 0, scanY(t), 0.125), r: R, a }; } }));
    }
    // the chart: per bar a pattern — 0 beats + an offbeat, 1 beats + a drag chain, 2 a hold + offbeats, 3 an eighth run — on every faced wall
    const chart = [], holds = [], chains = [];
    for (const [fa, fb, w] of FACE) { let px = 0, last = null;
      const n0 = Math.ceil((fa + 0.2 - T0) / (BEAT / 2)), n1 = Math.floor((fb - 0.12 - T0) / (BEAT / 2));
      const nx = (n, k = 1) => { const st = (1.6 + 1.4 * hash(n * 3.7 + k)) * (hash(n * 1.3 + k) > 0.5 ? 1 : -1); let x = px + st; if (Math.abs(x) > XW) x = px - st; px = clamp(x, -XW, XW); return px; };
      let busy = -1;      // (eighths taken by a chain or a hold)
      for (let n = n0; n <= n1; n++) { const t = T0 + n * BEAT / 2, ib = ((n % 8) + 8) % 8, pat = ((Math.floor(n / 8) % 4) + 4) % 4, col = PAL[(n + w) % 4];
        if (n <= busy) continue;
        if (pat === 1 && (ib === 4 || ib === 0) && n + 3 <= n1) {      // a drag chain over two beats, on sixteenths
          const id = chains.length, x0 = clamp(px, -XW + 2.8, XW - 2.8), dir = x0 > 0 ? -1 : 1, pts = [];
          for (let k = 0; k < 8; k++) { const tk = t + k * BEAT / 4, xk = x0 + dir * k * 0.66 + 0.4 * Math.sin(k * 1.3); pts.push({ t: tk, x: xk }); chart.push({ t: tk, x: xk, kind: 'drag', col: PAL[1], w, chain: id, k }); }
          chains.push({ pts, w }); px = pts[7].x; busy = n + 3; continue; }
        if (pat === 2 && ib === 0 && n + 4 <= n1) {      // a hold over 2.5 beats, taps on the other side meanwhile
          const x = nx(n), side = x > 0 ? -1 : 1; holds.push({ t0: t, t1: t + BEAT * 2.5, x, w, col: PAL[3] }); chart.push({ t, x, kind: 'tap', col: PAL[3], w, hold: true });
          for (const [k, xo] of [[1, 1.7], [2, 3.0], [3, 1.9], [4, 3.6]]) { const tk = t + k * BEAT / 2; if (tk <= fb - 0.12) chart.push(last = { t: tk, x: clamp(x + side * xo, -XW, XW), kind: 'tap', col: PAL[k % 3], w }); }
          busy = n + 4; continue; }
        if (ib === 0 || (pat === 3 && ib === 4)) { const d = 1.4 + 1.6 * hash(n * 2.1); chart.push({ t, x: -d, kind: 'gold', col: PAL[2], w }, { t, x: d, kind: 'gold', col: PAL[2], w }); continue; }
        if (ib % 2 === 0 || pat === 3 || ib === 3 || ib === 7) chart.push(last = { t, x: nx(n), kind: 'tap', col, w }); }
      if (last) last.kind = 'flick'; }
    const dTex = PT.cyDotsTex(kit), RNG = PT.ringTex(kit, 'thin', 0.02), GLW = PT.glowTex(kit), LEAD = 0.75, appear = (tn) => T0 + pg(tn - 1e-4) * BARL - 0.45;      // (a page's notes all fade in just before the line turns onto it)
    for (const N of chart) { const R = [0, WALLS[N.w][2], 0], y = scanY(N.t - 1e-4), P0 = wallP(N.w, N.x, y, 0.14), sz = N.kind === 'drag' ? 0.44 : N.kind === 'flick' ? 0.98 : 0.86, lead = Math.max(0.5, N.t - appear(N.t) + (N.kind === 'drag' ? N.k * 0.04 : 0)), live = (t) => (faceAt(t) || [])[2] === N.w;
      ph.push(plane(PT.cyNoteTex(kit, N.kind === 'gold' ? 'gold' : N.kind, N.col), { w: sz, order: 6.62, sharp: true, at: (t) => { const u = (t - N.t + lead) / lead; if (u < 0 || t > N.t + 0.12 || !live(t)) return null;
        const v = clamp((t - N.t) / 0.12), up = (t - N.t + lead) / 0.3, e = up < 1 ? 1 - Math.exp(-7 * up) * Math.cos(7 * up) : 1;      // (it pops in with a little overshoot, and goes out swelling)
        return { p: P0, r: [0, R[1], (N.kind === 'drag' || N.kind === 'flick' ? 0.8 * (1 - clamp(up)) : 0) + (N.kind === 'flick' ? 0.06 * Math.sin(t * 20) : 0)], s: (0.35 + 0.65 * e) * (1 + 0.25 * v) * (1 + 0.05 * pulse(t, 8)), a: clamp(up * 3) * (1 - v) * (0.75 + 0.25 * clamp(1 - (N.t - t) / LEAD)) }; } }));
      if (N.kind !== 'drag') ph.push(plane(RNG, { w: sz * 1.05, mode: 1, col: N.col, order: 6.61, sharp: true, at: (t) => { const u = (t - N.t + LEAD) / LEAD; if (u < 0 || u > 1 || !live(t)) return null; return { p: P0, r: R, s: lerp(2.6, 1.0, io(u)), a: clamp(u * 3) * 0.85 }; } }));
      ph.push(plane(RNG, { w: sz, mode: 1, col: N.col, order: 6.7, sharp: true, at: (t) => { const u = (t - N.t) / 0.45; if (u < 0 || u > 1 || !live(N.t)) return null; return { p: P0, r: R, s: 1 + 2.2 * outE(u), a: 1 - u }; } }));
      ph.push(plane(GLW, { w: sz * 2.2, mode: 1, col: N.col, order: 6.69, at: (t) => { const u = (t - N.t) / 0.3; if (u < 0 || u > 1 || !live(N.t)) return null; return { p: P0, r: R, s: 1 + 0.6 * u, a: (1 - u) * 0.9 }; } }));
      if (N.kind !== 'drag') ph.push(...burst(kit, N.t, () => P0, { size: sz * 1.9, col: N.col, order: 6.68 }).map((B) => ({ ...B, at: (t) => (live(N.t) ? B.at(t) : null) }))); }
    for (const C of chains) { const R = [0, WALLS[C.w][2], 0];
      for (let k = 0; k < 7; k++) { const A = C.pts[k], B = C.pts[k + 1], yA = scanY(A.t - 1e-4), yB = scanY(B.t - 1e-4), L = Math.hypot(B.x - A.x, yB - yA), rz = Math.atan2(yB - yA, B.x - A.x), t0 = appear(C.pts[0].t) + 0.1 + k * 0.04;
        ph.push(plane(dTex, { w: L, h: 0.05, mode: 1, col: WHITE, order: 6.6, sharp: true, at: (t) => { if (t < t0 || t > B.t || (faceAt(t) || [])[2] !== C.w) return null; const g = clamp((t - t0) / 0.2);
          return { p: wallP(C.w, (A.x + B.x) / 2, (yA + yB) / 2, 0.135), r: [R[0], R[1], rz], s: [g, 1], a: 0.85 * (1 - clamp((t - A.t) / (B.t - A.t))) }; } })); } }
    for (const Hd of holds) { const R = [0, WALLS[Hd.w][2], 0], y0 = scanY(Hd.t0 + 1e-4), y1 = scanY(Hd.t1 - 1e-4), live = (t) => (faceAt(t) || [])[2] === Hd.w;
      ph.push(plane(PT.cyHoldTex(kit, Hd.col), { w: 0.34, h: 1, order: 6.58, sharp: true, at: (t) => { const u = (t - appear(Hd.t0)) / 0.4; if (u < 0 || t > Hd.t1 || !live(t)) return null;
        const yc = t < Hd.t0 ? y0 : scanY(t), L = Math.abs(y1 - yc); if (L < 0.02) return null; return { p: wallP(Hd.w, Hd.x, (yc + y1) / 2, 0.13), r: R, s: [1, L * clamp(u * 2)], a: clamp(u * 4) }; } }));
      ph.push(plane(GLW, { w: 0.9, mode: 1, col: Hd.col, order: 6.66, at: (t) => { if (t < Hd.t0 || t > Hd.t1 || !live(t)) return null; return { p: wallP(Hd.w, Hd.x, scanY(t), 0.15), r: R, s: 1 + 0.25 * Math.sin(t * 40), a: 0.9 }; } }));
      ph.push(plane(PT.cyNoteTex(kit, 'tap', Hd.col), { w: 0.62, order: 6.67, sharp: true, at: (t) => { if (t < Hd.t0 || t > Hd.t1 || !live(t)) return null; return { p: wallP(Hd.w, Hd.x, scanY(t), 0.16), r: [0, R[1], (t - Hd.t0) * 6], s: 0.95 + 0.08 * Math.sin(t * 30) }; } }));
      ph.push(...burst(kit, Hd.t1, () => wallP(Hd.w, Hd.x, y1, 0.14), { size: 1.6, col: Hd.col, order: 6.68 }).map((B) => ({ ...B, at: (t) => (live(Hd.t1) ? B.at(t) : null) }))); }
    // each line stands on the wall it is sung to, in a game's dialogue box (type planted between the room and the lens)
    // each line in a galgame message window planted between the camera and the wall it is sung to: the singer's name plate, her face in the
    // face window (its expression changes mid-line), the line typed in, the ▼ cursor bobbing once it is sung
    const FACES = { K: ['KD_hb_smile', 'KC_hb_pout', 'KD_hb_wink', 'KC_hb_sing', 'KD_hb_heart', 'KC_hb_wink'], Y: ['YD_hb_gentle', 'YC_hb_smug', 'YK_hb_whisper', 'YC_hb_sing'] };
    const FTX = {}; for (const v of Object.values(FACES)) for (const f of v) FTX[f] = await kit.img(`materials/nai/cut/${f}.png`);
    const GW = 5.0, gl = (lx, ly) => [-GW / 2 + lx * GW / 2400, (320 - ly) * GW / 2400];      // (texture px → window-local)
    const box = (L, out, at, ry, k) => { const name = L.voice === 'Y' ? 'ヤチヨ' : 'かぐや', col = L.voice === 'Y' ? [120, 210, 255] : [255, 110, 190];
      const W3 = ([lx, ly], dz = 0) => [at[0] + Math.cos(ry) * lx + Math.sin(ry) * dz, at[1] + ly, at[2] - Math.sin(ry) * lx + Math.cos(ry) * dz];
      const on = (t) => popAt(t, L.t0 - 0.2, out - 0.3, 0);
      ph.push(plane(PT.galTex(kit, name, col), { w: GW, order: 20, sharp: true, at: (t) => { const pp = on(t); return pp && { p: at, r: [0, ry, 0], ...pp }; } }));
      const fl = FACES[L.voice === 'Y' ? 'Y' : 'K'], f0 = fl[k % fl.length], f1 = fl[(k + 1) % fl.length], tMid = L.times[Math.floor(L.times.length * 0.55)] ?? L.t0 + 1;
      const fc = gl(60 + 180, 136 + 180), FS = 330 * GW / 2400;
      ph.push(plane(FTX[f0], { w: FS, h: FS, order: 20.2, sharp: true, round: FS * 0.11, at: (t) => { const pp = on(t); if (!pp) return null; const T = FTX[t < tMid ? f0 : f1], asp = T.userData.w / T.userData.h, cw = 0.6, ch = Math.min(1, cw * asp);
        return { p: W3(fc, 0.01), r: [0, ry, 0], ...pp, s: pp.s * (1 + 0.04 * pulse(t, 7)), tex: T, crop: [0.2, 0.02, cw, ch] }; } }));
      ph.push(lyric(L, { at: W3(gl(470, 250), 0.02), rot: [0, ry, 0], maxW: 3.7, enter: 'type', size: 0.3, zhSize: 0.15, col: WHITE, ink: [40, 16, 80], chip: col, order: 20.5, out: out - 0.35 }));
      const tEnd = (L.real[L.real.length - 1] || {}).t1 ?? L.t0 + 2;
      ph.push(plane(PT.nextTex(kit), { w: 0.14, order: 20.6, sharp: true, at: (t) => { const pp = on(t); if (!pp || t < tEnd) return null; return { p: W3(gl(2290, 470 + 14 * Math.abs(Math.sin(t * 6))), 0.02), r: [0, ry, 0], a: pp.a * (0.6 + 0.4 * Math.abs(Math.sin(t * 6))) }; } })); };
    // (each window on the camera's line of sight to its wall, 4.6 ahead, low in the frame, facing the camera)
    const winAt = (look) => { const dx = look[0] - E[0], dz = look[2] - E[2], n = Math.hypot(dx, dz); return [[E[0] + dx / n * 4.6, -1.12, E[2] + dz / n * 4.6], Math.atan2(-dx / n, -dz / n)]; };
    const [WB, rB] = winAt(BACK), [WL, rL] = winAt(LEFT), [WR, rR] = winAt(RIGHT);
    box(L33, L34.t0, WB, rB, 0);
    box(L34, L35.t0, WL, rL, 1);
    box(L35, L36.t0, WB, rB, 2);
    box(L36, L37.t0, WB, rB, 0);
    box(L37, L38.t0, WR, rR, 1);
    { const FU = await kit.img('materials/nai/m_fufu.png');      // (a Miku easter egg: the official ふわぷち plush (SEGA, designed by 三月八日) sits on the message window, swaying to the beat)
      ph.push(plane(FU, { h: 0.7, pivot: [0.5, 1], order: 20.7, sharp: true, at: (t) => { const pp = popAt(t, L36.t0 + 0.3, L37.t0 - 0.35, 0.04); if (!pp) return null; const [lx, ly] = [1.9, 0.6];
        return { p: [WB[0] + Math.cos(rB) * lx, WB[1] + ly, WB[2] - Math.sin(rB) * lx + 0.02], r: [0, rB, 0.08 * Math.sin((t - L36.t0) / BEAT * Math.PI)], ...pp }; } })); }
    // a galgame CHOICE before the poster: わかってる？ / わかってない！ — the heart cursor moves to the second, and it is chosen
    const tC0 = L39.t0 - 0.95, tCm = L39.t0 - 0.45, tC1 = L39.t0 + 0.12;
    [['わかってる？', 0.32], ['わかってない！', -0.08]].forEach(([txt, y], k) => ph.push(plane(PT.choiceTex(kit, txt, false), { w: 1.9, order: 52 + k * 0.01, sharp: true, at: (t) => { const pp = popAt(t, tC0 + k * 0.08, tC1, 0); if (!pp) return null; const sel = (k === 0 && t < tCm) || (k === 1 && t >= tCm), fl = k === 1 && t > L39.t0 - 0.1 ? 0.5 + 0.5 * Math.sin(t * 60) : 1;
      return { ...inCamAt(cam, 3, 0, y)(t), ...pp, tex: PT.choiceTex(kit, txt, sel), s: pp.s * (sel ? 1.06 : 1), a: pp.a * fl }; } })));
    // 「おててが空いてます」: a ribbon spread across the middle of the room turns over in one wave and is swept away
    ph.push(...(await ribbon(kit, CHARS.slice(0, 12), L35.t0 - 0.05, L35.t0 + 0.45, null, L36.t0 - 0.45, { c: [0, -0.55, -1.6], span: 4.4, size: 0.62, order: 22, curve: 0.4 })));
    // the riffle shuffle in the middle of the room: gold and silver decks riffle into one and bridge up in a cascade
    const tR0 = L36.t0 - 0.1, tR1 = tR0 + 0.7, tBr = L37.t0 + 0.3, tRo = L37.t1 + 0.1, GN = ['KC_wink', 'KD_peace', 'KC_heart', 'KD_heart', 'KC_jump', 'KD_jump'], SN = ['YC_wave', 'YD_heart', 'YC_kiss', 'YD_kiss', 'YD_twirl', 'YD_point'];
    for (let i = 0; i < 12; i++) { const side = i % 2 ? 1 : -1, k = Math.floor(i / 2), nm = (side < 0 ? GN : SN)[k % 6], tDrop = tR1 + i * 0.07;
      ph.push(await cardFace(kit, nm, (t) => { if (t < tR0 || t > tRo + 0.5) return null; const u = clamp((t - tR0) / 0.6), e = outE(u);
        let p = [side * lerp(5, 0.9, e), -0.25 + k * 0.01, -1.7 - k * 0.006], r = [-0.9, 0, side * 0.15];
        const v = clamp((t - tDrop) / 0.18); if (v > 0) { p = lerp3(p, [0, -0.25 + i * 0.01, -1.7 - i * 0.005], io(v)); r = [-0.9, 0, side * 0.15 * (1 - v)]; p[1] += Math.sin(v * Math.PI) * 0.18; }
        const w2 = clamp((t - tBr - i * 0.06) / 0.5); if (w2 > 0) { const a2 = lerp(-0.4, Math.PI + 0.4, io(w2)); p = [Math.cos(a2) * -1.0, -0.25 + Math.sin(a2) * 0.8 + i * 0.008, -1.7]; r = [-0.9 * (1 - w2), 0, a2 - Math.PI / 2]; }
        const x = clamp((t - tRo) / 0.5); if (x > 0) p = [p[0] + side * x * 4, p[1] + x * 1.5, p[2]];
        return { p, r, a: 1 - sm((x - 0.6) / 0.4) }; }, { size: 0.85, order: 24 + i * 0.03, shadow: false, walls: 2 })); }
    // the hook: the camera looks down at the floor — the line lies there; cards thrown across it, one a beat, trailing light
    ph.push(deco(kit, L38.text, { font: 'DelaGothic', px: 220, size: 0.6, align: 'center', at: [0, -2.05, -1.4], rot: [-Math.PI / 2 + 0.1, 0, 0], times: L38.times, enter: 'pop', col: [255, 236, 120], ink: [120, 20, 70], strokeK: 0.14, order: 25, out: L39.t0 - 0.05, follow: false }));
    ph.push(letters(kit, L38.zh, { font: 'ChillRound', px: 160, size: 0.28, align: 'center', at: [0, -2.05, -0.5], rot: [-Math.PI / 2 + 0.1, 0, 0], times: L38.zhTimes(L38.zh, { lag: 0.05 }), enter: 'pop', col: WHITE, order: 25.1, out: L39.t0 - 0.05, follow: false }));
    const thr = []; for (let k = 0; k < 9; k++) { const tb = L38.t0 + 0.35 + k * BEAT, sd = k % 2 ? 1 : -1; thr.push([tb, CHARS[(k * 3) % CHARS.length], [sd * 4.5, -1.3, -0.6 - (k % 3) * 0.5], [-sd * 4.5, -0.8, -2.0 - (k % 2) * 0.6]]); }
    ph.push(...(await throws(kit, thr, { size: 0.75, order: 26, trail: [255, 226, 160], arc: 0.5 })));
    // 「わかってないわ…」: a poster, both languages huge, a 360° fan of cards turning behind the words
    const poster = (t) => (t > L39.t0 - 0.04 && t < tYeah - 0.05);
    ph.push(plane(PT.blockTex(kit), { w: 9, h: 5.2, mode: 1, col: [255, 70, 150], order: 30, at: (t) => (poster(t) ? { p: [0, 0.2, -0.4], r: [0, 0, 0] } : null) }));
    ph.push(deco(kit, 'わかってない', { font: 'DelaGothic', px: 300, size: 0.62, align: 'center', at: [0, 0.5, -0.32], times: [L39.t0], enter: 'pop', col: WHITE, ink: [40, 10, 60], strokeK: 0.1, order: 31, out: tYeah - 0.06, follow: false }));
    ph.push(letters(kit, '你根本不懂', { font: 'ChillRound', px: 200, size: 0.52, align: 'center', at: [0, -0.35, -0.32], times: [L39.t0 + 0.25], enter: 'pop', col: [255, 236, 120], order: 31.1, out: tYeah - 0.06, follow: false }));
    ph.push(...(await fanWheel(kit, CHARS.slice(2, 12), L39.t0 - 0.02, tYeah - 0.1, [0, 0.1, -0.37], { R: 1.25, size: 0.55, order: 30.3, spin: 1.6 })));
    // the jewelled branch grows a step each beat of the hook beside the back wall, and shatters on 「Yeah」
    ph.push(...(await holoCard(kit, [[L38.t0 - 0.05, 'TR4']], { at: [2.2, 0.35, -2.4], size: 1.4, order: 15, sparks: 8, from: 1.5, out: tYeah - 0.02, outStyle: 'none', rz: -0.08,
      anim: (t) => { const n = Math.max(0, Math.floor((t - L38.t0) / BEAT)); return { s: 0.7 + Math.min(n, 14) * 0.05 + 0.06 * pulse(t, 8) }; }, fxAt: (t) => (t > tYeah - 0.05 ? { dissolve: 1 - clamp((t - tYeah + 0.05) / 0.3) } : null) })));
    ph.push(...burst(kit, tYeah, () => [2.2, 0.35, -2.3], { size: 4, col: [120, 255, 200], order: 14 }));
    ph.push(plane(PT.judgeTex(kit, 'ALL PERFECT!', [255, 120, 210], [255, 236, 140], 200), { w: 2.8, order: 55, sharp: true, at: (t) => { const pp = popAt(t, tYeah, tYeah + 1.3, 0.04); return pp && { ...inCamAt(cam, 3, 0, 0.05)(t), ...pp }; } }));
    ph.push(plane(PT.pixWordTex(kit, 'FULL COMBO', [255, 236, 140], [255, 120, 210], 160), { w: 2.0, order: 55, sharp: true, at: (t) => { const pp = popAt(t, tYeah + 1.4, T1 - 0.3); return pp && { ...inCamAt(cam, 3, 0, -0.35)(t), ...pp }; } }));
    ph.push(plane(PT.pixWordTex(kit, '♥ LOVE MAX', [255, 120, 200], [255, 214, 120], 170), { w: 1.8, order: 55, sharp: true, at: (t) => { const pp = popAt(t, tYeah + 1.4, T1 - 0.3); return pp && { ...inCamAt(cam, 3, 0, 0.3)(t), ...pp }; } }));
    for (let i = 0; i < 26; i++) { const x0 = -4.5 + hash(i * 3.3) * 9, z0 = -4 + hash(i * 7.1) * 4.6, t0 = tYeah + 0.6 + hash(i * 1.9) * 2.6, sp = (hash(i * 4.4) - 0.5) * 6;
      ph.push(await cardFace(kit, i % 3 ? null : NAMES_C2[i % NAMES_C2.length], (t) => { const u = (t - t0) / 2.0; if (u < 0 || u > 1) return null; return { p: [x0 + Math.sin(u * 4 + i) * 0.4, 4.2 - u * 9, z0], r: [sp * u, sp * 0.6 * u, sp * 0.3 * u] }; }, { size: 0.8, order: 8 + i * 0.03, shadow: false, walls: 2 })); }
    sets.push({ t0: T0, t1: T1, planes: ph, cam, bg: () => ({ top: [30, 10, 40], bot: [10, 4, 16] }), ground: () => ({ kind: 3, pulse: 0 }),
      post: (t) => ({ bloom: 0.36, thr: 0.75, ca: 0.0022 * pulse(t, 8), grain: 0.03, vig: 0.36, glitch: (t < T0 + 0.06 ? 0.6 : 0) + (Math.abs(t - tYeah) < 0.05 ? 0.7 : 0) }) });
  }

  // ---------------------------------------- break: one card in the void, turning to a line of light ----------------------------------------
  const tBr0 = bar(79), tBr1 = bar(80), menuTurn = (t) => Math.PI / 2 * io(clamp((t - tBr0 - 0.2) / (tBr1 - tBr0 - 0.3)));
  {
    const ph = [], L40 = ln(40);
    ph.push(await cardFace(kit, null, (t) => ({ p: [0, 0.05, 0], r: [-0.04, menuTurn(t), 0.02], s: 1 }), { size: 2.6, order: 5, shadow: false, walls: 3, bank: false }));
    ph.push(letters(kit, L40.text, { font: 'Unbounded', px: 120, size: 0.16, align: 'center', at: [0, -1.75, 0.3], times: L40.times, enter: 'type', col: [214, 196, 255], order: 6, out: tBr1, follow: false }));
    // (the void dressed: a circle behind the card, a smaller one turning the other way, and one lying under it like a summoning circle)
    ph.push(sigil(kit, { w: 7.4, order: 2, col: [255, 214, 150], at: (t) => ({ p: [0, 0.05, -1.4], r: [0, 0, (t - tBr0) * 0.12], a: 0.75 * clamp((t - tBr0) / 0.5) }) }),
      sigil(kit, { w: 4.6, order: 2.1, col: [214, 190, 255], pearl: 0.4, at: (t) => ({ p: [0, 0.05, -0.7], r: [0, 0, 0.4 - (t - tBr0) * 0.25], a: 0.6 * clamp((t - tBr0 - 0.15) / 0.5) }) }),
      sigil(kit, { w: 4.4, order: 4.5, col: [255, 226, 170], at: (t) => ({ p: [0, -1.6, 0], r: [-Math.PI / 2 + 0.28, 0, (t - tBr0) * 0.2], a: 0.85 * clamp((t - tBr0 - 0.3) / 0.5) }) }));
    for (let b = 0; b < 4; b++) { const tb = tBr0 + 0.25 + b * BEAT; ph.push(plane(PT.ringTex(kit, 'thin', 0.012), { w: 1, mode: 1, col: [255, 226, 170], order: 4.6, sharp: true, at: (t) => { const u = (t - tb) / 1.1; if (u < 0 || u > 1) return null; return { p: [0, -1.6, 0], r: [-Math.PI / 2 + 0.28, 0, 0], s: lerp(1.2, 6, outE(u)), a: (1 - u) * 0.7 }; } })); }
    sets.push({ t0: tBr0, t1: tBr1, planes: ph, cam: () => ({ p: [0, 0, 7.4], look: [0, 0, 0], fov: 36, focus: 7.4, dof: 0.2 }), bg: () => ({ top: [6, 4, 12], bot: [2, 2, 6] }), ground: () => ({ kind: 4, a: 0.25 }),
      post: () => ({ bloom: 0.3, thr: 0.8, grain: 0.04, vig: 0.55 }) });
  }

  // ---------------------------------------- bridge: THE POP-UP BOOK — candy pop dream (其の五「仏の御石の鉢」), and 我慢します (PLAN-v3) ----------------------------------------
  // An open book lies on the floor; the camera trucks sideways along it; each line's page of cut-outs (the window, sweets, the card, a
  // figure, the line itself) folds UP from the paper as the camera reaches it — a pop-up book — and 「我慢します」 stands huge and hairline
  // behind everything. At the end the camera whips back to the pudding's card and goes into its dish (the moon).
  {
    const T0 = tBr1, T1 = bar(89), TB = 185.3, ph = [], [L41, L42, L43, L44, L45, L46] = [41, 42, 43, 44, 45, 46].map(ln), PY = -2.2;
    const SWT = await Promise.all([...Array(8).keys()].map((i) => kit.img(`materials/gpt/sweet_${i}.png`)));
    // the camera trucks at a steady pace; each page is centred where the view is at the middle of its line (the look point runs 1.7 ahead)
    const camX = (t) => lerp(-11.5, 13.4, clamp((t - T0) / (T1 - 0.1 - T0))), LS = [L41, L42, L43, L44, L45, L46], nextT = (L) => (LS[LS.indexOf(L) + 1] || { t0: T1 }).t0;
    const SEG = LS.map((L) => [L, camX((L.t0 + nextT(L)) / 2) + 1.7]), segX = (L) => SEG.find((e) => e[0] === L)[1];
    // a line glides along with the camera at 60% of its speed (readable for the whole line, still a little parallax)
    const slide = (planes, L) => { const m = (L.t0 + nextT(L)) / 2; return planes.map((P) => { const at0 = P.at; return { ...P, at: (t) => { const st = at0(t); if (!st) return null; const p = st.p || [0, 0, 0]; return { ...st, p: [p[0] + 0.6 * (camX(t) - camX(m)), p[1], p[2]] }; } }; }); };
    // pop-up: every plane of a group turns about a hinge lying on the page (the line y = PY, z = hz) from flat (−90°) to standing, with a
    // little overshoot, when the camera arrives — its own pops and motion kept
    const foldUp = (planes, hz, tF) => planes.map((P) => { const at0 = P.at; return { ...P, at: (t) => { const st = at0(t); if (!st) return null; const u = (t - tF) / 0.5;
      const th = u <= 0 ? -Math.PI / 2 : u >= 1 ? 0 : -Math.PI / 2 * (1 - (1 - Math.exp(-5 * u) * Math.cos(6 * u)));
      const p = st.p || [0, 0, 0], dy = p[1] - PY, dz = p[2] - hz, c = Math.cos(th), sn = Math.sin(th), r = st.r || [0, 0, 0];
      return { ...st, p: [p[0], PY + dy * c - dz * sn, hz + dy * sn + dz * c], r: [r[0] + th, r[1], r[2]] }; } }; });
    // the page, and the camera trucking along it
    ph.push(plane(PT.bookPageTex(kit), { w: 30, h: 9.4, order: 0.6, at: (t) => ({ p: [2, PY - 0.01, 0.6], r: [-Math.PI / 2, 0, 0], a: clamp((t - T0) / 0.5) * (1 - sm((t - T1) / 0.6)) }) }));
    const camE = camTrack([{ t: T1 - 0.1, p: [13.4, 0.55, 7.2], look: [15.1, -0.35, 0] }, { t: T1 + 0.5, p: [0.3, 0.2, 9.0], look: [0, 0.1, 0] }, { t: TB - 0.3, p: [0, -0.15, 1.6], look: [0, -0.2, 0] }, { t: TB, p: [0, -0.2, 0.7], look: [0, -0.2, 0] }]);
    const camB = (t) => (t < T1 - 0.1 ? { p: [camX(t), 0.55 + 0.18 * Math.sin(t * 0.9), 7.2], look: [camX(t) + 1.7, -0.35, 0], roll: 0.02 * Math.sin(t * 0.7) } : camE(t)), cam = (t) => ({ ...camB(t), fov: 42, focus: 7.4, dof: 0.18, maxBlur: 8 });
    const bcol = { font: 'HachiMaru', col: [236, 70, 150], ink: WHITE, chip: [255, 120, 190], strokeK: 0.22 };
    const sweet = (i, t0, t1, p, w, rz = 0) => plane(SWT[i], { w, order: 8, sharp: true, shadow: { d: 0.05, dx: 0.08, dy: 0.1, a: 0.25, bias: 3 }, at: (t) => { const pp = popAt(t, t0, t1, 0.03); return pp && { p: [p[0], p[1] + 0.05 * Math.sin(t * 1.3 + i), p[2]], r: [0, 0, rz + 0.04 * Math.sin(t * 0.9 + i)], ...pp }; } });
    const page = async (L, out, build) => { const x = segX(L), grp = await build(x); ph.push(...foldUp(grp, 0.2, L.t0 - 0.45)); };
    const sLyric = (L, o) => slide(lyric(L, { ...bcol, at: [segX(L) + (o.dx ?? 0), o.y ?? -0.95, 1.3], size: 0.38, maxW: 4.0, align: 'center', out: nextT(L) - 0.06, ...o }), L);
    // 1 · the shortcake: Iroha eating one (the film) in a rounded window, the cake and a strawberry, Kaguya in her festival yukata
    await page(L41, L42.t0, async (x) => [
      ...finder(kit, clipC('p_cake', L41.t0, 1, 0), { w: 3.9, order: 3, frameCol: [255, 200, 226], at: (t) => { const pp = popAt(t, L41.t0 - 0.45, L42.t0 + 0.6, 0); return pp && { p: [x - 0.3, 0.35, -0.6], r: [0, -0.1, 0.02], ...pp }; } }),
      sweet(0, part(L41, 'ショート', 1.4), L42.t0 + 0.6, [x - 2.6, -0.9, 1.0], 1.6, 0.1), sweet(7, part(L41, 'いちご', 0.1), L42.t0 + 0.6, [x - 3.2, -1.6, 1.5], 0.8, -0.2),
      ...(await figure(kit, 'LKY_heart', { at: [x + 2.6, PY, 0.9], h: 2.9, t0: L41.t0 - 0.45, t1: L42.t0 + 0.8, order: 6, motif: false })),
    ]);
    ph.push(...sLyric(L41, {}));
    // 2 · the pudding: the café window, its card (仏の御石の鉢 — the stone bowl, here a dish of pudding), the sticker; the princess twirls
    await page(L42, L43.t0, async (x) => [
      ...finder(kit, clipC('p_cafe', L42.t0, 1, 20), { w: 3.8, order: 3, frameCol: [255, 226, 170], at: (t) => { const pp = popAt(t, L42.t0 - 0.45, L43.t0 + 0.6, 0); return pp && { p: [x - 0.2, 0.35, -0.7], r: [0, 0.1, -0.02], ...pp }; } }),
      ...(await holoCard(kit, [[L42.t0 + 0.1, 'TR5']], { at: [x + 2.5, 0.0, 0.6], size: 2.2, order: 9, sparks: 8, from: 1.5, out: L43.t0 + 0.4, rz: 0.06 })),
      sweet(1, part(L42, 'プリン', 2.4), L43.t0 + 0.6, [x + 1.4, -1.5, 1.6], 1.2, -0.08),
      ...(await figure(kit, 'LKH_twirl', { at: [x - 2.7, PY, 0.8], h: 3.0, t0: L42.t0 - 0.4, t1: L43.t0 + 0.8, order: 6 })),
    ]);
    ph.push(...sLyric(L42, {}));
    // 3 · 「みんな みんな 我慢します」: the five treasures in a row — each stamped ✕ and turned face down, a beat apart
    const tG = L43.t0, rowX = (k) => (k - 2) * 1.45;
    await page(L43, L44.t0, async (x) => { const g = [];
      for (let k = 0; k < 5; k++) { const tx = tG + 0.25 + k * BEAT * 0.75, tf = tx + 0.28;
        g.push(...(await holoCard(kit, [[tG - 0.3 + k * 0.05, 'TR' + (k + 1)]], { at: [x + rowX(k), -0.3, 0.6], size: 1.6, order: 10 + k * 0.03, sparks: 0, from: 1.4, out: L44.t0 + 0.6, anim: (t) => ({ dr: [0, Math.PI * io(clamp((t - tf) / 0.35)), 0] }) })));
        g.push(deco(kit, '✕', { font: 'DelaGothic', px: 260, size: 1.2, align: 'center', at: [x + rowX(k), -0.35, 0.8], times: [tx], enter: 'pop', col: [255, 60, 110], ink: WHITE, strokeK: 0.12, order: 11 + k * 0.03, out: tf + 0.12, follow: false })); }
      return g; });
    ph.push(...sLyric(L43, { y: -1.4, maxW: 5.0 }));
    ph.push(letters(kit, '我慢します', { font: 'DelaGothic', px: 320, size: 3.2, align: 'center', at: [0.8, 0.6, -3.6], times: [tG + 0.1], enter: 'pop', stroke: 3, col: [255, 236, 250], alpha: 0.6, order: 1.5, out: L46.t0, outDur: 0.3, follow: false }));
    ph.push(letters(kit, '全部都忍耐', { font: 'ChillRound', px: 200, size: 0.7, align: 'center', at: [0.8, -1.3, -3.2], times: [tG + 0.6], enter: 'pop', stroke: 3, col: [255, 236, 250], alpha: 0.65, order: 1.6, out: L46.t0, outDur: 0.3, follow: false }));
    // 4 · SKILL GET (我慢 Lv.MAX), the pancakes, Iroha in her yukata
    await page(L44, L45.t0, async (x) => [
      plane(PT.windowTex(kit, 'skill', 'SKILL GET!', [['我慢 忍耐', 'Lv.MAX', [255, 140, 210]], ['わがまま 任性', '-100', [120, 230, 255]]]), { w: 3.0, order: 12, sharp: true, at: (t) => { const pp = popAt(t, L44.t0 - 0.45, L45.t0 + 0.6); return pp && { p: [x - 0.2, 0.6, 0.2], r: [0, -0.1, 0.02], ...pp }; } }),
      await motif(kit, 'pancakes', L44.t0 - 0.3, L45.t0 + 0.6, [x - 2.7, -1.3, 1.0], 1.6, { order: 9.5, rz: 0.06 }),
      await motif(kit, 'fufu2', L44.t0 - 0.1, L45.t0 + 0.6, [x - 1.3, -1.95, 1.3], 0.95, { order: 9.6 }),      // (a Miku easter egg: the lying ふわぷち on the page)
      ...(await figure(kit, 'LIY_twirl', { at: [x + 2.7, PY, 0.9], h: 2.9, t0: L44.t0 - 0.4, t1: L45.t0 + 0.8, order: 6, motif: 'keyboard' })),
    ].flat());
    ph.push(...sLyric(L44, {}));
    // 5 · LEVEL UP!: a burst, the pixel items flung out, Kaguya jumping
    await page(L45, L46.t0, async (x) => [
      plane(PT.pixWordTex(kit, 'LEVEL UP!', [255, 236, 140], [255, 140, 210], 180), { w: 2.5, order: 13, sharp: true, at: (t) => { const pp = popAt(t, L45.t0, L46.t0 + 0.4, 0.04); return pp && { p: [x + 0.6, 1.0, 0.9], r: [0, 0, -0.04], ...pp }; } }),
      ...['heart', 'star', 'coin', 'gem', 'note', 'negi', 'key', 'crown'].map((k, i) => { const a = (i / 8) * Math.PI * 2; return plane(PT.pixTex(kit, k), { w: 0.38, order: 13.2, sharp: true, at: (t) => { const u = (t - L45.t0) / 1.2; if (u < 0 || u > 1) return null;
        return { p: [x + 0.6 + Math.cos(a) * 2.1 * outE(u), 1.0 + Math.sin(a) * 1.2 * outE(u) - u * u * 0.8, 1.0], s: 1, a: 1 - sm((u - 0.7) / 0.3) }; } }); }),
      ...(await figure(kit, 'LKD_jump', { at: [x - 2.2, PY, 0.7], h: 3.1, t0: L45.t0 - 0.4, t1: L46.t0 + 0.8, order: 6 })),
    ]);
    ph.push(...sLyric(L45, {}));
    ph.push(...burst(kit, L45.t0, () => [segX(L45) + 0.6, 1.0, 0.8], { size: 4.5, col: [255, 236, 140], order: 12.5 }));
    // 6 · 「あとで後悔するわよ」: the WARNING band slams across the last page
    ph.push(...warnBand(kit, L46, '之后会后悔的哦', () => ({ p: [segX(L46), -1.15, 1.8], rz: 0.04 }), { out: T1 - 0.1, order: 14, w: 26, h: 0.8, size: 0.38, move: (t) => [0.6 * (camX(t) - camX((L46.t0 + T1) / 2)), 0, 0] }));
    await page(L46, T1, async (x) => [...(await figure(kit, 'LKK_jump', { at: [x - 2.4, PY, 0.5], h: 3.0, t0: L46.t0 - 0.3, t1: T1 + 0.2, order: 6 })),
      ...(await figure(kit, 'LKH_reach', { at: [x + 2.4, PY, -0.3], h: 3.2, t0: L46.t0 + BEAT * 2, t1: T1 + 0.2, order: 5.5, motif: false }))]);
    ph.push(plane(PT.pixTex(kit, 'negi'), { w: 0.6, order: 15, sharp: true, at: (t) => ({ p: [camX(t) * 0.0 + 4.2 + 0.2 * Math.sin(t * 0.6), 2.0 + 0.15 * Math.sin(t * 0.9), 2.4], r: [0, 0, 0.3 * Math.sin(t * 0.5)], a: clamp((t - L44.t0) / 0.4) * (t > T1 ? 1 - sm((t - T1) / 0.4) : 1) }) }));      // (a Miku easter egg)
    // sweets drifting over the book in three depths
    for (let k = 0; k < 14; k++) { const i = 2 + (k % 5), x = -12 + k * 1.9, y = [1.9, 2.3, 2.4, 1.2][k % 4], z = [-1.6, 3.0, -0.6, 2.2][k % 4], w = [1.0, 0.7, 1.2, 0.8][k % 4];
      ph.push(plane(SWT[i], { w, order: z > 1 ? 15 : 1.8, at: (t) => ({ p: [x + 0.15 * Math.sin(t * 0.5 + k), y + 0.12 * Math.sin(t * 0.7 + k * 2), z], r: [0, 0, 0.1 * Math.sin(t * 0.4 + k)], a: clamp((t - T0) / 0.6) * (t > T1 ? 1 - sm((t - T1) / 0.4) : 1) }) })); }
    ph.push(...(await backbone(kit, { t0: T0 + 0.4, t1: T1, c: [0.8, 0.6, -4.2], dialCol: [255, 150, 200], dialCol2: [150, 230, 220], raysCol: [255, 220, 240], ghost: 'SWEETS', ghostCol: [255, 140, 200], ringCol: [255, 200, 230], airCol: [[255, 190, 230], [190, 240, 230], [255, 236, 160], [214, 196, 255]] })));
    // the build: the pudding's card comes to the middle, the lens goes into its round dish — a crater — the full moon (into the final)
    ph.push(...(await holoCard(kit, [[T1 - 0.05, 'TR5']], { at: [0, 0.05, 0], size: 3.2, order: 9, sparks: 10, from: 0, out: TB + 0.1, outStyle: 'none' })));
    ph.push(...burst(kit, TB - 0.35, () => [0, -0.2, 0.6], { size: 9, col: [255, 246, 220], order: 9.5 }));
    sets.push({ t0: T0, t1: TB, planes: ph, cam, bg: () => ({ top: [255, 214, 236], bot: [214, 240, 236] }), ground: (t) => ({ kind: t < T1 ? 2 : 4, a: t < T1 ? 1 : 0.6 }),
      post: (t) => ({ bloom: 0.26, thr: 0.82, exp: 0.88, ca: 0.001 * pulse(t, 7), grain: 0.03, vig: t < T1 ? 0.16 : 0.4 }) });
  }

  // ---------------------------------------- final: five treasures, a crown; the stage again; the hug as nothing but the film; ALL CLEAR ----------------------------------------
  const FL = (t) => live(t - 126.38);      // (the film's own performance of this melody — chorus 1 — under the final chorus)
  const tHug0 = 196.08, tHug1 = 198.08;
  {
    const T0 = 185.3, T1 = tHug0, ph = [], [L47, L48, L49, L50] = [47, 48, 49, 50].map(ln);
    const camF = camTrack([{ t: T0, p: [0, 0, 10.5], look: [0, 0, 0] }, { t: L47.t0 + 0.3, p: [0, 0.1, 7.5], look: [0, 0, -2] }, { t: L48.t0 - 0.05, p: [0, 0.1, 0.4], look: [0, 0.1, -9] }, { t: L49.t0, p: [0.6, 0.2, -1.0], look: [0, 0.1, -9] },
      { t: L50.t0, p: [-0.4, 0.1, -0.6], look: [0, 0.1, -9] }, { t: T1, p: [0.2, 0.3, 1.6], look: [0, 0.1, -9] }]);
    const cam = travel((t) => ({ ...camF(t), fov: lerp(40, 54, io(clamp((t - L48.t0 + 0.6) / 1.2))), focus: 9, dof: 0.2, maxBlur: 8, roll: 0.06 * Math.sin((t - T0) * 0.5) }), 0.1);
    // 「当然です！」: the five treasures fly back from five sides into a crown — a ring the camera goes through
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + Math.PI / 2, from = [Math.cos(a) * 9, Math.sin(a) * 6, -4], tk = T0 + 0.2 + k * 0.12;
      ph.push(...(await holoCard(kit, [[tk, 'TR' + (k + 1)]], { at: [0, 0, 0], size: 1.5, order: 10 + k * 0.03, sparks: 6, from: 0, out: L48.t0 - 0.2, outStyle: 'none',
        pos: (t) => { const u = clamp((t - tk) / 0.7), e = outE(u), ang = a + (t - T0) * 0.6; return lerp3(from, [Math.cos(ang) * 2.1, Math.sin(ang) * 1.5, 2.0], e); },
        anim: (t) => ({ dr: [0, 0, (a + (t - T0) * 0.6) - Math.PI / 2] }) }))); }
    ph.push(plane(PT.pixTex(kit, 'crown'), { w: 0.9, order: 12, sharp: true, at: (t) => { const pp = popAt(t, L47.t0 + 0.6, L48.t0 - 0.3); return pp && { p: [0, 1.75, 2.0], ...pp }; } }));
    ph.push(lyric(L47, { font: 'DelaGothic', size: 0.6, align: 'center', at: [-2.6, -0.2, 3.2], col: K_GOLD, ink: [80, 30, 0], chip: [150, 80, 0], enter: 'zoom', out: L48.t0 - 0.15 }));
    // the stage window (the film's chorus) at the end of the ring; the gacha of three; Yachiyo's first live on 「ちゃんと見ててよね」
    const winSrc = (t) => (t < L49.t0 - 0.05 ? FL(t) : t < L50.t0 - 0.05 ? seqSrc([[L49.t0 - 0.05, 'y_appear'], [L49.t0 + 1.0, 'y_close']])(t) : clipC('y_final', L50.t0 - 0.05, 1, 0)(t));
    ph.push(...finder(kit, winSrc, { w: 6.2, order: 3, at: (t) => (t < L48.t0 - 0.6 ? null : { p: [0, 0.4, -9], r: [0, 0, 0], a: clamp((t - L48.t0 + 0.6) / 0.4) }) }));
    const segs = [part(L48, '世界', 0), part(L48, '一番', 0.8), part(L48, 'おひめ', 1.6)];
    for (const [k, nm] of [['KD_peace', 0], ['YD_heart', 1], ['IC_cool', 2]].map(([n, i]) => [i, n])) { const x = (k - 1) * 2.0, tr = segs[k] - 0.05;
      ph.push(...(await holoCard(kit, [[L48.t0 - 0.35, nm]], { at: [x, -1.25, -5.4], size: 1.9, order: 14 + k * 0.03, sparks: 8, from: 0, reveal: tr, out: L49.t0 - 0.1 })));
      ph.push(...burst(kit, tr + 0.2, () => [x, -1.25, -5.5], { size: 3.2, col: [K_GOLD, Y_SILVER, [190, 150, 255]][k], order: 13.9 })); }
    [[L48, L49.t0, [0, 2.05, -5.0]], [L49, L50.t0, [0, -2.0, -5.0]], [L50, T1, [0, -2.0, -5.0]]].forEach(([L, out, at]) => ph.push(lyric(L, { at, size: 0.46, align: 'center', maxW: 6.4, col: L.col, ink: [40, 16, 70], out: out - 0.05 })));
    ph.push(...(await backbone(kit, { t0: L48.t0 - 0.5, t1: T1, c: [0, 0.4, -9], ghost: 'おひめさま', ghostCol: [255, 200, 230], orbit: { R: 5.2, n: 12, tilt: 0.5, front: 12 } })));
    const hits = []; for (let tb = beatT(Math.ceil(beatOf(L48.t0))); tb < T1 - 0.2; tb += BEAT * 2) hits.push(tb);
    ph.push(...judges(kit, hits, inCamAt(cam, 3, 1.2, -0.3), { w: 0.6, order: 48 }));
    // THE SPHERE (PLAN-v3): once through the crown, the camera is inside a sphere of cards — all the singers — that turns about it and
    // flips in waves (a wave runs from the floor to the top every two beats, each card turning face ↔ back as it passes); the stage ahead
    const SC = [0, 0.2, -2.6], SR = 6.2, tS = L48.t0 - 0.6, waves = []; for (let tb = beatT(Math.ceil(beatOf(L48.t0))); tb < T1; tb += BEAT * 2) waves.push(tb);
    for (let i = 0, n = 0; i < 130 && n < 64; i++) { const y = 1 - (2 * (i + 0.5)) / 130, r = Math.sqrt(1 - y * y), th = i * 2.39996, d0 = [Math.cos(th) * r, y, Math.sin(th) * r];
      if (d0[2] > 0.55 || (d0[2] < -0.86 && Math.abs(d0[1]) < 0.35 && Math.abs(d0[0]) < 0.45)) continue;      // (none behind the lens; a gap where the stage window is)
      const k = n++, nm = k % 2 ? null : CHARS[(k / 2) % CHARS.length], tIn = tS + hash(k * 3.7) * 0.6;
      ph.push(await cardFace(kit, nm, (t) => { if (t < tIn || t > T1 + 0.05) return null; const u = outE(clamp((t - tIn) / 0.7)), sp = (t - tS) * 0.16, c = Math.cos(sp), s2 = Math.sin(sp);
        const d = [d0[0] * c - d0[2] * s2, d0[1], d0[0] * s2 + d0[2] * c], R = SR * (1.6 - 0.6 * u);
        let fl = 0; for (const tw of waves) fl += io(clamp((t - tw - (d[1] + 1) * 0.22) / 0.3));
        return { p: [SC[0] + d[0] * R, SC[1] + d[1] * R, SC[2] + d[2] * R], r: [Math.asin(d[1]), Math.atan2(-d[0], -d[2]) + Math.PI * fl, 0], s: 1, a: clamp((t - tIn) * 3) }; },
        { size: 1.9, order: 2 + k * 0.001, shadow: false, walls: 1, bank: false })); }
    sets.push({ t0: T0, t1: T1, planes: ph, cam, bg: () => ({ top: [30, 10, 40], bot: [10, 4, 16] }), ground: () => ({ kind: 3, pulse: 0 }),
      post: (t) => ({ bloom: 0.36, thr: 0.76, ca: 0.002 * pulse(t, 8), grain: 0.03, vig: 0.34 }) });
  }
  // 「ふいに抱きしめられた」: the film nearly alone — the one moment that is the film's own picture (PLAN-v2), now styled as a memory (the user,
  // 2026-11-24: "原片可以做一些精致的且富有设计感的画面风格化处理"): the footage look at full strength, a slow push, letterbox bars sliding in
  // with a small memory mark and the line in them, an inset hairline frame, a light sweeping across once, sparkles drifting through
  {
    const L51 = ln(51), ph = [], H0 = tHug0, H1 = tHug1;
    ph.push(plane(null, { w: 16.4, h: 9.225, footage: clipC('f_hug1', H0, 0.85, 0), order: 1, look: { a: 1, glow: 1.0, leak: 0.95, ink: 0.7, grade: 1.2, thr: 0.5 }, at: () => ({ p: [0, 0, 0] }) }));
    const bar_ = (sd) => plane(PT.blockTex(kit), { w: 18, h: 1.0, mode: 1, col: [12, 6, 22], order: 5, at: (t) => { const u = outE(clamp((t - H0) / 0.35)), v = clamp((t - H1 + 0.18) / 0.18); return { p: [0, sd * (3.42 + 0.95 * (1 - u) + 0.95 * v), 2.0], a: 0.94 }; } });      // (at z 2 the frame's edge is ±3.85: bars 1.0 tall sit just inside)
    ph.push(bar_(1), bar_(-1));
    ph.push(letters(kit, '♡ MEMORY · 2030 · TSUKUYOMI', { font: 'VT323', px: 120, size: 0.2, align: 'left', at: [-5.6, 3.36, 2.05], times: [...'♡ MEMORY · 2030 · TSUKUYOMI'].map((_, j) => H0 + 0.25 + j * 0.02), enter: 'type', col: [255, 190, 220], order: 5.2, out: H1 - 0.1, follow: false }));
    ph.push(letters(kit, 'REC ●', { font: 'VT323', px: 120, size: 0.2, align: 'left', at: [5.0, 3.36, 2.05], times: [H0 + 0.3], enter: 'pop', col: [255, 90, 120], order: 5.2, out: H1 - 0.1, follow: false }));
    ph.push(...glossLine(kit, L51, { mode: 'beside', font: 'HachiMaru', px: 180, size: 0.3, zhSize: 0.15, align: 'center', at: [0, -3.38, 2.05], maxW: 9, enter: 'pop', col: WHITE, ink: [200, 60, 130], strokeK: 0.12, chip: [255, 140, 200], chipInk: WHITE, order: 5.4, out: H1 - 0.08 }));
    ph.push(plane(PT.holoFrameTex(kit), { w: 13.6, h: 6.1, mode: 1, col: [255, 236, 246], order: 3, at: (t) => ({ p: [0, 0, 1.0], a: 0.55 * clamp((t - H0 - 0.15) / 0.3) * (1 - clamp((t - H1 + 0.15) / 0.15)) }) }));
    ph.push(plane(PT.glowTex(kit), { w: 6, mode: 1, col: [255, 214, 230], order: 4, at: (t) => { const u = (t - H0 - 0.45) / 1.1; if (u < 0 || u > 1) return null; return { p: [lerp(-11, 11, io(u)), 0, 1.5], r: [0, 0, -0.5], s: [0.5, 3.2], a: Math.sin(u * Math.PI) * 0.45 }; } }));
    for (let i = 0; i < 18; i++) { const x0 = -7.5 + hash(i * 3.7) * 15, y0 = -4 + hash(i * 5.1) * 8, sp = 0.3 + hash(i * 2.3) * 0.5, big = i % 4 === 0;
      ph.push(plane(big ? PT.bokehTex(kit) : PT.sparkTex(kit), { w: big ? 0.5 : 0.32, mode: 1, col: i % 3 ? [255, 236, 246] : [255, 190, 220], order: 4.5, at: (t) => { const u = t - H0; return { p: [x0 + 0.2 * Math.sin(u + i), y0 + u * sp, 1.8 + (i % 3) * 0.4], a: (0.35 + 0.65 * Math.abs(Math.sin(u * 3 + i))) * clamp(u / 0.3) * (big ? 0.5 : 1) }; } })); }
    sets.push({ t0: H0, t1: H1, planes: ph, cam: (t) => ({ p: [0.05 * Math.sin(t), 0, 13.85 - 0.7 * io(clamp((t - H0) / (H1 - H0)))], look: [0, 0, 0], fov: 36, roll: 0.012 * io(clamp((t - H0) / (H1 - H0))) }),
      bg: () => [0, 0, 0], post: () => ({ bloom: 0.22, thr: 0.82, grain: 0.03, vig: 0.22 }) });
  }
  {
    const T0 = tHug1, T1 = bar(103), ph = [], [L52, L53, L54, L55] = [52, 53, 54, 55].map(ln), tFly = 208.6;
    const camF = camTrack([{ t: T0, p: [0, 0.1, 9.4], look: [0, 0.1, 0] }, { t: L53.t0, p: [-0.8, -0.2, 8.8], look: [0, 0, 0] }, { t: L54.t0, p: [0.9, 0.3, 9.0], look: [0, 0.1, 0] }, { t: L55.t0, p: [0, 0.1, 9.8], look: [0, 0.1, 0] }, { t: T1, p: [0, 0.1, 8.6], look: [0, 0.1, 0] }]);
    const cam = travel((t) => ({ ...camF(t), fov: 38, focus: 9, dof: 0.2, maxBlur: 8 }), 0.12);
    const src = seqSrc([[T0, 'y_smile'], [L53.t0, 'f_hug2'], [L54.t0, 'f_grad2'], [L54.t1 + 0.1, 'f_grad1'], [L55.t0 - 0.05, 'y_final', 40], [tFly, 'y_smile', 50]]);
    ph.push(...finder(kit, src, { w: 7.8, order: 3, at: (t) => ({ p: [0, 0.3, 0], r: [0, 0, 0], a: clamp((t - T0) / 0.25) }) }));
    ph.push(plane(PT.pixWordTex(kit, 'CRITICAL!!', [255, 90, 130], [255, 236, 140], 170), { w: 2.4, order: 30, sharp: true, at: (t) => { const pp = popAt(t, L52.t0 + 0.1, L53.t0 - 0.1, 0.05); return pp && { p: [2.3, 2.0, 2.2], r: [0, 0, 0.08], ...pp }; } }));
    ph.push(deco(kit, '!?', { font: 'DelaGothic', px: 300, size: 1.2, align: 'center', at: [-3.3, 1.6, 2.4], times: [part(L52, 'えっ', 1.6)], enter: 'pop', col: [255, 236, 120], ink: [120, 20, 70], strokeK: 0.12, order: 31, out: L53.t0, follow: false }));
    // THE VORTEX (PLAN-v3): the sphere collapses into a tunnel of cards round the lens, streaming at it and turning; on 「轢かれる　危ないよ」
    // headlight trails (white heads, red tails) race down its walls
    const tV1 = L54.t0 - 0.2;
    for (let i = 0; i < 40; i++) { const nm = i % 3 ? null : CHARS[(i / 3) % CHARS.length], a0 = i * 0.77, z0 = (i * 0.71) % 28;
      ph.push(await cardFace(kit, nm, (t) => { if (t < T0 || t > tV1 + 0.4) return null; const z = ((z0 * 0.33 + (t - T0) * 5) % 9.2) + 0.2, a = a0 + (t - T0) * 1.1, R = 3.9 + 0.3 * Math.sin(i), e = clamp((t - T0) / 0.5) * (1 - sm((t - tV1) / 0.4));      // (from the window's frame to the lens)
        return { p: [Math.cos(a) * R * (2 - e), Math.sin(a) * R * 0.62 * (2 - e) + 0.3, z], r: [0, 0, a + Math.PI / 2], s: 1, a: e * clamp((z - 0.2) / 1.2) }; },
        { size: 1.3, order: 4 + i * 0.001, shadow: false, walls: 1, bank: false })); }
    for (let k = 0; k < 4; k++) ph.push(sigil(kit, { hollow: true, w: 17, order: 3.9, col: k % 2 ? [214, 190, 255] : [255, 214, 140], at: (t) => { if (t < T0 || t > tV1 + 0.4) return null; const z = ((k * 2.3 + (t - T0) * 5) % 9.2) + 0.2, e = clamp((t - T0) / 0.5) * (1 - sm((t - tV1) / 0.4));
      return { p: [0, 0.3, z], r: [0, 0, (t - T0) * 0.4 * (k % 2 ? 1 : -1)], s: [1, 0.66], a: e * 0.6 * clamp((z - 0.2) / 1.5) * (1 - clamp((z - 7.4) / 1.4)) }; } }));      // (magic circles streaming down the vortex with the cards)
    const glow = PT.glowTex(kit);
    for (let i = 0; i < 22; i++) { const t0 = L53.t0 - 0.15 + i * 0.09, a = i * 1.9, col = i % 3 === 2 ? [255, 70, 90] : [255, 244, 220];
      ph.push(plane(glow, { w: 1, mode: 1, col, order: 20 + i * 0.001, sharp: true, at: (t) => { const u = (t - t0) / 0.45; if (u < 0 || u > 1) return null; const R = 3.2;
        return { p: [Math.cos(a) * R * 1.15, Math.sin(a) * R * 0.7 + 0.3, lerp(0.2, 11, u)], r: [0, Math.PI / 2, 0], s: [5, 0.1], a: Math.sin(u * Math.PI) }; } })); }
    // 「そう言ってそっぽ向くキミ」: his card turns its back
    const tAway = part(L54, 'そっぽ', 0.8);
    ph.push(...(await holoCard(kit, [[L54.t0 - 0.05, 'YD_whisper']], { at: [3.4, -0.2, 2.0], size: 2.4, order: 12, sparks: 6, from: 1.5, out: L55.t0, rz: 0.06, anim: (t) => ({ dr: [0, Math.PI * io(clamp((t - tAway) / 0.5)), 0] }) })));
    [[L52, L53.t0, [-4.6, -1.8, 2.6]], [L53, L54.t0, [-3.0, 2.1, 2.6]], [L54, L55.t0, [-4.6, 2.05, 2.6]], [L55, tFly, [-2.6, 2.05, 2.6]]].forEach(([L, out, at]) => ph.push(lyric(L, { at, size: L === L55 ? 0.36 : 0.48, col: L.col, ink: [40, 16, 70], out: out - 0.05 })));
    ph.push(...(await backbone(kit, { t0: T0, t1: T1, c: [0, 0.3, 0], dialCol: [255, 214, 120], dialCol2: [255, 150, 210], ghost: '危ない', ghostCol: [255, 120, 150] })));
    ph.push(...(await ribbon(kit, CHARS.slice(0, 12), L54.t1 + 0.05, L54.t1 + 0.55, L54.t1 + 1.55, L55.t0 - 0.35, { c: [0, -1.55, 2.7], span: 8.6, size: 1.15, order: 25 })));
    const thr2 = []; for (let k = 0; k < 6; k++) { const sd = k % 2 ? 1 : -1; thr2.push([tFly - 0.35 + k * 0.09, CHARS[(k * 2 + 1) % CHARS.length], [sd * 7, -1 + k * 0.4, 2.5], [sd * -0.6, 0.2, 9.0]]); }
    ph.push(...(await throws(kit, thr2, { size: 1.0, order: 41, dur: 0.6, arc: 0.4, trail: [255, 236, 170] })));
    // the five treasures fly past the lens; ALL CLEAR · S RANK; and the stop
    for (let k = 0; k < 5; k++) { const t0 = tFly + k * 0.12, a = (k / 5) * Math.PI * 2;
      ph.push(...(await holoCard(kit, [[t0, 'TR' + (k + 1)]], { at: [0, 0, 0], size: 1.6, order: 40 + k * 0.03, sparks: 4, from: 0, out: T1 + 0.2, outStyle: 'none', noBank: true,
        pos: (t) => { const u = clamp((t - t0) / 0.75); return [Math.cos(a) * (0.6 + 2.2 * u), Math.sin(a) * (0.5 + 1.4 * u), lerp(-4, 9.5, u * u)]; }, anim: (t) => ({ dr: [0, (t - t0) * 8, 0] }) }))); }
    ph.push(plane(PT.pixTex(kit, 'miku'), { w: 0.55, order: 57, sharp: true, at: (t) => { const pp = popAt(t, tFly + 1.0, T1 - 0.02, 0.06); return pp && { p: [4.95, -1.75 + 0.08 * Math.abs(Math.sin((t - tFly) / BEAT * Math.PI)), 2.85], ...pp }; } }));      // (a Miku easter egg)
    ph.push(await motif(kit, 'fufu', tFly + 0.9, T1 - 0.02, [-5.0, -2.0, 2.8], 1.1, { order: 56.9 }), await motif(kit, 'fufu_etoile', tFly + 1.05, T1 - 0.02, [-3.9, -2.05, 2.9], 1.0, { order: 56.95 }));
    for (const [k, n] of ['rabbit', 'inudoge', 'fox', 'keyboard', 'octopus', 'seaslug', 'fushi', 'pancakes'].entries()) ph.push(await motif(kit, n, tFly + 0.45 + k * 0.06, T1 - 0.02, [(k - 3.5) * 1.25, n === 'fushi' ? -2.45 : -1.95, 2.8], n === 'fushi' ? 1.3 : 1.05, { order: 56 + k * 0.01 }));
    // the three of them jump in for the clear (Kaguya, Yachiyo, Iroha in her fox avatar), dressed in their accents
    for (const [k, f] of ['LKD_jump', 'LYD_twirl', 'LIG_jump'].entries()) ph.push(...(await figure(kit, f, { at: [(k - 1) * 3.0, -3.4, 1.4 - Math.abs(k - 1) * 0.4], h: 3.4, t0: tFly + 0.25 + k * 0.12, order: 50 + k * 0.1, motif: false })));
    ph.push(plane(PT.judgeTex(kit, 'ALL CLEAR!', [255, 236, 140], [255, 120, 210], 200), { w: 3.6, order: 55, sharp: true, at: (t) => { const pp = popAt(t, tFly + 0.5, T1 - 0.02, 0.04); return pp && { ...inCamAt(cam, 3, 0, 0.15)(t), ...pp }; } }));
    ph.push(plane(PT.pixWordTex(kit, 'S RANK', [255, 214, 70], [255, 140, 90], 170), { w: 1.5, order: 55, sharp: true, at: (t) => { const pp = popAt(t, tFly + 0.85, T1 - 0.02); return pp && { ...inCamAt(cam, 3, 0, -0.4)(t), ...pp }; } }));
    sets.push({ t0: T0, t1: T1, planes: ph, cam, bg: () => ({ top: [30, 10, 40], bot: [10, 4, 16] }), ground: () => ({ kind: 3, pulse: 0 }),
      post: (t) => ({ bloom: 0.36, thr: 0.76, ca: 0.002 * pulse(t, 8), grain: 0.03, vig: 0.34, glitch: t > T1 - 0.04 ? 0.6 : 0 }) });
  }

  // ---------------------------------------- outro: neon again; the cards go dark one by one; the last emblem becomes the moon, the pole; THANK YOU FOR PLAYING ----------------------------------------
  {
    const T0 = bar(103), T1 = 226.03, ph = [], [L56, L57] = [56, 57].map(ln), tDark = 216.4, tPush = 219.4, tMoon = 220.6, tEnd = 222.9;
    const camO = camTrack([{ t: T0, p: [0, 0, 10.4], look: [0, 0, 0] }, { t: tDark, p: [0.2, 0.15, 11.4], look: [0, 0, -1] }, { t: tPush - 0.4, p: [-0.2, 0.3, 13.4], look: [0, 0, -2] }, { t: tPush, p: [0.3, 0.1, 10.2], look: [0, 0, 0] }, { t: tMoon, p: [0, 0.35, 3.2], look: [0, 0.35, 0] }, { t: tEnd - 0.1, p: [0, 0.35, 3.0], look: [0, 0.35, 0] }, { t: tEnd, p: [0, 0, 8.4], look: [0, 0, 0] }, { t: T1, p: [0, 0, 8.0], look: [0, 0, 0] }]);
    const cam = travel((t) => ({ ...camO(t), fov: 38, focus: 9, dof: 0.18, maxBlur: 8 }), 0.07);
    const GRID = ['KC_wink', 'YC_wave', 'IC_cool', 'KD_peace', 'YD_heart', 'KK_peace', 'YK_twirl', 'KD_heart', 'YD_kiss', 'KC_heart'], order = [0, 4, 5, 9, 1, 3, 6, 8, 2, 7];
    for (let i = 0; i < 10; i++) { const x = ((i % 5) - 2) * 2.0, y = i < 5 ? 1.25 : -1.25, td = tDark + order.indexOf(i) * BEAT * 0.75;
      ph.push(await cardFace(kit, GRID[i], (t) => { if (t > tEnd) return null; const f = io(clamp((t - td) / 0.9)), g = clamp((t - td) / 0.12);      // (LIGHTS OUT IN DEPTH: it goes out, tips back and falls away into the dark)
        return { p: [x * (1 + 0.25 * f), y - f * 1.4, -f * f * 9], r: [-f * 1.25, 0, (i % 2 ? 1 : -1) * f * 0.3], s: 1, a: clamp((t - T0) / 0.3) * (1 - 0.35 * g - 0.6 * f) }; }, { size: 2.2, order: 4 + i * 0.03, shadow: false, walls: 2, bank: false }));
      ph.push(plane(PT.glowTex(kit), { w: 2.6, mode: 1, col: [255, 236, 250], order: 3.9, at: (t) => { const u = (t - td) / 0.35; if (u < 0 || u > 1) return null; return { p: [x, y, 0.05], s: 1 + u, a: (1 - u) * 0.6 }; } }));
      if (i === 7) { const SILo = await kit.img('materials/nai/cut/miku_point_sil.png');      // (a Miku easter egg: this card shows her silhouette for a beat before it goes out)
        ph.push(plane(SILo, { h: 2.0, mode: 1, col: [57, 197, 187], order: 4 + i * 0.03 + 0.02, at: (t) => { const pp = popAt(t, td - BEAT * 1.2, td, 0); if (!pp) return null; return { p: [x, y - 0.05, 0.08], ...pp, a: pp.a * 0.9 }; } })); } }      // (the flash as each light goes)
    // the three of them wave goodbye in front of the grid, and drop out with their cards
    for (const [k, f] of ['LKD_wave', 'LYK_wave', 'LIG_peace'].entries()) ph.push(...(await figure(kit, f, { at: [(k - 1) * 3.3, -3.0, 2.4 - (k === 1 ? 0.6 : 0)], h: 3.2, t0: T0 + 0.3 + k * BEAT, t1: tDark + (3 + k * 3) * BEAT * 0.75, order: 20 + k * 0.1, motif: false })));
    // the last card: its moon emblem — the lens goes into it and the real moon is there (the film's night, then the gaming utility pole)
    ph.push(await cardFace(kit, null, (t) => { if (t < tPush - 0.6 || t > tMoon + 0.4) return null; const u = clamp((t - tPush + 0.6) / 0.6); return { p: [0, 0, 1.2], r: [0, 0, 0], s: outE(u), a: 1 - sm((t - tMoon) / 0.4) }; }, { size: 2.6, order: 8, shadow: false, walls: 2, bank: false }));
    ph.push(...finder(kit, seqSrc([[tMoon - 0.3, 'o_star'], [tMoon + 1.0, 'o_pole1'], [tMoon + 1.9, 'o_pole3', 30]]), { w: 1.6, order: 9, at: (t) => { if (t < tMoon - 0.3 || t > tEnd) return null; const u = clamp((t - tMoon + 0.3) / 0.8); return { p: [0, 0.35, 1.25], s: lerp(0.12, 1, outE(u)), a: sm(u) }; } }));
    ph.push(...(await backbone(kit, { t0: T0, t1: tEnd, c: [0, 0, 0], ghost: '月', ghostCol: [190, 170, 255], rays: false })));
    // neon signs again, held in the shot
    const flick = (t, t0) => { const u = t - t0; return u < 0 ? 0 : u < 0.05 ? 1 : u < 0.09 ? 0.15 : u < 0.13 ? 1 : u < 0.16 ? 0.4 : 1; };
    for (const [L, key, ja, zh, c1, c2, x, y, rz, t1] of [[L56, 'yeah', 'イェエー!', '耶～！', [255, 70, 170], [120, 240, 255], -0.42, 0.25, 0.08, L57.t0 - 0.1], [L57, 'heybaby', 'ヘイベイビー', '嘿，宝贝', [80, 230, 255], [255, 120, 200], 0.4, -0.2, -0.07, tDark + 0.4]]) {
      const at = inCamAt(cam, 3.2, x, y, rz), t0 = L.t0 - 0.03;
      ph.push(plane(PT.neonSignTex(kit, key, ja, zh, c1, c2), { w: 1.5, order: 30, sharp: true, at: (t) => { if (t < t0 || t > t1 + 0.2) return null; const v = clamp((t - t1) / 0.2); return { ...at(t), s: 1 + 0.05 * pulse(t, 8) - 0.1 * v, a: flick(t, t0) * (1 - v) }; } })); }
    // the end card: a card back (the emblem), the title as on the title card, the credit; THANK YOU FOR PLAYING; SAVE COMPLETE
    ph.push(await cardFace(kit, null, (t) => (t < tEnd ? null : { p: [0, 0.15, 0], r: [-0.03, 0.06 * Math.sin((t - tEnd) * 0.7), 0], s: outE(clamp((t - tEnd) / 0.5)) }), { size: 3.6, order: 10, shadow: false, walls: 3, bank: false }));
    ph.push(sigil(kit, { w: 7.2, order: 9.5, col: [255, 214, 150], at: (t) => (t < tEnd ? null : { p: [0, 0.15, -0.6], r: [0, 0, (t - tEnd) * 0.1], s: outE(clamp((t - tEnd) / 0.8)), a: 0.7 }) }));      // (the end card stands in a magic circle)
    ph.push(deco(kit, 'WORLD IS MINE', { font: 'DelaGothic', px: 220, size: 0.42, align: 'center', at: [0, -0.15, 0.25], times: [tEnd + 0.4], enter: 'pop', col: [255, 140, 210], ink: WHITE, strokeK: 0.16, order: 11, follow: false }));
    ph.push(letters(kit, 'CPK! Remix · かぐや & 月見ヤチヨ ver.', { font: 'HachiMaru', px: 120, size: 0.13, align: 'center', at: [0, -0.55, 0.25], times: [tEnd + 0.6], enter: 'type', col: [236, 226, 255], order: 11, follow: false }));
    ph.push(letters(kit, '超かぐや姫!  FAN MV', { font: 'DotGothic', px: 120, size: 0.12, align: 'center', at: [0, -0.78, 0.25], times: [tEnd + 0.8], enter: 'type', col: [214, 196, 255], order: 11, follow: false }));
    ph.push(letters(kit, '♪ ワールドイズマイン — ryo (supercell) feat. 初音ミク', { font: 'DotGothic', px: 120, size: 0.1, align: 'center', at: [0, -0.98, 0.25], times: [tEnd + 1.1], enter: 'type', col: [57, 197, 187], order: 11, follow: false }));
    ph.push(plane(PT.pixTex(kit, 'miku'), { w: 0.32, order: 12, sharp: true, at: (t) => { const pp = popAt(t, tEnd + 1.6, T1 + 1, 0.05); return pp && { p: [1.75, -0.94, 0.3], ...pp }; } }));      // (a Miku easter egg)
    ph.push(plane(PT.pixWordTex(kit, 'THANK YOU FOR PLAYING', [255, 140, 210], [140, 220, 255], 150), { w: 3.6, order: 12, sharp: true, at: (t) => { const pp = popAt(t, tEnd + 1.0, T1 + 1, 0.02); return pp && { p: [0, 2.35, 0.4], ...pp }; } }));
    ph.push(letters(kit, 'SAVE COMPLETE ✓', { font: 'VT323', px: 140, size: 0.22, align: 'center', at: [3.4, -2.3, 0.4], times: [...'SAVE COMPLETE ✓'].map((_, j) => tEnd + 1.6 + j * 0.04), enter: 'type', col: [140, 255, 200], order: 12, follow: false }));
    for (const [k, [n, x, y, sz]] of [['rabbit', -3.4, 1.0, 1.3], ['inudoge', -3.7, -1.1, 1.2], ['fox', -2.3, -2.0, 1.0], ['keyboard', 2.4, -2.0, 1.5], ['octopus', 3.5, 1.0, 1.2], ['seaslug', 3.7, -1.0, 1.0], ['fushi', -0.2, -2.6, 1.3], ['pancakes', 2.5, 2.1, 1.0]].entries())
      ph.push(await motif(kit, n, tEnd + 1.1 + k * 0.12, T1 + 1, [x, y, 0.8], sz, { order: 13 + k * 0.01 }));
    ph.push(await motif(kit, 'fufu_lie', tEnd + 1.9, T1 + 1, [-1.6, -2.35, 0.8], 0.95, { order: 13.2 }));      // (a Miku easter egg: official ふわぷち)
    // the ちょこのせ mini figures sit on the end card's top edge, legs over it (that is what they are made for)
    for (const [k, n] of [[0, 'fufu_choco_a'], [1, 'fufu_choco_b']].map(([k, n]) => [k, n])) ph.push(await motif(kit, n, tEnd + 1.3 + k * 0.15, T1 + 1, [k ? 0.95 : -0.95, 1.55 + 0.2, 0.32], 0.85, { order: 12.5, bob: 0.01 }));
    ph.push(await motif(kit, 'sacabambaspis', tEnd + 0.5, T1 + 1, (t) => [lerp(6.5, -6.5, clamp((t - tEnd - 0.5) / 3.0)), 2.75, 0.2], 1.5, { order: 12.9, shadow: false, bob: 0.02 }));
    ph.push(plane(PT.blockTex(kit), { w: 1, mode: 1, col: [0, 0, 0], order: 90, at: (t) => (t < T1 - 0.9 ? null : { ...inCamAt(cam, 1.5, 0, 0)(t), s: 4, a: sm((t - T1 + 0.9) / 0.85) }) }));
    sets.push({ t0: T0, t1: T1 + 0.5, planes: ph, cam, bg: () => ({ top: [16, 10, 40], bot: [30, 16, 60] }), ground: () => ({ kind: 4 }),
      post: (t) => ({ bloom: 0.3, thr: 0.8, grain: 0.03, vig: 0.38 }) });
  }
  return sets;
}
