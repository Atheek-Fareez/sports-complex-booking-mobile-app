const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

// @desc    Initiate payment for a booking
// @route   POST /api/payments
// @access  Private
exports.initiatePayment = async (req, res) => {
  try {
    const { bookingId, amount, termsAccepted, maskedCardNumber, cardholderName, paymentMode } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({ message: 'Booking ID and amount are required' });
    }

    if (!termsAccepted) {
      return res.status(400).json({ message: 'Terms and conditions must be accepted before booking' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to pay for this booking' });
    }

    // PART 3: Save in PAYMENT DATABASE
    const payment = await Payment.create({
      userId: req.user.id,
      bookingId,
      amount,
      paymentMode: paymentMode || 'full',
      termsAccepted,
      maskedCardNumber: maskedCardNumber || '',
      cardholderName: cardholderName || '',
      paymentStatus: 'pending', // Will be updated in confirmPayment
      verificationStatus: 'Pending'
    });

    // Update booking status
    booking.status = 'pending_payment';
    await booking.save();

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Confirm successful mock payment (User side submit)
// @route   POST /api/payments/confirm
// @access  Private
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentId, transactionId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // PART 8: WHEN USER SUBMITS VALID PAYMENT FORMAT
    payment.paymentStatus = 'pending_verification';
    payment.verificationStatus = 'Pending';
    payment.transactionId = transactionId || `MOCK-TXN-${Date.now()}`;
    await payment.save();

    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      booking.status = 'pending_verification';
      booking.paymentMode = payment.paymentMode || 'full';
      booking.paidAmount = payment.amount || 0;
      booking.remainingBalance = (booking.totalAmount || 0) - (payment.amount || 0);
      await booking.save();
    }

    res.json({
      success: true,
      message: 'Payment submitted for admin verification',
      data: { ...payment.toObject(), bookingId: payment.bookingId }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all pending payments for admin verification
// @route   GET /api/payments/pending
// @access  Private/Admin
exports.getPendingPayments = async (req, res) => {
  try {
    // PART 4: Fetch bookings awaiting verification
    const bookings = await Booking.find({ status: 'pending_verification' })
      .populate('userId', 'name fullName email phone')
      .populate('roomId')
      .populate('courtId')
      .populate('poolId');

    const results = await Promise.all(bookings.map(async (b) => {
      const payment = await Payment.findOne({ bookingId: b._id });
      return {
        ...b.toObject(),
        paymentId: payment?._id,
        paymentStatus: payment?.paymentStatus,
        verificationStatus: payment?.verificationStatus,
        maskedCardNumber: payment?.maskedCardNumber,
        cardholderName: payment?.cardholderName,
        submittedAt: payment?.createdAt,
      };
    }));

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Admin verify payment and confirm booking
// @route   POST /api/payments/admin-verify
// @access  Private/Admin
exports.adminVerifyPayment = async (req, res) => {
  const { bookingId } = req.body;
  console.log(`[ADMIN] Request to verify booking: ${bookingId}`);

  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
    console.log('[ADMIN] Invalid Booking ID format:', bookingId);
    return res.status(400).json({ message: 'Invalid or missing Booking ID' });
  }

  try {
    const booking = await Booking.findById(bookingId)
      .populate('userId')
      .populate('roomId')
      .populate('courtId')
      .populate('poolId');

    if (!booking) {
      console.log('[ADMIN] Booking not found');
      return res.status(404).json({ message: 'Booking not found' });
    }

    // PART 8: WHEN ADMIN APPROVES
    // Align with Part 5: bookingStatus=confirmed, paymentStatus=success
    booking.status = 'confirmed';
    await booking.save();
    console.log(`[ADMIN] Booking ${bookingId} status updated to CONFIRMED`);

    const payment = await Payment.findOne({ bookingId: booking._id });
    if (payment) {
      payment.paymentStatus = 'success';
      payment.verificationStatus = 'Approved';
      await payment.save();
      console.log(`[ADMIN] Payment ${payment._id} for booking ${bookingId} updated to SUCCESS`);
    } else {
      console.warn(`[ADMIN] No payment record found for booking ${bookingId}`);
    }



    console.log('[ADMIN] Verification workflow completed successfully, sending response');
    return res.json({
      success: true,
      message: 'Booking confirmed and user notified via SMS',
      data: booking
    });
  } catch (error) {
    console.error('[ADMIN] CRITICAL Verification Error:', error);
    return res.status(500).json({ message: 'Server Error during verification', details: error.message });
  }
};

// @desc    Admin reject booking
// @route   POST /api/payments/admin-reject
// @access  Private/Admin
exports.adminRejectBooking = async (req, res) => {
  const { bookingId } = req.body;
  console.log(`[ADMIN] Request to reject booking: ${bookingId}`);

  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
    return res.status(400).json({ message: 'Invalid or missing Booking ID' });
  }

  try {
    const booking = await Booking.findById(bookingId).populate('userId');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // PART 8: WHEN ADMIN REJECTS
    booking.status = 'rejected';
    await booking.save();

    const payment = await Payment.findOne({ bookingId: booking._id });
    if (payment) {
      payment.paymentStatus = 'rejected';
      payment.verificationStatus = 'Rejected';
      await payment.save();
    }



    return res.json({ success: true, message: 'Booking rejected and user notified.' });
  } catch (error) {
    console.error('[ADMIN] Rejection Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};
// @desc    Get count of pending payment verifications
// @route   GET /api/admin/pending-verifications/count
// @access  Private/Admin
exports.getPendingVerificationCount = async (req, res) => {
  try {
    const count = await Payment.countDocuments({ verificationStatus: 'Pending' });
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('[ADMIN] Count Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get count of user's own pending payment verifications
// @route   GET /api/user/my-pending-bookings/count
// @access  Private
exports.getMyPendingPaymentCount = async (req, res) => {
  try {
    const count = await Payment.countDocuments({ 
      userId: req.user._id, 
      verificationStatus: 'Pending' 
    });
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('[USER] Count Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
