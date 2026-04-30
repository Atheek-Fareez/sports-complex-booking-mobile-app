const groqService = require('../services/groqService');
const chatQueryParser = require('../utils/chatQueryParser');

/**
 * @desc    Handle chat query from admin
 * @route   POST /api/chat
 * @access  Private/Admin
 */
exports.handleChatQuery = async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    // Validate conversation history is array
    let history = [];
    if (conversationHistory && Array.isArray(conversationHistory)) {
      // Keep only last 10 messages to prevent token overflow
      history = conversationHistory.slice(-10);
    }

    // Parse query to determine intent and time range
    const parsed = chatQueryParser.parseQuery(message);
    
    console.log(`[CHAT] Intent: ${parsed.intent}, TimeRange: ${parsed.timeRange}`);

    // Fetch relevant data from database
    const dataContext = await chatQueryParser.fetchRelevantData(parsed);

    // Send to Groq for AI processing
    const groqResponse = await groqService.generateResponse(
      message,
      dataContext,
      history
    );

    if (!groqResponse.success) {
      // Return fallback data if Groq fails
      return res.status(200).json({
        success: false,
        response: groqResponse.response || groqResponse.fallback || 'Unable to process query. Please try again.',
        error: groqResponse.error,
        data: dataContext,
        timestamp: new Date().toISOString()
      });
    }

    // Success response
    res.status(200).json({
      success: true,
      response: groqResponse.response,
      data: dataContext,
      timestamp: groqResponse.timestamp,
      intent: parsed.intent,
      timeRange: parsed.timeRange
    });
  } catch (error) {
    console.error('[CHAT CONTROLLER ERROR]', error);
    res.status(500).json({
      message: 'Error processing chat query',
      error: error.message
    });
  }
};

/**
 * @desc    Get chat history (optional - can be extended for DB storage)
 * @route   GET /api/chat/history
 * @access  Private/Admin
 */
exports.getChatHistory = async (req, res) => {
  try {
    // For now, history is stored on frontend state
    // In future, can store in DB with userId + timestamp
    res.status(200).json({
      message: 'Chat history is stored client-side. Implement DB storage as needed.',
      note: 'To add persistent storage, create a ChatHistory model and save messages after each query'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving chat history', error: error.message });
  }
};

/**
 * @desc    Test endpoint to verify chat setup
 * @route   GET /api/chat/test
 * @access  Private/Admin
 */
exports.testChat = async (req, res) => {
  try {
    const testData = {
      message: 'Chat endpoint is working!',
      groqConfigured: !!process.env.GROQ_API_KEY,
      adminUser: req.user?.role === 'admin',
      userId: req.user?._id
    };
    res.status(200).json(testData);
  } catch (error) {
    res.status(500).json({ message: 'Error in test endpoint', error: error.message });
  }
};
