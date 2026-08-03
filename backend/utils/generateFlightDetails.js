/**
 * Generates flight detail fields for a booking.
 * Used as fallback when the frontend doesn't supply these fields.
 * Mirrors the logic in src/data/travel.ts.
 */

const LAUNCH_TIMES = {
  1:'08:00',2:'10:00',3:'12:00',4:'12:30',5:'14:00',6:'14:30',7:'14:45',
  8:'16:00',9:'16:30',10:'16:45',11:'17:00',12:'17:15',13:'18:00',
  14:'18:30',15:'18:45',16:'20:00',17:'20:30',18:'22:00',19:'22:30',20:'00:00',
};

const TERMINALS = {
  1:'Mercury Orbital Hub',2:'Venus Station Alpha',3:'Earth Orbital Gateway',
  4:'Luna Gateway Station',5:'Mars Approach Station',6:'Phobos Dock',
  7:'Deimos Landing',8:'Jupiter Orbital Station',9:'Io Surface Terminal',
  10:'Europa Iceport',11:'Ganymede Central',12:'Callisto Outpost',
  13:'Saturn Ring Station',14:'Titan Aeroport',15:'Enceladus Geyser Base',
  16:'Uranus Deep Station',17:'Titania Chasmport',18:'Neptune Abyssal Terminal',
  19:'Triton Cryodock',20:'Pluto Frontier Gate',
};

function generateBookingReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = '';
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return 'SX-' + ref;
}

function generateFlightDetails(destinationId, overrides = {}) {
  const flightNumber = 'SX' + String(destinationId).padStart(3, '0');
  const bookingReference = generateBookingReference();
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const departureDate = d.toISOString().split('T')[0];
  const departureTime = LAUNCH_TIMES[destinationId] || '20:30';
  const launchTerminal = TERMINALS[destinationId] || 'Earth Orbital Gateway';
  const row = Math.floor(Math.random() * 40) + 1;
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 6));
  const seatNumber = row + letter;

  return {
    flightNumber,
    bookingReference,
    departureDate: overrides.departureDate || departureDate,
    departureTime,
    launchTerminal,
    seatNumber,
    passengerClass: overrides.passengerClass || 'economy',
  };
}

module.exports = { generateFlightDetails };
