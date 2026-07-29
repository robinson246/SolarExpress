'use client';

import { getTravelRoute } from '@/data/travel';

interface RoutePanelProps {
  selectedBodyId: number | null;
}

const RoutePanel: React.FC<RoutePanelProps> = ({ selectedBodyId }) => {
  if (!selectedBodyId || selectedBodyId === 3) return null;

  const route = getTravelRoute(selectedBodyId);
  if (!route) return null;

  return (
    <div className='w-full p-4 glass-card rounded-xl min-w-0'>
      <h2 className='text-xs font-bold text-violet-300 uppercase tracking-wider mb-3'>Route</h2>
      <div className='space-y-0 text-xs'>
        <div className='flex items-center gap-2'>
          <span className='w-2 h-2 rounded-full bg-violet-400 shrink-0' />
          <span className='text-gray-300 font-medium'>Earth</span>
        </div>
        <div className='ml-1 pl-3 border-l border-violet-500/20 space-y-2 py-1'>
          <div className='flex items-center gap-2'>
            <span className='w-1.5 h-1.5 rounded-full bg-violet-500/50 shrink-0' />
            <span className='text-gray-500'>{route.launchTerminal}</span>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <span className='w-2 h-2 rounded-full bg-emerald-400 shrink-0' />
          <span className='text-gray-300 font-medium'>{route.destination}</span>
        </div>
      </div>
      <div className='mt-3 pt-3 border-t border-gray-800'>
        <p className='flex justify-between text-xs'>
          <span className='text-gray-500'>Distance</span>
          <span className='text-white font-mono'>{route.distanceAU} AU</span>
        </p>
        <p className='flex justify-between text-xs mt-1'>
          <span className='text-gray-500'>Duration</span>
          <span className='text-white font-mono'>{route.estimatedTravelDays.toLocaleString()} days</span>
        </p>
      </div>
    </div>
  );
};

export default RoutePanel;
