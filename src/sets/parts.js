// Canvas-made parts for the sample (UI, frames, bubbles, pixel art). Things that should look like real objects (the deco phone,
// stickers, sweets) are placeholders here until the ChatGPT props are made (mj-for-backgrounds memory: refined small objects come
// from an image model); UI, type, pixel art and frames are code's job.
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
const tagFx = (tex, fx, extra = {}) => { Object.assign(tex.userData, { fx }, extra); return tex; };      // (space.js draws these with mode 12)
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// a rounded body in white (its colour comes from the shader: holo foil / chrome)
export const bodyTex = (kit, key, w, h, r = 0.12) => kit.vcanvas('body:' + key, w, h, (g) => { g.fillStyle = '#fff'; rr(g, 2, 2, w - 4, h - 4, Math.min(w, h) * r); g.fill(); });

// the keypad half of a 2008 flip phone: pearl keys with pink numerals, a round nav key, call / end keys (drawn as they are)
export function keypadTex(kit) {
  return kit.vcanvas('keypad', 660, 1240, (g, w, h) => {
    const key = (x, y, kw, kh, label, sub, col = [255, 250, 253]) => {
      const gr = g.createLinearGradient(0, y, 0, y + kh); gr.addColorStop(0, rgb([255, 255, 255])); gr.addColorStop(0.55, rgb(col)); gr.addColorStop(1, rgb([224, 206, 232]));
      g.fillStyle = 'rgba(80,40,90,0.25)'; rr(g, x + 3, y + 6, kw, kh, kh * 0.45); g.fill();
      g.fillStyle = gr; rr(g, x, y, kw, kh, kh * 0.45); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 3; rr(g, x + 4, y + 3, kw - 8, kh * 0.45, kh * 0.3); g.stroke();
      g.fillStyle = rgb([236, 64, 150]); g.font = `${kh * 0.5}px Bungee`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, x + kw * 0.36, y + kh * 0.54);
      if (sub) { g.fillStyle = 'rgba(120,80,150,0.8)'; g.font = `${kh * 0.24}px DotGothic`; g.fillText(sub, x + kw * 0.72, y + kh * 0.56); }
    };
    // nav ring + soft keys
    const cx = w / 2, cy = 190;
    const ring = g.createRadialGradient(cx, cy - 20, 10, cx, cy, 150); ring.addColorStop(0, '#fff'); ring.addColorStop(0.7, rgb([246, 226, 250])); ring.addColorStop(1, rgb([210, 180, 230]));
    g.fillStyle = 'rgba(80,40,90,0.22)'; g.beginPath(); g.arc(cx + 3, cy + 8, 140, 0, 7); g.fill();
    g.fillStyle = ring; g.beginPath(); g.arc(cx, cy, 140, 0, 7); g.fill();
    g.fillStyle = rgb([255, 120, 190]); g.beginPath(); g.arc(cx, cy, 52, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = '44px Bungee'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♥', cx, cy + 2);
    key(40, 120, 130, 70, '✉', ''); key(w - 170, 120, 130, 70, '☆', '');
    key(40, 260, 130, 70, '☎', '', [214, 255, 236]); key(w - 170, 260, 130, 70, '⏻', '', [255, 214, 228]);
    const labels = [['1', '.,!'], ['2', 'あ'], ['3', 'か'], ['4', 'さ'], ['5', 'た'], ['6', 'な'], ['7', 'は'], ['8', 'ま'], ['9', 'や'], ['*', '゛'], ['0', 'わ'], ['#', '♪']];
    labels.forEach(([l, s], i) => key(40 + (i % 3) * 200, 420 + Math.floor(i / 3) * 180, 180, 130, l, s));
    // a little brand plate, our own
    g.fillStyle = 'rgba(150,110,190,0.75)'; g.font = '34px Unbounded'; g.textAlign = 'center'; g.fillText('TSUKUYOMI · 2008', cx, h - 60);
  });
}

// the lid seen from outside when the phone is shut: a pastel shell, a small sub-display with one new mail, rhinestones
export function lidTex(kit) {
  return kit.vcanvas('lid', 660, 1240, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, rgb([255, 214, 238])); gr.addColorStop(0.5, rgb([226, 214, 255])); gr.addColorStop(1, rgb([196, 246, 236]));
    g.fillStyle = gr; rr(g, 2, 2, w - 4, h - 4, 80); g.fill();
    g.fillStyle = rgb([24, 18, 40]); rr(g, w / 2 - 150, 220, 300, 170, 26); g.fill();
    g.fillStyle = rgb([110, 255, 230]); g.font = '64px DotGothic'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('✉ 1', w / 2, 290);
    g.font = '30px DotGothic'; g.fillStyle = rgb([255, 160, 210]); g.fillText('NEW MAIL', w / 2, 355);
    // rhinestones: a heart of small gems
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2, x = 16 * Math.pow(Math.sin(a), 3), y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
      const px = w / 2 + x * 13, py = 760 + y * 13, s = 13 + (i % 3) * 3;
      const gg = g.createRadialGradient(px - s * 0.3, py - s * 0.3, 1, px, py, s); gg.addColorStop(0, '#fff'); gg.addColorStop(0.4, rgb([255, 190, 230])); gg.addColorStop(1, rgb([200, 120, 210]));
      g.fillStyle = gg; g.beginPath(); g.arc(px, py, s, 0, 7); g.fill();
    }
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 6; rr(g, 26, 26, w - 52, h - 52, 64); g.stroke();
  });
}

// the screen's dark glass with a bezel and a highlight streak
export const glassTex = (kit) => kit.vcanvas('glass', 560, 1000, (g, w, h) => {
  g.fillStyle = rgb([16, 12, 26]); rr(g, 0, 0, w, h, 30); g.fill();
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,255,255,0.16)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.0)'); g.fillStyle = gr; rr(g, 0, 0, w, h, 30); g.fill();
});

// the mail screen (portrait): header, sender, subject — the rule's number set large; drawn as it is
export function mailTex(kit, key, o) {
  return kit.vcanvas('mail:' + key, 540, 960, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, rgb([255, 236, 248])); bg.addColorStop(1, rgb([226, 240, 255])); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    // status bar: antenna, battery
    g.fillStyle = rgb([60, 40, 90]); for (let i = 0; i < 3; i++) g.fillRect(18 + i * 16, 34 - i * 9, 11, 10 + i * 9);
    g.font = '30px VT323'; g.fillText('Y!', 78, 40); g.textAlign = 'right'; g.fillText('12:00', w - 70, 40);
    g.strokeStyle = rgb([60, 40, 90]); g.lineWidth = 3; g.strokeRect(w - 60, 18, 40, 22); g.fillRect(w - 56, 22, 28, 14); g.textAlign = 'left';
    const hd = g.createLinearGradient(0, 56, 0, 120); hd.addColorStop(0, rgb([255, 120, 190])); hd.addColorStop(1, rgb([236, 70, 150])); g.fillStyle = hd; g.fillRect(0, 56, w, 64);
    g.fillStyle = '#fff'; g.font = '36px DotGothic'; g.fillText('✉ 受信メール  ' + (o.no || '1/3'), 20, 100);
    g.fillStyle = rgb([80, 50, 110]); g.font = '28px DotGothic'; g.fillText('From: ' + (o.from || 'かぐや☆彡'), 22, 170); g.fillText('Sub: ' + (o.sub || ''), 22, 214);
    g.strokeStyle = 'rgba(140,100,170,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(16, 236); g.lineTo(w - 16, 236); g.stroke();
    // deco: small hearts and stars along the bottom
    g.font = '40px DotGothic'; g.fillStyle = rgb([255, 120, 190]); g.fillText('♡ ☆ ♡ ☆ ♡ ☆', 40, h - 50);
  });
}

// a photo-booth strip: three cells (holes) in a candy frame with stars
export function stripTex(kit) {
  return kit.vcanvas('strip', 600, 1500, (g, w, h) => {
    g.fillStyle = rgb([255, 168, 214]); rr(g, 0, 0, w, h, 50); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 70; i++) { const x = (i * 97) % w, y = (i * 211) % h; g.beginPath(); g.arc(x, y, 4 + (i % 4) * 2, 0, 7); g.fill(); }
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';      // (an OPAQUE fill cuts the window clean — the dots' 35 % white left a 65 % veil over the pictures)
    for (let i = 0; i < 3; i++) { rr(g, 50, 70 + i * 440, w - 100, 380, 56); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = '#fff'; g.lineWidth = 8; for (let i = 0; i < 3; i++) { rr(g, 50, 70 + i * 440, w - 100, 380, 28); g.stroke(); }
    g.fillStyle = '#fff'; g.font = '44px HachiMaru'; g.textAlign = 'center'; g.fillText('♡ PURI ♡', w / 2, h - 18);
  });
}

// a chat bubble (rounded, with a tail), white: coloured by mode 1
export const bubbleTex = (kit, key, w = 900, h = 260, tail = 'left') => kit.vcanvas('bubble:' + key, w, h + 60, (g) => {
  g.fillStyle = '#fff'; rr(g, 4, 4, w - 8, h - 8, h * 0.42); g.fill();
  g.beginPath(); const tx = tail === 'left' ? w * 0.16 : w * 0.84; g.moveTo(tx - 30, h - 12); g.lineTo(tx + (tail === 'left' ? -40 : 40), h + 54); g.lineTo(tx + 34, h - 12); g.closePath(); g.fill();
});

// pixel art: the Y2K pointing hand cursor, drawn as blocks so it stays crisp
export function handTex(kit) {
  const art = [
    '....XX..........', '...X..X.........', '...X..X.........', '...X..X.........', '...X..XXX.......', '...X..X..XXX....', '.XXX..X..X..XX..', 'X..X..X..X..X.X.',
    'X..X........X..X', '.X.............X', '.X.............X', '..X............X', '..X...........X.', '...X..........X.', '....X........X..', '....XXXXXXXXXX..'];
  const S = 24;
  return kit.vcanvas('hand', 16 * S + 8, 16 * S + 8, (g) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const c = art[y][x]; if (c !== 'X') continue; g.fillStyle = '#1c1228'; g.fillRect(4 + x * S, 4 + y * S, S, S);
    }
    // fill the inside white (flood from a seed)
    const inside = (x, y) => { let l = 0, r = 0; for (let i = 0; i < x; i++) if (art[y][i] === 'X') l++; for (let i = x + 1; i < 16; i++) if (art[y][i] === 'X') r++; return l > 0 && r > 0; };
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (art[y][x] === '.' && inside(x, y)) { g.fillStyle = '#fff'; g.fillRect(4 + x * S, 4 + y * S, S, S); }
  });
}

// a glossy candy button with a label
export function buttonTex(kit, key, label, col = [255, 110, 182]) {
  return kit.vcanvas('btn:' + key, 900, 260, (g, w, h) => {
    g.fillStyle = 'rgba(90,30,80,0.3)'; rr(g, 12, 22, w - 24, h - 30, (h - 30) / 2); g.fill();
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, rgb([255, 200, 230])); gr.addColorStop(0.5, rgb(col)); gr.addColorStop(1, rgb([200, 50, 130]));
    g.fillStyle = gr; rr(g, 8, 6, w - 16, h - 30, (h - 30) / 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)'; rr(g, 50, 16, w - 100, (h - 30) * 0.36, (h - 30) * 0.18); g.fill();
    g.fillStyle = '#fff'; g.font = `${h * 0.36}px HachiMaru`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeStyle = rgb([170, 30, 110]); g.lineWidth = 8; g.strokeText(label, w / 2, h * 0.44); g.fillText(label, w / 2, h * 0.44);
  });
}

// a ring (white, for mode 1): hairline or thick
export const ringTex = (kit, key, lw = 0.02) => tagFx(kit.vcanvas('ring2:' + key, 1024, 1024, (g, w) => { g.strokeStyle = '#fff'; g.lineWidth = w * lw; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - w * lw, 0, 7); g.stroke(); }), 'ring', { lw: lw * 2 });

// a sparkle (four-pointed star) in white
export const sparkTex = (kit) => tagFx(kit.vcanvas('spark', 512, 512, (g, w) => {
  const c = w / 2; g.fillStyle = '#fff'; g.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? w * 0.09 : w * 0.48; g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); }
  g.closePath(); g.fill();
  const gr = g.createRadialGradient(c, c, 0, c, c, w * 0.2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(c, c, w * 0.2, 0, 7); g.fill();
}), 'spark');

// manga marks (漫符): the anger cross, a sweat drop, three lines of surprise — drawn in white
export function mangaTex(kit, kind) {
  return tagFx(kit.vcanvas('manga:' + kind, 512, 512, (g, w) => {
    g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = 'round'; g.lineWidth = w * 0.07;
    if (kind === 'anger') { for (let i = 0; i < 4; i++) { g.save(); g.translate(w / 2, w / 2); g.rotate((i * Math.PI) / 2 + Math.PI / 4); g.beginPath(); g.arc(w * 0.2, w * 0.2, w * 0.13, Math.PI * 0.9, Math.PI * 1.6); g.stroke(); g.restore(); } }
    else if (kind === 'sweat') { g.beginPath(); g.moveTo(w / 2, w * 0.1); g.bezierCurveTo(w * 0.72, w * 0.45, w * 0.78, w * 0.62, w * 0.5, w * 0.88); g.bezierCurveTo(w * 0.22, w * 0.62, w * 0.28, w * 0.45, w / 2, w * 0.1); g.fill(); }
    else { for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i - 1) * 0.45; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * w * 0.18, w * 0.75 + Math.sin(a) * w * 0.18); g.lineTo(w / 2 + Math.cos(a) * w * 0.44, w * 0.75 + Math.sin(a) * w * 0.44); g.stroke(); } }
  }), 'manga');
}

// the photo-booth "scribble" frame (big): a candy border round a rounded window, a stamp palette down the right side
export function boothTex(kit) {
  return kit.vcanvas('booth2', 1920, 1080, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, rgb([255, 190, 226])); gr.addColorStop(0.5, rgb([232, 210, 255])); gr.addColorStop(1, rgb([186, 240, 232]));
    g.fillStyle = gr; rr(g, 0, 0, w, h, 120); g.fill(); g.save(); rr(g, 0, 0, w, h, 120); g.clip();      // (2026-11-24, "取景框的素材做圆角处理": the plate's own corners rounded too)
    g.fillStyle = 'rgba(255,255,255,0.45)'; for (let i = 0; i < 140; i++) { const x = (i * 337) % w, y = (i * 571) % h, s = 3 + (i % 5) * 2; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); }
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; rr(g, 70, 70, w - 420, h - 140, 100); g.fill(); g.globalCompositeOperation = 'source-over';   // (opaque cut: the dots' 45 % white had left a 55 % pastel veil over the live — "取景框没有画面", the haze)
    g.strokeStyle = '#fff'; g.lineWidth = 14; rr(g, 70, 70, w - 420, h - 140, 100); g.stroke();
    // the stamp palette
    g.fillStyle = 'rgba(255,255,255,0.75)'; rr(g, w - 310, 90, 250, h - 180, 40); g.fill();
    g.font = '46px HachiMaru'; g.textAlign = 'center'; g.fillStyle = rgb([236, 70, 150]); g.fillText('らくがき', w - 185, 160);
    const marks = ['♡', '☆', '♪', '✿', '★', '♥'];
    marks.forEach((m, i) => { g.fillStyle = rgb([[255, 110, 182], [140, 110, 230], [57, 197, 187], [255, 170, 60], [236, 70, 150], [255, 120, 190]][i]); rr(g, w - 280, 210 + i * 125, 190, 105, 30); g.fill(); g.fillStyle = '#fff'; g.font = '72px Bungee'; g.fillText(m, w - 185, 290 + i * 125); });
    g.restore(); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 6; rr(g, 14, 14, w - 28, h - 28, 108); g.stroke();      // (a pearl lip just inside the rounded rim)
  });
}

// signal bars (0 … 3) for the build into the chorus — pixel blocks
export function barsTex(kit, n) {
  return kit.vcanvas('bars:' + n, 400, 300, (g) => {
    for (let i = 0; i < 3; i++) { g.fillStyle = i < n ? '#fff' : 'rgba(255,255,255,0.22)'; g.fillRect(60 + i * 100, 220 - i * 70, 70, 60 + i * 70); }
    g.fillStyle = '#fff'; g.fillRect(20, 40, 18, 240); g.beginPath(); g.moveTo(0, 40); g.lineTo(58, 40); g.lineTo(29, 90); g.closePath(); g.fill();
  });
}

// the live stream window (broadcast chrome over the footage): a frame with a title bar; drawn as it is
export function streamTex(kit) {
  return kit.vcanvas('stream', 1920, 1160, (g, w, h) => {
    g.fillStyle = rgb([24, 14, 40]); rr(g, 0, 0, w, h, 26); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; rr(g, 14, 70, w - 28, h - 84, 78); g.fill(); g.globalCompositeOperation = 'source-over';   // (rounded like the footage under it: 0.12 world)
    const tb = g.createLinearGradient(0, 0, 0, 70); tb.addColorStop(0, rgb([255, 90, 180])); tb.addColorStop(1, rgb([150, 40, 200])); g.fillStyle = tb; rr(g, 0, 0, w, 76, 26); g.fill(); g.fillRect(0, 40, w, 30);
    g.fillStyle = '#fff'; g.font = '40px Unbounded'; g.textBaseline = 'middle'; g.fillText('TSUKUYOMI LIVE', 34, 38);
    g.fillStyle = rgb([255, 40, 60]); g.beginPath(); g.arc(w - 200, 38, 13, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '34px Bungee'; g.fillText('LIVE', w - 176, 40);
    for (let i = 0; i < 3; i++) { g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(w - 420 + i * 56, 22, 34, 32); }
  });
}

// a loading bar frame (white, for mode 1)
export const loadFrameTex = (kit) => kit.vcanvas('loadframe', 1600, 180, (g, w, h) => { g.strokeStyle = '#fff'; g.lineWidth = 14; rr(g, 10, 10, w - 20, h - 20, 30); g.stroke(); });
export const blockTex = (kit) => kit.vcanvas('block', 64, 64, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); });

// a glossy candy (heart / star / drop) — a placeholder for the ChatGPT sweets
export function candyTex(kit, kind, col) {
  return kit.vcanvas('candy:' + kind + col.join(','), 512, 512, (g, w) => {
    const c = w / 2; g.beginPath();
    if (kind === 'heart') { for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2, x = 16 * Math.pow(Math.sin(a), 3), y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); g.lineTo(c + x * 14, c + y * 14); } }
    else if (kind === 'star') { for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? w * 0.2 : w * 0.45; g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); } }
    else g.arc(c, c, w * 0.42, 0, 7);
    g.closePath();
    const gr = g.createRadialGradient(c - w * 0.12, c - w * 0.14, w * 0.02, c, c, w * 0.5); gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, rgb(col.map((x) => Math.min(255, x + 50)))); gr.addColorStop(1, rgb(col.map((x) => x * 0.7)));
    g.fillStyle = gr; g.fill(); g.lineWidth = 16; g.strokeStyle = '#fff'; g.stroke();
  });
}

// a full-frame "mail incoming" screen: a 1–2-frame punctuation insert (pixel UI on deco pink)
export function incomingTex(kit) {
  return kit.vcanvas('incoming', 960, 540, (g, w, h) => {
    g.fillStyle = rgb([236, 54, 150]); g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.12)'; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2);
    g.fillStyle = '#fff'; const S = 12, env = ['XXXXXXXXXXXXXXXX', 'XX............XX', 'X.X..........X.X', 'X..X........X..X', 'X...X......X...X', 'X....X....X....X', 'X.....XXXX.....X', 'X..............X', 'XXXXXXXXXXXXXXXX'];
    env.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'X') g.fillRect(w / 2 - 8 * S + x * S, 120 + y * S, S, S); }));
    g.font = '64px DotGothic'; g.textAlign = 'center'; g.fillText('メール受信中…', w / 2, 330); g.font = '40px VT323'; g.fillText('NEW MESSAGE ♡', w / 2, 390);
    g.fillRect(w / 2 - 240, 430, 480, 20); g.fillStyle = rgb([255, 240, 120]); g.fillRect(w / 2 - 236, 434, 300, 12);
  });
}

// a translation chip: a rounded pill in white (coloured by mode 1) — the gloss set into a Japanese line
export const pillTex = (kit) => kit.vcanvas('pill', 640, 200, (g, w, h) => { g.fillStyle = '#fff'; rr(g, 4, 4, w - 8, h - 8, (h - 8) / 2); g.fill(); });
// a purikura label sticker: a white border round a coloured middle, a gloss stripe (drawn as it is)
export function labelStk(kit, col) {
  return kit.vcanvas('lbl:' + col.join(','), 700, 230, (g, w, h) => {
    g.fillStyle = '#fff'; rr(g, 4, 4, w - 8, h - 8, 60); g.fill();
    g.fillStyle = rgb(col); rr(g, 22, 22, w - 44, h - 44, 44); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; rr(g, 40, 30, w - 80, (h - 60) * 0.35, 30); g.fill();
  });
}

// a hologram's frame (white, for mode 1): one thin rounded outline, nothing else (the user: "futurism的体现应该是有简约设计感，而非是脉冲线条")
export const holoFrameTex = (kit) => kit.vcanvas('holoframe4', 1920, 1080, (g, w, h) => { g.strokeStyle = '#fff'; g.lineWidth = 10; rr(g, 16, 16, w - 32, h - 32, 168); g.stroke(); g.lineWidth = 3; rr(g, 34, 34, w - 68, h - 68, 150); g.stroke(); });   // (corners as round as the footage they frame; a second hairline)

// a photo card behind a figure whose drawing was cut by its canvas (the user, 2026-11-24: cut edges used as they are "显得很奇怪"):
// the card's sides sit exactly on the cut lines so the crop reads as the card's, the head pops out above it. Fill (white, for the foil
// mode) and rim (a thin inset outline) are separate textures, keyed by the card's aspect.
export const cardTex = (kit, asp) => { const W = 512, H = Math.round(W / asp), r = W * 0.07;
  return kit.vcanvas('card:' + asp.toFixed(3), W, H, (g, w, h) => { g.fillStyle = '#fff'; rr(g, 2, 2, w - 4, h - 4, r); g.fill(); }); };
export const cardRimTex = (kit, asp, label = 'TSUKUYOMI · ID') => { const W = 512, H = Math.round(W / asp), r = W * 0.055;
  return kit.vcanvas('cardrim:' + asp.toFixed(3) + label, W, H, (g, w, h) => { g.strokeStyle = '#fff'; g.lineWidth = 5; rr(g, 14, 14, w - 28, h - 28, r); g.stroke();
    g.fillStyle = '#fff'; g.font = '600 15px Unbounded, sans-serif'; g.fillText(label, 30, h - 30); g.beginPath(); g.arc(w - 36, h - 36, 6, 0, 7); g.fill(); }); };

// the holo card's back (a card turns over when it changes pose): deep indigo pearl, a moon disc, the world's name small
export const cardBackTex = (kit) => kit.vcanvas('cardback', 788, 1100, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2a1d5e'); gr.addColorStop(0.5, '#4b2f86'); gr.addColorStop(1, '#1b1440');
  g.fillStyle = gr; rr(g, 2, 2, w - 4, h - 4, 50); g.fill();
  g.strokeStyle = 'rgba(230,220,255,0.85)'; g.lineWidth = 5; rr(g, 22, 22, w - 44, h - 44, 38); g.stroke();
  const rg = g.createRadialGradient(w / 2, h * 0.45, 10, w / 2, h * 0.45, w * 0.3); rg.addColorStop(0, '#fffaf0'); rg.addColorStop(0.7, '#e9dcff'); rg.addColorStop(1, 'rgba(233,220,255,0)');
  g.fillStyle = rg; g.beginPath(); g.arc(w / 2, h * 0.45, w * 0.3, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; for (const r of [0.34, 0.38]) { g.beginPath(); g.arc(w / 2, h * 0.45, w * r, 0, 7); g.stroke(); }
  g.fillStyle = 'rgba(240,232,255,0.95)'; g.font = '600 34px Unbounded, sans-serif'; g.textAlign = 'center'; g.fillText('TSUKUYOMI', w / 2, h * 0.8);
  g.font = '400 18px Unbounded, sans-serif'; g.fillText('WORLD IS MINE · 2030', w / 2, h * 0.84);
});
// a soft round glow (white, for mode 1): the light behind a card, its shadow when tinted dark
export const glowTex = (kit) => kit.vcanvas('glow', 256, 256, (g, w) => { const rg = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.45, 'rgba(255,255,255,0.45)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, w); });

// a rarity burst (gacha reveal): tapered rays from the centre, white for mode 1
export const raysTex = (kit) => kit.vcanvas('rays', 512, 512, (g, w) => {
  const c = w / 2; for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, da = (i % 2 ? 0.05 : 0.09), r = c * (i % 2 ? 0.8 : 1);
    const gr = g.createLinearGradient(c, c, c + Math.cos(a) * r, c + Math.sin(a) * r); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a - da) * r, c + Math.sin(a - da) * r); g.lineTo(c + Math.cos(a + da) * r, c + Math.sin(a + da) * r); g.closePath(); g.fill(); }
});

// a phone notification banner (replaces the full-frame 2-frame insert that read as a bad frame — the user, 2026-11-24 "约0:00:04处存在纯色坏帧")
export const notifTex = (kit, k) => kit.vcanvas('notif' + k, 900, 210, (g, w, h) => {
  g.fillStyle = 'rgba(255,255,255,0.92)'; rr(g, 4, 4, w - 8, h - 8, 52); g.fill();
  g.strokeStyle = 'rgba(236,120,190,0.9)'; g.lineWidth = 4; rr(g, 4, 4, w - 8, h - 8, 52); g.stroke();
  const gr = g.createLinearGradient(40, 40, 160, 170); gr.addColorStop(0, '#ff7ac0'); gr.addColorStop(1, '#a86bff'); g.fillStyle = gr; rr(g, 40, 40, 130, 130, 34); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 7; g.beginPath(); g.rect(68, 78, 74, 52); g.moveTo(68, 80); g.lineTo(105, 108); g.lineTo(142, 80); g.stroke();
  g.fillStyle = '#3a2560'; g.font = '700 54px Unbounded, sans-serif'; g.fillText(`NEW RULE 0${k} / 03`, 200, 104);
  g.fillStyle = '#9a6ab8'; g.font = '500 34px HachiMaru, sans-serif'; g.fillText('メール受信 · いま', 200, 160);
});

// the WISHLIST bar of the intro (五つの難題 as a Y2K wish list): a pearl acrylic bar, its title, five slots (white, for mode 9 + tint)
export const wishTex = (kit) => kit.vcanvas('wish', 1700, 300, (g, w, h) => {
  g.fillStyle = 'rgba(255,255,255,0.9)'; rr(g, 6, 6, w - 12, h - 12, 60); g.fill();
  g.strokeStyle = 'rgba(214,150,220,1)'; g.lineWidth = 6; rr(g, 6, 6, w - 12, h - 12, 60); g.stroke();
  g.fillStyle = '#5a3a8a'; g.font = '700 44px Unbounded, sans-serif'; g.fillText('WISHLIST', 48, 70); g.font = '500 34px HachiMaru, sans-serif'; g.fillText('五つの難題', 330, 68);
  for (let k = 0; k < 5; k++) { const x = 60 + k * 322; g.strokeStyle = 'rgba(160,120,200,0.9)'; g.setLineDash([12, 10]); g.lineWidth = 4; rr(g, x, 100, 276, 170, 26); g.stroke(); g.setLineDash([]);
    g.fillStyle = 'rgba(160,120,200,0.7)'; g.font = '600 26px Unbounded, sans-serif'; g.fillText(`0${k + 1}`, x + 14, 132); }
});
// the counter beside it: "0 / 5 CLEARED" (k = how many cleared)
export const wishCountTex = (kit, k) => kit.vcanvas('wishc' + k, 520, 140, (g, w, h) => { g.fillStyle = '#5a3a8a'; g.font = '700 64px Unbounded, sans-serif'; g.fillText(`${k} / 5`, 10, 80); g.font = '600 26px Unbounded, sans-serif'; g.fillText('CLEARED', 12, 124); });

// ---- the opening's ornament families (the user, 2026-11-24: "intro可以做的更精彩精致一些，整体效果要华丽，素材可以多有设计感的堆砌一些") ----
// a moon dial: a 和時計 / astrolabe in hairlines — bead rim, 240 ticks, a ring of running type, twelve moon phases, the twelve hours
// (子 … 亥) between spokes, an eight-point star and a rosette at the heart. White: its colour and metal come from the shader (mode 9 metal).
export const dialTex = (kit, hollow = false) => kit.vcanvas(hollow ? 'dialH' : 'dial', 2048, 2048, (g, w) => {      // (hollow: its heart left open — a ring the camera flies through)
  const c = w / 2, P = Math.PI * 2, ring = (r, lw, a = 1) => { g.globalAlpha = a; g.lineWidth = lw; g.beginPath(); g.arc(c, c, r, 0, P); g.stroke(); g.globalAlpha = 1; };
  g.strokeStyle = '#fff'; g.fillStyle = '#fff';
  for (let i = 0; i < 96; i++) { const a = (i / 96) * P; g.beginPath(); g.arc(c + Math.cos(a) * 1006, c + Math.sin(a) * 1006, i % 4 ? 4 : 7, 0, P); g.fill(); }
  ring(990, 6); ring(976, 2); ring(905, 2); ring(890, 1.2, 0.7); ring(770, 4); ring(756, 1.5); ring(560, 2.5); ring(545, 1.2, 0.7); ring(430, 1.5);
  for (let i = 0; i < 240; i++) { const a = (i / 240) * P, r1 = i % 20 === 0 ? 930 : i % 5 === 0 ? 950 : 962; g.lineWidth = i % 5 === 0 ? 3 : 1.5; g.beginPath(); g.moveTo(c + Math.cos(a) * 976, c + Math.sin(a) * 976); g.lineTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1); g.stroke(); }
  const txt = 'TSUKUYOMI ✦ 月見ヤチヨ ✦ かぐや ✦ WORLD IS MINE ✦ 2030 ✦ 竹取物語 ✦ ';
  g.font = '34px DelaGothic, Unbounded, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  let a = -Math.PI / 2; const R = 845, chars = [...txt.repeat(3)];
  for (const ch of chars) { const wch = g.measureText(ch).width + 6; const da = wch / R; if (a + da > P * 0.75 + 0.0) break; g.save(); g.translate(c + Math.cos(a + da / 2) * R, c + Math.sin(a + da / 2) * R); g.rotate(a + da / 2 + Math.PI / 2); g.fillText(ch, 0, 0); g.restore(); a += da; }
  for (let k = 0; k < 12; k++) {                                   // the twelve moon phases on the inner band
    const aa = (k / 12) * P - Math.PI / 2, mx = c + Math.cos(aa) * 700, my = c + Math.sin(aa) * 700, r = 30, ph = k / 12;
    g.lineWidth = 2; g.beginPath(); g.arc(mx, my, r, 0, P); g.stroke();
    g.save(); g.beginPath(); g.arc(mx, my, r, 0, P); g.clip(); g.beginPath(); g.arc(mx, my, r, 0, P); g.fill();
    g.globalCompositeOperation = 'destination-out'; const off = Math.cos(ph * P) * r * 2; g.beginPath(); g.arc(mx + (ph < 0.5 ? off : -off) * 1.0, my, r * 1.02, 0, P); g.fill(); g.restore();
  }
  const HRS = '子丑寅卯辰巳午未申酉戌亥'; g.font = '64px DelaGothic, sans-serif';
  for (let k = 0; k < 12; k++) { const aa = (k / 12) * P - Math.PI / 2, ab = aa + P / 24;
    g.lineWidth = 2; g.beginPath(); g.moveTo(c + Math.cos(ab) * 560, c + Math.sin(ab) * 560); g.lineTo(c + Math.cos(ab) * 756, c + Math.sin(ab) * 756); g.stroke();
    g.save(); g.translate(c + Math.cos(aa) * 618, c + Math.sin(aa) * 618); g.rotate(aa + Math.PI / 2); g.fillText(HRS[k], 0, 0); g.restore(); }
  if (hollow) { ring(530, 3); ring(518, 1.2, 0.6); for (let i = 0; i < 48; i++) { const a = (i / 48) * P; g.beginPath(); g.arc(c + Math.cos(a) * 505, c + Math.sin(a) * 505, i % 4 ? 3 : 6, 0, P); g.fill(); } return; }
  g.lineWidth = 2.5; for (const rot of [0, Math.PI / 4]) { g.beginPath(); for (let i = 0; i < 4; i++) { const aa = rot + (i / 4) * P; g.lineTo(c + Math.cos(aa) * 420, c + Math.sin(aa) * 420); } g.closePath(); g.stroke(); }
  g.lineWidth = 1.3; g.beginPath();                                // a hypotrochoid rosette inside the star
  for (let i = 0; i <= 3600; i++) { const t = (i / 3600) * P * 9, Rr = 270, r = 30, d = 80; g.lineTo(c + (Rr - r) * Math.cos(t) + d * Math.cos(((Rr - r) / r) * t), c + (Rr - r) * Math.sin(t) - d * Math.sin(((Rr - r) / r) * t)); }
  g.stroke(); ring(120, 3); ring(108, 1.2);
});
// a band of suyari clouds (the 絵巻's gold mist, as separate pieces to slide in depth): overlapping capsules, a gold gradient, a dark
// keyline, inner lines and cut-gold flakes. Coloured paint (not white): mode 9 metal gives it its shine.
export const kumoTex = (kit, k = 0) => kit.vcanvas('kumo' + k, 2400, 340, (g, w, h) => {
  const rnd = (i) => { const x = Math.sin((i + k * 17.3) * 127.1) * 43758.5453; return x - Math.floor(x); };
  const caps = []; let x = 40; for (let i = 0; x < w - 200; i++) { const cw = 360 + rnd(i) * 520, ch = 70 + rnd(i + 9) * 60, cy = 60 + rnd(i + 3) * (h - 140 - ch); caps.push([x, cy, Math.min(cw, w - 40 - x), ch]); x += cw * (0.45 + rnd(i + 5) * 0.3); }
  for (const [x0, y0, cw, ch] of caps) { g.fillStyle = 'rgb(150,104,44)'; rr(g, x0 - 5, y0 - 5, cw + 10, ch + 10, (ch + 10) / 2); g.fill(); }
  for (const [x0, y0, cw, ch] of caps) {
    const gr = g.createLinearGradient(0, y0, 0, y0 + ch); gr.addColorStop(0, 'rgb(255,242,200)'); gr.addColorStop(0.55, 'rgb(240,206,128)'); gr.addColorStop(1, 'rgb(214,166,82)');
    g.fillStyle = gr; rr(g, x0, y0, cw, ch, ch / 2); g.fill();
    g.strokeStyle = 'rgba(200,150,70,0.8)'; g.lineWidth = 2; for (let j = 1; j < 4; j++) { g.beginPath(); g.moveTo(x0 + ch * 0.6, y0 + ch * j / 4); g.lineTo(x0 + cw - ch * 0.6, y0 + ch * j / 4); g.stroke(); }
    g.save(); rr(g, x0, y0, cw, ch, ch / 2); g.clip();
    for (let j = 0; j < cw / 9; j++) { const fx = x0 + rnd(j * 3.1 + x0) * cw, fy = y0 + rnd(j * 7.7 + y0) * ch, s = 2 + rnd(j + x0 * 0.1) * 6; g.fillStyle = `rgba(255,250,225,${0.5 + 0.5 * rnd(j * 1.3)})`; g.fillRect(fx, fy, s * (rnd(j) > 0.7 ? 2.5 : 1), s); }
    g.restore();
  }
});
// a plain card rim (the opening's tile wall: many cards side by side showing one picture): the metal ring of the fronts and a hairline
// just inside the window. White: mode 9 metal colours it.
export const tileRimTex = (kit) => kit.vcanvas('tilerim2', 716, 1000, (g, w, h) => {
  const R = h * 0.045, ins = h * 0.032, RI = h * 0.075; g.fillStyle = '#fff'; rr(g, 1, 1, w - 2, h - 2, R); g.fill();      // (the window rounder than the card: a thicker metal corner — "取景框可以做圆角设计")
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; rr(g, ins, ins, w - 2 * ins, h - 2 * ins, RI); g.fill(); g.globalCompositeOperation = 'source-over';
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2.5; rr(g, ins + 7, ins + 7, w - 2 * ins - 14, h - 2 * ins - 14, RI - 6); g.stroke();
});
// the picture scroll's cover (表紙): indigo brocade with a gold lattice of small medallions, and a pale title slip (題簽) set on it:
// 「竹取絵巻」 in ink, ver.2026 under it
export const emakiCoverTex = (kit) => kit.vcanvas('emakicover', 420, 1360, (g, w, h) => {
  g.fillStyle = 'rgb(44,30,86)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(232,198,120,0.85)'; g.lineWidth = 2;
  for (let y = 20; y < h; y += 56) for (let x = (y / 56) % 2 ? 28 : 0; x < w + 28; x += 56) { g.beginPath(); g.arc(x, y, 14, 0, 7); g.stroke(); g.beginPath(); g.arc(x, y, 5, 0, 7); g.fillStyle = 'rgba(232,198,120,0.9)'; g.fill(); }
  g.fillStyle = 'rgb(214,170,90)'; g.fillRect(w - 16, 0, 16, h);
  const sx = 110, sy = 120, sw = 150, sh = 760; g.fillStyle = 'rgb(250,244,226)'; g.fillRect(sx, sy, sw, sh);
  g.strokeStyle = 'rgb(196,150,80)'; g.lineWidth = 6; g.strokeRect(sx + 8, sy + 8, sw - 16, sh - 16);
  g.fillStyle = 'rgb(40,24,60)'; g.font = '108px DelaGothic'; g.textAlign = 'center'; g.textBaseline = 'middle';
  [...'竹取絵巻'].forEach((ch, i) => g.fillText(ch, sx + sw / 2, sy + 110 + i * 148));
  g.font = '700 30px Unbounded'; g.fillStyle = 'rgb(180,60,110)'; g.save(); g.translate(sx + sw / 2, sy + sh + 60); g.fillText('ver.2026', 0, 0); g.restore();
});
// the scroll's roller (軸): a gold rod, shaded round, with turned knobs at both ends
export const rollerTex = (kit) => kit.vcanvas('roller', 160, 1400, (g, w, h) => {
  const rod = (x0, x1, y0, y1) => { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgb(120,78,30)'); gr.addColorStop(0.35, 'rgb(255,236,170)'); gr.addColorStop(0.55, 'rgb(236,190,100)'); gr.addColorStop(1, 'rgb(110,70,26)'); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0); };
  rod(40, 120, 60, h - 60);
  for (const y of [0, h - 90]) { rod(10, 150, y + 10, y + 80); g.fillStyle = 'rgba(255,250,230,0.8)'; g.fillRect(10, y + 40, 140, 3); }
});
// the foldable's lock screen (one picture, cut into two adjacent crops for the lid's and the body's halves while it unfolds, so the
// crease shows no seam — the user, 2026-11-24: "手机刚展开的时候还是有接缝"): a pastel pearl gradient, a soft moon, the clock, the date,
// a TSUKUYOMI notification pill and the two corner buttons. asp = height / width of the inner screen.
export const lockTex = (kit, asp) => kit.vcanvas('lock' + asp.toFixed(3), 640, Math.round(640 * asp), (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w * 0.4, h); gr.addColorStop(0, 'rgb(206,190,255)'); gr.addColorStop(0.5, 'rgb(255,196,228)'); gr.addColorStop(1, 'rgb(186,242,228)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const rg = g.createRadialGradient(w * 0.7, h * 0.3, 0, w * 0.7, h * 0.3, w * 0.55); rg.addColorStop(0, 'rgba(255,255,255,0.75)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, h);
  g.save(); g.beginPath(); g.rect(0, 0, w, h); g.arc(w * 0.7 + w * 0.06, h * 0.3 - w * 0.035, w * 0.12, 0, 7); g.clip('evenodd');      // (a crescent: the disc clipped, not cut — a cut showed the dark glass through)
  g.fillStyle = 'rgb(255,226,150)'; g.shadowColor = 'rgba(255,240,200,0.9)'; g.shadowBlur = 30; g.beginPath(); g.arc(w * 0.7, h * 0.3, w * 0.13, 0, 7); g.fill(); g.restore(); g.shadowBlur = 0;
  for (let i = 0; i < 60; i++) { const x = (i * 337) % w, y = (i * 571) % h, s = 1.5 + (i % 4); g.fillStyle = `rgba(255,255,255,${0.35 + (i % 3) * 0.2})`; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); }
  g.textAlign = 'center'; g.fillStyle = 'rgba(70,46,120,0.92)'; g.font = '300 150px Unbounded'; g.fillText('20:30', w / 2, h * 0.17);
  g.font = '600 30px Unbounded'; g.fillStyle = 'rgba(90,60,140,0.85)'; g.fillText('MOON VIEWING · 満月', w / 2, h * 0.22);
  const py = h * 0.62; g.fillStyle = 'rgba(255,255,255,0.72)'; rr(g, 40, py, w - 80, 118, 40); g.fill();
  g.fillStyle = 'rgb(140,92,230)'; g.beginPath(); g.arc(98, py + 59, 30, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '34px DelaGothic'; g.fillText('月', 98, py + 71);
  g.textAlign = 'left'; g.fillStyle = 'rgb(70,46,120)'; g.font = '700 28px Unbounded'; g.fillText('TSUKUYOMI LIVE', 150, py + 50); g.font = '26px HachiMaru'; g.fillStyle = 'rgb(110,80,160)'; g.fillText('まもなく開演 ✦ ワールドイズマイン', 150, py + 90);
  g.textAlign = 'center'; for (const x of [110, w - 110]) { g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(x, h - 120, 52, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(70,46,120,0.8)'; rr(g, w / 2 - 90, h - 40, 180, 10, 5); g.fill();
});
// a neon sign for the interlude's shouts (PLAN-v2 §4: 霓虹招牌, bilingual on its tubes): a dark lacquer plate with a glowing border, the
// Japanese as a big neon tube, the Chinese as a smaller tube in a second colour under it. Drawn in its own colours (mode 0).
export const neonSignTex = (kit, key, ja, zh, c1, c2) => kit.vcanvas('neon:' + key, 1400, 620, (g, w, h) => {
  const tube = (txt, x, y, px, font, col, lw) => { g.font = `${px}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.shadowColor = rgb(col); g.shadowBlur = 40; g.strokeStyle = rgb(col, 0.85); g.lineWidth = lw * 2.2; g.strokeText(txt, x, y);
    g.shadowBlur = 16; g.strokeStyle = rgb(col); g.lineWidth = lw; g.strokeText(txt, x, y); g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,0.92)'; g.lineWidth = lw * 0.38; g.strokeText(txt, x, y); };
  g.fillStyle = 'rgba(18,10,34,0.92)'; rr(g, 30, 30, w - 60, h - 60, 60); g.fill();
  g.shadowColor = rgb(c1); g.shadowBlur = 30; g.strokeStyle = rgb(c1); g.lineWidth = 10; rr(g, 52, 52, w - 104, h - 104, 46); g.stroke(); g.shadowBlur = 0;
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 3; rr(g, 52, 52, w - 104, h - 104, 46); g.stroke();
  tube(ja, w / 2, h * 0.4, 220, 'DelaGothic', c1, 12); tube(zh, w / 2, h * 0.76, 150, 'ChillRound', c2, 9);
});
// a bokeh disc (the drawn effects' aperture disc, mode 12 kind 1)
export const bokehTex = (kit) => tagFx(kit.vcanvas('bokeh', 256, 256, (g, w) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 7); g.fill(); }), 'bokeh');

// ---- the game UI kit (the user, 2026-11-24: "可以加一些gaming visual elements，素材的标准按照我们的现有规则来：精致，有质感和观赏性") ----
// Tsukuyomi is a game world. One look for all of it: dark glass panels with a fine hex weave and a top sheen, gradient neon borders
// (pink → lilac → cyan) with a glow, corner brackets, a header bar, glowing type. Drawn in their own colours (mode 0, or mode 9 acrylic).
const NEON = ['rgb(255,92,190)', 'rgb(190,140,255)', 'rgb(80,230,255)'];
const neonBorder = (g, x, y, w, h, r, lw) => { const gr = g.createLinearGradient(x, y, x + w, y + h); NEON.forEach((c, i) => gr.addColorStop(i / 2, c)); g.strokeStyle = gr; g.lineWidth = lw; g.shadowColor = 'rgba(200,140,255,0.9)'; g.shadowBlur = lw * 3; rr(g, x, y, w, h, r); g.stroke(); g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = Math.max(1, lw * 0.3); rr(g, x, y, w, h, r); g.stroke(); };
const glassPanel = (g, x, y, w, h, r) => {
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(46,26,92,0.9)'); gr.addColorStop(1, 'rgba(14,8,36,0.94)'); g.fillStyle = gr; rr(g, x, y, w, h, r); g.fill();
  g.save(); rr(g, x, y, w, h, r); g.clip(); g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1;
  for (let yy = y; yy < y + h + 18; yy += 16) for (let xx = x + ((yy / 16) % 2) * 14; xx < x + w + 18; xx += 28) { g.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; g.lineTo(xx + Math.cos(a) * 8, yy + Math.sin(a) * 8); } g.closePath(); g.stroke(); }
  const sh = g.createLinearGradient(0, y, 0, y + h * 0.5); sh.addColorStop(0, 'rgba(255,255,255,0.16)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(x, y, w, h * 0.5); g.restore(); };
const brackets = (g, x, y, w, h, s, col, lw = 5) => { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { g.beginPath(); g.moveTo(cx, cy + dy * s); g.lineTo(cx, cy); g.lineTo(cx + dx * s, cy); g.stroke(); } };
// (a weight goes before the size — "54px 800 Unbounded" is not a font, and the canvas fell back to 10 px)
const glowText = (g, txt, x, y, px, font, fill, glow, align = 'center') => { const wm = font.match(/^(\d{3})\s+(.*)$/); g.font = wm ? `${wm[1]} ${px}px ${wm[2]}` : `${px}px ${font}`; g.textAlign = align; g.textBaseline = 'middle'; g.shadowColor = glow; g.shadowBlur = px * 0.3; g.fillStyle = fill; g.fillText(txt, x, y); g.shadowBlur = 0; g.fillText(txt, x, y); };
// a judgment / banner word: slanted, a vertical gradient through the letters, a white outline, a coloured glow, a glint line
export const judgeTex = (kit, word, c1 = [255, 120, 210], c2 = [120, 230, 255], px = 200) => kit.vcanvas('judge:' + word + c1 + c2, Math.round(word.length * px * 0.82 + px * 1.2), Math.round(px * 1.7), (g, w, h) => {
  g.save(); g.translate(w / 2, h / 2); g.transform(1, 0, -0.2, 1, 0, 0); g.font = `800 ${px}px Unbounded, DelaGothic, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.shadowColor = rgb(c1, 0.95); g.shadowBlur = px * 0.35; g.strokeStyle = rgb(c1); g.lineWidth = px * 0.22; g.strokeText(word, 0, 0); g.shadowBlur = 0;
  g.strokeStyle = '#fff'; g.lineWidth = px * 0.11; g.strokeText(word, 0, 0);
  const gr = g.createLinearGradient(0, -px * 0.5, 0, px * 0.5); gr.addColorStop(0, '#fff'); gr.addColorStop(0.45, rgb(c1)); gr.addColorStop(0.5, rgb(c2)); gr.addColorStop(1, '#fff'); g.fillStyle = gr; g.fillText(word, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(-w, -px * 0.08, w * 2, px * 0.05); g.restore(); });
// a combo counter: the number big in chrome, COMBO small under it
export const comboTex = (kit, n) => kit.vcanvas('combo8:' + n, 520, 300, (g, w, h) => {      // (8-bit digits with a stepped shadow, COMBO in pixel type)
  g.font = '230px VT323, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; const cx = w / 2, cy = h * 0.4;
  g.fillStyle = 'rgb(90,30,140)'; for (let k = 1; k <= 4; k++) g.fillText(String(n), cx + k * 6, cy + k * 6);
  g.strokeStyle = '#fff'; g.lineWidth = 12; g.strokeText(String(n), cx, cy);
  g.save(); g.beginPath(); g.rect(0, 0, w, cy); g.clip(); g.fillStyle = 'rgb(255,150,220)'; g.fillText(String(n), cx, cy); g.restore();
  g.save(); g.beginPath(); g.rect(0, cy, w, h); g.clip(); g.fillStyle = 'rgb(150,120,255)'; g.fillText(String(n), cx, cy); g.restore();
  glowText(g, 'COMBO', w / 2, h * 0.86, 76, 'VT323, monospace', '#fff', 'rgba(120,230,255,0.9)'); });
// a game window: glass panel, gradient header bar with its title, rows of label · value, brackets. rows: [[label, value, colour?], …]
export const windowTex = (kit, key, title, rows, w = 1100, h = 120 + rows.length * 96) => kit.vcanvas('gwin:' + key, w, h, (g) => {
  glassPanel(g, 10, 10, w - 20, h - 20, 34); neonBorder(g, 10, 10, w - 20, h - 20, 34, 6);
  const hb = g.createLinearGradient(30, 0, w - 30, 0); hb.addColorStop(0, 'rgba(255,92,190,0.9)'); hb.addColorStop(1, 'rgba(120,120,255,0.75)'); g.fillStyle = hb; rr(g, 30, 30, w - 60, 72, 24); g.fill();
  glowText(g, title, 60, 67, 52, 'DotGothic, VT323, monospace', '#fff', 'rgba(255,255,255,0.6)', 'left'); g.fillStyle = 'rgba(255,255,255,0.9)'; for (let k = 0; k < 3; k++) g.fillRect(w - 92 - k * 34, 56, 20, 20);   // (8-bit: pixel type, square pips — the user: "加一点8bit风格")
  rows.forEach(([lab, val, col], i) => { const y = 160 + i * 96;
    g.strokeStyle = 'rgba(190,150,255,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(60, y + 40); g.lineTo(w - 60, y + 40); g.stroke();
    g.fillStyle = 'rgb(255,92,190)'; g.fillRect(52, y - 8, 14, 14);
    glowText(g, lab, 80, y, 42, 'DotGothic, ChillRound, monospace', 'rgb(214,196,255)', 'rgba(160,120,255,0.6)', 'left');
    glowText(g, val, w - 70, y, 66, 'VT323, DotGothic, ChillRound, monospace', col ? rgb(col) : '#fff', col ? rgb(col, 0.9) : 'rgba(120,230,255,0.9)', 'right'); });
  brackets(g, 0, 0, w, h, 46, 'rgba(255,255,255,0.9)', 5); });
// a VS HUD bar across the top: two names and HP frames, a VS emblem with a timer (the HP fills are separate planes so they can move)
export const hudTex = (kit, left, right) => kit.vcanvas('hud:' + left + right, 2400, 260, (g, w, h) => {
  for (const [x0, name, flip] of [[60, left, false], [w / 2 + 170, right, true]]) { const bw = w / 2 - 230;
    glassPanel(g, x0, 90, bw, 80, 30); neonBorder(g, x0, 90, bw, 80, 30, 5);
    glowText(g, name, flip ? x0 + bw - 20 : x0 + 20, 52, 54, '800 Unbounded, DelaGothic, sans-serif', '#fff', 'rgba(255,120,220,0.9)', flip ? 'right' : 'left'); }
  g.save(); g.translate(w / 2, h / 2 + 10); for (let k = 0; k < 2; k++) { g.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; g.lineTo(Math.cos(a) * (120 - k * 14), Math.sin(a) * (120 - k * 14)); } g.closePath(); if (k === 0) { glassPanel(g, -120, -120, 240, 240, 0); } else { g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 4; g.stroke(); } }
  g.restore(); glowText(g, 'VS', w / 2, h / 2 + 8, 110, '800 Unbounded', '#fff', 'rgba(255,92,190,1)'); });
export const hpFillTex = (kit, warm) => kit.vcanvas('hpfill8' + (warm ? 'w' : 'c'), 1000, 60, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0);      // (8-bit: segmented blocks)
  (warm ? ['rgb(255,236,140)', 'rgb(255,120,200)'] : ['rgb(140,240,255)', 'rgb(170,140,255)']).forEach((c, i) => gr.addColorStop(i, c));
  for (let x = 0; x < w; x += 40) { g.fillStyle = gr; g.fillRect(x + 3, 6, 34, h - 12); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x + 3, 6, 34, 10); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x + 3, h - 14, 34, 8); } });
// a red alert band: WARNING in hazard stripes, the line under it in both languages
export const warnTex = (kit, key, ja, zh) => kit.vcanvas('warn:' + key, 2200, 360, (g, w, h) => {
  g.fillStyle = 'rgba(40,0,16,0.86)'; g.fillRect(0, 60, w, h - 120); g.save(); g.beginPath(); g.rect(0, 0, w, 60); g.rect(0, h - 60, w, 60); g.clip();
  for (let x = -80; x < w + 80; x += 80) { g.fillStyle = 'rgb(255,60,110)'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 40, 0); g.lineTo(x - 20, h); g.lineTo(x - 60, h); g.closePath(); g.fill(); } g.restore();
  glowText(g, '⚠ WARNING', 60, 126, 64, '800 Unbounded', 'rgb(255,90,130)', 'rgba(255,60,110,1)', 'left');
  glowText(g, ja, w / 2 + 120, 150, 96, 'DelaGothic', '#fff', 'rgba(255,60,110,1)'); glowText(g, zh, w / 2 + 120, 240, 56, 'ChillRound', 'rgb(255,200,220)', 'rgba(255,60,110,0.8)'); });
// a danmaku comment (an audience line flying across the screen): white rounded type with a dark outline, a coloured one now and then
export const danmakuTex = (kit, txt, col) => kit.vcanvas('dm:' + txt + col, Math.round(txt.length * 70 + 60), 110, (g, w, h) => {
  g.font = '62px ChillRound, DelaGothic, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = 'rgba(30,10,50,0.85)'; g.strokeText(txt, w / 2, h / 2);
  g.fillStyle = col ? rgb(col) : '#fff'; g.fillText(txt, w / 2, h / 2); });
// a countdown digit in a glowing hexagon
export const countTex = (kit, n) => kit.vcanvas('count:' + n, 600, 600, (g, w) => { g.save(); g.translate(w / 2, w / 2);
  g.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; g.lineTo(Math.cos(a) * 260, Math.sin(a) * 260); } g.closePath(); g.fillStyle = 'rgba(30,16,64,0.85)'; g.fill();
  const gr = g.createLinearGradient(-260, -260, 260, 260); NEON.forEach((c, i) => gr.addColorStop(i / 2, c)); g.strokeStyle = gr; g.lineWidth = 16; g.shadowColor = 'rgba(200,140,255,1)'; g.shadowBlur = 40; g.stroke(); g.restore();
  g.font = '420px VT323, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgb(120,40,170)'; for (let k = 1; k <= 3; k++) g.fillText(String(n), w / 2 + k * 8, w / 2 + 20 + k * 8);
  glowText(g, String(n), w / 2, w / 2 + 20, 420, 'VT323, monospace', '#fff', 'rgba(255,120,220,1)'); });
// a KASSEN banner (nobori), v2 (the user, 2026-11-24: "旗帜要做的有质感"): a lacquered pole with a gold finial and a gold top bar, cloth loops
// (乳) along the pole, the cloth in its gradient, a gold-ringed crest, the type with a gold edge and a soft drop, a gold-thread fringe
// with tassels. Its folds, sheen and weave come from the cloth shader (space.js mode 13).
export const noboriTex = (kit, txt, c1, c2) => kit.vcanvas('nobori3:' + txt + c1, 380, 1440, (g, w, h) => {
  // (2026-11-24, "旗杆处还需要优化，现在的旗杆第一缺少质感第二存在断联"): the pole is its own lacquered, lit cylinder now (poleTex, a plane that
  // turns to the camera); the cloth hangs from it — the crossbar's ring and the loops (乳) are drawn ACROSS the pole's place, so they wrap it
  const pw = 34, cx0 = 52, cw = w - cx0 - 8, top = 90, bot = h - 120;
  const gold = (x0, y0, x1, y1) => { const gg = g.createLinearGradient(x0, y0, x0, y1); gg.addColorStop(0, 'rgb(255,244,190)'); gg.addColorStop(0.45, 'rgb(230,180,80)'); gg.addColorStop(0.55, 'rgb(150,100,30)'); gg.addColorStop(1, 'rgb(250,214,130)'); return gg; };
  const ring = (y0, hh) => { const gg = g.createLinearGradient(0, 0, pw + 8, 0); gg.addColorStop(0, 'rgb(120,80,24)'); gg.addColorStop(0.35, 'rgb(255,236,170)'); gg.addColorStop(0.55, 'rgb(220,166,70)'); gg.addColorStop(1, 'rgb(110,70,20)'); g.fillStyle = gg; rr(g, -4, y0, pw + 12, hh, hh * 0.35); g.fill(); };
  g.fillStyle = gold(0, top - 26, 0, top); g.fillRect(pw - 2, top - 26, w - pw - 2, 22); g.beginPath(); g.arc(w - 8, top - 15, 12, 0, 7); g.fill();
  ring(top - 34, 38);                                                                   // (the crossbar's ring round the pole)
  const cl = g.createLinearGradient(0, top, 0, bot); cl.addColorStop(0, rgb(c1)); cl.addColorStop(1, rgb(c2)); g.fillStyle = cl; g.fillRect(cx0, top, cw, bot - top);
  for (let y = top + 40; y < bot; y += 150) {                                           // (the loops round the pole: a band of the cloth, a darker underside, a gold stitch)
    const lg = g.createLinearGradient(0, 0, cx0 + 10, 0); lg.addColorStop(0, rgb(c2.map((v) => v * 0.55))); lg.addColorStop(0.3, rgb(c2)); lg.addColorStop(0.55, rgb(c1.map((v) => Math.min(255, v * 1.08)))); lg.addColorStop(1, rgb(c2));
    g.fillStyle = lg; rr(g, -2, y, cx0 + 12, 46, 16); g.fill(); g.strokeStyle = 'rgba(255,230,170,0.85)'; g.lineWidth = 3; rr(g, -2, y, cx0 + 12, 46, 16); g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(-2, y + 38, cx0 + 12, 8); }
  g.strokeStyle = 'rgba(255,230,170,0.9)'; g.lineWidth = 6; g.strokeRect(cx0 + 12, top + 12, cw - 24, bot - top - 24); g.lineWidth = 2; g.strokeRect(cx0 + 24, top + 24, cw - 48, bot - top - 48);
  const ccx = cx0 + cw / 2, ccy = top + 170; g.fillStyle = gold(0, ccy - 92, 0, ccy + 92); g.beginPath(); g.arc(ccx, ccy, 92, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.96)'; g.beginPath(); g.arc(ccx, ccy, 74, 0, 7); g.fill(); g.fillStyle = rgb(c1); g.beginPath(); g.arc(ccx + 20, ccy - 14, 62, 0, 7); g.fill();
  const chars = [...txt], step = Math.min(176, (bot - top - 420) / chars.length);
  g.font = `${Math.min(150, step * 0.95)}px DelaGothic`; g.textAlign = 'center'; g.textBaseline = 'middle';
  chars.forEach((ch, i) => { const y = top + 340 + i * step + step / 2; g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 14; g.shadowOffsetY = 6; g.lineWidth = 10; g.strokeStyle = 'rgb(236,190,90)'; g.strokeText(ch, ccx, y); g.shadowBlur = 0; g.shadowOffsetY = 0; g.fillStyle = '#fff'; g.fillText(ch, ccx, y); });
  for (let x = cx0; x < cx0 + cw; x += 14) { g.fillStyle = gold(0, bot, 0, bot + 60); g.fillRect(x + 2, bot, 8, 54 + 6 * Math.sin(x)); }
  for (const tx of [cx0 + 30, cx0 + cw - 30]) { g.fillStyle = gold(0, bot, 0, bot + 110); g.beginPath(); g.arc(tx, bot + 16, 14, 0, 7); g.fill(); g.fillRect(tx - 10, bot + 20, 20, 90); } });
// the nobori's pole: a lacquered cylinder lit from the upper left — cinnabar-black lacquer with a sharp specular and a rim light, faint
// brush streaks, gold fittings (a 擬宝珠 finial, collars); drawn round so that, turned to the camera, it reads as a solid pole from any side
export const poleTex = (kit) => kit.vcanvas('pole', 96, 2880, (g, w, h) => {
  const bx0 = 26, bw = 44, cyl = (stops, x0, ww) => { const gg = g.createLinearGradient(x0, 0, x0 + ww, 0); for (const [k, c] of stops) gg.addColorStop(k, c); return gg; };
  const LAQ = [[0, 'rgb(22,4,8)'], [0.16, 'rgb(96,14,28)'], [0.3, 'rgb(186,46,62)'], [0.37, 'rgb(255,214,214)'], [0.42, 'rgb(196,56,72)'], [0.62, 'rgb(112,18,32)'], [0.86, 'rgb(64,8,18)'], [0.93, 'rgb(150,60,80)'], [1, 'rgb(20,4,8)']];
  const GLD = [[0, 'rgb(90,58,14)'], [0.2, 'rgb(190,140,50)'], [0.34, 'rgb(255,246,200)'], [0.42, 'rgb(240,196,96)'], [0.7, 'rgb(150,100,30)'], [0.9, 'rgb(220,170,80)'], [1, 'rgb(80,50,10)']];
  g.fillStyle = cyl(LAQ, bx0, bw); g.fillRect(bx0, 96, bw, h - 96);
  for (let i = 0; i < 26; i++) { const x = bx0 + 3 + ((i * 37) % (bw - 6)); g.fillStyle = `rgba(255,255,255,${0.025 + 0.02 * (i % 3)})`; g.fillRect(x, 96, 1, h - 96); }      // (brush streaks in the lacquer)
  const collar = (y, hh, ww = bw + 8) => { g.fillStyle = cyl(GLD, (w - ww) / 2, ww); rr(g, (w - ww) / 2, y, ww, hh, 5); g.fill(); g.fillStyle = 'rgba(255,250,220,0.6)'; g.fillRect((w - ww) / 2 + 3, y + 2, ww - 6, 2); g.fillStyle = 'rgba(60,30,0,0.4)'; g.fillRect((w - ww) / 2 + 3, y + hh - 3, ww - 6, 2); };
  // the finial: a 擬宝珠 (onion bulb with a point) over a neck and a collar
  g.save(); g.beginPath(); const cx = w / 2; g.moveTo(cx, 0); g.bezierCurveTo(cx + 8, 18, cx + 44, 34, cx + 42, 58); g.bezierCurveTo(cx + 40, 76, cx + 18, 84, cx + 12, 88); g.lineTo(cx - 12, 88); g.bezierCurveTo(cx - 18, 84, cx - 40, 76, cx - 42, 58); g.bezierCurveTo(cx - 44, 34, cx - 8, 18, cx, 0); g.closePath();
  g.fillStyle = cyl(GLD, cx - 44, 88); g.fill(); g.restore();
  g.fillStyle = 'rgba(255,255,240,0.8)'; g.beginPath(); g.ellipse(cx - 14, 50, 5, 14, 0.3, 0, 7); g.fill();
  collar(84, 18, 40); collar(100, 26); collar(1400, 20); collar(2300, 20);
});
// the bridge's menu card: pastel, a cake drawn small at the top, the house's name and the sweets in both languages
export const menuTex = (kit) => kit.vcanvas('menu', 716, 1000, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgb(255,226,240)'); gr.addColorStop(1, 'rgb(236,248,255)'); g.fillStyle = gr; rr(g, 0, 0, w, h, 45); g.fill();
  g.strokeStyle = 'rgb(255,150,200)'; g.lineWidth = 8; rr(g, 26, 26, w - 52, h - 52, 34); g.stroke(); g.setLineDash([10, 12]); g.lineWidth = 3; rr(g, 44, 44, w - 88, h - 88, 26); g.stroke(); g.setLineDash([]);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgb(236,70,150)'; g.font = '800 84px Unbounded'; g.fillText('MENU', w / 2, 170);
  g.font = '34px HachiMaru'; g.fillStyle = 'rgb(140,90,200)'; g.fillText('ツクヨミ・パティスリー', w / 2, 240);
  [['いちごのショートケーキ', '草莓蛋糕', '♡'], ['とろけるプリン', '焦糖布丁', '☆'], ['ホットケーキ', '松饼', '♪'], ['ぜんぶ', '全部', '✿']].forEach(([ja, zh, m], i) => { const y = 380 + i * 140;
    g.fillStyle = 'rgba(255,255,255,0.8)'; rr(g, 80, y - 52, w - 160, 104, 30); g.fill(); g.fillStyle = 'rgb(255,110,182)'; g.font = '44px HachiMaru'; g.textAlign = 'left'; g.fillText(m, 104, y);
    g.fillStyle = 'rgb(90,60,140)'; g.font = '40px HachiMaru'; g.fillText(ja, 160, y - 14); g.fillStyle = 'rgb(236,90,160)'; g.font = '30px ChillRound'; g.fillText(zh, 160, y + 26); }); });
// a game dialogue box (chorus 2's lines): a wide glass panel, a name tag on its corner, a blinking ▼ drawn as a plane of its own
export const dialogTex = (kit, name) => kit.vcanvas('dialog:' + name, 2200, 440, (g, w, h) => {
  glassPanel(g, 20, 70, w - 40, h - 90, 44); neonBorder(g, 20, 70, w - 40, h - 90, 44, 6);
  const tg = g.createLinearGradient(60, 0, 520, 0); tg.addColorStop(0, 'rgb(255,92,190)'); tg.addColorStop(1, 'rgb(190,140,255)'); g.fillStyle = tg; rr(g, 60, 20, 460, 96, 40); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 4; rr(g, 60, 20, 460, 96, 40); g.stroke(); glowText(g, name, 290, 68, 50, '800 Unbounded', '#fff', 'rgba(255,255,255,0.6)');
  brackets(g, 20, 70, w - 40, h - 90, 40, 'rgba(255,255,255,0.85)', 4); });
// ---- 8-bit accents (the user, 2026-11-24: "我感觉gaming visual elements以及整体素材还可以加一点8bit风格") ----
// pixel-art icons drawn cell by cell (12 × 12; palette letters), each cell 16 px with a 1 px darker seam so it reads as pixels at any size
const PIXMAP = {
  heart: ['..KK....KK..', '.KPPK..KPPK.', 'KPWPPKKPPPPK', 'KPWPPPPPPPPK', 'KPPPPPPPPPPK', 'KPPPPPPPPPPK', '.KPPPPPPPPK.', '..KPPPPPPK..', '...KPPPPK...', '....KPPK....', '.....KK.....', '............'],
  star: ['.....KK.....', '....KYYK....', '....KYYK....', 'KKKKKYYKKKKK', 'KYYYYWYYYYYK', '.KYYYWYYYYK.', '..KYYYYYYK..', '..KYYKKYYK..', '.KYYK..KYYK.', '.KYK....KYK.', 'KKK......KKK', '............'],
  coin: ['....KKKK....', '..KKYYYYKK..', '.KYYWWYYYYK.', '.KYWYYKKYYK.', 'KYYWYKYYKYYK', 'KYYYYKYYYYYK', 'KYYYYKYYYYYK', 'KYYYYKYYKYYK', '.KYYYYKKYYK.', '.KYYYYYYYYK.', '..KKYYYYKK..', '....KKKK....'],
  gem: ['....KKKK....', '...KCWCCK...', '..KCWCCCCK..', '.KCCCCCCCCK.', 'KBBBBBBBBBBK', '.KBCCCCCCBK.', '..KBCCCCBK..', '...KBCCBK...', '....KBBK....', '.....KK.....', '............', '............'],
  potion: ['....KKKK....', '....KWWK....', '....KKKK....', '...KWWWWK...', '..KWPPPPWK..', '.KPWPPPPPPK.', '.KPPPPPPPPK.', '.KPPPPPPPPK.', '.KPPPPPPPPK.', '..KPPPPPPK..', '...KKKKKK...', '............'],
  note: ['......KKKK..', '......KCCK..', '......KCK...', '......KCK...', '......KCK...', '......KCK...', '..KKKKKCK...', '.KCCCCCCK...', 'KCCWCCCCK...', 'KCCCCCCCK...', '.KCCCCCK....', '..KKKKK.....'],
  crown: ['............', 'K....KK....K', 'KK..KYYK..KK', 'KYK.KYYK.KYK', 'KYYKYYYYKYYK', 'KYYYYWYYYYYK', 'KYYYYYYYYYYK', 'KYPYYCYYPYYK', 'KYYYYYYYYYYK', 'KKKKKKKKKKKK', '............', '............'],
  key: ['............', '.KKKK.......', 'KYYYYK......', 'KYKKYK......', 'KYKKYKKKKKKK', 'KYYYYYYYYYYK', '.KKKKKKYKYK.', '......KYKYK.', '......KK.KK.', '............', '............', '............'],
};
// (the singers' creatures, 8-bit — the user: "代表彩叶的狐狸…八千代的海蛞蝓和章鱼还有坐骑萨卡班甲鱼，辉夜的兔子")
Object.assign(PIXMAP, {
  rabbit: ['....KK..KK..', '...KWK.KWK..', '...KPK.KPK..', '...KWKKKWK..', '..KWWWWWWWK.', '..KWKWWWKWK.', '..KWWWPWWWK.', '..KPWWWWWPK.', '...KWWWWWK..', '....KKKKK...', '............', '............'],
  fox: ['.K.......K..', 'KOK.....KOK.', 'KOOK...KOOK.', 'KOOOKKKOOOK.', 'KOOOOOOOOOK.', 'KOKOOOOOKOK.', 'KWOOOKOOOWK.', '.KWWOOOWWK..', '..KWWWWWK...', '...KKKKK....', '............', '............'],
  fish: ['............', '..KKKKKKK...', '.KCCCCCCCKK.', 'KWKCCCCCCCKK', 'KKCCCCCCCCCK', 'KPCCCCCCCKK.', '.KCCCCCCK...', '..KKKKKK....', '............', '............', '............', '............'],
  octo: ['....KKKK....', '..KKPPPPKK..', '.KPPPPPPPPK.', '.KPWKPPWKPK.', '.KPPPPPPPPK.', '.KPPPWWPPPK.', '..KPPPPPPK..', '.KPKPKKPKPK.', 'KPK.KPK.KPK.', 'KK..KK..KK..', '............', '............'],
});
// (2026-11-24, "可以适当加一点miku的元素作为彩蛋": ワールドイズマイン is her song — an 8-bit Miku and her leek, in her teal #39C5BB)
Object.assign(PIXMAP, {
  negi: ['.........KK.', '........KGGK', '.......KGGK.', '......KGGKK.', '.....KGGKGGK', '....KWGK.KK.', '...KWWK.....', '..KWWK......', '.KWWK.......', 'KWWK........', 'KWK.........', '.K..........'],
  miku: ['.K........K.', 'KTK.KKKK.KTK', 'KTKKTTTTKKTK', 'KTKTTTTTTKTK', 'KTKTSSSSTKTK', 'KTKSKSSKSKTK', 'KTKSSPPSSKTK', 'KTK.KSSK.KTK', 'KTK.KTTK.KTK', 'KTK.KKKK.KTK', '.KTK....KTK.', '..K......K..'],
});
const PIXCOL = { K: 'rgb(40,20,64)', P: 'rgb(255,92,170)', W: 'rgb(255,255,255)', Y: 'rgb(255,214,70)', C: 'rgb(110,220,255)', B: 'rgb(60,110,220)', O: 'rgb(255,150,60)', T: 'rgb(57,197,187)', G: 'rgb(110,200,90)', S: 'rgb(255,226,214)' };
export const pixTex = (kit, kind) => kit.vcanvas('pix:' + kind, 192, 192, (g) => {
  (PIXMAP[kind] || PIXMAP.heart).forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '.') return; g.fillStyle = PIXCOL[ch]; g.fillRect(x * 16, y * 16, 16, 16); if (ch !== 'K') { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x * 16 + 15, y * 16, 1, 16); g.fillRect(x * 16, y * 16 + 15, 16, 1); } })); });
// an 8-bit banner word: pixel type (VT323), a hard two-colour band through it, a stepped 3D shadow, a white keyline
export const pixWordTex = (kit, word, c1 = [255, 110, 200], c2 = [120, 220, 255], px = 200) => kit.vcanvas('pixw:' + word + c1 + c2, Math.round(word.length * px * 0.55 + px * 0.8), Math.round(px * 1.25), (g, w, h) => {
  g.font = `${px}px VT323, DotGothic, monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; const cx = w / 2, cy = h / 2 + px * 0.05, st = Math.max(3, Math.round(px / 28));
  g.fillStyle = 'rgb(50,20,80)'; for (let k = 1; k <= 4; k++) g.fillText(word, cx + k * st, cy + k * st);
  g.strokeStyle = '#fff'; g.lineWidth = st * 2.2; g.lineJoin = 'miter'; g.strokeText(word, cx, cy);
  g.save(); g.beginPath(); g.rect(0, 0, w, cy); g.clip(); g.fillStyle = rgb(c1); g.fillText(word, cx, cy); g.restore();
  g.save(); g.beginPath(); g.rect(0, cy, w, h); g.clip(); g.fillStyle = rgb(c2); g.fillText(word, cx, cy); g.restore();
  g.fillStyle = 'rgba(255,255,255,0.65)'; g.save(); g.beginPath(); g.rect(0, cy - px * 0.3, w, st); g.clip(); g.fillText(word, cx, cy); g.restore(); });

// a neon grid floor (the study references' perspective grid — "a perspective grid the figure flies over"): fine lines, every fourth
// brighter, glowing, fading at the edges. White: mode 1 colours it.
export const gridTex = (kit) => kit.vcanvas('grid', 1024, 1024, (g, w) => {
  for (let i = 0; i <= 32; i++) { const x = (i / 32) * w, strong = i % 4 === 0; g.strokeStyle = strong ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)'; g.lineWidth = strong ? 3 : 1.5;
    g.shadowColor = '#fff'; g.shadowBlur = strong ? 10 : 0; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, w); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(w, x); g.stroke(); }
  g.shadowBlur = 0; g.globalCompositeOperation = 'destination-in'; const rg = g.createRadialGradient(w / 2, w / 2, w * 0.15, w / 2, w / 2, w * 0.5); rg.addColorStop(0, '#000'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, w); });

// ---- 立绘 accents (the user, 2026-11-24: "立绘的点缀素材也别忘了") ----
// hand-drawn doodles round a figure (落書き): white strokes with a hand's wobble, a soft glow; two variants per kind (v 0/1) drawn
// with a different wobble so alternating them on twos makes the line boil like hand-drawn animation. White: mode 1 colours them.
const DOODLE = {
  halo: [512, 256, (P) => { const o = []; for (let k = 0; k <= 64; k++) { const a = -0.4 + (k / 64) * Math.PI * 2.15; o.push([256 + Math.cos(a) * 210, 128 + Math.sin(a) * 62]); } P(o); }],
  swirl: [512, 512, (P) => { const o = []; for (let k = 0; k <= 90; k++) { const a = (k / 90) * Math.PI * 4.2, r = 18 + k * 2.3; o.push([256 + Math.cos(a) * r, 256 + Math.sin(a) * r]); } P(o); }],
  stars: [512, 512, (P) => { for (const [x, y, s] of [[170, 190, 120], [360, 320, 80], [380, 120, 46]]) { const o = []; for (let k = 0; k <= 8; k++) { const a = (k / 8) * Math.PI * 2 - Math.PI / 2, r = k % 2 ? s * 0.22 : s; o.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } P(o); } }],
  arrow: [512, 256, (P) => { const o = []; for (let k = 0; k <= 30; k++) { const u = k / 30; o.push([40 + u * 400, 190 - Math.sin(u * Math.PI) * 120 + u * 20]); } P(o); P([[380, 160], [445, 210], [370, 236]]); }],
  moon: [512, 512, (P) => { const o = []; for (let k = 0; k <= 40; k++) { const a = 0.9 + (k / 40) * 4.5; o.push([256 + Math.cos(a) * 170, 256 + Math.sin(a) * 170]); } for (let k = 0; k <= 30; k++) { const a = 5.4 - (k / 30) * 4.5; o.push([300 + Math.cos(a) * 125, 230 + Math.sin(a) * 125]); } P(o);
    for (const [x, y] of [[420, 110], [440, 380]]) { P([[x - 22, y], [x + 22, y]]); P([[x, y - 22], [x, y + 22]]); } }],
  speed: [512, 512, (P) => { for (let k = 0; k < 6; k++) { const a = -2.4 + k * 0.32; P([[256 + Math.cos(a) * 120, 256 + Math.sin(a) * 120], [256 + Math.cos(a) * (220 + (k % 2) * 30), 256 + Math.sin(a) * (220 + (k % 2) * 30)]]); } }],
  heart: [512, 512, (P) => { for (const s of [1, 0.78]) { const o = []; for (let k = 0; k <= 60; k++) { const a = (k / 60) * Math.PI * 2, x = 16 * Math.sin(a) ** 3, y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a); o.push([256 + x * 12 * s, 240 - y * 12 * s]); } P(o); } }],
  loop: [512, 512, (P) => { const o = []; for (let k = 0; k <= 80; k++) { const a = (k / 80) * Math.PI * 2.3 + 0.3; o.push([256 + Math.cos(a) * (205 - k * 0.35), 256 + Math.sin(a) * (150 - k * 0.2)]); } P(o); }],
  ribbon: [512, 384, (P) => { P([[256, 190], [120, 90], [70, 160], [110, 250], [256, 190], [400, 250], [440, 160], [390, 90], [256, 190]]); P([[240, 200], [180, 330]]); P([[272, 200], [330, 330]]); }],
};
export const doodleTex = (kit, kind, v = 0) => { const [W, H, draw] = DOODLE[kind];
  return kit.vcanvas(`doodle:${kind}:${v}`, W, H, (g) => { let s = 1 + v * 977 + kind.length * 31; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647 - 0.5);
    g.strokeStyle = '#fff'; g.lineWidth = 10; g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = 'rgba(255,255,255,0.8)'; g.shadowBlur = 8;
    const P = (pts) => { const q = pts.map(([x, y]) => [x + rnd() * 7, y + rnd() * 7]); g.beginPath(); g.moveTo(q[0][0], q[0][1]);
      for (let i = 1; i < q.length - 1; i++) g.quadraticCurveTo(q[i][0], q[i][1], (q[i][0] + q[i + 1][0]) / 2, (q[i][1] + q[i + 1][1]) / 2); g.lineTo(q[q.length - 1][0], q[q.length - 1][1]); g.stroke(); };
    draw(P); }); };
// a fashion show's hang tag (the runway's caption): a pearl card with a punched eyelet, LOOK number, the look's name in Japanese and Chinese
export const tagTex = (kit, look, ja, zh, col = [255, 110, 190]) => kit.vcanvas(`tag:${look}:${ja}`, 760, 360, (g, w, h) => {
  g.save(); g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 18; g.shadowOffsetY = 8; g.fillStyle = '#fbf8ff'; rr(g, 20, 20, w - 40, h - 48, 34); g.fill(); g.restore();
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, rgb(col)); gr.addColorStop(1, rgb(col.map((c) => Math.min(255, c * 0.7 + 90)))); g.fillStyle = gr; rr(g, 20, 20, 210, h - 48, 34); g.fill(); g.fillRect(120, 20, 110, h - 48);
  g.fillStyle = '#fbf8ff'; g.beginPath(); g.arc(78, 90, 22, 0, 7); g.fill(); g.strokeStyle = rgb(col.map((c) => c * 0.6)); g.lineWidth = 5; g.stroke();          // (the eyelet)
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '800 34px Unbounded'; g.fillText('LOOK', 125, 180); g.font = '900 92px Unbounded'; g.fillText(look, 125, 268);
  g.textAlign = 'left'; g.fillStyle = 'rgb(40,24,70)'; g.font = '86px DelaGothic'; g.fillText(ja, 262, 150, w - 290);
  g.fillStyle = rgb(col.map((c) => c * 0.75)); g.font = '52px KuaiLe'; g.fillText(zh, 266, 228, w - 290);
  g.fillStyle = 'rgba(40,24,70,0.55)'; g.font = '24px DotGothic'; g.fillText('KAGUYA COLLECTION 2030 · TSUKUYOMI', 266, 284); });
// the runway's floor: a long neon grid (fine lines, every fourth brighter), its edges fading to the sides and the far end — no radial fade, so it can run long
export const gridRunTex = (kit) => kit.vcanvas('gridrun', 512, 2560, (g, w, h) => {
  const cell = w / 8; for (let i = 0; i <= 8; i++) { const x = i * cell, strong = i % 4 === 0; g.strokeStyle = strong ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)'; g.lineWidth = strong ? 4 : 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let j = 0; j <= h / cell; j++) { const y = j * cell, strong = j % 4 === 0; g.strokeStyle = strong ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)'; g.lineWidth = strong ? 4 : 2; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.globalCompositeOperation = 'destination-in'; const sx = g.createLinearGradient(0, 0, w, 0); sx.addColorStop(0, 'rgba(0,0,0,0.15)'); sx.addColorStop(0.25, '#000'); sx.addColorStop(0.75, '#000'); sx.addColorStop(1, 'rgba(0,0,0,0.15)'); g.fillStyle = sx; g.fillRect(0, 0, w, h);
  const sy = g.createLinearGradient(0, 0, 0, h); sy.addColorStop(0, 'rgba(0,0,0,0)'); sy.addColorStop(0.2, '#000'); sy.addColorStop(1, '#000'); g.fillStyle = sy; g.fillRect(0, 0, w, h); });
// the pop-up book's page (the bridge): warm paper with fibre, a faint dot grid, a printed lace border and the gutter's shadow
export const bookPageTex = (kit) => kit.vcanvas('bookpage', 2048, 640, (g, w, h) => {
  g.fillStyle = 'rgb(246,222,234)'; g.fillRect(0, 0, w, h);
  let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2600; i++) { g.strokeStyle = `rgba(${200 + rnd() * 40},${170 + rnd() * 40},${200 + rnd() * 40},${0.05 + rnd() * 0.08})`; g.lineWidth = 1; const x = rnd() * w, y = rnd() * h, a = rnd() * 6.3, l = 4 + rnd() * 14; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  g.fillStyle = 'rgba(220,90,160,0.28)'; for (let x = 24; x < w; x += 32) for (let y = 24; y < h; y += 32) { g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(214,80,150,0.8)'; g.lineWidth = 5; rr(g, 26, 26, w - 52, h - 52, 30); g.stroke(); g.lineWidth = 1.5; rr(g, 40, 40, w - 80, h - 80, 22); g.stroke();
  for (let x = 60; x < w - 40; x += 44) { g.beginPath(); g.arc(x, 26, 14, 0, Math.PI); g.stroke(); g.beginPath(); g.arc(x, h - 26, 14, Math.PI, 0); g.stroke(); }
  const gu = g.createLinearGradient(0, h * 0.42, 0, h * 0.58); gu.addColorStop(0, 'rgba(120,60,100,0)'); gu.addColorStop(0.5, 'rgba(120,60,100,0.22)'); gu.addColorStop(1, 'rgba(120,60,100,0)'); g.fillStyle = gu; g.fillRect(0, h * 0.42, w, h * 0.16); });

// ---- GALGAME + 音游 (the user, 2026-11-24: "关于游戏UI可以设计成GALGAME+音游的设计") ----
// a galgame message window: frosted violet glass, a soft top light, a double hairline frame with star corners, the speaker's face window on
// the left (the portrait is a plane laid over it), the name plate tab, and the quick menu under it (AUTO lit — the song plays itself)
export const galTex = (kit, name, col = [255, 110, 190]) => kit.vcanvas('gal2:' + name + col, 2400, 640, (g, w, h) => {
  const X = 24, Y = 96, W = w - 48, H = 440, R = 46;
  g.save(); g.shadowColor = 'rgba(10,0,30,0.55)'; g.shadowBlur = 40; g.shadowOffsetY = 12; g.fillStyle = 'rgba(30,16,64,0.82)'; rr(g, X, Y, W, H, R); g.fill(); g.restore();
  const gr = g.createLinearGradient(0, Y, 0, Y + H); gr.addColorStop(0, 'rgba(120,80,200,0.42)'); gr.addColorStop(0.35, 'rgba(40,20,90,0.25)'); gr.addColorStop(1, 'rgba(14,6,40,0.5)'); g.fillStyle = gr; rr(g, X, Y, W, H, R); g.fill();
  g.save(); rr(g, X, Y, W, H, R); g.clip(); for (let k = 0; k < 40; k++) { const x = (k * 97) % W, y = Y + ((k * 53) % H); g.fillStyle = `rgba(255,255,255,${0.04 + (k % 5) * 0.012})`; g.beginPath(); g.arc(X + x, y, 1.5 + (k % 3), 0, 7); g.fill(); }
  const tl = g.createLinearGradient(0, Y, 0, Y + 70); tl.addColorStop(0, 'rgba(255,255,255,0.2)'); tl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = tl; g.fillRect(X, Y, W, 70); g.restore();
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 4; rr(g, X, Y, W, H, R); g.stroke(); g.strokeStyle = rgb(col, 0.75); g.lineWidth = 2; rr(g, X + 14, Y + 14, W - 28, H - 28, R - 12); g.stroke();
  for (const [cx, cy] of [[X + 30, Y + 30], [X + W - 30, Y + 30], [X + 30, Y + H - 30], [X + W - 30, Y + H - 30]]) { g.fillStyle = '#fff'; g.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 4 : 12; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill(); }
  // the face window
  const FX = 60, FY = Y + 40, FS = H - 80; const fg = g.createLinearGradient(FX, FY, FX + FS, FY + FS); fg.addColorStop(0, rgb(col)); fg.addColorStop(1, 'rgb(150,200,255)');
  g.fillStyle = 'rgba(255,240,250,0.16)'; rr(g, FX, FY, FS, FS, 40); g.fill(); g.strokeStyle = fg; g.lineWidth = 8; rr(g, FX, FY, FS, FS, 40); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; rr(g, FX + 10, FY + 10, FS - 20, FS - 20, 32); g.stroke();
  // the name plate
  const NX = FX + FS + 40, NW = Math.max(360, name.length * 78 + 140); const ng = g.createLinearGradient(NX, 0, NX + NW, 0); ng.addColorStop(0, rgb(col)); ng.addColorStop(1, rgb(col.map((c) => Math.min(255, c * 0.6 + 110))));
  g.save(); g.shadowColor = rgb(col, 0.8); g.shadowBlur = 24; g.fillStyle = ng; rr(g, NX, Y - 46, NW, 92, 46); g.fill(); g.restore(); g.strokeStyle = '#fff'; g.lineWidth = 4; rr(g, NX, Y - 46, NW, 92, 46); g.stroke();
  g.fillStyle = '#fff'; g.font = '62px DelaGothic'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('♥', NX + 30, Y + 2); g.fillText(name, NX + 100, Y + 2);
  // the quick menu
  const QM = ['AUTO', 'SKIP', 'LOG', 'Q.SAVE', 'Q.LOAD', 'CONFIG']; g.font = '800 30px Unbounded'; g.textBaseline = 'middle'; let qx = w - 60; g.textAlign = 'right';
  for (let k = QM.length - 1; k >= 0; k--) { const on = k === 0, tw = g.measureText(QM[k]).width; g.fillStyle = on ? rgb(col) : 'rgba(255,255,255,0.75)'; if (on) { g.shadowColor = rgb(col); g.shadowBlur = 14; } g.fillText(QM[k], qx, Y + H + 52); g.shadowBlur = 0;
    if (on) { g.beginPath(); g.arc(qx - tw - 22, Y + H + 52, 9, 0, 7); g.fill(); } qx -= tw + 70; } });
// a rhythm-game note: a glossy capsule in its lane's colour, a white rim, a highlight, a little diamond at its heart, a soft glow
export const noteTex = (kit, col) => kit.vcanvas('note:' + col, 640, 200, (g, w, h) => {
  g.save(); g.shadowColor = rgb(col, 0.9); g.shadowBlur = 36; const gr = g.createLinearGradient(0, 30, 0, h - 30); gr.addColorStop(0, rgb(col.map((c) => Math.min(255, c + 90)))); gr.addColorStop(0.5, rgb(col)); gr.addColorStop(1, rgb(col.map((c) => c * 0.6)));
  g.fillStyle = gr; rr(g, 30, 40, w - 60, h - 80, (h - 80) / 2); g.fill(); g.restore(); g.strokeStyle = '#fff'; g.lineWidth = 9; rr(g, 30, 40, w - 60, h - 80, (h - 80) / 2); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.55)'; rr(g, 60, 52, w - 120, 26, 13); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(w / 2, h / 2 - 24); g.lineTo(w / 2 + 24, h / 2); g.lineTo(w / 2, h / 2 + 24); g.lineTo(w / 2 - 24, h / 2); g.closePath(); g.fill(); });
// the judgement line across a wall: a white-hot core in a pink/cyan glow, a bracket at each lane
export const judgeLineTex = (kit, lanes = 5) => kit.vcanvas('jline:' + lanes, 2400, 160, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,110,200,0)'); gr.addColorStop(0.1, 'rgb(255,110,200)'); gr.addColorStop(0.5, 'rgb(190,150,255)'); gr.addColorStop(0.9, 'rgb(110,220,255)'); gr.addColorStop(1, 'rgba(110,220,255,0)');
  g.save(); g.shadowColor = 'rgba(255,160,230,1)'; g.shadowBlur = 30; g.fillStyle = gr; g.fillRect(0, h / 2 - 12, w, 24); g.restore(); g.fillStyle = 'rgba(255,255,255,0.95)'; g.fillRect(w * 0.06, h / 2 - 4, w * 0.88, 8);
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 6; for (let i = 0; i < lanes; i++) { const cx = (i + 0.5) / lanes * w, hw = w / lanes * 0.4; g.beginPath(); g.moveTo(cx - hw, h / 2 - 40); g.lineTo(cx - hw, h / 2 + 40); g.moveTo(cx + hw, h / 2 - 40); g.lineTo(cx + hw, h / 2 + 40); g.stroke(); } });
// the rhythm game's top bar: the song's jacket and title, its difficulty, the prince's 好感度 (affection) gauge frame, SCORE
export const rhythmHudTex = (kit) => kit.vcanvas('rhud3', 2400, 300, (g, w, h) => {
  glassPanel(g, 30, 40, 1040, 220, 44); neonBorder(g, 30, 40, 1040, 220, 44, 5);
  const jg = g.createLinearGradient(60, 60, 240, 240); jg.addColorStop(0, 'rgb(255,120,200)'); jg.addColorStop(1, 'rgb(120,140,255)'); g.fillStyle = jg; rr(g, 60, 60, 180, 180, 30); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 5; rr(g, 60, 60, 180, 180, 30); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(150, 150, 56, 0, 7); g.fill(); g.fillStyle = jg; g.beginPath(); g.arc(172, 132, 52, 0, 7); g.fill();
  glowText(g, 'ワールドイズマイン', 270, 118, 64, 'DelaGothic', '#fff', 'rgba(255,120,220,0.9)', 'left');
  g.font = '800 30px Unbounded'; g.textAlign = 'left'; g.fillStyle = 'rgba(230,220,255,0.9)'; g.fillText('CPK! Remix · かぐや & ヤチヨ', 272, 190);
  g.fillStyle = 'rgb(57,197,187)'; rr(g, 840, 168, 200, 52, 26); g.fill(); g.fillStyle = '#fff'; g.font = '800 30px Unbounded'; g.textAlign = 'center'; g.fillText('MASTER 39', 940, 196);      // (39: a wink to Miku)
  glassPanel(g, 1110, 40, 840, 220, 44); neonBorder(g, 1110, 40, 840, 220, 44, 5);
  glowText(g, 'おうじさま 好感度 ♥', 1150, 92, 44, 'DelaGothic', '#fff', 'rgba(255,120,200,0.9)', 'left');
  g.fillStyle = 'rgba(10,4,30,0.8)'; rr(g, 1150, 150, 760, 64, 32); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 4; rr(g, 1150, 150, 760, 64, 32); g.stroke();
  for (const f of [0.25, 0.5, 0.75]) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(1150 + 760 * f - 2, 142, 4, 80); }
  glassPanel(g, 1990, 40, 380, 220, 44); neonBorder(g, 1990, 40, 380, 220, 44, 5); glowText(g, 'SCORE', 2180, 92, 40, '800 Unbounded', 'rgba(255,255,255,0.9)', 'rgba(120,220,255,0.9)'); });
// the score: eight digits in chrome-gradient pixel type
export const scoreTex = (kit, n) => kit.vcanvas('score:' + n, 520, 120, (g, w, h) => { const s = String(Math.floor(n)).padStart(7, '0');
  g.font = '110px VT323, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgb(40,16,80)'; g.fillText(s, w / 2 + 5, h / 2 + 5);
  const gr = g.createLinearGradient(0, 10, 0, h - 10); gr.addColorStop(0, '#fff'); gr.addColorStop(0.5, 'rgb(140,230,255)'); gr.addColorStop(0.52, 'rgb(255,150,220)'); gr.addColorStop(1, '#fff'); g.fillStyle = gr; g.fillText(s, w / 2, h / 2); });
// a galgame choice (選択肢): a rounded bar; the chosen one glows pink with a heart cursor
export const choiceTex = (kit, text, sel) => kit.vcanvas('choice:' + text + (sel ? 1 : 0), 1800, 220, (g, w, h) => {
  if (sel) { g.save(); g.shadowColor = 'rgba(255,110,200,0.95)'; g.shadowBlur = 40; const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgb(255,120,200)'); gr.addColorStop(1, 'rgb(190,140,255)'); g.fillStyle = gr; rr(g, 40, 40, w - 80, h - 80, (h - 80) / 2); g.fill(); g.restore(); }
  else { g.fillStyle = 'rgba(24,12,56,0.82)'; rr(g, 40, 40, w - 80, h - 80, (h - 80) / 2); g.fill(); }
  g.strokeStyle = '#fff'; g.lineWidth = 6; rr(g, 40, 40, w - 80, h - 80, (h - 80) / 2); g.stroke();
  g.fillStyle = '#fff'; g.font = '76px DelaGothic'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 2);
  if (sel) { g.font = '70px DelaGothic'; g.fillText('♥', 150, h / 2 + 2); } });
// the galgame "next" cursor
export const nextTex = (kit) => kit.vcanvas('next', 160, 160, (g, w, h) => { g.save(); g.shadowColor = 'rgba(255,140,220,1)'; g.shadowBlur = 24; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(30, 50); g.lineTo(130, 50); g.lineTo(80, 120); g.closePath(); g.fill(); g.restore(); });
// a hazard tape that can run forever (2026-11-24, "这条警戒线可以拉长一点…补充一些动效"): two identical halves (crop half of it and slide the
// crop to march the stripes), slanted stripes along both edges, a dark band with hairlines, micro caution text along its top
export const hazardTex = (kit, c1 = [255, 60, 110], c2 = [40, 0, 16]) => kit.vcanvas('hazard:' + c1 + c2, 4096, 128, (g, w, h) => {
  g.fillStyle = rgb(c2, 0.9); g.fillRect(0, 22, w, h - 44);
  g.save(); g.beginPath(); g.rect(0, 0, w, 22); g.rect(0, h - 22, w, 22); g.clip(); g.fillStyle = 'rgba(255,240,245,0.92)'; g.fillRect(0, 0, w, h);
  for (let x = -64; x < w + 64; x += 64) { g.fillStyle = rgb(c1); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 32, 0); g.lineTo(x + 32 - 22 * 0.9, h); g.lineTo(x - 22 * 0.9, h); g.closePath(); g.fill(); } g.restore();
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(0, 24, w, 2); g.fillRect(0, h - 26, w, 2);
  g.font = '800 11px Unbounded'; g.textBaseline = 'middle'; g.fillStyle = rgb(c1, 0.85);
  for (let x = 8; x < w; x += 512) { g.fillText('CAUTION ⚠ 注意 ⚠ KEEP OUT ⚠ 立入禁止 ⚠ CAUTION ⚠ 注意 ⚠', x, 33); g.fillText('⚠ DANGER · 危险 · DANGER · 危险 · DANGER · 危险 ·', x + 40, h - 33); } });
// the WARNING chip on a tape: a lit pink plate with the triangle
export const warnChipTex = (kit) => kit.vcanvas('warnchip', 640, 160, (g, w, h) => {
  g.save(); g.shadowColor = 'rgba(255,60,110,1)'; g.shadowBlur = 30; g.fillStyle = 'rgb(255,60,110)'; rr(g, 20, 24, w - 40, h - 48, 22); g.fill(); g.restore();
  g.strokeStyle = '#fff'; g.lineWidth = 5; rr(g, 20, 24, w - 40, h - 48, 22); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(84, 44); g.lineTo(124, 116); g.lineTo(44, 116); g.closePath(); g.fill(); g.fillStyle = 'rgb(255,60,110)'; g.font = '900 52px Unbounded'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', 84, 92);
  g.fillStyle = '#fff'; g.font = '800 64px Unbounded'; g.textAlign = 'left'; g.fillText('WARNING', 150, h / 2 + 3); });
// danmaku, cute (2026-11-24, "弹幕可以做的更华丽可爱且演出可以做的动态一些"): 0 white type with a soft outline · 1 a pastel pill with a heart ·
// 2 a star pill · 3 a SUPER CHAT box (a gradient header with an avatar dot, a name and an amount, the comment under it)
export const danmaku2Tex = (kit, txt, kind = 0, col = [255, 150, 210]) => { const pw = Math.round(txt.length * 64 + (kind ? 170 : 60));
  if (kind === 3) return kit.vcanvas('sc2:' + txt + col, Math.max(640, pw + 40), 230, (g, w, h) => {
    g.save(); g.shadowColor = rgb(col, 0.8); g.shadowBlur = 26; g.fillStyle = 'rgba(255,255,255,0.96)'; rr(g, 16, 16, w - 32, h - 32, 30); g.fill(); g.restore();
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, rgb(col)); gr.addColorStop(1, rgb(col.map((c) => Math.min(255, c * 0.55 + 120)))); g.fillStyle = gr; g.save(); rr(g, 16, 16, w - 32, h - 32, 30); g.clip(); g.fillRect(16, 16, w - 32, 92); g.restore();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(70, 62, 30, 0, 7); g.fill(); g.fillStyle = rgb(col); g.font = '36px DelaGothic'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♥', 70, 64);
    g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = '34px DelaGothic'; g.fillText('推し活中の姫ファン', 118, 50); g.font = '800 30px Unbounded'; g.fillText('¥10,000', 118, 88); g.textAlign = 'right'; g.font = '26px DelaGothic'; g.fillText('スーパーチャット', w - 44, 50);
    g.fillStyle = 'rgb(60,20,80)'; g.textAlign = 'left'; g.font = '56px DelaGothic'; g.fillText(txt, 40, 160); g.strokeStyle = '#fff'; g.lineWidth = 5; rr(g, 16, 16, w - 32, h - 32, 30); g.stroke(); });
  return kit.vcanvas('dm2:' + kind + txt + col, pw, 120, (g, w, h) => {
    g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (kind) { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, rgb(kind === 2 ? [255, 220, 110] : col)); gr.addColorStop(1, rgb(kind === 2 ? [255, 160, 90] : col.map((c) => Math.min(255, c * 0.6 + 100))));
      g.save(); g.shadowColor = rgb(kind === 2 ? [255, 200, 90] : col, 0.8); g.shadowBlur = 18; g.fillStyle = gr; rr(g, 8, 10, w - 16, h - 20, (h - 20) / 2); g.fill(); g.restore();
      g.strokeStyle = '#fff'; g.lineWidth = 5; rr(g, 8, 10, w - 16, h - 20, (h - 20) / 2); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.4)'; rr(g, 30, 18, w - 60, 18, 9); g.fill();
      g.fillStyle = '#fff'; g.font = '58px DelaGothic'; g.textAlign = 'center'; g.fillText(kind === 2 ? '★' : '♥', 62, h / 2 + 2); g.textAlign = 'left'; g.font = '58px ChillRound, DelaGothic'; g.fillText(txt, 104, h / 2 + 2); }
    else { g.font = '62px ChillRound, DelaGothic, sans-serif'; g.textAlign = 'center'; g.save(); g.shadowColor = rgb(col, 0.9); g.shadowBlur = 16; g.lineWidth = 12; g.strokeStyle = rgb(col.map((c) => c * 0.45)); g.strokeText(txt, w / 2, h / 2); g.restore(); g.fillStyle = '#fff'; g.fillText(txt, w / 2, h / 2); } }); };
// a typing bubble (…): white glass with a pink rim and a tail — its three dots are planes that bounce
export const typingTex = (kit) => kit.vcanvas('typing', 420, 260, (g, w, h) => {
  g.save(); g.shadowColor = 'rgba(255,120,200,0.9)'; g.shadowBlur = 26; g.fillStyle = 'rgba(255,255,255,0.95)'; rr(g, 20, 20, w - 40, h - 80, (h - 80) / 2); g.fill();
  g.beginPath(); g.moveTo(90, h - 64); g.lineTo(70, h - 18); g.lineTo(140, h - 62); g.closePath(); g.fill(); g.restore();
  g.strokeStyle = 'rgb(255,120,200)'; g.lineWidth = 6; rr(g, 20, 20, w - 40, h - 80, (h - 80) / 2); g.stroke(); });

// ---- a Cytus II-style chart (the user, 2026-11-24: "音游可以做成CYTUS2类型的谱面，并做的灵动和稍微复杂一些（这样更具观赏性）， 并且扫描线不要
// 设计的戛然而止"): notes placed anywhere on the playfield, a scan line sweeping up and down across it a bar a sweep, fading off past both
// edges instead of stopping. Notes: tap (a ringed disc), double (gold-rimmed), drag (a small diamond on a dotted chain), hold (a capsule
// the line fills), flick (a diamond with arrows).
export const cyNoteTex = (kit, kind, col) => kit.vcanvas(`cy:${kind}:${col}`, 512, 512, (g, w) => {
  const c = w / 2, P = Math.PI * 2, lite = col.map((v) => Math.min(255, v + 110)), dark = col.map((v) => v * 0.45);
  g.save(); g.shadowColor = rgb(col, 0.9); g.shadowBlur = 40;
  if (kind === 'tap' || kind === 'gold') {
    const R = 170; g.fillStyle = 'rgba(255,255,255,0.98)'; g.beginPath(); g.arc(c, c, R, 0, P); g.fill(); g.restore();
    if (kind === 'gold') { const gg = g.createLinearGradient(0, c - R, 0, c + R); gg.addColorStop(0, '#fff6c8'); gg.addColorStop(0.5, '#f0bf58'); gg.addColorStop(1, '#fff0b0'); g.fillStyle = gg; g.beginPath(); g.arc(c, c, R, 0, P); g.fill(); }
    g.strokeStyle = rgb(dark); g.lineWidth = 5; g.beginPath(); g.arc(c, c, R, 0, P); g.stroke();
    const rg = g.createRadialGradient(c - 30, c - 40, 10, c, c, 128); rg.addColorStop(0, rgb(lite)); rg.addColorStop(0.55, rgb(col)); rg.addColorStop(1, rgb(dark));
    g.fillStyle = rg; g.beginPath(); g.arc(c, c, 128, 0, P); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 7; g.beginPath(); g.arc(c, c, 82, 0, P); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(c, c, 34, 0, P); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(c - 52, c - 70, 40, 18, -0.5, 0, P); g.fill();
    for (let k = 0; k < 4; k++) { const a = k * P / 4 + P / 8; g.fillStyle = rgb(dark); g.beginPath(); g.arc(c + Math.cos(a) * 150, c + Math.sin(a) * 150, 8, 0, P); g.fill(); }
  } else if (kind === 'drag' || kind === 'flick') {
    const R = kind === 'drag' ? 120 : 165; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(c, c - R); g.lineTo(c + R, c); g.lineTo(c, c + R); g.lineTo(c - R, c); g.closePath(); g.fill(); g.restore();
    const r2 = R * 0.72, lg = g.createLinearGradient(0, c - r2, 0, c + r2); lg.addColorStop(0, rgb(lite)); lg.addColorStop(1, rgb(col));
    g.fillStyle = lg; g.beginPath(); g.moveTo(c, c - r2); g.lineTo(c + r2, c); g.lineTo(c, c + r2); g.lineTo(c - r2, c); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(c, c, R * 0.16, 0, P); g.fill();
    if (kind === 'flick') for (const sd of [-1, 1]) { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(c + sd * (R + 70), c); g.lineTo(c + sd * (R + 10), c - 52); g.lineTo(c + sd * (R + 10), c + 52); g.closePath(); g.fill();
      g.strokeStyle = rgb(dark); g.lineWidth = 5; g.stroke(); }
  }
  g.restore();
});
// a hold's body: a translucent capsule with chevrons running along it (drawn vertical; its length comes from the plane's scale)
export const cyHoldTex = (kit, col) => kit.vcanvas('cyhold:' + col, 160, 1024, (g, w, h) => {
  const gg = g.createLinearGradient(0, 0, w, 0); gg.addColorStop(0, rgb(col, 0.25)); gg.addColorStop(0.5, rgb(col.map((v) => Math.min(255, v + 80)), 0.75)); gg.addColorStop(1, rgb(col, 0.25));
  g.fillStyle = gg; rr(g, 20, 0, w - 40, h, (w - 40) / 2); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 6; rr(g, 20, 3, w - 40, h - 6, (w - 46) / 2); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 8; for (let y = 60; y < h - 40; y += 64) { g.beginPath(); g.moveTo(44, y + 18); g.lineTo(w / 2, y); g.lineTo(w - 44, y + 18); g.stroke(); }
});
// the scan line: a white-hot core and a coloured glow, tapering away past both edges of the playfield (no hard ends); ticks at the
// note columns' quarter marks, fading with it
export const cyScanTex = (kit) => kit.vcanvas('cyscan2', 4096, 128, (g, w, h) => {
  const im = g.createImageData(w, h), d = im.data;
  for (let x = 0; x < w; x++) { const u = x / (w - 1), fx = Math.pow(Math.min(1, Math.min(u, 1 - u) / 0.26), 1.6);
    for (let y = 0; y < h; y++) { const dy = Math.abs(y - h / 2), core = Math.exp(-Math.pow(dy / 4.5, 4)), glow = Math.exp(-Math.pow(dy / 14, 2)) * 0.6 + Math.exp(-Math.pow(dy / 40, 2)) * 0.25;
      const a = Math.min(1, core + glow) * fx, i = (y * w + x) * 4; d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = Math.round(a * 255); } }
  g.putImageData(im, 0, 0);
  for (let k = 1; k < 16; k++) { const x = w * (0.18 + 0.64 * k / 16), u = x / w, fx = Math.min(1, Math.min(u, 1 - u) / 0.26); g.fillStyle = `rgba(255,255,255,${0.75 * fx})`; g.fillRect(x - 2, h / 2 - (k % 4 ? 10 : 22), 4, k % 4 ? 20 : 44); }
});
// the scan line's wake: the band it has just swept glows faintly behind it
export const cyWakeTex = (kit) => kit.vcanvas('cywake', 1024, 256, (g, w, h) => {
  const im = g.createImageData(w, h), d = im.data;
  for (let x = 0; x < w; x++) { const u = x / (w - 1), fx = Math.pow(Math.min(1, Math.min(u, 1 - u) / 0.26), 1.6);
    for (let y = 0; y < h; y++) { const a = Math.pow(1 - y / h, 2.2) * 0.5 * fx, i = (y * w + x) * 4; d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = Math.round(a * 255); } }
  g.putImageData(im, 0, 0);
});
// a drag chain's dotted link
export const cyDotsTex = (kit) => kit.vcanvas('cydots', 512, 48, (g, w, h) => { g.fillStyle = '#fff'; for (let x = 12; x < w; x += 32) { g.beginPath(); g.arc(x, h / 2, 7, 0, 7); g.fill(); } });
