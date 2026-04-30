const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // Default: 5 minutes from now
      index: { expires: 0 }, // TTL index: documents will be automatically deleted when expiresAt is reached
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Otp', otpSchema);
