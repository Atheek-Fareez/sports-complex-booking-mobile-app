import api from './api';

class ChatService {
  /**
   * Send chat query to backend
   * @param {string} message - User's message
   * @param {array} conversationHistory - Previous messages
   * @returns {Promise<object>} - Response from AI
   */
  async sendMessage(message, conversationHistory = []) {
    try {
      console.log(`[CHAT SERVICE] Sending message to: ${api.defaults.baseURL}/api/chat`);
      const response = await api.post(
        'chat',
        {
          message,
          conversationHistory,
        },
        {
          timeout: 30000, // 30 second timeout
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('[CHAT SERVICE ERROR]', error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Authentication failed. Please log in again.',
          code: 'AUTH_ERROR',
        };
      }

      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'You do not have permission to access chat. Admin access required.',
          code: 'PERMISSION_ERROR',
        };
      }

      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Request timeout. Server may be slow or unreachable.',
          code: 'TIMEOUT',
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to send message',
        code: 'UNKNOWN_ERROR',
      };
    }
  }

  /**
   * Test chat connection
   * @returns {Promise<object>}
   */
  async testConnection() {
    try {
      const response = await api.get(
        'chat/test',
        {
          timeout: 5000,
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('[CHAT SERVICE TEST ERROR]', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get chat history (placeholder for future DB integration)
   * @returns {Promise<object>}
   */
  async getChatHistory() {
    try {
      const response = await api.get('chat/history');

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('[CHAT HISTORY ERROR]', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
export default new ChatService();
