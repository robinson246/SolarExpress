'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import Planet from './Planet';
import PlanetRenderer from './PlanetRenderer';
import Sun from './Sun';
import { Body } from '@/data/bodies';

const MOON_CONFIG: Record<number, { color: string; size: number; orbitRadius: number; roughness: number; metalness: number }> = {
  4:  { color: '#b8b8b8', size: 0.20, orbitRadius: 1.0, roughness: 0.55, metalness: 0.0 },  // Luna — rocky surface
  6:  { color: '#8a7a6a', size: 0.14, orbitRadius: 0.9, roughness: 0.92, metalness: 0.0 },  // Phobos — rough lumpy rock
  7:  { color: '#9a8a7a', size: 0.15, orbitRadius: 1.1, roughness: 0.90, metalness: 0.0 },  // Deimos — rough rock
  9:  { color: '#e8d888', size: 0.22, orbitRadius: 1.2, roughness: 0.75, metalness: 0.0 },  // Io — volcanic sulfur
  10: { color: '#d8e8f0', size: 0.20, orbitRadius: 1.4, roughness: 0.50, metalness: 0.0 },  // Europa — smooth ice
  11: { color: '#a89888', size: 0.25, orbitRadius: 1.6, roughness: 0.85, metalness: 0.0 },  // Ganymede — rocky/dusty
  12: { color: '#6a6058', size: 0.19, orbitRadius: 1.8, roughness: 0.95, metalness: 0.0 },  // Callisto — heavily cratered, very matte
  14: { color: '#d8a858', size: 0.22, orbitRadius: 1.3, roughness: 0.65, metalness: 0.0 },  // Titan — hazy atmosphere
  15: { color: '#f0f4f8', size: 0.18, orbitRadius: 1.1, roughness: 0.45, metalness: 0.0 },  // Enceladus — bright smooth ice
  17: { color: '#9098a0', size: 0.20, orbitRadius: 1.3, roughness: 0.75, metalness: 0.0 },  // Titania — icy rock
  19: { color: '#d1495b', size: 0.20, orbitRadius: 1.2, roughness: 0.55, metalness: 0.0 },  // Triton — pinkish-red nitrogen ice
};

interface SolarSystemProps {
  bodies: Body[];
  focusedPlanetId: number | null;
  selectedMoonId: number | null;
  isFocused: (planetId: number) => boolean;
  onPlanetSelect: (planetId: number) => void;
}

function getPlanetPosition(planets: Body[], planetId: number): THREE.Vector3 | null {
  const index = planets.findIndex(p => p.id === planetId);
  if (index < 0) return null;
  const angle = (index * Math.PI * 2) / planets.length;
  const dist = 5 + index * 3;
  return new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
}

function getMoonWorldPosition(planets: Body[], moon: Body, time: number): THREE.Vector3 | null {
  const parentPos = getPlanetPosition(planets, moon.parentPlanetId!);
  if (!parentPos) return null;
  const cfg = MOON_CONFIG[moon.id];
  if (!cfg) return null;
  const orbitAngle = time * 0.5 + moon.id * 1.7;
  return new THREE.Vector3(
    parentPos.x + Math.cos(orbitAngle) * cfg.orbitRadius,
    0,
    parentPos.z + Math.sin(orbitAngle) * cfg.orbitRadius,
  );
}

function CameraAnimator({
  focusedPlanetId,
  selectedMoonId,
  planets,
  allBodies,
  controlsRef,
  timeRef,
}: {
  focusedPlanetId: number | null;
  selectedMoonId: number | null;
  planets: Body[];
  allBodies: Body[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>;
  timeRef: React.RefObject<number>;
}) {
  const animating = useRef(false);
  const progress = useRef(0);
  const startPos = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const endPos = useRef(new THREE.Vector3());
  const endTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!controlsRef.current) return;

    let target: THREE.Vector3 | null = null;

    if (selectedMoonId !== null) {
      const moon = allBodies.find(b => b.id === selectedMoonId);
      if (moon) target = getMoonWorldPosition(planets, moon, timeRef.current);
    }

    if (!target && focusedPlanetId !== null) {
      target = getPlanetPosition(planets, focusedPlanetId);
    }

    if (!target) return;

    const camOffset = 3;
    endPos.current.set(target.x + camOffset, 2.5, target.z + camOffset);
    endTarget.current.copy(target);

    startPos.current.copy(controlsRef.current.object.position);
    startTarget.current.copy(controlsRef.current.target);

    progress.current = 0;
    animating.current = true;
  }, [focusedPlanetId, selectedMoonId, planets, allBodies, controlsRef, timeRef]);

  useFrame((_, delta) => {
    if (!animating.current || !controlsRef.current) return;

    progress.current = Math.min(progress.current + delta * 1.5, 1);
    const t = 0.5 - Math.cos(Math.PI * progress.current) / 2;

    controlsRef.current.object.position.lerpVectors(startPos.current, endPos.current, t);
    controlsRef.current.target.lerpVectors(startTarget.current, endTarget.current, t);
    controlsRef.current.update();

    if (progress.current >= 1) animating.current = false;
  });

  return null;
}

function MoonRenderer({
  moon,
  planets,
  timeRef,
}: {
  moon: Body;
  planets: Body[];
  timeRef: React.RefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const cfg = MOON_CONFIG[moon.id];

  useFrame(() => {
    const pos = getMoonWorldPosition(planets, moon, timeRef.current);
    if (pos && groupRef.current) {
      groupRef.current.position.copy(pos);
    }
  });

  if (!cfg) return null;

  return (
    <group ref={groupRef}>
      <PlanetRenderer bodyId={moon.id} size={cfg.size} />
      <MoonLabel moon={moon} planets={planets} timeRef={timeRef} />
    </group>
  );
}

function MoonLabel({
  moon,
  planets,
  timeRef,
}: {
  moon: Body;
  planets: Body[];
  timeRef: React.RefObject<number>;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    const pos = getMoonWorldPosition(planets, moon, timeRef.current);
    if (pos && ref.current) {
      ref.current.position.copy(pos);
      ref.current.position.y += 0.4;
    }
  });

  return (
    <group ref={ref}>
      <Html center distanceFactor={15} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            color: '#ffffff',
            fontSize: '11px',
            fontFamily: 'sans-serif',
            textShadow: '0 0 6px rgba(0,0,0,0.9)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {moon.name}
        </div>
      </Html>
    </group>
  );
}

function TimeTracker({ timeRef }: { timeRef: React.RefObject<number> }) {
  useFrame((_, delta) => {
    timeRef.current += delta;
  });
  return null;
}

export default function SolarSystem({ bodies, focusedPlanetId, selectedMoonId, isFocused, onPlanetSelect }: SolarSystemProps) {
  const planets = useMemo(() => bodies.filter(body => body.type === 'planet'), [bodies]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const timeRef = useRef(0);

  const selectedMoon = selectedMoonId ? bodies.find(b => b.id === selectedMoonId) : null;

  return (
    <div className='w-full h-full'>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={{ position: [10, 10, 10], fov: 45 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 8, 10]} intensity={1.0} color="#fff8e8" />
        <hemisphereLight args={['#8b7ab5', '#4a3a2a', 0.4]} />

        <Sun />

        <Stars count={3000} />

        {planets.map((planet, index) => {
          const angle = (index * Math.PI * 2) / planets.length;
          const distanceFromSun = 5 + index * 3;

          return (
            <Planet
              key={planet.id}
              body={planet}
              isFocused={isFocused(planet.id)}
              position={[Math.cos(angle) * distanceFromSun, 0, Math.sin(angle) * distanceFromSun]}
              onClick={() => onPlanetSelect(planet.id)}
            />
          );
        })}

        {selectedMoon && MOON_CONFIG[selectedMoon.id] && (
          <MoonRenderer moon={selectedMoon} planets={planets} timeRef={timeRef} />
        )}

        <TimeTracker timeRef={timeRef} />

        <CameraAnimator
          focusedPlanetId={focusedPlanetId}
          selectedMoonId={selectedMoonId}
          planets={planets}
          allBodies={bodies}
          controlsRef={controlsRef}
          timeRef={timeRef}
        />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          enablePan={false}
          minDistance={3}
          maxDistance={50}
        />
      </Canvas>
    </div>
  );
}
