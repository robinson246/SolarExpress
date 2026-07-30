'use client';

import { useSyncExternalStore } from 'react';
import { Html } from '@react-three/drei';
import { Body } from '@/data/bodies';
import { getIsModalOpen, subscribe } from '@/lib/modal-store';
import Earth from './Earth';
import PlanetRenderer from './PlanetRenderer';

interface PlanetProps {
  body: Body;
  isFocused: boolean;
  position: [number, number, number];
  onClick?: () => void;
}

const Planet: React.FC<PlanetProps> = ({ body, isFocused, position, onClick }) => {
  const size = body.type === 'planet' ? 0.5 : 0.3;
  const scale = isFocused ? 1.4 : 1;
  const isModalOpen = useSyncExternalStore(subscribe, getIsModalOpen, () => false);

  // Earth renders its own multi-layer stack
  if (body.id === 3) {
    return (
      <group position={position} onClick={onClick} scale={scale}>
        <Earth size={size} />
        {!isModalOpen && (
          <Html
            position={[0, size + 0.6, 0]}
            center
            distanceFactor={15}
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                color: '#ffffff',
                fontSize: '13px',
                fontFamily: 'sans-serif',
                textShadow: '0 0 6px rgba(0,0,0,0.9)',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
              className='hidden sm:block'
            >
              {body.name}
            </div>
          </Html>
        )}
      </group>
    );
  }

  return (
    <group position={position} onClick={onClick} scale={scale}>
      <PlanetRenderer bodyId={body.id} size={size} />

      {/* Name label */}
      {!isModalOpen && (
        <Html
          position={[0, size + 0.6, 0]}
          center
          distanceFactor={15}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              color: '#ffffff',
              fontSize: '13px',
              fontFamily: 'sans-serif',
              textShadow: '0 0 6px rgba(0,0,0,0.9)',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
            className='hidden sm:block'
          >
            {body.name}
          </div>
        </Html>
      )}
    </group>
  );
};

export default Planet;
