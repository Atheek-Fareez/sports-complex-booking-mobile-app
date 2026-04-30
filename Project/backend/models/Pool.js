const mongoose = require('mongoose');

const poolSchema = new mongoose.Schema(
  {
    poolName: {
      type: String,
      required: [true, 'Pool name is required'],
      trim: true,
    },
    pricePerSession: {
      type: Number,
      required: [true, 'Price per session is required'],
      min: 0,
    },
    dayPrice: {
      type: Number,
      default: 0,
    },
    nightPrice: {
      type: Number,
      default: 0,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: 1,
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

module.exports = mongoose.model('Pool', poolSchema);
