const express = require('express');
const router = express.Router();
const {
  createTicket,
  getMyTickets,
  getTicketById,
  updateMyTicket,
  deleteMyTicket,
  getUnreadTicketCountUser,
} = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/tickets
 * @desc    Create a new support ticket
 * @access  Private
 */
router.post('/', protect, createTicket);

/**
 * @route   GET /api/tickets/my
 * @desc    Get user's own tickets
 * @access  Private
 */
router.get('/my', protect, getMyTickets);

/**
 * @route   GET /api/tickets/notifications-count
 * @desc    Get unread ticket count for user
 * @access  Private
 */
router.get('/notifications-count', protect, getUnreadTicketCountUser);

/**
 * @route   GET /api/tickets/:id
 * @desc    Get single ticket details
 * @access  Private
 */
router.get('/:id', protect, getTicketById);

/**
 * @route   PUT /api/tickets/:id
 * @desc    Update user's own ticket
 * @access  Private
 */
router.put('/:id', protect, updateMyTicket);

/**
 * @route   DELETE /api/tickets/:id
 * @desc    Delete user's own ticket
 * @access  Private
 */
router.delete('/:id', protect, deleteMyTicket);

module.exports = router;
