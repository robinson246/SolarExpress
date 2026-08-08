'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import NavBar from '@/components/layout/NavBar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Link from 'next/link';

const FRONTEND_DEPS = [
  { name: 'next', version: '16.2.11', purpose: 'React framework — App Router, SSR/SSG, API routes' },
  { name: 'react / react-dom', version: '19.2.4', purpose: 'UI library + DOM renderer' },
  { name: 'three', version: '^0.185.1', purpose: '3D engine behind the solar system scene' },
  { name: '@react-three/fiber', version: '^9.6.1', purpose: 'React renderer for Three.js' },
  { name: '@react-three/drei', version: '^10.7.7', purpose: '3D helpers — OrbitControls, Stars, Html labels' },
  { name: 'wagmi', version: '^3.7.4', purpose: 'React hooks for wallet connection + contract calls' },
  { name: 'viem', version: '^2.55.10', purpose: 'Type-safe Ethereum client (reads/writes/ABIs)' },
  { name: '@tanstack/react-query', version: '^5.101.4', purpose: 'Server-state caching (bookings, metadata)' },
  { name: '@resvg/resvg-js', version: '^2.6.2', purpose: 'Rasterizes NFT ticket SVG to PNG (server-side)' },
];

const BACKEND_DEPS = [
  { name: 'express', version: '^4.21.0', purpose: 'HTTP server' },
  { name: 'mongoose', version: '^9.8.0', purpose: 'MongoDB ODM — booking records' },
  { name: 'jsonwebtoken', version: '^9.0.2', purpose: 'JWT authentication' },
  { name: 'bcryptjs', version: '^2.4.3', purpose: 'Password hashing' },
  { name: 'cookie-parser', version: '^1.4.6', purpose: 'Cookie-based sessions' },
  { name: 'helmet', version: '^8.3.0', purpose: 'Security headers' },
  { name: 'express-rate-limit', version: '^8.6.1', purpose: 'API rate limiting' },
  { name: 'cors', version: '^2.8.5', purpose: 'Cross-origin resource sharing' },
  { name: 'dotenv', version: '^17.4.2', purpose: 'Environment configuration' },
  { name: 'viem', version: '^2.55.10', purpose: 'Blockchain client for contract utilities' },
];

const DEV_TOOLS = [
  { name: 'TypeScript', version: '^5', purpose: 'Static type checking across the codebase' },
  { name: 'ESLint + eslint-config-next', version: '^9 / 16.2.11', purpose: 'Linting' },
  { name: 'Tailwind CSS', version: '^4', purpose: 'Utility-first CSS (styling system)' },
  { name: 'sharp', version: '^0.35.3', purpose: 'Image processing in the build pipeline' },
  { name: '@types/*', version: '—', purpose: 'Type definitions for React, ReactDOM, Node' },
];

const WORKFLOW_TOOLS = [
  { name: 'Node.js scripts (scripts/)', detail: 'mint-test-ticket.js, set-token-uri.js, wire-with-viem.js, ipfs-migrate.mjs — deployer & maintenance utilities' },
  { name: 'GitHub Actions (CI)', detail: 'wire-contracts.yml, mint-test-ticket.yml, set-token-uri.yml — automated contract wiring & test mints' },
  { name: 'Pinata IPFS', detail: 'Decentralized hosting of NFT artwork + metadata (ipfs:// CIDs)' },
  { name: 'Sepolia testnet', detail: 'Public Ethereum test network for on-chain tickets' },
];

const CONTRACTS = [
  { name: 'SolarExpressTicket.sol', detail: 'ERC-721 ticket NFT with per-token metadata (baseTokenURI + setTokenURI)' },
  { name: 'TicketSale.sol', detail: 'Sale contract — destination prices, buyTicket(), TicketPurchased events' },
  { name: 'BookingHistory.sol', detail: 'On-chain booking ledger — getBookings(wallet), ticket history' },
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
        <div className='max-w-3xl mx-auto px-4 py-8 space-y-10'>
          {/* Header */}
          <div className='flex items-center gap-4'>
            <div className='w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center'>
              <svg className='w-6 h-6 text-violet-400' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'>
                <circle cx='12' cy='12' r='10' /><path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z' />
              </svg>
            </div>
            <div>
              <h1 className='text-2xl font-bold'>About SolarExpress</h1>
              <p className='text-sm text-gray-500'>Dependencies and tools used to build the platform</p>
            </div>
          </div>

          {/* Overview */}
          <section className='glass-card rounded-xl p-5 space-y-3'>
            <h2 className='text-sm font-bold text-violet-300'>Project Overview</h2>
            <p className='text-xs text-gray-400 leading-relaxed'>
              SolarExpress is a Web3 interplanetary travel booking platform. Users explore a 3D solar system,
              select a destination, and book tickets that are minted as ERC-721 NFTs on the Sepolia test network.
            </p>
            <p className='text-xs text-gray-400 leading-relaxed'>
              The stack below is the exact set of runtime dependencies and developer tooling pulled from
              <code className='text-violet-400 mx-1'>package.json</code> and
              <code className='text-violet-400'>backend/package.json</code>.
            </p>
          </section>

          {/* Frontend dependencies */}
          <section className='space-y-4'>
            <h2 className='text-sm font-bold text-violet-300'>Frontend Dependencies</h2>
            <div className='space-y-2'>
              {FRONTEND_DEPS.map((dep) => (
                <div key={dep.name} className='glass-card rounded-xl p-3.5 flex items-center justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='text-xs text-gray-200 font-medium'>{dep.name}</p>
                    <p className='text-[10px] text-gray-500 truncate'>{dep.purpose}</p>
                  </div>
                  <code className='text-[10px] font-mono text-violet-400 bg-violet-500/5 border border-violet-500/10 px-2 py-1 rounded shrink-0'>{dep.version}</code>
                </div>
              ))}
            </div>
          </section>

          {/* Backend dependencies */}
          <section className='space-y-4'>
            <h2 className='text-sm font-bold text-violet-300'>Backend Dependencies</h2>
            <div className='space-y-2'>
              {BACKEND_DEPS.map((dep) => (
                <div key={dep.name} className='glass-card rounded-xl p-3.5 flex items-center justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='text-xs text-gray-200 font-medium'>{dep.name}</p>
                    <p className='text-[10px] text-gray-500 truncate'>{dep.purpose}</p>
                  </div>
                  <code className='text-[10px] font-mono text-violet-400 bg-violet-500/5 border border-violet-500/10 px-2 py-1 rounded shrink-0'>{dep.version}</code>
                </div>
              ))}
            </div>
          </section>

          {/* Dev tools */}
          <section className='space-y-4'>
            <h2 className='text-sm font-bold text-violet-300'>Development Tools</h2>
            <div className='grid gap-3 sm:grid-cols-2'>
              {DEV_TOOLS.map((tool) => (
                <div key={tool.name} className='glass-card rounded-xl p-4 space-y-1.5'>
                  <div className='flex items-center justify-between gap-2'>
                    <h3 className='text-xs font-bold text-gray-200'>{tool.name}</h3>
                    <code className='text-[10px] font-mono text-violet-400 bg-violet-500/5 border border-violet-500/10 px-2 py-0.5 rounded shrink-0'>{tool.version}</code>
                  </div>
                  <p className='text-[10px] text-gray-500'>{tool.purpose}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Workflow tooling */}
          <section className='space-y-3'>
            <h2 className='text-sm font-bold text-violet-300'>Workflow & Tooling</h2>
            <div className='space-y-2'>
              {WORKFLOW_TOOLS.map((tool) => (
                <div key={tool.name} className='glass-card rounded-xl p-4 space-y-1'>
                  <h3 className='text-xs font-bold text-gray-200'>{tool.name}</h3>
                  <p className='text-[10px] text-gray-500 leading-relaxed'>{tool.detail}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Smart contracts */}
          <section className='space-y-3'>
            <h2 className='text-sm font-bold text-violet-300'>Smart Contracts (Solidity)</h2>
            <div className='space-y-2'>
              {CONTRACTS.map((c) => (
                <div key={c.name} className='glass-card rounded-xl p-4 space-y-1'>
                  <h3 className='text-xs font-bold text-gray-200 font-mono'>{c.name}</h3>
                  <p className='text-[10px] text-gray-500'>{c.detail}</p>
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
