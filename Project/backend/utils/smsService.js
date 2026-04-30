const twilio = require('twilio');

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
let client;
if (accountSid && authToken && !accountSid.startsWith('ACxxx')) {
  client = twilio(accountSid, authToken);
}

/**
 * Send SMS using Twilio.
 * @param {string} to - Destination phone number in E.164 format.
 * @param {string} body - SMS message content.
 * @returns {Promise<object>} - Twilio message response or simulated response.
 */
const sendSMS = async (to, body) => {
  try {
    if (client) {
      console.log(`[SMS] Sending live SMS to ${to}...`);
      const message = await client.messages.create({
        body,
        from: twilioPhoneNumber,
        to,
      });
      console.log(`[SMS] Success! Message SID: ${message.sid}`);
      return { success: true, sid: message.sid };
    } else {
      // SMS service is not configured.
      return { success: true, disabled: true };
    }
  } catch (error) {
    console.error(`[SMS ERROR] Failed to send to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSMS };
