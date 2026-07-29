'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchBookingHistory, type BookingRecord } from '@/lib/api';

export function useBookingHistory() {
  return useQuery<BookingRecord[]>({
    queryKey: ['booking-history'],
    queryFn: fetchBookingHistory,
    staleTime: 30_000,
    retry: 1,
  });
}
