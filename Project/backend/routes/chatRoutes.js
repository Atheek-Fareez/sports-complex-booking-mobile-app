const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const { handleChatQuery, getChatHistory, testChat } = require('../controllers/chatController');

const router = express.Router();

// All chat routes require authentication and admin role
router.use(protect);
router.use(admin);

/**
 * POST /api/chat
 * Handle admin chat query with multi-turn conversation
 * Body: { message: string, conversationHistory: array }
 */
router.post('/', handleChatQuery);

/**
 * GET /api/chat/history
 * Get chat history (client-side storage for now)
 */
router.get('/history', getChatHistory);

/**
 * GET /api/chat/test
 * Test chat endpoint
 */
router.get('/test', testChat);

module.exports = router;
