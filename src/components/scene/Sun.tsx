'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SRGB = THREE.SRGBColorSpace;

/* ── Noise helpers (same pattern as PlanetRenderer) ── */
function hash(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + s * 1274126177) | 0;
  h = ((h ^ (h >> 13)) * 1103515245) | 0;
  return (h & 0x7fffffff) / 0x7fffffff;
}
function smoothN(x: number, y: number, s: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return (hash(ix, iy, s) * (1 - sx) + hash(ix + 1, iy, s) * sx) * (1 - sy) +
    (hash(ix, iy + 1, s) * (1 - sx) + hash(ix + 1, iy + 1, s) * sx) * sy;
}
function fbm(x: number, y: number, s: number, oct: number): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * smoothN(x * f, y * f, s + i * 31); a *= 0.5; f *= 2; }
  return v;
}

/* ── Procedural sun texture ── */
function generateSunTexture(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;

      // Large-scale granulation
      const n1 = fbm(u * 6, v * 6, 10, 5);
      // Medium detail
      const n2 = fbm(u * 14, v * 14, 40, 4);
      // Fine detail
      const n3 = fbm(u * 28, v * 28, 90, 3);

      const surface = n1 * 0.55 + n2 * 0.3 + n3 * 0.15;

      // Bright active regions
      const active = Math.pow(Math.max(fbm(u * 8, v * 8, 60, 3) - 0.45, 0) * 2.2, 2.0);

      // Darker lanes between granulation cells
      const lanes = Math.pow(Math.max(1.0 - fbm(u * 12, v * 12, 70, 3), 0) * 1.4, 3.0);

      // Color: warm orange-yellow palette
      let r = 200 + surface * 55 + active * 40 - lanes * 30;
      let g = 120 + surface * 60 + active * 25 - lanes * 25;
      let b = 20 + surface * 20 + active * 10 - lanes * 15;

      // Subtle limb darkening hint baked into texture
      const cx = u - 0.5, cy = v - 0.5;
      const dist = Math.sqrt(cx * cx + cy * cy) * 2.0;
      const limb = 1.0 - dist * dist * 0.15;
      r *= limb; g *= limb; b *= limb;

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

const SUN_RADIUS = 2.5;

export default function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const canvas = generateSunTexture(1024, 512);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = SRGB;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.015;
    }
  });

  return (
    <mesh ref={meshRef} scale={SUN_RADIUS}>
      <sphereGeometry args={[1, 128, 128]} />
      <meshStandardMaterial
        map={texture}
        emissive={new THREE.Color('#ffa030')}
        emissiveIntensity={1.8}
        emissiveMap={texture}
        toneMapped={false}
      />
    </mesh>
  );
}
