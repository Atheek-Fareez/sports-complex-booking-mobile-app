const express = require('express');
const router = express.Router();
const { getPendingVerificationCount } = require('../controllers/paymentController');
const { 
  adminGetAllTickets, 
  adminReplyToTicket, 
  adminUpdateStatus,
  adminDeleteTicket,
  getPendingTicketCountAdmin,
  getTicketById,
  processAdminRefund
} = require('../controllers/ticketController');
const { protect, admin } = require('../middleware/authMiddleware');
const { getDashboardStats } = require('../controllers/dashboardController');


/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin business dashboard stats
 * @access  Private/Admin
 */
router.get('/dashboard', protect, admin, getDashboardStats);

/**
 * @route   GET /api/admin/pending-verifications/count

 * @desc    Get count of pending payment verifications
 * @access  Private/Admin
 */
router.get('/pending-verifications/count', protect, admin, getPendingVerificationCount);

/**
 * Support Ticket Administration
 */
router.get('/tickets/pending-count', protect, admin, getPendingTicketCountAdmin);
router.get('/tickets', protect, admin, adminGetAllTickets);
router.get('/tickets/:id', protect, admin, getTicketById);
router.put('/tickets/:id/reply', protect, admin, adminReplyToTicket);
router.put('/tickets/:id/status', protect, admin, adminUpdateStatus);
router.delete('/tickets/:id', protect, admin, adminDeleteTicket);
router.post('/tickets/:id/process-refund', protect, admin, processAdminRefund);

module.exports = router;
