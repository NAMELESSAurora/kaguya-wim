// kaguya-wim（超かぐや姫! × ワールドイズマイン CPK! Remix 二创 MV）合成器的本地服务（从《澪標》复制）：静态文件 + 出帧 / 导出通道。
//
//   node server.mjs            → http://127.0.0.1:5194
//
// 页面把渲染好的帧以原始 RGBA（自下而上，readPixels 的顺序）POST 过来：
//   POST /api/snap?name=&w=&h=&scale=   存一张 PNG 到 out/snaps/
//   POST /api/export/begin?name=&w=&h=&fps=   开一个 ffmpeg 进程
//   POST /api/export/frame              一帧，按到达顺序写进 ffmpeg
//   POST /api/export/end                收尾，返回 mp4 的路径和大小
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5197);
const FFMPEG =
  process.env.FFMPEG || path.join(os.homedir(), '.local/ffmpeg-static/node_modules/ffmpeg-static/ffmpeg');
const OUT = path.join(ROOT, 'out');
const SNAPS = path.join(OUT, 'snaps');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml',
};

const json = (res, code, obj) => {
  res.writeHead(code, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
};
const clean = (s, fallback) => (s || '').replace(/[^\w-]/g, '') || fallback;
const body = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

// Run ffmpeg once with `input` on stdin.
function ffmpeg(args, input) {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG, args, { stdio: ['pipe', 'ignore', 'pipe'] });
    let err = '';
    proc.stderr.on('data', (d) => (err += d));
    proc.stdin.on('error', () => {});
    proc.on('error', reject);
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err.slice(-1500) || `ffmpeg exited ${code}`))));
    proc.stdin.end(input);
  });
}

const raw = (w, h) => ['-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${w}x${h}`];
let job = null; // the one export in flight

async function api(url, req, res) {
  const q = url.searchParams;
  const w = Number(q.get('w')) || 1920;
  const h = Number(q.get('h')) || 1080;
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });

  switch (url.pathname) {
    case '/api/asset': {
      // an image posted from a generator's tab (NovelAI, ChatGPT) or the localhost tab → materials/<dir>/ (nai by default)
      const buf = await body(req);
      const dir = path.join(ROOT, 'materials', clean(q.get('dir'), 'nai'));
      fs.mkdirSync(dir, { recursive: true });
      const ext = (q.get('ext') || 'png').replace(/[^a-z]/g, '');
      const file = path.join(dir, `${clean(q.get('name'), 'asset')}.${ext}`);
      fs.writeFileSync(file, buf);
      return json(res, 200, { file, bytes: buf.length });
    }
    case '/api/snap': {
      const buf = await body(req);
      if (buf.length !== w * h * 4) return json(res, 400, { error: `expected ${w * h * 4} bytes, got ${buf.length}` });
      const scale = Number(q.get('scale')) || 0;
      fs.mkdirSync(SNAPS, { recursive: true });
      const file = path.join(SNAPS, `${clean(q.get('name'), 'snap')}.png`);
      const vf = scale ? `vflip,scale=${scale}:-2:flags=lanczos` : 'vflip';
      await ffmpeg(['-y', '-loglevel', 'error', ...raw(w, h), '-i', '-', '-vf', vf, '-frames:v', '1', file], buf);
      return json(res, 200, { file });
    }
    case '/api/export/begin': {
      if (job) return json(res, 409, { error: 'an export is already running' });
      const fps = Number(q.get('fps')) || 24;
      fs.mkdirSync(OUT, { recursive: true });
      const file = path.join(OUT, `${clean(q.get('name'), 'liubai')}.mp4`);
      const proc = spawn(
        FFMPEG,
        [
          '-y', '-loglevel', 'error', ...raw(w, h), '-framerate', String(fps), '-i', '-',
          '-vf', 'vflip,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
          '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
          '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
          '-movflags', '+faststart', file,
        ],
        { stdio: ['pipe', 'ignore', 'pipe'] },
      );
      const j = { proc, file, w, h, frames: 0, err: '' };
      j.done = new Promise((resolve) => proc.on('close', resolve));
      proc.stderr.on('data', (d) => (j.err += d));
      proc.stdin.on('error', () => {});
      job = j;
      return json(res, 200, { file });
    }
    case '/api/export/frame': {
      if (!job) return json(res, 409, { error: 'no export running' });
      const buf = await body(req);
      if (buf.length !== job.w * job.h * 4) return json(res, 400, { error: 'frame has the wrong size' });
      if (!job.proc.stdin.write(buf)) await once(job.proc.stdin, 'drain');
      return json(res, 200, { frames: ++job.frames });
    }
    case '/api/export/end':
    case '/api/export/abort': {
      if (!job) return json(res, 409, { error: 'no export running' });
      const j = job;
      job = null;
      j.proc.stdin.end();
      const code = await j.done;
      if (code !== 0) return json(res, 500, { error: j.err.slice(-1500) || `ffmpeg exited ${code}` });
      return json(res, 200, { file: j.file, frames: j.frames, bytes: fs.statSync(j.file).size });
    }
    default:
      return json(res, 404, { error: 'unknown endpoint' });
  }
}

function serveStatic(url, res) {
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep)) return json(res, 403, { error: 'forbidden' });
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return json(res, 404, { error: 'not found' });
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  });
}

const CHUNKS = new Map();
const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
function chunk(url, res) {
  const q = url.searchParams, name = clean(q.get('name'), 'asset'), dir = clean(q.get('dir'), 'gpt'), i = Number(q.get('i')), n = Number(q.get('n'));
  const key = dir + '/' + name;
  if (!CHUNKS.has(key) || i === 0) CHUNKS.set(key, new Array(n));
  const parts = CHUNKS.get(key);
  parts[i] = Buffer.from(q.get('d').replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  if (parts.filter(Boolean).length === n) {
    const out = path.join(ROOT, 'materials', dir); fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, `${name}.${clean(q.get('ext'), 'png')}`), Buffer.concat(parts));
    CHUNKS.delete(key);
  }
  res.writeHead(200, { 'Content-Type': 'image/gif', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
  res.end(GIF);
}

http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://local');
      // (the NovelAI and ChatGPT tabs post their images here: allow those origins, and Chrome's private-network preflight)
      const origin = req.headers.origin || '';
      if (/^https:\/\/([\w-]+\.)?(novelai\.net|chatgpt\.com)$/.test(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Allow-Private-Network', 'true');
        if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
      }
      // (ChatGPT's page may load images from localhost but not connect to it: its generated images come back as image requests
      //  carrying the file in pieces — GET /api/chunk?name=&dir=&i=&n=&d=<base64url> — answered with a 1×1 GIF; the server is started
      //  with a large --max-http-header-size so each piece can be big)
      if (url.pathname === '/api/chunk' && req.method === 'GET') return chunk(url, res);
      if (url.pathname.startsWith('/api/')) await api(url, req, res);
      else serveStatic(url, res);
    } catch (err) {
      json(res, 500, { error: String(err?.message || err) });
    }
  })
  .listen(PORT, '127.0.0.1', () => console.log(`kaguya-wim compositor: http://127.0.0.1:${PORT}`));
