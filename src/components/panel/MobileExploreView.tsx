'use client';

import { useState } from 'react';
import { bodies, type Body } from '@/data/bodies';
import { getTravelRoute } from '@/data/travel';

interface MobileExploreViewProps {
  selectedBodyId: number | null;
  onSelectBody: (id: number) => void;
}

const PLANET_ORDER = [1, 2, 3, 5, 8, 13, 16, 18];

export default function MobileExploreView({ selectedBodyId, onSelectBody }: MobileExploreViewProps) {
  const [expandedPlanet, setExpandedPlanet] = useState<number | null>(null);

  const planets = PLANET_ORDER.map(id => bodies.find(b => b.id === id)!).filter(Boolean);
  const selectedBody = selectedBodyId ? bodies.find(b => b.id === selectedBodyId) : null;

  return (
    <div className='h-full w-full overflow-y-auto bg-[#09090b] px-3 pt-3 pb-6 space-y-2'>
      <div className='flex items-center gap-2 mb-3 px-1'>
        <svg className='w-4 h-4 text-violet-400 shrink-0' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <circle cx='12' cy='12' r='10' /><line x1='2' y1='12' x2='22' y2='12' /><circle cx='12' cy='12' r='2' />
        </svg>
        <span className='text-xs font-bold text-gray-400 uppercase tracking-wider'>Explore Planets</span>
      </div>

      <div className='space-y-2'>
        {planets.map((planet) => {
          const isSelected = selectedBodyId === planet.id || selectedBody?.parentPlanetId === planet.id;
          const isExpanded = expandedPlanet === planet.id || isSelected;
          const moons = bodies.filter(b => b.parentPlanetId === planet.id);

          return (
            <div key={planet.id}>
              <button
                onClick={() => {
                  if (moons.length > 0) {
                    setExpandedPlanet(isExpanded ? null : planet.id);
                  }
                  onSelectBody(planet.id);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-violet-500/10 border-violet-500/40'
                    : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Color dot */}
                <div
                  className='w-8 h-8 rounded-full shrink-0 border border-white/10'
                  style={{ backgroundColor: planet.color || '#666' }}
                />
                {/* Info */}
                <div className='flex-1 min-w-0 text-left'>
                  <p className='text-sm font-bold text-white'>{planet.name}</p>
                  <p className='text-[10px] text-gray-500 truncate'>{planet.description}</p>
                </div>
                {/* Price */}
                <div className='text-right shrink-0'>
                  <p className='text-xs font-bold text-emerald-400'>{planet.priceEth} ETH</p>
                  {moons.length > 0 && (
                    <p className='text-[9px] text-gray-600'>{moons.length} moon{moons.length > 1 ? 's' : ''}</p>
                  )}
                </div>
                {/* Chevron */}
                {moons.length > 0 && (
                  <svg
                    className={`w-3.5 h-3.5 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'
                  >
                    <polyline points='9 18 15 12 9 6' />
                  </svg>
                )}
              </button>

              {/* Moons */}
              {isExpanded && moons.length > 0 && (
                <div className='ml-5 mt-1 space-y-1 border-l-2 border-gray-800 pl-3'>
                  {moons.map((moon) => {
                    const isMoonSelected = selectedBodyId === moon.id;
                    return (
                      <button
                        key={moon.id}
                        onClick={() => onSelectBody(moon.id)}
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isMoonSelected
                            ? 'bg-violet-500/10 border-violet-500/30'
                            : 'bg-gray-900/40 border-gray-800/60 hover:border-gray-700'
                        }`}
                      >
                        <div
                          className='w-5 h-5 rounded-full shrink-0 border border-white/10'
                          style={{ backgroundColor: moon.color || '#888' }}
                        />
                        <div className='flex-1 min-w-0 text-left'>
                          <p className='text-xs font-medium text-gray-200'>{moon.name}</p>
                          <p className='text-[9px] text-gray-600'>{moon.description.slice(0, 50)}...</p>
                        </div>
                        <p className='text-[10px] font-bold text-emerald-400 shrink-0'>{moon.priceEth} ETH</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}