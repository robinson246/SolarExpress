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
  if (!body || !art) return null;

  const width = compact ? 340 : 700;
  const height = compact ? 540 : 1100;
  const planetR = compact ? 65 : 130;
  const planetCx = compact ? 170 : 350;
  const planetCy = compact ? 155 : 290;
  const orbitRx = compact ? 90 : 180;
  const orbitRy = compact ? 26 : 52;
  const fs = (v: number) => compact ? Math.round(v * 0.5) : v;
  const py = (v: number) => compact ? v * 0.55 : v;

  const uid = useId();

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
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
          <circle cx={planetCx} cy={planetCy} r={planetR} />
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
      <rect width={width} height={height} rx={compact ? 20 : 35} fill={`url(#bg-${destinationId}-${uid})`} />

      {/* Stars */}
      {STAR_POSITIONS.map(([x, y], i) => (
        <circle key={i} cx={x / (700 / width)} cy={y / (1000 / height)} r={i % 3 === 0 ? 2 : i % 3 === 1 ? 1.5 : 1} fill='white' opacity='0.7' />
      ))}

      {/* Ticket panel */}
      <rect
        x={width * 0.057}
        y={height * 0.03}
        width={width * 0.886}
        height={height * 0.94}
        rx={compact ? 18 : 35}
        fill={`url(#panel-${destinationId}-${uid})`}
        stroke={art.accentColor}
        strokeWidth={compact ? 1 : 2}
      />

      {/* Logo */}
      <text x={width * 0.1} y={height * 0.065} fill={art.accentColor} fontSize={compact ? 16 : 32} fontFamily='Arial' fontWeight='bold'>
        SOLAREXPRESS
      </text>

      <text x={width * 0.74} y={height * 0.065} fill='#94a3b8' fontSize={compact ? 9 : 16}>
        ERC-721
      </text>

      {!compact && (
        <text x={width * 0.1} y={height * 0.095} fill='#64748b' fontSize={14} fontFamily='Arial' letterSpacing='2'>
          INTERPLANETARY BOARDING PASS
        </text>
      )}

      {/* Planet */}
      <PlanetRenderer
        cx={planetCx}
        cy={planetCy}
        r={planetR}
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
      <ellipse cx={planetCx} cy={planetCy} rx={orbitRx} ry={orbitRy} fill='none' stroke={art.orbitColor} opacity='0.4' />

      {/* Destination label */}
      <text x={width * 0.1} y={compact ? py(450) : 560} fill='#94a3b8' fontSize={fs(22)}>
        DESTINATION
      </text>
      <text x={width * 0.1} y={compact ? py(480) : 600} fill='white' fontSize={compact ? 24 : 48} fontWeight='bold'>
        {body.name.toUpperCase()}
      </text>
      <text x={width * 0.1} y={compact ? py(500) : 630} fill={art.accentColor} fontSize={fs(26)}>
        {body.type === 'planet' ? 'PLANET' : 'MOON'}
      </text>

      {/* Divider */}
      <line x1={width * 0.1} y1={compact ? py(520) : 660} x2={width * 0.9} y2={compact ? py(520) : 660} stroke='#334155' />

      {/* Row 1: Token / Price / Network */}
      <text x={width * 0.1} y={compact ? py(550) : 700} fill='#94a3b8' fontSize={fs(16)}>TOKEN</text>
      <text x={width * 0.1} y={compact ? py(570) : 725} fill='white' fontSize={compact ? 13 : 26}>{`#${String(tokenId).padStart(3, '0')}`}</text>

      <text x={width * 0.4} y={compact ? py(550) : 700} fill='#94a3b8' fontSize={fs(16)}>PRICE</text>
      <text x={width * 0.4} y={compact ? py(570) : 725} fill='white' fontSize={compact ? 13 : 26}>{priceEth} ETH</text>

      <text x={width * 0.7} y={compact ? py(550) : 700} fill='#94a3b8' fontSize={fs(16)}>NETWORK</text>
      <text x={width * 0.7} y={compact ? py(570) : 725} fill={art.accentColor} fontSize={compact ? 13 : 26}>SEPOLIA</text>

      {/* Wallet address */}
      {walletAddress && (
        !compact ? (
          <g>
            <line x1={width * 0.1} y1={760} x2={width * 0.9} y2={760} stroke='#1e293b' />
            <text x={width * 0.1} y={800} fill='#94a3b8' fontSize={16}>WALLET</text>
            <text x={width * 0.1} y={825} fill='white' fontSize={20} fontFamily='monospace'>
              {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
            </text>
          </g>
        ) : (
          <text x={width * 0.1} y={py(590)} fill='#94a3b8' fontSize={10} fontFamily='monospace'>
            {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
          </text>
        )
      )}

      {/* Status badge */}
      {!compact && (
        <>
          <rect x={width * 0.1} y={970} width={190} height={50} rx={25} fill='#0f766e' />
          <text x={width * 0.1 + 20} y={1000} fill='white' fontSize={22}>
            NFT MINTED
          </text>
        </>
      )}
      {compact && (
        <>
          <rect x={width * 0.1} y={py(520) + 40} width={90} height={22} rx={11} fill='#0f766e' />
          <text x={width * 0.1 + 10} y={py(520) + 55} fill='white' fontSize={9}>
            NFT MINTED
          </text>
        </>
      )}

      {/* Bottom-right logo watermark */}
      {!compact && (
        <g transform={`translate(${width * 0.87}, ${height * 0.92}) scale(0.12)`}>
          <circle cx='256' cy='256' r='90' fill='#08111F' opacity='0.55' />
          <circle cx='256' cy='256' r='84' fill='#FFB300' opacity='.35' filter={`url(#${LOGO_UID}-glow)`} />
          <circle cx='256' cy='256' r='70' fill={`url(#${LOGO_UID}-sun)`} opacity='0.6' />
          <ellipse cx='256' cy='256' rx='170' ry='72' transform='rotate(-18 256 256)' fill='none' stroke={`url(#${LOGO_UID}-orbit)`} strokeWidth='8' opacity='0.6' />
          <g transform='translate(392 186) rotate(28)' opacity='0.6'>
            <path d='M0 -12 L22 0 L0 12 L6 4 L-14 4 L-8 0 L-14 -4 L6 -4 Z' fill='#FFFFFF' />
            <polygon points='-2,-5 -14,-15 -8,-3' fill='#D1D5DB' />
            <polygon points='-2,5 -14,15 -8,3' fill='#D1D5DB' />
            <circle cx='10' cy='0' r='2.5' fill='#A78BFA' />
            <path d='M-16 0 Q-38 -2 -58 0' fill='none' stroke='#8B5CF6' strokeWidth='5' strokeLinecap='round' />
          </g>
        </g>
      )}
      {compact && (
        <g transform={`translate(${width * 0.83}, ${height * 0.90}) scale(0.065)`}>
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
      )}
    </svg>
  );
}

export function NFTTicketCompact(props: Omit<NFTTicketProps, 'compact'>) {
  return <NFTTicket {...props} compact />;
}
