'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import PlanetMenu from '@/components/menu/PlanetMenu';
import SolarSystem from '@/components/scene/SolarSystem';
import DestinationPanel from '@/components/panel/DestinationPanel';
import RoutePanel from '@/components/panel/RoutePanel';
import { bodies } from '@/data/bodies';
import { getTravelRoute } from '@/data/travel';
import NavBar from '@/components/layout/NavBar';
import BookTicketButton from '@/components/panel/BookTicketButton';
import SolarExpressLogo from '@/components/ui/SolarExpressLogo';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();
  const [focusedPlanetId, setFocusedPlanetId] = useState<number | null>(null);
  const [selectedBodyId, setSelectedBodyId] = useState<number | null>(null);
  const [selectedMoonId, setSelectedMoonId] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (!checkingSession && !user) {
      router.replace('/signin');
    }
  }, [checkingSession, user, router]);

  if (checkingSession) {
    return <LoadingScreen visible message='Checking session...' />;
  }

  if (!user) return null;

  const handlePlanetSelect = (id: number) => {
    setFocusedPlanetId(id);
    setSelectedBodyId(id);
    const body = bodies.find(b => b.id === id);
    setSelectedMoonId(body?.type === 'moon' ? id : null);
  };

  const isFocused = (planetId: number) => {
    if (focusedPlanetId === planetId) return true;
    if (selectedMoonId) {
      const moon = bodies.find(b => b.id === selectedMoonId);
      return moon?.parentPlanetId === planetId;
    }
    return false;
  };
  const selectedBody = selectedBodyId ? bodies.find(b => b.id === selectedBodyId) ?? null : null;
  const selectedRoute = selectedBody && selectedBody.id !== 3 ? getTravelRoute(selectedBody.id) : null;

  const handleSelectPlanetAndPanel = (id: number) => {
    handlePlanetSelect(id);
    setPanelOpen(true);
    setMenuOpen(false);
  };

  return (
    <div className='h-full w-full overflow-hidden bg-[#09090b] text-white flex flex-col'>
      <NavBar />

      <div className='flex-1 min-h-0 flex flex-col sm:flex-row pb-14 sm:pb-0'>
        {/* Left Sidebar — hidden on mobile, toggleable overlay */}
        <div className='hidden sm:block w-56 shrink-0 overflow-y-auto overflow-x-hidden border-r border-[rgba(167,139,250,0.1)]'>
          <PlanetMenu
            onPlanetSelect={handlePlanetSelect}
            selectedBodyId={selectedBodyId}
          />
        </div>

        {/* Mobile planet menu toggle */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          className='sm:hidden fixed left-3 top-[60px] z-30 w-9 h-9 flex items-center justify-center rounded-lg bg-gray-900/90 border border-gray-700/60 text-gray-300 shadow-lg cursor-pointer'
          aria-label='Toggle planet list'
        >
          <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
            <circle cx='12' cy='12' r='10' /><line x1='12' y1='2' x2='12' y2='22' /><line x1='2' y1='12' x2='22' y2='12' />
          </svg>
        </button>

        {/* Mobile planet menu overlay */}
        {menuOpen && (
          <div className='sm:hidden fixed inset-0 z-40 flex'>
            <div className='absolute inset-0 bg-black/60' onClick={() => setMenuOpen(false)} />
            <div className='relative w-[280px] max-w-[80vw] h-full bg-gray-900/98 border-r border-gray-700/60 overflow-y-auto shadow-2xl animate-slide-in-left'>
              <div className='flex items-center justify-between p-3 border-b border-gray-800'>
                <span className='text-sm font-bold text-white'>Destinations</span>
                <button onClick={() => setMenuOpen(false)} className='w-7 h-7 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white text-xs cursor-pointer'>✕</button>
              </div>
              <PlanetMenu
                onPlanetSelect={handleSelectPlanetAndPanel}
                selectedBodyId={selectedBodyId}
              />
            </div>
          </div>
        )}

        {/* Center — Solar System */}
        <div className='flex-1 min-w-0 min-h-0 relative'>
          <SolarSystem
            bodies={bodies}
            focusedPlanetId={focusedPlanetId}
            selectedMoonId={selectedMoonId}
            isFocused={isFocused}
            onPlanetSelect={handlePlanetSelect}
          />
        </div>

        {/* Right Panel — bottom sheet on mobile, sidebar on desktop */}
        <div className='hidden sm:block w-72 shrink-0 overflow-y-auto overflow-x-hidden border-l border-[rgba(167,139,250,0.1)] bg-[#09090b]/50'>
          <div className='p-4 space-y-3 min-w-0'>
            {selectedBody && selectedRoute ? (
              <>
                <DestinationPanel selectedBodyId={selectedBodyId} />
                <RoutePanel selectedBodyId={selectedBodyId} />
                <BookTicketButton selectedBodyId={selectedBodyId} />
              </>
            ) : (
              <div className='flex flex-col items-center justify-center min-h-[300px] text-center px-4 space-y-4'>
                <SolarExpressLogo size={64} />
                <div>
                  <h2 className='text-base font-bold text-white'>SolarExpress</h2>
                  <p className='text-xs text-gray-500 mt-1'>Explore the Solar System.</p>
                </div>
                <div className='flex flex-col gap-2 w-full max-w-[200px]'>
                  <Link href='/booking-history' className='w-full py-2 text-center text-xs font-medium rounded-lg btn-violet cursor-pointer'>
                    My Tickets
                  </Link>
                  <Link href='/faq' className='w-full py-2 text-center text-xs font-medium rounded-lg bg-gray-800/60 text-gray-300 border border-gray-700/50 hover:bg-gray-700/60 transition-colors'>
                    FAQ
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile bottom sheet for right panel */}
        {selectedBody && selectedRoute && (
          <>
            {/* Floating action button to open panel */}
            {!panelOpen && (
              <button
                onClick={() => setPanelOpen(true)}
                className='sm:hidden fixed right-3 bottom-20 z-30 w-12 h-12 flex items-center justify-center rounded-full bg-violet-600 shadow-lg shadow-violet-600/30 text-white cursor-pointer'
                aria-label='View destination details'
              >
                <svg className='w-5 h-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                  <path d='M12 2L2 7l10 5 10-5-10-5z'/><path d='M2 17l10 5 10-5'/><path d='M2 12l10 5 10-5'/>
                </svg>
              </button>
            )}

            {/* Bottom sheet */}
            <div className={`sm:hidden fixed inset-x-0 bottom-0 z-30 transition-transform duration-300 ${panelOpen ? 'translate-y-0' : 'translate-y-full'}`}>
              <div className='absolute inset-0 bg-black/40' onClick={() => setPanelOpen(false)} />
              <div className='relative max-h-[70vh] bg-gray-900/98 border-t border-gray-700/60 rounded-t-2xl shadow-2xl flex flex-col'>
                {/* Drag handle */}
                <div className='shrink-0 pt-2 pb-1'>
                  <div className='w-10 h-1 rounded-full bg-gray-600 mx-auto' />
                </div>
                {/* Scrollable content */}
                <div className='flex-1 overflow-y-auto px-4 space-y-3'>
                  <DestinationPanel selectedBodyId={selectedBodyId} />
                  <RoutePanel selectedBodyId={selectedBodyId} />
                </div>
                {/* Sticky action button */}
                <div className='shrink-0 px-4 pt-3 pb-6 border-t border-gray-800/60'>
                  <BookTicketButton selectedBodyId={selectedBodyId} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
