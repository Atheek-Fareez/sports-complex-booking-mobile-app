import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, ActivityIndicator, TextInput
} from 'react-native';
import api from '../services/api';

// ─── PART 2: Card Validation Helpers ────────────────────────────────────────

/** Luhn algorithm */
const luhnCheck = (num) => {
  let sum = 0;
  let isEven = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

/** Mask card number: **** **** **** 1234 */
const maskCard = (num) => {
  const clean = num.replace(/\s/g, '');
  const last4 = clean.slice(-4);
  return `**** **** **** ${last4}`;
};

/** Validate all card fields. Returns an error object (empty = valid). */
const validateCardFields = (cardName, cardNumber, expiry, cvv) => {
  const errors = {};
  const cleanCard = cardNumber.replace(/\s/g, '');

  // A. Cardholder Name
  if (!cardName.trim()) {
    errors.cardName = 'Cardholder Name is required';
  } else if (cardName.trim().length < 3) {
    errors.cardName = 'Cardholder Name is too short';
  }

  // B. Card Number
  if (!cleanCard) {
    errors.cardNumber = 'Card Number is required';
  } else if (!/^\d{16}$/.test(cleanCard)) {
    errors.cardNumber = 'Card Number must be 16 digits';
  }

  // C. Expiry Date
  if (!expiry) {
    errors.expiry = 'Expiry Date is required';
  } else if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    errors.expiry = 'Expiry Date format must be MM/YY';
  } else {
    const [mm, yy] = expiry.split('/').map(Number);
    if (mm < 1 || mm > 12) {
      errors.expiry = 'Expiry Date format must be MM/YY';
    } else {
      const now = new Date();
      const expDate = new Date(2000 + yy, mm - 1, 1);
      if (expDate < new Date(now.getFullYear(), now.getMonth(), 1)) {
        errors.expiry = 'Card has expired';
      }
    }
  }

  // D. CVV
  if (!cvv) {
    errors.cvv = 'CVV is required';
  } else if (!/^\d{3,4}$/.test(cvv)) {
    errors.cvv = 'CVV is invalid';
  }

  return errors;
};

// ─── Component ───────────────────────────────────────────────────────────────

const PaymentScreen = ({ route, navigation }) => {
  const {
    bookingId, totalAmount, facilityType, facilityName,
    startDate, endDate, startTime, endTime
  } = route.params;

  const isHourly = facilityType === 'court' || facilityType === 'pool';

  // Card states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Room specific
  const isRoom = facilityType === 'room';
  const [paymentMode, setPaymentMode] = useState('full'); // 'full' or 'advance'

  // UI states
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // ─── Format Helpers ──────────────────────────────────────────────────────

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  // ─── PART 1: Submit Handler ───────────────────────────────────────────────

  const handlePayment = async () => {
    // STEP 1: Validate card format
    const cardErrors = validateCardFields(cardName, cardNumber, expiry, cvv);

    if (!termsAccepted) cardErrors.terms = 'Please accept the Terms & Conditions';

    if (Object.keys(cardErrors).length > 0) {
      // STEP 2: Show field-level errors, do NOT submit
      setErrors(cardErrors);
      setStatusMessage('');
      return;
    }

    setErrors({});

    if (!bookingId) {
      Alert.alert('Error', 'Missing Booking ID. Please restart from the booking screen.');
      return;
    }

    if (!totalAmount || isNaN(Number(totalAmount))) {
      Alert.alert('Error', 'Invalid payment amount. Please restart the booking process.');
      return;
    }

    // STEP 3: Valid — submit to backend
    setLoading(true);
    setStatusMessage('Submitting booking & payment for verification...');

    // Determine the calculated final amount based on payment mode (for rooms)
    const baseTotal = Number(totalAmount);
    const finalAmount = (isRoom && paymentMode === 'advance') ? (baseTotal / 2) : baseTotal;

    const maskedCardNumber = maskCard(cardNumber);

    try {
      // 3a. Initiate payment record (creates payment in DB with pending status)
      const initRes = await api.post('/payments', {
        bookingId,
        amount: finalAmount,
        paymentMode: isRoom ? paymentMode : 'full',
        termsAccepted,
        maskedCardNumber,
        cardholderName: cardName.trim(),
        // CVV is validated above and NOT sent to backend
      });

      if (!initRes.data.success) {
        throw new Error(initRes.data.message || 'Failed to initiate payment');
      }

      const paymentId = initRes.data.data._id;

      // 3b. Confirm payment — moves booking to paid_pending_approval (admin queue)
      const confRes = await api.post('/payments/confirm', {
        paymentId,
        transactionId: `MOCK-TXN-${Date.now()}`,
      });

      if (!confRes.data.success) {
        throw new Error(confRes.data.message || 'Failed to confirm payment');
      }

      // SUCCESS — booking is now in admin queue
      setStatusMessage('');
      setLoading(false);

      // Navigate to Pending Confirmation screen
      navigation.replace('BookingPending', {
        facilityName,
        facilityType,
        startDate,
        endDate,
        startTime,
        endTime,
        totalAmount,
        amountPaid: finalAmount, // track this to show what they paid
        paymentMode: isRoom ? paymentMode : 'full',
        maskedCardNumber,
        bookingRef: confRes.data.data?.bookingId?.toString().slice(-6).toUpperCase() ||
                    bookingId.slice(-6).toUpperCase(),
      });

    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || error.message || 'Submission failed. Please try again.';
      setStatusMessage(`Error: ${msg}`);
      Alert.alert('Submission Failed', msg);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

      {/* Trust Banner */}
      <View style={styles.topBadge}>
        <Text style={styles.topBadgeText}>🔒 Secure Payment — Admin Verified</Text>
      </View>

      {/* 1. Stay Details */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Your stay details</Text>
        <Text style={styles.facilityName}>{facilityName}</Text>
        <Text style={styles.facilityType}>{facilityType?.charAt(0).toUpperCase() + facilityType?.slice(1)}</Text>
        <View style={styles.dateGrid}>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Check-in</Text>
            <Text style={styles.dateValue}>{startDate ? new Date(startDate).toLocaleDateString() : '—'}</Text>
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Check-out</Text>
            <Text style={styles.dateValue}>{endDate ? new Date(endDate).toLocaleDateString() : '—'}</Text>
          </View>
        </View>
        {isHourly && (
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Time:</Text>
            <Text style={styles.timeValue}>{startTime}:00 – {endTime}:00</Text>
          </View>
        )}
      </View>

      {/* 2. Price Summary */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Price summary</Text>
        
        {isRoom ? (
          <>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total Room Cost</Text>
              <Text style={styles.priceValue}>LKR {totalAmount}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Taxes & charges</Text>
              <Text style={styles.priceValue}>Included</Text>
            </View>

            <View style={styles.paymentSelector}>
              <Text style={styles.selectorLabel}>Select Payment Type *</Text>
              
              <TouchableOpacity 
                style={[styles.radioItem, paymentMode === 'full' && styles.radioSelected]}
                onPress={() => setPaymentMode('full')}
              >
                <View style={[styles.radioDot, paymentMode === 'full' && styles.radioDotActive]} />
                <View>
                  <Text style={styles.radioTitle}>Full Payment</Text>
                  <Text style={styles.radioDesc}>Pay the entire amount now.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.radioItem, paymentMode === 'advance' && styles.radioSelected]}
                onPress={() => setPaymentMode('advance')}
              >
                <View style={[styles.radioDot, paymentMode === 'advance' && styles.radioDotActive]} />
                <View>
                  <Text style={styles.radioTitle}>Advance Payment (50%)</Text>
                  <Text style={styles.radioDesc}>Pay half now, pay the remaining LKR {Number(totalAmount) / 2} at check-in.</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Payment Method</Text>
              <Text style={styles.priceValue}>{paymentMode === 'advance' ? 'Advance Payment' : 'Full Payment'}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total Amount</Text>
              <Text style={styles.priceValue}>Rs. {totalAmount}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Pay Now</Text>
              <Text style={styles.totalValue}>Rs. {paymentMode === 'advance' ? (Number(totalAmount) / 2) : totalAmount}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Remaining Balance</Text>
              <Text style={[styles.priceValue, { color: '#dc3545' }]}>Rs. {paymentMode === 'advance' ? (Number(totalAmount) / 2) : 0}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.priceRow}><Text style={styles.priceLabel}>Base price</Text><Text style={styles.priceValue}>LKR {totalAmount}</Text></View>
            <View style={styles.priceRow}><Text style={styles.priceLabel}>Taxes & charges</Text><Text style={styles.priceValue}>Included</Text></View>
            <View style={styles.priceDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total to Pay</Text>
              <Text style={styles.totalValue}>LKR {totalAmount}</Text>
            </View>
          </>
        )}
      </View>

      {/* 3. Card Information */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Payment details</Text>

        {/* Cardholder Name */}
        <View style={[styles.inputGroup, errors.cardName && styles.errorBorder]}>
          <Text style={styles.inputLabel}>Name on card *</Text>
          <TextInput
            style={styles.textInput}
            value={cardName}
            onChangeText={(v) => { setCardName(v); setErrors(e => ({ ...e, cardName: null })); }}
            placeholder="John Doe"
            autoCapitalize="words"
          />
        </View>
        {errors.cardName ? <Text style={styles.fieldError}>{errors.cardName}</Text> : null}

        {/* Card Number */}
        <View style={[styles.inputGroup, errors.cardNumber && styles.errorBorder]}>
          <Text style={styles.inputLabel}>Card number *</Text>
          <TextInput
            style={styles.textInput}
            value={cardNumber}
            onChangeText={(v) => { setCardNumber(formatCardNumber(v)); setErrors(e => ({ ...e, cardNumber: null })); }}
            placeholder="0000 0000 0000 0000"
            keyboardType="numeric"
            maxLength={19}
          />
        </View>
        {errors.cardNumber ? <Text style={styles.fieldError}>{errors.cardNumber}</Text> : null}

        {/* Expiry + CVV */}
        <View style={styles.inputRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={[styles.inputGroup, errors.expiry && styles.errorBorder]}>
              <Text style={styles.inputLabel}>Expiry date *</Text>
              <TextInput
                style={styles.textInput}
                value={expiry}
                onChangeText={(v) => { setExpiry(formatExpiry(v)); setErrors(e => ({ ...e, expiry: null })); }}
                placeholder="MM/YY"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            {errors.expiry ? <Text style={styles.fieldError}>{errors.expiry}</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <View style={[styles.inputGroup, errors.cvv && styles.errorBorder]}>
              <Text style={styles.inputLabel}>CVV *</Text>
              <TextInput
                style={styles.textInput}
                value={cvv}
                onChangeText={(v) => { setCvv(v.replace(/\D/g, '').slice(0, 4)); setErrors(e => ({ ...e, cvv: null })); }}
                placeholder="123"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
            {errors.cvv ? <Text style={styles.fieldError}>{errors.cvv}</Text> : null}
          </View>
        </View>
      </View>

      {/* 4. Terms */}
      <View style={[styles.sectionCard, errors.terms && styles.errorCard]}>
        <Text style={styles.sectionTitle}>Refund Policy & Terms</Text>
        <Text style={styles.policyBullet}>• To request a refund or reschedule for swimming pool or futsal bookings, the user must submit a refund/support ticket at least 12 hours before the booking time.</Text>
        <Text style={styles.policyBullet}>• If the ticket is submitted before 12 hours, the user is eligible to rebook the same booking within the next 2 weeks, based on available time slots in the calendar.</Text>
        <Text style={styles.policyBullet}>• If the request is made within 12 hours of the booking time, no refund or rescheduling will be allowed.</Text>
        <Text style={styles.policyBullet}>• After 2 weeks from the original booking date, the booking is no longer eligible for refund or rescheduling.</Text>
        <View style={{ marginVertical: 4 }} />
        <Text style={[styles.policyBullet, { fontWeight: 'bold' }]}>• For ROOM BOOKINGS: cancellation must be made at least 48 hours before the booking date to be eligible for a refund.</Text>
        <Text style={styles.policyBullet}>• To request a refund for room bookings, the user must raise a support ticket related to that booking.</Text>

        <TouchableOpacity
          style={styles.termsOption}
          onPress={() => { setTermsAccepted(t => !t); setErrors(e => ({ ...e, terms: null })); }}
        >
          <View style={[styles.customCheckbox, termsAccepted && styles.customChecked]} />
          <Text style={styles.termsText}>By proceeding, I acknowledge and accept the Refund Policy and Terms & Conditions.</Text>
        </TouchableOpacity>
        {errors.terms ? <Text style={styles.fieldError}>{errors.terms}</Text> : null}
      </View>

      {/* Status message */}
      {statusMessage !== '' && (
        <View style={[styles.statusBox, statusMessage.startsWith('Error') && styles.statusBoxError]}>
          <Text style={styles.statusBoxText}>{statusMessage}</Text>
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.disabledBtn]}
        onPress={handlePayment}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitBtnText}>Confirm Payment & Submit for Verification</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => navigation.navigate('Profile')}
        disabled={loading}
      >
        <Text style={styles.cancelBtnText}>Cancel & return to profile</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },

  topBadge: { backgroundColor: '#003580', padding: 12, alignItems: 'center' },
  topBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  sectionCard: { backgroundColor: '#fff', margin: 12, marginBottom: 4, padding: 16, borderRadius: 2, borderWidth: 1, borderColor: '#e7e7e7' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 14 },

  facilityName: { fontSize: 17, fontWeight: 'bold', color: '#003580' },
  facilityType: { fontSize: 13, color: '#666', marginBottom: 12 },

  dateGrid: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f2f2f2', paddingTop: 12 },
  dateCol: { flex: 1 },
  dateLabel: { fontSize: 11, fontWeight: 'bold', color: '#333', textTransform: 'uppercase' },
  dateValue: { fontSize: 14, color: '#333', marginTop: 2 },

  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  timeLabel: { fontSize: 13, fontWeight: 'bold', marginRight: 6, color: '#333' },
  timeValue: { fontSize: 13, color: '#003580' },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 14, color: '#555' },
  priceValue: { fontSize: 14, color: '#333' },
  priceDivider: { height: 1, backgroundColor: '#f2f2f2', marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#003580' },

  inputGroup: { borderBottomWidth: 1, borderBottomColor: '#bdbdbd', paddingVertical: 8, marginBottom: 4 },
  inputLabel: { fontSize: 12, color: '#555', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  textInput: { fontSize: 16, color: '#333', paddingVertical: 2 },
  inputRow: { flexDirection: 'row' },
  errorBorder: { borderBottomColor: '#d32f2f' },
  fieldError: { color: '#d32f2f', fontSize: 12, marginBottom: 10, marginTop: 2 },
  errorCard: { borderColor: '#d32f2f' },

  policyBullet: { fontSize: 13, color: '#444', marginBottom: 5 },
  termsOption: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  customCheckbox: { width: 22, height: 22, borderColor: '#bdbdbd', borderWidth: 1, marginRight: 10 },
  customChecked: { backgroundColor: '#003580', borderColor: '#003580' },
  termsText: { flex: 1, fontSize: 13, color: '#333' },

  statusBox: { margin: 12, padding: 12, backgroundColor: '#fff9c4', borderRadius: 4, borderWidth: 1, borderColor: '#f9a825' },
  statusBoxError: { backgroundColor: '#fff5f5', borderColor: '#f44336' },
  statusBoxText: { textAlign: 'center', color: '#5f4b00', fontWeight: 'bold', fontSize: 13 },

  submitBtn: { backgroundColor: '#003580', margin: 12, padding: 16, borderRadius: 2, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#a3abb5' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },

  cancelBtn: { marginHorizontal: 12, padding: 12, alignItems: 'center' },
  cancelBtnText: { color: '#003580', fontSize: 14, textDecorationLine: 'underline' },

  paymentSelector: { marginTop: 15, marginBottom: 5, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  selectorLabel: { fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  radioItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 6, marginBottom: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  radioSelected: { borderColor: '#003580', backgroundColor: '#e9f0fa' },
  radioDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#ccc', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  radioDotActive: { borderColor: '#003580', borderWidth: 5 },
  radioTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  radioDesc: { fontSize: 12, color: '#666', marginTop: 2 },
});

export default PaymentScreen;
