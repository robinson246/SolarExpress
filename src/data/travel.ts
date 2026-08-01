import { parseEther, formatEther } from 'viem';

export type TravelRoute = {
  origin: string;
  destination: string;
  distanceAU: number;
  estimatedTravelDays: number;
  launchTerminal: string;
  launchTimeUTC: string;
  flightNumber: string;
};

export function getClassPriceEth(priceEth: string, travelClass: string): string {
  if (travelClass !== 'business') return priceEth;
  return formatEther((parseEther(priceEth) * 5n) / 2n);
}

const LAUNCH_TIMES: Record<number, string> = {
  1: '08:00',   // Mercury
  2: '10:00',   // Venus
  3: '12:00',   // Earth
  4: '12:30',   // Luna
  5: '14:00',   // Mars
  6: '14:30',   // Phobos
  7: '14:45',   // Deimos
  8: '16:00',   // Jupiter
  9: '16:30',   // Io
  10: '16:45',  // Europa
  11: '17:00',  // Ganymede
  12: '17:15',  // Callisto
  13: '18:00',  // Saturn
  14: '18:30',  // Titan
  15: '18:45',  // Enceladus
  16: '20:00',  // Uranus
  17: '20:30',  // Titania
  18: '22:00',  // Neptune
  19: '22:30',  // Triton
  20: '00:00',  // Pluto
};

const TERMINALS: Record<number, string> = {
  1: 'Mercury Orbital Hub',
  2: 'Venus Station Alpha',
  3: 'Earth Orbital Gateway',
  4: 'Luna Gateway Station',
  5: 'Mars Approach Station',
  6: 'Phobos Dock',
  7: 'Deimos Landing',
  8: 'Jupiter Orbital Station',
  9: 'Io Surface Terminal',
  10: 'Europa Iceport',
  11: 'Ganymede Central',
  12: 'Callisto Outpost',
  13: 'Saturn Ring Station',
  14: 'Titan Aeroport',
  15: 'Enceladus Geyser Base',
  16: 'Uranus Deep Station',
  17: 'Titania Chasmport',
  18: 'Neptune Abyssal Terminal',
  19: 'Triton Cryodock',
  20: 'Pluto Frontier Gate',
};

const DISTANCES_AU: Record<number, number> = {
  1: 0.39,   // Mercury
  2: 0.72,   // Venus
  3: 0.00,   // Earth (starting point)
  4: 0.0026, // Luna
  5: 0.52,   // Mars
  6: 0.52,   // Phobos (same as Mars)
  7: 0.52,   // Deimos (same as Mars)
  8: 2.7,    // Jupiter
  9: 2.7,    // Io
  10: 2.7,   // Europa
  11: 2.7,   // Ganymede
  12: 2.7,   // Callisto
  13: 9.5,   // Saturn
  14: 9.5,   // Titan
  15: 9.5,   // Enceladus
  16: 19.2,  // Uranus
  17: 19.2,  // Titania
  18: 30.1,  // Neptune
  19: 30.1,  // Triton
  20: 39.5,  // Pluto
};

const TRAVEL_DAYS: Record<number, number> = {
  1: 120,    // Mercury ~4 months
  2: 150,    // Venus ~5 months
  3: 0,      // Earth
  4: 3,      // Luna
  5: 210,    // Mars ~7 months
  6: 210,    // Phobos
  7: 210,    // Deimos
  8: 730,    // Jupiter ~2 years
  9: 730,    // Io
  10: 730,   // Europa
  11: 730,   // Ganymede
  12: 730,   // Callisto
  13: 1460,  // Saturn ~4 years
  14: 1460,  // Titan
  15: 1460,  // Enceladus
  16: 2555,  // Uranus ~7 years
  17: 2555,  // Titania
  18: 3650,  // Neptune ~10 years
  19: 3650,  // Triton
  20: 4015,  // Pluto ~11 years
};

export function getTravelRoute(destinationId: number): TravelRoute | null {
  if (destinationId === 3) return null; // Earth is origin
  const distanceAU = DISTANCES_AU[destinationId];
  const travelDays = TRAVEL_DAYS[destinationId];
  const terminal = TERMINALS[destinationId];
  const launchTime = LAUNCH_TIMES[destinationId];
  if (distanceAU === undefined || travelDays === undefined || !terminal || !launchTime) return null;
  return {
    origin: 'Earth',
    destination: TERMINALS[destinationId].replace(' Station', '').replace(' Gateway', '').replace(' Terminal', '').replace(' Orbital Hub', '').replace(' Hub', '').split(' ')[0],
    distanceAU,
    estimatedTravelDays: travelDays,
    launchTerminal: terminal,
    launchTimeUTC: launchTime,
    flightNumber: `SX${String(destinationId).padStart(3, '0')}`,
  };
}

export function generateBookingReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = '';
  for (let i = 0; i < 6; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SX-${ref}`;
}

export const PASSENGER_CLASSES = [
  { id: 'economy', label: 'Economy Class', available: true, description: 'Standard travel with all essential amenities.' },
  { id: 'business', label: 'Business Class', available: true, description: 'Priority boarding, extra legroom, and premium amenities.' },
  { id: 'first', label: 'First Class', available: false, description: '🔒 Temporarily Unavailable' },
] as const;

export function getLaunchTime(destinationId: number): string {
  return LAUNCH_TIMES[destinationId] ?? '12:00';
}

export function getLaunchTerminal(destinationId: number): string {
  return TERMINALS[destinationId] ?? 'Earth Orbital Gateway';
}

export function getDistanceAU(destinationId: number): number {
  return DISTANCES_AU[destinationId] ?? 0;
}

export function getTravelDays(destinationId: number): number {
  return TRAVEL_DAYS[destinationId] ?? 0;
}

export type FlightDetails = {
  flightNumber: string;
  bookingReference: string;
  departureDate: string;
  departureTime: string;
  launchTerminal: string;
  seatNumber: string;
};

export function generateFlightDetails(destinationId: number): FlightDetails {
  const flightNumber = `SX${String(destinationId).padStart(3, '0')}`;
  const bookingReference = generateBookingReference();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const departureDate = tomorrow.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const departureTime = LAUNCH_TIMES[destinationId] ?? '20:30';
  const launchTerminal = TERMINALS[destinationId] ?? 'Earth Orbital Gateway';
  const row = Math.floor(Math.random() * 40) + 1;
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 6));
  const seatNumber = `${row}${letter}`;

  return { flightNumber, bookingReference, departureDate, departureTime, launchTerminal, seatNumber };
}
