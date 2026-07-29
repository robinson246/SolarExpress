import { bodies } from './bodies';

export type PlanetTextureType =
  | 'rocky'        // Mercury, Moon, Charon — cratered gray/brown
  | 'martian'      // Mars — red deserts, polar caps
  | 'gas-giant'    // Jupiter, Saturn — colored bands
  | 'ice-giant'    // Uranus, Neptune — smooth bands
  | 'icy'          // Europa, Ganymede, Enceladus, Triton — cracked ice
  | 'volcanic'     // Io — sulfur yellow, lava
  | 'hazy'         // Venus, Titan — thick atmosphere
  | 'earth'        // Earth — oceans, continents, clouds
  | 'cratered';    // Callisto — heavily cratered dark

export type NFTArtConfig = {
  planetGradient: [string, string];
  planetGlow: string;
  bgGradient: [string, string];
  accentColor: string;
  orbitColor: string;
  tagline: string;
  textureType: PlanetTextureType;
  atmosphereColor?: string;
  spotColor?: string;
  bandColors?: string[];
};

const artConfigs: Record<number, NFTArtConfig> = {
  1: { // Mercury
    planetGradient: ['#c4b8a0', '#5c5346'],
    planetGlow: '#fbbf24',
    bgGradient: ['#1a0a00', '#111827'],
    accentColor: '#fbbf24',
    orbitColor: '#f59e0b',
    tagline: 'Scorched cratered dash past the Sun',
    textureType: 'rocky',
    atmosphereColor: '#fbbf24',
  },
  2: { // Venus
    planetGradient: ['#fde68a', '#d97706'],
    planetGlow: '#f59e0b',
    bgGradient: ['#1c1000', '#111827'],
    accentColor: '#fbbf24',
    orbitColor: '#d97706',
    tagline: 'Thick clouds crushing pressure',
    textureType: 'hazy',
    atmosphereColor: '#fde68a',
    spotColor: '#92400e',
  },
  3: { // Earth
    planetGradient: ['#60a5fa', '#1e3a8a'],
    planetGlow: '#3b82f6',
    bgGradient: ['#0a1628', '#111827'],
    accentColor: '#3b82f6',
    orbitColor: '#60a5fa',
    tagline: 'Home base',
    textureType: 'earth',
    atmosphereColor: '#93c5fd',
  },
  4: { // Moon
    planetGradient: ['#d1d5db', '#6b7280'],
    planetGlow: '#9ca3af',
    bgGradient: ['#0f172a', '#111827'],
    accentColor: '#9ca3af',
    orbitColor: '#d1d5db',
    tagline: 'Earth\'s own Moon',
    textureType: 'rocky',
  },
  5: { // Mars
    planetGradient: ['#fca5a5', '#b91c1c'],
    planetGlow: '#ef4444',
    bgGradient: ['#1a0a0a', '#111827'],
    accentColor: '#ef4444',
    orbitColor: '#f87171',
    tagline: 'The red frontier',
    textureType: 'martian',
    spotColor: '#dc2626',
  },
  6: { // Phobos
    planetGradient: ['#a8a29e', '#57534e'],
    planetGlow: '#d97706',
    bgGradient: ['#1c1000', '#111827'],
    accentColor: '#f59e0b',
    orbitColor: '#d97706',
    tagline: 'Lumpy fast-orbiting rock',
    textureType: 'rocky',
  },
  7: { // Deimos
    planetGradient: ['#d6d3d1', '#78716c'],
    planetGlow: '#e7e5e4',
    bgGradient: ['#0f172a', '#111827'],
    accentColor: '#a8a29e',
    orbitColor: '#d6d3d1',
    tagline: 'Smaller quieter than Phobos',
    textureType: 'rocky',
  },
  8: { // Jupiter
    planetGradient: ['#fcd34d', '#b45309'],
    planetGlow: '#f59e0b',
    bgGradient: ['#1a0e00', '#111827'],
    accentColor: '#f59e0b',
    orbitColor: '#fbbf24',
    tagline: 'The giant',
    textureType: 'gas-giant',
    spotColor: '#dc2626',
    bandColors: ['#fcd34d', '#f59e0b', '#d97706', '#92400e', '#fde68a', '#b45309'],
  },
  9: { // Io
    planetGradient: ['#fef08a', '#a16207'],
    planetGlow: '#eab308',
    bgGradient: ['#1a0e00', '#111827'],
    accentColor: '#eab308',
    orbitColor: '#fef08a',
    tagline: 'Most volcanically active body',
    textureType: 'volcanic',
    spotColor: '#dc2626',
  },
  10: { // Europa
    planetGradient: ['#e0f2fe', '#94a3b8'],
    planetGlow: '#38bdf8',
    bgGradient: ['#082f49', '#111827'],
    accentColor: '#38bdf8',
    orbitColor: '#bae6fd',
    tagline: 'Icy shell over a hidden ocean',
    textureType: 'icy',
    atmosphereColor: '#bae6fd',
  },
  11: { // Ganymede
    planetGradient: ['#d1d5db', '#6b7280'],
    planetGlow: '#a3e635',
    bgGradient: ['#0a1a0a', '#111827'],
    accentColor: '#84cc16',
    orbitColor: '#a3e635',
    tagline: 'Largest moon in the solar system',
    textureType: 'icy',
  },
  12: { // Callisto
    planetGradient: ['#78716c', '#292524'],
    planetGlow: '#78716c',
    bgGradient: ['#0f172a', '#111827'],
    accentColor: '#78716c',
    orbitColor: '#a8a29e',
    tagline: 'Ancient heavily cratered calm',
    textureType: 'cratered',
  },
  13: { // Saturn
    planetGradient: ['#fde68a', '#b45309'],
    planetGlow: '#fbbf24',
    bgGradient: ['#1a0e00', '#111827'],
    accentColor: '#fbbf24',
    orbitColor: '#fde68a',
    tagline: 'Ringside seats literally',
    textureType: 'gas-giant',
    bandColors: ['#fde68a', '#fef3c7', '#d97706', '#fcd34d', '#fbbf24', '#92400e'],
  },
  14: { // Titan
    planetGradient: ['#fdba74', '#9a3412'],
    planetGlow: '#ea580c',
    bgGradient: ['#1c0a00', '#111827'],
    accentColor: '#ea580c',
    orbitColor: '#fdba74',
    tagline: 'Thick atmosphere methane lakes',
    textureType: 'hazy',
    atmosphereColor: '#fdba74',
  },
  15: { // Enceladus
    planetGradient: ['#f0f9ff', '#bae6fd'],
    planetGlow: '#38bdf8',
    bgGradient: ['#082f49', '#111827'],
    accentColor: '#38bdf8',
    orbitColor: '#bae6fd',
    tagline: 'Ice geysers erupting from its south pole',
    textureType: 'icy',
    atmosphereColor: '#e0f2fe',
  },
  16: { // Uranus
    planetGradient: ['#a5f3fc', '#0891b2'],
    planetGlow: '#06b6d4',
    bgGradient: ['#0a1a24', '#111827'],
    accentColor: '#06b6d4',
    orbitColor: '#a5f3fc',
    tagline: 'Tilted on its side pale blue-green',
    textureType: 'ice-giant',
    bandColors: ['#a5f3fc', '#67e8f9', '#22d3ee', '#0891b2'],
  },
  17: { // Titania
    planetGradient: ['#94a3b8', '#475569'],
    planetGlow: '#64748b',
    bgGradient: ['#0f172a', '#111827'],
    accentColor: '#64748b',
    orbitColor: '#94a3b8',
    tagline: 'Canyons deep enough to swallow a station',
    textureType: 'rocky',
  },
  18: { // Neptune
    planetGradient: ['#60a5fa', '#1e3a8a'],
    planetGlow: '#3b82f6',
    bgGradient: ['#0a1628', '#111827'],
    accentColor: '#3b82f6',
    orbitColor: '#60a5fa',
    tagline: 'Windiest world in the system',
    textureType: 'ice-giant',
    spotColor: '#1e40af',
    bandColors: ['#60a5fa', '#3b82f6', '#1d4ed8', '#1e3a8a', '#2563eb'],
  },
  19: { // Triton
    planetGradient: ['#fbcfe8', '#9d174d'],
    planetGlow: '#ec4899',
    bgGradient: ['#1a0a14', '#111827'],
    accentColor: '#ec4899',
    orbitColor: '#fbcfe8',
    tagline: 'Captured moon with nitrogen geysers',
    textureType: 'icy',
    atmosphereColor: '#fbcfe8',
  },
  20: { // Pluto
    planetGradient: ['#d6c8b8', '#7a6550'],
    planetGlow: '#c9b8a8',
    bgGradient: ['#0a0a14', '#111827'],
    accentColor: '#c9b8a8',
    orbitColor: '#d6c8b8',
    tagline: 'Farthest scheduled stop',
    textureType: 'rocky',
    spotColor: '#8a7560',
  },
};

export function getNFTArtConfig(bodyId: number): NFTArtConfig | null {
  return artConfigs[bodyId] ?? null;
}

export function getNFTArtDescription(bodyId: number): string {
  const body = bodies.find(b => b.id === bodyId);
  if (!body) return '';
  const cfg = artConfigs[bodyId];
  return cfg?.tagline ?? body.description;
}

export const STAR_POSITIONS = [
  [70, 80], [120, 190], [620, 120], [540, 200],
  [610, 350], [420, 110], [200, 90], [340, 180],
  [90, 500], [640, 540], [550, 720], [180, 760],
  [50, 300], [660, 400], [80, 650], [600, 800],
  [150, 50], [500, 60], [300, 850], [400, 880],
] as const;
