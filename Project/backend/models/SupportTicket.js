const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Refund Request',
        'Booking Issue',
        'Payment Issue',
        'Account Issue',
        'Technical Issue',
        'Complaint',
        'General',
        'Other',
      ],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      minlength: [5, 'Subject must be at least 5 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },
    relatedBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Replied', 'Resolved', 'Closed', 'Refund Processed'],
      default: 'Open',
    },
    adminReply: {
      type: String,
      trim: true,
      default: '',
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isDeletedByUser: {
      type: Boolean,
      default: false,
    },
    isDeletedByAdmin: {
      type: Boolean,
      default: false,
    },
    userHasReadUpdate: {
      type: Boolean,
      default: true,
    },
    refundDetails: {
      amount: { type: Number },
      refundStatus: {
        type: String,
        enum: ['Pending', 'Processed', 'Rejected'],
        default: 'Pending'
      },
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      processedAt: { type: Date },
      note: { type: String }
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
