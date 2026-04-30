const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
  }

  /**
   * Send query and context data to Groq for AI processing
   * @param {string} userQuery - Admin's question
   * @param {object} dataContext - Raw data from database
   * @param {array} conversationHistory - Previous messages for multi-turn context
   * @returns {Promise<string>} - AI response
   */
  async generateResponse(userQuery, dataContext, conversationHistory = []) {
    try {
      // Format data context as readable string
      const formattedData = this.formatDataContext(dataContext);

      // Build system prompt
      const systemPrompt = `You are "AAS", a friendly and professional AI assistant for the White House Sports Complex Management System.

CORE MISSION:
Your goal is to have a REAL-TIME CONVERSATION. Do NOT just dump data or use a robotic reporting style. Speak like a helpful human assistant sitting next to the administrator.

BEHAVIOR RULES:
1. CONVERSATIONAL STYLE: When asked a question, answer like a person. (e.g., instead of "Total Bookings: 5", say "We've had 5 bookings so far today, which is looking good!")
2. GREETINGS & SMALL TALK: Respond naturally and warmly. (e.g., "Hello! I'm AAS, your assistant for the sports complex 😊 How can I help you today?").
3. DATA USAGE: Use the DATA SNAPSHOT below to answer questions. If the user asks something specific (e.g., "how much did we make today?"), answer that specifically and then maybe add one related helpful insight.
4. SYSTEM HELP: Explain features simply and conversationally.
5. NO HALLUCINATIONS: Only use the data provided. If you don't know, say so naturally.

TONE RULES:
- Short, friendly, and HUMAN-LIKE (2–4 sentences).
- No robotic bullet points unless explicitly asked for a list.
- Act as a smart assistant, not a data-dumping script.

DATA SNAPSHOT (FOR YOUR REFERENCE ONLY - DO NOT REPEAT THIS FORMAT):
${formattedData}`;

      // Build conversation messages for multi-turn context
      const messages = [
        ...conversationHistory,
        { role: 'user', content: userQuery }
      ];

      // Call Groq API
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 1,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.choices[0].message.content;

      return {
        success: true,
        response: aiResponse,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error.response) {
        console.error('[GROQ API ERROR DATA]', JSON.stringify(error.response.data, null, 2));
      }
      console.error('[GROQ ERROR]', error.message);
      
      // Fallback: Return conversational message if Groq fails
      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit',
          response: "I'm a bit busy with requests right now, but I can see your dashboard data. What specifically can I help you find?",
          fallback: this.formatDataContext(dataContext)
        };
      }

      return {
        success: false,
        error: 'AI Connection Failure',
        response: "I'm having a little trouble connecting to my AI brain, but I still have access to your facility data. How can I help?",
        fallback: this.formatDataContext(dataContext)
      };
    }
  }

  /**
   * Format raw database data into readable text for Groq
   * @param {object} data - Data from chatQueryParser
   * @returns {string} - Formatted text
   */
  formatDataContext(data) {
    let formatted = '';

    if (data.dashboardStats || data.quickStats) {
      const d = data.dashboardStats || data.quickStats;
      formatted += `📊 CURRENT COMPLEX METRICS:\n`;
      formatted += `- Total Bookings: ${d.totalBookings}\n`;
      formatted += `- Confirmed: ${d.confirmedBookings} | Pending: ${d.pendingBookings} | Cancelled: ${d.cancelledBookings}\n`;
      formatted += `- This Month Bookings: ${d.thisMonthBookings}\n`;
      formatted += `- Total Revenue: $${d.totalRevenue || 0}\n`;
      formatted += `- This Month Revenue: $${d.thisMonthRevenue || 0}\n`;
      formatted += `- Facility Breakdown: Rooms(${d.roomBookings}), Courts(${d.courtBookings}), Pools(${d.poolBookings})\n`;
      formatted += `- Total Users: ${d.totalUsers}\n`;
      formatted += `- Support Tickets: ${d.totalTickets} (Open: ${d.openTickets}, Refunds: ${d.refundTickets})\n\n`;
    }

    if (data.pendingPayments) {
      formatted += `💳 PENDING PAYMENTS:\n`;
      formatted += `- Count: ${data.pendingPayments.length}\n`;
      if (data.pendingPayments.length > 0) {
        formatted += `- Total Pending Amount: $${data.pendingPayments.reduce((sum, p) => sum + (p.bookingId?.totalAmount || 0), 0)}\n`;
        formatted += `- Details: ${data.pendingPayments.map(p => `${p.bookingId?.bookingType || 'N/A'} ($${p.bookingId?.totalAmount || 0})`).join(', ')}\n\n`;
      }
    }

    if (data.supportTickets) {
      formatted += `🎫 SUPPORT TICKETS:\n`;
      const tickets = data.supportTickets;
      formatted += `- Total: ${tickets.length}\n`;
      if (tickets.length > 0) {
        const statuses = tickets.reduce((acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1;
          return acc;
        }, {});
        formatted += `- Status Breakdown: ${Object.entries(statuses).map(([k, v]) => `${k}(${v})`).join(', ')}\n`;
        const refunds = tickets.filter(t => t.category === 'Refund Request').length;
        formatted += `- Refund Requests: ${refunds}\n\n`;
      }
    }

    if (data.monthlyTrends) {
      formatted += `📈 MONTHLY TRENDS (Last 6 Months):\n`;
      data.monthlyTrends.forEach(month => {
        formatted += `- ${month.month} ${month.year}: ${month.bookings} bookings, $${month.revenue} revenue\n`;
      });
      formatted += `\n`;
    }

    if (data.facilityStatus) {
      formatted += `🏢 FACILITY STATUS:\n`;
      data.facilityStatus.forEach(f => {
        formatted += `- ${f.type}: Total ${f.total}, Available ${f.available}\n`;
      });
    }

    return formatted || 'No data available';
  }
}

module.exports = new GroqService();
