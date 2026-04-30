const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
    },
    roomType: {
      type: String,
      enum: ['single', 'double', 'suite', 'deluxe', 'other'],
      default: 'single',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
