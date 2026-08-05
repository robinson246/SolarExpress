import { getNFTArtConfig, STAR_POSITIONS } from '@/data/nft-art';
import { bodies } from '@/data/bodies';
import type { PlanetTextureType } from '@/data/nft-art';

type SVGProps = {
  destinationId: number;
  tokenId: number;
  priceEth: string;
  walletAddress?: string;
  passengerClass?: string;
};

const VW = 340;
const VH = 540;

export function generateNFTTicketSVG({ destinationId, tokenId, priceEth, walletAddress, passengerClass }: SVGProps): string {
  const body = bodies.find(b => b.id === destinationId);
  const art = getNFTArtConfig(destinationId);
  if (!body || !art) return '';

  const uid = `nft-${destinationId}-${tokenId}`;
  const logoUid = 'nftlogo';
  const classLabel = passengerClass && passengerClass.length > 0 ? passengerClass : 'economy';

  const stars = STAR_POSITIONS.map(([x, y], i) => {
    const cx = x / (700 / VW);
    const cy = y / (1000 / VH);
    const r = i % 3 === 0 ? 2 : i % 3 === 1 ? 1.5 : 1;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="white" opacity="0.7"/>`;
  }).join('');

  const planetMarkup = generatePlanetSVG(art.textureType, art, uid);

  return `<svg width="${VW}" height="${VH}" viewBox="0 0 ${VW} ${VH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${art.bgGradient[0]}"/>
      <stop offset="100%" stop-color="${art.bgGradient[1]}"/>
    </linearGradient>
    <linearGradient id="panel-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#16233c"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <radialGradient id="planet-${uid}">
      <stop offset="0%" stop-color="${art.planetGradient[0]}"/>
      <stop offset="100%" stop-color="${art.planetGradient[1]}"/>
    </radialGradient>
    <radialGradient id="glow-${uid}">
      <stop offset="0%" stop-color="${art.planetGlow}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${art.planetGlow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="planet-shadow-${uid}" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="60%" stop-color="rgba(0,0,0,0.15)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.5)"/>
    </radialGradient>
    <clipPath id="planet-clip-${uid}">
      <circle cx="170" cy="155" r="65"/>
    </clipPath>
    <radialGradient id="${logoUid}-sun" cx="50%" cy="50%">
      <stop offset="0%" stop-color="#FFE27A"/>
      <stop offset="65%" stop-color="#FFC83D"/>
      <stop offset="100%" stop-color="#FF9800"/>
    </radialGradient>
    <linearGradient id="${logoUid}-orbit" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#C4B5FD"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
    <filter id="${logoUid}-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="${VW}" height="${VH}" rx="20" fill="url(#bg-${uid})"/>
  ${stars}

  <rect x="${VW * 0.057}" y="${VH * 0.03}" width="${VW * 0.886}" height="${VH * 0.94}" rx="18" fill="url(#panel-${uid})" stroke="${art.accentColor}" stroke-width="1"/>

  <text x="${VW * 0.1}" y="${VH * 0.065}" fill="${art.accentColor}" font-size="19" font-family="Roboto" font-weight="bold">SOLAREXPRESS</text>
  <text x="${VW * 0.74}" y="${VH * 0.065}" fill="#94a3b8" font-size="10">ERC-721</text>

  ${planetMarkup}

  <ellipse cx="170" cy="155" rx="90" ry="26" fill="none" stroke="${art.orbitColor}" opacity="0.4"/>

  <text x="${VW * 0.1}" y="247.5" fill="#94a3b8" font-size="11">DESTINATION</text>
  <text x="${VW * 0.1}" y="264" fill="white" font-size="24" font-weight="bold">${escapeXml(body.name.toUpperCase())}</text>
  <text x="${VW * 0.1}" y="275" fill="${art.accentColor}" font-size="13">${body.type === 'planet' ? 'PLANET' : 'MOON'}</text>

  <line x1="${VW * 0.1}" y1="286" x2="${VW * 0.9}" y2="286" stroke="#334155"/>

  <text x="${VW * 0.1}" y="302.5" fill="#94a3b8" font-size="8">TOKEN</text>
  <text x="${VW * 0.1}" y="313.5" fill="white" font-size="13">#${String(tokenId).padStart(3, '0')}</text>

  <text x="${VW * 0.4}" y="302.5" fill="#94a3b8" font-size="8">PRICE</text>
  <text x="${VW * 0.4}" y="313.5" fill="white" font-size="13">${escapeXml(priceEth === '0' || priceEth === '' ? '—' : `${priceEth} ETH`)}</text>

  <text x="${VW * 0.7}" y="302.5" fill="#94a3b8" font-size="8">NETWORK</text>
  <text x="${VW * 0.7}" y="313.5" fill="${art.accentColor}" font-size="13">SEPOLIA</text>

  ${walletAddress ? `<text x="${VW * 0.1}" y="324.5" fill="#94a3b8" font-size="10" font-family="Roboto">${escapeXml(walletAddress.slice(0, 6))}...${escapeXml(walletAddress.slice(-4))}</text>` : ''}

  <rect x="${VW * 0.1}" y="326" width="90" height="22" rx="11" fill="#0f766e"/>
  <text x="${VW * 0.1 + 10}" y="341" fill="white" font-size="9">NFT MINTED</text>

  <text x="${VW * 0.1}" y="362" fill="#94a3b8" font-size="9">PASSENGER CLASS</text>
  <text x="${VW * 0.1}" y="376" fill="white" font-size="14" font-weight="bold">${escapeXml(classLabel)}</text>

  <g transform="translate(${VW * 0.83}, ${VH * 0.90}) scale(0.065)">
    <circle cx="256" cy="256" r="90" fill="#08111F" opacity="0.5"/>
    <circle cx="256" cy="256" r="84" fill="#FFB300" opacity=".35" filter="url(#${logoUid}-glow)"/>
    <circle cx="256" cy="256" r="70" fill="url(#${logoUid}-sun)" opacity="0.55"/>
    <ellipse cx="256" cy="256" rx="170" ry="72" transform="rotate(-18 256 256)" fill="none" stroke="url(#${logoUid}-orbit)" stroke-width="8" opacity="0.55"/>
    <g transform="translate(392 186) rotate(28)" opacity="0.55">
      <path d="M0 -12 L22 0 L0 12 L6 4 L-14 4 L-8 0 L-14 -4 L6 -4 Z" fill="#FFFFFF"/>
      <polygon points="-2,-5 -14,-15 -8,-3" fill="#D1D5DB"/>
      <polygon points="-2,5 -14,15 -8,3" fill="#D1D5DB"/>
      <circle cx="10" cy="0" r="2.5" fill="#A78BFA"/>
      <path d="M-16 0 Q-38 -2 -58 0" fill="none" stroke="#8B5CF6" stroke-width="5" stroke-linecap="round"/>
    </g>
  </g>
</svg>`;
}

function generatePlanetSVG(textureType: PlanetTextureType, art: NonNullable<ReturnType<typeof getNFTArtConfig>>, uid: string): string {
  if (!art) return '';
  const cx = 170;
  const cy = 155;
  const r = 65;
  const s = r / 140;

  let inner = '';

  if (textureType === 'rocky') {
    const craters = [
      [0.2, -0.3, 0.12], [0.4, -0.1, 0.08], [-0.3, 0.2, 0.15],
      [-0.1, 0.4, 0.1], [0.5, 0.3, 0.06], [-0.4, -0.2, 0.09],
      [0.1, -0.5, 0.07], [-0.5, 0.1, 0.11], [0.3, 0.5, 0.05],
      [-0.2, -0.4, 0.08], [0.6, -0.1, 0.04], [-0.6, -0.3, 0.06],
      [0.0, 0.6, 0.07], [0.5, -0.4, 0.05], [-0.5, 0.4, 0.08],
    ];
    inner += craters.map(([dx, dy, dr]) =>
      `<ellipse cx="${cx + dx * r}" cy="${cy + dy * r}" rx="${dr * r}" ry="${dr * r * 0.85}" fill="rgba(0,0,0,0.25)"/>
<ellipse cx="${cx + dx * r + 1 * s}" cy="${cy + dy * r + 1 * s}" rx="${dr * r * 0.85}" ry="${dr * r * 0.75}" fill="rgba(255,255,255,0.08)"/>`
    ).join('');
    for (let i = 0; i < 30; i++) {
      inner += `<circle cx="${cx + Math.sin(i * 37) * 0.7 * r}" cy="${cy + Math.cos(i * 53) * 0.7 * r}" r="${1 + Math.abs(Math.sin(i * 11)) * 3 * s}" fill="rgba(0,0,0,0.08)"/>`;
    }
  }

  if (textureType === 'martian') {
    inner += `
<ellipse cx="${cx}" cy="${cy - r * 0.75}" rx="${r * 0.4}" ry="${r * 0.15}" fill="rgba(255,255,255,0.5)"/>
<ellipse cx="${cx}" cy="${cy + r * 0.75}" rx="${r * 0.35}" ry="${r * 0.12}" fill="rgba(255,255,255,0.4)"/>
<ellipse cx="${cx - r * 0.15}" cy="${cy}" rx="${r * 0.35}" ry="${r * 0.4}" fill="rgba(0,0,0,0.15)"/>
<ellipse cx="${cx + r * 0.3}" cy="${cy - r * 0.15}" rx="${r * 0.2}" ry="${r * 0.25}" fill="rgba(0,0,0,0.1)"/>
<ellipse cx="${cx + r * 0.1}" cy="${cy - r * 0.05}" rx="${r * 0.25}" ry="${r * 0.2}" fill="rgba(255,200,150,0.15)"/>
<ellipse cx="${cx - r * 0.4}" cy="${cy + r * 0.2}" rx="${r * 0.08}" ry="${r * 0.06}" fill="rgba(0,0,0,0.2)"/>
<ellipse cx="${cx + r * 0.45}" cy="${cy + r * 0.3}" rx="${r * 0.05}" ry="${r * 0.04}" fill="rgba(0,0,0,0.15)"/>
<path d="M${cx - r * 0.3} ${cy + r * 0.05} Q${cx - r * 0.15} ${cy + r * 0.1} ${cx + r * 0.1} ${cy + r * 0.08} T${cx + r * 0.35} ${cy + r * 0.02}" stroke="rgba(0,0,0,0.2)" stroke-width="${4 * s}" fill="none" stroke-linecap="round"/>`;
  }

  if (textureType === 'gas-giant') {
    const colors = art.bandColors ?? ['#fcd34d', '#f59e0b', '#d97706', '#92400e'];
    const bandH = (r * 2) / colors.length;
    colors.forEach((color, i) => {
      inner += `<rect x="${cx - r}" y="${cy - r + i * bandH}" width="${r * 2}" height="${bandH + 2}" fill="${color}" opacity="${0.5 + Math.sin(i * 1.5) * 0.2}" clip-path="url(#planet-clip-${uid})"/>`;
    });
    for (let i = 0; i < 8; i++) {
      inner += `<ellipse cx="${cx + Math.sin(i * 2.7) * r * 0.6}" cy="${cy - r * 0.6 + i * (r * 2 / 7)}" rx="${r * (0.3 + Math.sin(i * 1.3) * 0.15)}" ry="${bandH * 0.3}" fill="rgba(255,255,255,0.06)"/>`;
    }
    if (art.spotColor) {
      inner += `<ellipse cx="${cx + r * 0.3}" cy="${cy + r * 0.2}" rx="${r * 0.2}" ry="${r * 0.12}" fill="${art.spotColor}" opacity="0.6"/>`;
    }
    inner += `<rect x="${cx - r}" y="${cy - bandH * 0.3}" width="${r * 2}" height="${bandH * 0.6}" fill="rgba(255,255,255,0.08)"/>`;
  }

  if (textureType === 'ice-giant') {
    const colors = art.bandColors ?? ['#a5f3fc', '#67e8f9', '#22d3ee'];
    const bandH = (r * 2) / colors.length;
    colors.forEach((color, i) => {
      inner += `<rect x="${cx - r}" y="${cy - r + i * bandH + bandH * 0.1}" width="${r * 2}" height="${bandH * 0.8}" fill="${color}" opacity="0.3" clip-path="url(#planet-clip-${uid})"/>`;
    });
    if (art.spotColor) {
      inner += `<ellipse cx="${cx - r * 0.1}" cy="${cy + r * 0.15}" rx="${r * 0.1}" ry="${r * 0.07}" fill="${art.spotColor}" opacity="0.3"/>`;
    }
    inner += `<circle cx="${cx}" cy="${cy}" r="${r * 0.98}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="${r * 0.04}"/>`;
  }

  if (textureType === 'icy') {
    const cracks = [
      `M${cx - r * 0.5} ${cy - r * 0.2} L${cx - r * 0.3} ${cy - r * 0.1} L${cx - r * 0.1} ${cy - r * 0.3} L${cx + r * 0.2} ${cy - r * 0.15}`,
      `M${cx - r * 0.3} ${cy + r * 0.3} L${cx - r * 0.1} ${cy + r * 0.15} L${cx + r * 0.15} ${cy + r * 0.25} L${cx + r * 0.4} ${cy + r * 0.1}`,
      `M${cx - r * 0.4} ${cy - r * 0.4} L${cx - r * 0.2} ${cy - r * 0.5} L${cx} ${cy - r * 0.35}`,
      `M${cx + r * 0.1} ${cy + r * 0.3} L${cx + r * 0.3} ${cy + r * 0.4} L${cx + r * 0.5} ${cy + r * 0.25}`,
      `M${cx - r * 0.6} ${cy + r * 0.1} L${cx - r * 0.45} ${cy} L${cx - r * 0.3} ${cy + r * 0.1}`,
      `M${cx + r * 0.2} ${cy - r * 0.5} L${cx + r * 0.4} ${cy - r * 0.35} L${cx + r * 0.55} ${cy - r * 0.4}`,
    ];
    inner += cracks.map(d =>
      `<path d="${d}" stroke="rgba(0,0,0,0.15)" stroke-width="${2 * s}" fill="none" stroke-linecap="round"/>`
    ).join('');
    for (let i = 0; i < 6; i++) {
      inner += `<ellipse cx="${cx + Math.sin(i * 41) * r * 0.5}" cy="${cy + Math.cos(i * 29) * r * 0.5}" rx="${r * 0.08}" ry="${r * 0.06}" fill="rgba(255,255,255,0.12)"/>`;
    }
    for (let i = 0; i < 4; i++) {
      inner += `<ellipse cx="${cx + Math.sin(i * 53) * r * 0.4}" cy="${cy + Math.cos(i * 37) * r * 0.4}" rx="${r * 0.06}" ry="${r * 0.04}" fill="rgba(0,0,0,0.08)"/>`;
    }
  }

  if (textureType === 'volcanic') {
    const lava = art.spotColor ?? '#dc2626';
    for (let i = 0; i < 5; i++) {
      inner += `<path d="M${cx + Math.sin(i * 43) * r * 0.2} ${cy + Math.cos(i * 37) * r * 0.2} Q${cx + Math.sin(i * 43 + 0.5) * r * 0.4} ${cy + Math.cos(i * 37 + 0.5) * r * 0.3} ${cx + Math.sin(i * 43 + 1) * r * 0.5} ${cy + Math.cos(i * 37 + 1) * r * 0.5}" stroke="${lava}" stroke-width="${3 * s}" fill="none" opacity="0.5" stroke-linecap="round"/>`;
    }
    for (let i = 0; i < 4; i++) {
      inner += `<circle cx="${cx + Math.sin(i * 67) * r * 0.25}" cy="${cy + Math.cos(i * 53) * r * 0.25}" r="${4 * s}" fill="${lava}" opacity="0.7"/>`;
    }
    for (let i = 0; i < 8; i++) {
      inner += `<circle cx="${cx + Math.sin(i * 31) * r * 0.6}" cy="${cy + Math.cos(i * 47) * r * 0.6}" r="${3 + Math.abs(Math.sin(i * 11)) * 5 * s}" fill="rgba(255,200,0,0.15)"/>`;
    }
  }

  if (textureType === 'hazy') {
    const haze = art.atmosphereColor ?? '#fde68a';
    for (let i = 0; i < 6; i++) {
      inner += `<ellipse cx="${cx + Math.sin(i * 2.1) * r * 0.5}" cy="${cy - r * 0.6 + i * (r * 2 / 5)}" rx="${r * (0.3 + Math.sin(i * 1.7) * 0.15)}" ry="${r * 0.06}" fill="rgba(255,255,255,0.08)"/>`;
    }
    for (let i = 0; i < 4; i++) {
      inner += `<ellipse cx="${cx + Math.sin(i * 53) * r * 0.4}" cy="${cy + Math.cos(i * 37) * r * 0.3}" rx="${r * 0.15}" ry="${r * 0.08}" fill="${haze}" opacity="0.08"/>`;
    }
    inner += `<circle cx="${cx}" cy="${cy}" r="${r * 1.04}" fill="none" stroke="${haze}" stroke-width="${r * 0.06}" opacity="0.2"/>`;
    inner += `<circle cx="${cx}" cy="${cy}" r="${r * 1.1}" fill="none" stroke="${haze}" stroke-width="${r * 0.03}" opacity="0.1"/>`;
  }

  if (textureType === 'earth') {
    const continents = [
      `M${cx - r * 0.15} ${cy - r * 0.5} Q${cx - r * 0.1} ${cy - r * 0.45} ${cx - r * 0.05} ${cy - r * 0.4} Q${cx - r * 0.02} ${cy - r * 0.35} ${cx - r * 0.08} ${cy - r * 0.25} Q${cx - r * 0.15} ${cy - r * 0.2} ${cx - r * 0.2} ${cy - r * 0.25} Q${cx - r * 0.25} ${cy - r * 0.3} ${cx - r * 0.2} ${cy - r * 0.4} Q${cx - r * 0.18} ${cy - r * 0.45} ${cx - r * 0.15} ${cy - r * 0.5}Z`,
      `M${cx - r * 0.1} ${cy - r * 0.2} Q${cx - r * 0.05} ${cy - r * 0.15} ${cx - r * 0.05} ${cy - r * 0.05} Q${cx - r * 0.05} ${cy + r * 0.05} ${cx - r * 0.1} ${cy + r * 0.1} Q${cx - r * 0.15} ${cy + r * 0.15} ${cx - r * 0.15} ${cy + r * 0.1} Q${cx - r * 0.15} ${cy} ${cx - r * 0.12} ${cy - r * 0.1} Q${cx - r * 0.12} ${cy - r * 0.15} ${cx - r * 0.1} ${cy - r * 0.2}Z`,
      `M${cx + r * 0.05} ${cy - r * 0.4} Q${cx + r * 0.1} ${cy - r * 0.35} ${cx + r * 0.12} ${cy - r * 0.25} Q${cx + r * 0.15} ${cy - r * 0.15} ${cx + r * 0.12} ${cy - r * 0.05} Q${cx + r * 0.1} ${cy + r * 0.05} ${cx + r * 0.08} ${cy + r * 0.15} Q${cx + r * 0.05} ${cy + r * 0.2} ${cx + r * 0.02} ${cy + r * 0.15} Q${cx} ${cy + r * 0.05} ${cx + r * 0.02} ${cy - r * 0.05} Q${cx + r * 0.02} ${cy - r * 0.15} ${cx + r * 0.03} ${cy - r * 0.3} Q${cx + r * 0.03} ${cy - r * 0.35} ${cx + r * 0.05} ${cy - r * 0.4}Z`,
      `M${cx + r * 0.12} ${cy - r * 0.35} Q${cx + r * 0.2} ${cy - r * 0.3} ${cx + r * 0.3} ${cy - r * 0.25} Q${cx + r * 0.35} ${cy - r * 0.2} ${cx + r * 0.35} ${cy - r * 0.1} Q${cx + r * 0.3} ${cy} ${cx + r * 0.25} ${cy + r * 0.05} Q${cx + r * 0.2} ${cy + r * 0.1} ${cx + r * 0.15} ${cy + r * 0.05} Q${cx + r * 0.12} ${cy} ${cx + r * 0.12} ${cy - r * 0.1} Q${cx + r * 0.1} ${cy - r * 0.2} ${cx + r * 0.12} ${cy - r * 0.35}Z`,
      `M${cx + r * 0.25} ${cy + r * 0.25} Q${cx + r * 0.3} ${cy + r * 0.2} ${cx + r * 0.35} ${cy + r * 0.22} Q${cx + r * 0.38} ${cy + r * 0.25} ${cx + r * 0.35} ${cy + r * 0.3} Q${cx + r * 0.3} ${cy + r * 0.32} ${cx + r * 0.25} ${cy + r * 0.3} Q${cx + r * 0.22} ${cy + r * 0.28} ${cx + r * 0.25} ${cy + r * 0.25}Z`,
    ];
    inner += continents.map(d => `<path d="${d}" fill="rgba(34,120,50,0.6)"/>`).join('');
    for (let i = 0; i < 6; i++) {
      inner += `<ellipse cx="${cx + Math.sin(i * 2.3) * r * 0.5}" cy="${cy + Math.cos(i * 1.7) * r * 0.4}" rx="${r * (0.12 + Math.sin(i * 1.3) * 0.05)}" ry="${r * 0.04}" fill="rgba(255,255,255,0.15)"/>`;
    }
    inner += `<ellipse cx="${cx}" cy="${cy - r * 0.7}" rx="${r * 0.3}" ry="${r * 0.1}" fill="rgba(255,255,255,0.3)"/>
<ellipse cx="${cx}" cy="${cy + r * 0.7}" rx="${r * 0.25}" ry="${r * 0.08}" fill="rgba(255,255,255,0.2)"/>`;
    if (art.atmosphereColor) {
      inner += `<circle cx="${cx}" cy="${cy}" r="${r * 1.03}" fill="none" stroke="${art.atmosphereColor}" stroke-width="${r * 0.04}" opacity="0.3"/>`;
    }
  }

  if (textureType === 'cratered') {
    const craters = [
      [-0.4, -0.3, 0.2], [0.3, -0.35, 0.15], [-0.2, 0.3, 0.18],
      [0.4, 0.25, 0.12], [-0.5, 0.05, 0.08], [0.5, -0.1, 0.1],
      [0.0, -0.5, 0.14], [-0.35, 0.4, 0.07], [0.2, 0.5, 0.06],
      [-0.6, -0.1, 0.05], [0.6, 0.15, 0.04], [0.0, 0.6, 0.05],
      [-0.15, -0.6, 0.06], [0.45, -0.4, 0.04], [-0.4, -0.4, 0.09],
    ];
    for (let i = 0; i < 20; i++) {
      inner += `<circle cx="${cx + Math.sin(i * 43) * r * 0.65}" cy="${cy + Math.cos(i * 29) * r * 0.65}" r="${3 + Math.abs(Math.sin(i * 17)) * 8 * s}" fill="rgba(0,0,0,0.05)"/>`;
    }
    craters.forEach(([dx, dy, dr]) => {
      inner += `
<ellipse cx="${cx + dx * r}" cy="${cy + dy * r}" rx="${dr * r}" ry="${dr * r * 0.85}" fill="rgba(0,0,0,0.2)"/>
<ellipse cx="${cx + dx * r - dr * r * 0.1}" cy="${cy + dy * r - dr * r * 0.1}" rx="${dr * r * 0.7}" ry="${dr * r * 0.6}" fill="rgba(0,0,0,0.1)"/>
<ellipse cx="${cx + dx * r + dr * r * 0.05}" cy="${cy + dy * r + dr * r * 0.05}" rx="${dr * r * 0.9}" ry="${dr * r * 0.75}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="${2 * s}"/>`;
    });
  }

  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r * 1.5}" fill="url(#glow-${uid})"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#planet-${uid})"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#planet-shadow-${uid})" opacity="0.4"/>
    ${inner}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="black" stroke-width="${r * 0.04}" opacity="0.3"/>
  </g>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
