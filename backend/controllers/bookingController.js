const User = require('../models/User');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { generateFlightDetails } = require('../utils/generateFlightDetails');

async function createBooking(req, res) {
  try {
    const {
      walletAddress, destinationId, transactionHash, tokenId, pricePaid,
      bookingReference, departureDate, departureTime, travelClass,
      seatNumber, availabilityStatus, availabilityCheckedAt,
      flightNumber, launchTerminal,
    } = req.body;
    const userId = req.user.id;

    if (!walletAddress || !destinationId || !transactionHash || tokenId === undefined || !pricePaid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await Booking.findOne({ transactionHash: transactionHash.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Duplicate transaction hash' });
    }

    // Generate fallback flight details for any missing fields
    const fallback = generateFlightDetails(destinationId, { departureDate, travelClass });

    // Normalize travel class so a capitalized/mismatched value can't fail the enum validation
    const normalizeTravelClass = (value, fallbackValue) => {
      if (!value) return fallbackValue;
      const normalized = String(value).toLowerCase();
      return ['economy', 'business', 'first'].includes(normalized) ? normalized : fallbackValue;
    };

    const booking = await Booking.create({
      userId,
      walletAddress: walletAddress.toLowerCase(),
      destinationId,
      transactionHash: transactionHash.toLowerCase(),
      tokenId,
      pricePaid,
      bookingReference: bookingReference || fallback.bookingReference,
      departureDate: departureDate || fallback.departureDate,
      departureTime: departureTime || fallback.departureTime,
      travelClass: normalizeTravelClass(travelClass, fallback.passengerClass),
      seatNumber: seatNumber || fallback.seatNumber,
      availabilityStatus: availabilityStatus || 'confirmed',
      availabilityCheckedAt: availabilityCheckedAt || undefined,
      flightNumber: flightNumber || fallback.flightNumber,
      launchTerminal: launchTerminal || fallback.launchTerminal,
    });

    const ticketEntry = {
      destinationId,
      txHash: transactionHash.toLowerCase(),
      tokenId,
      purchasedAt: new Date(),
    };

    await User.findByIdAndUpdate(userId, { $push: { tickets: ticketEntry } });

    // Generate transaction notification
    Notification.create({
      userId,
      type: 'transaction',
      message: `Booking confirmed: ${destinationId} — NFT Ticket #${tokenId} minted.`,
      tokenId,
      txHash: transactionHash,
    }).catch(err => console.error('Transaction notification error:', err));

    res.status(201).json({ booking });
  } catch (err) {
    console.error('Create booking error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Duplicate transaction hash or booking reference' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getBookingHistory(req, res) {
  try {
    const userId = req.user.id;
    const bookings = await Booking.find({ userId }).sort({ createdAt: -1 }).lean();
    res.json({ bookings });
  } catch (err) {
    console.error('Get booking history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { createBooking, getBookingHistory };
