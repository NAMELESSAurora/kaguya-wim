// Shared parts for the paper space's sets (v6): palette, beat grid, sung times, easing, and makers of planes — letters with their
// 3D entrances (flap / spin / fly / rise / type), objects that arrive on a beat, a figure in five looks (riso plates), rings.

// kaguya-wim (forked 2026-11-23 from 《澪標》 src/sets/lib.js v6.6). Palette per world (PLAN §6.1) — each chapter its own inks.
// singers (PLAN §7): Kaguya gold, Yachiyo silver-white, both = teal (Miku = the song itself)
export const K_GOLD = [255, 204, 92], K_GOLD_D = [196, 128, 22], Y_SILVER = [236, 238, 250], Y_SILVER_D = [126, 132, 170], MIKU = [57, 197, 187], MIKU_D = [18, 128, 122];
export const INK = [28, 18, 44], NIGHT = [12, 8, 22], PAPER = [252, 246, 250], WHITE = [255, 255, 255];
// 2008 Y2K (其の一): holographic lilac / mint / deco pink / baby blue
export const HOLO = [222, 204, 255], MINT = [176, 242, 226], DECO = [255, 110, 182], BABY = [158, 212, 255], LEMON = [255, 244, 150];
// the live (其の二): the film's own stage — black, hot pink rings, cyan lasers, white penlights
export const STAGE = [14, 8, 24], HOT = [255, 46, 150], LASER = [70, 238, 255], PEN = [255, 246, 252], VIOLET = [120, 60, 220];
// candy (其の五, teased in chorus 1's sweets)
export const STRAW = [255, 178, 202], CUSTARD = [255, 226, 140], CARAMEL = [196, 122, 62], CREAM = [255, 246, 236];
export const VOICE_COL = { K: K_GOLD, Y: Y_SILVER, KY: MIKU }, VOICE_COL_D = { K: K_GOLD_D, Y: Y_SILVER_D, KY: MIKU_D };
// the song's grid (audio/grid.json, fitted to the drum hits): 118 BPM
export const BEAT = 60 / 118, B0 = 0.2469, bar = (n) => 0.7579 + BEAT * 4 * n, beatT = (k) => B0 + BEAT * k, beatOf = (t) => (t - B0) / BEAT;
// how far past the last beat (0 … 1 of a beat), and a pulse that attacks on the frame before each beat and decays fast
export const beatPh = (t) => { const b = beatOf(t); return b - Math.floor(b); };
export const pulse = (t, k = 9, every = 1) => { const b = beatOf(t + 1 / 60) / every; const f = b - Math.floor(b); return Math.exp(-f * every * k); };
// faster everything (as 《澪標》 v6.6's PACE): entrances, effects, turns at this fraction of their written duration
export const PACE = 0.6;
const SCRAMBLE = [...'アイウエオカキクケコサシスセソタチツテトナニヌネノ♡☆※＃％＆＠★'];      // (no plain solids ■●▲◆: they read as missing-glyph boxes)
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const io = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const sm = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
export const outE = (k) => 1 - Math.pow(1 - clamp(k), 3);
export const spring = (k, w = 8.5, d = 6.5) => (k <= 0 ? 0 : k >= 1.6 ? 1 : 1 - Math.exp(-d * k) * Math.cos(w * k));
export const lerp = (a, b, k) => a + (b - a) * k;
export const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const mixc = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// the sung lines: audio/lines.json (the user's LRC: ja, zh, voice K / Y / KY) + per-character times (timing_snap.json = refined and
// snapped to the vocal stem's onsets; timing.json = stable-ts per line). Never typed here.
let TIM = null, LN = null;
export async function lyrics() {
  if (!TIM) {
    const get = (u) => fetch(u).then((r) => (r.ok ? r.json() : null), () => null);
    TIM = (await get('audio/timing_snap.json')) || (await get('audio/timing_v2.json')) || (await get('audio/timing.json'));
    LN = await get('audio/lines.json');
    // syllable times checked by ear / against the vocal stem's onsets override the aligner's (audio/timing_fix.json)
    const FIX = (await get('audio/timing_fix.json')) || {};
    for (const [k, v] of Object.entries(FIX)) { const L = TIM[Number(k) - 1]; if (!L || !Array.isArray(v)) continue; L.chars.forEach((c, i) => { if (v[i] != null) { const d = (v[i + 1] ?? v[i] + 0.25) - v[i]; c[1] = v[i]; c[2] = v[i] + Math.max(0.08, d); } }); L.t0 = v[0]; }
  }
  const line = (n) => {
    const L = TIM[n - 1], cs = L.chars.map(([c, t0, t1]) => ({ c, t0, t1 }));
    const real = cs.filter((c) => c.c.trim()); if (real.length > 1) real[0].t0 = Math.max(real[0].t0, real[1].t0 - 0.25);
    const words = []; let cur = null;
    for (const c of cs) { if (!c.c.trim()) { cur = null; continue; } if (!cur) words.push((cur = { w: '', t0: c.t0, t1: c.t1, cs: [] })); cur.w += c.c; cur.t1 = c.t1; cur.cs.push(c); }
    const meta = LN[n - 1] || {}, zh = meta.zh || '';
    // the translation builds with the voice: its j-th character lands where the line's sung characters are j/n of the way through
    const zhTimes = (str = zh, o = {}) => { const R = real.slice(o.from ?? 0, o.to ?? real.length), k = [...str].length; return [...str].map((_, j) => R[Math.min(R.length - 1, Math.floor((j * R.length) / k))].t0 + (o.lag ?? 0)); };
    // the sung characters of a part of the line, by its text (e.g. part(n, 'その一') → { str, times })
    const part = (sub) => { const i = L.text.indexOf(sub); if (i < 0) return null; const cs2 = cs.slice(i, i + [...sub].length); return { str: sub, times: cs2.map((c) => c.t0), t0: cs2[0].t0, t1: cs2[cs2.length - 1].t1 }; };
    return { n, text: L.text, t0: real[0].t0, t1: L.t1, chars: cs, real, words, zh, zhTimes, voice: meta.voice || 'K', col: VOICE_COL[meta.voice] || K_GOLD, colD: VOICE_COL_D[meta.voice] || K_GOLD_D, part, times: cs.map((c) => c.t0) };
  };
  const at = (t) => { for (let n = 1; n <= TIM.length; n++) { const L = TIM[n - 1]; if (t >= L.chars[0][1] - 0.3 && t < L.t1 + 0.2) return n; } return 0; };
  return { line, at, count: TIM.length };
}

// a camera track: keys { t, p, look, fov, focus, dof, roll } (Hermite through the keys; `hold: true` eases to a stop)
// (monotone cubic per component — Fritsch–Carlson, as Won't Let You's camera: it never overshoots between keys far apart in time,
//  slows where a key is a turning point, and keeps its speed through keys on a straight run)
export function camTrack(keys, base = {}) {
  const names = ['p', 'look', 'fov', 'focus', 'dof', 'roll'], ts = keys.map((k) => k.t);
  const chans = [];
  for (const n of names) {
    let held = keys.find((k) => k[n] !== undefined)?.[n]; if (held === undefined) continue;
    const vals = keys.map((k) => (held = k[n] ?? held)), dim = Array.isArray(vals[0]) ? vals[0].length : 0;
    const comps = dim ? [...Array(dim).keys()].map((j) => vals.map((v) => v[j])) : [vals];
    const curves = comps.map((y) => {
      const N = y.length, d = [], m = new Array(N).fill(0);
      for (let i = 0; i < N - 1; i++) d.push((y[i + 1] - y[i]) / Math.max(1e-6, ts[i + 1] - ts[i]));
      for (let i = 1; i < N - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (3 * (ts[i + 1] - ts[i - 1])) / ((2 * ts[i + 1] - ts[i] - ts[i - 1]) / d[i - 1] + (ts[i + 1] - 2 * ts[i] + ts[i - 1] + (ts[i + 1] - ts[i])) / d[i]);
      if (N > 1) { m[0] = d[0]; m[N - 1] = d[N - 2]; }
      for (let i = 1; i < N - 1; i++) if (d[i - 1] * d[i] > 0) m[i] = (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
      return (t) => {
        if (N === 1 || t <= ts[0]) return y[0]; if (t >= ts[N - 1]) return y[N - 1];
        let i = 0; while (t > ts[i + 1]) i++;
        const h = ts[i + 1] - ts[i], s = (t - ts[i]) / h, s2 = s * s, s3 = s2 * s;
        return (2 * s3 - 3 * s2 + 1) * y[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * y[i + 1] + (s3 - s2) * h * m[i + 1];
      };
    });
    chans.push([n, dim, curves]);
  }
  return (t) => { const o = { ...base }; for (const [n, dim, cs] of chans) o[n] = dim ? cs.map((c) => c(t)) : cs[0](t); return o; };
}

// ---- letters ----------------------------------------------------------------------------------------------
// A string laid out as one plane per glyph. o: { font, px (texture size), size (world height of the em), at: [x, y, z] (start of the
// baseline, or the centre when align 'center'), dir: [1, 0, 0] (along the line), align, track (em), col, enter: 'type' | 'flap' |
// 'spin' | 'fly' | 'rise' | 'drop', dur, times: [t per glyph], out: t (leave), outStyle: 'fade' | 'flap' | 'fall' | 'scatter',
// layout: 'line' | 'circle' ({ r, a0, a1 } for circle: the glyphs stand round a ring facing out of the page), rot: [rx, ry, rz] of
// the whole line, drift: [vx, vy, vz], boil, order, on }
export function letters(kit, str, o) {
  const font = o.font || 'DelaGothic', px = o.px || 160, em = o.size || 1, chars = [...str];
  const tex = chars.map((c) => (c.trim() ? kit.text(c, font, px, { weight: o.weight, stroke: o.stroke }) : null));      // (stroke: outlined letters, the line's width in px)
  const advs = chars.map((c, i) => (tex[i] ? tex[i].userData.m.adv : kit.text('n', font, px, { weight: o.weight }).userData.m.adv * 0.55) / px * em + (o.track || 0) * em);
  const total = advs.reduce((a, b) => a + b, 0) - (o.track || 0) * em;
  const dir = o.dir || [1, 0, 0], up = o.up || [0, 1, 0], at = o.at || [0, 0, 0];
  const start = o.align === 'center' ? -total / 2 : o.align === 'right' ? -total : 0;
  const planes = []; let x = start;
  const R = o.rot || [0, 0, 0];
  const rotv = (v) => { // the whole line's turn (YXZ), applied to a local offset
    const [rx, ry, rz] = R; let [a, b, c] = v;
    let cz = Math.cos(rz), sz = Math.sin(rz); [a, b] = [a * cz - b * sz, a * sz + b * cz];
    let cx = Math.cos(rx), sx = Math.sin(rx); [b, c] = [b * cx - c * sx, b * sx + c * cx];
    let cy = Math.cos(ry), sy = Math.sin(ry); [a, c] = [a * cy + c * sy, -a * sy + c * cy];
    return [a, b, c];
  };
  // (v6.4, the user: "歌词的…演出效果和演出跟随还需要深度优化") the type follows the voice: a small hit on each syllable as it is sung, and a word
  // whose note is held swells and lifts a little for as long as it is held, then settles. Units: a Latin word, or one CJK character.
  const tOf = (i) => (o.times ? o.times[i] ?? o.times[o.times.length - 1] : (o.t0 ?? 0) + i * (o.stagger ?? 0.05));
  const unitOf = [], units = []; { let cur = null; chars.forEach((c, i) => { if (!c.trim()) { cur = null; unitOf[i] = -1; return; } const cjk = c.charCodeAt(0) > 0x2e80; if (!cur || cjk || cur.cjk) { cur = { a: i, b: i, cjk }; units.push(cur); } cur.b = i; unitOf[i] = units.length - 1; }); }
  const unitEnd = (u) => tOf(units[u].b), unitNext = (u) => (u + 1 < units.length ? tOf(units[u + 1].a) : (o.holdEnd ?? unitEnd(u) + 0.45));
  chars.forEach((c, i) => {
    const adv = advs[i], T = tex[i];
    if (!T) { x += adv; return; }
    const m = T.userData.m, w = (m.w / px) * em, h = (m.h / px) * em;
    let local, rotL = [0, 0, 0];
    if (o.layout === 'circle') { const L = o.circle, n = chars.length, a = lerp(L.a0, L.a1, (x - start + adv / 2) / Math.max(1e-3, total)); local = [Math.sin(a) * L.r, Math.cos(a) * L.r, 0]; rotL = [0, 0, -a]; }
    else local = [dir[0] * x, dir[1] * x, dir[2] * x];
    const base = rotv(local), P0 = [at[0] + base[0], at[1] + base[1], at[2] + base[2]];
    // (v6.4, the user: "歌词的跟随有些慢拍和抢拍问题") `times` are when each glyph must be READ — its syllable. The entrance starts early by
    // what it takes to become legible (a fly's travel, a bloom's front, ASCII resolving), a frame ahead of the voice.
    const tRead = o.times ? o.times[i] ?? o.times[o.times.length - 1] : (o.t0 ?? 0) + i * (o.stagger ?? 0.05), dur = (o.dur ?? 0.35) * PACE, k0 = hash(i * 7.3 + (o.seed || 0));
    // (v6.6) the entrance may differ word to word (o.mix: a list, cycled by unit) — one family per line, not one motion for everything
    const EN = o.mix ? o.mix[(unitOf[i] >= 0 ? unitOf[i] : i) % o.mix.length] : o.enter;
    const eLead = EN === 'scramble' ? (o.scr ?? 0.4) : ({ flap: 0.03, spin: 0.05, fly: 0.55, rise: 0.12, drop: 0.12, pop: 0.06, type: 0, zoom: 0.45, slide: 0.45, stretch: 0.08, tumble: 0.1 }[EN] ?? 0) * (EN === 'fly' || EN === 'zoom' || EN === 'slide' ? dur : 1), ANT = o.raw ? 0 : 1 / 24;
    let tIn = o.raw ? tRead : tRead - ANT - eLead, fxI = o.fxOf ? o.fxOf(i, tIn) : o.fx;
    if (!o.raw && fxI && fxI.lead > eLead) { tIn = tRead - ANT - fxI.lead; fxI = o.fxOf ? o.fxOf(i, tIn) : o.fx; }
    const scatter = [(hash(i * 3.1 + 1 + (o.seed || 0)) - 0.5) * (o.spread || 6), (hash(i * 5.7 + 2 + (o.seed || 0)) - 0.5) * (o.spread || 6) * 0.6, (hash(i * 1.9 + 3 + (o.seed || 0)) - 0.3) * (o.spread || 6)];
    planes.push({
      tex: T, h, pivot: [(m.pad + m.left) / m.w, m.base / m.h], mode: 1, col: o.col || INK, boil: o.boil ?? 0.6, fx: fxI, rag: o.rag, order: o.order ?? 0, on: o.on, shadow: o.shadow, near: o.near,
      at: (t) => {
        const u = (t - tIn) / dur; if (u < 0 && EN !== 'type') return null; if (EN === 'type' && t < tIn) return null;
        let p = [...P0], r = [R[0] + rotL[0], R[1] + rotL[1], R[2] + rotL[2]], s = 1, a = 1;
        const e = spring(u * 1.6);
        if (EN === 'flap') r = [r[0] - (1 - e) * Math.PI * 0.5, r[1], r[2]];
        else if (EN === 'spin') r = [r[0], r[1] + (1 - e) * Math.PI * (k0 > 0.5 ? 1 : -1) * 0.75, r[2]];
        else if (EN === 'fly') { const k = outE(u); p = lerp3([P0[0] + scatter[0], P0[1] + scatter[1], P0[2] + scatter[2]], P0, k); r = [r[0] + (1 - k) * (k0 - 0.5) * 3, r[1] + (1 - k) * (k0 - 0.3) * 4, r[2] + (1 - k) * (k0 - 0.5) * 2]; a = clamp(u * 4); }
        else if (EN === 'rise') { p = [P0[0], P0[1] - (1 - e) * em * 0.8, P0[2]]; a = clamp(u * 3); }
        else if (EN === 'drop') { p = [P0[0], P0[1] + (1 - e) * em * 1.2, P0[2]]; a = clamp(u * 4); }
        else if (EN === 'pop') { s = 0.6 + 0.4 * e; a = clamp(u * 5); }
        else if (EN === 'zoom') { const k = outE(u); s = lerp(3.4, 1, k); p = [p[0], p[1], p[2] + (1 - k) * em * 2.5]; a = clamp(u * 5); }
        else if (EN === 'slide') { const k = outE(u), sgn = (unitOf[i] >= 0 ? unitOf[i] : i) % 2 ? 1 : -1; p = [p[0] + sgn * (1 - k) * em * 5, p[1], p[2]]; s = [1 + (1 - k) * 1.2, 1 - (1 - k) * 0.3]; a = clamp(u * 6); }
        else if (EN === 'stretch') { s = [1, Math.max(0.001, e)]; }
        else if (EN === 'tumble') { r = [r[0], r[1], r[2] + (1 - e) * (k0 > 0.5 ? 1.7 : -1.7)]; p = [p[0], p[1] + (1 - e) * em * 0.6, p[2]]; a = clamp(u * 5); }
        // (kaguya-wim, after the duotone GMV's logo: random glyphs on twos settle into the letter on its syllable)
        let scr = null; if (EN === 'scramble' && t < tRead) { const pool = o.pool || SCRAMBLE, f = Math.floor(t * 12); scr = kit.text(pool[Math.floor(hash(f * 7.13 + i * 3.31 + (o.seed || 0)) * pool.length)], font, px, { weight: o.weight, stroke: o.stroke }); a = 0.55 + 0.45 * hash(f + i); }
        if (o.drift) { const dt = t - tIn; p = [p[0] + o.drift[0] * dt, p[1] + o.drift[1] * dt, p[2] + o.drift[2] * dt]; }
        if (o.out != null && t > o.out + i * (o.outStagger ?? 0.015)) {
          const v = (t - o.out - i * (o.outStagger ?? 0.015)) / (o.outDur ?? 0.35); if (v >= 1) return null;
          if (o.outStyle === 'flap') r = [r[0] + io(v) * Math.PI * 0.5, r[1], r[2]];
          else if (o.outStyle === 'fall') { p = [p[0], p[1] - v * v * em * 3, p[2] + v * em]; r = [r[0] + v * (k0 - 0.5) * 3, r[1], r[2] + v * (k0 - 0.5) * 2]; }
          else if (o.outStyle === 'scatter') p = lerp3(p, [p[0] + scatter[0], p[1] + scatter[1], p[2] + scatter[2]], io(v));
          a *= 1 - sm(v);
        }
        if (o.follow !== false && t >= tRead) {
          // (FIX from 《澪標》 v6.7: s may be [sx, sy] for 'slide' / 'stretch' — multiplying it gave NaN and the glyph vanished while sung)
          const mulS = (f) => { s = Array.isArray(s) ? [s[0] * f, s[1] * f] : s * f; };
          const k = (t - tRead) / 0.28; if (k < 1) mulS(1 + (o.hit ?? 0.09) * (1 - k) * (1 - k));
          const u = unitOf[i], e0 = unitEnd(u) + 0.18, e1 = unitNext(u), held = e1 - e0;
          if (held > 0.3) { const hk = clamp((t - e0) / held), sw = hk * hk * (3 - 2 * hk) * (1 - sm((t - e1) / 0.35)) * Math.min(1, (held - 0.3) / 0.8); mulS(1 + (o.sustain ?? 0.05) * sw); p = [p[0] + up[0] * em * 0.04 * sw, p[1] + up[1] * em * 0.04 * sw, p[2] + up[2] * em * 0.04 * sw]; }
        }
        const col = o.colAt ? o.colAt(t, i) : undefined;
        return { p, r, s, a: a * (o.alpha ?? 1), col, tex: scr || (EN === 'scramble' ? T : undefined) };
      },
    });
    x += adv;
  });
  planes.width = total;
  return planes;
}

// an object (an image) that arrives at t0: o: { at, size (world height), rot, enter, from, dur, out, outStyle, drift, spin, mode, col, shadow,
// order, boil, bias, on, rag, curl }. Entrances (v6.4, the user: "现有的贴图素材出场和应用方式还是略显单调" — each a way a real thing arrives):
//   drop · slide · stamp · unfold · flap · pop · fade · none, and
//   toss   thrown in along an arc from `from` (turning over in the air), lands and settles with a small skid
//   swing  hung from a pin at its top (pivot there): swings in from the side as a damped pendulum
//   peel   arrives rolled up and unrolls onto the page from one side (`curl` angle; needs curl: true)
//   shadow its shadow arrives first (big and soft, as from high above), then it drops into it
//   orbit  enters circling round `centre` (radius from `at`) and stays on the ring, turning (a carousel round her)
export function object(tex, o) {
  const P0 = o.at, R0 = o.rot || [0, 0, 0], dur = (o.dur ?? 0.45) * PACE, k0 = hash((o.seed || 1) * 9.1);
  const curl = o.enter === 'peel' || o.curl;
  const sh0 = o.shadow === false ? null : o.shadow || { d: 0.06, dx: 0.05, dy: 0.07, a: 0.2, bias: 3 };
  return {
    tex, h: o.size, w: o.w, pivot: o.pivot || (o.enter === 'swing' ? [0.5, 0.02] : undefined), mode: o.mode ?? 0, mat: o.mat, col: o.col, col2: o.col2, fx: o.fx, shadow: sh0, order: o.order ?? 0, boil: o.boil ?? 0, bias: o.bias, on: o.on, back: o.back, edge: o.edge, crop: o.crop, near: o.near, rag: o.rag, curl, sky: o.sky,
    at: (t) => {
      const u = (t - (o.t0 ?? -1e9)) / dur; if (u < 0) return null;
      let p = [...P0], r = [...R0], s = 1, a = 1, cu = null; const e = spring(u * 1.5);
      if (o.enter === 'drop') { p = [p[0], p[1] + (1 - outE(u)) * o.size * 1.5, p[2] + (1 - outE(u)) * 1.2]; r = [r[0] + (1 - e) * 0.5, r[1], r[2] + (1 - e) * (k0 - 0.5) * 0.8]; a = clamp(u * 4); }
      else if (o.enter === 'slide') { const f = o.from || [-6, 0, 0]; p = lerp3([p[0] + f[0], p[1] + f[1], p[2] + f[2]], p, outE(u)); r = [r[0], r[1], r[2] + (1 - outE(u)) * (k0 - 0.5) * 0.6]; }
      else if (o.enter === 'stamp') { s = 1 + (1 - e) * 0.6; p = [p[0], p[1], p[2] + (1 - outE(u)) * 2]; a = clamp(u * 6); }
      else if (o.enter === 'unfold') r = [r[0], r[1] + (1 - e) * Math.PI * 0.5, r[2]];
      else if (o.enter === 'flap') r = [r[0] - (1 - e) * Math.PI * 0.5, r[1], r[2]];
      else if (o.enter === 'pop') { s = e; a = clamp(u * 6); }
      else if (o.enter === 'fade') a = sm(u);
      else if (o.enter === 'toss') {           // a parabola from `from` (its own height, then down), turning over, then a skid and settle
        const f = o.from || [-7, -2, 3], k = clamp(u), arc = 4 * k * (1 - k) * (o.lift ?? o.size * 1.4);
        p = [P0[0] + f[0] * (1 - k), P0[1] + f[1] * (1 - k) * (1 - k) + arc, P0[2] + f[2] * (1 - k)];
        const sk = u > 1 ? Math.exp(-(u - 1) * 7) * Math.sin((u - 1) * 18) * 0.06 : 0;
        r = [R0[0] + (1 - outE(k)) * (k0 - 0.3) * 2.6, R0[1] + (1 - outE(k)) * (k0 - 0.6) * 3.2, R0[2] + (1 - outE(k)) * (k0 > 0.5 ? 3.5 : -3.5) + sk];
        a = clamp(u * 6);
      }
      else if (o.enter === 'swing') {          // a pendulum about the pin: in from the side, swinging down to rest
        const th = (o.swing ?? 0.9) * Math.exp(-u * 1.6) * Math.cos(u * 5.2) * (k0 > 0.5 ? 1 : -1);
        r = [r[0], r[1] + 0.25 * Math.exp(-u * 1.6) * Math.sin(u * 4.1), r[2] + th]; a = clamp(u * 5);
      }
      else if (o.enter === 'peel') { cu = [1 - io(u), o.curlA ?? Math.PI, o.curlR ?? o.size * 0.06]; }
      else if (o.enter === 'shadow') {         // the shadow first (o.shadow is drawn bigger and softer while it is high), then the thing
        const k = clamp((u - 0.45) / 0.55); p = [p[0], p[1], p[2] + (1 - outE(k)) * o.size * 2.2]; a = k > 0 ? clamp(k * 6) : 0.0001;
        r = [r[0], r[1], r[2] + (1 - outE(k)) * (k0 - 0.5) * 0.7];
      }
      if (o.enter === 'orbit' || o.orbit) {     // round `centre` on a tipped ring, turning
        const c = o.centre || [0, 0, P0[2]], R = Math.hypot(P0[0] - c[0], P0[1] - c[1]), a0 = Math.atan2(P0[1] - c[1], P0[0] - c[0]);
        const ang = a0 + (o.orbitW ?? 0.5) * (t - (o.t0 ?? 0)) - (1 - outE(u)) * 1.6, tip = o.tip ?? 0.45;
        p = [c[0] + Math.cos(ang) * R * (o.enter === 'orbit' ? lerp(1.8, 1, outE(u)) : 1), c[1] + Math.sin(ang) * R * Math.cos(tip), c[2] + Math.sin(ang) * R * Math.sin(tip)];
        if (o.enter === 'orbit') a = clamp(u * 5);
      }
      if (o.drift) { const dt = t - (o.t0 ?? 0); p = [p[0] + o.drift[0] * dt, p[1] + o.drift[1] * dt, p[2] + o.drift[2] * dt]; }
      if (o.spin) { const dt = t - (o.t0 ?? 0); r = [r[0] + (o.spin[0] || 0) * dt, r[1] + (o.spin[1] || 0) * dt, r[2] + (o.spin[2] || 0) * dt]; }
      if (o.out != null && t > o.out) {
        const v = (t - o.out) / (o.outDur ?? 0.4); if (v >= 1) return null;
        if (o.outStyle === 'fall') { p = [p[0], p[1] - v * v * o.size * 3, p[2]]; r = [r[0] + v, r[1], r[2] + v * (k0 - 0.5) * 2]; }
        else if (o.outStyle === 'slide') { const f = o.to || [8, 0, 0]; p = lerp3(p, [p[0] + f[0], p[1] + f[1], p[2] + f[2]], io(v)); }
        else if (o.outStyle === 'peel' && curl) { cu = [io(v), o.curlA ?? 0, o.curlR ?? o.size * 0.06]; if (v >= 1) return null; }
        if (o.outStyle !== 'peel') a *= 1 - sm(v);
      }
      const extra = o.anim ? o.anim(t, { p, r, s, a }) : null;
      return { p, r, s, a: a * (o.alpha ?? 1), curl: cu || o.curlAt?.(t), ...(extra || {}) };
    },
  };
}

// (v6.4, the user: "各个转场效果还可以进行深度优化") a guide: one loose petal drifting a little ahead of the lens through the changes of place, so
// the eye has something to follow from one page to the next (the camera seems to chase it). cam: the set's track; wins: [[t0, t1]]
export function guide(tex, cam, wins, o = {}) {
  const V = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], N = (v) => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const X = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  return { tex, h: o.size ?? 0.16, mode: 0, order: o.order ?? 30, shadow: false,
    at: (t) => {
      const w = wins.find((q) => t >= q[0] - 0.05 && t < q[1]); if (!w) return null;
      const c = cam(Math.min(w[1], t + (o.lead ?? 0.35))), f = N(V(c.look, c.p)), r = N(X(f, [0, 1, 0])), u = X(r, f), d = o.dist ?? 2.6;
      const sx = 0.55 * Math.sin(t * 1.3 + w[0]), sy = 0.22 * Math.sin(t * 0.9 + 1 + w[0]) - 0.12;
      const a = sm((t - w[0]) / 0.3) * (1 - sm((t - w[1] + 0.3) / 0.3));
      return { p: [c.p[0] + f[0] * d + r[0] * sx + u[0] * sy, c.p[1] + f[1] * d + r[1] * sx + u[1] * sy, c.p[2] + f[2] * d + r[2] * sx + u[2] * sy], r: [t * 1.7, t * 2.3, t * 0.9], a };
    } };
}

// (v6.6) a collage burst: things thrown in round a point on the beats, each its own way in and its own fused treatment (sample 1's language,
// for the sections after it). items: [url]; o: { at (centre), r: [rx, ry], z, t0, step, size: [min, max], order, out, seed, on }
const ENTERS = ['toss', 'stamp', 'swing', 'shadow', 'drop', 'peel', 'slide', 'pop'];
const FXS = [(t) => FX.misreg(t, 0.4, 0.05), (t) => FX.bloom(t, 0.5, [0.5, 0.5], 1.1), (t) => mash(FX.halftone(t, 0.4), FX.misreg(t, 0.4, 0.04)), (t) => FX.glitch(t, 0.25), (t) => FX.tiles(t, 0.4, 6), (t) => mash(FX.scan(t, 0.3, 0.4), FX.line(t, 0.4, 0.4)), (t) => FX.iris(t, 0.35), (t) => FX.stripes(t, 0.35), (t) => mash(FX.ascii(t, 0.4, 8, 70), FX.glitch(t + 0.08, 0.2))];
export async function burst(kit, items, o) {
  const out = [], sd = o.seed ?? 1;
  for (const [k, u] of items.entries()) {
    const tx = await kit.img(u); if (!tx) continue;
    const a = (k / items.length) * Math.PI * 2 + sd, rr = 0.7 + 0.3 * hash(k * 3.3 + sd), at = [o.at[0] + Math.cos(a) * o.r[0] * rr, o.at[1] + Math.sin(a) * o.r[1] * rr, (o.z ?? o.at[2]) + (hash(k * 1.7 + sd) - 0.5) * 0.6];
    const t0 = o.t0 + k * (o.step ?? 0.1), enter = ENTERS[(k + Math.floor(sd * 3)) % ENTERS.length], fx = FXS[(k * 5 + Math.floor(sd * 7)) % FXS.length](t0);
    const size = lerp(o.size?.[0] ?? 1.4, o.size?.[1] ?? 2.8, hash(k * 1.9 + sd));
    out.push(object(tx, { at, size, t0, dur: enter === 'swing' ? 1.1 : 0.42, enter, from: [o.at[0] - at[0] + (hash(k) - 0.5) * 2, o.at[1] - at[1] - 1.5, 2], curlA: Math.PI * (k % 2), rot: [0, 0, (hash(k * 5.1 + sd) - 0.5) * 0.9], spin: [0, 0, (hash(k * 2.3 + sd) - 0.5) * 0.1], drift: [0, 0, 0.08], order: (o.order ?? 2) + k * 0.01, seed: k + 1 + sd * 10, fx, on: o.on,
      out: o.out != null ? o.out + k * 0.02 : undefined, outStyle: 'slide', to: [Math.cos(a) * 12, Math.sin(a) * 8, 2], outDur: 0.35 }));
  }
  return out;
}

// (v6.7) the opening's small vocabulary, as helpers for the later stations ---------------------------------------------------------
// the Chinese of a line typed on a torn slip (the translation paired, not floating): o: { at, w, t0, out, rz, col, size, on }
export function slipZh(kit, ln, o) {
  const slip = kit.canvas('slipzh', 1400, 160, (g, w, h) => { g.fillStyle = 'rgb(247,240,236)'; g.fillRect(0, 0, w, h); });
  const size = o.size ?? 0.3, w = o.w ?? Math.max(2.4, [...ln.zh].length * size * 1.12 + 0.8), rz = o.rz ?? 0.02, t0 = o.t0 ?? ln.t0 + 0.3;
  return [object(slip, { at: o.at, size: size * 1.55, w, t0, dur: 0.35, enter: 'slide', from: [o.from ?? -8, 0, 0], rot: [0, 0, rz], order: (o.order ?? 5) - 0.05, rag: { kind: 'torn', w: 0.1, e: [1, 0.4, 1, 0.4] }, out: o.out, outStyle: 'slide', to: [-(o.from ?? -8), 0, 0], outDur: 0.35, on: o.on }),
    letters(kit, ln.zh, { font: 'NotoSansSC', weight: 500, px: 120, size, align: 'center', at: [o.at[0], o.at[1] - size * 0.32, o.at[2] + 0.02], rot: [0, 0, rz], times: ln.zhTimes(undefined, { lag: 0.1 }).map((x) => Math.max(x, t0 + 0.15)), enter: 'type', col: o.col || INK, order: o.order ?? 5, out: o.out, outDur: 0.3, on: o.on })].flat();
}
// things pinned round a figure one a beat, each its own way in and its own treatment: list [[url, [x, y, z], size?, rz?]]
const PIN_ENTERS = ['stamp', 'toss', 'swing', 'shadow', 'drop', 'peel', 'slide'];
const PIN_FX = [(t) => FX.misreg(t, 0.5, 0.06), (t) => FX.bloom(t, 0.6, [0.5, 0.4], 1.0), (t) => FX.tiles(t, 0.5, 6), (t) => FX.iris(t, 0.45), (t) => mash(FX.halftone(t, 0.45), FX.misreg(t, 0.4, 0.04)), (t) => FX.stripes(t, 0.4), (t) => mash(FX.scan(t, 0.35, 0.4), FX.line(t, 0.45, 0.4))];
export async function pinThings(kit, list, o) {
  const out = [];
  for (const [k, [u, at, size, rz]] of list.entries()) {
    const tx = await kit.img(u); if (!tx) continue; const t0 = o.t0 + (o.step ?? 0.8) * k, enter = PIN_ENTERS[(k + (o.seed ?? 0)) % PIN_ENTERS.length];
    out.push(object(tx, { at, size: size ?? 2.0, t0, enter, dur: enter === 'swing' ? 1.2 : 0.45, rot: [0, 0, rz ?? (k % 2 ? -0.3 : 0.35)], from: [-3, -4, 3], curlA: Math.PI * (k % 2), order: (o.order ?? 3) + 0.1 * k, seed: (o.seed ?? 0) * 10 + k + 1,
      fx: PIN_FX[(k + (o.seed ?? 0) * 3) % PIN_FX.length](t0), out: o.out != null ? o.out + 0.05 * k : undefined, outStyle: 'slide', to: [at[0] > (o.cx ?? 0) ? 10 : -10, 0, 0], outDur: 0.4, on: o.on }));
  }
  return out;
}
// a page with her shape cut out of it (the paper's white core round the cut), to see through: returns the page texture
export async function holePage(kit, key, url, o = {}) {
  const fig = await kit.img(url); if (!fig) return null;
  const W = o.W ?? 1920, H = o.H ?? 1080;
  return kit.canvas('hole:' + key, W, H, (g, w, h) => {
    g.fillStyle = `rgb(${(o.col || [244, 236, 236]).join(',')})`; g.fillRect(0, 0, w, h);
    const im = fig.image, hh = h * (o.h ?? 0.86), ww = (hh * im.width) / im.height, x0 = (o.cx ?? 0.5) * w - ww / 2, y0 = (o.top ?? 0.08) * h;
    // the white core: the shape a little larger, in the paper's white
    const c2 = document.createElement('canvas'); c2.width = w; c2.height = h; const g2 = c2.getContext('2d');
    g2.filter = 'blur(5px)'; g2.drawImage(im, x0, y0, ww, hh); g2.filter = 'none'; g2.globalCompositeOperation = 'source-in'; g2.fillStyle = 'rgb(252,250,248)'; g2.fillRect(0, 0, w, h);
    g.drawImage(c2, -3, -2); g.drawImage(c2, 3, 2);
    g.globalCompositeOperation = 'destination-out'; g.drawImage(im, x0, y0, ww, hh); g.globalCompositeOperation = 'source-over';
    const id = g.getImageData(0, 0, w, h), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 8; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(id, 0, 0);
  });
}

// a strip of tape laid over the top edge of a thing (it lands a beat-fraction before the thing slides under it)
export function tapeOver(tex, o) {
  const w = o.w ?? o.size * 0.55;
  return object(tex, { at: [o.at[0] + (o.dx ?? 0), o.at[1] + o.size * 0.47, o.at[2] + 0.02], size: w * 0.32, w, t0: o.t0 - 0.12, dur: 0.25, enter: 'stamp', rot: [0, 0, (o.rz ?? 0) + 0.12], shadow: { d: 0.02, dx: 0.02, dy: 0.03, a: 0.12, bias: 2 }, order: (o.order ?? 0) + 0.2, alpha: 0.85 });
}

// a field of square tiles that together make a picture, each a card in 3D that turns over to show another look
// (v6.4, the user: "图四的风格化处理我挺喜欢的，可以照着这种几何构成的味道设计一些新的内容"). o: { nx, ny, w, h (whole field), at (centre),
// rot, gap, faces: [{ tex | 'world', mode, col, col2, crop? (window of the picture), flipY? (the world's print), fx?(i, j, t) }],
// flipAt(i, j) → [times] (each turn shows the next look), lookAt(i, j, n) → face index after n turns (default n % faces),
// axis 'y' | 'x', dur, order, on, edge, rag, popAt(i, j) (appears, springing out of its centre), dropAt(i, j) (falls away), anim }
// (a turn is drawn as the card turning to edge-on, then the next look coming round from the other edge: never mirrored)
export function tileField(o) {
  const out = [], tw = o.w / o.nx, th = o.h / o.ny, g = o.gap ?? 0.0, R = o.rot || [0, 0, 0];
  const faceCrop = (F, i, j) => { const c = F.crop || [0, 0, 1, 1]; if (F.flipY) return [c[0] + (i / o.nx) * c[2], 1 - (j / o.ny), c[2] / o.nx, -1 / o.ny]; return [c[0] + (i / o.nx) * c[2], c[1] + (j / o.ny) * c[3], c[2] / o.nx, c[3] / o.ny]; };
  const rv = (v) => { const [rx, ry, rz] = R; let [a, b, c] = v; let cz = Math.cos(rz), sz = Math.sin(rz); [a, b] = [a * cz - b * sz, a * sz + b * cz]; let cx = Math.cos(rx), sx = Math.sin(rx); [b, c] = [b * cx - c * sx, b * sx + c * cx]; let cy = Math.cos(ry), sy = Math.sin(ry); [a, c] = [a * cy + c * sy, -a * sy + c * cy]; return [a, b, c]; };
  for (let j = 0; j < o.ny; j++) for (let i = 0; i < o.nx; i++) {
    const flips = o.flipAt ? o.flipAt(i, j) : [], dur = (o.dur ?? 0.42) * Math.max(PACE, 0.75), axis = o.axis || 'y';
    const local = [-o.w / 2 + (i + 0.5) * tw, o.h / 2 - (j + 0.5) * th, 0], off = rv(local), base = [o.at[0] + off[0], o.at[1] + off[1], o.at[2] + off[2]];
    const F0 = o.faces.find((F) => F && F.tex) || o.faces[0];
    out.push({ tex: F0.tex, w: tw - g, h: th - g, mode: F0.mode ?? 0, order: o.order ?? 0, on: o.on, edge: o.edge, rag: o.rag, boil: o.boil ?? 0, sharp: o.sharp, shadow: o.shadow, sky: o.sky,
      at: (t) => {
        const pop = o.popAt ? o.popAt(i, j) : -1e9; if (t < pop) return null;
        // (v6.4: a tile's life — it comes round from edge-on at life[0] (half a turn) and goes back to edge-on, ending at life[1]: a block
        //  turning into its four smaller blocks is the block turning away while they come round)
        const life = o.life ? o.life(i, j) : null; let lifeTurn = 0;
        if (life) { if (t < life[0] || t >= life[1]) return null; const hd = dur / 2;
          if (t < life[0] + hd) lifeTurn = -(Math.PI / 2) * (1 - io((t - life[0]) / hd)); else if (o.turnOut !== false && t > life[1] - hd) lifeTurn = (Math.PI / 2) * io((t - (life[1] - hd)) / hd); }      // (turnOut false: it simply goes, once what replaces it has come round in front)
        const started = flips.filter((f) => t >= f).length; let look = started, turn = lifeTurn;
        if (started) { const k = (t - flips[started - 1]) / dur; if (k < 1) { const a = Math.PI * io(k); if (a < Math.PI / 2) { turn += a; look = started - 1; } else turn += a - Math.PI; } }
        const F = o.faces[o.lookAt ? o.lookAt(i, j, look) : look % o.faces.length]; if (!F || !F.tex) return null;      // (a face without a picture: the tile is not there)
        const sp = pop > -1e8 ? spring(clamp((t - pop) / 0.3) * 1.5) : 1;
        let p = [...base], r = [...R], a = 1;
        if (axis === 'y') r[1] += turn; else r[0] += turn;
        const drop = o.dropAt ? o.dropAt(i, j) : null;
        if (drop != null && t > drop) { const v = (t - drop) / 0.9; if (v >= 1) return null; p = [p[0], p[1] - v * v * 4, p[2] - v * 3]; r = [r[0] - v * 1.6, r[1], r[2] + (hash(i * 3 + j) - 0.5) * v * 2]; a = 1 - sm((v - 0.6) / 0.4); }
        const ex = o.anim ? o.anim(i, j, t, p, r) : null;
        // (at rest the tiles lie in one plane and overlap a hair: no cracks between them to flicker)
        return { p: ex?.p || p, r: ex?.r || r, s: sp * (ex?.s ?? 1) * (Math.abs(turn) < 1e-4 ? 1 + (o.overlap ?? 0.006) : 1), a: a * (ex?.a ?? 1), tex: F.tex, mode: F.mode ?? 0, col: F.col, col2: F.col2, crop: faceCrop(F, i, j), fx: F.fx ? F.fx(i, j, t) : undefined };
      },
    });
  }
  return out;
}

// a picture placed on a 16:9 page (so several looks of one drawing share one placement): o: { h (height / page height), cx, top }
// (fade: the drawing's own straight cut at its foot melts away over that fraction of its height; fadeL / fadeR: its sides, where the
//  drawing cuts her hair off. mask: { tex, thr, grow } — the user, "组合的边缘不用大面积留白，按照人物立绘轮廓就行（可以适当留一点容错空间）":
//  the picture is cut to HER outline, taken from the matted drawing (materials/nai/cut: no sticker border, no solid fill between strands),
//  alpha over `thr`, grown by `grow` px of tolerance and softened)
export function compose(kit, key, tex, o, W = 1920, H = 1080) {
  return kit.canvas('compose:' + key, W, H, (g, w, h) => {
    const im = tex.image, hh = h * o.h, ww = (hh * im.width) / im.height, x0 = o.cx * w - ww / 2, y0 = o.top * h; g.drawImage(im, x0, y0, ww, hh);
    if (o.mask) {
      const mc = document.createElement('canvas'); mc.width = w; mc.height = h; const mg = mc.getContext('2d', { willReadFrequently: true });
      mg.drawImage(o.mask.image, x0, y0, ww, hh);
      const id = mg.getImageData(0, 0, w, h), d = id.data, thr = (o.thr ?? 0.3) * 255;
      for (let i = 3; i < d.length; i += 4) { d[i - 3] = d[i - 2] = d[i - 1] = 255; d[i] = d[i] > thr ? 255 : 0; }
      mg.putImageData(id, 0, 0);
      const gc = document.createElement('canvas'); gc.width = w; gc.height = h; const gg = gc.getContext('2d', { willReadFrequently: true });
      gg.filter = `blur(${o.grow ?? 6}px)`; gg.drawImage(mc, 0, 0); gg.filter = 'none';
      const gd = gg.getImageData(0, 0, w, h), q = gd.data;
      for (let i = 3; i < q.length; i += 4) { const k = Math.min(1, Math.max(0, (q[i] - 20) / 60)); q[i] = Math.round(255 * k * k * (3 - 2 * k)); }
      gg.putImageData(gd, 0, 0);
      g.globalCompositeOperation = 'destination-in'; g.drawImage(gc, 0, 0); g.globalCompositeOperation = 'source-over';
    }
    const fades = [];
    if (o.fade) { const y1 = y0 + hh; fades.push(g.createLinearGradient(0, y1, 0, y1 - o.fade * hh)); }
    if (o.fadeL) fades.push(g.createLinearGradient(x0, 0, x0 + o.fadeL * ww, 0));
    if (o.fadeR) fades.push(g.createLinearGradient(x0 + ww, 0, x0 + ww - o.fadeR * ww, 0));
    for (const gr of fades) { gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, '#fff'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    g.globalCompositeOperation = 'source-over';
  });
}
// how much of each cell of an nx × ny grid a page's alpha covers (0 … 1), row-major from the top-left
export function coverage(tex, nx, ny) {
  const c = document.createElement('canvas'); c.width = nx * 8; c.height = ny * 8; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(tex.image, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height).data, out = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { let s = 0; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) s += d[((j * 8 + y) * c.width + i * 8 + x) * 4 + 3]; out.push(s / (64 * 255)); }
  return out;
}

// an engraved ring (procedural: crisp at any size): rings of hairline, ticks, small capitals round it
export function ringTex(kit, key, o = {}) {
  const S = o.px || 1024;
  return kit.canvas('ring:' + key, S, S, (g, w, h) => {
    const c = w / 2; g.translate(c, c); g.strokeStyle = '#fff'; g.fillStyle = '#fff';
    const lw = S / 700;
    const circ = (r, l = lw) => { g.lineWidth = l; g.beginPath(); g.arc(0, 0, r * c, 0, Math.PI * 2); g.stroke(); };
    if (o.kind === 'ticks') { circ(0.96); circ(0.9, lw * 0.6); for (let i = 0; i < 120; i++) { const a = (i / 120) * Math.PI * 2, l = i % 10 === 0 ? 0.08 : i % 5 === 0 ? 0.05 : 0.03; g.lineWidth = lw * (i % 10 ? 0.7 : 1.4); g.beginPath(); g.moveTo(Math.cos(a) * 0.9 * c, Math.sin(a) * 0.9 * c); g.lineTo(Math.cos(a) * (0.9 - l) * c, Math.sin(a) * (0.9 - l) * c); g.stroke(); } }
    else if (o.kind === 'text') {
      circ(0.97, lw * 0.8); circ(0.84, lw * 0.8);
      const str = o.text || 'HERBARIUM OF THE SHALLOWS · ', px = S * 0.052; g.font = `${px}px Unbounded`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const n = [...str].length * (o.repeat || 2), full = (str.repeat(o.repeat || 2));
      [...full].forEach((ch, i) => { const a = (i / n) * Math.PI * 2; g.save(); g.rotate(a); g.fillText(ch, 0, -0.905 * c); g.restore(); });
    } else if (o.kind === 'petals') {
      for (let i = 0; i < 12; i++) { g.save(); g.rotate((i / 12) * Math.PI * 2); g.lineWidth = lw; g.beginPath(); g.ellipse(0, -0.62 * c, 0.09 * c, 0.3 * c, 0, 0, Math.PI * 2); g.stroke(); g.restore(); }
      circ(0.3); circ(0.26, lw * 0.6);
    } else { circ(0.95, lw * 1.2); circ(0.9, lw * 0.5); circ(0.6, lw * 0.5); }
  });
}

// a soft disc (an ink drop: a watercolour bloom with a darker rim) in white for mode 1
export function dropTex(kit, key = 'drop') {
  return kit.canvas(key, 512, 512, (g, w) => {
    const c = w / 2, gr = g.createRadialGradient(c, c, 0, c, c, c * 0.98);
    gr.addColorStop(0, 'rgba(255,255,255,0.78)'); gr.addColorStop(0.8, 'rgba(255,255,255,0.86)'); gr.addColorStop(0.93, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath();
    for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2, r = c * (0.9 + 0.05 * Math.sin(a * 3 + 1) + 0.03 * Math.sin(a * 7)); g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); }
    g.fill();
  });
}

// a sheet of paper (cream, tooth and fibres; optional ruled lines and a border) — drawn as it is (mode 0)
export function paperTex(kit, key, w, h, o = {}) {
  return kit.canvas('paper:' + key, w, h, (g) => {
    g.fillStyle = `rgb(${(o.col || [244, 233, 234]).join(',')})`; g.fillRect(0, 0, w, h);
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 9; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0);
    if (o.rule) { g.strokeStyle = 'rgba(104,91,143,0.22)'; g.lineWidth = Math.max(1, h / 900); for (let y = o.rule; y < h; y += o.rule) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }
    if (o.grid) { g.strokeStyle = 'rgba(104,91,143,0.12)'; g.lineWidth = 1; for (let x = 0; x < w; x += o.grid) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += o.grid) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }
    if (o.border) { g.strokeStyle = 'rgba(82,64,120,0.7)'; g.lineWidth = Math.max(2, h / 400); g.strokeRect(o.border, o.border, w - 2 * o.border, h - 2 * o.border); g.lineWidth = 1; g.strokeRect(o.border * 1.6, o.border * 1.6, w - 3.2 * o.border, h - 3.2 * o.border); }
    if (o.draw) o.draw(g, w, h);
  });
}

// a specimen label: two columns (the line, its Chinese) with ruled fields, drawn as it is
export function labelTex(kit, key, o) {
  const w = o.w || 1400, h = o.h || 620;
  return paperTex(kit, 'label:' + key, w, h, { col: [247, 238, 238], border: 18, draw: (g) => {
    g.fillStyle = 'rgba(82,64,120,0.85)'; g.font = `${h * 0.055}px Unbounded`; g.fillText(o.title || 'HERBARIUM OF THE SHALLOWS', w * 0.05, h * 0.13);
    g.font = `${h * 0.045}px VT323`; g.fillText(o.no || 'No. 001', w * 0.78, h * 0.13);
    g.strokeStyle = 'rgba(82,64,120,0.5)'; g.lineWidth = 1.5; for (const y of [0.17, 0.5, 0.68, 0.86]) { g.beginPath(); g.moveTo(w * 0.05, h * y); g.lineTo(w * 0.95, h * y); g.stroke(); }
    g.font = `${h * 0.04}px VT323`; g.fillText('採集地 · the shallows', w * 0.05, h * 0.63); g.fillText('採集者 · 標', w * 0.05, h * 0.81); g.fillText(o.date || '— · — · —', w * 0.62, h * 0.81);
  } });
}

// a figure in five looks from its riso plates (materials/riso/<k>_{ink,coral,line,mask}.png) and the painting (materials/nai/hb/<k>_x2.png):
// returns the plates as planes stacked a hair apart in depth (so they part a little when the camera turns), each with its own
// alpha by `look(t)` → { line, ink, dots, paint, sil } (0 … 1) and colours by `inks(t)` → { line, ink, dots, sil }
export async function figurePlanes(kit, k, o) {
  const plate = (p) => kit.img(`materials/riso/${k === 'hb_S_back' ? 'hb_S_look' : k}_${p}.png`);
  const [ink, coral, line, mask, paint] = await Promise.all([plate('ink'), plate('coral'), plate('line'), plate('mask'), kit.img(`materials/nai/hb/${k}_x2.png`)]);
  const P = [], at = o.at, size = o.size, gap = o.gap ?? 0.04, fl = o.flip ? -1 : 1;
  const mk = (tex, name, dz, mode) => tex && P.push({
    tex, h: size, mode, order: o.order ?? 0, boil: name === 'line' ? o.boil ?? 1.2 : 0, crop: o.crop, near: o.near, fx: o.fxOf ? o.fxOf(name) : undefined, fade: o.fade,
    at: (t) => { const L = o.look(t), a = L[name] ?? 0; if (a <= 0.003) return null; const b = o.at3 ? o.at3(t) : { p: at, r: o.rot || [0, 0, 0], s: 1 }; const I = o.inks ? o.inks(t) : {};
      const ry = b.r ? b.r[1] : 0;
      return { p: [b.p[0] + Math.sin(ry) * dz, b.p[1], b.p[2] + dz], r: b.r || [0, 0, 0], s: [fl * (b.s ?? 1), b.s ?? 1], a: a * (b.a ?? 1), col: I[name], mode };
    },
  });
  mk(mask, 'sil', -gap * 2, 1); mk(paint, 'paint', -gap * 1.5, 0); mk(ink, 'ink', -gap, 1); mk(coral, 'dots', 0, 1); mk(line, 'line', gap, 1);
  return P;
}

// a PV silhouette as two planes: the fill in one ink and a thin rim of light (kit.silRim); both sharp at any depth. o: { at(t) → state,
// size, pivot, col (or colAt), rimCol, rimA, order, on }
export async function silhouette(kit, url, o) {
  const S = await kit.silRim(url, { rim: o.rim, dir: o.dir }); if (!S) return [];
  const base = { h: o.size, pivot: o.pivot, mode: 1, sharp: true, order: o.order ?? 0, on: o.on, near: o.near, fx: o.fx, fade: o.fade };
  if (o.starry) {           // (v6.3) the night inside her, and starlight round her: a soft halo of the rim's colour behind
    const sky = o.starry === true ? { top: [96, 74, 150], bot: [52, 30, 64] } : o.starry;
    return [
      { ...base, tex: S.fill, order: (o.order ?? 0) - 0.3, mode: 1, bias: 4.5, sharp: false, at: (t) => { const st = o.at(t); if (!st) return null; return { ...st, s: (Array.isArray(st.s) ? st.s[0] : st.s ?? 1) * 1.035, a: (st.a ?? 1) * (o.glowA ?? 0.45), col: o.glowCol || [255, 226, 214] }; } },
      o.sky ? { ...base, tex: S.fill, mode: 5, sky: o.sky, at: (t) => o.at(t) } : { ...base, tex: S.fill, mode: 4, col: sky.top, col2: sky.bot, at: (t) => o.at(t) },
      { ...base, tex: S.rim, order: (o.order ?? 0) + 0.5, at: (t) => { const st = o.at(t); if (!st) return null; return { ...st, a: (st.a ?? 1) * (o.rimA ?? 1), col: o.rimColAt ? o.rimColAt(t) : o.rimCol || [255, 232, 210] }; } },
    ];
  }
  return [
    { ...base, tex: S.fill, at: (t) => { const st = o.at(t); if (!st) return null; return { ...st, col: o.colAt ? o.colAt(t) : o.col || INK }; } },
    { ...base, tex: S.rim, order: (o.order ?? 0) + 0.5, at: (t) => { const st = o.at(t); if (!st) return null; return { ...st, a: (st.a ?? 1) * (o.rimA ?? 0.9), col: o.rimColAt ? o.rimColAt(t) : o.rimCol || CREAM }; } },
  ];
}

// ---- entrances (v6.2, the user: "素材入场方式太过单一且简单，可以多设计一些入场方式例如水彩晕染，glitchpop up，ascii等等，发挥你的创造力，然后这些入场方式
// 可以做一个mashup和fusion"): how a thing comes into being (space.js shader stages). Each maker(t0, d, …) → (t) → fx; mash() fuses several
// (masks keep their own fronts, treatments overlap); out() runs one backwards from t1 as an exit.
const ph = (t, t0, d) => clamp((t - t0) / d);
const FX0 = {
  bloom: (t0, d = 0.9, seed = [0.5, 0.5], wet = 1) => (t) => { const k = ph(t, t0, d); return k >= 1 ? {} : { bloom: outE(k), seed, wet: wet * (1 - 0.6 * k) }; },
  glitch: (t0, d = 0.32) => (t) => { const k = ph(t, t0, d); if (k >= 1) return {}; const f = Math.floor(t * 24); return { glitch: 1 - sm(k), misreg: 0.012 * (1 - k), amul: k < 0.55 && f % 3 === 1 ? 0.2 : 1 }; },
  ascii: (t0, d = 0.75, c0 = 14, c1 = 120) => (t) => { const k = ph(t, t0, d); if (k >= 1) return {}; return { ascii: 1 - sm((k - 0.55) / 0.45), cells: lerp(c0, c1, io(k)), amul: clamp(k * 8) }; },
  halftone: (t0, d = 0.8) => (t) => { const k = ph(t, t0, d); return k >= 1 ? {} : { halftone: k < 0.55 ? outE(k / 0.55) : 1 + sm((k - 0.55) / 0.45) }; },
  line: (t0, d = 0.9, ang = 0.7) => (t) => { const k = ph(t, t0, d); if (k >= 1) return {}; return { line: 1 - sm((k - 0.5) / 0.5), scan: k < 0.5 ? k / 0.5 : -1, scanA: ang }; },
  mosaic: (t0, d = 0.5) => (t) => { const k = ph(t, t0, d); return k >= 1 ? {} : { mosaic: lerp(5, 180, k * k), amul: clamp(k * 10) }; },
  scan: (t0, d = 0.55, ang = 0) => (t) => { const k = ph(t, t0, d); return k >= 1 ? {} : { scan: k, scanA: ang }; },
  tear: (t0, d = 0.45, ang = 0.25) => (t) => { const k = ph(t, t0, d); return k >= 1 ? {} : { tear: outE(k), tearA: ang }; },
  dissolve: (t0, d = 0.6) => (t) => { const k = ph(t, t0, d); return k >= 1 ? {} : { dissolve: k }; },
  misreg: (t0, d = 0.6, amt = 0.035) => (t) => { const k = ph(t, t0, d); return k >= 1 ? {} : { misreg: amt * (1 - outE(k)) }; },
  // (v6.4) geometric reveals: squares popping in along a diagonal; a circle opening with a coral ring; bars widening in turn
  tiles: (t0, d = 0.7, cells = 8) => (t) => { const k = ph(t, t0, d); return k >= 1 ? {} : { tiles: k, tcells: cells }; },
  iris: (t0, d = 0.6, seed = [0.5, 0.5]) => (t) => { const k = ph(t, t0, d); return k >= 1 ? {} : { iris: io(k), seed }; },
  stripes: (t0, d = 0.6) => (t) => { const k = ph(t, t0, d); return k >= 1 ? {} : { stripes: k }; },
};
// how long after its start each one takes to become legible (as a fraction of its duration)
// ([fraction, the maker's default duration])
const LEAD = { bloom: [0.45, 0.9], glitch: [0.3, 0.32], ascii: [0.62, 0.75], halftone: [0.6, 0.8], line: [0.55, 0.9], mosaic: [0.5, 0.5], scan: [0.6, 0.55], tear: [0.6, 0.45], dissolve: [0.65, 0.6], misreg: [0.1, 0.6], tiles: [0.75, 0.7], iris: [0.6, 0.6], stripes: [0.7, 0.6] };
export const FX = Object.fromEntries(Object.entries(FX0).map(([k, mk]) => [k, (t0, d, ...a) => { const L = LEAD[k] || [0.5, 0.6], dd = (d ?? L[1]) * PACE, f = mk(t0, dd, ...a); f.lead = dd * L[0]; return f; }]));
const MASKS = ['bloom', 'scan', 'dissolve', 'tear', 'tiles', 'iris', 'stripes'], KEEP = ['seed', 'scanA', 'tearA', 'cells', 'wet', 'tcells'];
export const mash = (...fs) => { const g = (t) => {
  const o = {};
  for (const f of fs) for (const [k, v] of Object.entries(f(t))) {
    if (k === 'amul') o.amul = (o.amul ?? 1) * v; else if (KEEP.includes(k)) o[k] = v; else if (MASKS.includes(k)) o[k] = o[k] == null ? v : Math.min(o[k], v); else o[k] = Math.max(o[k] ?? 0, v);
  }
  return o;
}; g.lead = Math.max(0, ...fs.map((f) => f.lead || 0)); return g; };
// an exit: an entrance run backwards, ending at t1 + d (after which the thing is gone)
export const out = (make, t1, d, ...args) => { const f = make(0, d, ...args); return (t) => (t < t1 ? {} : t - t1 >= d ? { amul: 0 } : f(d - (t - t1))); };
// in and out together
export const both = (fin, fout) => (t) => { const a = fin(t), b = fout(t); return Object.keys(b).length ? b : a; };
