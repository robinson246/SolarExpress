const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    destinationId: {
      type: Number,
      required: true,
    },
    transactionHash: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    tokenId: {
      type: Number,
      required: true,
      index: true,
    },
    pricePaid: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Confirmed', 'Refunded', 'Cancelled'],
      default: 'Confirmed',
    },
    bookingReference: {
      type: String,
      unique: true,
      sparse: true,
    },
    departureDate: String,
    departureTime: String,
    travelClass: {
      type: String,
      enum: ['economy', 'business', 'first'],
      default: 'economy',
    },
    seatNumber: String,
    availabilityStatus: {
      type: String,
      default: 'pending',
    },
    availabilityCheckedAt: String,
    flightNumber: String,
    launchTerminal: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
