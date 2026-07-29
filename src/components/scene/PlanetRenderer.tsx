'use client';

import { Suspense, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const SRGB = THREE.SRGBColorSpace;

function configureTexture(tex: THREE.Texture): THREE.Texture {
  tex.colorSpace = SRGB;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  return tex;
}

// ─── Procedural noise for procedural textures ───
function hash(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + s * 1274126177) | 0;
  h = ((h ^ (h >> 13)) * 1103515245) | 0;
  return (h & 0x7fffffff) / 0x7fffffff;
}
function smoothN(x: number, y: number, s: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return (hash(ix,iy,s)*(1-sx)+hash(ix+1,iy,s)*sx)*(1-sy)+
         (hash(ix,iy+1,s)*(1-sx)+hash(ix+1,iy+1,s)*sx)*sy;
}
function fbm(x: number, y: number, s: number, oct: number): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * smoothN(x*f, y*f, s+i*31); a *= 0.5; f *= 2; }
  return v;
}

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  return [parseInt(c.substring(0,2),16), parseInt(c.substring(2,4),16), parseInt(c.substring(4,6),16)];
}

// ─── Enhanced procedural textures for moons without real textures ───
function generateMoonTexture(w: number, h: number, config: {
  baseColor: string;
  darkColor?: string;
  seed: number;
  craterDensity: number;
  featureScale: number;
  colorVariation: number;
  darkPatches?: boolean;
  patchScale?: number;
}): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const [bR,bG,bB] = hexToRgb(config.baseColor);
  const [dR,dG,dB] = hexToRgb(config.darkColor || config.baseColor);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      const n = fbm(u * config.featureScale, v * config.featureScale, config.seed, 5);
      const crater = fbm(u * config.craterDensity, v * config.craterDensity, config.seed + 100, 3);
      const craterMask = Math.max(0, (crater - 0.68) * 4);
      const craterRim = Math.max(0, (crater - 0.65) * 6) * 0.3;

      let r = bR + (n - 0.5) * config.colorVariation;
      let g = bG + (n - 0.5) * config.colorVariation * 0.85;
      let b = bB + (n - 0.5) * config.colorVariation * 0.7;

      if (config.darkPatches && config.patchScale) {
        const patches = fbm(u * config.patchScale, v * config.patchScale, config.seed + 200, 3);
        if (patches > 0.58) {
          const blend = (patches - 0.58) * 2.6;
          r = r + (dR - r) * blend * 0.5;
          g = g + (dG - g) * blend * 0.5;
          b = b + (dB - b) * blend * 0.5;
        }
      }

      r -= craterMask * 20;
      g -= craterMask * 18;
      b -= craterMask * 15;
      r += craterRim * 30;
      g += craterRim * 28;
      b += craterRim * 25;

      const i = (y * w + x) * 4;
      d[i]   = Math.max(0, Math.min(255, r));
      d[i+1] = Math.max(0, Math.min(255, g));
      d[i+2] = Math.max(0, Math.min(255, b));
      d[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function generateIoTexture(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x/w, v = y/h;
      const n = fbm(u*8, v*8, 90, 4);
      const volcanic = fbm(u*12, v*12, 91, 3);
      const sulfur = fbm(u*5, v*5, 92, 3);
      const [yR,yG,yB] = hexToRgb('#e8d888');
      const [vR,vG,vB] = hexToRgb('#4a3800');
      const [oR,oG,oB] = hexToRgb('#d85020');
      let r = yR + (n-0.5)*40;
      let g = yG + (n-0.5)*30;
      let b = yB + (n-0.5)*15;
      if (sulfur > 0.65) { const bl=(sulfur-0.65)*2.86; r=r+(oR-r)*bl*0.5; g=g+(oG-g)*bl*0.5; b=b+(oB-b)*bl*0.4; }
      if (volcanic > 0.72) { const bl=(volcanic-0.72)*4; r=r+(vR-r)*bl*0.7; g=g+(vG-g)*bl*0.7; b=b+(vB-b)*bl*0.7; }
      const i=(y*w+x)*4;
      d[i]=Math.max(0,Math.min(255,r)); d[i+1]=Math.max(0,Math.min(255,g));
      d[i+2]=Math.max(0,Math.min(255,b)); d[i+3]=255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function generateEuropaTexture(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x/w, v = y/h;
      const n = fbm(u*6, v*6, 100, 3);
      const crack = fbm(u*15+v*3, v*15+u*2, 101, 2);
      const crackMask = Math.max(0, (crack-0.72)*5);
      const [bR,bG,bB] = hexToRgb('#d8e8f0');
      const [lR,lG,lB] = hexToRgb('#a08060');
      let r=bR+(n-0.5)*15, g=bG+(n-0.5)*15, b=bB+(n-0.5)*10;
      if (crackMask>0) { r=r+(lR-r)*crackMask*0.5; g=g+(lG-g)*crackMask*0.5; b=b+(lB-b)*crackMask*0.5; }
      const i=(y*w+x)*4;
      d[i]=Math.max(0,Math.min(255,r)); d[i+1]=Math.max(0,Math.min(255,g));
      d[i+2]=Math.max(0,Math.min(255,b)); d[i+3]=255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function generateEnceladusTexture(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x/w, v = y/h;
      const n = fbm(u*8, v*8, 110, 4);
      const stripe = fbm(u*20, v*25, 111, 2);
      let val = 240 + (n-0.5)*12;
      if (stripe>0.7 && v>0.75) val -= 30;
      val = Math.max(210, Math.min(255, val));
      const i=(y*w+x)*4;
      d[i]=val; d[i+1]=val; d[i+2]=Math.min(255,val+5); d[i+3]=255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function generateTitanTexture(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const [bR,bG,bB] = hexToRgb('#d8a858');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x/w, v = y/h;
      const n1 = fbm(u*3, v*4, 120, 4);
      const n2 = fbm(u*5+5, v*3+5, 121, 3);
      const cloud = n1*0.6 + n2*0.4;
      const lat = Math.abs(v-0.5)*2;
      const haze = Math.exp(-Math.pow(lat*2,2))*0.15;
      const r=bR+(cloud-0.5)*25+haze*30;
      const g=bG+(cloud-0.5)*20+haze*25;
      const b=bB+(cloud-0.5)*15+haze*15;
      const i=(y*w+x)*4;
      d[i]=Math.max(0,Math.min(255,r)); d[i+1]=Math.max(0,Math.min(255,g));
      d[i+2]=Math.max(0,Math.min(255,b)); d[i+3]=255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function generateTritonTexture(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const [bR,bG,bB] = hexToRgb('#d1495b');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x/w, v = y/h;
      const n = fbm(u*8, v*8, 130, 4);
      const terrain = fbm(u*6, v*6, 131, 3);
      const cantaloupe = fbm(u*20, v*20, 132, 3);
      let r=bR+(n-0.5)*20+(terrain-0.5)*15;
      let g=bG+(n-0.5)*18+(terrain-0.5)*12;
      let b=bB+(n-0.5)*15+(terrain-0.5)*10;
      if (cantaloupe>0.65) { const bl=(cantaloupe-0.65)*2.86; r-=(bl*15); g-=(bl*12); b-=(bl*10); }
      const lat = Math.abs(v-0.5)*2;
      if (lat>0.85) { const pol=(lat-0.85)/0.15; r=r+(240-r)*pol*0.5; g=g+(200-g)*pol*0.5; b=b+(180-b)*pol*0.5; }
      const i=(y*w+x)*4;
      d[i]=Math.max(0,Math.min(255,r)); d[i+1]=Math.max(0,Math.min(255,g));
      d[i+2]=Math.max(0,Math.min(255,b)); d[i+3]=255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function generateGenericCratered(w: number, h: number, seed: number, base: string, dark: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const [bR,bG,bB] = hexToRgb(base);
  const [dR,dG,dB] = hexToRgb(dark);
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u=x/w, v=y/h;
      const n = fbm(u*10, v*10, seed, 5);
      const crater = fbm(u*20, v*20, seed+10, 3);
      const craterMask = Math.max(0, (crater-0.68)*4);
      let r=bR+(n-0.5)*30, g=bG+(n-0.5)*25, b=bB+(n-0.5)*20;
      if (crater>0.6) { const bl=(crater-0.6)*2.5; r=r+(dR-r)*bl*0.4; g=g+(dG-g)*bl*0.4; b=b+(dB-b)*bl*0.4; }
      r-=craterMask*15; g-=craterMask*12; b-=craterMask*10;
      const i=(y*w+x)*4;
      d[i]=Math.max(0,Math.min(255,r)); d[i+1]=Math.max(0,Math.min(255,g));
      d[i+2]=Math.max(0,Math.min(255,b)); d[i+3]=255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// ─── Saturn ring procedural texture ───
function generateSaturnRingTexture(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x/w, v = y/h;
      const radius = v;
      const ringNoise = fbm(u*40, radius*200, 300, 4);
      const gap1 = Math.exp(-Math.pow((radius-0.35)*40,2));
      const gap2 = Math.exp(-Math.pow((radius-0.55)*50,2));
      const gap3 = Math.exp(-Math.pow((radius-0.72)*40,2));
      const gaps = 1 - gap1*0.85 - gap2*0.95 - gap3*0.7;
      const bandBase = fbm(u*30, radius*100, 301, 3);
      const [tR,tG,tB] = [0.76,0.70,0.55];
      const [bR,bG,bB] = [0.62,0.55,0.40];
      const blend = bandBase*0.5+0.25;
      let r=(tR+(bR-tR)*blend)*255;
      let g=(tG+(bG-tG)*blend)*255;
      let b=(tB+(bB-tB)*blend)*255;
      r+=(ringNoise-0.5)*20;
      g+=(ringNoise-0.5)*18;
      b+=(ringNoise-0.5)*15;
      const alpha = Math.min(1, Math.max(0, gaps*(0.45+bandBase*0.35)));
      const i=(y*w+x)*4;
      d[i]=Math.max(0,Math.min(255,r));
      d[i+1]=Math.max(0,Math.min(255,g));
      d[i+2]=Math.max(0,Math.min(255,b));
      d[i+3]=Math.round(alpha*255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// ─── Atmospheric glow shader ───
const ATMO_VS = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMO_FS = `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = 1.0 - dot(vNormal, viewDir);
    fresnel = pow(fresnel, uPower);
    gl_FragColor = vec4(uColor, fresnel * uIntensity);
  }
`;

// ─── Body configurations ───
interface BodyConfig {
  texPath?: string;
  bumpPath?: string;
  roughness: number;
  metalness: number;
  bumpScale?: number;
  segments: number;
  color?: string;
  procedural?: 'io' | 'europa' | 'enceladus' | 'titan' | 'triton' | 'phobos' | 'deimos' | 'ganymede' | 'callisto' | 'titania' | 'pluto' | 'moon';
  atmosphere?: { color: [number, number, number]; intensity: number; power: number; scale: number };
  ring?: boolean;
  ringInner?: number;
  ringOuter?: number;
}

const BODY_CONFIGS: Record<number, BodyConfig> = {
  1:  { texPath: '/textures/mercury/surface.jpg', roughness: 0.95, metalness: 0.0, segments: 96 },
  2:  { texPath: '/textures/venus/surface.jpg', roughness: 0.85, metalness: 0.0, segments: 96, atmosphere: { color: [0.95, 0.85, 0.6], intensity: 0.5, power: 3.0, scale: 1.035 } },
  5:  { texPath: '/textures/mars/surface.jpg', roughness: 0.90, metalness: 0.0, segments: 96, atmosphere: { color: [0.9, 0.5, 0.3], intensity: 0.2, power: 4.0, scale: 1.02 } },
  8:  { texPath: '/textures/jupiter/surface.jpg', roughness: 0.60, metalness: 0.0, segments: 96, atmosphere: { color: [0.85, 0.7, 0.5], intensity: 0.15, power: 3.5, scale: 1.015 } },
  13: { texPath: '/textures/saturn/surface.jpg', roughness: 0.55, metalness: 0.0, segments: 96, ring: true, ringInner: 1.4, ringOuter: 2.4, atmosphere: { color: [0.9, 0.8, 0.6], intensity: 0.15, power: 3.5, scale: 1.015 } },
  16: { texPath: '/textures/uranus/surface.jpg', roughness: 0.60, metalness: 0.0, segments: 96, atmosphere: { color: [0.6, 0.85, 0.9], intensity: 0.2, power: 3.5, scale: 1.02 } },
  18: { texPath: '/textures/neptune/surface.jpg', roughness: 0.55, metalness: 0.0, segments: 96, atmosphere: { color: [0.3, 0.4, 0.9], intensity: 0.2, power: 3.5, scale: 1.02 } },
  20: { procedural: 'pluto', roughness: 0.92, metalness: 0.0, segments: 64, color: '#c9b8a8' },
  // Moons with real textures
  4:  { texPath: '/textures/moon/surface.jpg', roughness: 0.92, metalness: 0.0, segments: 96 },
  // Moons with procedural textures
  9:  { procedural: 'io', roughness: 0.75, metalness: 0.0, segments: 64 },
  10: { procedural: 'europa', roughness: 0.40, metalness: 0.0, segments: 64 },
  11: { procedural: 'ganymede', roughness: 0.85, metalness: 0.0, segments: 64, color: '#a89888' },
  12: { procedural: 'callisto', roughness: 0.95, metalness: 0.0, segments: 64, color: '#6a6058' },
  14: { procedural: 'titan', roughness: 0.65, metalness: 0.0, segments: 64, atmosphere: { color: [0.85, 0.7, 0.4], intensity: 0.4, power: 2.5, scale: 1.04 } },
  15: { procedural: 'enceladus', roughness: 0.30, metalness: 0.0, segments: 64 },
  17: { procedural: 'titania', roughness: 0.75, metalness: 0.0, segments: 64, color: '#9098a0' },
  19: { procedural: 'triton', roughness: 0.55, metalness: 0.0, segments: 64 },
  6:  { procedural: 'phobos', roughness: 0.92, metalness: 0.0, segments: 48, color: '#8a7a6a' },
  7:  { procedural: 'deimos', roughness: 0.90, metalness: 0.0, segments: 48, color: '#9a8a7a' },
};

// ─── Inner layers (loaded inside Suspense) ───
function PlanetLayers({ bodyId, size }: { bodyId: number; size: number }) {
  const config = BODY_CONFIGS[bodyId];

  const texUrlA = config?.texPath || null;
  const texUrlB = config?.bumpPath || null;
  const dummyUrl = '/textures/earth/earth-blue-marble.jpg';
  const texUrls = [texUrlA, texUrlB].filter(Boolean) as string[];
  const loadedTextures = useLoader(THREE.TextureLoader, texUrls.length > 0 ? texUrls : [dummyUrl]);

  const geoSegments = config?.segments || 64;
  const geometry = useMemo(() => new THREE.SphereGeometry(size, geoSegments, geoSegments), [size, geoSegments]);

  if (!config) return null;

  let mapTex: THREE.Texture | undefined;
  let bumpTex: THREE.Texture | undefined;

  if (texUrlA && loadedTextures.length > 0) {
    mapTex = loadedTextures[0];
    configureTexture(mapTex);
    if (texUrlB && loadedTextures.length > 1) {
      bumpTex = loadedTextures[1];
      configureTexture(bumpTex);
    }
  }

  let procTex: THREE.Texture | null = null;
  if (config.procedural) {
    const res = bodyId <= 20 ? 512 : 256;
    let canvas: HTMLCanvasElement | null = null;
    switch (config.procedural) {
      case 'io': canvas = generateIoTexture(res, res/2); break;
      case 'europa': canvas = generateEuropaTexture(res, res/2); break;
      case 'enceladus': canvas = generateEnceladusTexture(res, res/2); break;
      case 'titan': canvas = generateTitanTexture(res, res/2); break;
      case 'triton': canvas = generateTritonTexture(res, res/2); break;
      case 'moon': canvas = generateMoonTexture(res, res/2, { baseColor: '#b8b8b8', darkColor: '#808080', seed: 44, craterDensity: 25, featureScale: 10, colorVariation: 30, darkPatches: true, patchScale: 3 }); break;
      case 'ganymede': canvas = generateMoonTexture(res, res/2, { baseColor: '#a89888', darkColor: '#706050', seed: 111, craterDensity: 20, featureScale: 8, colorVariation: 25, darkPatches: true, patchScale: 4 }); break;
      case 'callisto': canvas = generateMoonTexture(res, res/2, { baseColor: '#6a6058', darkColor: '#403830', seed: 55, craterDensity: 25, featureScale: 10, colorVariation: 35, darkPatches: false }); break;
      case 'titania': canvas = generateGenericCratered(res, res/2, 117, '#9098a0', '#606870'); break;
      case 'phobos': canvas = generateGenericCratered(res, res/2, 106, '#8a7a6a', '#5a4a3a'); break;
      case 'deimos': canvas = generateGenericCratered(res, res/2, 107, '#9a8a7a', '#6a5a4a'); break;
      case 'pluto': canvas = generateMoonTexture(res, res/2, { baseColor: '#c9b8a8', darkColor: '#8a7560', seed: 70, craterDensity: 8, featureScale: 8, colorVariation: 30, darkPatches: true, patchScale: 4 }); break;
    }
    if (canvas) {
      procTex = new THREE.CanvasTexture(canvas);
      configureTexture(procTex);
    }
  }

  const finalMap = mapTex || procTex;

  return (
    <group>
      {/* Surface layer */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={finalMap}
          color={finalMap ? '#ffffff' : (config.color || '#888888')}
          bumpMap={bumpTex}
          bumpScale={config.bumpScale || 0}
          roughness={config.roughness}
          metalness={config.metalness}
          emissive={finalMap ? undefined : (config.color || '#888888')}
          emissiveIntensity={0.1}
          envMapIntensity={0.3}
        />
      </mesh>

      {/* Atmospheric glow */}
      {config.atmosphere && (
        <mesh scale={config.atmosphere.scale}>
          <sphereGeometry args={[size, 64, 64]} />
          <shaderMaterial
            vertexShader={ATMO_VS}
            fragmentShader={ATMO_FS}
            uniforms={{
              uColor: { value: new THREE.Vector3(...config.atmosphere.color) },
              uIntensity: { value: config.atmosphere.intensity },
              uPower: { value: config.atmosphere.power },
            }}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Saturn ring */}
      {config.ring && <SaturnRing size={size} />}
    </group>
  );
}

// ─── Saturn ring component ───
function SaturnRing({ size }: { size: number }) {
  const ringTex = useMemo(() => {
    const canvas = generateSaturnRingTexture(1024, 128);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = SRGB;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.anisotropy = 8;
    return t;
  }, []);

  const ringGeo = useMemo(() => new THREE.RingGeometry(size * 1.4, size * 2.4, 128), [size]);

  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 0.003;
    }
  });

  return (
    <group>
      {/* Ring geometry is in XY plane by default, rotate to match orbital plane */}
      <mesh ref={ringRef} geometry={ringGeo} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          map={ringTex}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          roughness={0.7}
          metalness={0.0}
          alphaTest={0.01}
        />
      </mesh>
      {/* Ring shadow disc on Saturn */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <ringGeometry args={[size * 1.35, size * 2.45, 128]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Fallback while textures load ───
function PlanetFallback({ bodyId, size }: { bodyId: number; size: number }) {
  const config = BODY_CONFIGS[bodyId];
  const color = config?.color || '#666666';
  return (
    <mesh>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
    </mesh>
  );
}

// ─── Main exported component ───
export default function PlanetRenderer({ bodyId, size }: { bodyId: number; size: number }) {
  return (
    <Suspense fallback={<PlanetFallback bodyId={bodyId} size={size} />}>
      <PlanetLayers bodyId={bodyId} size={size} />
    </Suspense>
  );
}
