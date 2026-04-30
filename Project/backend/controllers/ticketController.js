const SupportTicket = require('../models/SupportTicket');
const Booking = require('../models/Booking');

// @desc    Create a new support ticket
// @route   POST /api/tickets
// @access  Private
exports.createTicket = async (req, res) => {
  try {
    console.log('[DEBUG-TICKET] Body:', req.body);
    console.log('[DEBUG-TICKET] User:', req.user?._id || req.user?.id);

    const { category, subject, description, relatedBookingId, priority } = req.body;
    console.log('[BACKEND-VAL] Checking fields:', { category, subject, description });

    // Detailed Validation
    if (!category || category.trim() === '') {
      console.log('[BACKEND-VAL] Category check failed');
      return res.status(400).json({ success: false, message: 'Please select a category' });
    }
    if (!subject || subject.trim() === '') {
      console.log('[BACKEND-VAL] Subject check failed');
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }
    if (subject.trim().length < 5) {
      console.log('[BACKEND-VAL] Subject length failed:', subject.trim().length);
      return res.status(400).json({ success: false, message: 'Subject must be at least 5 characters' });
    }
    if (!description || description.trim() === '') {
      console.log('[BACKEND-VAL] Description check failed');
      return res.status(400).json({ success: false, message: 'Description is required' });
    }
    if (description.trim().length < 10) {
      console.log('[BACKEND-VAL] Description length failed:', description.trim().length);
      return res.status(400).json({ success: false, message: 'Description must be at least 10 characters' });
    }

    // Strict check for duplicate refund requests
    if (category === 'Refund Request' && relatedBookingId) {
      const userId = req.user.id || req.user._id;

      // 1. Check the booking itself for existing refund status
      const booking = await Booking.findById(relatedBookingId);
      if (booking && (booking.refundStatus === 'Processed' || booking.refundStatus === 'Pending')) {
        return res.status(400).json({
          success: false,
          message: `The refund for this booking is already ${booking.refundStatus.toLowerCase()}. You cannot raise another ticket for this booking.`,
        });
      }

      // 2. Check for ANY existing refund ticket for this booking (strict one-time limit)
      const existingTicket = await SupportTicket.findOne({
        userId,
        relatedBookingId,
        category: { $in: ['Refund Request', 'Booking Refund', 'Payment Refund'] },
      });

      if (existingTicket) {
        return res.status(400).json({
          success: false,
          message: 'Only one refund-related ticket is allowed per booking. You have already raised a request for this booking.',
        });
      }
    }

    console.log('[BACKEND-VAL] Validation Passed.');

    const ticketData = {
      userId: req.user.id || req.user._id,
      category,
      subject,
      description,
      relatedBookingId: relatedBookingId || null,
      priority: priority || 'Medium',
    };

    console.log('[DEBUG-TICKET] Final Data:', ticketData);

    const ticket = await SupportTicket.create(ticketData);

    res.status(201).json({
      success: true,
      message: 'Your ticket has been submitted successfully.',
      data: ticket,
    });
  } catch (error) {
    console.error('[TICKET] Create ERROR:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error during ticket creation', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get all tickets for logged-in user
// @route   GET /api/tickets/my
// @access  Private
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user._id, isDeletedByUser: false })
      .populate('relatedBookingId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    console.error('[TICKET] Fetch My Tickets Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single ticket details
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId', 'fullName email phone')
      .populate('relatedBookingId');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user is owner or admin
    if (ticket.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }

    // Clear the unread badge flag if the ticket owner is viewing it
    if (ticket.userId._id.toString() === req.user._id.toString() && !ticket.userHasReadUpdate) {
      ticket.userHasReadUpdate = true;
      await ticket.save();
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('[TICKET] Fetch Single Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update user's own ticket
// @route   PUT /api/tickets/:id
// @access  Private
exports.updateMyTicket = async (req, res) => {
  try {
    const { category, subject, description, relatedBookingId } = req.body;

    let ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check ownership
    if (ticket.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this ticket' });
    }

    // Check status - only allow update if Open
    if (ticket.status !== 'Open') {
      return res.status(400).json({ message: 'Cannot update ticket once it is processed or replied to' });
    }

    // Reinforce strict refund limits on updates
    const newCategory = category || ticket.category;
    const newBookingId = relatedBookingId || ticket.relatedBookingId;

    if (newCategory === 'Refund Request' && newBookingId) {
      const userId = req.user.id || req.user._id;

      // 1. Check booking's current refund status
      const booking = await Booking.findById(newBookingId);
      if (booking && (booking.refundStatus === 'Processed' || booking.refundStatus === 'Pending')) {
        return res.status(400).json({
          success: false,
          message: `The refund for this booking is already ${booking.refundStatus.toLowerCase()}. You cannot update this ticket to a refund request for this booking.`,
        });
      }

      // 2. Check for other existing refund tickets for this booking (excluding this ticket)
      const otherExistingTicket = await SupportTicket.findOne({
        userId,
        relatedBookingId: newBookingId,
        category: 'Refund Request',
        _id: { $ne: req.params.id }
      });

      if (otherExistingTicket) {
        return res.status(400).json({
          success: false,
          message: 'Only one refund-related ticket is allowed per booking. You have already raised another request for this booking.',
        });
      }
    }

    ticket.category = category || ticket.category;
    ticket.subject = subject || ticket.subject;
    ticket.description = description || ticket.description;
    ticket.relatedBookingId = relatedBookingId || ticket.relatedBookingId;

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('[TICKET] Update Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete user's own ticket
// @route   DELETE /api/tickets/:id
// @access  Private
exports.deleteMyTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check ownership
    if (ticket.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this ticket' });
    }

    // Check status - only allow delete if Closed
    if (ticket.status !== 'Closed') {
      return res.status(400).json({ 
        success: false, 
        message: `Currently status is '${ticket.status}'. You can only delete tickets that are 'Closed'.` 
      });
    }

    ticket.isDeletedByUser = true;
    
    // If Admin has also deleted it, physically remove it to save space
    if (ticket.isDeletedByAdmin) {
      await SupportTicket.findByIdAndDelete(req.params.id);
    } else {
      await ticket.save();
    }

    res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully',
    });
  } catch (error) {
    console.error('[TICKET] Delete Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Admin: Get all support tickets
// @route   GET /api/admin/tickets
// @access  Private/Admin
exports.adminGetAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ isDeletedByAdmin: false })
      .populate('userId', 'fullName email role')
      .populate('relatedBookingId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    console.error('[ADMIN-TICKET] Fetch All Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Admin: Reply to ticket
// @route   PUT /api/admin/tickets/:id/reply
// @access  Private/Admin
exports.adminReplyToTicket = async (req, res) => {
  try {
    const { adminReply, status } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.adminReply = adminReply || ticket.adminReply;
    ticket.status = status || 'Replied';
    ticket.adminId = req.user._id;
    ticket.userHasReadUpdate = false; // Flag for user notification badge

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Reply submitted successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('[ADMIN-TICKET] Reply Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Admin: Update ticket status
// @route   PUT /api/admin/tickets/:id/status
// @access  Private/Admin
exports.adminUpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status;
    await ticket.save();

    res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: ticket,
    });
  } catch (error) {
    console.error('[ADMIN-TICKET] Status error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Admin: Delete ticket
// @route   DELETE /api/admin/tickets/:id
// @access  Private/Admin
exports.adminDeleteTicket = async (req, res) => {
  try {
    console.log('[ADMIN-TICKET] Delete request received for ID:', req.params.id);
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      console.log('[ADMIN-TICKET] Delete failed: Ticket not found');
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check status - only allow delete if Closed
    console.log('[ADMIN-TICKET] Current Status:', ticket.status);
    if (ticket.status !== 'Closed') {
      console.log('[ADMIN-TICKET] Delete rejected: Status not Closed');
      return res.status(400).json({ message: 'Tickets can only be deleted when the status is Closed' });
    }

    ticket.isDeletedByAdmin = true;
    
    // If User has also deleted it, physically remove it
    if (ticket.isDeletedByUser) {
      await SupportTicket.findByIdAndDelete(req.params.id);
      console.log('[ADMIN-TICKET] Ticket physically permanently deleted from DB (ID: ' + req.params.id + ')');
    } else {
      await ticket.save();
      console.log('[ADMIN-TICKET] Ticket softly deleted by admin (ID: ' + req.params.id + ')');
    }

    res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully by admin',
    });
  } catch (error) {
    console.error('[ADMIN-TICKET] Delete error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
// @desc    Get count of unread ticket updates for user
// @route   GET /api/tickets/notifications-count
// @access  Private
exports.getUnreadTicketCountUser = async (req, res) => {
  try {
    const count = await SupportTicket.countDocuments({
      userId: req.user._id,
      isDeletedByUser: false,
      userHasReadUpdate: false,
      status: { $in: ['Replied', 'Closed', 'Resolved'] }
    });

    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('[TICKET] Count Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get count of pending (Open) tickets for Admin
// @route   GET /api/admin/tickets/pending-count
// @access  Private/Admin
exports.getPendingTicketCountAdmin = async (req, res) => {
  try {
    const count = await SupportTicket.countDocuments({
      isDeletedByAdmin: false,
      status: 'Open'
    });

    res.status(200).json({ success: true, count });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('[ADMIN-TICKET] Count Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Admin: Process refund strictly linked to a ticket
// @route   POST /api/admin/tickets/:id/process-refund
// @access  Private/Admin
exports.processAdminRefund = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { note } = req.body;
    const Payment = require('../models/Payment');
    
    // 1. Fetch & Verify Ticket
    const ticket = await SupportTicket.findById(ticketId).populate('relatedBookingId');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    
    if (!['Refund Request', 'Booking Refund', 'Payment Refund'].includes(ticket.category)) {
      return res.status(400).json({ success: false, message: 'Not a valid refund ticket category.' });
    }
    
    if (!ticket.relatedBookingId) {
      return res.status(400).json({ success: false, message: 'No booking associated with this ticket.' });
    }
    
    if (ticket.refundDetails?.refundStatus === 'Processed') {
      return res.status(400).json({ success: false, message: 'Refund already processed for this ticket.' });
    }

    // 2. Fetch Booking & Payment
    const booking = ticket.relatedBookingId;
    if (booking.refundStatus === 'Processed' || booking.status === 'cancelled') {
        return res.status(400).json({ success: false, message: 'Booking already cancelled or refunded.' });
    }

    const payment = await Payment.findOne({ bookingId: booking._id });
    if (!payment) {
        return res.status(400).json({ success: false, message: 'No payment record found corresponding to this booking.' });
    }

    // 4. Time Rules
    const now = new Date();
    const bookingDate = new Date(booking.startDate);
    const diffHours = (bookingDate - now) / (1000 * 60 * 60);

    if (booking.bookingType === 'room') {
       if (diffHours < 48) {
           return res.status(400).json({ success: false, message: 'Refund not allowed based on cancellation policy. Room cancellations require 48 hours notice.' });
       }
    } else {
       if (diffHours < 12) {
           return res.status(400).json({ success: false, message: 'Refund not allowed based on cancellation policy. Cancellations require 12 hours notice.' });
       }
    }

    // 5. Refund Amount Calculation
    const refundAmount = booking.paidAmount || (booking.paymentMode === 'advance' ? booking.totalAmount / 2 : booking.totalAmount);
    
    if (!refundAmount || refundAmount <= 0) {
        return res.status(400).json({ success: false, message: 'No paid amount exists to refund on this booking.' });
    }

    // 6. State Updates
    booking.status = 'cancelled';
    booking.refundStatus = 'Processed';
    await booking.save();

    payment.paymentStatus = 'refunded';
    await payment.save();

    ticket.status = 'Refund Processed';
    ticket.refundDetails = {
      amount: refundAmount,
      refundStatus: 'Processed',
      processedBy: req.user._id,
      processedAt: new Date(),
      note: note || ''
    };
    await ticket.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Refund successfully processed and booking cancelled.',
      data: {
        refundedAmount: refundAmount,
        bookingStatus: booking.status,
        ticketStatus: ticket.status
      }
    });

  } catch (error) {
    console.error('[ADMIN-REFUND] Execution Error:', error);
    return res.status(500).json({ success: false, message: 'Server Error during refund execution.' });
  }
};
