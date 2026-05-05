const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema(
  {
    courtName: {
      type: String,
      required: [true, 'Court name is required'],
      trim: true,
    },
    dayPrice: {
      type: Number,
      required: [true, 'Day price is required'],
      min: 0,
    },
    nightPrice: {
      type: Number,
      required: [true, 'Night price is required'],
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    availabilityStatus: {
      type: String,
      enum: ['available', 'booked', 'maintenance'],
      default: 'available',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    guidelines: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Court', courtSchema);
