const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    bookingType: {
      type: String,
      enum: ['room', 'court', 'pool'],
      required: [true, 'Booking type is required'],
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    courtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Court',
      default: null,
    },
    poolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pool',
      default: null,
    },
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required'],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    timeSlot: {
      type: String,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    numberOfGuests: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: [
        'pending', 
        'pending_payment', 
        'pending_verification', // New: User submitted payment
        'confirmed',            // Admin approved
        'success',              // Admin approved (Part 5/8)
        'rejected',             // Admin rejected
        'cancelled'
      ],
      default: 'pending',
    },
    paymentMode: {
      type: String,
      enum: ['full', 'advance'],
      default: 'full',
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundStatus: {
      type: String,
      enum: ['Pending', 'Processed', 'Rejected', 'None'],
      default: 'None',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
