const express = require('express');
const { createBooking, getBookingHistory } = require('../controllers/bookingController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.post('/bookings', requireAuth, createBooking);
router.get('/bookings/history', requireAuth, getBookingHistory);

module.exports = router;
