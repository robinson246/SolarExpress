'use client';

import { Suspense, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const SRGB = THREE.SRGBColorSpace;

function configureTexture(tex: THREE.Texture): THREE.Texture {
  tex.colorSpace = SRGB;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

// ─── Noise for procedural clouds ───
function hashN(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + s * 1274126177) | 0;
  h = ((h ^ (h >> 13)) * 1103515245) | 0;
  return (h & 0x7fffffff) / 0x7fffffff;
}
function smoothN(x: number, y: number, s: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return (hashN(ix,iy,s)*(1-sx)+hashN(ix+1,iy,s)*sx)*(1-sy)+
         (hashN(ix,iy+1,s)*(1-sx)+hashN(ix+1,iy+1,s)*sx)*sy;
}
function fbm(x: number, y: number, s: number, oct: number): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * smoothN(x*f, y*f, s+i*31); a *= 0.5; f *= 2; }
  return v;
}

// Generate procedural equirectangular cloud texture
function generateCloudTexture(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      const lat = Math.abs(v - 0.5) * 2;

      // Distortion for swirling
      const da = fbm(u * 2, v * 2, 60, 3) * Math.PI * 2;
      const dd = fbm(u * 3 + 10, v * 3 + 10, 61, 2) * 0.04;
      const cu = u + Math.cos(da) * dd;
      const cv = v + Math.sin(da) * dd;

      // Multi-scale clouds
      const c1 = fbm(cu * 4, cv * 3, 70, 5);
      const c2 = fbm(cu * 8 + 50, cv * 6 + 50, 71, 4);
      const c3 = fbm(cu * 14 + 100, cv * 11 + 100, 72, 3);

      // Tropical band (ITCZ) + mid-latitude storm tracks
      const tropical = Math.max(0, 1 - Math.abs(v - 0.48) * 8) * 0.25;
      const storm = Math.exp(-Math.pow((lat - 0.45) * 5, 2)) * 0.2 +
                    Math.exp(-Math.pow((lat - 0.55) * 5, 2)) * 0.18;

      let cover = c1 * 0.5 + c2 * 0.3 + c3 * 0.15 + tropical + storm;
      cover = Math.max(0, cover - 0.3) * 2.5;
      cover = Math.min(0.85, cover);

      const alpha = cover * (0.6 + c3 * 0.3);
      const brightness = Math.min(1, 0.85 + c3 * 0.15);
      const val = Math.round(brightness * 255);

      const pi = (y * w + x) * 4;
      d[pi] = val; d[pi+1] = val; d[pi+2] = val;
      d[pi+3] = Math.round(Math.min(1, alpha) * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// ─── Texture URLs (local, served from public/) ───
const TEX = {
  day:      '/textures/earth/earth-blue-marble.jpg',
  bump:     '/textures/earth/earth-topology.png',
  night:    '/textures/earth/earth-night.jpg',
  specular: '/textures/earth/earth-water.png',
};

// ─── Atmosphere shader ───
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
  uniform vec3 uSunDir;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = 1.0 - dot(vNormal, viewDir);
    fresnel = pow(fresnel, 3.5);
    float sunFacing = dot(vNormal, uSunDir);
    float sunGlow = smoothstep(-0.1, 0.4, sunFacing);
    float alpha = fresnel * (0.35 + sunGlow * 0.25);
    alpha = clamp(alpha, 0.0, 0.55);
    vec3 col = mix(vec3(0.3, 0.5, 0.9), vec3(0.5, 0.7, 1.0), sunGlow);
    gl_FragColor = vec4(col, alpha);
  }
`;

// ─── Night lights shader ───
const NIGHT_VS = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NIGHT_FS = `
  uniform sampler2D uNightMap;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    float NdotL = dot(vNormal, uSunDir);
    float nightFactor = smoothstep(0.05, -0.15, NdotL);
    vec4 nightColor = texture2D(uNightMap, vUv);
    float brightness = (nightColor.r + nightColor.g + nightColor.b) / 3.0;
    float emission = brightness * nightFactor * 1.8;
    vec3 warmLight = nightColor.rgb * vec3(1.1, 0.95, 0.7);
    gl_FragColor = vec4(warmLight * emission, emission);
  }
`;

// ─── Inner Earth layers (loaded inside Suspense) ───
function EarthLayers({ size }: { size: number }) {
  const [dayMap, bumpMap, nightMap, specMap] = useLoader(THREE.TextureLoader, [
    TEX.day, TEX.bump, TEX.night, TEX.specular,
  ]);

  useMemo(() => {
    [dayMap, bumpMap, nightMap, specMap].forEach(t => configureTexture(t));
  }, [dayMap, bumpMap, nightMap, specMap]);

  // Procedural cloud texture
  const cloudTex = useMemo(() => {
    const canvas = generateCloudTexture(1024, 512);
    const tex = new THREE.CanvasTexture(canvas);
    configureTexture(tex);
    return tex;
  }, []);

  const cloudRef = useRef<THREE.Mesh>(null);

  const sunDir = useMemo(() => new THREE.Vector3(1, 0.4, 0.8).normalize(), []);

  useFrame((_, delta) => {
    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.008;
    }
  });

  const dayGeometry = useMemo(() => new THREE.SphereGeometry(size, 96, 96), [size]);

  return (
    <group>
      {/* Layer 1: Day surface (PBR) */}
      <mesh geometry={dayGeometry}>
        <meshStandardMaterial
          map={dayMap}
          bumpMap={bumpMap}
          bumpScale={0.015}
          roughnessMap={specMap}
          roughness={0.85}
          metalness={0.0}
          envMapIntensity={0.3}
        />
      </mesh>

      {/* Layer 2: Night city lights */}
      <mesh geometry={dayGeometry}>
        <shaderMaterial
          vertexShader={NIGHT_VS}
          fragmentShader={NIGHT_FS}
          uniforms={{
            uNightMap: { value: nightMap },
            uSunDir: { value: sunDir },
          }}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Layer 3: Clouds (procedural) */}
      <mesh ref={cloudRef} geometry={dayGeometry} scale={1.008}>
        <meshStandardMaterial
          map={cloudTex}
          alphaMap={cloudTex}
          transparent
          opacity={0.5}
          depthWrite={false}
          side={THREE.DoubleSide}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Layer 4: Atmosphere (Fresnel rim glow) */}
      <mesh scale={1.025}>
        <sphereGeometry args={[size, 64, 64]} />
        <shaderMaterial
          vertexShader={ATMO_VS}
          fragmentShader={ATMO_FS}
          uniforms={{
            uSunDir: { value: sunDir },
          }}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// ─── Fallback while textures load ───
function EarthFallback({ size }: { size: number }) {
  return (
    <mesh>
      <sphereGeometry args={[size, 64, 64]} />
      <meshStandardMaterial color="#1a3a5c" roughness={0.9} metalness={0} />
    </mesh>
  );
}

// ─── Main exported component ───
export default function Earth({ size }: { size: number }) {
  return (
    <Suspense fallback={<EarthFallback size={size} />}>
      <EarthLayers size={size} />
    </Suspense>
  );
}
