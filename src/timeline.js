// Film-wide constants: frame size, frame rate, the song's grid, the sections shown on the scrub bar.
// Film time = song time (audio/song.wav). `?w=2560` renders 1440p, `?w=854` a 480p draft.
const q = new URLSearchParams(location.search);
export const W = Number(q.get('w')) || 1920;
export const H = Math.round((W * 9) / 16 / 2) * 2;
export const FPS = Number(q.get('fps')) || 60;
export const TOTAL = 226.03;

// the sample being built (PLAN §14): verse 1 → chorus 1
export const T0 = Number(q.get('from')) || 28.6;
export const T1 = Number(q.get('to')) || 84.15;

// audio/grid.json (fitted to the drum stem's hits): 118 BPM, no drift over the song
export const BPM = 118, BEAT = 60 / 118, BEAT0 = 0.2469, BAR = BEAT * 4, DOWN0 = 0.7579;
export const beatT = (k) => BEAT0 + BEAT * k;
export const bar = (n) => DOWN0 + BAR * n;
export const beatOf = (t) => (t - BEAT0) / BEAT;

// sections (audio/sections.json; chapter names from PLAN §4)
export const SECTIONS = [
  { name: '其の一 子安貝', start: 28.6, dur: bar(22) - 28.6 },
  { name: 'Pre 嘟嘴', start: bar(22), dur: 59.4 - bar(22) },
  { name: '其の二 龍の首の珠', start: 59.4, dur: bar(41) - 59.4 },
];
