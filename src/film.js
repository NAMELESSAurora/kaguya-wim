// The film: one stage (space.js) seen through a shutter, then one finishing pass.
// Frame at t = average of `samples` moments across a 180° shutter (motion blur), then:
//   bloom (bright parts bleed light: penlights, lasers, foil sheen) · chromatic aberration · the moon's 電波 (glitch rows and
//   channel splits — PLAN §13: glitch has ONE meaning in this film, the moon's signal leaking in) · grain on twos · vignette ·
//   a flash colour (never full white: the user's eyes, mv-feedback).
// Each set may drive these per frame: set.post(t) → { bloom, ca, glitch, grain, vig, flash: [r, g, b, a], sat, lift }.
// Everything is a function of t: preview, snaps and exports agree.
import * as THREE from 'three';
import { createKit, createStage } from './space.js';
import { W, H, FPS } from './timeline.js';
import { buildSets } from './sets/index.js';

const FONTS = [
  ['DelaGothic', 'DelaGothicOne-Regular.ttf'], ['HachiMaru', 'HachiMaruPop-Regular.ttf'], ['DotGothic', 'DotGothic16-Regular.ttf'],
  ['Unbounded', 'Unbounded[wght].ttf', { weight: '200 900' }], ['Bungee', 'Bungee-Regular.ttf'], ['KuaiLe', 'ZCOOLKuaiLe-Regular.ttf'],
  ['VT323', 'VT323-Regular.ttf'], ['Rampart', 'RampartOne-Regular.ttf'], ['YuseiMagic', 'YuseiMagic-Regular.ttf'], ['Smiley', 'SmileySans-Oblique.ttf'],
  ['NotoSansSC', 'NotoSansSC-Tellme.ttf', { weight: '100 900' }],
  // cuter Chinese (the user, 2026-11-24: "中文字体可以找更可爱的字体"; OFL, subset to the song's characters: cache/zh_chars.txt)
  ['ChillRound', 'ChillRoundF-Bold-sub.ttf'], ['Xiaolai', 'Xiaolai-sub.ttf'],
];
async function loadFonts() {
  await Promise.all(FONTS.map(async ([name, file, desc]) => {
    try { const f = new FontFace(name, `url("fonts/${encodeURIComponent(file)}")`, desc || {}); await f.load(); document.fonts.add(f); } catch (e) { console.warn('font', name, e); }
  }));
}

const VS = 'out vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const TRI = new THREE.BufferGeometry();
TRI.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));

export async function createFilm(canvas) {
  canvas.width = W; canvas.height = H;
  THREE.ColorManagement.enabled = false;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.autoClear = false;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
  const shaderErrors = (window.__shaderErrors = []);
  renderer.debug.onShaderError = (gl, program, vs, fs) => {
    const log = [gl.getShaderInfoLog(vs), gl.getShaderInfoLog(fs), gl.getProgramInfoLog(program)].filter(Boolean).join('\n');
    shaderErrors.push(log); console.error(`shader error\n${log}`);
  };
  await loadFonts();
  const kit = createKit(W, H);
  const stage = createStage(renderer, W, H, kit);
  const sets = await buildSets(kit, { W, H });
  for (const s of sets) stage.add(s);

  const RT = (w, h, type = THREE.HalfFloatType) => new THREE.WebGLRenderTarget(w, h, { type, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  const accum = RT(W, H), half = RT(W >> 1, H >> 1), qa = RT(W >> 2, H >> 2), qb = RT(W >> 2, H >> 2), rtOut = RT(W, H, THREE.UnsignedByteType);
  const quadScene = (mat) => { const s = new THREE.Scene(); const m = new THREE.Mesh(TRI, mat); m.frustumCulled = false; s.add(m); return s; };
  const cam = new THREE.Camera();
  const mk = (frag, uniforms, blend) => new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VS, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false,
    ...(blend ? { transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor } : {}) });
  // accumulate one shutter sample (additively, weighted)
  const accMat = mk('precision highp float; uniform sampler2D uSrc; uniform float uW; in vec2 vUv; out vec4 frag; void main() { frag = vec4(texture(uSrc, vUv).rgb * uW, 1.0); }', { uSrc: { value: null }, uW: { value: 1 } }, true);
  const accScene = quadScene(accMat);
  // bloom: the bright part at half size, then a wide blur at quarter size
  const brightMat = mk(`precision highp float; uniform sampler2D uSrc; uniform float uThr; in vec2 vUv; out vec4 frag;
    void main() { vec2 px = 1.0 / vec2(textureSize(uSrc, 0)); vec3 c = 0.25 * (texture(uSrc, vUv + px * vec2(-0.5, -0.5)).rgb + texture(uSrc, vUv + px * vec2(0.5, -0.5)).rgb + texture(uSrc, vUv + px * vec2(-0.5, 0.5)).rgb + texture(uSrc, vUv + px * vec2(0.5, 0.5)).rgb);
      float l = max(c.r, max(c.g, c.b)); frag = vec4(c * smoothstep(uThr, uThr + 0.25, l), 1.0); }`, { uSrc: { value: null }, uThr: { value: 0.72 } });
  const blurMat = mk(`precision highp float; uniform sampler2D uSrc; uniform vec2 uDir; in vec2 vUv; out vec4 frag;
    void main() { vec2 px = uDir / vec2(textureSize(uSrc, 0)); vec3 c = texture(uSrc, vUv).rgb * 0.2;
      float w[4] = float[](0.18, 0.13, 0.08, 0.04);
      for (int i = 0; i < 4; i++) { float o = float(i + 1) * 1.6; c += (texture(uSrc, vUv + px * o).rgb + texture(uSrc, vUv - px * o).rgb) * w[i]; }
      frag = vec4(c / 1.06, 1.0); }`, { uSrc: { value: null }, uDir: { value: new THREE.Vector2(1, 0) } });
  const finMat = mk(`precision highp float; uniform sampler2D uSrc, uBloom; uniform float uT, uBl, uCA, uGl, uGrain, uVig, uSat, uLift, uExp; uniform vec4 uFlash; uniform vec2 uRes;
    in vec2 vUv; out vec4 frag;
    float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      vec2 uv = vUv; float fr = floor(uT * 24.0);
      // the moon's 電波: rows thrown aside in bands, a block or two displaced, the channels torn apart
      if (uGl > 0.0) {
        float band = floor(uv.y * 38.0), r = h(vec2(band, fr)), r2 = h(vec2(floor(uv.y * 7.0), fr + 3.0));
        uv.x += (r - 0.5) * 0.09 * uGl * step(0.72, r) + (r2 - 0.5) * 0.03 * uGl * step(0.8, r2);
        vec2 blk = floor(uv * vec2(9.0, 16.0)); if (h(blk + fr) > 1.0 - 0.06 * uGl) uv += (vec2(h(blk + 1.3 + fr), h(blk + 7.1 + fr)) - 0.5) * 0.05 * uGl;
      }
      vec2 d = (uv - 0.5); float ca = uCA + uGl * 0.006;
      vec3 c = vec3(texture(uSrc, uv + d * ca).r, texture(uSrc, uv).g, texture(uSrc, uv - d * ca).b);
      c += texture(uBloom, uv).rgb * uBl;
      // exposure, and a soft shoulder above 0.8 (0.7 flattened pastel art) so bright parts keep their detail instead of clipping (the user, 2026-11-24:
      // "曝光度稍微有点高了，有些素材太亮有些看不清")
      c *= uExp; vec3 kn = vec3(0.8); c = mix(c, kn + (1.0 - kn) * (1.0 - exp(-(c - kn) / (1.0 - kn))), step(kn, c));
      float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(vec3(l), c, uSat); c = c * (1.0 - uLift) + uLift;
      c = mix(c, uFlash.rgb, uFlash.a);
      c *= 1.0 - uVig * pow(length(d * vec2(1.0, 1.15)) * 1.25, 2.4);
      c += (h(floor(vUv * uRes * 0.5) + fr * 1.7) - 0.5) * uGrain;
      frag = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`, { uSrc: { value: accum.texture }, uBloom: { value: qb.texture }, uT: { value: 0 }, uBl: { value: 0.35 }, uCA: { value: 0 }, uGl: { value: 0 }, uGrain: { value: 0.035 }, uVig: { value: 0.25 }, uSat: { value: 1 }, uLift: { value: 0 }, uExp: { value: 0.92 }, uFlash: { value: new THREE.Vector4(1, 1, 1, 0) }, uRes: { value: new THREE.Vector2(W, H) } });
  const brightScene = quadScene(brightMat), blurScene = quadScene(blurMat), finScene = quadScene(finMat);
  const toScreen = mk('precision highp float; uniform sampler2D uSrc; in vec2 vUv; out vec4 frag; void main() { frag = texture(uSrc, vUv); }', { uSrc: { value: rtOut.texture } });
  const screenScene = quadScene(toScreen);
  const draw = (scene, target) => { renderer.setRenderTarget(target); renderer.render(scene, cam); };
  const pixels = new Uint8Array(W * H * 4);

  // the moments a frame is made of (the shutter samples)
  const moments = (t, n) => (n <= 1 ? [t] : Array.from({ length: n }, (_, k) => t + ((k + 0.5) / n - 0.5) * (0.5 / FPS)));
  function render(t, samples = 1) {
    const ts = moments(t, samples);
    renderer.setRenderTarget(accum); renderer.setClearColor(0x000000, 1); renderer.clear(true, false, false);
    ts.forEach((tk, k) => {
      const jit = samples > 1 ? [((k * 0.618) % 1) - 0.5, ((k * 0.382 + 0.25) % 1) - 0.5] : null;
      const rt = stage.render(tk, jit, k, t);      // (footage is taken at the frame's own time in every sample: blending two film frames ghosted it)
      if (!rt) return;
      accMat.uniforms.uSrc.value = rt.texture; accMat.uniforms.uW.value = 1 / ts.length; draw(accScene, accum);
    });
    const set = stage.setAt(t), P = { bloom: 0.35, ca: 0.0, glitch: 0, grain: 0.035, vig: 0.25, flash: [1, 1, 1, 0], sat: 1, lift: 0, thr: 0.72, exp: 0.92, ...(set && set.post ? set.post(t) : {}) };
    brightMat.uniforms.uSrc.value = accum.texture; brightMat.uniforms.uThr.value = P.thr; draw(brightScene, half);
    blurMat.uniforms.uSrc.value = half.texture; blurMat.uniforms.uDir.value.set(1, 0); draw(blurScene, qa);
    blurMat.uniforms.uSrc.value = qa.texture; blurMat.uniforms.uDir.value.set(0, 1); draw(blurScene, qb);
    blurMat.uniforms.uSrc.value = qb.texture; blurMat.uniforms.uDir.value.set(2, 0); draw(blurScene, qa);
    blurMat.uniforms.uSrc.value = qa.texture; blurMat.uniforms.uDir.value.set(0, 2); draw(blurScene, qb);
    const u = finMat.uniforms; u.uT.value = t; u.uBl.value = P.bloom; u.uCA.value = P.ca; u.uGl.value = P.glitch; u.uGrain.value = P.grain; u.uVig.value = P.vig;
    u.uSat.value = P.sat; u.uLift.value = P.lift; u.uExp.value = P.exp; u.uFlash.value.set(...P.flash);
    draw(finScene, rtOut);
    renderer.setRenderTarget(null); renderer.render(screenScene, cam);
    return { set };
  }
  return {
    render,
    prepare: (t, samples = 1) => stage.prepare([t, ...moments(t, samples)]),
    read: () => { renderer.readRenderTargetPixels(rtOut, 0, 0, W, H, pixels); return pixels; },
    stage, kit,
  };
}
