'use client';
import { useReadContract, useConnection } from 'wagmi';
import { BOOKING_HISTORY_ADDRESS, BOOKING_HISTORY_ABI } from '@/lib/contract';

export function useOnChainBookings() {
  const { address, isConnected } = useConnection();
  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: BOOKING_HISTORY_ADDRESS,
    abi: BOOKING_HISTORY_ABI,
    functionName: 'getBookings',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });
  return {
    onChainBookings: data as { ticketId: bigint; destinationId: bigint; pricePaid: bigint; timestamp: bigint }[] | undefined,
    isLoading,
    isError,
    error,
    refetch,
  };
}
