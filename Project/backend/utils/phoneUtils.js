/**
 * Normalize phone numbers to E.164 format.
 * Currently uses +94 (Sri Lanka) as the default prefix if not provided.
 */
const normalizePhone = (phone) => {
  if (!phone) return null;

  // Remove any non-digit characters except the "+" sign
  let cleaned = phone.replace(/[^\d+]/g, '');

  const defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE || '+94';

  // If the number starts with "0", replace it with the default country code
  if (cleaned.startsWith('0')) {
    cleaned = defaultCountryCode + cleaned.substring(1);
  }

  // If the number doesn't start with "+", add the default country code
  if (!cleaned.startsWith('+')) {
    cleaned = defaultCountryCode + cleaned;
  }

  return cleaned;
};

module.exports = { normalizePhone };
