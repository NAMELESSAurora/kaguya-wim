// Preview player and the hooks used to pull frames out of the browser (after 《澪標》's main.js).
//
//   __film.render(t)                          draw the frame at t seconds
//   __film.snap(t, name, width, samples)      save out/snaps/<name>.png (width 0 = full size)
//   __film.export({ name, from, to, samples}) render every frame into out/<name>.mp4
//   __film.status                             progress of the running export
//
// The preview plays the song in sync (it follows the audio clock while playing); frames whose footage is
// still loading show the last loaded picture. Snaps and exports wait for every picture of the frame.
import { createFilm } from './film.js';
import { SECTIONS, TOTAL, FPS, W, H, T0, T1 } from './timeline.js';

const $ = (id) => document.getElementById(id);
const canvas = $('view'), scrub = $('scrub'), playBtn = $('play'), timeEl = $('time'), shotEl = $('shot');
const exportBtn = $('export'), statusEl = $('status'), marks = $('marks'), audio = $('song');

const stamp = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}`;

let film;
try {
  film = await createFilm(canvas);
} catch (err) {
  statusEl.textContent = String(err.message || err);
  throw err;
}

scrub.min = T0; scrub.max = T1; scrub.step = 1 / FPS;
const span = T1 - T0;
marks.style.gridTemplateColumns = SECTIONS.map((s) => `${Math.max(0.01, Math.min(s.start + s.dur, T1) - Math.max(s.start, T0)) / span}fr`).join(' ');
marks.innerHTML = SECTIONS.map((s, i) => `<span>${i + 1} ${s.name}</span>`).join('');

let t = T0, playing = false;
const sectionAt = (x) => SECTIONS.find((s) => x >= s.start && x < s.start + s.dur);

async function show(time, samples = 1, wait = false) {
  t = Math.min(TOTAL - 1 / FPS, Math.max(0, time));
  if (wait) await film.prepare(t, samples);
  else film.prepare(t, samples);
  film.render(t, samples);
  scrub.value = t;
  timeEl.textContent = `${stamp(t)} / ${stamp(T1)}`;
  const s = sectionAt(t); shotEl.textContent = s ? s.name : '';
}

function tick() {
  if (playing) {
    let now = audio.currentTime;
    if (now >= T1) { audio.currentTime = T0; now = T0; }
    show(now);
  }
  requestAnimationFrame(tick);
}

function setPlaying(on) {
  playing = on;
  playBtn.textContent = on ? '暂停' : '播放';
  if (on) { audio.currentTime = t; audio.play().catch(() => {}); } else audio.pause();
}

playBtn.addEventListener('click', () => setPlaying(!playing));
scrub.addEventListener('input', () => { setPlaying(false); show(Number(scrub.value), 1, true); });
addEventListener('keydown', (e) => {
  if (e.target === scrub) return;
  if (e.code === 'Space') { e.preventDefault(); setPlaying(!playing); }
  if (e.code === 'ArrowRight') { setPlaying(false); show(t + 1 / FPS, 1, true); }
  if (e.code === 'ArrowLeft') { setPlaying(false); show(t - 1 / FPS, 1, true); }
});

const post = async (url, body) => {
  const r = await fetch(url, { method: 'POST', body });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || `${url}: ${r.status}`);
  return data;
};

const hooks = {
  total: TOTAL,
  fps: FPS,
  status: { state: 'idle' },
  render: async (time, samples = 1) => { await show(time, samples, true); return t; },
  async snap(time, name = 'snap', width = 0, samples = 1) {
    await show(time, samples, true);
    return post(`/api/snap?name=${encodeURIComponent(name)}&w=${W}&h=${H}&scale=${width}`, film.read());
  },
  async export({ name = 'kaguya-sample', from = T0, to = T1, samples = 2 } = {}) {
    if (hooks.status.state === 'running') throw new Error('an export is already running');
    setPlaying(false);
    const first = Math.round(from * FPS), count = Math.round(to * FPS) - first;
    const status = (hooks.status = { state: 'running', frame: 0, total: count, started: performance.now(), first });
    exportBtn.disabled = true;
    try {
      await post(`/api/export/begin?name=${encodeURIComponent(name)}&w=${W}&h=${H}&fps=${FPS}`);
      let sent = Promise.resolve();
      for (let f = 0; f < count; f++) {
        await show((first + f) / FPS, samples, true);
        const body = film.read().slice();
        await sent;
        sent = post('/api/export/frame', body);
        status.frame = f + 1;
        if (f % 12 === 0) statusEl.textContent = `导出 ${f + 1} / ${count}`;
      }
      await sent;
      const done = await post('/api/export/end');
      Object.assign(status, { state: 'done', ...done, seconds: (performance.now() - status.started) / 1000 });
      statusEl.textContent = `已导出 ${done.file}（${(done.bytes / 1e6).toFixed(1)} MB）`;
    } catch (err) {
      Object.assign(status, { state: 'error', error: String(err.message || err) });
      statusEl.textContent = `导出失败：${status.error}`;
      await fetch('/api/export/abort', { method: 'POST' }).catch(() => {});
    } finally {
      exportBtn.disabled = false;
    }
    return hooks.status;
  },
};
hooks.stage = () => film.stage;   // (debug: the stage, for inspecting planes in the console)
window.__film = hooks;

exportBtn.addEventListener('click', () => hooks.export());
await show(T0, 1, true);
requestAnimationFrame(tick);
