'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useConnection, useConnect } from 'wagmi';
import SignInModal from './SignInModal';

export default function UserProfile() {
  const { user, signOut } = useAuth();
  const { isConnected, address } = useConnection();
  const { mutate: connect, connectors } = useConnect();
  const [showModal, setShowModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const walletLinked = user?.walletAddress || null;

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className='px-3 py-1.5 text-xs font-medium rounded bg-gray-700/60 hover:bg-gray-600 text-gray-300 border border-gray-600 transition-colors cursor-pointer'
        >
          Sign In
        </button>
        <SignInModal open={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  const initial = user.email.charAt(0).toUpperCase();

  return (
    <div ref={dropdownRef} className='relative'>
      <button
        type='button'
        aria-label='Account menu'
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className='flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700/50 transition-colors cursor-pointer'
      >
        <span className='w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white'>
          {initial}
        </span>
        <span className='text-xs text-gray-300 hidden sm:inline max-w-[140px] truncate'>
          {user.email}
        </span>
        {walletLinked && (
          <span className='w-2 h-2 rounded-full bg-emerald-400 hidden sm:block' title='Wallet linked' />
        )}
      </button>

      {dropdownOpen && (
        <div className='absolute right-0 top-full mt-1 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-50'>
          {/* User Info */}
          <div className='px-3 py-2 border-b border-gray-800 space-y-1'>
            <p className='text-xs text-white font-medium truncate'>{user.email}</p>
            {user.walletAddress && (
              <p className='text-[10px] font-mono text-gray-400 truncate'>
                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </p>
            )}
          </div>

          {/* Wallet Section */}
          <div className='px-3 py-2 border-b border-gray-800 space-y-2'>
            <p className='text-[10px] text-gray-500 uppercase tracking-wider'>Wallet</p>
            {walletLinked ? (
              <div className='flex items-center gap-2'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-400' />
                <span className='text-xs font-mono text-gray-300 truncate'>
                  {walletLinked.slice(0, 6)}...{walletLinked.slice(-4)}
                </span>
                {isConnected && address?.toLowerCase() === walletLinked.toLowerCase() && (
                  <span className='text-[10px] text-emerald-400'>connected</span>
                )}
              </div>
            ) : (
              <div className='space-y-1'>
                <button
                  onClick={() => {
                    connect({ connector: connectors[0] });
                    setDropdownOpen(false);
                  }}
                  className='w-full px-2 py-1.5 text-[11px] font-medium rounded bg-violet-600 hover:bg-violet-500 text-white transition-colors cursor-pointer text-left'
                >
                  Connect MetaMask
                </button>
              </div>
            )}
          </div>

          {/* Sign Out */}
          <button
            onClick={async () => { await signOut(); setDropdownOpen(false); }}
            className='w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer'
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
