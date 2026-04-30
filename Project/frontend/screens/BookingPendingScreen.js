import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const BookingPendingScreen = ({ route, navigation }) => {
  const {
    facilityName, facilityType, startDate, endDate,
    startTime, endTime, totalAmount, amountPaid, paymentMode, maskedCardNumber, bookingRef
  } = route.params || {};

  const isHourly = facilityType === 'court' || facilityType === 'pool';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Status Icon */}
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>⏳</Text>
      </View>

      <Text style={styles.title}>Booking Submitted!</Text>


      {/* Booking Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Booking Summary</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Facility</Text>
          <Text style={styles.rowValue}>{facilityName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Type</Text>
          <Text style={styles.rowValue}>{facilityType?.charAt(0).toUpperCase() + facilityType?.slice(1)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Check-in</Text>
          <Text style={styles.rowValue}>{startDate ? new Date(startDate).toLocaleDateString() : '—'}</Text>
        </View>
        {endDate && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Check-out</Text>
            <Text style={styles.rowValue}>{new Date(endDate).toLocaleDateString()}</Text>
          </View>
        )}
        {isHourly && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Time</Text>
            <Text style={styles.rowValue}>{startTime}:00 – {endTime}:00</Text>
          </View>
        )}
        <View style={styles.divider} />
        {facilityType === 'room' ? (
          <>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Payment Method</Text>
              <Text style={[styles.rowValue, { fontWeight: 'bold' }]}>{paymentMode === 'advance' ? 'Advance Payment' : 'Full Payment'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Total Amount</Text>
              <Text style={styles.rowValue}>Rs. {totalAmount}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Paid Amount</Text>
              <Text style={[styles.rowValue, { fontWeight: 'bold', color: '#28a745' }]}>Rs. {amountPaid}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Remaining Balance</Text>
              <Text style={[styles.rowValue, { fontWeight: 'bold', color: '#dc3545' }]}>Rs. {paymentMode === 'advance' ? totalAmount/2 : 0}</Text>
            </View>
          </>
        ) : (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Amount Paid</Text>
            <Text style={[styles.rowValue, { fontWeight: 'bold', color: '#003580' }]}>LKR {totalAmount}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Card</Text>
          <Text style={styles.rowValue}>{maskedCardNumber}</Text>
        </View>
        {bookingRef && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Reference</Text>
            <Text style={[styles.rowValue, { fontWeight: 'bold' }]}>#{bookingRef}</Text>
          </View>
        )}
      </View>

      {/* Status Banner */}
      <View style={styles.statusBanner}>
        <Text style={styles.statusIcon}>⏳</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.statusTitle}>Pending Admin Verification</Text>
          <Text style={styles.statusSub}>Our team will review and confirm your booking shortly.</Text>
        </View>
      </View>

      {/* SMS Notice */}


      {/* Actions */}
      <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('MyBookings')}>
        <Text style={styles.primaryBtnText}>View My Bookings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.secondaryBtnText}>Go to Profile</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  content: { alignItems: 'center', padding: 20 },

  iconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#e9f0fa', justifyContent: 'center', alignItems: 'center', marginTop: 30, marginBottom: 16 },
  iconText: { fontSize: 40 },

  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 },

  summaryCard: { backgroundColor: '#fff', width: '100%', borderRadius: 2, borderWidth: 1, borderColor: '#e7e7e7', padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#003580', marginBottom: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  rowLabel: { fontSize: 13, color: '#666' },
  rowValue: { fontSize: 13, color: '#333', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#f2f2f2', marginVertical: 8 },

  statusBanner: { width: '100%', backgroundColor: '#fff9e6', borderRadius: 2, borderWidth: 1, borderColor: '#f9a825', padding: 14, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  statusIcon: { fontSize: 22 },
  statusTitle: { fontSize: 14, fontWeight: 'bold', color: '#856404' },
  statusSub: { fontSize: 12, color: '#856404', marginTop: 2 },

  smsBanner: { width: '100%', backgroundColor: '#e9f0fa', borderRadius: 2, borderWidth: 1, borderColor: '#d0e2f8', padding: 12, marginBottom: 20 },
  smsText: { fontSize: 13, color: '#003580', textAlign: 'center', lineHeight: 18 },

  primaryBtn: { width: '100%', backgroundColor: '#003580', padding: 16, borderRadius: 2, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  secondaryBtn: { width: '100%', padding: 12, alignItems: 'center' },
  secondaryBtnText: { color: '#003580', fontSize: 14, textDecorationLine: 'underline' },
});

export default BookingPendingScreen;
