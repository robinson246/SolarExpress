'use client';

import { useMutation } from '@tanstack/react-query';
import { syncBooking, type SyncBookingPayload } from '@/lib/api';

export function useSyncBooking() {
  return useMutation({
    mutationFn: (payload: SyncBookingPayload) => syncBooking(payload),
  });
}
