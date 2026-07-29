'use client';

import React from 'react';
import { bodies } from '@/data/bodies';

type MoonMenuProps = {
  planetId: number;
  onMoonSelect: (moonId: number) => void;
  onOrbitSelect: () => void;
};

const MoonMenu: React.FC<MoonMenuProps> = ({ planetId, onMoonSelect, onOrbitSelect }) => {
  const moons = bodies.filter(b => b.type === 'moon' && b.parentPlanetId === planetId);
  const planet = bodies.find(b => b.id === planetId);

  return (
    <div className='w-full p-3 space-y-1'>
      <h3 className='text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 px-1'>Moons of {planet?.name}</h3>
      <button
        onClick={onOrbitSelect}
        className='w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-left transition-all cursor-pointer text-gray-300 hover:bg-white/5 border border-transparent'
      >
        <span className='w-2 h-2 rounded-full bg-violet-400 shrink-0' />
        <span>{planet?.name} (Orbit)</span>
      </button>
      {moons.map(moon => (
        <button
          key={moon.id}
          onClick={() => onMoonSelect(moon.id)}
          className='w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-left transition-all cursor-pointer text-gray-300 hover:bg-white/5 border border-transparent'
        >
          <span className='w-2 h-2 rounded-full shrink-0' style={{ backgroundColor: moon.color ?? '#666' }} />
          <span>{moon.name}</span>
        </button>
      ))}
    </div>
  );
};

export default MoonMenu;
