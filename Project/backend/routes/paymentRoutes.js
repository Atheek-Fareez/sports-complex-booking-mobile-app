const express = require('express');
const router = express.Router();
const { 
  initiatePayment, 
  confirmPayment, 
  adminVerifyPayment,
  adminRejectBooking,
  getPendingPayments
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, initiatePayment);
router.get('/pending', protect, admin, getPendingPayments);
router.post('/confirm', protect, confirmPayment);
router.get('/test-route', (req, res) => res.json({ message: "Payment routes are active" }));

router.post('/admin-verify', protect, admin, adminVerifyPayment);
router.post('/admin-reject', protect, admin, adminRejectBooking);

module.exports = router;
