import { useId } from 'react';
import { getNFTArtConfig, STAR_POSITIONS } from '@/data/nft-art';
import { bodies } from '@/data/bodies';
import PlanetRenderer from './PlanetRenderer';

const LOGO_UID = 'nftlogo';

type NFTTicketProps = {
  destinationId: number;
  tokenId: number;
  priceEth: string;
  compact?: boolean;
  walletAddress?: string;
};

export default function NFTTicket({
  destinationId, tokenId, priceEth, compact, walletAddress,
}: NFTTicketProps) {
  const body = bodies.find(b => b.id === destinationId);
  const art = getNFTArtConfig(destinationId);
  const uid = useId();

  if (!body || !art) return null;

  const displayW = compact ? 340 : 700;
  const displayH = compact ? 540 : 1100;
  const VW = 340;
  const VH = 540;

  return (
    <svg
      width={displayW}
      height={displayH}
      viewBox={`0 0 ${VW} ${VH}`}
      xmlns='http://www.w3.org/2000/svg'
      className='w-full h-auto rounded-xl'
    >
      <defs>
        <linearGradient id={`bg-${destinationId}-${uid}`} x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stopColor={art.bgGradient[0]} />
          <stop offset='100%' stopColor={art.bgGradient[1]} />
        </linearGradient>
        <linearGradient id={`panel-${destinationId}-${uid}`} x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stopColor='#16233c' />
          <stop offset='100%' stopColor='#0f172a' />
        </linearGradient>
        <radialGradient id={`planet-${destinationId}-${uid}`}>
          <stop offset='0%' stopColor={art.planetGradient[0]} />
          <stop offset='100%' stopColor={art.planetGradient[1]} />
        </radialGradient>
        <radialGradient id={`glow-${destinationId}-${uid}`}>
          <stop offset='0%' stopColor={art.planetGlow} stopOpacity='0.3' />
          <stop offset='100%' stopColor={art.planetGlow} stopOpacity='0' />
        </radialGradient>
        <radialGradient id={`planet-shadow-${uid}`} cx='30%' cy='30%' r='70%'>
          <stop offset='0%' stopColor='rgba(0,0,0,0)' />
          <stop offset='60%' stopColor='rgba(0,0,0,0.15)' />
          <stop offset='100%' stopColor='rgba(0,0,0,0.5)' />
        </radialGradient>
        <clipPath id={`planet-clip-${destinationId}-${uid}`}>
          <circle cx={170} cy={155} r={65} />
        </clipPath>
        <radialGradient id={`${LOGO_UID}-sun`} cx='50%' cy='50%'>
          <stop offset='0%' stopColor='#FFE27A' />
          <stop offset='65%' stopColor='#FFC83D' />
          <stop offset='100%' stopColor='#FF9800' />
        </radialGradient>
        <linearGradient id={`${LOGO_UID}-orbit`} x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stopColor='#C4B5FD' />
          <stop offset='100%' stopColor='#7C3AED' />
        </linearGradient>
        <filter id={`${LOGO_UID}-glow`} x='-50%' y='-50%' width='200%' height='200%'>
          <feGaussianBlur stdDeviation='10' result='blur' />
          <feMerge>
            <feMergeNode in='blur' />
            <feMergeNode in='SourceGraphic' />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width={VW} height={VH} rx={20} fill={`url(#bg-${destinationId}-${uid})`} />

      {/* Stars */}
      {STAR_POSITIONS.map(([x, y], i) => (
        <circle key={i} cx={x / (700 / VW)} cy={y / (1000 / VH)} r={i % 3 === 0 ? 2 : i % 3 === 1 ? 1.5 : 1} fill='white' opacity='0.7' />
      ))}

      {/* Ticket panel */}
      <rect
        x={VW * 0.057}
        y={VH * 0.03}
        width={VW * 0.886}
        height={VH * 0.94}
        rx={18}
        fill={`url(#panel-${destinationId}-${uid})`}
        stroke={art.accentColor}
        strokeWidth={1}
      />

      {/* SOLAREXPRESS logo */}
      <text x={VW * 0.1} y={VH * 0.065} fill={art.accentColor} fontSize={19} fontFamily='Arial' fontWeight='bold'>
        SOLAREXPRESS
      </text>
      <text x={VW * 0.74} y={VH * 0.065} fill='#94a3b8' fontSize={10}>
        ERC-721
      </text>

      {/* Planet */}
      <PlanetRenderer
        cx={170}
        cy={155}
        r={65}
        gradientId={`planet-${destinationId}-${uid}`}
        glowId={`glow-${destinationId}-${uid}`}
        clipId={`planet-clip-${destinationId}-${uid}`}
        shadowId={`planet-shadow-${uid}`}
        textureType={art.textureType}
        colors={art.planetGradient}
        atmosphereColor={art.atmosphereColor}
        spotColor={art.spotColor}
        bandColors={art.bandColors}
      />

      {/* Orbit ring */}
      <ellipse cx={170} cy={155} rx={90} ry={26} fill='none' stroke={art.orbitColor} opacity='0.4' />

      {/* Destination label */}
      <text x={VW * 0.1} y={247.5} fill='#94a3b8' fontSize={11}>
        DESTINATION
      </text>
      <text x={VW * 0.1} y={264} fill='white' fontSize={24} fontWeight='bold'>
        {body.name.toUpperCase()}
      </text>
      <text x={VW * 0.1} y={275} fill={art.accentColor} fontSize={13}>
        {body.type === 'planet' ? 'PLANET' : 'MOON'}
      </text>

      {/* Divider */}
      <line x1={VW * 0.1} y1={286} x2={VW * 0.9} y2={286} stroke='#334155' />

      {/* Row 1: Token / Price / Network */}
      <text x={VW * 0.1} y={302.5} fill='#94a3b8' fontSize={8}>TOKEN</text>
      <text x={VW * 0.1} y={313.5} fill='white' fontSize={13}>{`#${String(tokenId).padStart(3, '0')}`}</text>

      <text x={VW * 0.4} y={302.5} fill='#94a3b8' fontSize={8}>PRICE</text>
      <text x={VW * 0.4} y={313.5} fill='white' fontSize={13}>{priceEth} ETH</text>

      <text x={VW * 0.7} y={302.5} fill='#94a3b8' fontSize={8}>NETWORK</text>
      <text x={VW * 0.7} y={313.5} fill={art.accentColor} fontSize={13}>SEPOLIA</text>

      {/* Wallet address */}
      {walletAddress && (
        <text x={VW * 0.1} y={324.5} fill='#94a3b8' fontSize={10} fontFamily='monospace'>
          {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
        </text>
      )}

      {/* Status badge */}
      <rect x={VW * 0.1} y={326} width={90} height={22} rx={11} fill='#0f766e' />
      <text x={VW * 0.1 + 10} y={341} fill='white' fontSize={9}>
        NFT MINTED
      </text>

      {/* Bottom-right logo watermark */}
      <g transform={`translate(${VW * 0.83}, ${VH * 0.90}) scale(0.065)`}>
        <circle cx='256' cy='256' r='90' fill='#08111F' opacity='0.5' />
        <circle cx='256' cy='256' r='84' fill='#FFB300' opacity='.35' filter={`url(#${LOGO_UID}-glow)`} />
        <circle cx='256' cy='256' r='70' fill={`url(#${LOGO_UID}-sun)`} opacity='0.55' />
        <ellipse cx='256' cy='256' rx='170' ry='72' transform='rotate(-18 256 256)' fill='none' stroke={`url(#${LOGO_UID}-orbit)`} strokeWidth='8' opacity='0.55' />
        <g transform='translate(392 186) rotate(28)' opacity='0.55'>
          <path d='M0 -12 L22 0 L0 12 L6 4 L-14 4 L-8 0 L-14 -4 L6 -4 Z' fill='#FFFFFF' />
          <polygon points='-2,-5 -14,-15 -8,-3' fill='#D1D5DB' />
          <polygon points='-2,5 -14,15 -8,3' fill='#D1D5DB' />
          <circle cx='10' cy='0' r='2.5' fill='#A78BFA' />
          <path d='M-16 0 Q-38 -2 -58 0' fill='none' stroke='#8B5CF6' strokeWidth='5' strokeLinecap='round' />
        </g>
      </g>
    </svg>
  );
}

export function NFTTicketCompact(props: Omit<NFTTicketProps, 'compact'>) {
  return <NFTTicket {...props} compact />;
}
