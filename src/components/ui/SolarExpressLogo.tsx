type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | number;

type SolarExpressLogoProps = {
  size?: LogoSize;
  className?: string;
};

const SIZE_MAP: Record<string, number> = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

const uid = 'solarlogo';

export default function SolarExpressLogo({ size = 'md', className = '' }: SolarExpressLogoProps) {
  const px = typeof size === 'number' ? size : (SIZE_MAP[size] ?? 32);

  return (
    <svg width={px} height={px} viewBox='0 0 512 512' className={className} aria-label='SolarExpress'>
      <defs>
        <radialGradient id={`${uid}-sun`} cx='50%' cy='50%'>
          <stop offset='0%' stopColor='#FFE27A' />
          <stop offset='65%' stopColor='#FFC83D' />
          <stop offset='100%' stopColor='#FF9800' />
        </radialGradient>
        <linearGradient id={`${uid}-orbit`} x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stopColor='#C4B5FD' />
          <stop offset='100%' stopColor='#7C3AED' />
        </linearGradient>
        <filter id={`${uid}-glow`} x='-50%' y='-50%' width='200%' height='200%'>
          <feGaussianBlur stdDeviation='10' result='blur' />
          <feMerge>
            <feMergeNode in='blur' />
            <feMergeNode in='SourceGraphic' />
          </feMerge>
        </filter>
      </defs>
      <rect width='512' height='512' rx='90' fill='#08111F' />
      <circle cx='256' cy='256' r='84' fill='#FFB300' opacity='.25' filter={`url(#${uid}-glow)`} />
      <circle cx='256' cy='256' r='70' fill={`url(#${uid}-sun)`} />
      <ellipse cx='256' cy='256' rx='170' ry='72' transform='rotate(-18 256 256)' fill='none' stroke={`url(#${uid}-orbit)`} strokeWidth='6' />
      <g transform='translate(392 186) rotate(28)'>
        <path d='M0 -12 L22 0 L0 12 L6 4 L-14 4 L-8 0 L-14 -4 L6 -4 Z' fill='#FFFFFF' />
        <polygon points='-2,-5 -14,-15 -8,-3' fill='#D1D5DB' />
        <polygon points='-2,5 -14,15 -8,3' fill='#D1D5DB' />
        <circle cx='10' cy='0' r='2' fill='#A78BFA' />
        <path d='M-16 0 Q-38 -2 -58 0' fill='none' stroke='#8B5CF6' strokeWidth='4' strokeLinecap='round' />
      </g>
    </svg>
  );
}
