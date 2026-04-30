const express = require('express');
const router = express.Router();
const { getMyPendingPaymentCount } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/user/my-pending-bookings/count
 * @desc    Get count of user's own pending payment verifications
 * @access  Private
 */
router.get('/my-pending-bookings/count', protect, getMyPendingPaymentCount);

module.exports = router;
