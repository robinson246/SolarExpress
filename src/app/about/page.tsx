'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import NavBar from '@/components/layout/NavBar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Link from 'next/link';

const TECH_STACK = [
  { category: 'Frontend', items: ['Next.js 16 (App Router)', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'Wagmi / Viem', 'TanStack Query', 'Three.js (Solar System)'] },
  { category: 'Backend', items: ['Node.js', 'Express.js', 'MongoDB / Mongoose', 'JWT Authentication', 'Cookie-based Sessions'] },
  { category: 'Blockchain', items: ['Solidity Smart Contracts', 'ERC-721 NFT Standard', 'Sepolia Test Network', 'MetaMask Integration', 'Ethers.js / Viem'] },
];

const CONTRACTS = [
  { name: 'TicketSale', address: process.env.NEXT_PUBLIC_TICKET_SALE_ADDRESS || '0x9108a57EF02A3e9486E62C7cb4bcEb49D735e86f' as const },
  { name: 'TicketNFT (ERC-721)', address: process.env.NEXT_PUBLIC_TICKET_NFT_ADDRESS || '0xEe0fE93b4CC7017Eb9062b7B07ff00ECd92793d7' as const },
  { name: 'BookingHistory', address: process.env.NEXT_PUBLIC_BOOKING_HISTORY_ADDRESS || '0xC1D9a31Ef26b0f4E15C5366fD65C3116AB7AF5EF' as const },
];

export default function AboutPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();

  useEffect(() => {
    if (!checkingSession && !user) router.replace('/signin');
  }, [checkingSession, user, router]);

  if (checkingSession || !user) {
    return <LoadingScreen visible message='Checking session...' />;
  }

  return (
    <div className='h-full w-full overflow-hidden bg-[#09090b] text-white flex flex-col'>
      <NavBar />
      <div className='flex-1 overflow-y-auto scrollbar-thin'>
        <div className='max-w-3xl mx-auto px-4 py-8 pb-24 sm:pb-12 space-y-10'>
          {/* Header */}
          <div className='flex items-center gap-4'>
            <div className='w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center'>
              <svg className='w-6 h-6 text-violet-400' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'>
                <circle cx='12' cy='12' r='10' /><path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z' />
              </svg>
            </div>
            <div>
              <h1 className='text-2xl font-bold'>About SolarExpress</h1>
              <p className='text-sm text-gray-500'>A Web3-powered interplanetary booking platform</p>
            </div>
          </div>

          {/* Overview */}
          <section className='glass-card rounded-xl p-5 space-y-3'>
            <h2 className='text-sm font-bold text-violet-300'>Project Overview</h2>
            <p className='text-xs text-gray-400 leading-relaxed'>
              SolarExpress is an educational Web3 application that simulates an interplanetary travel booking platform. 
              Users can explore the Solar System, select destinations, and book tickets that are minted as ERC-721 NFTs on the Sepolia test network.
            </p>
            <p className='text-xs text-gray-400 leading-relaxed'>
              The platform demonstrates the integration of modern web technologies with blockchain infrastructure, 
              showcasing how NFT ticketing, smart contracts, and decentralized ownership can work alongside 
              traditional database-backed applications.
            </p>
          </section>

          {/* Architecture */}
          <section className='space-y-4'>
            <h2 className='text-sm font-bold text-violet-300'>Architecture</h2>
            <div className='grid gap-3'>
              {TECH_STACK.map((cat) => (
                <div key={cat.category} className='glass-card rounded-xl p-4 space-y-2'>
                  <h3 className='text-xs font-bold text-gray-300 uppercase tracking-wider'>{cat.category}</h3>
                  <div className='flex flex-wrap gap-1.5'>
                    {cat.items.map((item) => (
                      <span key={item} className='text-[10px] px-2 py-1 rounded-md bg-violet-500/5 border border-violet-500/10 text-gray-400'>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Smart Contracts */}
          <section className='space-y-3'>
            <h2 className='text-sm font-bold text-violet-300'>Smart Contracts (Sepolia)</h2>
            <div className='space-y-2'>
              {CONTRACTS.map((c) => (
                <div key={c.name} className='glass-card rounded-xl p-4 flex items-center justify-between'>
                  <span className='text-xs text-gray-300 font-medium'>{c.name}</span>
                  <code className='text-[10px] font-mono text-violet-400 bg-violet-500/5 px-2 py-1 rounded'>{c.address}</code>
                </div>
              ))}
            </div>
          </section>

          {/* Workflow */}
          <section className='glass-card rounded-xl p-5 space-y-3'>
            <h2 className='text-sm font-bold text-violet-300'>Booking Flow</h2>
            <div className='flex flex-wrap items-center gap-1.5 text-xs text-gray-400'>
              {['Explore', 'Select', 'Book', 'Pay', 'Mint', 'Sync', 'Confirmed'].map((step, i) => (
                <div key={step} className='flex items-center gap-1.5'>
                  <span className='px-2 py-1 rounded-md bg-violet-500/5 border border-violet-500/10'>{step}</span>
                  {i < 6 && <span className='text-gray-700'>→</span>}
                </div>
              ))}
            </div>
          </section>

          {/* Links */}
          <div className='flex flex-col sm:flex-row gap-3'>
            <a
              href='https://github.com/anomalyco/SolarExpress'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg btn-violet text-xs cursor-pointer'
            >
              <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor'><path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'/></svg>
              View on GitHub
            </a>
            <Link href='/faq' className='flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800/60 text-gray-300 border border-gray-700/50 hover:bg-gray-700/60 transition-colors text-xs'>
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
