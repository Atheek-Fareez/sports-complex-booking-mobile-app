const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const SupportTicket = require('../models/SupportTicket');

// @desc    Create a new room booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const { 
      bookingType, 
      roomId, 
      startDate, 
      endDate, 
      totalAmount,
      numberOfGuests
    } = req.body;

    console.log('--- CREATE BOOKING START ---');
    console.log('Payload:', req.body);

    // 1. Basic Validation
    if (!bookingType || (bookingType !== 'room' && bookingType !== 'court' && bookingType !== 'pool')) {
      console.log('[400] Invalid booking type');
      return res.status(400).json({ message: 'Invalid booking type.' });
    }
    if (!roomId) {
      console.log('[400] Missing roomId');
      return res.status(400).json({ message: 'Facility ID is required' });
    }
    if (!startDate) {
      console.log('[400] Missing startDate');
      return res.status(400).json({ message: 'Start date/time is required' });
    }
    if (!endDate) {
      console.log('[400] Missing endDate');
      return res.status(400).json({ message: 'End date/time is required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    console.log('Parsed Dates:', { start: start.toISOString(), end: end.toISOString() });

    // 2. Date Logic Validation
    if (start >= end) {
      console.log('[400] Start >= End');
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      console.log('[400] Past Date');
      return res.status(400).json({ message: 'Cannot book for past dates' });
    }

    // 3. Facility Existence & Price Calculation
    let calculatedAmount = 0;
    
    if (bookingType === 'room') {
      const room = await Room.findById(roomId);
      if (!room) {
        console.log('[404] Room not found');
        return res.status(404).json({ message: 'Room not found' });
      }
      
      const diffTime = Math.abs(end - start);
      const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      calculatedAmount = (diffNights || 1) * room.price;
      console.log('Room Calc:', { diffNights, price: room.price, total: calculatedAmount });
    } else if (bookingType === 'court' || bookingType === 'pool') {
      const Model = bookingType === 'court' ? require('../models/Court') : require('../models/Pool'); 
      const facility = await Model.findById(roomId);
      if (!facility) {
        console.log('[404] Facility not found');
        return res.status(404).json({ message: `${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} not found` });
      }

      const guests = req.body.numberOfGuests || 1;
      let tempStart = new Date(start);
      while (tempStart < end) {
        const hour = tempStart.getHours();
        let dPrice = facility.dayPrice || (bookingType === 'pool' ? facility.pricePerSession : 0) || 0;
        let nPrice = facility.nightPrice || (bookingType === 'pool' ? facility.pricePerSession : 0) || 0;
        let hourPrice = (hour >= 9 && hour < 17) ? dPrice : nPrice;
        
        if (bookingType === 'pool') {
          calculatedAmount += (hourPrice * (numberOfGuests || 1));
        } else {
          calculatedAmount += hourPrice;
        }
        tempStart.setHours(tempStart.getHours() + 1);
      }
      console.log('Hourly Calc:', { calculatedAmount });
    }

    // 4. Overlap Check
    const idField = bookingType === 'room' ? 'roomId' : (bookingType === 'court' ? 'courtId' : 'poolId');
    const overlapQuery = {
      [idField]: roomId,
      status: { $ne: 'cancelled' },
      $or: [
        { startDate: { $lt: end }, endDate: { $gt: start } }
      ]
    };

    console.log('Overlap Check Query:', JSON.stringify(overlapQuery));
    const existingBooking = await Booking.findOne(overlapQuery);
    if (existingBooking) {
      console.log('[400] Overlap detected');
      return res.status(400).json({ 
        message: `${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} is already booked for this period.`,
        field: 'dateRange' 
      });
    }

    // 5. Create Booking
    const bookingData = {
      userId: req.user.id,
      bookingType,
      bookingDate: new Date(),
      startDate: start,
      endDate: end,
      totalAmount: calculatedAmount,
      numberOfGuests: req.body.numberOfGuests || 1,
      status: 'pending_payment'
    };
    bookingData[idField] = roomId;

    console.log('Final Booking Data:', bookingData);
    const booking = await Booking.create(bookingData);
    console.log('Booking Created Successfully');

    res.status(201).json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('CRITICAL ERROR IN CREATE_BOOKING:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all bookings for a specific facility
// @route   GET /api/bookings/facility/:facilityId
// @access  Public
exports.getFacilityBookings = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const bookings = await Booking.find({
      $or: [
        { roomId: facilityId },
        { courtId: facilityId },
        { poolId: facilityId }
      ],
      status: { $ne: 'cancelled' }
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user's bookings
// @route   GET /api/bookings/my
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('roomId')
      .populate('courtId')
      .populate('poolId')
      .sort({ createdAt: -1 });

    const results = await Promise.all(bookings.map(async (b) => {
      const payment = await Payment.findOne({ bookingId: b._id });
      
      // Check for related refund ticket (broad check across categories to ensure one-time limit)
      const hasRefundTicket = await SupportTicket.exists({
        relatedBookingId: b._id,
        category: { $in: ['Refund Request', 'Booking Refund', 'Payment Refund'] },
      });

      return {
        ...b.toObject(),
        paymentStatus: payment ? payment.paymentStatus : 'pending',
        verificationStatus: payment ? payment.verificationStatus : 'Pending',
        hasRefundTicket: !!hasRefundTicket
      };
    }));

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Cancel a pending booking
// @route   DELETE /api/bookings/cancel-pending/:id
// @access  Private
exports.cancelPendingBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    if (booking.status !== 'pending_payment') {
      return res.status(400).json({ message: 'Only bookings with pending payment can be cancelled.' });
    }

    // Update status to cancelled
    booking.status = 'cancelled';
    await booking.save();

    // Delete associated payment if it exists and is still pending
    await Payment.deleteMany({ 
      bookingId: booking._id, 
      paymentStatus: 'pending' 
    });

    res.json({
      success: true,
      message: 'Booking cancelled and pending payment records removed.'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createBooking: exports.createBooking,
  getMyBookings: exports.getMyBookings,
  getFacilityBookings: exports.getFacilityBookings,
  cancelPendingBooking: exports.cancelPendingBooking
};
