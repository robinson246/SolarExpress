const API_BASE = '/api';

export type SyncBookingPayload = {
  walletAddress: string;
  destinationId: number;
  transactionHash: string;
  tokenId: number;
  pricePaid: string;
  bookingReference?: string;
  departureDate?: string;
  departureTime?: string;
  travelClass?: string;
  seatNumber?: string;
  availabilityStatus?: string;
  availabilityCheckedAt?: string;
  flightNumber?: string;
  launchTerminal?: string;
};

export type BookingRecord = {
  _id: string;
  userId: string;
  walletAddress: string;
  destinationId: number;
  transactionHash: string;
  tokenId: number;
  pricePaid: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  bookingReference?: string;
  departureDate?: string;
  departureTime?: string;
  travelClass?: string;
  seatNumber?: string;
  availabilityStatus?: string;
  availabilityCheckedAt?: string;
  flightNumber?: string;
  launchTerminal?: string;
};

export async function syncBooking(payload: SyncBookingPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Backend sync failed (${res.status})`);
  }
}

export async function fetchBookingHistory(): Promise<BookingRecord[]> {
  const res = await fetch(`${API_BASE}/bookings/history`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Failed to fetch booking history (${res.status})`);
  }

  const data = await res.json();
  return data.bookings ?? [];
}
