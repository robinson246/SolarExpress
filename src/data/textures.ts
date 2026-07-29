// Procedural canvas textures for solar system bodies.
// Each function draws onto a canvas and returns a THREE.CanvasTexture.

import * as THREE from 'three';

// --- Simple seeded noise ---
function hash(x: number, y: number, seed: number): number {
  let h = x * 374761393 + y * 668265263 + seed * 1274126177;
  h = ((h ^ (h >> 13)) * 1103515245) | 0;
  return ((h & 0x7fffffff) / 0x7fffffff);
}

function smoothNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const n00 = hash(ix, iy, seed);
  const n10 = hash(ix + 1, iy, seed);
  const n01 = hash(ix, iy + 1, seed);
  const n11 = hash(ix + 1, iy + 1, seed);

  const nx0 = n00 + (n10 - n00) * sx;
  const nx1 = n01 + (n11 - n01) * sx;
  return nx0 + (nx1 - nx0) * sy;
}

function fbm(x: number, y: number, seed: number, octaves: number): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, y * freq, seed + i * 31);
    amp *= 0.5;
    freq *= 2;
  }
  return val;
}

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  return [
    parseInt(c.substring(0, 2), 16),
    parseInt(c.substring(2, 4), 16),
    parseInt(c.substring(4, 6), 16),
  ];
}

// --- Texture generators ---

function generateGasGiant(
  w: number, h: number,
  baseColors: string[],
  bandColors: string[],
  seed: number,
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const bases = baseColors.map(hexToRgb);
  const bands = bandColors.map(hexToRgb);

  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;

      // Horizontal band pattern
      const bandFreq = 12;
      const bandNoise = fbm(u * 2, v * bandFreq, seed, 3);
      const bandIdx = Math.floor((v + bandNoise * 0.06) * bands.length) % bands.length;
      const base = bands[bandIdx];

      // Latitude-dependent shading
      const lat = Math.abs(v - 0.5) * 2;
      const latShade = 1 - lat * 0.15;

      // Subtle swirl/turbulence
      const turb = fbm(u * 6 + v * 2, v * 3, seed + 100, 4);
      const turbAmt = (turb - 0.5) * 15;

      // Storm spots (subtle darker patches)
      const storm = fbm(u * 10, v * 8, seed + 200, 3);
      const stormMask = Math.max(0, (storm - 0.72) * 5);

      let r = base[0] * latShade + turbAmt;
      let g = base[1] * latShade + turbAmt;
      let b = base[2] * latShade + turbAmt;

      if (stormMask > 0) {
        const dark = bases[0];
        r = r + (dark[0] - r) * stormMask * 0.4;
        g = g + (dark[1] - g) * stormMask * 0.4;
        b = b + (dark[2] - b) * stormMask * 0.4;
      }

      const i = (y * w + x) * 4;
      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, b));
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function generateMercury(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      const base = 140;
      const n = fbm(u * 10, v * 10, 10, 5);
      const crater = fbm(u * 20, v * 20, 20, 3);
      const craterMask = Math.max(0, (crater - 0.65) * 4);

      let val = base + (n - 0.5) * 40;
      val -= craterMask * 30;

      const i = (y * w + x) * 4;
      d[i] = Math.max(80, Math.min(200, val * 0.85));
      d[i + 1] = Math.max(80, Math.min(200, val * 0.82));
      d[i + 2] = Math.max(80, Math.min(200, val * 0.78));
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function generateVenus(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const img = ctx.createImageData(w, h);
  const d = img.data;
  const [bR, bG, bB] = hexToRgb('#e8c070');

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      // Swirling cloud bands — uniform yellow-tan with subtle variation
      const n1 = fbm(u * 3, v * 4, 30, 4);
      const n2 = fbm(u * 5 + 5, v * 3 + 5, 40, 3);
      const cloud = n1 * 0.6 + n2 * 0.4;

      const r = bR + (cloud - 0.5) * 35;
      const g = bG + (cloud - 0.5) * 25;
      const b = bB + (cloud - 0.5) * 20;

      const i = (y * w + x) * 4;
      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, b));
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function generateMars(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const img = ctx.createImageData(w, h);
  const d = img.data;

  const [rR, rG, rB] = hexToRgb('#c1440e');
  const [dR, dG, dB] = hexToRgb('#8a2800');

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      const terrain = fbm(u * 6, v * 5, 50, 5);
      const crater = fbm(u * 12, v * 12, 60, 3);

      // Polar ice (small)
      const lat = Math.abs(v - 0.5) * 2;
      const polar = Math.max(0, (lat - 0.9) / 0.1);

      let r = rR + (terrain - 0.5) * 50;
      let g = rG + (terrain - 0.5) * 35;
      let b = rB + (terrain - 0.5) * 25;

      // Dark terrain patches
      if (crater > 0.6) {
        const blend = (crater - 0.6) * 2.5;
        r = r + (dR - r) * blend * 0.6;
        g = g + (dG - g) * blend * 0.6;
        b = b + (dB - b) * blend * 0.6;
      }

      // Polar ice
      if (polar > 0) {
        r = r + (230 - r) * polar * 0.7;
        g = g + (230 - g) * polar * 0.7;
        b = b + (235 - b) * polar * 0.7;
      }

      const i = (y * w + x) * 4;
      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, b));
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function generatePluto(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const img = ctx.createImageData(w, h);
  const d = img.data;

  const [bR, bG, bB] = hexToRgb('#c9b8a8');
  const [dR, dG, dB] = hexToRgb('#8a7560');

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      const n = fbm(u * 8, v * 8, 70, 5);
      const patches = fbm(u * 4, v * 4, 80, 3);

      let r = bR + (n - 0.5) * 30;
      let g = bG + (n - 0.5) * 25;
      let b = bB + (n - 0.5) * 20;

      // Dark patches (Pluto's heart-shaped region variation)
      if (patches > 0.58) {
        const blend = (patches - 0.58) * 3;
        r = r + (dR - r) * blend * 0.5;
        g = g + (dG - g) * blend * 0.5;
        b = b + (dB - b) * blend * 0.5;
      }

      // Light icy patches
      if (patches < 0.35) {
        const blend = (0.35 - patches) * 3;
        r = r + (220 - r) * blend * 0.4;
        g = g + (215 - g) * blend * 0.4;
        b = b + (210 - b) * blend * 0.4;
      }

      const i = (y * w + x) * 4;
      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, b));
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function generateLuna(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      const base = 190;
      const n = fbm(u * 10, v * 10, 44, 5);
      // Maria (dark patches)
      const maria = fbm(u * 3, v * 4, 45, 4);
      const crater = fbm(u * 25, v * 25, 46, 3);
      const craterMask = Math.max(0, (crater - 0.7) * 4);

      let val = base + (n - 0.5) * 30;
      // Dark maria regions
      if (maria > 0.58) {
        val -= (maria - 0.58) * 200;
      }
      // Bright crater rays
      if (craterMask > 0) {
        val += craterMask * 30;
      }
      val = Math.max(100, Math.min(220, val));

      const i = (y * w + x) * 4;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function generateCallisto(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      const base = 90;
      const n = fbm(u * 10, v * 10, 55, 5);
      const crater = fbm(u * 20, v * 20, 56, 4);
      const craterBright = Math.max(0, (crater - 0.7) * 4);

      let val = base + (n - 0.5) * 35;
      if (craterBright > 0) {
        val += craterBright * 40;
      }
      val = Math.max(60, Math.min(160, val));

      const i = (y * w + x) * 4;
      d[i] = val * 0.92;
      d[i + 1] = val * 0.88;
      d[i + 2] = val * 0.82;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function generateIo(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const img = ctx.createImageData(w, h);
  const d = img.data;

  const [yR, yG, yB] = hexToRgb('#e8d888');
  const [vR, vG, vB] = hexToRgb('#4a3800');

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      const n = fbm(u * 8, v * 8, 90, 4);
      const volcanic = fbm(u * 12, v * 12, 91, 3);

      let r = yR + (n - 0.5) * 40;
      let g = yG + (n - 0.5) * 30;
      let b = yB + (n - 0.5) * 15;

      // Dark volcanic spots
      if (volcanic > 0.72) {
        const blend = (volcanic - 0.72) * 4;
        r = r + (vR - r) * blend * 0.7;
        g = g + (vG - g) * blend * 0.7;
        b = b + (vB - b) * blend * 0.7;
      }

      const i = (y * w + x) * 4;
      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, b));
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function generateEuropa(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const img = ctx.createImageData(w, h);
  const d = img.data;

  const [bR, bG, bB] = hexToRgb('#d8e8f0');
  const [lR, lG, lB] = hexToRgb('#a0c0d8');

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      const n = fbm(u * 6, v * 6, 100, 3);
      // Linear crack-like features
      const crack = fbm(u * 15 + v * 3, v * 15 + u * 2, 101, 2);
      const crackMask = Math.max(0, (crack - 0.72) * 5);

      let r = bR + (n - 0.5) * 15;
      let g = bG + (n - 0.5) * 15;
      let b = bB + (n - 0.5) * 10;

      // Brownish crack lines
      if (crackMask > 0) {
        r = r + (lR - r) * crackMask * 0.4;
        g = g + (lG - g) * crackMask * 0.4;
        b = b + (lB - b) * crackMask * 0.4;
      }

      const i = (y * w + x) * 4;
      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, b));
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function generateEnceladus(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      const n = fbm(u * 8, v * 8, 110, 4);
      // Tiger stripe cracks near south pole
      const stripe = fbm(u * 20, v * 25, 111, 2);

      let val = 240 + (n - 0.5) * 12;
      if (stripe > 0.7 && v > 0.75) {
        val -= 30;
      }
      val = Math.max(210, Math.min(255, val));

      const i = (y * w + x) * 4;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = Math.min(255, val + 5);
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function generateGenericRocky(w: number, h: number, seed: number, color: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const [bR, bG, bB] = hexToRgb(color);

  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      const n = fbm(u * 8, v * 8, seed, 4);
      const crater = fbm(u * 16, v * 16, seed + 10, 3);

      let r = bR + (n - 0.5) * 30;
      let g = bG + (n - 0.5) * 25;
      let b = bB + (n - 0.5) * 20;

      if (crater > 0.68) {
        const darken = (crater - 0.68) * 3;
        r -= darken * 25;
        g -= darken * 20;
        b -= darken * 15;
      }

      const i = (y * w + x) * 4;
      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, b));
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// --- Public API ---

const textureCache = new Map<number, THREE.CanvasTexture>();

function makeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function getPlanetTexture(bodyId: number): THREE.CanvasTexture | null {
  if (textureCache.has(bodyId)) return textureCache.get(bodyId)!;

  let canvas: HTMLCanvasElement | null = null;

  switch (bodyId) {
    case 8:  canvas = generateGasGiant(512, 256, ['#6a3810'], ['#c49050', '#d8a860', '#a06030', '#e0c080', '#b07040'], 8); break;
    case 13: canvas = generateGasGiant(512, 256, ['#a08840'], ['#d8c080', '#e8d8a0', '#c0a860', '#e0c890', '#b89850'], 13); break;
    case 16: canvas = generateGasGiant(512, 256, ['#6090a0'], ['#80b8c0', '#90c8d0', '#70a8b0', '#a0d0d8'], 16); break;
    case 18: canvas = generateGasGiant(512, 256, ['#2040a0'], ['#3050b0', '#4060c8', '#2848a8', '#5068d0'], 18); break;
    case 1:  canvas = generateMercury(256, 128); break;
    case 2:  canvas = generateVenus(256, 128); break;
    case 5:  canvas = generateMars(256, 128); break;
    case 20: canvas = generatePluto(256, 128); break;
    case 4:  canvas = generateLuna(128, 64); break;
    case 9:  canvas = generateIo(128, 64); break;
    case 10: canvas = generateEuropa(128, 64); break;
    case 12: canvas = generateCallisto(128, 64); break;
    case 15: canvas = generateEnceladus(128, 64); break;
    case 6:  canvas = generateGenericRocky(64, 32, 106, '#8a7a6a'); break;
    case 7:  canvas = generateGenericRocky(64, 32, 107, '#9a8a7a'); break;
    case 11: canvas = generateGenericRocky(128, 64, 111, '#a89888'); break;
    case 14: canvas = generateGenericRocky(128, 64, 114, '#d8a858'); break;
    case 17: canvas = generateGenericRocky(128, 64, 117, '#9098a0'); break;
    case 19: canvas = generateGenericRocky(128, 64, 119, '#c8d0d8'); break;
  }

  if (!canvas) return null;

  const tex = makeTexture(canvas);
  textureCache.set(bodyId, tex);
  return tex;
}
