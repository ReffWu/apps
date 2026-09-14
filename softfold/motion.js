import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const canvas = document.querySelector('.shot canvas.motion');
const still = document.querySelector('.shot img');
const probe = document.createElement('canvas');
const supported = canvas && !matchMedia('(prefers-reduced-motion: reduce)').matches
  && 'filter' in (probe.getContext('2d') || {}) && !!document.createElement('canvas').getContext('webgl2');
if (!supported) throw new Error('Softfold motion falls back to the still image');
const dark = matchMedia('(prefers-color-scheme: dark)').matches;
const ink = dark ? '235,235,245' : '60,60,67';

const PI = Math.PI;
const SCALE = 5.6;
const pt = (v) => v / SCALE;
const K = 80;

const W = 31.26, L = 22.12, BH = 1.11, METAL = 0.37, GLASS = 0.045, LT = METAL + GLASS;
const CORNER = 0.16, CURVE_H = 0.62, CURVE_W = 0.9, PORT_Y = 0.37;
const PORTS = [['magSafe', 2.81], ['thunderbolt', 4.63], ['thunderbolt', 6.12], ['headphone', 7.41]];
const FEET = [1.716, 18.337], FOOT_TOP = 2.07, FOOT_BOTTOM = 1.79, FOOT_H = 0.15, FOOT_INSET = 2.4;
const VENT = [9.07, 19.48], DROP = 0.70, GAP = 0.18, DISP = 19.64, DISP_W = 30.2, TOP_BEZEL = 0.56;
const PLAN_RADIUS = 0.95, LID_FAR_RADIUS = 0.95, LID_NEAR_RADIUS = 0.26;
const PIVOT_U = (DROP - GAP) / 2, PIVOT_V = (DROP + GAP) / 2;
const FINISH = [0xdf / 255, 0xe0 / 255, 0xe2 / 255];
const OPEN = 95, TAPER = 0.30;
const Y_TOP = FOOT_H + BH;
const DISPLAY_START = L - TOP_BEZEL - DISP;
const GLOW = Math.min(pt(1.6), LT * 0.5);

const shade = (f) => `rgb(${FINISH.map((c) => Math.round(Math.min(c * f, 1) * 255)).join(',')})`;

function makeCanvas(wcm, hcm) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(wcm * K); c.height = Math.ceil(hcm * K);
  const g = c.getContext('2d');
  g.scale(K, K);
  return [c, g];
}
function texture(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function verticalGradient(g, h, stops) {
  const grad = g.createLinearGradient(0, 0, 0, h);
  for (const [at, f] of stops) grad.addColorStop(at, shade(f));
  return grad;
}

const END_STOPS = [[0, 0.7], [0.11, 0.66], [0.33, 1.05], [0.5, 0.82], [0.72, 0.56], [1.0, 0.64], [1.6, 0.75], [3.0, 0.9], [5.0, 1.0]];
function shadeEnds(g, h, length = L) {
  const reach = END_STOPS.at(-1)[0];
  for (const fromRear of [true, false]) {
    const x0 = fromRear ? 0 : length, x1 = fromRear ? reach : length - reach;
    const darken = g.createLinearGradient(x0, 0, x1, 0);
    const lighten = g.createLinearGradient(x0, 0, x1, 0);
    for (const [at, f] of END_STOPS) {
      const v = Math.round(Math.min(f, 1) * 255);
      darken.addColorStop(at / reach, `rgb(${v},${v},${v})`);
      lighten.addColorStop(at / reach, `rgb(${FINISH.map((c) => Math.round(Math.max(Math.min(c * f, 1) - c, 0) * 255)).join(',')})`);
    }
    const band = [fromRear ? 0 : length - reach, 0, reach, h];
    g.save();
    g.globalCompositeOperation = 'multiply'; g.fillStyle = darken; g.fillRect(...band);
    g.globalCompositeOperation = 'lighter'; g.fillStyle = lighten; g.fillRect(...band);
    g.restore();
  }
}

function capsule(g, cx, cy, w, h) {
  g.beginPath(); g.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2);
}
function drawPort(g, kind, x) {
  const y = PORT_Y;
  if (kind === 'magSafe') {
    capsule(g, x, y, 1.73, 0.32); g.fillStyle = shade(0.82); g.fill();
    g.lineWidth = pt(0.35); g.strokeStyle = shade(1.35); g.stroke();
    capsule(g, x, y, 1.06, 0.12); g.fillStyle = 'rgb(13,13,13)'; g.fill();
    g.fillStyle = 'rgb(158,158,158)';
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x + 0.187 * (i - 2), y, 0.018, 0, 2 * PI); g.fill(); }
  } else if (kind === 'thunderbolt') {
    capsule(g, x, y, 0.84, 0.265); g.fillStyle = 'rgb(10,10,10)'; g.fill();
    g.lineWidth = pt(0.3); g.strokeStyle = shade(0.6); g.stroke();
    capsule(g, x, y, 0.61, 0.06); g.fillStyle = 'rgb(61,61,61)'; g.fill();
  } else {
    g.beginPath(); g.arc(x, y, 0.185, 0, 2 * PI); g.fillStyle = 'rgb(8,8,8)'; g.fill();
    g.lineWidth = pt(0.3); g.strokeStyle = shade(0.6); g.stroke();
  }
}

const BASE_STOPS = [[0, 1.02], [0.2, 0.99], [0.35, 0.95], [0.5, 0.82], [0.62, 0.63], [0.74, 0.5], [0.8, 0.52], [0.88, 0.66], [0.92, 0.7], [0.96, 0.55], [1, 0.25]];
function frontWall() {
  const h = BH, [c, g] = makeCanvas(W, h);
  g.fillStyle = verticalGradient(g, h, BASE_STOPS);
  g.fillRect(0, 0, W, h);
  shadeEnds(g, h, W);
  const notch = W * 0.16, depth = h * 9 / 26, radius = h * 8 / 26;
  const grad = g.createLinearGradient(0, 0, 0, depth);
  grad.addColorStop(0, shade(0.66)); grad.addColorStop(1, shade(0.82));
  g.beginPath(); g.roundRect((W - notch) / 2, -radius, notch, depth + radius, radius); g.fillStyle = grad; g.fill();
  g.lineWidth = pt(0.4); g.strokeStyle = shade(1.12); g.stroke();
  return c;
}

function baseWall() {
  const h = BH, [c, g] = makeCanvas(L, h);
  g.fillStyle = verticalGradient(g, h, BASE_STOPS);
  g.fillRect(0, 0, L, h);
  shadeEnds(g, h);
  const slotH = h * 0.07;
  g.beginPath(); g.roundRect(VENT[0], h * 0.84, VENT[1] - VENT[0], slotH, slotH / 2); g.fillStyle = 'rgba(0,0,0,0.55)'; g.fill();
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(VENT[0] + slotH, h * 0.84 + slotH, VENT[1] - VENT[0] - slotH * 2, pt(0.5));
  for (const [kind, x] of PORTS) drawPort(g, kind, x);
  return c;
}

function lidWall() {
  const [c, g] = makeCanvas(L, LT);
  g.fillStyle = verticalGradient(g, LT, [[0, 0.56], [0.05, 1.13], [0.15, 1.0], [1, 1.0]]);
  g.fillRect(0, 0, L, LT);
  shadeEnds(g, LT);
  g.fillStyle = 'rgb(10,10,10)'; g.fillRect(0, METAL, L, GLASS);
  return c;
}

const SCREEN_ROWS = ['rgb(127,148,217)','rgb(125,145,214)','rgb(141,157,215)','rgb(164,176,223)','rgb(162,174,221)','rgb(160,172,219)','rgb(158,169,216)','rgb(155,166,213)','rgb(155,165,212)','rgb(155,165,212)','rgb(151,160,208)','rgb(148,155,203)','rgb(147,154,201)','rgb(149,153,202)','rgb(137,141,193)','rgb(141,142,196)','rgb(140,139,198)','rgb(138,136,193)','rgb(134,132,187)','rgb(128,125,181)','rgb(129,125,181)','rgb(84,78,150)','rgb(62,54,134)','rgb(59,51,127)'];
function screenGradient(g, x0, x1, alpha = 1) {
  const grad = g.createLinearGradient(x0, 0, x1, 0);
  SCREEN_ROWS.forEach((col, i) => grad.addColorStop(1 - i / (SCREEN_ROWS.length - 1), col.replace('rgb', 'rgba').replace(')', `,${alpha})`)));
  return grad;
}

const GLOW_PAD = 3;
function glowCap() {
  const [c, g] = makeCanvas(DISP + GLOW_PAD * 2, GLOW + GLOW_PAD * 2);
  g.save(); g.filter = `blur(${pt(5) * K / 2}px)`;
  g.fillStyle = screenGradient(g, GLOW_PAD, GLOW_PAD + DISP, 0.9); g.fillRect(GLOW_PAD, GLOW_PAD, DISP, GLOW); g.restore();
  g.fillStyle = screenGradient(g, GLOW_PAD, GLOW_PAD + DISP); g.fillRect(GLOW_PAD, GLOW_PAD, DISP, GLOW);
  return c;
}

const HALO_LEFT = 0.5 * DISP + 5, HALO_DEPTH = 0.76 * DISP + 6;
function haloCap() {
  const w = DISP, [c, g] = makeCanvas(w * 2 + 10, HALO_DEPTH);
  const origin = HALO_LEFT;
  for (let i = 1; i <= 8; i++) {
    const step = i / 8;
    const reach = w * (0.04 + 0.72 * Math.pow(step, 1.5));
    const spread = w * 0.5 * Math.pow(step, 1.6);
    const strength = 0.22 * Math.pow(1 - step, 1.3) + 0.02;
    g.save();
    g.filter = `blur(${pt(1 + 22 * step) * K}px)`;
    g.translate(origin - spread, 0);
    g.beginPath(); g.moveTo(spread, 0); g.lineTo(spread + w, 0); g.lineTo(w + 2 * spread, reach); g.lineTo(0, reach); g.closePath();
    const grad = g.createLinearGradient(0, 0, 0, reach);
    grad.addColorStop(0, `rgba(0,122,255,${strength})`); grad.addColorStop(1, 'rgba(0,122,255,0)');
    g.fillStyle = grad; g.fill();
    g.restore();
  }
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = screenGradient(g, origin, origin + w); g.fillRect(0, 0, w * 2 + 10, HALO_DEPTH);
  g.globalCompositeOperation = 'destination-in';
  const fade = g.createLinearGradient(origin - 0.3 * w, 0, origin + 1.3 * w, 0);
  fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(0.3 / 1.6, '#000'); fade.addColorStop(1.3 / 1.6, '#000'); fade.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = fade; g.fillRect(0, 0, w * 2 + 10, HALO_DEPTH);
  return c;
}

function guideCap() {
  const [c, g] = makeCanvas(L + 0.2, 0.6);
  g.setLineDash([pt(3), pt(4)]); g.lineWidth = pt(1.5); g.strokeStyle = `rgba(${ink},0.33)`;
  g.beginPath(); g.moveTo(0, 0.3); g.lineTo(L, 0.3); g.stroke();
  return c;
}

function labelCap() {
  const [c, g] = makeCanvas(4, 2);
  g.fillStyle = `rgba(${ink},0.6)`; g.font = `500 ${pt(10)}px -apple-system, Helvetica`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`${OPEN}°`, 2, 1);
  return c;
}

function ellipseCap(wcm, hcm, blurcm, alpha) {
  const pad = blurcm * 3, [c, g] = makeCanvas(wcm + pad * 2, hcm + pad * 2);
  g.filter = `blur(${blurcm * K}px)`;
  g.fillStyle = `rgba(0,0,0,${alpha})`;
  g.beginPath(); g.ellipse(pad + wcm / 2, pad + hcm / 2, wcm / 2, hcm / 2, 0, 0, 2 * PI); g.fill();
  return [c, wcm + pad * 2, hcm + pad * 2];
}

function ring(w, d, rFar, rNear, cz, steps = 10) {
  const corners = [
    [w / 2 - rFar, cz + d / 2 - rFar, rFar, 0], [-w / 2 + rFar, cz + d / 2 - rFar, rFar, PI / 2],
    [-w / 2 + rNear, cz - d / 2 + rNear, rNear, PI], [w / 2 - rNear, cz - d / 2 + rNear, rNear, PI * 1.5],
  ];
  const points = [];
  for (const [x, z, r, a0] of corners) {
    for (let k = 0; k <= steps; k++) {
      const a = a0 + (PI / 2) * k / steps;
      points.push([x + r * Math.cos(a), z + r * Math.sin(a), Math.cos(a), Math.sin(a)]);
    }
  }
  return points;
}

function sweep(profile, w, d, rFar, rNear, cz) {
  const positions = [], normals = [], index = [];
  const rings = profile.map(([inset, y]) => ring(w - 2 * inset, d - 2 * inset, Math.max(rFar - inset, 0.01), Math.max(rNear - inset, 0.01), cz));
  const count = rings[0].length;
  profile.forEach(([inset, y], j) => {
    const prev = profile[Math.max(j - 1, 0)], next = profile[Math.min(j + 1, profile.length - 1)];
    const dro = -(next[0] - prev[0]), dy = next[1] - prev[1];
    const len = Math.hypot(dro, dy) || 1;
    const radial = -dy / len, vertical = dro / len;
    for (const [x, z, nx, nz] of rings[j]) {
      positions.push(x, y, z);
      normals.push(nx * radial, vertical, nz * radial);
    }
  });
  for (let j = 0; j < profile.length - 1; j++) {
    for (let k = 0; k < count; k++) {
      const a = j * count + k, b = j * count + (k + 1) % count, c = a + count, e = b + count;
      index.push(a, c, b, b, c, e);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(index);
  return { geometry, top: rings[0] };
}

function cap(points, y) {
  const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, z)));
  return new THREE.ShapeGeometry(shape).rotateX(PI / 2).translate(0, y, 0);
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(10, 1, 1, 5000);

function overlay(map) {
  return new THREE.MeshBasicMaterial({ map, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
}
function add(parent, geometry, material, rank) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = rank;
  parent.add(mesh);
  return mesh;
}
const sidePlane = (wcm, hcm) => new THREE.PlaneGeometry(wcm, hcm).rotateY(-PI / 2);
const lidLocal = (geometry, u, v, x) => geometry.translate(x, LT - v + PIVOT_V, u - PIVOT_U);
const linear = (css) => new THREE.Color(css);

const [sideShadowC, ssw, ssh] = ellipseCap(L + pt(22), pt(10), pt(5), 0.12);
const sideShadow = add(scene, sidePlane(ssw, ssh).translate(-W / 2 - 0.4, FOOT_H - pt(5), 0), overlay(texture(sideShadowC)), -2);
const [frontShadowC, fsw, fsh] = ellipseCap(W * 1.05, 0.8, 0.45, 0.47);
const frontShadow = add(scene, new THREE.PlaneGeometry(fsw, fsh).translate(0, 0.05, L / 2 + 0.4), overlay(texture(frontShadowC)), -2);

function pivotGroup() {
  const group = new THREE.Group();
  group.position.set(0, Y_TOP - PIVOT_V, -L / 2 + PIVOT_U);
  scene.add(group);
  return group;
}

const guide = pivotGroup();
guide.rotation.x = -OPEN * PI / 180;
const guideMaterial = overlay(texture(guideCap()));
add(guide, lidLocal(sidePlane(L + 0.2, 0.6), (L + 0.2) / 2, LT, -W / 2 - 0.3), guideMaterial, -1);
const labelMaterial = overlay(texture(labelCap()));
{
  const a = -OPEN * PI / 180, y = PIVOT_V, z = L + pt(16) - PIVOT_U;
  const tip = new THREE.Vector3(-W / 2 - 0.3, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)).add(guide.position);
  add(scene, sidePlane(4, 2).translate(tip.x, tip.y, tip.z), labelMaterial, -1);
}

const light = pivotGroup();
const haloMaterial = new THREE.ShaderMaterial({
  uniforms: { map: { value: texture(haloCap()) }, strength: { value: 1 }, floor: { value: Y_TOP } },
  transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
  vertexShader: `varying vec2 vUv; varying float vY; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `
    uniform sampler2D map; uniform float strength, floor; varying vec2 vUv; varying float vY;
    void main() {
      vec4 c = texture2D(map, vUv);
      gl_FragColor = vec4(c.rgb, c.a * strength * smoothstep(floor, floor + ${pt(4).toFixed(3)}, vY));
      #include <colorspace_fragment>
    }`,
});
add(light, lidLocal(sidePlane(DISP * 2 + 10, HALO_DEPTH), DISPLAY_START - HALO_LEFT + DISP + 5, LT + HALO_DEPTH / 2, -W / 2 - 0.25), haloMaterial, 0);

const wallVertex = `varying vec3 vPos; varying vec3 vN; void main() { vPos = position; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const lid = pivotGroup();
const lidProfile = [];
for (let k = 0; k <= 8; k++) {
  const v = CORNER * k / 8;
  lidProfile.push([CORNER - Math.sqrt(Math.max(CORNER * CORNER - (CORNER - v) * (CORNER - v), 0)), LT - v + PIVOT_V]);
}
lidProfile.push([0, PIVOT_V]);
const lidShell = sweep(lidProfile, W, L, LID_FAR_RADIUS, LID_NEAR_RADIUS, L / 2 - PIVOT_U);
const lidMaterial = new THREE.ShaderMaterial({
  uniforms: { side: { value: texture(lidWall()) } }, transparent: true, side: THREE.DoubleSide,
  vertexShader: wallVertex,
  fragmentShader: `
    uniform sampler2D side; varying vec3 vPos; varying vec3 vN;
    void main() {
      vec3 n = normalize(vN);
      float v = (${(LT + PIVOT_V).toFixed(4)} - vPos.y) / ${LT.toFixed(4)};
      float u = (vPos.z + ${PIVOT_U.toFixed(4)}) / ${L.toFixed(4)};
      vec3 wall = texture2D(side, vec2(clamp(u, 0.0, 1.0), 1.0 - clamp(v, 0.0, 1.0))).rgb;
      vec3 plain = texture2D(side, vec2(0.5, 1.0 - clamp(v, 0.0, 1.0))).rgb;
      gl_FragColor = vec4(mix(plain, wall, n.x * n.x), 1.0);
      #include <colorspace_fragment>
    }`,
});
add(lid, lidShell.geometry, lidMaterial, 1);
add(lid, cap(lidShell.top, LT + PIVOT_V), new THREE.MeshBasicMaterial({ color: linear(shade(1.0)), transparent: true, side: THREE.DoubleSide }), 1);
add(lid, new THREE.BoxGeometry(W - 4, GAP, DROP * 0.44).translate(0, PIVOT_V - GAP / 2, DROP * 0.22 - PIVOT_U),
  new THREE.MeshBasicMaterial({ color: linear(shade(0.45)), transparent: true }), 1);

const loader = new THREE.TextureLoader();
const LANGS = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko'];
const pageLang = () => (LANGS.includes(document.documentElement.lang) ? document.documentElement.lang : 'en');
const image = (name) => { const t = loader.load(`motion/${name}-${pageLang()}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t; };
const screenUniforms = {
  desktop: { value: image('desktop') }, sides: { value: image('sides') }, soft: { value: image('soft') }, medium: { value: image('medium') }, broad: { value: image('broad') },
  progress: { value: 0 }, opacity: { value: 0 },
};
const glass = add(lid, new THREE.PlaneGeometry(W, L).rotateX(PI / 2).translate(0, PIVOT_V - 0.004, L / 2 - PIVOT_U), new THREE.ShaderMaterial({
  uniforms: screenUniforms, transparent: true, side: THREE.DoubleSide,
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D desktop, sides, soft, medium, broad;
    uniform float progress, opacity;
    vec3 padded(sampler2D t, vec2 m) { return texture2D(t, vec2(clamp(${(76 / 652).toFixed(5)} + m.x * ${(500 / 652).toFixed(5)}, 0.0, 1.0), 1.0 - clamp(m.y, 0.0, 1.0))).rgb; }
    varying vec2 vUv;
    vec3 tex(sampler2D t, vec2 m) { return texture2D(t, vec2(clamp(m.x, 0.0, 1.0), 1.0 - clamp(m.y, 0.0, 1.0))).rgb; }
    float rounded(vec2 p, vec2 size, float top, float bottom, float aa) {
      float r = p.y < size.y * 0.5 ? top : bottom;
      vec2 q = abs(p - size * 0.5) - size * 0.5 + r;
      float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
      return clamp(0.5 - d / aa, 0.0, 1.0);
    }
    vec3 fold(vec2 inUV) {
      float turn = progress * 1.5707964;
      float tp = ${TAPER} * progress;
      float q = (1.0 + tp) / (1.0 + tp * inUV.y);
      vec2 f = vec2((inUV.x - 0.5) * q + 0.5, inUV.y * q);
      vec2 uv = vec2(f.x, 1.0 - cos(turn * 0.65) * (1.0 - f.y));
      float edge = min(uv.x, 1.0 - uv.x);
      float feather = smoothstep(0.0, max(0.0001, progress * 0.012 * (1.0 - f.y)), edge);
      vec3 sharp = mix(padded(sides, uv), tex(desktop, uv), feather);
      float amount = 36.0 * sin(turn) * (1.0 - inUV.y);
      vec3 s1 = padded(soft, uv), s2 = padded(medium, uv), s3 = padded(broad, uv);
      vec3 color = mix(sharp, s1, clamp(amount / 6.0, 0.0, 1.0));
      color = mix(color, s2, clamp((amount - 6.0) / 10.0, 0.0, 1.0));
      color = mix(color, s3, clamp((amount - 16.0) / 20.0, 0.0, 1.0));
      float upper = 1.0 - smoothstep(0.0, 0.85, f.y);
      float corners = (1.0 - smoothstep(0.0, 0.19, edge)) * upper;
      color *= 1.0 - progress * (0.50 * corners + 0.10 * upper);
      return mix(tex(desktop, inUV), color, opacity);
    }
    void main() {
      vec2 size = vec2(${W.toFixed(3)}, ${L.toFixed(3)});
      vec2 p = vec2(vUv.x, 1.0 - vUv.y) * size;
      float frame = rounded(p, size, ${LID_FAR_RADIUS.toFixed(3)}, ${LID_NEAR_RADIUS.toFixed(3)}, 0.02);
      vec2 origin = vec2(${((W - DISP_W) / 2).toFixed(4)}, ${TOP_BEZEL.toFixed(4)});
      vec2 inner = vec2(${DISP_W.toFixed(3)}, ${DISP.toFixed(3)});
      float lit = rounded(p - origin, inner, 0.5, 0.06, 0.02);
      vec3 color = mix(vec3(10.0, 10.0, 12.0) / 255.0, fold((p - origin) / inner), lit);
      gl_FragColor = vec4(color, frame);
      #include <colorspace_fragment>
    }`,
}), 1);

const glow = pivotGroup();
const glowMaterial = overlay(texture(glowCap()));
add(glow, lidLocal(sidePlane(DISP + GLOW_PAD * 2, GLOW + GLOW_PAD * 2), DISPLAY_START + DISP / 2, LT - GLOW / 2, -W / 2 - 0.2), glowMaterial, 2);

const curveTop = BH - CURVE_H, controlY = curveTop + CURVE_H * 0.58, controlX = CURVE_W * 0.33;
const baseProfile = [[0, Y_TOP], [0, Y_TOP - curveTop]];
for (let k = 1; k <= 14; k++) {
  const t = k / 14, m = 1 - t;
  const bx = m * m * m * L + 3 * m * m * t * L + 3 * m * t * t * (L - controlX) + t * t * t * (L - CURVE_W);
  const by = m * m * m * curveTop + 3 * m * m * t * controlY + 3 * m * t * t * BH + t * t * t * BH;
  baseProfile.push([L - bx, Y_TOP - by]);
}
const baseShell = sweep(baseProfile, W, L, PLAN_RADIUS, PLAN_RADIUS, 0);
const baseMaterial = new THREE.ShaderMaterial({
  uniforms: {
    side: { value: texture(baseWall()) },
    front: { value: texture(frontWall()) },
  },
  transparent: true, side: THREE.DoubleSide,
  vertexShader: wallVertex,
  fragmentShader: `
    uniform sampler2D side, front; varying vec3 vPos; varying vec3 vN;
    void main() {
      vec3 n = normalize(vN);
      float depth = (${Y_TOP.toFixed(4)} - vPos.y) / ${BH.toFixed(4)};
      vec3 wall = texture2D(side, vec2(clamp((vPos.z + ${(L / 2).toFixed(4)}) / ${L.toFixed(4)}, 0.0, 1.0), 1.0 - clamp(depth, 0.0, 1.0))).rgb;
      vec3 face = texture2D(front, vec2(clamp((vPos.x + ${(W / 2).toFixed(4)}) / ${W.toFixed(4)}, 0.0, 1.0), 1.0 - clamp(depth, 0.0, 1.0))).rgb;
      float ws = n.x * n.x, wf = n.z * n.z + 0.0001;
      gl_FragColor = vec4((wall * ws + face * wf) / (ws + wf), 1.0);
      #include <colorspace_fragment>
    }`,
});
add(scene, baseShell.geometry, baseMaterial, 3);
add(scene, cap(baseShell.top, Y_TOP), new THREE.MeshBasicMaterial({ color: linear(shade(0.95)), transparent: true, side: THREE.DoubleSide }), 3);

const footMaterial = new THREE.ShaderMaterial({
  transparent: true,
  vertexShader: `varying float vY; void main() { vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    varying float vY;
    void main() {
      float t = clamp(0.5 - vY / ${(FOOT_H + 0.04).toFixed(3)}, 0.0, 1.0);
      vec3 c = t < 0.5 ? mix(vec3(0.42), vec3(0.16), t * 2.0) : mix(vec3(0.16), vec3(0.1), t * 2.0 - 1.0);
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }`,
});
for (const start of FEET) {
  for (const side of [-1, 1]) {
    add(scene, new THREE.CylinderGeometry(FOOT_TOP / 2, FOOT_BOTTOM / 2, FOOT_H + 0.04, 40)
      .translate(side * (W / 2 - FOOT_INSET), (FOOT_H + 0.04) / 2, -L / 2 + start + FOOT_TOP / 2), footMaterial, 3);
  }
}

const keys = [[0, 118, 0], [1, 118, 0], [3, OPEN, 0], [3.4, OPEN, 0], [5, OPEN, 1], [5.4, OPEN, 1], [8.9, 30, 1], [9.5, 30, 1], [13, OPEN, 1], [13.4, OPEN, 1], [15, OPEN, 0], [15.4, OPEN, 0], [17.4, 118, 0], [18.4, 118, 0]];
const total = keys.at(-1)[0];
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function sample(t) {
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a0, s0] = keys[i], [t1, a1, s1] = keys[i + 1];
    if (t <= t1) { const u = ease((t - t0) / (t1 - t0)); return { angle: a0 + (a1 - a0) * u, s: s0 + (s1 - s0) * u, closing: i < 7 }; }
  }
  return { angle: keys.at(-1)[1], s: 0, closing: false };
}
const clamp01 = (x) => Math.min(Math.max(x, 0), 1);
const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

function frame(time) {
  const { angle, s, closing } = sample(time);
  const screenAngle = closing && angle < OPEN ? OPEN : angle;
  lid.rotation.x = -angle * PI / 180;
  light.rotation.x = glow.rotation.x = -screenAngle * PI / 180;

  const shown = 1 - smooth(3.0, 3.35, time) + smooth(15.05, 15.4, time);
  glowMaterial.opacity = shown;
  haloMaterial.uniforms.strength.value = shown;
  guideMaterial.opacity = labelMaterial.opacity = shown;
  sideShadow.material.opacity = 1 - smooth(0, 0.4, s);
  frontShadow.material.opacity = smooth(0.4, 1, s);

  const progress = clamp01((OPEN - 0.6 - angle) / (OPEN - 8.6));
  const blend = Math.min(progress / 0.025, 1);
  screenUniforms.progress.value = progress;
  screenUniforms.opacity.value = blend * blend * (3 - 2 * blend);

  const aspect = canvas.clientWidth / canvas.clientHeight;
  const halfH = Math.max(15.5, 22 / aspect);
  const dist = Math.exp(THREE.MathUtils.lerp(Math.log(4000), Math.log(95), s));
  const eye = Y_TOP + 0.02;
  const az = -PI / 2 * (1 - s);
  const focus = new THREE.Vector3(0, eye, THREE.MathUtils.lerp(-4.3, -L / 2 + 2, s));
  camera.fov = 2 * Math.atan(halfH / dist) * 180 / PI;
  camera.aspect = aspect;
  camera.near = Math.max(1, dist - 90);
  camera.far = dist + 90;
  camera.position.set(focus.x + Math.sin(az) * dist, eye, focus.z + Math.cos(az) * dist);
  camera.lookAt(focus);
  camera.updateProjectionMatrix();
  camera.projectionMatrix.elements[9] = (12 - eye) / halfH;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  renderer.render(scene, camera);
}

let shownLang = pageLang();
new MutationObserver(() => {
  if (pageLang() === shownLang) return;
  shownLang = pageLang();
  for (const name of ['desktop', 'sides', 'soft', 'medium', 'broad']) {
    const old = screenUniforms[name].value;
    screenUniforms[name].value = image(name);
    old.dispose();
  }
}).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

const resize = () => renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
canvas.hidden = false;
still.hidden = true;
new ResizeObserver(resize).observe(canvas);
resize();

let visible = true, clock = 0, last = performance.now();
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (visible && !document.hidden) {
    clock = (clock + dt) % total;
    frame(clock);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
