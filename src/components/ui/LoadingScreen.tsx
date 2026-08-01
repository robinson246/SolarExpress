'use client';

import { useEffect, useState, type CSSProperties } from 'react';

type LoadingSpinnerProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
};

type LoadingScreenProps = {
  message?: string;
  visible?: boolean;
};

/* ─── Animated logo (compact, no overlay) ─── */
export function LoadingSpinner({ size = 24, className = '', style }: LoadingSpinnerProps) {
  const uid = 'ls-spinner';

  return (
    <>
      <style>{`
        @keyframes ls-orbit-${uid} {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ls-sun-pulse-${uid} {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.35; }
        }
        .ls-orbit-${uid} {
          transform-origin: 256px 256px;
          animation: ls-orbit-${uid} 2.5s linear infinite;
        }
        .ls-sun-pulse-${uid} {
          animation: ls-sun-pulse-${uid} 2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .ls-orbit-${uid} { animation: none; }
          .ls-sun-pulse-${uid} { animation: none; }
        }
      `}</style>
      <svg width={size} height={size} viewBox='0 0 512 512' className={className} style={style}>
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
        <circle cx='256' cy='256' r='84' fill='#FFB300' className={`ls-sun-pulse-${uid}`} filter={`url(#${uid}-glow)`} />
        <circle cx='256' cy='256' r='70' fill={`url(#${uid}-sun)`} />
        <g className={`ls-orbit-${uid}`}>
          <ellipse cx='256' cy='256' rx='170' ry='72' transform='rotate(-18 256 256)' fill='none' stroke={`url(#${uid}-orbit)`} strokeWidth='6' />
          <g transform='translate(392 186) rotate(28)'>
            <path d='M0 -12 L22 0 L0 12 L6 4 L-14 4 L-8 0 L-14 -4 L6 -4 Z' fill='#FFFFFF' />
            <polygon points='-2,-5 -14,-15 -8,-3' fill='#D1D5DB' />
            <polygon points='-2,5 -14,15 -8,3' fill='#D1D5DB' />
            <circle cx='10' cy='0' r='2' fill='#A78BFA' />
            <path d='M-16 0 Q-38 -2 -58 0' fill='none' stroke='#8B5CF6' strokeWidth='4' strokeLinecap='round' />
          </g>
        </g>
      </svg>
    </>
  );
}

/* ─── Full-screen loading overlay ─── */
export default function LoadingScreen({ message, visible = true }: LoadingScreenProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(visible));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  if (!show) return null;

  return (
    <div className='fixed inset-0 z-[100] flex flex-col items-center justify-center' style={{ background: '#08111F' }}>
      <style>{`
        @keyframes ls-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ls-fade-in {
          animation: ls-fade-up 0.6s ease-out both;
        }
      `}</style>
      <LoadingSpinner size={160} />
      {message ? (
        <p className='mt-8 text-sm text-gray-500 text-center max-w-xs ls-fade-in' style={{ animationDelay: '0.3s' }}>
          {message}
        </p>
      ) : (
        <p className='mt-8 text-sm text-gray-500 text-center max-w-xs ls-fade-in' style={{ animationDelay: '0.3s' }}>
          Offering orbit-trip to every planet in our solar system.
        </p>
      )}
    </div>
  );
}
