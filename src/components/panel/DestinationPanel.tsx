'use client';

import { bodies } from '@/data/bodies';
import { getTravelRoute } from '@/data/travel';

interface DestinationPanelProps {
  selectedBodyId: number | null;
}

const DestinationPanel: React.FC<DestinationPanelProps> = ({ selectedBodyId }) => {
  if (!selectedBodyId) return null;

  const body = bodies.find(b => b.id === selectedBodyId);
  const route = body && body.id !== 3 ? getTravelRoute(body.id) : null;
  if (!body) return null;

  return (
    <div className='w-full p-4 glass-card rounded-xl min-w-0'>
      <h2 className='text-xs font-bold text-violet-300 uppercase tracking-wider mb-3'>Destination</h2>
      <div className='space-y-3 text-white min-w-0'>
        <div className='flex items-center gap-3'>
          <span className='w-3 h-3 rounded-full shrink-0' style={{ backgroundColor: body.color ?? '#666' }} />
          <div>
            <h3 className='text-lg font-bold'>{body.name}</h3>
            <p className='text-xs text-gray-500'>{body.type === 'planet' ? 'Planet' : 'Moon'}</p>
          </div>
        </div>
        <p className='text-sm text-gray-400 leading-relaxed'>{body.description}</p>
        <div className='h-px bg-gradient-to-r from-violet-500/20 via-gray-700/50 to-transparent' />
        <div className='space-y-2 text-xs'>
          {route && (
            <>
              <p className='flex justify-between'>
                <span className='text-gray-500'>Distance</span>
                <span className='text-white font-mono'>{route.distanceAU} AU</span>
              </p>
              <p className='flex justify-between'>
                <span className='text-gray-500'>Travel Time</span>
                <span className='text-white font-mono'>{route.estimatedTravelDays.toLocaleString()} days</span>
              </p>
              <p className='flex justify-between'>
                <span className='text-gray-500'>Terminal</span>
                <span className='text-white text-right max-w-[180px]'>{route.launchTerminal}</span>
              </p>
              <p className='flex justify-between'>
                <span className='text-gray-500'>Launch</span>
                <span className='text-white font-mono'>{route.launchTimeUTC} UTC</span>
              </p>
            </>
          )}
          <p className='flex justify-between'>
            <span className='text-gray-500'>Price</span>
            <span className='text-emerald-400 font-mono font-bold'>{body.priceEth} ETH</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DestinationPanel;
