const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || ''}/api`;

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

let _authToken: string | null = null;
let _walletAddress: string | null = null;

export function setAuthToken(t: string | null) { _authToken = t; }
export function setWalletAddress(w: string | null) { _walletAddress = w; }

async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {};
  if (_authToken) headers['Authorization'] = `Bearer ${_authToken}`;
  if (_walletAddress) headers['x-wallet-address'] = _walletAddress;
  return fetch(url, { ...init, credentials: 'include', headers: { ...init?.headers, ...headers } });
}

export async function syncBooking(payload: SyncBookingPayload): Promise<void> {
  const res = await authFetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Backend sync failed (${res.status})`);
  }
}

export async function fetchBookingHistory(): Promise<BookingRecord[]> {
  const url = `${API_BASE}/bookings/history`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await authFetch(url, { signal: controller.signal });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || `Fetch failed (${res.status})`);
    }

    const data = await res.json();
    return data.bookings ?? [];
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}