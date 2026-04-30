const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online', 'mock'],
      default: 'mock',
    },
    paymentMode: {
      type: String,
      enum: ['full', 'advance'],
      default: 'full',
    },
    transactionId: {
      type: String,
      trim: true,
      default: '',
    },
    maskedCardNumber: {
      type: String,
      default: '',   // e.g. "**** **** **** 1234"
      trim: true,
    },
    cardholderName: {
      type: String,
      default: '',
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: [
        'pending', 
        'pending_verification', // New: User submitted
        'success',              // Admin approved
        'failed', 
        'refunded', 
        'rejected'
      ],
      default: 'pending',
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    receiptUrl: {
      type: String,
      default: '',
    },
    termsAccepted: {
      type: Boolean,
      required: [true, 'Terms and conditions must be accepted'],
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
