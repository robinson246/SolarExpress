import type { PlanetTextureType } from '@/data/nft-art';

type PlanetRendererProps = {
  cx: number;
  cy: number;
  r: number;
  gradientId: string;
  glowId: string;
  clipId: string;
  shadowId: string;
  textureType: PlanetTextureType;
  colors: [string, string];
  atmosphereColor?: string;
  spotColor?: string;
  bandColors?: string[];
};

export default function PlanetRenderer({
  cx, cy, r, gradientId, glowId, clipId, shadowId,
  textureType, colors, atmosphereColor, spotColor, bandColors,
}: PlanetRendererProps) {
  const s = r / 140; // scale factor relative to the default 140px radius

  return (
    <g>
      {/* Outer glow */}
      <circle cx={cx} cy={cy} r={r * 1.5} fill={`url(#${glowId})`} />

      {/* Planet base */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${gradientId})`} />

      {/* Shadow overlay (lighting from top-left) */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${shadowId})`} opacity='0.4' />

      {/* Texture-specific rendering */}
      {textureType === 'rocky' && <RockyTextures cx={cx} cy={cy} r={r} s={s} baseColor={colors[1]} />}
      {textureType === 'martian' && <MartianTextures cx={cx} cy={cy} r={r} s={s} spotColor={spotColor} />}
      {textureType === 'gas-giant' && <GasGiantTextures cx={cx} cy={cy} r={r} s={s} bandColors={bandColors} spotColor={spotColor} clipId={clipId} />}
      {textureType === 'ice-giant' && <IceGiantTextures cx={cx} cy={cy} r={r} s={s} bandColors={bandColors} spotColor={spotColor} clipId={clipId} />}
      {textureType === 'icy' && <IcyTextures cx={cx} cy={cy} r={r} s={s} atmosphereColor={atmosphereColor} />}
      {textureType === 'volcanic' && <VolcanicTextures cx={cx} cy={cy} r={r} s={s} spotColor={spotColor} />}
      {textureType === 'hazy' && <HazyTextures cx={cx} cy={cy} r={r} s={s} atmosphereColor={atmosphereColor} clipId={clipId} />}
      {textureType === 'earth' && <EarthTextures cx={cx} cy={cy} r={r} s={s} atmosphereColor={atmosphereColor} clipId={clipId} />}
      {textureType === 'cratered' && <CrateredTextures cx={cx} cy={cy} r={r} s={s} />}

      {/* Inner shadow for depth */}
      <circle cx={cx} cy={cy} r={r} fill='none' stroke='black' strokeWidth={r * 0.04} opacity='0.3' />
    </g>
  );
}

/* ─── Lighting/Shadow gradients (defined once globally) ─── */
function RockyTextures({ cx, cy, r, s }: { cx: number; cy: number; r: number; s: number; baseColor: string }) {
  const craters = [
    [0.2, -0.3, 0.12], [0.4, -0.1, 0.08], [-0.3, 0.2, 0.15],
    [-0.1, 0.4, 0.1], [0.5, 0.3, 0.06], [-0.4, -0.2, 0.09],
    [0.1, -0.5, 0.07], [-0.5, 0.1, 0.11], [0.3, 0.5, 0.05],
    [-0.2, -0.4, 0.08], [0.6, -0.1, 0.04], [-0.6, -0.3, 0.06],
    [0.0, 0.6, 0.07], [0.5, -0.4, 0.05], [-0.5, 0.4, 0.08],
  ];
  return (
    <g>
      {craters.map(([dx, dy, dr], i) => (
        <g key={i}>
          <ellipse
            cx={cx + dx * r} cy={cy + dy * r}
            rx={dr * r} ry={dr * r * 0.85}
            fill='rgba(0,0,0,0.25)'
          />
          <ellipse
            cx={cx + dx * r + 1 * s} cy={cy + dy * r + 1 * s}
            rx={dr * r * 0.85} ry={dr * r * 0.75}
            fill='rgba(255,255,255,0.08)'
          />
        </g>
      ))}
      {/* Surface noise dots */}
      {Array.from({ length: 30 }, (_, i) => (
        <circle
          key={`n${i}`}
          cx={cx + (Math.sin(i * 37) * 0.7) * r}
          cy={cy + (Math.cos(i * 53) * 0.7) * r}
          r={1 + Math.abs(Math.sin(i * 11)) * 3 * s}
          fill='rgba(0,0,0,0.08)'
        />
      ))}
    </g>
  );
}

function MartianTextures({ cx, cy, r, s, spotColor }: { cx: number; cy: number; r: number; s: number; spotColor?: string }) {
  return (
    <g>
      {/* North polar cap */}
      <ellipse cx={cx} cy={cy - r * 0.75} rx={r * 0.4} ry={r * 0.15} fill='rgba(255,255,255,0.5)' />
      {/* South polar cap */}
      <ellipse cx={cx} cy={cy + r * 0.75} rx={r * 0.35} ry={r * 0.12} fill='rgba(255,255,255,0.4)' />
      {/* Dark highland regions */}
      <ellipse cx={cx - r * 0.15} cy={cy} rx={r * 0.35} ry={r * 0.4} fill='rgba(0,0,0,0.15)' />
      <ellipse cx={cx + r * 0.3} cy={cy - r * 0.15} rx={r * 0.2} ry={r * 0.25} fill='rgba(0,0,0,0.1)' />
      {/* Volcano region (Tharsis) */}
      <ellipse cx={cx + r * 0.1} cy={cy - r * 0.05} rx={r * 0.25} ry={r * 0.2} fill='rgba(255,200,150,0.15)' />
      {/* Craters */}
      <ellipse cx={cx - r * 0.4} cy={cy + r * 0.2} rx={r * 0.08} ry={r * 0.06} fill='rgba(0,0,0,0.2)' />
      <ellipse cx={cx + r * 0.45} cy={cy + r * 0.3} rx={r * 0.05} ry={r * 0.04} fill='rgba(0,0,0,0.15)' />
      {/* Valles Marineris canyon */}
      <path
        d={`M${cx - r * 0.3} ${cy + r * 0.05} Q${cx - r * 0.15} ${cy + r * 0.1} ${cx + r * 0.1} ${cy + r * 0.08} T${cx + r * 0.35} ${cy + r * 0.02}`}
        stroke='rgba(0,0,0,0.2)' strokeWidth={4 * s} fill='none' strokeLinecap='round'
      />
    </g>
  );
}

function GasGiantTextures({ cx, cy, r, s, bandColors, spotColor, clipId }: {
  cx: number; cy: number; r: number; s: number;
  bandColors?: string[]; spotColor?: string; clipId: string;
}) {
  const colors = bandColors ?? ['#fcd34d', '#f59e0b', '#d97706', '#92400e'];
  const bandCount = colors.length;
  const bandHeight = (r * 2) / bandCount;
  return (
    <g>
      {colors.map((color, i) => (
        <rect
          key={i}
          x={cx - r}
          y={cy - r + i * bandHeight}
          width={r * 2}
          height={bandHeight + 2}
          fill={color}
          opacity={0.5 + Math.sin(i * 1.5) * 0.2}
          clipPath={`url(#${clipId})`}
        />
      ))}
      {/* Turbulence overlay */}
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse
          key={`tb${i}`}
          cx={cx + Math.sin(i * 2.7) * r * 0.6}
          cy={cy - r * 0.6 + i * (r * 2 / 7)}
          rx={r * (0.3 + Math.sin(i * 1.3) * 0.15)}
          ry={bandHeight * 0.3}
          fill='rgba(255,255,255,0.06)'
        />
      ))}
      {/* Great Red Spot / storm */}
      {spotColor && (
        <ellipse cx={cx + r * 0.3} cy={cy + r * 0.2} rx={r * 0.2} ry={r * 0.12} fill={spotColor} opacity='0.6' />
      )}
      {/* Equatorial band */}
      <rect x={cx - r} y={cy - bandHeight * 0.3} width={r * 2} height={bandHeight * 0.6} fill='rgba(255,255,255,0.08)' />
    </g>
  );
}

function IceGiantTextures({ cx, cy, r, s, bandColors, spotColor, clipId }: {
  cx: number; cy: number; r: number; s: number;
  bandColors?: string[]; spotColor?: string; clipId: string;
}) {
  const colors = bandColors ?? ['#a5f3fc', '#67e8f9', '#22d3ee'];
  const bandCount = colors.length;
  const bandHeight = (r * 2) / bandCount;
  return (
    <g>
      {colors.map((color, i) => (
        <rect
          key={i}
          x={cx - r}
          y={cy - r + i * bandHeight + bandHeight * 0.1}
          width={r * 2}
          height={bandHeight * 0.8}
          fill={color}
          opacity='0.3'
          clipPath={`url(#${clipId})`}
        />
      ))}
      {/* Subtle storm */}
      {spotColor && (
        <ellipse cx={cx - r * 0.1} cy={cy + r * 0.15} rx={r * 0.1} ry={r * 0.07} fill={spotColor} opacity='0.3' />
      )}
      {/* Atmosphere glow rim */}
      <circle cx={cx} cy={cy} r={r * 0.98} fill='none' stroke='rgba(255,255,255,0.1)' strokeWidth={r * 0.04} />
    </g>
  );
}

function IcyTextures({ cx, cy, r, s, atmosphereColor }: {
  cx: number; cy: number; r: number; s: number;
  atmosphereColor?: string;
}) {
  const crackPaths = [
    `M${cx - r * 0.5} ${cy - r * 0.2} L${cx - r * 0.3} ${cy - r * 0.1} L${cx - r * 0.1} ${cy - r * 0.3} L${cx + r * 0.2} ${cy - r * 0.15}`,
    `M${cx - r * 0.3} ${cy + r * 0.3} L${cx - r * 0.1} ${cy + r * 0.15} L${cx + r * 0.15} ${cy + r * 0.25} L${cx + r * 0.4} ${cy + r * 0.1}`,
    `M${cx - r * 0.4} ${cy - r * 0.4} L${cx - r * 0.2} ${cy - r * 0.5} L${cx} ${cy - r * 0.35}`,
    `M${cx + r * 0.1} ${cy + r * 0.3} L${cx + r * 0.3} ${cy + r * 0.4} L${cx + r * 0.5} ${cy + r * 0.25}`,
    `M${cx - r * 0.6} ${cy + r * 0.1} L${cx - r * 0.45} ${cy} L${cx - r * 0.3} ${cy + r * 0.1}`,
    `M${cx + r * 0.2} ${cy - r * 0.5} L${cx + r * 0.4} ${cy - r * 0.35} L${cx + r * 0.55} ${cy - r * 0.4}`,
  ];
  return (
    <g>
      {/* Ice fractures / cracks */}
      {crackPaths.map((d, i) => (
        <path key={i} d={d} stroke='rgba(0,0,0,0.15)' strokeWidth={2 * s} fill='none' strokeLinecap='round' />
      ))}
      {/* Bright ice patches */}
      {Array.from({ length: 6 }, (_, i) => (
        <ellipse
          key={`ip${i}`}
          cx={cx + Math.sin(i * 41) * r * 0.5}
          cy={cy + Math.cos(i * 29) * r * 0.5}
          rx={r * 0.08} ry={r * 0.06}
          fill='rgba(255,255,255,0.12)'
        />
      ))}
      {/* Dark ice patches */}
      {Array.from({ length: 4 }, (_, i) => (
        <ellipse
          key={`dp${i}`}
          cx={cx + Math.sin(i * 53) * r * 0.4}
          cy={cy + Math.cos(i * 37) * r * 0.4}
          rx={r * 0.06} ry={r * 0.04}
          fill='rgba(0,0,0,0.08)'
        />
      ))}
    </g>
  );
}

function VolcanicTextures({ cx, cy, r, s, spotColor }: {
  cx: number; cy: number; r: number; s: number;
  spotColor?: string;
}) {
  const lavaColor = spotColor ?? '#dc2626';
  return (
    <g>
      {/* Lava flows */}
      {Array.from({ length: 5 }, (_, i) => (
        <path
          key={`lf${i}`}
          d={`M${cx + Math.sin(i * 43) * r * 0.2} ${cy + Math.cos(i * 37) * r * 0.2}
              Q${cx + Math.sin(i * 43 + 0.5) * r * 0.4} ${cy + Math.cos(i * 37 + 0.5) * r * 0.3}
              ${cx + Math.sin(i * 43 + 1) * r * 0.5} ${cy + Math.cos(i * 37 + 1) * r * 0.5}`}
          stroke={lavaColor} strokeWidth={3 * s} fill='none' opacity='0.5' strokeLinecap='round'
        />
      ))}
      {/* Volcanic vents */}
      {Array.from({ length: 4 }, (_, i) => (
        <circle
          key={`vv${i}`}
          cx={cx + Math.sin(i * 67) * r * 0.25}
          cy={cy + Math.cos(i * 53) * r * 0.25}
          r={4 * s}
          fill={lavaColor}
          opacity='0.7'
        />
      ))}
      {/* Sulfur deposits */}
      {Array.from({ length: 8 }, (_, i) => (
        <circle
          key={`sd${i}`}
          cx={cx + Math.sin(i * 31) * r * 0.6}
          cy={cy + Math.cos(i * 47) * r * 0.6}
          r={3 + Math.random() * 5 * s}
          fill='rgba(255,200,0,0.15)'
        />
      ))}
    </g>
  );
}

function HazyTextures({ cx, cy, r, s, atmosphereColor, clipId }: {
  cx: number; cy: number; r: number; s: number;
  atmosphereColor?: string; clipId: string;
}) {
  const hazeColor = atmosphereColor ?? '#fde68a';
  return (
    <g>
      <g clipPath={`url(#${clipId})`}>
        {/* Cloud swirls */}
        {Array.from({ length: 6 }, (_, i) => (
          <ellipse
            key={`cs${i}`}
            cx={cx + Math.sin(i * 2.1) * r * 0.5}
            cy={cy - r * 0.6 + i * (r * 2 / 5)}
            rx={r * (0.3 + Math.sin(i * 1.7) * 0.15)}
            ry={r * 0.06}
            fill='rgba(255,255,255,0.08)'
          />
        ))}
        {/* Dense cloud patches */}
        {Array.from({ length: 4 }, (_, i) => (
          <ellipse
            key={`dc${i}`}
            cx={cx + Math.sin(i * 53) * r * 0.4}
            cy={cy + Math.cos(i * 37) * r * 0.3}
            rx={r * 0.15} ry={r * 0.08}
            fill={hazeColor}
            opacity='0.08'
          />
        ))}
      </g>
      {/* Atmosphere glow */}
      <circle cx={cx} cy={cy} r={r * 1.04} fill='none' stroke={hazeColor} strokeWidth={r * 0.06} opacity='0.2' />
      <circle cx={cx} cy={cy} r={r * 1.1} fill='none' stroke={hazeColor} strokeWidth={r * 0.03} opacity='0.1' />
    </g>
  );
}

function EarthTextures({ cx, cy, r, s, atmosphereColor, clipId }: {
  cx: number; cy: number; r: number; s: number;
  atmosphereColor?: string; clipId: string;
}) {
  // Continents as irregular shapes
  const continents = [
    // North America
    `M${cx - r * 0.15} ${cy - r * 0.5} Q${cx - r * 0.1} ${cy - r * 0.45} ${cx - r * 0.05} ${cy - r * 0.4}
     Q${cx - r * 0.02} ${cy - r * 0.35} ${cx - r * 0.08} ${cy - r * 0.25}
     Q${cx - r * 0.15} ${cy - r * 0.2} ${cx - r * 0.2} ${cy - r * 0.25}
     Q${cx - r * 0.25} ${cy - r * 0.3} ${cx - r * 0.2} ${cy - r * 0.4}
     Q${cx - r * 0.18} ${cy - r * 0.45} ${cx - r * 0.15} ${cy - r * 0.5}Z`,
    // South America
    `M${cx - r * 0.1} ${cy - r * 0.2} Q${cx - r * 0.05} ${cy - r * 0.15} ${cx - r * 0.05} ${cy - r * 0.05}
     Q${cx - r * 0.05} ${cy + r * 0.05} ${cx - r * 0.1} ${cy + r * 0.1}
     Q${cx - r * 0.15} ${cy + r * 0.15} ${cx - r * 0.15} ${cy + r * 0.1}
     Q${cx - r * 0.15} ${cy} ${cx - r * 0.12} ${cy - r * 0.1}
     Q${cx - r * 0.12} ${cy - r * 0.15} ${cx - r * 0.1} ${cy - r * 0.2}Z`,
    // Europe/Africa
    `M${cx + r * 0.05} ${cy - r * 0.4} Q${cx + r * 0.1} ${cy - r * 0.35} ${cx + r * 0.12} ${cy - r * 0.25}
     Q${cx + r * 0.15} ${cy - r * 0.15} ${cx + r * 0.12} ${cy - r * 0.05}
     Q${cx + r * 0.1} ${cy + r * 0.05} ${cx + r * 0.08} ${cy + r * 0.15}
     Q${cx + r * 0.05} ${cy + r * 0.2} ${cx + r * 0.02} ${cy + r * 0.15}
     Q${cx} ${cy + r * 0.05} ${cx + r * 0.02} ${cy - r * 0.05}
     Q${cx + r * 0.02} ${cy - r * 0.15} ${cx + r * 0.03} ${cy - r * 0.3}
     Q${cx + r * 0.03} ${cy - r * 0.35} ${cx + r * 0.05} ${cy - r * 0.4}Z`,
    // Asia
    `M${cx + r * 0.12} ${cy - r * 0.35} Q${cx + r * 0.2} ${cy - r * 0.3} ${cx + r * 0.3} ${cy - r * 0.25}
     Q${cx + r * 0.35} ${cy - r * 0.2} ${cx + r * 0.35} ${cy - r * 0.1}
     Q${cx + r * 0.3} ${cy} ${cx + r * 0.25} ${cy + r * 0.05}
     Q${cx + r * 0.2} ${cy + r * 0.1} ${cx + r * 0.15} ${cy + r * 0.05}
     Q${cx + r * 0.12} ${cy} ${cx + r * 0.12} ${cy - r * 0.1}
     Q${cx + r * 0.1} ${cy - r * 0.2} ${cx + r * 0.12} ${cy - r * 0.35}Z`,
    // Australia
    `M${cx + r * 0.25} ${cy + r * 0.25} Q${cx + r * 0.3} ${cy + r * 0.2} ${cx + r * 0.35} ${cy + r * 0.22}
     Q${cx + r * 0.38} ${cy + r * 0.25} ${cx + r * 0.35} ${cy + r * 0.3}
     Q${cx + r * 0.3} ${cy + r * 0.32} ${cx + r * 0.25} ${cy + r * 0.3}
     Q${cx + r * 0.22} ${cy + r * 0.28} ${cx + r * 0.25} ${cy + r * 0.25}Z`,
  ];

  return (
    <g>
      <g clipPath={`url(#${clipId})`}>
        {/* Continents */}
        {continents.map((d, i) => (
          <path key={i} d={d} fill='rgba(34,120,50,0.6)' />
        ))}
        {/* Cloud systems */}
        {Array.from({ length: 6 }, (_, i) => (
          <ellipse
            key={`cl${i}`}
            cx={cx + Math.sin(i * 2.3) * r * 0.5}
            cy={cy + Math.cos(i * 1.7) * r * 0.4}
            rx={r * (0.12 + Math.sin(i * 1.3) * 0.05)}
            ry={r * 0.04}
            fill='rgba(255,255,255,0.15)'
          />
        ))}
        {/* Polar ice caps */}
        <ellipse cx={cx} cy={cy - r * 0.7} rx={r * 0.3} ry={r * 0.1} fill='rgba(255,255,255,0.3)' />
        <ellipse cx={cx} cy={cy + r * 0.7} rx={r * 0.25} ry={r * 0.08} fill='rgba(255,255,255,0.2)' />
      </g>
      {/* Atmosphere glow */}
      {atmosphereColor && (
        <circle cx={cx} cy={cy} r={r * 1.03} fill='none' stroke={atmosphereColor} strokeWidth={r * 0.04} opacity='0.3' />
      )}
    </g>
  );
}

function CrateredTextures({ cx, cy, r, s }: { cx: number; cy: number; r: number; s: number }) {
  const craters = [
    [-0.4, -0.3, 0.2], [0.3, -0.35, 0.15], [-0.2, 0.3, 0.18],
    [0.4, 0.25, 0.12], [-0.5, 0.05, 0.08], [0.5, -0.1, 0.1],
    [0.0, -0.5, 0.14], [-0.35, 0.4, 0.07], [0.2, 0.5, 0.06],
    [-0.6, -0.1, 0.05], [0.6, 0.15, 0.04], [0.0, 0.6, 0.05],
    [-0.15, -0.6, 0.06], [0.45, -0.4, 0.04], [-0.4, -0.4, 0.09],
  ];
  return (
    <g>
      {/* Base surface variation */}
      {Array.from({ length: 20 }, (_, i) => (
        <circle
          key={`sv${i}`}
          cx={cx + Math.sin(i * 43) * r * 0.65}
          cy={cy + Math.cos(i * 29) * r * 0.65}
          r={3 + Math.abs(Math.sin(i * 17)) * 8 * s}
          fill='rgba(0,0,0,0.05)'
        />
      ))}
      {/* Craters */}
      {craters.map(([dx, dy, dr], i) => (
        <g key={i}>
          <ellipse
            cx={cx + dx * r} cy={cy + dy * r}
            rx={dr * r} ry={dr * r * 0.85}
            fill='rgba(0,0,0,0.2)'
          />
          <ellipse
            cx={cx + dx * r - dr * r * 0.1}
            cy={cy + dy * r - dr * r * 0.1}
            rx={dr * r * 0.7} ry={dr * r * 0.6}
            fill='rgba(0,0,0,0.1)'
          />
          <ellipse
            cx={cx + dx * r + dr * r * 0.05}
            cy={cy + dy * r + dr * r * 0.05}
            rx={dr * r * 0.9} ry={dr * r * 0.75}
            fill='none'
            stroke='rgba(255,255,255,0.05)'
            strokeWidth={2 * s}
          />
        </g>
      ))}
    </g>
  );
}
