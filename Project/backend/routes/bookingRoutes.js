const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, getFacilityBookings, cancelPendingBooking } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/facility/:facilityId', getFacilityBookings);
router.delete('/cancel-pending/:id', protect, cancelPendingBooking);

module.exports = router;
