'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useConnection, useConnect, useDisconnect } from 'wagmi';
import { useNotifications } from '@/lib/notification-context';
import SolarExpressLogo from '@/components/ui/SolarExpressLogo';

const NAV_ITEMS = [
  { href: '/', label: 'Explore' },
  { href: '/booking-history', label: 'My Tickets' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isConnected, address } = useConnection();
  const { mutate: connect, connectors } = useConnect();
  const { mutate: disconnect } = useDisconnect();
  const { notifications, unreadCount, markRead, dismissPromotion } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className='h-12 shrink-0 flex items-center justify-between px-4 bg-[#09090b]/80 border-b border-[rgba(167,139,250,0.12)] backdrop-blur-xl z-40'>
      <div className='flex items-center gap-6'>
        <Link href='/' className='flex items-center gap-2 text-sm font-semibold tracking-wide text-white hover:text-violet-300 transition-colors'>
          <SolarExpressLogo size={36} />
          SolarExpress
        </Link>
        <nav className='hidden sm:flex items-center gap-1'>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  active
                    ? 'text-violet-300 bg-violet-500/10 border border-violet-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className='flex items-center gap-1.5'>
        {/* Notifications */}
        <div ref={notifRef} className='relative'>
          <button
            type='button'
            aria-label='Notifications'
            onClick={() => setNotifOpen(!notifOpen)}
            className='relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer'
          >
            <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
              <path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' /><path d='M13.73 21a2 2 0 0 1-3.46 0' />
            </svg>
            {unreadCount > 0 && (
              <span className='absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-violet-500 text-[9px] font-bold text-white flex items-center justify-center'>{unreadCount}</span>
            )}
          </button>
          {notifOpen && (
            <div className='absolute right-0 top-full mt-1 w-64 bg-[#09090b]/95 border border-gray-800 rounded-xl shadow-2xl shadow-black/40 py-1 z-50 animate-slide-down'>
              <p className='px-3 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-800'>Notifications</p>
              <div className='max-h-48 overflow-y-auto'>
                {notifications.length === 0 ? (
                  <p className='text-xs text-gray-500 text-center py-4'>No notifications.</p>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div key={n._id} className='flex items-start gap-2 px-3 py-2 hover:bg-white/5 transition-colors'>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${
                        n.type === 'welcome' ? 'bg-violet-400' : n.type === 'promotion' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                      <div className='flex-1 min-w-0'>
                        <p className={`text-[11px] ${n.read ? 'text-gray-500' : 'text-gray-200'}`}>{n.message}</p>
                        <p className='text-[9px] text-gray-600 mt-0.5'>{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                      {!n.read && (
                        <button onClick={() => markRead(n._id)} className='text-[9px] text-violet-400 hover:text-violet-300 mt-0.5 cursor-pointer shrink-0'>Mark read</button>
                      )}
                      {n.type === 'promotion' && !n.dismissed && (
                        <button onClick={() => dismissPromotion(n._id)} className='text-[9px] text-gray-500 hover:text-gray-300 mt-0.5 cursor-pointer shrink-0'>✕</button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile / Connect Wallet */}
        <div ref={profileRef} className='relative'>
          {user ? (
            <>
              <button
                type='button'
                aria-label='Account menu'
                onClick={() => setProfileOpen(!profileOpen)}
                className='flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer'
              >
                {isConnected ? (
                  <span className='w-7 h-7 rounded-full bg-violet-600/80 flex items-center justify-center text-[10px] font-bold text-white'>
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <span className='w-7 h-7 rounded-full bg-gray-700/80 flex items-center justify-center text-[10px] font-bold text-gray-400'>
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className='text-xs text-gray-300 hidden sm:inline max-w-[120px] truncate'>{user.email}</span>
              </button>
              {profileOpen && (
                <div className='absolute right-0 top-full mt-1 w-56 bg-[#09090b]/95 border border-gray-800 rounded-xl shadow-2xl shadow-black/40 py-1 z-50 animate-slide-down'>
                  <div className='px-3 py-2 border-b border-gray-800 space-y-1'>
                    <p className='text-xs text-white font-medium truncate'>{user.email}</p>
                    {address && (
                      <p className='text-[10px] font-mono text-gray-400 truncate'>{address.slice(0, 6)}...{address.slice(-4)}</p>
                    )}
                  </div>
                  {isConnected ? (
                    <button onClick={() => { setProfileOpen(false); disconnect(); }} className='w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-white/5 hover:text-rose-300 transition-colors cursor-pointer'>
                      Disconnect Wallet
                    </button>
                  ) : (
                    <button onClick={() => { setProfileOpen(false); connect({ connector: connectors[0] }); }} className='w-full text-left px-3 py-2 text-xs text-violet-300 hover:bg-white/5 transition-colors cursor-pointer'>
                      Connect Wallet
                    </button>
                  )}
                  <div className='border-t border-gray-800'>
                    <button
                      onClick={async () => { setProfileOpen(false); await signOut(); }}
                      className='w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer'
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {isConnected ? (
                <button
                  onClick={() => router.push('/signin')}
                  className='px-3 py-1.5 text-xs font-medium rounded-lg btn-violet cursor-pointer'
                >
                  Sign In
                </button>
              ) : (
                <button
                  onClick={() => connect({ connector: connectors[0] })}
                  className='px-3 py-1.5 text-xs font-medium rounded-lg btn-violet cursor-pointer'
                >
                  Connect Wallet
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
