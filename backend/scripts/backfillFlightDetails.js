/**
 * One-time backfill script: generates missing flight details
 * (flightNumber, bookingReference, departureDate, departureTime,
 *  launchTerminal, seatNumber) for all existing bookings that
 * are missing any of these fields.
 *
 * Usage: node backend/scripts/backfillFlightDetails.js
 *
 * Requires MONGO_URI in environment or .env at backend root.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { generateFlightDetails } = require('../utils/generateFlightDetails');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI not set. Create a .env file in backend/ with MONGO_URI.');
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const coll = db.collection('bookings');

  const cursor = coll.find({
    $or: [
      { flightNumber: { $exists: false } },
      { bookingReference: { $exists: false } },
      { departureDate: { $exists: false } },
      { departureTime: { $exists: false } },
      { launchTerminal: { $exists: false } },
      { seatNumber: { $exists: false } },
    ],
  });

  let updated = 0;
  for await (const booking of cursor) {
    const destId = booking.destinationId;
    const fields = generateFlightDetails(destId);

    await coll.updateOne(
      { _id: booking._id },
      {
        $set: {
          flightNumber: fields.flightNumber,
          bookingReference: fields.bookingReference,
          departureDate: fields.departureDate,
          departureTime: fields.departureTime,
          launchTerminal: fields.launchTerminal,
          seatNumber: fields.seatNumber,
        },
      },
    );
    updated++;
    console.log(`  Updated booking ${booking._id} (dest ${destId}): ${fields.flightNumber} / ${fields.bookingReference}`);
  }

  console.log(`\nDone. ${updated} booking(s) updated.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
