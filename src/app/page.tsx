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

  return (
    <div className='h-full w-full overflow-hidden bg-[#09090b] text-white flex flex-col'>
      <NavBar />

      <div className='flex-1 min-h-0 flex flex-col sm:flex-row pb-14 sm:pb-0'>
        {/* Left Sidebar */}
        <div className='w-full sm:w-56 shrink-0 overflow-y-auto overflow-x-hidden border-b sm:border-b-0 sm:border-r border-[rgba(167,139,250,0.1)]'>
          <PlanetMenu
            onPlanetSelect={handlePlanetSelect}
            selectedBodyId={selectedBodyId}
          />
        </div>

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

        {/* Right Panel */}
        <div className='w-full sm:w-72 shrink-0 overflow-y-auto overflow-x-hidden border-t sm:border-t-0 sm:border-l border-[rgba(167,139,250,0.1)] bg-[#09090b]/50'>
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
                  <p className='text-xs text-gray-500 mt-1'>Explore the Solar System. Select a planet or moon to begin your journey.</p>
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
      </div>
    </div>
  );
}
