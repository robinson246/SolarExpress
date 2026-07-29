'use client';

import { useConnection } from 'wagmi';

interface WalletStatusProps {
  linkedAddress: string | null;
}

export default function WalletStatus({ linkedAddress }: WalletStatusProps) {
  const { isConnected, address } = useConnection();

  if (!linkedAddress) return null;

  const shortened = `${linkedAddress.slice(0, 6)}...${linkedAddress.slice(-4)}`;

  return (
    <div className='flex items-center gap-2'>
      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-gray-500'}`} />
      <span className='text-xs font-mono text-gray-300'>{shortened}</span>
      {isConnected && address?.toLowerCase() !== linkedAddress.toLowerCase() && (
        <span className='text-[10px] text-amber-400'>mismatch</span>
      )}
    </div>
  );
}
