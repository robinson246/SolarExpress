'use client';

import { useBookingHistory } from '@/hooks/useBookingHistory';
import { useConnection } from 'wagmi';
import { bodies } from '@/data/bodies';

export default function DashboardStats() {
  const { address } = useConnection();
  const { data: bookings, isLoading } = useBookingHistory();

  if (!address || !bookings || isLoading || bookings.length === 0) return null;

  const totalTrips = bookings.length;
  const totalEth = bookings.reduce((sum, b) => sum + parseFloat(b.pricePaid), 0);
  const latest = bookings[0];
  const latestBody = bodies.find(b => b.id === latest.destinationId);

  const stats = [
    { label: 'Total Trips', value: totalTrips.toString() },
    { label: 'NFT Tickets', value: totalTrips.toString() },
    { label: 'ETH Spent', value: totalEth.toFixed(3) },
    { label: 'Latest', value: latestBody?.name ?? `#${latest.destinationId}` },
  ];

  return (
    <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
      {stats.map((s) => (
        <div key={s.label} className='bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-3'>
          <p className='text-[10px] text-gray-500 uppercase tracking-wider'>{s.label}</p>
          <p className='text-sm font-bold text-white mt-0.5 font-mono'>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
