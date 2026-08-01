'use client';

import { useState } from 'react';
import { bodies } from '@/data/bodies';

type PlanetMenuProps = {
  onPlanetSelect: (planetId: number) => void;
  selectedBodyId: number | null;
};

const PlanetMenu: React.FC<PlanetMenuProps> = ({ onPlanetSelect, selectedBodyId }) => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [favorites, setFavorites] = useState<number[]>([]);

  const planets = bodies.filter(b => b.type === 'planet');
  const allMoons = bodies.filter(b => b.type === 'moon');

  const searchQ = search.toLowerCase().trim();

  const filteredPlanets = searchQ
    ? planets.filter(p =>
        p.name.toLowerCase().includes(searchQ) ||
        allMoons.some(m => m.parentPlanetId === p.id && m.name.toLowerCase().includes(searchQ))
      )
    : planets;

  const filteredMoons = (planetId: number) =>
    searchQ
      ? allMoons.filter(m => m.parentPlanetId === planetId && m.name.toLowerCase().includes(searchQ))
      : allMoons.filter(m => m.parentPlanetId === planetId);

  const hasMatchingMoons = (planetId: number) =>
    allMoons.some(m => m.parentPlanetId === planetId && m.name.toLowerCase().includes(searchQ));

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleFavorite = (id: number) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const favoriteBodies = bodies.filter(b => favorites.includes(b.id));

  return (
    <div className='w-full p-3 space-y-3'>
      {/* Search */}
      <div className='relative'>
        <svg className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <circle cx='11' cy='11' r='8' /><path d='m21 21-4.35-4.35' />
        </svg>
        <input
          type='text'
          placeholder='Search destinations...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='w-full pl-9 pr-3 py-2 text-xs bg-gray-800/60 border border-gray-700/50 rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/10 transition-colors'
        />
      </div>

      {/* Favorites */}
      {favoriteBodies.length > 0 && !searchQ && (
        <div>
          <h3 className='text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 px-1'>Favorites</h3>
          <div className='space-y-0.5'>
            {favoriteBodies.map(body => (
              <div
                key={body.id}
                role='button'
                tabIndex={0}
                onClick={() => onPlanetSelect(body.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlanetSelect(body.id); } }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all cursor-pointer ${
                  selectedBodyId === body.id
                    ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                    : 'text-gray-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <button
                  type='button'
                  aria-label={favorites.includes(body.id) ? 'Remove from favorites' : 'Add to favorites'}
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(body.id); }}
                  className='text-[10px] text-amber-400 hover:text-amber-300 cursor-pointer px-0.5'
                >
                  ★
                </button>
                <span>{body.name}</span>
                <span className='text-[9px] text-gray-600 ml-auto'>{body.type === 'planet' ? 'Planet' : 'Moon'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planets with nested moons */}
      <div>
        <h3 className='text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 px-1'>Destinations</h3>
        <div className='space-y-0.5'>
          {filteredPlanets.map(planet => {
            const moons = filteredMoons(planet.id);
            const isExpanded = expanded.has(planet.id) || (searchQ && hasMatchingMoons(planet.id));
            const disabledRoute = planet.id === 3;

            return (
              <div key={planet.id}>
                {/* Planet row */}
                <button
                  type='button'
                  onClick={() => { toggleExpand(planet.id); onPlanetSelect(planet.id); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all cursor-pointer ${
                    selectedBodyId === planet.id
                      ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                      : 'text-gray-300 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className='text-[9px] text-gray-600 w-3 shrink-0'>
                    {moons.length > 0 ? (isExpanded ? '▾' : '▸') : ' '}
                  </span>
                  <span
                    className='w-2 h-2 rounded-full shrink-0'
                    style={{ backgroundColor: planet.color ?? '#666' }}
                  />
                  <span className={disabledRoute ? 'text-gray-500' : ''}>{planet.name}</span>
                </button>

                {/* Moons */}
                {isExpanded && moons.length > 0 && (
                  <div className='ml-4 space-y-0.5 mt-0.5 mb-1'>
                    {moons.map(moon => (
                      <button
                        key={moon.id}
                        type='button'
                        onClick={() => onPlanetSelect(moon.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all cursor-pointer ${
                          selectedBodyId === moon.id
                            ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                            : 'text-gray-300 hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <span className='w-3 shrink-0' />
                        <span className='w-1.5 h-1.5 rounded-full shrink-0' style={{ backgroundColor: moon.color ?? '#666' }} />
                        <span>{moon.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlanetMenu;
