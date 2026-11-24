// kaguya-wim stage, forked 2026-11-23 from 《澪標》's paper space (tell-me-mv/src/space.js v6.6): the mirror world's sky modes
// removed; added for this film: film footage as frame sequences (P.footage), a hair key that recolours one hue band of a
// picture (st.key), CRT scanlines for footage only (st.crt — the user's rule: tape/CRT on footage, never on design),
// a holographic foil fill (mode 6) and chrome (mode 7) through a plane's alpha.
//
// The paper space (v6 — docs/PLAN-v6.md §2, §5). The user, 2026-11-23: "新方案的大致方向为无场景的类‘像笨蛋一样’PV的演出（角色剪影，
// 角色立绘+素材堆砌+歌词演出+有立体感和空间感的转场以及丝滑的镜头调度）", then "graphicstylepv除了2.5d体现出纵深感，还有歌词的3d变换以及转场时的
// 3d空间感变换". A true-perspective stage of flat things — illustrations, silhouettes, letters, cut-out objects, pages — each a plane
// that can stand anywhere and turn about any axis, with one camera travelling through them (skill pv-mad-motion).
// Each plane: a premultiplied texture; drawn as it is (mode 0), as a flat ink through its alpha (1: type, silhouettes, riso plates),
// or as a two-ink print of its light (2: duotone). It blurs with its distance from the focus (mip level by depth: the lens), thins
// into the paper far away, and fades as it passes the lens. Line art "boils" on twos (12 fps), as a drawn thing does.
// A plane may carry a back (another texture: a card turned over shows its back), a paper edge (a card has thickness when it turns),
// and a cast shadow on what lies behind it.
// Everything is a function of t (frame-exact, deterministic).
import * as THREE from 'three';

const VERT = /* glsl */ `
// (v6.4) a page can roll up off what it lies on (a poster peeled away) or unroll onto it (a sticker laid down): the part past a line
// travelling across the plane is wound round a cylinder that lifts toward the lens. uCurl: progress (0 flat … 1 all rolled) · angle
// of the line's travel · radius (world units) · on
uniform vec4 uCurl;
uniform vec2 uSize;
// (2026-11-24, "旗帜…要做出丝绸的随风飘动的物理效果和光泽") a banner's silk moves in the wind: pinned along the pole (u = 0) and held by the
// top bar, travelling waves run out to the free edge growing as they go; vWv = its slopes (for the silk's light) and its lift.
// uWave: amplitude (world units) · wavelength (plane widths) · speed · on;  uTime shared with the fragment stage
uniform vec4 uWave;
uniform float uTime;
out vec3 vWv;
float clothZ(vec2 q, float t) { float u = q.x, v = 1.0 - q.y, k = 6.2832 / uWave.y, s = fract(uWave.w) * 40.0;
  float A = pow(u, 1.3) * smoothstep(0.065, 0.22, v) * (0.45 + 0.55 * smoothstep(0.1, 0.4, v)) * (0.8 + 0.2 * sin(t * 0.7 + s));      // (the crossbar at the top stays rigid: it is held by the pole)
  return uWave.x * A * (sin(k * (u * 0.9 + v * 0.35) - uWave.z * t + s) + 0.45 * sin(k * 1.9 * (u * 0.7 - v * 0.5) - uWave.z * 1.37 * t + s * 1.7) + 0.2 * sin(k * 3.3 * (u + v * 0.2) - uWave.z * 2.1 * t)); }
out vec2 vUv;
out float vZ;
out float vRoll;
void main() {
  vUv = uv;
  vec3 pos = position; vRoll = 0.0;
  if (uCurl.w > 0.5) {
    vec2 P = uv * uSize, dir = vec2(cos(uCurl.y), sin(uCurl.y));
    float s0 = dot(vec2(0.0), dir), s1 = dot(vec2(uSize.x, 0.0), dir), s2 = dot(vec2(0.0, uSize.y), dir), s3 = dot(uSize, dir);
    float smin = min(min(s0, s1), min(s2, s3)), smax = max(max(s0, s1), max(s2, s3)), r = uCurl.z;
    float d0 = mix(smax + 0.001, smin - 6.2832 * r, uCurl.x), s = dot(P, dir);
    if (s > d0) {
      float th = (s - d0) / r, s2_ = d0 + r * sin(th);
      vec2 P2 = P + dir * (s2_ - s);
      pos.xy += (P2 - P) / max(uSize, vec2(1e-4));
      pos.z += r * (1.0 - cos(th));
      vRoll = th;
    }
  }
  vWv = vec3(0.0);
  if (uWave.w >= 1.0) { float e = 0.01, z0 = clothZ(uv, uTime);
    float dzu = (clothZ(uv + vec2(e, 0.0), uTime) - z0) / (e * uSize.x), dzv = (clothZ(uv + vec2(0.0, e), uTime) - z0) / (e * uSize.y);
    pos.z += z0; pos.x -= uWave.x * 0.25 * pow(uv.x, 1.3) * (1.0 - cos(z0 / max(uWave.x, 1e-4))) / max(uSize.x, 1e-4);      // (it draws in a little as it billows)
    vWv = vec3(dzu, dzv, z0 / max(uWave.x, 1e-4)); }
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vZ = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap, uAtlas;
uniform vec4 uKey;      // hair key: hue centre (deg) · half width (deg) · min saturation · amount (0 off)
uniform vec3 uKeyCol;   // the colour the keyed band takes (its own light kept)
uniform vec4 uKeyR;     // where the key may act: x0, y0, x1, y1 (plane uv from the top-left)
uniform vec4 uCrt;      // CRT on footage: amount · scanline count · mask strength · fringe px
uniform vec4 uLook;     // the footage look: amount · glow · light leaks · ink (line depth)
uniform vec4 uFuse;     // card fusion: progress (<0 off) · columns · rows · on
uniform vec4 uFuseG;    // its grid: window width · height · pitch x · pitch y (world units)
uniform vec4 uFuseR;    // window corner radius · liquid reach · the fused screen's corner radius · —
uniform vec4 uLookC;    // its seed · grade strength · leak hue shift · bloom threshold
uniform vec4 uCute;     // the cute layer: amount · sparkles · soft-focus glow · seed
uniform vec4 uFoil;     // holo / chrome: angle · scale · speed · shine
uniform sampler2D uFx;  // mode 8 (SAR holo card): R holo zone · G foil zone · B figure · A line strength (tools/card.py)
uniform vec4 uCard;     // mode 8: the card's tilt toward the viewer (x right, y up) · etch style (0 cosmos, 1 silk, 2 radial) · amount
uniform vec3 uMetal;
uniform vec4 uMat;      // mode 9 material: kind · bevel texels · shine · pearl    // mode 8: bevel / foil tone
uniform vec4 uSpk[6];   // mode 8: star-glint anchors (u, v from the bottom-left, size, phase)
uniform vec2 uTexSize;
uniform int uMode;
uniform vec3 uCol, uCol2;
uniform float uAlpha, uTime;
uniform vec4 uLens;     // 1 / focus distance · blur px per unit of |1/z − 1/focus| · max blur px · near fade distance
uniform vec4 uFog;      // start · range · how much survives far away · -
uniform vec3 uFogCol;
uniform vec4 uCrop;     // the texture window: offset xy, size zw
uniform vec2 uBoil;     // a texel offset that jumps on twos
uniform float uBias;    // extra blur (mip levels): a shadow is soft
uniform float uSample;
// (v6.2, the user: "graphicdesign片段的素材入场方式太过单一且简单，可以多设计一些入场方式例如水彩晕染，glitchpop up，ascii等等…这些入场方式可以做一个
//  mashup和fusion") how a thing comes into being, not only where it moves — each a stage that can run alone or with the others:
uniform vec4 uFxA;      // watercolour bloom: progress (<0 off; 1 whole) · its seed (u, v: bottom-up) · wetness (the dark wet front, the paler wash)
uniform vec4 uFxB;      // glitch (0…1) · ASCII (0…1: the picture as characters) · ASCII cells across · halftone (0…1: dots of its tone)
uniform vec4 uFxC;      // mosaic cells across (0 off) · scan (<0 off; progress) · scan angle · line (0…1: only the drawing's lines)
uniform vec4 uFade;     // (v6.3) edges that fade into a blur: widths at the left, bottom, right, top (plane uv; 0 = a hard edge)
uniform vec4 uCurl;
uniform vec4 uFxE;      // (v6.4, geometric reveals — the user liked the checker of 澪 in squares: "图四的风格化处理我挺喜欢的…几何构成的味道")
                        // tiles (<0 off; progress: squares pop in along a diagonal, each from its own centre) · tile cells across ·
                        // iris (<0 off; progress: a circle opening from the seed, a coral ring at its edge) · stripes (<0 off; bars widening, left → right)
uniform float uRound;
uniform vec4 uScr;      // a viewfinder's screen (the user, 2026-11-24: "全片的素材质感还需要进一步优化，特别是取景框"): inner-shadow width (world) · its strength · glass sheen · dust
uniform vec4 uWipe;     // a magician's colour change: dir.xy · the line's position along it · softness (0 off) — the plane shows only behind the line, which glows   // rounded corners (world units) — every viewfinder's footage (the user, 2026-11-24: "取景框的角可以做圆角处理")
uniform vec4 uRag;      // (v6.4, the user: "规则的矩形取景框观感上会有一种戛然而止的生硬感…边缘做不规则化处理，例如改为拼贴的手撕风格抑或是水彩的晕染墨迹风格")
                        // a rectangle's edge made irregular: kind (0 none · 1 torn paper · 2 watercolour wash) · width (world units) · seed · -
uniform vec4 uRagE;     // how ragged each edge is: left, bottom, right, top (0 = straight)
uniform vec2 uSize;     // the plane as drawn (world units)
uniform vec4 uFxD;      // misregistration (uv offset of the second ink) · dissolve (<0 off; progress) · tear (<0 off; progress) · tear angle
in vec2 vUv;
in float vZ;
in float vRoll;
in vec3 vWv;
uniform vec4 uWave;
uniform sampler2D uWm, uWmE;      // the card's watermark (GPT-drawn engraving): the tile and the big crest (alpha = line)
uniform float uWmOn;
out vec4 frag;
float h12(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float outE01(float k) { k = clamp(k, 0.0, 1.0); return 1.0 - (1.0 - k) * (1.0 - k) * (1.0 - k); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h12(i), h12(i + vec2(1, 0)), f.x), mix(h12(i + vec2(0, 1)), h12(i + vec2(1, 1)), f.x), f.y); }
float fb(vec2 p) { return 0.55 * vn(p) + 0.3 * vn(p * 2.3 + 7.1) + 0.15 * vn(p * 5.1 + 3.3); }
vec4 tap(vec2 uv, float lod) { return (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) ? vec4(0.0) : textureLod(uMap, uv, lod); }
// studio light on a card (the user, 2026-11-24: "卡牌的质感和光影可以优化精修一下"): its face brightens as it turns to the key light (upper
// left), a big soft key reflection (a softbox) slides across it with the tilt, a cool kicker catches the far edge, a fresnel sheen at
// grazing angles, a soft inner shadow under the frame's edge. T: the card normal's x / y in the camera's frame; fb: keep-off (faces)
vec3 cardLight(vec3 col, vec2 T, vec2 uv, float asp, float amt, float keep) {
  float tz = sqrt(max(0.0, 1.0 - dot(T, T))); vec3 N = vec3(T, tz), L = normalize(vec3(-0.5, 0.6, 0.7));
  col *= 0.88 + 0.2 * max(dot(N, L), 0.0);
  vec2 sp = vec2(0.42 - T.x * 2.1, 0.64 + T.y * 2.1), d = uv - sp; d = vec2(d.x * 0.94 - d.y * 0.34, d.x * 0.34 + d.y * 0.94) * vec2(asp, 1.0);
  float sb = smoothstep(1.0, 0.55, length(max(abs(d) / vec2(0.3, 0.12), 0.0)));
  col += vec3(1.0, 0.99, 0.97) * sb * 0.1 * amt * (1.0 - 0.75 * keep);
  float kick = smoothstep(0.82, 1.0, uv.x) * clamp(-T.x * 3.0, 0.0, 1.0) + smoothstep(0.18, 0.0, uv.x) * clamp(T.x * 3.0, 0.0, 1.0);
  col += vec3(0.7, 0.85, 1.0) * kick * 0.09 * amt;
  float fr = pow(1.0 - tz, 2.5); col = mix(col, col * 0.7 + vec3(0.88, 0.9, 1.0) * 0.32, clamp(fr * 1.6, 0.0, 0.55) * amt);
  float e = min(min(uv.x, 1.0 - uv.x) * asp, min(uv.y, 1.0 - uv.y)); col *= 0.94 + 0.06 * smoothstep(0.02, 0.09, e);
  return col;
}
float ink(vec4 c) { return uMode == 1 ? c.a : c.a * (1.0 - 0.85 * dot(c.rgb / max(c.a, 1e-4), vec3(0.3, 0.59, 0.11))); }
// CARD FUSION helpers: the signed distance to the union of the cards' windows — smooth (x) and hard (y) — and to the fused screen
vec2 fuseDist(vec2 Pp, float kq) {
  float Cc = uFuse.y, Rr = uFuse.z; vec2 hs = uFuseG.xy * 0.5 - uFuseR.x; float dH = 1e5, dS = 1e5;
  for (int j = 0; j < 4; j++) { if (float(j) >= Rr) break; for (int i = 0; i < 8; i++) { if (float(i) >= Cc) break;
    vec2 cc = vec2((float(i) - (Cc - 1.0) * 0.5) * uFuseG.z, ((Rr - 1.0) * 0.5 - float(j)) * uFuseG.w), qq = abs(Pp - cc) - hs;
    float dd = length(max(qq, 0.0)) + min(max(qq.x, qq.y), 0.0) - uFuseR.x; dH = min(dH, dd);
    float hh = clamp(0.5 + 0.5 * (dS - dd) / kq, 0.0, 1.0); dS = mix(dS, dd, hh) - kq * hh * (1.0 - hh); } }
  return vec2(dS, dH); }
float fuseOuter(vec2 Pp) { float Cc = uFuse.y, Rr = uFuse.z; vec2 qo = abs(Pp) - (vec2(Cc * uFuseG.z - (uFuseG.z - uFuseG.x), Rr * uFuseG.w - (uFuseG.w - uFuseG.y)) * 0.5 - uFuseR.z);
  return length(max(qo, 0.0)) + min(max(qo.x, qo.y), 0.0) - uFuseR.z; }
// the glass's thickness (0…1) at a point: the liquid filling the gaps (wobbling as it flows) and a lens bevel round the screen's edge
float glassH(vec2 Pp, float kq, float m2, float fz, out float dF) {
  vec2 d = fuseDist(Pp, kq); float dO = fuseOuter(Pp);
  float br = clamp((d.y - d.x) / max(uFuseG.z - uFuseG.x, 1e-3) * 2.5, 0.0, 1.0) * (1.0 - m2) * smoothstep(0.0, 0.25, fz);      // (the liquid clears as the screen becomes whole)
  float ds = d.x - 0.014 * br * sin(Pp.x * 9.0 + uTime * 2.6) * sin(Pp.y * 7.0 - uTime * 2.1);
  dF = mix(ds, dO, m2);
  float bev = 0.16, e = clamp(-dF / bev, 0.0, 1.0), lip = (1.0 - e) * (1.0 - e) * 0.7 * sin(fz * 3.1416) * step(dF, 0.0);      // (glass only while it fuses — once whole it is a seamless picture: the user, "融合时体现质感，融合后就做无缝取景")
  return max(smoothstep(0.0, 1.0, br), lip); }
void main() {
  float asp = uTexSize.x / uTexSize.y, fr = floor(uTime * 12.0);
  vec2 q = vUv;
  // glitch: rows thrown aside, blocks displaced (new on twos)
  float gk = uFxB.x;
  if (gk > 0.0) {
    float row = floor(q.y * 22.0), r = h12(vec2(row, fr));
    q.x += (r - 0.5) * 0.3 * gk * step(0.5, r);
    vec2 blk = floor(q * vec2(7.0, 11.0)); float rb = h12(blk + fr * 1.7);
    q += (vec2(h12(blk + fr + 3.1), h12(blk + fr + 7.7)) - 0.5) * 0.14 * gk * step(0.78, rb);
  }
  // scan: what the front has just passed is smeared along it (pixel-sort)
  vec2 sd = vec2(cos(uFxC.z), sin(uFxC.z));
  float sc = dot(q - 0.5, sd) + 0.5, sfront = uFxC.y * 1.25 - 0.1;
  if (uFxC.y >= 0.0) { float beh = sfront - sc; if (beh > 0.0 && beh < 0.12) q -= sd * (0.12 - beh) * 0.6 * (0.5 + h12(vec2(floor(dot(q, vec2(-sd.y, sd.x)) * 180.0), 0.0))); }
  // tiles: each square shows its own part of the picture, popping out of its centre at its own time (a diagonal with jitter)
  float tileM = 1.0, tileFlash = 0.0;
  if (uFxE.x >= 0.0) {
    vec2 cells = vec2(uFxE.y, max(1.0, floor(uFxE.y * uSize.y / max(uSize.x, 1e-4) + 0.5))), cid = floor(vUv * cells), cuv = fract(vUv * cells);
    float tau = (cid.x / cells.x + (cells.y - 1.0 - cid.y) / cells.y) * 0.5 * 0.8 + h12(cid + 4.2) * 0.2;
    float lp = clamp((uFxE.x * 1.35 - tau) / 0.35, 0.0, 1.0), e = lp < 1.0 ? 1.0 - pow(1.0 - lp, 3.0) * cos(lp * 4.0) : 1.0;
    vec2 cu2 = (cuv - 0.5) / max(e, 1e-3) + 0.5;
    tileM = step(0.0, cu2.x) * step(cu2.x, 1.0) * step(0.0, cu2.y) * step(cu2.y, 1.0) * step(1e-3, lp);
    q = (cid + clamp(cu2, 0.0, 1.0)) / cells;
    tileFlash = (1.0 - smoothstep(0.0, 0.5, lp)) * step(1e-3, lp) * step(0.5, fract((cid.x + cid.y) * 0.5));
  }
  // mosaic
  if (uFxC.x > 0.5) { vec2 cells = vec2(uFxC.x, uFxC.x / asp); q = (floor(q * cells) + 0.5) / cells; }
  vec2 uv = uCrop.xy + q * uCrop.zw + uBoil / uTexSize;
  // (v6.3, the user: "现有的半身像剪影或者是剪影边缘是平直的可以做一个虚化或者渐变过渡") a straight cut melts away: a gradient, and a blur that grows toward it
  float ek = 1.0;
  if (uFade.x > 0.0) ek = min(ek, smoothstep(0.0, uFade.x, vUv.x));
  if (uFade.y > 0.0) ek = min(ek, smoothstep(0.0, uFade.y, vUv.y));
  if (uFade.z > 0.0) ek = min(ek, smoothstep(0.0, uFade.z, 1.0 - vUv.x));
  if (uFade.w > 0.0) ek = min(ek, smoothstep(0.0, uFade.w, 1.0 - vUv.y));
  vec2 tx = uv * uTexSize, dx = dFdx(tx), dy = dFdy(tx);
  float tpp = max(max(length(dx), length(dy)), 1e-4);
  float coc = min(uLens.z, abs(1.0 / max(vZ, 1e-3) - uLens.x) * uLens.y);
  float lod = log2(tpp * max(1.0, coc)) + uBias + (1.0 - ek) * 3.5;
  vec4 c;
  if (coc > 1.5) {          // a few taps round the point (a soft disc, not the mip's box), turned per shutter sample
    vec2 du = (abs(dFdx(uv)) + abs(dFdy(uv))) * 0.5 * coc * 0.5;
    float a0 = h12(gl_FragCoord.xy) * 6.2832 + uSample * 2.39996;
    c = tap(uv, lod) * 0.36;
    for (int i = 0; i < 4; i++) { float a = a0 + float(i) * 1.5708; c += tap(uv + vec2(cos(a), sin(a)) * du, lod) * 0.16; }
  } else c = tap(uv, max(lod, 0.0));
  // the inks parted: a glitch splits the channels; a misregistered print lays its second ink aside
  float off = 0.025 * gk + uFxD.x;
  if (off > 0.0) { vec4 cr = tap(uv + vec2(off, 0.0) * uCrop.zw, lod), cb = tap(uv - vec2(off * 0.6, -off * 0.4) * uCrop.zw, lod); c = vec4(cr.r, c.g, cb.b, max(c.a, max(cr.a, cb.a) * 0.9)); }
  vec4 o;
  if (uMode == 0) o = vec4(c.rgb * uCol, c.a);
  else if (uMode == 1) o = vec4(uCol * c.a, c.a);
  else if (uMode == 3) o = vec4(c.rgb * uCol, 1.0);      // (an opaque picture: the world's own frame, whose alpha means nothing)
  else if (uMode == 4) {   // (v6.3, the user: "剪影可以加上星辉的质感") the figure filled with the mirror world's night: its two colours, a drifting nebula, twinkling stars, a few with glints
    vec2 P = vUv * vec2(asp, 1.0);
    vec3 sky = mix(uCol2, uCol, smoothstep(0.0, 1.0, vUv.y));
    float n1 = fb(P * 2.4 + vec2(uTime * 0.02, 0.0)), n2 = fb(P * 3.7 + 5.0 - vec2(0.0, uTime * 0.015));
    sky += vec3(0.42, 0.16, 0.36) * smoothstep(0.5, 0.85, n1) * 0.55 + vec3(0.12, 0.3, 0.42) * smoothstep(0.58, 0.9, n2) * 0.35;
    float st = 0.0;
    for (int L = 0; L < 3; L++) {
      float sc = L == 0 ? 46.0 : L == 1 ? 22.0 : 9.0; vec2 g = P * sc + float(L) * 17.0, id = floor(g), f = fract(g) - 0.5;
      vec2 pp = (vec2(h12(id + 1.3), h12(id + 7.7)) - 0.5) * 0.7; float b = h12(id + 3.3), tw = 0.5 + 0.5 * sin(uTime * (1.5 + 4.0 * b) + b * 40.0);
      vec2 d = f - pp; float r = length(d);
      st += smoothstep((L == 0 ? 0.07 : L == 1 ? 0.06 : 0.05) * (0.5 + b), 0.0, r) * tw * step(L == 0 ? 0.5 : 0.62, b);
      if (L > 0) st += (exp(-abs(d.x) * 70.0) * exp(-abs(d.y) * 7.0) + exp(-abs(d.y) * 70.0) * exp(-abs(d.x) * 7.0)) * step(0.88, b) * tw * (L == 2 ? 1.2 : 0.7);
    }
    o = vec4((sky + vec3(1.0, 0.95, 0.9) * st) * c.a, c.a);
  }
  else if (uMode == 6) {   // holographic foil: pastel thin-film bands that slide with the angle and time, a sheen, fine grain
    vec2 P = vUv * vec2(asp, 1.0); vec2 dir = vec2(cos(uFoil.x), sin(uFoil.x));
    float ph = dot(P, dir) * uFoil.y + fb(P * 3.0 + uTime * 0.15) * 1.6 + uTime * uFoil.z;
    vec3 rb = 0.5 + 0.5 * cos(6.2832 * (ph + vec3(0.0, 0.33, 0.67)));
    rb = mix(mix(vec3(1.0), uCol, 0.55), rb, 0.32);                                  // (pearl: mostly its own colour, a thin film of rainbow over it)
    float sh = pow(max(0.0, sin(dot(P, vec2(dir.y, -dir.x)) * 3.1 + uTime * 1.3)), 24.0) * uFoil.w;
    rb += sh * 0.6 + (h12(floor(P * 900.0)) - 0.5) * 0.012;
    o = vec4(rb * c.a, c.a);
  }
  else if (uMode == 7) {   // chrome: a sky-over-ground reflection ramp along the plane's height, bent by a slow wobble, bright bands
    float y = vUv.y + 0.06 * sin(vUv.x * 5.0 + uTime * 0.8) + 0.03 * (fb(vUv * 4.0 + uTime * 0.1) - 0.5);
    vec3 sky = mix(vec3(0.75, 0.86, 1.0), vec3(0.98, 0.99, 1.0), smoothstep(0.55, 0.95, y));
    vec3 gnd = mix(vec3(0.08, 0.06, 0.12), vec3(0.42, 0.38, 0.48), smoothstep(0.1, 0.48, y));
    vec3 ch = mix(gnd, sky, smoothstep(0.47, 0.53, y));
    ch += vec3(1.0) * exp(-pow((y - 0.53) / 0.015, 2.0)) * 0.9 + vec3(1.0) * exp(-pow((y - 0.2) / 0.03, 2.0)) * 0.25;
    ch *= mix(vec3(1.0), uCol, 0.45);
    o = vec4(ch * c.a, c.a);
  }  else if (uMode == 9) {   // MATERIAL for flat UI parts (frames, windows, banners, labels — the user, 2026-11-24: "所有素材特别是展示框类组件要做的更有质感"):
    // its own alpha shape becomes a bevel (normal from the alpha gradient), lit from the side the part is tilted toward; a soft gloss
    // band across the top, a pearl film on the flat areas, a sharp specular rim on the bevel, fine grain. uMat: kind (0 acrylic, 1 metal,
    // 2 pearl) · bevel width (texels) · shine · pearl amount
    vec3 col = c.rgb / max(c.a, 1e-4) * uCol; vec2 T = uCard.xy;
    vec2 bw = vec2(uMat.y / uTexSize.x, 0.0), bh = vec2(0.0, uMat.y / uTexSize.y);
    float ax = tap(uv + bw, lod).a - tap(uv - bw, lod).a, ay = tap(uv + bh, lod).a - tap(uv - bh, lod).a;
    vec3 n = normalize(vec3(-ax, -ay, 0.55)); vec3 L = normalize(vec3(-0.45 + T.x * 1.6, 0.6 + T.y * 1.6, 0.75));
    float edge = clamp(length(vec2(ax, ay)) * 1.6, 0.0, 1.0);
    float dif = 0.86 + 0.3 * dot(n, L);
    float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), uMat.x > 0.5 && uMat.x < 1.5 ? 10.0 : 28.0) * uMat.z;
    col *= dif;
    col += vec3(1.0, 0.98, 0.96) * spec * edge;                                        // the bevel catching the light
    float gl = smoothstep(0.62, 0.92, vUv.y) * (0.5 + 0.5 * smoothstep(0.0, 0.5, vUv.x)) * (1.0 - edge * 0.5);
    col += vec3(1.0) * gl * 0.1 * uMat.z;                                              // acrylic gloss across the top
    float bp = dot(vUv - 0.5, vec2(0.8, 0.6)) - (T.x * 2.0 - T.y * 1.1) * 0.8;
    col += vec3(1.0, 0.98, 0.95) * exp(-bp * bp / 0.003) * 0.16 * uMat.z;              // a glare line that runs as it turns
    vec2 Pm = vUv * vec2(asp, 1.0); float ph = dot(Pm, vec2(0.5, 0.86)) * 1.2 + T.x * 1.8 + T.y * 1.2;
    vec3 film = 0.5 + 0.5 * cos(6.2832 * (ph + vec3(0.0, 0.33, 0.67)));
    float lumc = dot(col, vec3(0.3, 0.59, 0.11)), flat_ = 1.0 - edge;
    col = mix(col, col * (0.82 + 0.36 * film), uMat.w * flat_ * smoothstep(0.35, 0.85, lumc)); // pearl film on the light flat areas
    if (uMat.x > 0.5 && uMat.x < 1.5) col = mix(col, col * (0.75 + 0.5 * vec3(0.5 + 0.5 * sin(Pm.y * 70.0 + Pm.x * 3.0))), 0.12 * flat_);  // metal: brushed
    col += (h12(floor(gl_FragCoord.xy)) - 0.5) * 0.025;                                  // grain
    o = vec4(col * c.a, c.a);
  }  else if (uMode == 8) {   // SAR holo card (the user's spec, 2026-11-24): every light here moves with the card's tilt toward the viewer
    vec4 z = texture(uFx, uv); vec3 col = c.rgb / max(c.a, 1e-4); vec2 T = uCard.xy; float amt = uCard.w;
    vec2 P = vUv * vec2(asp, 1.0);
    // micro-etched pattern (per world): cosmos specks of several sizes · silk ripples · radial sunburst — and a fine oblique grating
    float pat;
    if (uCard.z < 0.5) { vec2 g = P * 34.0, id = floor(g), f = fract(g) - 0.5 - (vec2(h12(id + 0.3), h12(id + 1.7)) - 0.5) * 0.6; float r = 0.08 + 0.3 * h12(id + 3.1);
      pat = 0.35 + 0.65 * smoothstep(r, r * 0.6, length(f)) * step(0.55, h12(id + 5.3)); vec2 g2 = P * 90.0, id2 = floor(g2); pat += 0.4 * smoothstep(0.3, 0.0, length(fract(g2) - 0.5)) * step(0.8, h12(id2)); }
    else if (uCard.z < 1.5) pat = 0.45 + 0.55 * (0.5 + 0.5 * sin((P.x + 0.08 * sin(P.y * 9.0 + P.x * 4.0)) * 70.0 + P.y * 20.0));
    else { vec2 dd = (vUv - vec2(0.5, 0.64)) * vec2(asp, 1.0); pat = 0.4 + 0.6 * (0.5 + 0.5 * cos(atan(dd.y, dd.x) * 56.0)); }
    float gr = 0.5 + 0.5 * sin(dot(P, vec2(0.71, 0.71)) * 420.0); float grw = fwidth(dot(P, vec2(0.71, 0.71)) * 420.0); gr = mix(gr, 0.5, clamp(grw * 0.6, 0.0, 1.0));
    // two layers of rainbow diffraction drifting with the tilt
    float ph1 = dot(P, vec2(0.55, 0.83)) * 1.4 + T.x * 2.6 + T.y * 1.5 + pat * 0.18, ph2 = dot(P, vec2(-0.83, 0.55)) * 2.1 - T.x * 1.9 + T.y * 2.3 + 0.37;
    vec3 rbA = clamp(0.5 + 0.62 * cos(6.2832 * (ph1 + vec3(0.0, 0.33, 0.67))), 0.0, 1.0), rbB = clamp(0.5 + 0.62 * cos(6.2832 * (ph2 + vec3(0.0, 0.33, 0.67))), 0.0, 1.0);
    vec3 rb = max(rbA, rbB * 0.85);                                              // (kept saturated: two films, the brighter wins)
    float lum = dot(col, vec3(0.3, 0.59, 0.11));
    float hz = z.r * amt * (0.35 + 0.65 * pat) * (0.85 + 0.15 * gr);
    col = 1.0 - (1.0 - col) * (1.0 - rb * hz * 0.62);                            // the rainbow laid OVER the art (screen), never greying it (2026-11-24: "卡面的光泽要做的绚丽" — stronger)
    // LASER holo (the user, 2026-11-24: "卡牌的光影要做镭射炫彩效果"): a diffraction grating — pure-spectrum stripes that slide fast with the
    // tilt, strongest in a band where the light catches them (it sweeps across as the card turns), lighter on her face; prism glints
    float lp = dot(P, vec2(0.83, -0.55)) * 7.5 + (T.x * 7.0 - T.y * 5.0) + uTime * 0.12 + pat * 0.25;
    vec3 laser = clamp(abs(fract(lp + vec3(0.0, 0.333, 0.667)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
    float catchB = exp(-pow(dot(vUv - 0.5, vec2(0.6, 0.8)) - (T.x * 2.0 - T.y * 1.4) * 0.9, 2.0) / 0.055);
    float lk = (0.22 + 0.78 * catchB) * amt * max(z.r, z.g * 0.85) * (1.0 - 0.82 * z.b);
    col = mix(col, 1.0 - (1.0 - col) * (1.0 - laser * 0.95), clamp(lk * 1.05, 0.0, 0.9));
    // a thin-film iridescence over the whole coat (soap-bubble colours drifting with the tilt), strongest where the light catches
    { float tf = dot(P, vec2(0.42, 0.91)) * 1.6 + dot(T, vec2(3.1, -2.2)) + 0.15 * sin(P.x * 9.0 + P.y * 7.0 + uTime * 0.3);
      vec3 film2 = 0.5 + 0.5 * cos(6.2832 * (tf + vec3(0.0, 0.33, 0.67)));
      col = mix(col, col * (0.7 + 0.6 * film2), 0.35 * amt * (1.0 - 0.9 * z.b) * (0.4 + 0.6 * catchB)); }      // (tints rather than brightens: no bloom haze over her)
    vec2 sgl = P * 64.0, sidl = floor(sgl); float spl = h12(sidl + floor(uTime * 8.0) * 0.37);
    col += laser * step(0.974, spl) * smoothstep(0.32, 0.0, length(fract(sgl) - 0.5)) * max(z.r, z.g) * amt * 1.5 * (0.3 + catchB);
    // GEM COAT (the user, 2026-11-24: "卡面做宝石涂层质感+花纹水印…高光照过时会产生炫彩镭射光效+宝石棱镜效果和花纹水印"): a clear coat cut into
    // small facets, each with its own tilt — as the card turns a scatter of them flash (a white core with a spectral fringe: prism
    // dispersion) and the cut lines split the light; the coat's watermark (a GPT-drawn engraving, tiled, and one big crest) shows only
    // where the light catches it, in laser colours, a whisper of it always there like a security print
    float bpG = dot(vUv - 0.5, vec2(0.8, 0.6)) - (T.x * 2.4 - T.y * 1.3) * 0.8, bandK = exp(-bpG * bpG / 0.014), litK = max(catchB, bandK);      // (2026-11-24: "加强宝石和花纹感" — they flare in the glare too)
    { vec2 gq = P * 46.0, gi = floor(gq), gf = fract(gq); float d1 = 8.0, d2 = 8.0; vec2 cid = gi;
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o2 = vec2(float(i), float(j)), pp = o2 + vec2(h12(gi + o2 + 0.17), h12(gi + o2 + 3.9)) - gf; float dd = dot(pp, pp);
        if (dd < d1) { d2 = d1; d1 = dd; cid = gi + o2; } else if (dd < d2) d2 = dd; }
      float cut = 1.0 - smoothstep(0.0, 0.07, sqrt(d2) - sqrt(d1));
      vec2 fn = (vec2(h12(cid + 7.7), h12(cid + 9.1)) - 0.5) * 0.8;
      float fa = dot(normalize(vec3(fn + T * 3.4, 1.0)), normalize(vec3(0.3, 0.5, 1.0))), flash = pow(max(fa, 0.0), 260.0) * smoothstep(0.55, 0.0, sqrt(d1));      // (a sharp point of light in the facet, not the whole facet)
      vec3 disp = clamp(abs(fract(h12(cid + 2.2) * 0.6 + dot(T, vec2(2.2, -1.5)) + vec3(0.0, 0.333, 0.667)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
      float gk = amt * (0.25 + 0.75 * litK) * (1.0 + 0.8 * bandK) * (1.0 - 0.85 * z.b);
      col += (vec3(0.6) + disp * 1.1) * flash * gk * 1.25;
      col += disp * cut * (0.03 + 0.16 * catchB + 0.3 * bandK) * amt * (1.0 - 0.85 * z.b);
      col *= 1.0 + (fa - 0.85) * 0.16 * amt * (1.0 - 0.7 * z.b);
      if (uWmOn > 0.5) { vec2 wq = mat2(0.866, -0.5, 0.5, 0.866) * (P * 1.5); float wm = texture(uWm, wq).a;
        vec2 eq = (vUv - vec2(0.5, 0.45)) * vec2(asp, 1.0) / 0.7 + 0.5; float we = (eq.x > 0.0 && eq.x < 1.0 && eq.y > 0.0 && eq.y < 1.0) ? texture(uWmE, eq).a : 0.0;
        float wk = clamp(max(wm * 0.75, we * 0.85), 0.0, 1.0) * amt * (0.08 + 0.92 * pow(litK, 1.2)) * (1.0 - 0.92 * z.b);
        vec3 wc = mix(laser, disp, 0.4) * 0.9 + 0.3;
        col = mix(col, 1.0 - (1.0 - col) * (1.0 - wc), clamp(wk, 0.0, 0.88)); } }
    col += rb * hz * pat * 0.12 * smoothstep(0.15, 0.6, lum);                    // and catching in the etched specks
    col += rb * z.b * smoothstep(0.62, 0.95, lum) * 0.1 * amt;                   // (a whisper of it on her highlights only)
    // foil: the frame, the plate and the art's own lights turn to metal that flares as the card tilts
    vec2 fd = normalize(vec2(1.0, 0.62)); float fpos = dot(vUv - 0.5, fd) - (T.x * 1.3 - T.y * 0.9);
    float fl = pow(max(0.0, 1.0 - abs(fpos) * 2.2), 5.0), brush = 0.85 + 0.15 * sin(P.y * 900.0 + h12(floor(P * vec2(3.0, 400.0))) * 6.0);
    col = mix(col, (col * 0.35 + uMetal * 0.75) * brush + vec3(1.0) * fl * 0.9 + rb * 0.2, z.g * 0.9);
    // SAR micro-emboss: the line art's edges catch the light from the tilt's side
    vec2 e1 = vec2(1.2 / uTexSize.x, 0.0), e2 = vec2(0.0, 1.2 / uTexSize.y);
    float lx = dot(tap(uv + e1, lod).rgb - tap(uv - e1, lod).rgb, vec3(0.33)), ly = dot(tap(uv + e2, lod).rgb - tap(uv - e2, lod).rgb, vec3(0.33));
    vec2 ld = normalize(vec2(0.55, 0.8) + T * 2.5); col += dot(vec2(lx, ly), ld) * z.a * 0.9 * amt;
    // the glare: a glass band sweeping across with the tilt, and a soft spotlight that slides the other way
    float bp = dot(vUv - 0.5, vec2(0.8, 0.6)) - (T.x * 2.4 - T.y * 1.3) * 0.8, band = exp(-bp * bp / 0.0025) * 0.36 + exp(-bp * bp / 0.03) * 0.1;
    { float al = dot(vUv - 0.5, vec2(-0.6, 0.8)) * 1.6 + T.x * 1.5 - T.y * 1.1; vec3 spec = clamp(abs(fract(al + vec3(0.0, 0.333, 0.667)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
      vec3 split = vec3(exp(-pow(bp - 0.018, 2.0) / 0.0025), exp(-bp * bp / 0.0025), exp(-pow(bp + 0.018, 2.0) / 0.0025)) * 0.36 + vec3(exp(-bp * bp / 0.03)) * 0.1;
      col += mix(vec3(1.0, 0.99, 0.97), spec * 1.3, 0.62) * split * (1.0 - 0.93 * z.b) * amt * 1.15; }      // (2026-11-24, "卡面的斜向高光能不能也做炫彩": the glare in spectrum)            // (kept off her face: the glass glare lives on the art and the foil)
    vec2 sp = vec2(0.5 - T.x * 1.8, 0.55 + T.y * 1.8); col += vec3(1.0, 0.96, 0.92) * exp(-dot((vUv - sp) * vec2(asp, 1.0), (vUv - sp) * vec2(asp, 1.0)) / 0.06) * 0.08 * amt * (1.0 - 0.6 * z.b);
    // four-point star glints at the highlights, flaring as the band passes them
    for (int i = 0; i < 6; i++) { vec4 S = uSpk[i]; if (S.z <= 0.0) continue;
      vec2 d = (vUv - S.xy) * vec2(asp, 1.0) / S.z; float bq = dot(S.xy - 0.5, vec2(0.8, 0.6)) - (T.x * 2.4 - T.y * 1.3) * 0.8;
      float k = exp(-bq * bq / 0.012) * (0.75 + 0.25 * sin(uTime * 5.7596 + S.w));   // (twice per card loop of 48 / 22 s)
      float star = exp(-abs(d.x) * 16.0) * exp(-abs(d.y) * 1.4) + exp(-abs(d.y) * 16.0) * exp(-abs(d.x) * 1.4) + 0.6 * exp(-dot(d, d) * 30.0);
      col += vec3(1.0, 0.97, 0.9) * star * k * 0.75 * amt; }
    col = cardLight(col, T, vUv, asp, amt, z.b);
    // the bevel: a bright metal rim whose light runs round the card with the tilt
    vec2 hp = abs(vUv - 0.5) * vec2(asp, 1.0), hb = vec2(asp, 1.0) * 0.5 - 0.045; float sdr = length(max(hp - hb, 0.0)) + min(max(hp.x - hb.x, hp.y - hb.y), 0.0) - 0.045;
    float rim = smoothstep(-0.016, -0.006, sdr), ang = atan(vUv.y - 0.5, (vUv.x - 0.5) * asp), ta = atan(T.y + 1e-4, T.x + 1e-4);
    float refl = 0.35 + 0.65 * pow(0.5 + 0.5 * cos(ang - ta), 3.0) * clamp(length(T) * 4.0, 0.2, 1.0);
    col = mix(col, uMetal * (0.55 + 0.9 * refl) + vec3(1.0) * pow(refl, 8.0) * 0.5, rim);
    o = vec4(col * c.a, c.a);
  }
  else if (uMode == 13) {   // CLOTH — SILK (the user, 2026-11-24: "旗帜的质感和精度还需要优化，要做出丝绸的随风飘动的物理效果和光泽"): the geometry billows in the
    // wind (VERT clothZ); here its light: a soft key on the slopes, an anisotropic silk sheen running along the threads (bright bands that
    // slide over the folds as they move), a lit rim where it turns away, the shadow in the troughs, a fine weave, darker hems
    vec3 col = c.rgb / max(c.a, 1e-4) * uCol;
    if (uWave.w >= 1.0) {
      vec3 N = normalize(vec3(-vWv.x, -vWv.y, 1.0)); if (!gl_FrontFacing) N.z = -N.z;
      vec3 L = normalize(vec3(-0.45, 0.6, 0.75)), V = vec3(0.0, 0.0, 1.0), H = normalize(L + V), Tt = normalize(vec3(0.0, 1.0, vWv.y));
      float dif = 0.62 + 0.48 * max(dot(N, L), 0.0), th = dot(Tt, H), aniso = pow(sqrt(max(0.0, 1.0 - th * th)), 90.0), aniso2 = pow(sqrt(max(0.0, 1.0 - th * th)), 14.0);
      float fres = pow(1.0 - abs(N.z), 2.0), trough = smoothstep(0.2, -0.9, vWv.z);
      col = col * dif * (1.0 - 0.22 * trough) + vec3(1.0, 0.98, 0.95) * (aniso * 0.45 + aniso2 * 0.08) + col * fres * 0.5;
    } else {
      float sd = uCard.y * 6.2832, wv = sin(vUv.y * 7.0 - uTime * 3.0 + sd) * 0.5 + 0.5, fold = sin(vUv.x * 6.2832 * 1.6 + wv * 1.8 + uTime * 0.9 + sd) * (0.6 + 0.4 * vUv.y);
      col *= 0.76 + 0.3 * (0.5 + 0.5 * fold); col += vec3(1.0, 0.97, 0.92) * pow(max(fold, 0.0), 10.0) * 0.2; }
    float weave = (0.5 + 0.5 * sin(vUv.x * uTexSize.x * 1.3)) * (0.5 + 0.5 * sin(vUv.y * uTexSize.y * 1.3));
    col *= 0.94 + 0.08 * weave; col *= 0.88 + 0.12 * smoothstep(0.0, 0.05, min(vUv.x, 1.0 - vUv.x));
    o = vec4(col * c.a, c.a);
  }
  else if (uMode == 12) {   // the code-drawn effects made refined (the user, 2026-11-24: "“特效”除了rays，还有其他类似的用svg搓的特效"); kind
    // (uCard.z): 0 sparkle — long thin four-point spikes with a chromatic fringe, faint diagonals, a hot core · 1 bokeh — an aperture disc
    // with a bright rim and a dusty inside · 2 ring — a luminous line with a soft glow, a chromatic split, light running round it ·
    // 3 manga mark — the drawn shape as a glossy sticker (colour fill, white outline, gloss). uCard.x seed, uCard.w ring width.
    vec2 P = (vUv - 0.5) * 2.0; float r = length(P), ang = atan(P.y, P.x), sd = uCard.x * 6.2832, kind = uCard.z; vec3 tint = mix(uCol, vec3(1.0), 0.2);
    if (kind < 0.5) {
      vec3 sp = vec3(exp(-abs(P.y) * 30.0) * exp(-abs(P.x) * 2.3) + exp(-abs(P.x) * 30.0) * exp(-abs(P.y) * 2.3),
                     exp(-abs(P.y) * 38.0) * exp(-abs(P.x) * 2.6) + exp(-abs(P.x) * 38.0) * exp(-abs(P.y) * 2.6),
                     exp(-abs(P.y) * 48.0) * exp(-abs(P.x) * 3.0) + exp(-abs(P.x) * 48.0) * exp(-abs(P.y) * 3.0));
      vec2 Q = vec2(P.x + P.y, P.y - P.x) * 0.7071; float dg = (exp(-abs(Q.y) * 70.0) * exp(-abs(Q.x) * 7.0) + exp(-abs(Q.x) * 70.0) * exp(-abs(Q.y) * 7.0)) * 0.3;
      vec3 col = tint * (sp * 1.1 + dg) + vec3(1.0, 0.99, 0.96) * (exp(-r * r / 0.005) * 1.3 + exp(-r * r / 0.05) * 0.3);
      o = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0) * 0.35);
    } else if (kind < 1.5) {
      float ap = r * (1.0 + 0.035 * cos(6.0 * ang + sd)), disc = smoothstep(0.93, 0.85, ap), rim = exp(-pow((ap - 0.86) / 0.045, 2.0));
      vec3 rimC = vec3(exp(-pow((ap - 0.875) / 0.04, 2.0)), rim, exp(-pow((ap - 0.845) / 0.04, 2.0)));
      vec3 col = tint * disc * (0.38 + 0.22 * (1.0 - r) + 0.12 * vn(P * 7.0 + sd)) + mix(tint, vec3(1.0), 0.4) * rimC * 0.55;
      o = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0) * 0.45);
    } else if (kind < 2.5) {
      float lw = max(uCard.w, 0.004), R0 = 1.0 - lw * 2.2;
      vec3 rc = vec3(exp(-pow((r - R0 - lw * 0.3) / lw, 2.0)), exp(-pow((r - R0) / lw, 2.0)), exp(-pow((r - R0 + lw * 0.3) / lw, 2.0)));      // (a fine fringe, not a rainbow)
      float core = exp(-pow((r - R0) / (lw * 0.45), 2.0)), glow = exp(-pow((r - R0) / (lw * 7.0), 2.0)) * 0.3, run = 0.7 + 0.3 * sin(ang * 2.0 - uTime * 2.4 + sd) + 0.4 * pow(0.5 + 0.5 * sin(ang - uTime * 1.3 + sd), 16.0);
      vec3 col = (tint * (rc * 0.8 + glow) + vec3(1.0) * core * 0.5) * run;
      o = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0) * 0.4);
    } else {
      vec2 e1 = vec2(7.0 / uTexSize.x, 0.0), e2 = vec2(0.0, 7.0 / uTexSize.y);
      float a0 = c.a, ad = max(max(max(tap(uv + e1, lod).a, tap(uv - e1, lod).a), max(tap(uv + e2, lod).a, tap(uv - e2, lod).a)), max(max(tap(uv + e1 + e2, lod).a, tap(uv - e1 - e2, lod).a), max(tap(uv + e1 - e2, lod).a, tap(uv - e1 + e2, lod).a)));
      float A = max(a0, ad);
      vec3 fill = uCol * (0.78 + 0.4 * vUv.y) + vec3(1.0) * smoothstep(0.6, 0.85, vUv.y) * 0.22 * a0;
      vec3 col = mix(vec3(1.0, 0.99, 0.98), fill, a0);
      o = vec4(col * A, A);
    }
  }
  else if (uMode == 11) {   // a BURST of light (the user, 2026-11-24: "图一的特效要做的更精致，质感要更足"): many fine rays of uneven length
    // in three angular frequencies, a white-hot core, a chromatic halo ring that opens, an anamorphic streak, dust twinkling along the
    // rays; it adds light (low alpha). uCard: progress (0 → 1) · seed. Colour: uCol.
    vec2 P = (vUv - 0.5) * 2.0; float r = length(P), a = atan(P.y, P.x), u = uCard.x, sd = uCard.y * 6.2832;
    float R = 0.55 * pow(abs(sin(a * 9.0 + 2.0 * sin(a * 2.0 + sd))), 22.0) + 0.45 * pow(abs(sin(a * 23.0 + sd * 1.7)), 70.0) + 0.3 * pow(abs(sin(a * 47.0 - sd)), 140.0);
    float len = 0.45 + 0.55 * (0.5 + 0.5 * sin(a * 5.0 + sd * 3.0)) * (0.6 + 0.4 * (0.5 + 0.5 * sin(a * 11.0 - sd)));
    float fall = exp(-r / max(len * (0.35 + 0.45 * u), 0.05)) * smoothstep(1.0, 0.7, r);
    float rays = R * fall * smoothstep(0.02, 0.12, r);
    float core = exp(-r * r / 0.004) * 1.4 + exp(-r * r / 0.05) * 0.45;
    float rr0 = 0.22 + 0.45 * outE01(u);
    vec3 halo = vec3(exp(-pow((r - rr0 - 0.014) / 0.012, 2.0)), exp(-pow((r - rr0) / 0.012, 2.0)), exp(-pow((r - rr0 + 0.014) / 0.012, 2.0))) * 0.45 * (1.0 - u);
    float streak = exp(-abs(P.y) * 55.0) * exp(-abs(P.x) * 2.4) * 0.6 + exp(-abs(P.x) * 90.0) * exp(-abs(P.y) * 6.0) * 0.12;
    vec2 pg = vec2(a * 6.0, r * 22.0 - u * 6.0), pid = floor(pg); float pd = h12(pid + floor(sd)), tw = 0.5 + 0.5 * sin(uTime * 14.0 + pd * 50.0);
    float dust = step(0.9, pd) * smoothstep(0.3, 0.0, length(fract(pg) - 0.5)) * tw * fall * 1.4;
    vec3 tint = mix(uCol, vec3(1.0), 0.35) * (0.8 + 0.4 * (0.5 + 0.5 * cos(6.2832 * (r * 1.5 - u + vec3(0.0, 0.33, 0.67)))));
    vec3 col = tint * rays * 1.25 + vec3(1.0, 0.98, 0.95) * core + halo + mix(uCol, vec3(1.0), 0.6) * streak + vec3(1.0, 0.97, 0.9) * dust;
    float I = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    o = vec4(col, I * 0.3);
  }
  else if (uMode == 10) {   // the card back: an image-model pattern (the user, 2026-11-24: "卡牌的背面也可以用生图模型制作图案，然后用shader写星空质感附加
    // 在图案上" — tools/card_back_art.py) with a living night laid over it: in its dark sky a drifting nebula, star dust, twinkling glint stars
    // and now and then a shooting star; on its gold linework a holo film and a foil flare that move with the card's tilt, and a light
    // that runs round the engraved rings; on every beat a ring out of the moon and the emblem's glow. uCard: tilt · phase; uMat: emblem centre · radius
    vec2 T = uCard.xy; float sd = uCard.z, tm = uTime + sd * 0.37, RR = max(uMat.z, 0.05);
    vec3 art = c.rgb / max(c.a, 1e-4), col = art;
    vec2 Q = vUv * vec2(asp, 1.0), P = (vUv - uMat.xy) * vec2(asp, 1.0);
    float r = length(P), th = atan(P.y, P.x);
    float bp = (uTime - 0.2469) / 0.50847, bf = fract(bp), pulse = exp(-bf * 4.5), onbar = step(mod(floor(bp + 0.5), 4.0), 0.5);
    float lum = dot(art, vec3(0.3, 0.59, 0.11));
    float sky = smoothstep(0.45, 0.22, lum) * smoothstep(-0.04, 0.05, art.b - art.r * 0.8);          // the pattern's dark violet night
    float gold = smoothstep(0.32, 0.62, lum) * smoothstep(0.0, 0.1, art.r - art.b);                  // its metal linework
    // the night: nebula, dust, stars with glints, a shooting star
    float n1 = fb(Q * 3.2 + vec2(tm * 0.04, -tm * 0.025) + sd), n2 = fb(Q * 6.5 - vec2(tm * 0.06, tm * 0.03) + 3.0 + sd);
    col += sky * (vec3(0.5, 0.25, 0.78) * smoothstep(0.45, 0.85, n1) * 0.34 + vec3(0.9, 0.38, 0.68) * smoothstep(0.6, 0.92, n2) * 0.18);
    vec2 dg = Q * 95.0, did = floor(dg); float dh = h12(did + 1.7 + floor(sd * 5.0));
    col += sky * vec3(0.92, 0.9, 1.0) * step(0.93, dh) * smoothstep(0.38, 0.0, length(fract(dg) - 0.5)) * (0.3 + 0.3 * sin(tm * 3.0 + dh * 50.0));
    vec2 sg = Q * 21.0, sid = floor(sg), sf = fract(sg) - 0.5 - (vec2(h12(sid + 0.7), h12(sid + 2.9)) - 0.5) * 0.6;
    float sb = h12(sid + 9.1 + floor(sd * 3.0)), tw = pow(0.5 + 0.5 * sin(tm * (1.3 + 3.0 * sb) + sb * 40.0), 3.0);
    float star = smoothstep(0.07, 0.0, length(sf)) + 0.5 * (exp(-abs(sf.x) * 60.0) * exp(-abs(sf.y) * 7.0) + exp(-abs(sf.y) * 60.0) * exp(-abs(sf.x) * 7.0));
    col += sky * vec3(1.0, 0.96, 0.9) * star * step(0.85, sb) * tw * 0.95;
    float cyc = 8.1356, ks = floor((uTime + sd * 1.7) / cyc), sl = fract((uTime + sd * 1.7) / cyc) / 0.09;
    if (sl < 1.0) { vec2 sdir = normalize(vec2(1.0, -0.6)), hd = vec2((0.1 + 0.45 * h12(vec2(ks, sd))) * asp, 0.92 - 0.25 * h12(vec2(sd, ks))) + sdir * sl * 0.75, rel = Q - hd;
      float al = dot(rel, -sdir), pp = abs(dot(rel, vec2(-sdir.y, sdir.x)));
      col += vec3(1.0, 0.97, 0.9) * (step(0.0, al) * exp(-al / 0.1) * exp(-pp * pp / 0.000008) + exp(-dot(rel, rel) / 0.00004)) * (1.0 - sl) * 0.9; }
    // the linework: a holo film and a flare with the tilt; a light running round the rings
    float ph = dot(Q, vec2(0.6, 0.8)) * 1.3 + T.x * 2.6 + T.y * 1.6 + tm * 0.04 + r * 0.8;
    vec3 rb = clamp(0.5 + 0.6 * cos(6.2832 * (ph + vec3(0.0, 0.33, 0.67))), 0.0, 1.0);
    col = mix(col, col * (0.78 + 0.55 * rb), gold * 0.5);
    float lpb = dot(Q, vec2(0.83, -0.55)) * 7.5 + (T.x * 7.0 - T.y * 5.0) + tm * 0.12;      // (the laser film on the back too)
    vec3 laserB = clamp(abs(fract(lpb + vec3(0.0, 0.333, 0.667)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
    float catchBB = exp(-pow(dot(vUv - 0.5, vec2(0.6, 0.8)) - (T.x * 2.0 - T.y * 1.4) * 0.9, 2.0) / 0.035);
    col = mix(col, 1.0 - (1.0 - col) * (1.0 - laserB * 0.85), clamp((gold * 0.9 + sky * 0.35) * (0.2 + 0.8 * catchBB) * 0.7, 0.0, 0.75));
    float fp = dot(vUv - 0.5, normalize(vec2(1.0, 0.62))) - (T.x * 1.3 - T.y * 0.9);
    col += gold * vec3(1.0, 0.93, 0.78) * exp(-fp * fp / 0.008) * 0.45;
    col += gold * vec3(1.0, 0.92, 0.72) * smoothstep(RR * 1.12, RR * 0.25, r) * pow(0.5 + 0.5 * cos(th - tm * 0.9), 10.0) * 0.4;
    // the beat: a ring out of the moon (bigger on the bar), the emblem's glow
    float rr = RR * (0.3 + bf * mix(1.0, 1.5, onbar)), wv = abs(r - rr);
    col += vec3(1.0, 0.9, 0.72) * exp(-wv * wv / 0.00005) * pow(1.0 - bf, 1.6) * mix(0.3, 0.55, onbar);
    col += vec3(1.0, 0.88, 0.66) * exp(-r * r / (RR * RR * 0.06)) * (0.1 + 0.28 * pulse);
    // a glass glare band with the tilt, the studio light, the bevel's light running round the edge
    float gb = dot(vUv - 0.5, vec2(0.8, 0.6)) - (T.x * 2.4 - T.y * 1.3) * 0.8;
    col += vec3(1.0, 0.98, 0.96) * (exp(-gb * gb / 0.0025) * 0.2 + exp(-gb * gb / 0.03) * 0.06);
    col = cardLight(col, T, vUv, asp, 1.0, 0.0);
    vec2 hp = abs(vUv - 0.5) * vec2(asp, 1.0), hb = vec2(asp, 1.0) * 0.5 - 0.045; float sdr = length(max(hp - hb, 0.0)) + min(max(hp.x - hb.x, hp.y - hb.y), 0.0) - 0.045;
    float rim = smoothstep(-0.012, -0.004, sdr), ra = atan(vUv.y - 0.5, (vUv.x - 0.5) * asp), ta = atan(T.y + 1e-4, T.x + 1e-4);
    float refl = 0.35 + 0.65 * pow(0.5 + 0.5 * cos(ra - ta), 3.0) * clamp(length(T) * 4.0, 0.2, 1.0);
    col = mix(col, vec3(0.93, 0.8, 0.55) * (0.55 + 0.9 * refl) + vec3(1.0) * pow(refl, 8.0) * 0.5, rim);
    col += (h12(floor(gl_FragCoord.xy)) - 0.5) * 0.015;
    float fs = max(fwidth(sdr), 1e-5), mk = smoothstep(fs, -fs, sdr);
    o = vec4(col * mk, mk);
  }

  else { float L = dot(c.rgb / max(c.a, 1e-4), vec3(0.299, 0.587, 0.114)); o = vec4(mix(uCol, uCol2, L) * c.a, c.a); }
  // the hair key: pixels in one hue band (and saturated enough) take another colour, keeping their own light — the twin tails
  // turn gold → silver → teal on the beats (PLAN §5 其の一)
  if (uKey.w > 0.0 && uMode == 0) {
    vec3 cc = o.rgb / max(o.a, 1e-4); float mx = max(cc.r, max(cc.g, cc.b)), mn = min(cc.r, min(cc.g, cc.b)), dd = mx - mn + 1e-5, sat = dd / max(mx, 1e-4);
    float hu = mx == cc.r ? mod((cc.g - cc.b) / dd, 6.0) : mx == cc.g ? (cc.b - cc.r) / dd + 2.0 : (cc.r - cc.g) / dd + 4.0; hu *= 60.0;
    float dh = abs(mod(hu - uKey.x + 180.0, 360.0) - 180.0);
    float k = (1.0 - smoothstep(uKey.y * 0.7, uKey.y, dh)) * smoothstep(uKey.z, uKey.z + 0.06, sat) * smoothstep(0.35, 0.5, mx);
    vec2 kq = vec2(vUv.x, 1.0 - vUv.y); k *= smoothstep(uKeyR.x - 0.07, uKeyR.x + 0.07, kq.x) * smoothstep(uKeyR.z + 0.07, uKeyR.z - 0.07, kq.x) * smoothstep(uKeyR.y - 0.07, uKeyR.y + 0.07, kq.y) * smoothstep(uKeyR.w + 0.07, uKeyR.w - 0.02, kq.y);
    float lum = dot(cc, vec3(0.299, 0.587, 0.114));
    vec3 tgt = uKeyCol * (0.45 + 0.75 * lum);
    o.rgb = mix(o.rgb, tgt * o.a, k * uKey.w);
  }
  // THE FOOTAGE LOOK (the user, 2026-11-24: "原片可以做一些精致的且富有设计感的画面风格化处理"): the film's frames graded into the MV's palette —
  // a split-tone (violet in the shadows, rose-cream in the lights), a gentle S-curve and a little more colour; the line art inked a touch
  // deeper; the highlights blooming softly inside the picture (a far mip); two light leaks drifting at the corners (warm rose, cool lilac);
  // a faint chromatic fringe toward the frame's edges
  if (uLook.x > 0.0 && uMode == 0) {
    vec3 cc = o.rgb / max(o.a, 1e-4); float Lm = dot(cc, vec3(0.299, 0.587, 0.114));
    vec3 tone = mix(vec3(0.42, 0.3, 0.72), vec3(1.0, 0.9, 0.9), smoothstep(0.08, 0.85, Lm));
    vec3 st = mix(cc, cc * tone * 1.35, 0.3 * uLookC.y);
    st = mix(vec3(Lm), st, 1.12); st = mix(st, st * st * (3.0 - 2.0 * st), 0.35);
    vec2 e1 = vec2(1.0 / uTexSize.x, 0.0) * uCrop.zw, e2 = vec2(0.0, 1.0 / uTexSize.y) * uCrop.zw;
    float gx = dot(tap(uv + e1, lod).rgb - tap(uv - e1, lod).rgb, vec3(0.33)), gy = dot(tap(uv + e2, lod).rgb - tap(uv - e2, lod).rgb, vec3(0.33));
    st *= 1.0 - clamp(length(vec2(gx, gy)) * 1.4, 0.0, 0.3) * uLook.w;
    vec3 bl = tap(uv, lod + 4.0).rgb / max(tap(uv, lod + 4.0).a, 1e-4); float bh = smoothstep(uLookC.w, 1.0, dot(bl, vec3(0.3, 0.59, 0.11)));
    st += bl * bh * 0.32 * uLook.y;
    vec2 a1 = vUv - vec2(0.04 + 0.12 * sin(uTime * 0.21 + uLookC.x), 0.92 - 0.05 * sin(uTime * 0.13 + uLookC.x)), a2 = vUv - vec2(0.96, 0.08 + 0.12 * sin(uTime * 0.17 + uLookC.x * 2.0));
    float lk1 = exp(-dot(a1 * vec2(asp, 1.0), a1 * vec2(asp, 1.0)) / 0.22), lk2 = exp(-dot(a2 * vec2(asp, 1.0), a2 * vec2(asp, 1.0)) / 0.16);
    st = 1.0 - (1.0 - st) * (1.0 - vec3(1.0, 0.56, 0.62) * lk1 * 0.34 * uLook.z) * (1.0 - vec3(0.62, 0.66, 1.0) * lk2 * 0.26 * uLook.z);
    // THE CUTE LAYER (the user, 2026-11-24: "原片的后处理可以增加一点可爱滤镜或者风格化处理"): colour brought back where the grade greyed it
    // (vibrance), a pastel pink soft-focus glow (orton), a peach-cream lift in the lights, a pink-lilac haze round the frame's edge, and
    // four-point sparkles that catch on the picture's own small highlights (eye lights, glints), twinkling
    if (uCute.x > 0.0) {
      float K = uCute.x, lm = dot(st, vec3(0.299, 0.587, 0.114)), sat = max(max(st.r, st.g), st.b) - min(min(st.r, st.g), st.b);
      st = mix(vec3(lm), st, 1.0 + 0.45 * K * (1.0 - smoothstep(0.1, 0.6, sat)));
      vec4 sf4 = tap(uv, lod + 3.0); vec3 sf = sf4.rgb / max(sf4.a, 1e-4);
      st = 1.0 - (1.0 - st) * (1.0 - sf * vec3(1.0, 0.8, 0.9) * 0.24 * K * uCute.z);
      st = mix(st, st * vec3(1.04, 0.98, 0.97) + vec3(0.03, 0.01, 0.025), K * smoothstep(0.45, 0.95, lm));
      vec2 eq = abs(vUv - 0.5) * 2.0; float edg = smoothstep(0.55, 1.0, max(eq.x, eq.y)) * 0.6 + smoothstep(0.7, 1.4, length(eq)) * 0.4;
      st = 1.0 - (1.0 - st) * (1.0 - vec3(1.0, 0.72, 0.86) * edg * 0.2 * K);
      if (uCute.y > 0.0) {      // a star filter (星光滤镜): every small bright highlight throws a four-point star, twinkling
        float acc = 0.0; vec2 tx = exp2(max(lod, 0.0)) / uTexSize;
        for (int k = 1; k <= 7; k++) { float fk = float(k), sk = 1.5 + fk * fk * 0.75, wk = exp(-fk * 0.45);
          for (int d = 0; d < 4; d++) { vec2 dir = d == 0 ? vec2(1.0, 0.0) : d == 1 ? vec2(-1.0, 0.0) : d == 2 ? vec2(0.0, 1.0) : vec2(0.0, -1.0), su = uv + dir * sk * tx;
            vec4 s4 = tap(su, lod + 0.5), b4 = tap(su, lod + 4.0); float La = dot(s4.rgb / max(s4.a, 1e-4), vec3(0.3, 0.59, 0.11)), Lb = dot(b4.rgb / max(b4.a, 1e-4), vec3(0.3, 0.59, 0.11));
            acc += smoothstep(0.8, 0.96, La) * smoothstep(0.06, 0.2, La - Lb) * wk; } }      // (only SMALL highlights — eye lights, glints — never a white area)
        st += vec3(1.0, 0.93, 0.97) * acc * 0.32 * uCute.y * (0.7 + 0.3 * sin(uTime * 3.1 + uCute.w * 5.0));
      }
    }
    float ed = pow(length((vUv - 0.5) * 2.0), 3.0); vec2 fo = (vUv - 0.5) * 0.004 * ed * uCrop.zw;
    st.r = mix(st.r, tap(uv + fo, lod).r / max(c.a, 1e-4), 0.5 * clamp(ed, 0.0, 1.0)); st.b = mix(st.b, tap(uv - fo, lod).b / max(c.a, 1e-4), 0.5 * clamp(ed, 0.0, 1.0));
    o.rgb = mix(o.rgb, clamp(st, 0.0, 1.25) * o.a, uLook.x);
  }
  // CRT / broadcast on footage only: scanlines, an aperture mask, the channels a little apart, a soft bulge of light in the middle
  if (uCrt.x > 0.0) {
    float sl = 0.5 + 0.5 * cos(vUv.y * uCrt.y * 6.2832), mk = 0.5 + 0.5 * cos(gl_FragCoord.x * 2.094);
    vec3 cc = o.rgb;
    if (uCrt.w > 0.0) { vec2 fo = vec2(uCrt.w / uTexSize.x, 0.0) * uCrop.zw; cc = vec3(tap(uv + fo, lod).r, cc.g, tap(uv - fo, lod).b) * (uMode == 0 ? uCol : vec3(1.0)); cc *= o.a / max(c.a, 1e-4); }
    cc *= 1.0 - uCrt.x * (0.28 * (1.0 - sl) + uCrt.z * 0.12 * (1.0 - mk));
    float vg = 1.0 - 0.35 * uCrt.x * pow(length((vUv - 0.5) * vec2(1.0, 1.25)), 2.2);
    o.rgb = mix(o.rgb, cc * vg * (1.0 + 0.08 * uCrt.x), uCrt.x);
  }
  vec3 base = o.a > 1e-4 ? o.rgb / o.a : (uMode == 1 ? uCol : vec3(0.5));
  // ASCII: the picture as characters — each cell's density (from a far mip) picks a glyph, in the cell's own colour
  if (uFxB.y > 0.0) {
    vec2 cells = vec2(uFxB.z, uFxB.z / asp * 1.7), cid = floor(q * cells), cuv = fract(q * cells);
    vec2 cu = uCrop.xy + ((cid + 0.5) / cells) * uCrop.zw;
    vec4 cc = textureLod(uMap, cu, log2(max(1.0, uTexSize.x / uFxB.z)));
    float d = clamp(ink(cc) * 1.15, 0.0, 0.999), k = floor(d * 16.0);
    float gl = texture(uAtlas, vec2((k + clamp(cuv.x, 0.02, 0.98)) / 16.0, cuv.y)).a * step(0.03, cc.a);
    vec3 ccol = uMode == 1 ? uCol : (uMode == 2 ? mix(uCol, uCol2, dot(cc.rgb / max(cc.a, 1e-4), vec3(0.3, 0.59, 0.11))) : cc.rgb / max(cc.a, 1e-4) * uCol);
    o = mix(o, vec4(ccol * gl, gl), uFxB.y);
  }
  // halftone: the tone as dots on a turned screen, growing out of the paper
  if (uFxB.w > 0.0) {
    vec2 hp = mat2(0.866, 0.5, -0.5, 0.866) * (q * vec2(70.0, 70.0 / asp)), hc = fract(hp) - 0.5;
    float grow = min(uFxB.w, 1.0), mixw = uFxB.w <= 1.0 ? 1.0 : 2.0 - uFxB.w;       // (0 → 1: the dots grow out of the paper; 1 → 2: the picture comes up through them)
    float d = ink(c), r = sqrt(d) * 0.72 * grow, dot_ = smoothstep(r + 0.06, r - 0.06, length(hc));
    o = mix(o, vec4(base * dot_, dot_) * step(0.02, c.a), mixw);
  }
  // line: only where the drawing changes (its lines and contour), then the fill comes in under them
  if (uFxC.w > 0.0) {
    vec2 e1 = vec2(1.5 / uTexSize.x, 0.0) * uCrop.z, e2 = vec2(0.0, 1.5 / uTexSize.y) * uCrop.w;
    float gx = ink(tap(uv + e1, lod)) - ink(tap(uv - e1, lod)), gy = ink(tap(uv + e2, lod)) - ink(tap(uv - e2, lod));
    float e = clamp(length(vec2(gx, gy)) * 3.0, 0.0, 1.0);
    vec3 lc = uMode == 1 ? uCol : base * 0.55;
    o = mix(o, vec4(lc * e, e), uFxC.w);
  }
  // the rag: each edge pushed in by its own noise along it (torn: a wobble, teeth and fibres, the white core of the paper showing
  // where the top layer tore away; wash: a slow wavering line, the pigment pooled darker along it, granulation, paler blooms inside)
  float rm = 1.0;
  if (uRag.x > 0.5) {
    vec2 P = vUv * uSize; float w = uRag.y, sd = uRag.z * 13.7, torn = step(uRag.x, 1.5);
    vec4 sAl = vec4(P.y, P.x, P.y, P.x) / w + sd + vec4(0.0, 3.1, 7.3, 11.9);
    vec4 nz;
    for (int i = 0; i < 4; i++) {
      float s0 = sAl[i];
      nz[i] = torn > 0.5 ? 0.18 + 0.5 * fb(vec2(s0 * 0.8, 1.0 + float(i))) + 0.22 * (vn(vec2(s0 * 5.0, 2.0)) - 0.5) + 0.1 * (vn(vec2(s0 * 23.0, 3.0)) - 0.5)
                         : 0.15 + 0.7 * fb(vec2(s0 * 0.42, 4.0 + float(i))) + 0.14 * vn(vec2(s0 * 2.1, 5.0));
    }
    vec4 dd = vec4(P.x, P.y, uSize.x - P.x, uSize.y - P.y) - w * uRagE * nz;
    float d = min(min(dd.x, dd.y), min(dd.z, dd.w)), fw = max(fwidth(d), 1e-5);
    if (torn > 0.5) {
      rm = smoothstep(-fw, fw, d);
      float bw = w * (0.1 + 0.26 * fb(P / w * 1.4 + sd)), band = 1.0 - smoothstep(0.0, bw, d);
      float fib = 0.72 + 0.28 * vn(P / w * vec2(34.0, 9.0) + sd);
      o.rgb = mix(o.rgb, vec3(0.988, 0.972, 0.962) * o.a, band * 0.94 * fib);
      o.rgb *= 1.0 - 0.13 * exp(-pow((d - bw) / (0.05 * w), 2.0));
    } else {
      rm = smoothstep(-0.015 * w - fw, 0.05 * w + fw, d);
      float rim = exp(-max(d, 0.0) / (0.09 * w));
      o.rgb *= mix(vec3(1.0), vec3(0.8, 0.72, 0.86), rim * 0.85);
      float gr = vn(P / w * 38.0 + sd) - 0.5, bl = smoothstep(0.6, 0.7, fb(P / w * 0.55 + sd * 1.3));
      o.rgb *= 1.0 - 0.08 * gr - 0.5 * bl * (1.0 - bl);
      o *= (0.84 + 0.16 * fb(P / w * 0.7 + sd)) * (1.0 - 0.16 * bl);
    }
  }
  // the reveals (masks over all of it)
  float m = 1.0;
  if (uFxA.x >= 0.0) {      // a wet wash spreading from its seed with a ragged front; at the front the pigment pools darker; behind it, paler while wet
    float dd = length((vUv - uFxA.yz) * vec2(asp, 1.0)), n = fb(vUv * 7.0 + uFxA.yz * 3.0) - 0.5;
    float front = uFxA.x * (1.55 + 0.35 * asp) - dd + n * 0.42;
    m *= smoothstep(0.0, 0.035, front);
    float rim = exp(-front * front / 0.0012) * step(0.0, front);
    o.rgb = mix(o.rgb, o.rgb * vec3(0.72, 0.62, 0.8), uFxA.w * rim * 0.9);
    o.rgb = mix(o.rgb, vec3(1.0, 0.97, 0.98) * o.a, uFxA.w * 0.35 * smoothstep(0.35, 0.0, front) * step(0.0, front));
  }
  if (uFxE.x >= 0.0) { m *= tileM; o.rgb = mix(o.rgb, vec3(0.32, 0.25, 0.47) * o.a, tileFlash * 0.85); }
  if (uFxE.z >= 0.0) {      // iris: a circle from the seed, a thin coral ring riding its edge
    float dd = length((vUv - uFxA.yz) * vec2(asp, 1.0)), R = uFxE.z * (1.2 + 0.4 * asp);
    m *= smoothstep(R, R - 0.006, dd);
    float ring = exp(-pow((dd - R + 0.012) / 0.006, 2.0)) * (1.0 - smoothstep(0.85, 1.0, uFxE.z));
    o = mix(o, vec4(vec3(0.81, 0.44, 0.46), 1.0) * step(dd, R + 0.02), ring * 0.9);
  }
  if (uFxE.w >= 0.0) {      // stripes: twelve bars, each widening from its middle, one after another
    float sx = vUv.x * 12.0, sid = floor(sx), lp = clamp(uFxE.w * 1.6 - sid / 12.0 * 0.6, 0.0, 1.0);
    m *= step(abs(fract(sx) - 0.5), 0.5 * (1.0 - pow(1.0 - lp, 3.0)));
  }
  if (uFxC.y >= 0.0) { m *= smoothstep(sfront + 0.004, sfront - 0.004, sc); o.rgb += vec3(1.0, 0.95, 1.0) * o.a * 0.6 * exp(-pow((sfront - sc) / 0.012, 2.0)); }
  if (uFxD.y >= 0.0) { float g2 = h12(floor(vUv * vec2(90.0 * asp, 90.0))); m *= step(g2, uFxD.y * 1.02); }
  if (uFxD.z >= 0.0) {      // torn: a ragged line crosses; just behind it the paper's white fibres — or, with the angle given + 10, BURNT: an ember edge and a char band
    float cutK = step(19.5, uFxD.w), burnK = step(9.5, uFxD.w) * (1.0 - cutK), aw = uFxD.w - burnK * 10.0 - cutK * 20.0;      // (angle + 20: cut only — a shadow follows the front, no fire, no fibres)
    vec2 td = vec2(cos(aw), sin(aw)); float s2 = dot(vUv - 0.5, td) + 0.5 + (fb(vec2(dot(vUv, vec2(-td.y, td.x)) * 18.0, uTime * 0.6 * burnK)) - 0.5) * (0.06 + 0.04 * burnK);
    float f2 = uFxD.z * 1.15 - 0.05 - s2;
    m *= smoothstep(0.0, 0.004, f2);
    if (burnK > 0.5) {      // (2026-11-24, "卡片的燃烧效果做的精致一些，最好能有真实的火焰燃烧感") scorch → char with glowing veins → a white-hot ember line → flame
      // tongues rising from it over what is left (domain-warped noise, white core → orange → red), sparks lifting, a veil of smoke
      vec2 fq = vec2(dot(vUv, vec2(-td.y, td.x)) * asp, f2); float on = step(0.0, f2);
      float n1 = fb(vec2(fq.x * 9.0, fq.y * 7.0 - uTime * 2.6)), n2 = fb(vec2(fq.x * 17.0 + 3.1, fq.y * 13.0 - uTime * 4.1));
      float scorch = smoothstep(0.24, 0.03, f2), charb = smoothstep(0.075, 0.0, f2) * (0.8 + 0.2 * n2);
      o.rgb = mix(o.rgb, o.rgb * vec3(0.78, 0.56, 0.32), scorch * 0.6);
      o.rgb = mix(o.rgb, vec3(0.05, 0.03, 0.02) * o.a, charb);
      float vein = smoothstep(0.06, 0.0, abs(n2 - 0.5)) * smoothstep(0.075, 0.01, f2) * (0.55 + 0.45 * sin(uTime * 9.0 + fq.x * 30.0 + n1 * 6.0));
      o.rgb += vec3(1.0, 0.36, 0.05) * vein * 1.6 * o.a;
      float flk = 0.7 + 0.3 * sin(uTime * 13.0 + fq.x * 40.0) * (0.5 + n1);
      o.rgb += (vec3(1.0, 0.42, 0.07) * smoothstep(0.03, 0.0, f2) * 1.9 + vec3(1.0, 0.88, 0.55) * smoothstep(0.008, 0.0, f2) * 2.4) * flk * on * o.a;
      float hgt = f2 / (0.15 + 0.13 * n1), tongue = fb(vec2(fq.x * 6.0 + 0.7 * n2, f2 * 5.0 - uTime * 3.4));
      float fm = smoothstep(0.0, 0.28, tongue - hgt * 0.72) * smoothstep(1.35, 0.0, hgt) * on;
      vec3 fc = mix(vec3(0.85, 0.1, 0.02), vec3(1.0, 0.52, 0.08), smoothstep(0.0, 0.45, fm)); fc = mix(fc, vec3(1.0, 0.95, 0.78), smoothstep(0.5, 1.0, fm));
      o.rgb += fc * fm * 1.35 * o.a;
      vec2 sg = vec2(fq.x * 40.0, f2 * 30.0 - uTime * 6.0), sid = floor(sg);
      o.rgb += vec3(1.0, 0.72, 0.32) * step(0.94, h12(sid)) * smoothstep(0.35, 0.0, length(fract(sg) - 0.5)) * smoothstep(0.42, 0.0, f2) * 1.6 * o.a;
      float smk = fb(vec2(fq.x * 4.0, f2 * 3.0 - uTime * 0.8)) * smoothstep(0.05, 0.22, f2) * smoothstep(0.6, 0.22, f2);
      o.rgb = mix(o.rgb, vec3(0.16, 0.14, 0.15) * o.a, smk * 0.35); }
    else if (cutK < 0.5) o.rgb = mix(o.rgb, vec3(0.99, 0.97, 0.96) * o.a, smoothstep(0.022, 0.0, f2) * step(0.0, f2) * 0.9);
  }
  // CARD FUSION (the user, 2026-11-24: "卡面拼接演示原片能不能做一个融合动效…边缘渐渐融合…液态或者辉光"): one plane of the footage across a whole
  // card wall, masked by the union of the cards' windows — at 0 exactly the cards' windows; as it fuses the union is taken smooth so the
  // gaps fill with LIQUID GLASS (the picture refracted through it, a spectral caustic shimmer), a glow running along the merging edges,
  // and it ends as one rounded screen (the outer rectangle). The cards themselves fade out beneath it at the start.
  if (uFuse.w > 0.5) {      // (the user, 2026-11-24: "liquid fusion可以做精致且极具质感和观赏性的liquid glass感") real liquid glass: a thickness
    // field (the liquid in the gaps, a lens bevel round the edge) → normals → the picture refracted through it with RGB dispersion and a
    // touch of frost where it is thick; a sharp specular and a soft sheen, a top-lit fresnel rim, thin-film colour on the steep parts,
    // caustic light inside the liquid, a soft shadow under the lower lip
    vec2 Pp = (vUv - 0.5) * uSize; float fz = clamp(uFuse.x, 0.0, 1.0), kq = mix(0.002, uFuseR.y, smoothstep(0.0, 0.75, fz)), m2 = smoothstep(0.6, 1.0, fz), dF, dX, dY;
    float H0 = glassH(Pp, kq, m2, fz, dF), ee = 0.008, Hx = glassH(Pp + vec2(ee, 0.0), kq, m2, fz, dX), Hy = glassH(Pp + vec2(0.0, ee), kq, m2, fz, dY);
    vec2 gH = vec2(Hx - H0, Hy - H0) / ee;
    float aa = max(fwidth(dF), 1e-4) * 1.2, msk = smoothstep(aa, -aa, dF), ga = smoothstep(0.0, 0.05, H0);
    if (ga > 0.001) {
      vec3 N = normalize(vec3(-gH * 0.05, 1.0)); vec2 off = -gH * 0.04 / uSize * uCrop.zw; float fl = lod + 1.2 * H0;
      vec4 g0 = tap(uv + off, fl); vec3 rc = vec3(tap(uv + off * 0.8, fl).r, g0.g, tap(uv + off * 1.25, fl).b) / max(g0.a, 1e-4) * uCol;
      vec3 Ld = normalize(vec3(-0.35, 0.55, 0.76)), Hv = normalize(Ld + vec3(0.0, 0.0, 1.0)); float nh = max(dot(N, Hv), 0.0);
      float spec = pow(nh, 80.0) * 1.4 + pow(nh, 14.0) * 0.12, fres = pow(1.0 - N.z, 1.4), rim = fres * (0.5 + 0.5 * N.y);
      vec3 film = 0.5 + 0.5 * cos(6.2832 * (N.x * 1.6 + N.y * 1.1 + uTime * 0.08 + vec3(0.0, 0.333, 0.667)));
      float caus = pow(clamp(1.0 - abs(H0 - 0.55) * 3.5, 0.0, 1.0), 3.0) * (0.6 + 0.4 * sin(uTime * 3.0 + Pp.x * 6.0));
      vec3 gcol = rc * (1.04 - 0.25 * max(-N.y, 0.0) * fres * 3.0) + vec3(1.0, 0.98, 1.0) * (spec + rim * 0.6) + film * fres * 0.25 + vec3(1.0, 0.92, 0.98) * caus * 0.14;
      o.rgb = mix(o.rgb, mix(gcol, vec3(0.92, 0.95, 1.0), fres * 0.1) * o.a, ga); }
    float glow = exp(-abs(dF) / (0.015 + 0.03 * fz)) * sin(fz * 3.1416);
    o *= msk; o.rgb += vec3(0.95, 0.92, 1.0) * glow * 0.22;
  }
  if (uWipe.w > 0.0) { float sw = dot(vUv - 0.5, normalize(uWipe.xy)) - uWipe.z; float wm = smoothstep(uWipe.w, -uWipe.w, sw); o.rgb += vec3(1.0, 0.98, 0.94) * exp(-sw * sw / (uWipe.w * uWipe.w * 0.6)) * 1.1 * o.a; o *= wm; }
  if (uScr.x > 0.0) {      // the picture sits INSIDE the frame: an inner shadow cast by the frame, glass over it whose sheen slides as the window turns, fine dust
    vec2 Ps = vUv * uSize, hs = uSize * 0.5 - max(uRound, 1e-4); float ds = length(max(abs(Ps - uSize * 0.5) - hs, 0.0)) - max(uRound, 1e-4);
    float sh = exp(min(ds, 0.0) / uScr.x) * uScr.y; vec2 so = (Ps - uSize * 0.5) / max(uSize.y, 1e-4);
    sh *= 0.75 + 0.5 * smoothstep(-0.2, 0.5, so.y);                                                     // (deeper under the top edge: light from above)
    o.rgb *= 1.0 - sh;
    float gp = dot(vUv - 0.5, vec2(0.62, 0.78)) - (uCard.x * 1.6 - uCard.y * 0.9) * 0.7 - 0.08 * sin(uTime * 0.21);
    float gl = exp(-gp * gp / 0.004) * 0.09 + exp(-gp * gp / 0.05) * 0.035 + smoothstep(0.75, 1.0, vUv.y) * 0.04;
    o.rgb += vec3(1.0, 0.99, 0.97) * gl * uScr.z * o.a;
    float dust = step(0.9975, h12(floor(Ps * 260.0))) * 0.35 + (h12(floor(gl_FragCoord.xy * 0.5)) - 0.5) * 0.02;
    o.rgb += dust * uScr.w * o.a;
  }
  if (uRound > 0.0) { vec2 Pq = vUv * uSize, hb = uSize * 0.5 - uRound; float dq = length(max(abs(Pq - uSize * 0.5) - hb, 0.0)) - uRound, fq = max(fwidth(dq), 1e-5); o *= smoothstep(fq, -fq, dq); }
  o *= m * ek * rm;
  if (uCurl.w > 0.5) {
    if (!gl_FrontFacing) o = vec4(vec3(0.95, 0.925, 0.915) * (0.93 + 0.07 * vn(vUv * 40.0)), 1.0) * c.a * m * ek * rm;
    o.rgb *= 1.0 - 0.28 * (1.0 - cos(vRoll)) * 0.5 * step(0.001, vRoll) + 0.1 * exp(-pow(vRoll - 0.35, 2.0) * 8.0);
  }
  float fk = clamp((vZ - uFog.x) / max(uFog.y, 1e-3), 0.0, 1.0) * (1.0 - uFog.z);
  o.rgb = mix(o.rgb, uFogCol * o.a, fk);
  o *= uAlpha * smoothstep(uLens.w * 0.35, uLens.w, vZ);
  frag = o;
}`;

const quad = (px, py, n = 1) => { const g = new THREE.PlaneGeometry(1, 1, n, n); g.translate(0.5 - px, py - 0.5, 0); return g; };      // pivot (px, py) in the texture's frame: (0, 0) top-left
const GEOMS = new Map();
const geomOf = (pv, n = 1) => { const k = pv.join(',') + ':' + n; if (!GEOMS.has(k)) GEOMS.set(k, quad(pv[0], pv[1], n)); return GEOMS.get(k); };

// ASCII: 16 glyphs in a row, sorted by how much ink each holds (white on clear: drawn in the cell's colour)
let ATLAS_ = null;
const ATLAS = () => ATLAS_ || (ATLAS_ = (() => {
  const G = 64, chars = [...' .\u00b7:,-~=+*o%#&@\u2588'.replace('\u2588', '')].concat([' ', '.', ':', '-', '=', '+', '*', '#', '%', '@', '\u5f61', '\u6faa', '\u6a19', '\u2592', '\u2593', '\u2588']);
  const pool = [...new Set(chars)];
  const cv = document.createElement('canvas'), g = cv.getContext('2d', { willReadFrequently: true }); cv.width = G; cv.height = G;
  const cover = (ch) => { g.clearRect(0, 0, G, G); g.fillStyle = '#fff'; g.font = `${G * 0.82}px Mono, monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, G / 2, G / 2 + 2); const d = g.getImageData(0, 0, G, G).data; let s = 0; for (let i = 3; i < d.length; i += 4) s += d[i]; return s / (G * G * 255); };
  const ranked = pool.map((ch) => [ch, cover(ch)]).sort((a, b) => a[1] - b[1]);
  const pick = Array.from({ length: 16 }, (_, i) => ranked[Math.round((i / 15) * (ranked.length - 1))][0]);
  const at = document.createElement('canvas'); at.width = G * 16; at.height = G; const ag = at.getContext('2d');
  ag.fillStyle = '#fff'; ag.font = `${G * 0.82}px Mono, monospace`; ag.textAlign = 'center'; ag.textBaseline = 'middle';
  pick.forEach((ch, i) => ag.fillText(ch, G * i + G / 2, G / 2 + 2));
  const t = new THREE.CanvasTexture(at); Object.assign(t, { colorSpace: THREE.NoColorSpace, premultiplyAlpha: true, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  return t;
})());
let _w1 = null; const WHITE1 = () => _w1 || (_w1 = Object.assign(new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1), { needsUpdate: true }));
function material(tex) {
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {
      uMap: { value: tex }, uTexSize: { value: new THREE.Vector2(1, 1) }, uMode: { value: 0 }, uCol: { value: new THREE.Color(1, 1, 1) }, uCol2: { value: new THREE.Color(1, 1, 1) },
      uAlpha: { value: 1 }, uLens: { value: new THREE.Vector4(0, 0, 40, 0.1) }, uFog: { value: new THREE.Vector4(1e6, 1, 1, 0) }, uFogCol: { value: new THREE.Color(1, 1, 1) },
      uCrop: { value: new THREE.Vector4(0, 0, 1, 1) }, uBoil: { value: new THREE.Vector2(0, 0) }, uBias: { value: 0 }, uSample: { value: 0 },
      uAtlas: { value: ATLAS() }, uTime: { value: 0 }, uRound: { value: 0 }, uScr: { value: new THREE.Vector4(0, 0, 0, 0) }, uWipe: { value: new THREE.Vector4(0, 1, 0, 0) }, uFx: { value: WHITE1() }, uCard: { value: new THREE.Vector4(0, 0, 0, 0) }, uMetal: { value: new THREE.Color(1, 0.85, 0.5) }, uMat: { value: new THREE.Vector4(0, 6, 0.8, 0.3) }, uSpk: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, 0, 0, 0)) }, uFxA: { value: new THREE.Vector4(-1, 0.5, 0.5, 0) }, uFxB: { value: new THREE.Vector4(0, 0, 40, 0) }, uFxC: { value: new THREE.Vector4(0, -1, 0, 0) }, uFxD: { value: new THREE.Vector4(0, -1, -1, 0) }, uFade: { value: new THREE.Vector4(0, 0, 0, 0) }, uRag: { value: new THREE.Vector4(0, 1, 0, 0) }, uKey: { value: new THREE.Vector4(0, 20, 0.12, 0) }, uKeyCol: { value: new THREE.Color(1, 1, 1) }, uKeyR: { value: new THREE.Vector4(0, 0, 1, 1) }, uCrt: { value: new THREE.Vector4(0, 300, 0.5, 0) }, uLook: { value: new THREE.Vector4(0, 0, 0, 0) }, uFuse: { value: new THREE.Vector4(-1, 1, 1, 0) }, uFuseG: { value: new THREE.Vector4(1, 1, 1, 1) }, uFuseR: { value: new THREE.Vector4(0.1, 0.4, 0.1, 0) }, uLookC: { value: new THREE.Vector4(0, 1, 0, 0.6) }, uCute: { value: new THREE.Vector4(0, 0, 0, 0) }, uFoil: { value: new THREE.Vector4(0.6, 1.2, 0.08, 0.6) }, uCurl: { value: new THREE.Vector4(0, 0, 0.3, 0) }, uFxE: { value: new THREE.Vector4(-1, 8, -1, -1) }, uRagE: { value: new THREE.Vector4(1, 1, 1, 1) }, uSize: { value: new THREE.Vector2(1, 1) }, uWave: { value: new THREE.Vector4(0, 1, 0, 0) }, uWm: { value: WHITE1() }, uWmE: { value: WHITE1() }, uWmOn: { value: 0 },
    },
  });
}

const C = (c) => (Array.isArray(c) ? c : [1, 1, 1]).map((x) => (x > 1.001 ? x / 255 : x));
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---- textures --------------------------------------------------------------------------------------------
// the cards' watermark (GPT-drawn SVG engravings rasterised to alpha): set once by the sets (setCardWatermark), shared by every card face
const WM = { tile: null, emblem: null };
export function setCardWatermark(tile, emblem) { if (tile) { tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.needsUpdate = true; } WM.tile = tile; WM.emblem = emblem; }
export function createKit(W, H) {
  const cache = new Map();
  const finish = (src, w, h) => {
    const tex = src.isTexture ? src : new THREE.Texture(src);
    Object.assign(tex, { colorSpace: THREE.NoColorSpace, premultiplyAlpha: true, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, anisotropy: 8, needsUpdate: true });
    tex.userData = { w, h };
    return tex;
  };
  const img = (url) => {
    if (cache.has(url)) return cache.get(url);
    const p = new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = url; }).then((im) => (im ? finish(im, im.width, im.height) : null));
    cache.set(url, p); return p;
  };
  // a canvas drawn once: draw(ctx, w, h)
  // (res: drawn at res × its design size — vector parts and glyphs for the 1440p master, the user 2026-11-24: "最终成片要用1440p高帧率输出，
  // 现有的图片素材会不会有像素不够的风险？"; draw() still works in design units. Pixel-op canvases keep res 1.)
  const canvas = (key, w, h, draw, res = 1) => {
    if (key && cache.has(key)) return cache.get(key);
    const r = Math.min(res, 4096 / Math.max(w, h, 1)), cv = document.createElement('canvas'); cv.width = Math.ceil(w * r); cv.height = Math.ceil(h * r);
    const g = cv.getContext('2d'); if (r !== 1) g.scale(cv.width / Math.ceil(w), cv.height / Math.ceil(h));
    draw(g, Math.ceil(w), Math.ceil(h));
    const t = finish(cv, cv.width, cv.height); t.userData.res = cv.width / Math.ceil(w); if (key) cache.set(key, t); return t;
  };
  const RES = Number(new URLSearchParams(location.search).get('res')) || (W > 2000 ? 2 : 1);
  const vcanvas = (key, w, h, draw) => canvas(key, w, h, draw, RES);
  // a silhouette: the picture's alpha as white (drawn as a flat ink in mode 1)
  const sil = async (url) => {
    const k = 'sil:' + url; if (cache.has(k)) return cache.get(k);
    const t = await img(url); if (!t) return null; const im = t.image;
    const r = canvas(k, im.width, im.height, (g) => { g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, im.width, im.height); });
    return r;
  };
  // a PV silhouette from a matted drawing: the fill (white: drawn in one ink) and a thin rim of light along the side the light comes from
  // (the alpha minus itself moved toward the light), both cut hard (alpha > 0.5, then a 1 px soft edge)
  const silRim = async (url, o = {}) => {
    const k = 'silrim:' + url + (o.rim || 0.004) + (o.dir || '-1,-1'); if (cache.has(k)) return cache.get(k);
    const t = await img(url); if (!t) return null; const im = t.image, w = im.width, h = im.height;
    const hard = document.createElement('canvas'); hard.width = w; hard.height = h; const hg = hard.getContext('2d', { willReadFrequently: true });
    // (a little blur before the cut closes the specks of wispy hair and smooths the contour; the cut is a short ramp: anti-aliased)
    hg.filter = `blur(${Math.max(1.5, h / 700).toFixed(1)}px)`; hg.drawImage(im, 0, 0); hg.filter = 'none';
    const id = hg.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const a = d[i + 3], k = Math.min(1, Math.max(0, (a - 105) / 50)); d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(255 * k * k * (3 - 2 * k)); }
    hg.putImageData(id, 0, 0);
    const fill = canvas(k + ':fill', w, h, (g) => g.drawImage(hard, 0, 0));
    const [dx, dy] = (o.dir || '-1,-1').split(',').map(Number), r = Math.max(2, (o.rim || 0.004) * h);
    const rim = canvas(k + ':rim', w, h, (g) => { g.drawImage(hard, 0, 0); g.globalCompositeOperation = 'destination-out'; g.drawImage(hard, -dx * r, -dy * r); });
    const out = { fill, rim }; cache.set(k, out); return out;
  };
  // a glyph or a word in white, with its metrics (em: the font size in px; adv: advance; asc/desc in px)
  const text = (str, font, px, o = {}) => {
    const k = ['tx', str, font, px, o.weight || '', o.stroke || 0, o.track || 0].join('|'); if (cache.has(k)) return cache.get(k);
    const m = document.createElement('canvas').getContext('2d'); m.font = `${o.weight || ''} ${px}px ${font}`.trim(); if (o.track) m.letterSpacing = `${o.track * px}px`;
    const mt = m.measureText(str), pad = Math.ceil(px * 0.25), asc = Math.ceil(Math.max(mt.actualBoundingBoxAscent, px * 0.8)), desc = Math.ceil(Math.max(mt.actualBoundingBoxDescent, px * 0.22));
    const left = Math.ceil(Math.max(0, mt.actualBoundingBoxLeft)), w = Math.ceil(Math.max(mt.width, mt.actualBoundingBoxRight + left)) + pad * 2, h = asc + desc + pad * 2;
    const t = canvas(k, w, h, (g) => {
      g.font = m.font; if (o.track) g.letterSpacing = `${o.track * px}px`; g.textBaseline = 'alphabetic';
      if (o.stroke) { g.strokeStyle = '#fff'; g.lineWidth = o.stroke; g.lineJoin = 'round'; g.strokeText(str, pad + left, pad + asc); } else { g.fillStyle = '#fff'; g.fillText(str, pad + left, pad + asc); }
    }, RES);
    t.userData.m = { em: px, adv: mt.width, pad, left, asc, base: pad + asc, w, h };
    return t;
  };
  const forget = (url) => cache.delete(url);
  return { img, canvas, vcanvas, sil, silRim, text, forget, W, H, RES };
}

// ---- the stage -------------------------------------------------------------------------------------------
// sets: [{ t0, t1, planes: [plane], cam(t) → { p, look, up?, roll?, fov, focus, dof, near? }, bg(t) → rgb | { top, bot },
//          fog?(t) → { start, range, keep, col }, extras?: [{ obj (THREE.Object3D), update(t, cam) }] }]
// plane: { tex, w, h (world units; h from the texture's aspect when omitted), pivot: [px, py], mode, col, col2,
//          at(t) → { p: [x, y, z], r: [rx, ry, rz] (radians, YXZ), s (or [sx, sy]), a, col?, col2?, crop?, key?, crt?, foil? } | null,
//          on: [t0, t1], order, boil (texture px), bias, back: { tex, mode, col }, edge: { d, col }, shadow: { d, dx, dy, a, bias },
//          footage(t) → url of the film frame to show at t (frame sequences in materials/frames/…) }
export function createStage(renderer, W, H, kit) {
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(36, W / H, 0.02, 5000);
  cam.matrixAutoUpdate = false; cam.matrixWorldAutoUpdate = false;
  // (2026-11-24, "素材锯齿问题也需要优化": 4× MSAA on the stage's target — plane edges were aliased in single-sample drafts)
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, samples: 4 });
  // the ground: a vertical wash between two colours with a slow unevenness, drawn first (set.bg(t) → rgb or { top, bot })
  const bgScene = new THREE.Scene(), bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  // grounds written from the Midjourney tone references (materials/mj; the user: "shader就用MJ做定调图然后照着MJ的图写shader"), chosen per set by
  // set.ground(t) → { kind, a }: 1 satin ribbons (其の一, mj 5b369a80: translucent lilac / mint / pearl bands, an iridescent edge, no lines),
  // 2 glitter haze (the booth, mj 5c029f29: pink → mint clouds, drifting bokeh, fine glitter), 3 arena night (the live, mj 5e597f6e: violet
  // sky over a magenta horizon glow, haze, soft cyan shafts). Kind 0 (or none) = the old two-colour wash.
  const BGONLY = typeof location !== 'undefined' && new URLSearchParams(location.search).has('bgonly');   // (test: the ground alone)
  const bgMat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, depthTest: false, depthWrite: false, uniforms: { uTop: { value: new THREE.Color() }, uBot: { value: new THREE.Color() }, uT: { value: 0 }, uKind: { value: 0 }, uMix: { value: 1 }, uAsp: { value: W / H }, uPulse: { value: 0 }, uOff: { value: new THREE.Vector2() } },
    vertexShader: 'out vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `precision highp float; uniform vec3 uTop, uBot; uniform float uT, uKind, uMix, uAsp, uPulse; uniform vec2 uOff; in vec2 vUv; out vec4 frag;
      float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      float fb(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
      vec3 irid(float x) { return 0.5 + 0.5 * cos(6.2832 * (x + vec3(0.0, 0.33, 0.67))); }
      vec3 ribbons(vec2 uv, float t) {
        // big satin sheets sweeping down from the upper left (mj 5b369a80): a pale lavender-pearl ground, three wide ribbons that
        // twist (width and lit face follow one continuous twist angle, so no seams), a soft-edged silver highlight riding each,
        // deep lilac in their folds, a thin iridescent film where they turn edge-on
        vec2 P = vec2(uv.x * uAsp, uv.y);
        vec3 c = mix(vec3(0.82, 0.80, 0.91), vec3(0.94, 0.93, 0.98), smoothstep(0.0, 1.0, uv.y * 0.7 + uv.x * 0.3));
        c = mix(c, vec3(0.84, 0.94, 0.91), 0.35 * smoothstep(0.55, 0.0, uv.y) * smoothstep(0.2, 1.0, uv.x));     // a mint breath low right
        for (int i = 0; i < 3; i++) {
          float fi = float(i), x = P.x;
          float yc = 1.05 - 0.32 * fi - 0.42 * x / uAsp + 0.2 * sin(x * (1.3 + 0.2 * fi) + fi * 2.1 + t * (0.06 + 0.02 * fi)) + 0.05 * sin(x * 3.3 + t * 0.15 + fi * 4.0);
          float ang = x * (1.1 + 0.25 * fi) + fi * 1.9 + t * (0.05 + 0.015 * fi), ca = cos(ang), sa = sin(ang);
          float w = (0.1 + 0.05 * fi) * (0.28 + 0.72 * abs(ca));
          float d = (P.y - yc) / w;
          float m = smoothstep(1.0, 0.82, abs(d));
          if (m > 0.0) {
            vec3 base = i == 0 ? vec3(0.80, 0.70, 0.93) : i == 1 ? vec3(0.90, 0.86, 0.97) : vec3(0.70, 0.90, 0.86);
            float shade = 0.72 + 0.28 * ca * (0.6 - 0.4 * d);                     // the face turning to and from the light
            float hl = exp(-pow((d - 0.55 * sa) / 0.22, 2.0)) * (0.35 + 0.45 * abs(ca));   // the satin highlight, sliding across as it twists
            vec3 col = base * shade + vec3(1.0, 0.99, 1.0) * hl * 0.7;
            col = mix(col, base * 0.62, 0.45 * smoothstep(0.3, 1.0, -d) * abs(ca)); // the fold in shadow
            col += irid(x * 0.25 + d * 0.3 + t * 0.02) * 0.1 * (1.0 - abs(ca));
            float shadow = smoothstep(1.6, 0.9, abs(d - 0.3)) * 0.06;               // a soft contact shade under the sheet
            c = mix(c * (1.0 - shadow), col, m * (0.78 + 0.15 * abs(ca)));
          }
        }
        return c;
      }
      vec3 glitter(vec2 uv, float t) {
        // the booth (mj 5c029f29): teal haze on the left, coral-pink on the right, split on a soft diagonal; gold and white glitter
        // dense along the split and thinning out; a few soft bokeh
        vec2 P = vec2(uv.x * uAsp, uv.y);
        float n = fb(P * 1.6 + vec2(t * 0.025, -t * 0.012)), n2 = fb(P * 3.2 - vec2(t * 0.015, 0.0) + 5.0);
        float split = 0.8 * uv.x - 0.9 * uv.y + 0.08 + 0.55 * (n - 0.5) + 0.25 * (n2 - 0.5);
        vec3 teal = vec3(0.42, 0.80, 0.74), coral = vec3(0.98, 0.52, 0.55), pale = vec3(0.98, 0.84, 0.86);
        vec3 c = mix(teal, coral, smoothstep(-0.16, 0.22, split));
        c = mix(c, pale, 0.3 * smoothstep(0.45, 0.8, n2) + 0.25 * exp(-pow(split / 0.12, 2.0)));
        c *= 0.92 + 0.16 * n;
        float band = exp(-pow(split / 0.2, 2.0)) + 0.3 * smoothstep(0.4, 0.95, uv.y);
        for (int L = 0; L < 3; L++) {           // glitter: three sizes, round, twinkling, gold near the split
          float fl = float(L), sc = 95.0 / (1.0 + fl * 0.7); vec2 g = P * sc + vec2(t * 2.0 * (1.0 + fl), -t * 1.0), id = floor(g), f = fract(g) - 0.5;
          float r = h(id), keep = step(1.0 - (0.06 + 0.38 * band) * (1.0 - 0.3 * fl), r);
          float dot1 = smoothstep(0.32, 0.0, length(f - (vec2(h(id + 1.3), h(id + 2.7)) - 0.5) * 0.4));
          float tw = 0.45 + 0.55 * sin(t * (2.0 + 5.0 * h(id + 4.0)) + r * 60.0);
          vec3 gc = mix(vec3(1.0, 0.98, 0.94), vec3(1.0, 0.84, 0.48), step(0.5, h(id + 9.0)) * smoothstep(0.3, 0.0, abs(split)));
          c = mix(c, gc, keep * dot1 * tw * (0.9 - 0.2 * fl));
          if (L == 2) { vec2 fq = f - (vec2(h(id + 1.3), h(id + 2.7)) - 0.5) * 0.4; float gl = step(0.985 - 0.02 * band, r) * tw;     // a few four-point glints
            c += vec3(1.0, 0.97, 0.9) * gl * (exp(-abs(fq.x) * 40.0) * exp(-abs(fq.y) * 4.0) + exp(-abs(fq.y) * 40.0) * exp(-abs(fq.x) * 4.0)) * 0.5; }
        }
        { vec2 g = P * 4.5 + vec2(t * 0.06, t * 0.02), id = floor(g), f = fract(g) - 0.5;   // a few soft bokeh
          float r = 0.16 + 0.14 * h(id + 7.0); vec2 o = (vec2(h(id + 1.1), h(id + 2.2)) - 0.5) * 0.5; float dd = length(f - o);
          c = mix(c, vec3(1.0, 0.97, 0.95), smoothstep(r, r - 0.06, dd) * step(0.8, h(id + 3.1)) * 0.28); }
        return c;
      }
      // ---- the arena (mj 5e597f6e): ABSTRACT only — the user, 2026-11-24: "shader还是不要做这种具体的场景吧，包含建筑的用shader写太复杂了";
      // night gradient, a horizon glow, haze, sweeping beams, round stars, soft bokeh of penlight colour (no buildings, no literal crowd)
      float aa(float d) { float w = fwidth(d) * 0.9 + 1e-5; return smoothstep(w, -w, d); }
      float star(vec2 P, float sc, float t) { vec2 g = P * sc, id = floor(g), f = fract(g) - 0.5 - (vec2(h(id + 0.3), h(id + 0.9)) - 0.5) * 0.7; float r = h(id + 2.1);
        float b = step(0.93, r) * (0.4 + 0.6 * h(id + 4.0)) * (0.6 + 0.4 * sin(t * (1.5 + 3.0 * h(id + 5.0)) + r * 40.0)); float px = fwidth(g.x);
        return b * smoothstep(px * 2.2, 0.0, length(f)) + b * 0.25 * smoothstep(px * 7.0, 0.0, length(f)); }
      vec3 night(vec2 uv, float t) {      // kind 4: the Tsukuyomi night (cold open, scroll, interlude) — abstract, and rich (the user, 2026-11-24:
        // "图二的大背景也要做精致的shader"): an indigo → violet sky with a rose-lilac glow low down, a milky way across it with dark dust lanes
        // and a dense field of its own stars, two layers of nebula drifting at their own depths, three layers of stars (the brightest
        // with diffraction spikes and colour), a moon with a chromatic halo and soft rays, now and then a shooting star, a dither
        vec2 P = vec2(uv.x * uAsp, uv.y);
        vec3 c = mix(vec3(0.2, 0.11, 0.36), vec3(0.025, 0.025, 0.1), smoothstep(0.0, 1.0, uv.y));
        c += vec3(0.75, 0.42, 0.85) * exp(-pow((uv.y - 0.06) / 0.22, 2.0)) * 0.2 + vec3(0.35, 0.5, 0.95) * exp(-pow((uv.y - 0.3) / 0.3, 2.0)) * 0.05;
        // the milky way: a band across the sky, its glow, its dust lanes, its own crowd of faint stars
        vec2 bd = normalize(vec2(1.0, 0.42)); float across = dot(P - vec2(0.5 * uAsp, 0.5), vec2(-bd.y, bd.x)), along = dot(P, bd);
        float band = exp(-across * across / 0.03), bn = fb(vec2(along * 3.0, across * 9.0) + t * 0.01), lane = smoothstep(0.45, 0.75, fb(vec2(along * 6.0 + 3.0, across * 22.0)));
        c += mix(vec3(0.55, 0.42, 0.9), vec3(0.95, 0.65, 0.85), bn) * band * (0.1 + 0.16 * bn) * (1.0 - 0.75 * lane * smoothstep(0.02, 0.0, abs(across) - 0.03));
        c += vec3(1.0) * star(P * 1.4 + 9.0, 120.0, t) * band * 0.9;
        // nebula, two depths (the far one drifts slower)
        float n1 = fb(P * 1.7 + vec2(t * 0.008, -t * 0.004)), n2 = fb(P * 3.4 - vec2(t * 0.015, t * 0.006) + 4.0);
        c += vec3(0.85, 0.35, 0.75) * smoothstep(0.55, 0.85, n1) * 0.11 + vec3(0.3, 0.55, 1.0) * smoothstep(0.62, 0.9, n2) * 0.07 * smoothstep(0.15, 0.7, uv.y);
        // stars: fine, medium, and the bright few with spikes and colour
        c += vec3(1.0) * (star(P, 80.0, t) * 0.8 + star(P * 1.6 + 2.0, 70.0, t) * 0.6) * smoothstep(0.08, 0.45, uv.y);
        vec2 sg = P * 9.0, id = floor(sg), f = fract(sg) - 0.5 - (vec2(h(id + 1.3), h(id + 7.7)) - 0.5) * 0.6; float pick = h(id + 3.1);
        if (pick > 0.9) { float b = (0.5 + 0.5 * sin(t * (0.8 + 2.0 * h(id + 9.0)) + pick * 50.0)), px = fwidth(sg.x);
          float spk = exp(-abs(f.y) / (px * 1.2)) * exp(-abs(f.x) * 9.0) + exp(-abs(f.x) / (px * 1.2)) * exp(-abs(f.y) * 9.0);
          vec3 sc = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.85, 0.95), h(id + 5.5));
          c += sc * (spk * 0.55 + smoothstep(px * 3.0, 0.0, length(f)) * 1.1 + exp(-dot(f, f) / 0.004) * 0.3) * b * smoothstep(0.12, 0.5, uv.y); }
        // the moon: a disc, a chromatic halo ring, soft rays
        vec2 m = vec2(0.8 * uAsp, 0.76); vec2 dmv = P - m; float dm = length(dmv);
        c += vec3(1.0, 0.97, 0.92) * smoothstep(0.034, 0.03, dm) * 0.9 + vec3(1.0, 0.96, 0.9) * exp(-dm * dm / 0.004) * 0.45 + vec3(0.75, 0.65, 1.0) * exp(-dm * dm / 0.06) * 0.14;
        c += vec3(exp(-pow((dm - 0.135) / 0.008, 2.0)), exp(-pow((dm - 0.128) / 0.008, 2.0)), exp(-pow((dm - 0.121) / 0.008, 2.0))) * 0.06;
        float ma = atan(dmv.y, dmv.x); c += vec3(0.9, 0.85, 1.0) * pow(abs(sin(ma * 7.0 + t * 0.05)), 30.0) * exp(-dm / 0.18) * 0.06;
        // a shooting star every few bars
        float cyc = 9.0, k = floor(t / cyc), sl = fract(t / cyc) / 0.07;
        if (sl < 1.0) { vec2 sdir = normalize(vec2(-1.0, -0.45)), hd = vec2((0.3 + 0.6 * h(vec2(k, 1.0))) * uAsp, 0.85 - 0.2 * h(vec2(k, 2.0))) + sdir * sl * 0.5, rel = P - hd;
          float al = dot(rel, -sdir), pp = abs(dot(rel, vec2(-sdir.y, sdir.x)));
          c += vec3(0.9, 0.95, 1.0) * (step(0.0, al) * exp(-al / 0.08) * exp(-pp * pp / 0.000004) + exp(-dot(rel, rel) / 0.00002)) * (1.0 - sl) * 0.8; }
        c += (h(gl_FragCoord.xy + t) - 0.5) / 255.0 * 1.5;      // (dither: no banding in the dark gradient)
        return c;
      }
      vec3 chrome(vec2 uv, float t) {      // kind 5: acid chrome (verse 2, 火鼠の皮衣 · PLAN-v2: 抽象液态金属, acid lime + electric blue + fire orange) — liquid metal
        // folded by a double domain warp, sharp reflection bands, the three colours living only in its highlights, a specular glint
        vec2 P = vec2(uv.x * uAsp, uv.y);
        vec2 q = vec2(fb(P * 1.2 + vec2(0.0, t * 0.05)), fb(P * 1.2 + vec2(5.2, -t * 0.04)));
        vec2 r = vec2(fb(P * 1.6 + 4.0 * q + vec2(1.7, 9.2) + t * 0.03), fb(P * 1.6 + 4.0 * q + vec2(8.3, 2.8) - t * 0.025));
        float f = fb(P * 1.4 + 3.6 * r), band = 0.5 + 0.5 * sin(f * 16.0 + t * 0.5);
        vec3 env = mix(vec3(0.2, 0.5, 1.0), vec3(0.72, 1.0, 0.22), smoothstep(0.35, 0.7, r.x)); env = mix(env, vec3(1.0, 0.45, 0.12), smoothstep(0.55, 0.85, r.y));
        vec3 c = mix(vec3(0.04, 0.04, 0.07), vec3(0.55, 0.57, 0.66), pow(band, 3.0));
        c = mix(c, env * 1.1, 0.42 * smoothstep(0.45, 0.95, band) * smoothstep(0.3, 0.6, f));
        c += vec3(1.0, 0.98, 0.95) * pow(band, 30.0) * 0.55 + env * pow(band, 8.0) * 0.12;
        c *= 0.48 + 0.3 * uv.y; c += (h(gl_FragCoord.xy + t) - 0.5) / 255.0 * 1.5;      // (held down: it is a ground, not the show)
        return c;
      }
      vec3 dream(vec2 uv, float t) {      // kind 6: the runway's dream (2026-11-24, "KAGUYA段落的背景shader可以做的更梦幻，以淡粉色和淡黄色为fusion色调基调为主，
        // 现有的有些灰暗了"): pale pink and butter yellow folded into each other like silk by a slow double warp, pearl crests where the
        // folds turn to the light, a soft radiance and slow rays from the runway's far end, cotton clouds low down, twinkles
        vec2 P = vec2(uv.x * uAsp, uv.y);
        vec3 cream = vec3(1.0, 0.93, 0.78), pink = vec3(0.98, 0.77, 0.86), rose = vec3(0.92, 0.66, 0.80), lilac = vec3(0.83, 0.75, 0.95);
        vec3 c = mix(rose, pink, smoothstep(0.0, 0.42, uv.y)); c = mix(c, cream, smoothstep(0.45, 1.0, uv.y));
        c = mix(c, lilac, 0.32 * smoothstep(0.55, 1.05, length((uv - 0.5) * vec2(1.7, 1.25))));
        vec2 q = vec2(fb(P * 0.9 + vec2(0.0, t * 0.03)), fb(P * 0.9 + vec2(5.2, -t * 0.025)));
        vec2 r = vec2(fb(P * 1.3 + 3.0 * q + vec2(1.7, 9.2) + t * 0.02), fb(P * 1.3 + 3.0 * q + vec2(8.3, 2.8) - t * 0.018));
        float f = fb(P * 1.1 + 2.8 * r);
        vec3 fus = mix(vec3(1.0, 0.70, 0.83), vec3(1.0, 0.92, 0.62), smoothstep(0.32, 0.68, r.x));
        fus = mix(fus, vec3(1.0, 0.97, 0.93), 0.45 * smoothstep(0.62, 0.86, f));
        c = mix(c, fus, 0.58);
        float band = 0.5 + 0.5 * sin(f * 11.0 + t * 0.35);
        c = mix(c, c * 0.9, 0.5 * pow(1.0 - band, 4.0) * smoothstep(0.35, 0.6, f));                       // (the fold's shade)
        c += vec3(1.0, 0.98, 0.95) * pow(band, 14.0) * 0.2 + irid(f * 1.5 + r.y + t * 0.02) * pow(band, 5.0) * smoothstep(0.4, 0.8, f) * 0.07;
        vec2 vp = vec2(0.5 * uAsp, 0.62), dv = P - vp; float dr = length(dv), ang = atan(dv.y, dv.x);
        c += vec3(1.0, 0.95, 0.86) * exp(-dr * dr / 0.05) * 0.2;
        c += vec3(1.0, 0.93, 0.9) * pow(0.5 + 0.5 * sin(ang * 9.0 + t * 0.1 + 2.0 * fb(vec2(ang * 2.0, t * 0.05))), 6.0) * exp(-dr / 0.5) * 0.07;
        float cl = fb(vec2(P.x * 1.3 + t * 0.02, P.y * 3.0)), cl2 = fb(vec2(P.x * 2.1 - t * 0.015, P.y * 4.5) + 3.0);
        c = mix(c, vec3(1.0, 0.92, 0.95), smoothstep(0.5, 0.74, cl) * smoothstep(0.36, 0.04, uv.y) * 0.5);
        c = mix(c, vec3(1.0, 0.96, 0.88), smoothstep(0.55, 0.78, cl2) * smoothstep(0.22, 0.0, uv.y) * 0.4);
        c += vec3(1.0, 0.97, 0.9) * (star(P, 70.0, t) * 0.55 + star(P * 1.5 + 4.0, 60.0, t) * 0.4) * smoothstep(0.25, 0.7, uv.y);
        c *= 0.93; c += (h(gl_FragCoord.xy + t) - 0.5) / 255.0 * 1.5;
        return c;
      }
      vec3 arena(vec2 uv, float t) {
        vec2 P = vec2(uv.x * uAsp, uv.y); float sx = P.x - 0.5 * uAsp, hzn = 0.3;
        vec3 c = mix(vec3(0.22, 0.12, 0.38), vec3(0.04, 0.04, 0.13), smoothstep(0.22, 0.98, uv.y));
        c += vec3(0.85, 0.3, 0.8) * exp(-pow((uv.y - hzn) / 0.09, 2.0)) * 0.32 * (0.75 + 0.5 * fb(vec2(P.x * 3.0 + t * 0.05, 2.0))) + vec3(0.3, 0.35, 0.9) * exp(-pow((uv.y - hzn - 0.08) / 0.2, 2.0)) * 0.12;
        c += vec3(1.0) * (star(P, 60.0, t) + star(P * 1.7 + 3.0, 60.0, t) * 0.6) * smoothstep(0.42, 0.9, uv.y);
        for (int i = 0; i < 7; i++) {                                          // beams from rigs over the far stage, sweeping, some crossing
          float fi = float(i), side = mod(fi, 2.0) * 2.0 - 1.0;
          vec2 o = vec2(uAsp * (0.5 + side * (0.03 + 0.07 * fi)), hzn + 0.012 + 0.03 * h(vec2(fi, 2.0)));
          float ang = side * (0.15 + 0.5 * h(vec2(fi, 7.0))) * (i == 2 || i == 5 ? -1.0 : 1.0) + 0.25 * sin(t * (0.3 + 0.07 * fi) + fi * 1.7);
          vec2 q = P - o; float along = q.x * sin(ang) + q.y * cos(ang), across = q.x * cos(ang) - q.y * sin(ang);
          float beam = exp(-pow(across / (0.004 + along * 0.07), 2.0)) * smoothstep(0.0, 0.02, along) * exp(-along * 1.3);
          vec3 bc = mod(fi, 3.0) < 1.0 ? vec3(0.35, 0.95, 1.0) : mod(fi, 3.0) < 2.0 ? vec3(0.35, 0.45, 1.0) : vec3(1.0, 0.35, 0.9);
          c += bc * beam * (0.38 + 0.3 * uPulse) * (0.7 + 0.6 * fb(vec2(along * 6.0 - t * 0.4, across * 30.0)));
          c += bc * exp(-dot(q, q) / 0.00012) * 0.7;
        }
        // haze low down
        float haze = fb(P * vec2(1.4, 5.0) + vec2(t * 0.05, 0.0));
        c = mix(c, vec3(0.56, 0.3, 0.72), smoothstep(hzn + 0.02, hzn - 0.12, uv.y) * 0.35 * (0.5 + haze));
        // below the glow: soft out-of-focus lights in penlight colours, drifting and breathing on the beat (bokeh, not a crowd)
        for (int L = 0; L < 3; L++) { float fl = float(L), cs = 0.05 + 0.035 * fl;
          vec2 g = vec2(sx + t * 0.012 * (fl + 1.0) * (mod(fl, 2.0) * 2.0 - 1.0), uv.y + 0.004 * sin(t * 0.6 + fl)) / cs, id = floor(g), f = fract(g) - 0.5 - (vec2(h(id + 0.7 + fl), h(id + 1.9)) - 0.5) * 0.5;
          float on = step(0.55, h(id + fl * 3.0)) * smoothstep(hzn + 0.06, hzn - 0.12, uv.y), r = 0.16 + 0.14 * h(id + 2.3);
          vec3 pc = mix(vec3(1.0, 0.42, 0.78), vec3(0.75, 0.9, 1.0), step(0.75, h(id + 5.0)));
          float disc = smoothstep(r, r - 0.05, length(f)) * (0.7 + 0.3 * smoothstep(r - 0.08, r - 0.01, length(f)));
          c += pc * on * disc * (0.16 + 0.1 * uPulse) * (1.0 - 0.25 * fl); }
        return c;
      }
      // DEPTH LAYERS over a ground (the user, 2026-11-24: "背景的shader可以再叠加几层，给背景shader也做的有精致的层次感"): far cloud veils, a
      // slow light shaft, light curtains, mid bokeh (hexagonal aperture, chromatic rim), near dust that twinkles, a low mist — each layer
      // sliding at its own rate against the camera's travel, tinted by the ground's own palette (A, B, C)
      vec3 scr(vec3 c, vec3 a) { return 1.0 - (1.0 - c) * (1.0 - clamp(a, 0.0, 1.0)); }
      vec3 depthLayers(vec2 uv, vec3 c, float t, vec3 A, vec3 B, vec3 C, float k) {
        vec2 P = vec2(uv.x * uAsp, uv.y), off = uOff * vec2(uAsp, 1.0);
        vec2 P1 = P + off * 0.6; float v1 = fb(P1 * 1.2 + vec2(t * 0.012, t * 0.004)), v2 = fb(P1 * 2.4 - vec2(t * 0.02, -t * 0.006) + 4.0);
        c = scr(c, A * smoothstep(0.45, 0.85, v1) * 0.16 * k + B * smoothstep(0.5, 0.9, v2) * 0.1 * k);
        vec2 P2 = P + off * 1.0; float sweep = 0.3 * sin(t * 0.11) - 0.35;
        float sh = exp(-pow((P2.x - uAsp * 0.25 + (1.0 - P2.y) * 0.55 + sweep) / 0.22, 2.0)) * smoothstep(0.0, 1.0, P2.y);
        c = scr(c, mix(A, C, 0.5) * sh * 0.09 * k);
        float cw = fb(vec2(P2.x * 2.2 + t * 0.03, P2.y * 0.6)); float cur = pow(0.5 + 0.5 * sin(P2.x * 9.0 + cw * 5.0 + t * 0.15), 6.0) * smoothstep(0.2, 0.75, P2.y) * smoothstep(1.05, 0.6, P2.y);
        c = scr(c, mix(B, A, cw) * cur * 0.08 * k);
        for (int L = 0; L < 3; L++) { float fl = float(L), cs = 0.16 - 0.04 * fl; vec2 P3 = P + off * (1.6 + fl * 0.6) + vec2(t * 0.004 * (fl + 1.0), t * (0.006 + 0.004 * fl));
          vec2 g = P3 / cs, id = floor(g), f = fract(g) - 0.5 - (vec2(h(id + 1.1 + fl), h(id + 2.3)) - 0.5) * 0.45;
          float on = step(0.88 - 0.04 * fl, h(id + 5.0 + fl * 2.0)), r = 0.12 + 0.22 * h(id + 7.0);
          vec2 q = abs(f); float hx = max(q.x * 0.866 + q.y * 0.5, q.y);
          float disc = smoothstep(r, r - 0.07, hx) * on, rim = smoothstep(r - 0.05, r - 0.015, hx) * disc;
          vec3 bc = h(id + 9.0) < 0.4 ? A : h(id + 9.0) < 0.75 ? B : C;
          c = scr(c, (bc * disc * (0.06 + 0.035 * uPulse) + bc * rim * 0.04) * (1.0 - 0.25 * fl) * k * (0.6 + 0.4 * sin(t * 0.7 + h(id) * 6.3))); }
        vec2 P4 = P + off * 2.8 + vec2(t * 0.01, t * 0.02); vec2 gd = P4 * 70.0, idd = floor(gd);
        float sp = step(0.986, h(idd)) * smoothstep(0.3, 0.0, length(fract(gd) - 0.5)) * (0.4 + 0.6 * sin(t * (2.0 + 4.0 * h(idd + 3.0)) + h(idd) * 40.0));
        c += mix(C, vec3(1.0), 0.6) * max(sp, 0.0) * 0.5 * k;
        float mist = fb(vec2(P.x * 1.5 + t * 0.03, P.y * 4.0) + off * 1.2) * smoothstep(0.35, 0.0, uv.y);
        c = scr(c, mix(A, B, 0.5) * mist * 0.12 * k);
        return c;
      }
      void main() {
        float k = smoothstep(0.0, 1.0, vUv.y + 0.08 * (vn(vUv * vec2(2.5, 1.6) + uT * 0.05) - 0.5)); vec3 wash = mix(uBot, uTop, k);
        wash *= 1.0 + 0.035 * (vn(vUv * vec2(5.0, 3.0) + 3.0) - 0.5) + 0.02 * (vn(vUv * 14.0 + 7.0) - 0.5);
        vec2 U = vUv + uOff;      // a little parallax: the far ground slides against the camera's travel
        vec3 g = uKind < 0.5 ? wash : uKind < 1.5 ? ribbons(U, uT) : uKind < 2.5 ? glitter(U, uT) : uKind < 3.5 ? arena(U, uT) : uKind < 4.5 ? night(U, uT) : uKind < 5.5 ? chrome(U, uT) : dream(U, uT);
        if (uKind > 1.5 && uKind < 2.5) g = depthLayers(vUv, g, uT, vec3(1.0, 0.72, 0.84), vec3(0.62, 0.95, 0.88), vec3(1.0, 0.92, 0.7), 0.8);
        else if (uKind > 2.5 && uKind < 3.5) g = depthLayers(vUv, g, uT, vec3(0.72, 0.36, 0.98), vec3(0.32, 0.85, 1.0), vec3(1.0, 0.42, 0.85), 1.0);
        else if (uKind > 3.5 && uKind < 4.5) g = depthLayers(vUv, g, uT, vec3(0.45, 0.42, 0.98), vec3(0.98, 0.8, 0.52), vec3(0.62, 0.85, 1.0), 1.0);
        else if (uKind > 4.5 && uKind < 5.5) g = depthLayers(vUv, g, uT, vec3(0.7, 1.0, 0.38), vec3(0.32, 0.58, 1.0), vec3(1.0, 0.55, 0.25), 0.7);
        else if (uKind > 5.5) g = depthLayers(vUv, g, uT, vec3(1.0, 0.72, 0.86), vec3(1.0, 0.9, 0.6), vec3(0.82, 0.72, 1.0), 0.75);
        frag = vec4(mix(wash, g, uMix), 1.0); }` });
  bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat));
  // a rounded rectangle's side band (w × h, corner radius r, the plane's pivot), from z = 0 back to z = −1: outward normals, u = along the
  // outline (0…1), v = across the thickness (0 front … 1 back)
  function rimGeom(w, h, r, pv) {
    r = Math.max(0, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4)); const pts = [], nrm = [], ox = (0.5 - pv[0]) * w, oy = (pv[1] - 0.5) * h, SEG = r > 0 ? 10 : 1;
    for (const [cx, cy, a0] of [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, Math.PI / 2], [-w / 2 + r, -h / 2 + r, Math.PI], [w / 2 - r, -h / 2 + r, Math.PI * 1.5]])
      for (let k = 0; k <= SEG; k++) { const a = a0 + (k / SEG) * Math.PI / 2; pts.push([cx + Math.cos(a) * r + ox, cy + Math.sin(a) * r + oy]); nrm.push([Math.cos(a), Math.sin(a)]); }
    const n = pts.length, L = [0]; for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; L.push(L[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
    const pos = [], no = [], uv = [], idx = [];
    for (let i = 0; i < n; i++) { const j = (i + 1) % n, A = pts[i], B = pts[j], b0 = pos.length / 3, ua = L[i] / L[n], ub = L[i + 1] / L[n];
      for (const [P_, N_, u, z] of [[A, nrm[i], ua, 0], [A, nrm[i], ua, -1], [B, nrm[j], ub, 0], [B, nrm[j], ub, -1]]) { pos.push(P_[0], P_[1], z); no.push(N_[0], N_[1], 0); uv.push(u, -z); }
      idx.push(b0, b0 + 1, b0 + 2, b0 + 2, b0 + 1, b0 + 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(no, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.userData.per = L[n]; return g;
  }
  // the band's surface: kind 1 = card stock in prism foil (a rainbow that turns with the view and runs along the edge, a sharp specular,
  // bright cut lips at both faces); kind 0 = a plain lit colour (a plate's side)
  function rimMat(kind, col, foil) {
    return new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, transparent: true, depthTest: false, depthWrite: false, side: THREE.FrontSide,
      uniforms: { uCol: { value: new THREE.Color(...col) }, uA: { value: 1 }, uT: { value: 0 }, uKind: { value: kind }, uFoil: { value: foil } },
      vertexShader: `out vec3 vN; out vec3 vV; out vec2 vR; void main() { vR = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `precision highp float; uniform vec3 uCol; uniform float uA, uT, uKind, uFoil; in vec3 vN; in vec3 vV; in vec2 vR; out vec4 frag;
        void main() { if (any(isnan(vN)) || any(isinf(vN))) discard; vec3 N = vN / max(length(vN), 1e-6), V = vV / max(length(vV), 1e-6); float ndv = clamp(abs(dot(N, V)), 0.0, 1.0);
          vec3 Lt = normalize(vec3(-0.45, 0.7, 0.55)), H = normalize(Lt + V); float dif = 0.6 + 0.4 * max(dot(N, Lt), 0.0), sp = pow(max(dot(N, H), 0.0), 70.0);
          vec3 c;
          if (uKind > 0.5) {
            vec3 ir = 0.5 + 0.5 * cos(6.2832 * (vec3(0.0, 0.33, 0.67) + ndv * 1.4 + vR.x * 6.0 + vR.y * 0.25 + uT * 0.05));
            vec3 base = uCol * (0.62 + 0.38 * ndv);
            c = mix(base, ir * 0.85 + 0.2, 0.55 * uFoil) * dif;
            c += vec3(1.0) * sp * 0.9 + ir * pow(1.0 - ndv, 2.5) * 0.35 * uFoil;
            float lip = exp(-vR.y / 0.08) + exp(-(1.0 - vR.y) / 0.08); c += vec3(1.0, 0.97, 0.93) * lip * 0.28;
          } else { c = uCol * dif * (0.8 + 0.2 * ndv) + vec3(1.0) * sp * 0.25; }
          frag = vec4(clamp(c, 0.0, 4.0), uA); }` });
  }
  const sets = [];
  let nid = 0;
  const meshOf = (tex, pv, n = 1) => { const m = new THREE.Mesh(geomOf(pv, n), material(tex)); m.matrixAutoUpdate = false; m.frustumCulled = false; m.visible = false; scene.add(m); return m; };
  const BLANK = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1); BLANK.needsUpdate = true; BLANK.userData = { w: 16, h: 9 };
  function add(set) {
    set.planes = set.planes.flat(6);      // (a set may hand over nested lists of planes: they are all planes)
    for (const P of set.planes) {
      const tex = P.footage ? BLANK : P.tex; if (!tex) { P.skip = true; continue; }
      const tw = P.footage ? 16 : tex.userData?.w || 1, th = P.footage ? 9 : tex.userData?.h || 1;
      P.id = nid++; P.w = P.w ?? (P.h ? (P.h * tw) / th : 1); P.h = P.h ?? (P.w * th) / tw; P.pivot = P.pivot || [0.5, 0.5];
      P.mesh = meshOf(tex, P.pivot, P.curl ? 72 : P.mode === 13 ? 40 : 1); P.mesh.material.uniforms.uTexSize.value.set(P.footage ? 1280 : tw, P.footage ? 720 : th); P.mesh.renderOrder = P.order ?? 0;
      if (P.single) P.mesh.material.side = THREE.FrontSide;      // (one-sided: a card's upper layers vanish when it turns away)
      if (P.back) { const bt = P.back.tex; P.backMesh = meshOf(bt, [1 - P.pivot[0], P.pivot[1]]); P.backMesh.material.uniforms.uTexSize.value.set(bt.userData?.w || 1, bt.userData?.h || 1); P.backMesh.material.side = THREE.FrontSide; P.mesh.material.side = THREE.FrontSide; }
      // (the edge is the box's four SIDES only: its front face filled every window cut in a frame with flat colour — "取景框没有画面")
      const sides = (g) => { g.setIndex(Array.from(g.index.array.slice(0, 24))); g.clearGroups(); return g; };
      // (2026-11-24, "卡的侧面还需要优化，现在侧面存在分层穿帮" + "取景框的素材做圆角处理"): a plate's thickness is ONE solid band round its rounded
      // outline (P.rim: prismatic card stock; P.edge: a lit flat colour) — no stacked slices, no square box poking out of rounded corners
      if (P.edge || P.rim) { const R = P.rim || P.edge, rr_ = R.r ?? (R.rk ?? 0) * P.h;
        const e = new THREE.Mesh(rimGeom(P.w * 0.998, P.h * 0.998, rr_, P.pivot), rimMat(P.rim ? 1 : 0, C(R.col || (P.rim ? [236, 230, 255] : [214, 206, 192])), P.rim ? R.foil ?? 1 : 0));
        e.matrixAutoUpdate = false; e.frustumCulled = false; e.visible = false; scene.add(e); P.edgeMesh = e; }
      if (P.shadow) P.shadowMesh = meshOf(tex, P.pivot, P.curl ? 72 : P.mode === 13 ? 40 : 1);
    }
    for (const X of set.extras || []) { X.obj.visible = false; scene.add(X.obj); }
    sets.push(set);
  }
  const setAt = (t) => sets.find((s) => t >= s.t0 && t < s.t1) || null;
  // footage: the frames a moment needs are loaded before it is drawn (prepare), kept in a small cache
  const frameTex = new Map();
  const want = (t) => { const s = setAt(t); if (!s) return []; const out = [];
    for (const P of s.planes) if (P.footage && !P.skip && (!P.on || (t >= P.on[0] && t < P.on[1]))) { const u = P.footage(t); if (u) out.push(u); } return out; };
  async function prepare(times) {
    const urls = [...new Set(times.flatMap(want))];
    await Promise.all(urls.map((u) => kit.img(u).then((tx) => { if (tx) frameTex.set(u, tx); })));
    if (frameTex.size > 150) { const keep = new Set(urls); for (const k of [...frameTex.keys()].slice(0, frameTex.size - 100)) if (!keep.has(k)) { frameTex.get(k)?.dispose?.(); frameTex.delete(k); kit.forget(k); } }
  }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3(), OFF = new THREE.Matrix4();
  const lookM = new THREE.Matrix4(), UP = new THREE.Vector3(), EYE = new THREE.Vector3(), TGT = new THREE.Vector3(), CR = new THREE.Vector3(), CU = new THREE.Vector3(), NN = new THREE.Vector3();
  function uni(m, P, st, lens, fog, sample, t) {
    const u = m.material.uniforms;
    u.uMode.value = st.mode ?? P.mode ?? 0;
    u.uCol.value.setRGB(...C(st.col ?? P.col ?? [1, 1, 1])); u.uCol2.value.setRGB(...C(st.col2 ?? P.col2 ?? [1, 1, 1]));
    u.uAlpha.value = st.a ?? 1;
    u.uLens.value.set(lens.x, P.sharp ? 0 : lens.y, lens.z, P.near ?? lens.w);
    u.uFog.value.copy(fog.v); u.uFogCol.value.copy(fog.c);
    const cr = st.crop || P.crop || [0, 0, 1, 1]; u.uCrop.value.set(cr[0], 1 - cr[1] - cr[3], cr[2], cr[3]);      // (crops are given from the top-left, as the picture is seen; textures are bottom-up)
    const bf = Math.floor(t * 12), b = P.boil || 0; u.uBoil.value.set(b ? (hash(bf * 1.3 + P.id) - 0.5) * 2 * b : 0, b ? (hash(bf * 2.7 + P.id * 3.1) - 0.5) * 2 * b : 0);
    u.uBias.value = st.bias ?? P.bias ?? 0; u.uSample.value = sample;
    u.uTime.value = t;
    const rg = st.rag || P.rag;
    if (rg) { u.uRag.value.set(rg.kind === 'wash' ? 2 : 1, rg.w ?? 0.4, rg.seed ?? P.id * 0.37, 0); const e = rg.e || [1, 1, 1, 1]; u.uRagE.value.set(e[0], e[1], e[2], e[3]); } else u.uRag.value.set(0, 1, 0, 0);
    u.uSize.value.set(...(P._sz || [1, 1])); u.uRound.value = st.round ?? P.round ?? 0; const wp = st.wipe; if (wp) u.uWipe.value.set(wp.dir[0], wp.dir[1], wp.pos, wp.soft ?? 0.04); else u.uWipe.value.set(0, 1, 0, 0);
    const sc = st.screen ?? P.screen ?? (P.footage && (st.round ?? P.round) ? {} : null);
    if (sc) { NN.set(0, 0, 1).applyQuaternion(Q); u.uCard.value.set(NN.dot(CR), NN.dot(CU), 0, 1); const sz = P._sz || [1, 1]; u.uScr.value.set(sc.w ?? Math.min(sz[0], sz[1]) * 0.05, sc.k ?? 0.42, sc.glass ?? 1, sc.dust ?? 1); } else u.uScr.value.set(0, 0, 0, 0);
    const cu = st.curl; if (cu && P.curl) u.uCurl.value.set(cu[0], cu[1] ?? 0, cu[2] ?? 0.4, 1); else u.uCurl.value.set(0, 0, 0.3, 0);
    const fd = st.fade || P.fade; if (fd) u.uFade.value.set(fd[0], fd[1], fd[2], fd[3]); else u.uFade.value.set(0, 0, 0, 0);
    const ky = st.key; if (ky) { u.uKey.value.set(ky.hue ?? 8, ky.width ?? 22, ky.sat ?? 0.14, ky.a ?? 1); u.uKeyCol.value.setRGB(...C(ky.col)); const kr = ky.region || [0, 0, 1, 1]; u.uKeyR.value.set(kr[0], kr[1], kr[2], kr[3]); } else u.uKey.value.set(0, 20, 0.12, 0);
    const crt = st.crt ?? P.crt; if (crt) u.uCrt.value.set(crt.a ?? crt, crt.lines ?? 300, crt.mask ?? 0.5, crt.fringe ?? 1.5); else u.uCrt.value.set(0, 300, 0.5, 0);
    const fu = st.fuse; if (fu) { u.uFuse.value.set(fu.f, fu.C, fu.R, 1); u.uFuseG.value.set(fu.win[0], fu.win[1], fu.pitch[0], fu.pitch[1]); u.uFuseR.value.set(fu.rr, fu.k ?? 0.5, fu.ro ?? fu.rr, 0); } else u.uFuse.value.set(-1, 1, 1, 0);
    const lk = st.look ?? P.look ?? (P.footage ? {} : null);      // (every piece of the film's footage gets the MV's look unless look: false)
    if (lk && !st._back) { u.uLook.value.set(lk.a ?? 0.9, lk.glow ?? 0.7, lk.leak ?? 0.55, lk.ink ?? 0.6); u.uLookC.value.set((P.id * 0.618) % 6.28, lk.grade ?? 1, 0, lk.thr ?? 0.6); u.uCute.value.set(lk.cute ?? 0.85, lk.sparkle ?? 1, lk.soft ?? 1, (P.id * 0.37) % 7); } else { u.uLook.value.set(0, 0, 0, 0); u.uCute.value.set(0, 0, 0, 0); }
    const fo = st.foil ?? P.foil; if (fo) u.uFoil.value.set(fo.angle ?? 0.6, fo.scale ?? 1.2, fo.speed ?? 0.08, fo.shine ?? 0.6);
    const cd = st.card ?? P.card;
    const mt = st.mat ?? P.mat; if (mt && (st.mode ?? P.mode) === 9) { NN.set(0, 0, 1).applyQuaternion(Q); u.uCard.value.set(NN.dot(CR), NN.dot(CU), 0, 1); u.uMat.value.set({ acrylic: 0, metal: 1, pearl: 2 }[mt.kind] ?? 0, (mt.bevel ?? 6) * (u.uMap.value?.userData?.res || 1), mt.shine ?? 0.8, mt.pearl ?? 0.3); }
    if ((st.mode ?? P.mode) === 11) u.uCard.value.set(st.u ?? 0, st.seed ?? (P.id * 0.618) % 1, 0, 0);
    if ((st.mode ?? P.mode) === 13) u.uCard.value.set(0, (P.id * 0.618) % 1, 0, 0);
    const wv = P.wave; if ((st.mode ?? P.mode) === 13 && wv !== false) { const w0 = wv || {}; u.uWave.value.set(w0.amp ?? 0.16, w0.len ?? 0.9, w0.speed ?? 3.4, 1 + ((P.id * 0.618) % 1) * 0.999); } else u.uWave.value.set(0, 1, 0, 0);
    if (WM.tile) { u.uWm.value = WM.tile; u.uWmE.value = WM.emblem || WM.tile; u.uWmOn.value = 1; } else u.uWmOn.value = 0;
    const fxk = u.uMap.value?.userData?.fx;      // (the drawn effect textures — sparkle, bokeh, ring, manga — are drawn by mode 12 wherever a plane uses them as a flat ink)
    if (fxk && (st.mode ?? P.mode) === 1 && !st.flat) { u.uMode.value = 12; u.uCard.value.set((P.id * 0.618) % 1, 0, { spark: 0, bokeh: 1, ring: 2, manga: 3 }[fxk] ?? 0, u.uMap.value.userData.lw ?? 0.012); }
    if ((st.mode ?? P.mode) === 10) { NN.set(0, 0, 1).applyQuaternion(Q); const sg = st._back ? -1 : 1, k = cd || {}; u.uCard.value.set(sg * NN.dot(CR), sg * NN.dot(CU), st.phase ?? (P.id * 0.618) % 7, 1);
      u.uMat.value.set(k.ctr ? k.ctr[0] : 0.5, k.ctr ? 1 - k.ctr[1] : 0.5, k.rr ?? 0.25, 0); }
    if (cd && (st.mode ?? P.mode) === 8) { NN.set(0, 0, 1).applyQuaternion(Q); u.uFx.value = cd.fx; u.uCard.value.set(NN.dot(CR), NN.dot(CU), cd.style ?? 0, cd.amt ?? 1); u.uMetal.value.setRGB(...C(cd.metal || [236, 196, 110]));
      for (let i = 0; i < 6; i++) { const k = cd.spk && cd.spk[i]; if (k) u.uSpk.value[i].set(k[0], k[1], k[2], k[3]); else u.uSpk.value[i].set(0, 0, 0, 0); } }
    const fx = st.fx || (P.fx ? P.fx(t) : null);
    if (fx) { u.uFxA.value.set(fx.bloom ?? -1, fx.seed ? fx.seed[0] : 0.5, fx.seed ? 1 - fx.seed[1] : 0.5, fx.wet ?? 0); u.uFxB.value.set(fx.glitch ?? 0, fx.ascii ?? 0, fx.cells ?? 40, fx.halftone ?? 0);
      u.uFxC.value.set(fx.mosaic ?? 0, fx.scan ?? -1, fx.scanA ?? 0, fx.line ?? 0); u.uFxD.value.set(fx.misreg ?? 0, fx.dissolve ?? -1, fx.tear ?? -1, fx.tearA ?? 0);
      u.uFxE.value.set(fx.tiles ?? -1, fx.tcells ?? 8, fx.iris ?? -1, fx.stripes ?? -1);
      if (fx.amul != null) u.uAlpha.value *= fx.amul; }
    else { u.uFxA.value.set(-1, 0.5, 0.5, 0); u.uFxB.value.set(0, 0, 40, 0); u.uFxC.value.set(0, -1, 0, 0); u.uFxD.value.set(0, -1, -1, 0); u.uFxE.value.set(-1, 8, -1, -1); }
  }
  function setTex(mm, nt) { if (mm && mm.material.uniforms.uMap.value !== nt) { mm.material.uniforms.uMap.value = nt; mm.material.uniforms.uTexSize.value.set(nt.userData?.w || 1, nt.userData?.h || 1); } }
  function render(t, jit, sample = 0, tFoot = t) {
    const set = setAt(t); if (!set) return null;
    const c = set.cam(t), lens = new THREE.Vector4(1 / (c.focus || 20), c.dof ?? 0, c.maxBlur ?? 36, c.near ?? 0.25);
    const fg = set.fog ? set.fog(t) : null, fog = { v: new THREE.Vector4(fg ? fg.start : 1e6, fg ? fg.range : 1, fg ? fg.keep ?? 0.2 : 1, 0), c: new THREE.Color(...C(fg ? fg.col : [1, 1, 1])) };
    cam.fov = c.fov || 36; cam.near = 0.02; cam.far = 5000;
    if (jit) cam.setViewOffset(W, H, jit[0], jit[1], W, H); else cam.clearViewOffset();
    cam.updateProjectionMatrix();
    EYE.set(...c.p); TGT.set(...c.look); UP.set(...(c.up || [0, 1, 0]));
    lookM.lookAt(EYE, TGT, UP); Q.setFromRotationMatrix(lookM);
    if (c.roll) Q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), c.roll));
    cam.matrixWorld.compose(EYE, Q, S3.set(1, 1, 1)); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    CR.set(1, 0, 0).applyQuaternion(Q); CU.set(0, 1, 0).applyQuaternion(Q);      // (the camera's right and up, for a card's tilt)
    for (const s of sets) { for (const P of s.planes) if (!P.skip) { P.mesh.visible = false; if (P.backMesh) P.backMesh.visible = false; if (P.edgeMesh) P.edgeMesh.visible = false; if (P.shadowMesh) P.shadowMesh.visible = false; }
      for (const X of s.extras || []) X.obj.visible = false; }
    for (const X of set.extras || []) { X.obj.visible = X.update(t, { p: c.p, look: c.look, cam, W, H }) !== false; }
    const vis = [];
    for (const P of set.planes) {
      if (P.skip || (P.on && (t < P.on[0] || t >= P.on[1]))) continue;
      const st = P.at ? P.at(t) : { p: [0, 0, 0] }; if (!st || (st.a ?? 1) <= 0.002) continue;
      if (P.footage) { const u = P.footage(tFoot), ft = u ? frameTex.get(u) || P._lastFrame : null; if (!ft) continue; P._lastFrame = ft; setTex(P.mesh, ft); setTex(P.shadowMesh, ft); }
      const s = st.s ?? 1, sx = (Array.isArray(s) ? s[0] : s) * P.w, sy = (Array.isArray(s) ? s[1] : s) * P.h, r = st.r || [0, 0, 0];
      Q.setFromEuler(E.set(r[0], r[1], r[2], st.order || 'YXZ')); M.compose(V3.set(...st.p), Q, S3.set(sx, sy, 1)); P._sz = [Math.abs(sx), Math.abs(sy)];
      if (st.tex) { setTex(P.mesh, st.tex); setTex(P.shadowMesh, st.tex); }
      P.mesh.matrix.copy(M); P.mesh.matrixWorld.copy(M); P.mesh.visible = true; uni(P.mesh, P, st, lens, fog, sample, t);
      const d = V3.set(...st.p).sub(EYE).length(); vis.push([P, d, st.z ?? 0, st.layer ?? P.order ?? 0]);   // (st.layer: a plane may change layer as it moves, e.g. a card orbiting behind / in front of a window; st.order is the Euler order)
      if (P.backMesh) { OFF.makeRotationY(Math.PI); P.backMesh.matrix.copy(M).multiply(OFF); P.backMesh.matrixWorld.copy(P.backMesh.matrix); P.backMesh.visible = true; uni(P.backMesh, { ...P, mode: P.back.mode, col: P.back.col, col2: P.back.col2, crop: P.back.crop }, { ...st, mode: P.back.mode, col: st.backCol ?? P.back.col, col2: P.back.col2, crop: P.back.crop, key: null, crt: null, card: P.back.card ?? st.card, round: 0, _back: true }, lens, fog, sample, t); }
      if (P.edgeMesh && !(st.rag || P.rag)) { const R = P.rim || P.edge, dd = R.d || 0.02, nz = (x) => (Math.abs(x) < 1e-3 ? (x < 0 ? -1e-3 : 1e-3) : x), s0 = nz(Array.isArray(s) ? s[0] : s), s1 = nz(Array.isArray(s) ? s[1] : s);      // (never a zero scale: its normal matrix would be NaN, and NaN spreads through the bloom as black blocks)
        // (the band runs from the face the camera sees away from it: seen from behind it is mirrored, so whichever face is toward the lens caps it)
        NN.set(0, 0, 1).applyQuaternion(Q); const front = NN.x * (EYE.x - st.p[0]) + NN.y * (EYE.y - st.p[1]) + NN.z * (EYE.z - st.p[2]) >= 0;
        P.edgeMesh.matrix.compose(V3.set(...st.p), Q, S3.set(s0, s1, front ? dd : -dd)); P.edgeMesh.matrixWorld.copy(P.edgeMesh.matrix); P.edgeMesh.visible = true;
        const eu = P.edgeMesh.material.uniforms; eu.uA.value = Math.min(1, st.a ?? 1) * (R.a ?? 1); eu.uT.value = t; if (st.rimCol) eu.uCol.value.setRGB(...C(st.rimCol)); }
      if (P.rimOnly) P.mesh.visible = false;      // (a plane that is only a thickness: its face is drawn by another plane)
      if (P.shadow) {           // the same shape, dark and soft, a little behind and aside (light from the upper left)
        const sh = P.shadow, off = new THREE.Vector3(sh.dx ?? 0.04, -(sh.dy ?? 0.06), -(sh.d ?? 0.05)).applyQuaternion(Q);
        M.compose(V3.set(st.p[0] + off.x, st.p[1] + off.y, st.p[2] + off.z), Q, S3.set(sx, sy, 1));
        P.shadowMesh.matrix.copy(M); P.shadowMesh.matrixWorld.copy(M); P.shadowMesh.visible = true;
        const sfx = st.fx && st.fx.tear != null ? { ...st.fx, tearA: ((st.fx.tearA ?? 0) % 10) + 20 } : st.fx;      // (a shadow is only cut along a tear / burn front)
        uni(P.shadowMesh, P, { ...st, fx: sfx, mode: 1, col: sh.col || [20, 18, 40], a: (st.a ?? 1) * (sh.a ?? 0.22), bias: sh.bias ?? 2.5, key: null, crt: null }, lens, fog, sample, t);
      }
    }
    // far to near (planes at the same distance keep their order); extras (penlight seas, lasers) carry their own renderOrder
    vis.sort((a, b) => a[3] - b[3] || b[1] - a[1]);
    vis.forEach(([P], i) => { const o = 100 + i * 4; if (P.shadowMesh) P.shadowMesh.renderOrder = o; if (P.edgeMesh) P.edgeMesh.renderOrder = o + 1; P.mesh.renderOrder = o + 2; if (P.backMesh) P.backMesh.renderOrder = o + 2; });
    const bgv = set.bg ? set.bg(t) : [20, 18, 30], top = C(Array.isArray(bgv) ? bgv : bgv.top), bot = C(Array.isArray(bgv) ? bgv : bgv.bot);
    bgMat.uniforms.uTop.value.setRGB(...top); bgMat.uniforms.uBot.value.setRGB(...bot); bgMat.uniforms.uT.value = t;
    const gk = set.ground ? set.ground(t) : null; bgMat.uniforms.uKind.value = gk ? gk.kind : 0; bgMat.uniforms.uMix.value = gk ? gk.a ?? 1 : 1; bgMat.uniforms.uPulse.value = gk ? gk.pulse ?? 0 : 0; bgMat.uniforms.uOff.value.set(EYE.x * 0.012, EYE.y * 0.012);
    renderer.setRenderTarget(rt); renderer.setClearColor(new THREE.Color(top[0], top[1], top[2]), 1); renderer.clear(true, true, false);
    const ac = renderer.autoClear; renderer.autoClear = false;
    renderer.render(bgScene, bgCam);
    scene.matrixWorldAutoUpdate = false; if (!BGONLY) renderer.render(scene, cam);
    renderer.autoClear = ac;
    return rt;
  }
  const ground = (t) => { const s = setAt(t); const v = s && s.bg ? s.bg(t) : [20, 18, 30]; const top = C(Array.isArray(v) ? v : v.top), bot = C(Array.isArray(v) ? v : v.bot); return { top, bot }; };
  return { add, render, prepare, active: (t) => !!setAt(t), setAt, ground, scene, cam };
}
