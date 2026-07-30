'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchBookingHistory, type BookingRecord } from '@/lib/api';

export function useBookingHistory(enabled?: boolean) {
  return useQuery<BookingRecord[]>({
    queryKey: ['booking-history'],
    queryFn: fetchBookingHistory,
    enabled,
    staleTime: 15_000,
    retry: 2,
    retryDelay: 3000,
  });
}
