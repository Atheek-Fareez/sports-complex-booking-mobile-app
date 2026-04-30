import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Platform
} from 'react-native';
import api from '../services/api';

const AdminBookingListScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const fetchPendingBookings = useCallback(async () => {
    try {
      const res = await api.get('/payments/pending');
      setBookings(res.data.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch bookings. Check your admin access.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchPendingBookings);
    return unsubscribe;
  }, [navigation, fetchPendingBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingBookings();
  };

  const handleVerify = (bookingId, facilityName, userName) => {
    const idStr = bookingId.toString();
    console.log(`[DEBUG] handleVerify triggered for idStr: ${idStr}`);
    
    const proceedVerification = async () => {
      console.log(`[ADMIN-ACTION] Starting verification for Booking ID: ${idStr}`);
      setProcessingId(idStr);
      try {
        console.log(`[ADMIN-ACTION] Sending POST to /payments/admin-verify with { bookingId: "${idStr}" }`);
        const res = await api.post('/payments/admin-verify', { bookingId: idStr });
        console.log('[ADMIN-ACTION] API Response Received:', res.data);
        
        if (res.data.success) {
          console.log('[ADMIN-ACTION] Verification Successful');
          if (Platform.OS === 'web') {
            window.alert('✅ Success: Booking confirmed.');
          } else {
            Alert.alert('✅ Success', 'Booking confirmed.');
          }
        } else {
          console.warn('[ADMIN-ACTION] API returned success:false', res.data);
          if (Platform.OS === 'web') {
            window.alert(`Warning: ${res.data.message || 'Verification returned unsuccessful status.'}`);
          } else {
            Alert.alert('Warning', res.data.message || 'Verification returned unsuccessful status.');
          }
        }
        fetchPendingBookings();
      } catch (error) {
        const errMsg = error.response?.data?.message || error.message || 'Unknown error';
        console.error('[ADMIN-ACTION] API ERROR:', {
          message: errMsg,
          status: error.response?.status,
          data: error.response?.data
        });
        if (Platform.OS === 'web') {
          window.alert(`Verification Failed. Error: ${errMsg}`);
        } else {
          Alert.alert('Verification Failed', `Error: ${errMsg}`);
        }
      } finally {
        setProcessingId(null);
        console.log('[ADMIN-ACTION] Verification process finished');
      }
    };

    if (Platform.OS === 'web') {
      const confirmRes = window.confirm(`Approve booking for "${facilityName}" by ${userName}?`);
      if (confirmRes) {
        proceedVerification();
      }
    } else {
      Alert.alert(
        'Confirm Booking',
        `Approve booking for "${facilityName}" by ${userName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Accept & Notify', onPress: proceedVerification }
        ]
      );
    }
  };

  const handleTestAPI = async () => {
    try {
      const res = await api.get('/payments/test-route');
      Alert.alert('API Reachable', `Success: ${res.data.message}`);
    } catch (error) {
      Alert.alert('API Error', `Could not reach backend: ${error.message}`);
    }
  };

  const handleReject = (bookingId, facilityName) => {
    const idStr = bookingId.toString();
    console.log(`[DEBUG] handleReject triggered for idStr: ${idStr}`);

    const proceedRejection = async () => {
      console.log(`[DEBUG] Admin clicked Reject for: ${idStr}`);
      setProcessingId(idStr);
      try {
        await api.post('/payments/admin-reject', { bookingId: idStr });
        console.log('[DEBUG] Rejection API Success');
        
        if (Platform.OS === 'web') {
          window.alert('Booking Rejected: The booking has been rejected.');
        } else {
          Alert.alert('Booking Rejected', 'The booking has been rejected.');
        }
        fetchPendingBookings();
      } catch (error) {
        const errMsg = error.response?.data?.message || error.message || 'Rejection failed.';
        console.error('[DEBUG] Rejection API Error:', errMsg);
        if (Platform.OS === 'web') {
          window.alert(`Error: ${errMsg}`);
        } else {
          Alert.alert('Error', errMsg);
        }
      } finally {
        setProcessingId(null);
      }
    };

    if (Platform.OS === 'web') {
      const confirmRes = window.confirm(`Reject booking for "${facilityName}"? This will cancel the booking.`);
      if (confirmRes) {
        proceedRejection();
      }
    } else {
      Alert.alert(
        'Reject Booking',
        `Reject booking for "${facilityName}"? This will cancel the booking.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reject', style: 'destructive', onPress: proceedRejection }
        ]
      );
    }
  };

  const renderItem = ({ item }) => {
    const facilityName =
      item.roomId?.roomName || item.courtId?.courtName || item.poolId?.poolName || 'Unknown Facility';
    const userName = item.userId?.name || item.userId?.fullName || 'Unknown User';
    const userEmail = item.userId?.email || '';
    const userPhone = item.userId?.phone || '';
    const isProcessing = processingId === item._id;
    const bookingRef = item._id?.toString().slice(-6).toUpperCase();
    const paymentRef = item.paymentId?.toString().slice(-6).toUpperCase();

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.facilityName}>{facilityName}</Text>
            <View style={styles.refRow}>
              <Text style={styles.refTag}>Booking #{bookingRef}</Text>
              {paymentRef && <Text style={styles.refTag}>Payment #{paymentRef}</Text>}
            </View>
          </View>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>AWAITING APPROVAL</Text>
          </View>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Customer</Text>
            <Text style={styles.detailValue}>{userName}</Text>
            {userEmail ? <Text style={styles.detailSub}>{userEmail}</Text> : null}
            {userPhone ? <Text style={styles.detailSub}>{userPhone}</Text> : null}
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{new Date(item.startDate).toDateString()}</Text>
            {item.bookingType !== 'room' && item.endDate && (
              <Text style={styles.detailSub}>
                {new Date(item.startDate).getHours()}:00 – {new Date(item.endDate).getHours()}:00
              </Text>
            )}
            {item.bookingType === 'room' && item.endDate && (
              <Text style={styles.detailSub}>Check-out: {new Date(item.endDate).toDateString()}</Text>
            )}
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.paymentDetailsRow}>
          <View style={styles.paymentDetailItem}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>CARD</Text>
            <Text style={styles.detailSub}>{item.maskedCardNumber || '—'}</Text>
            {item.cardholderName ? <Text style={styles.detailSub}>{item.cardholderName}</Text> : null}
          </View>
          <View style={styles.paymentDetailItem}>
            <Text style={styles.detailLabel}>Statuses</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.detailValue, { fontSize: 13 }]}>{item.paymentStatus?.toUpperCase()}</Text>
            </View>
            <Text style={styles.detailSub}>Verification: {item.verificationStatus || 'Pending'}</Text>
          </View>
          <View style={styles.paymentDetailItem}>
            <Text style={styles.detailLabel}>Submitted</Text>
            <Text style={styles.detailValue}>
              {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '—'}
            </Text>
            {item.submittedAt ? (
              <Text style={styles.detailSub}>{new Date(item.submittedAt).toLocaleTimeString()}</Text>
            ) : null}
          </View>
        </View>

        {/* Amount Section */}
        <View style={styles.financialContainer}>
          <View style={[styles.amountRow, { borderTopWidth: 0 }]}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>Rs. {item.totalAmount?.toLocaleString()}</Text>
          </View>
          
          {item.bookingType === 'room' && (
            <>
              <View style={[styles.amountRow, { borderTopWidth: 0, paddingTop: 4 }]}>
                <Text style={styles.amountLabel}>Payment Method</Text>
                <Text style={[styles.amountValue, { fontSize: 13, color: '#333' }]}>
                  {item.paymentMode === 'advance' ? 'Advance Payment' : 'Full Payment'}
                </Text>
              </View>
              <View style={[styles.amountRow, { borderTopWidth: 0, paddingTop: 4 }]}>
                <Text style={styles.amountLabel}>Paid Amount</Text>
                <Text style={[styles.amountValue, { color: '#28a745', fontSize: 16 }]}>
                  Rs. {item.paidAmount?.toLocaleString() || (item.paymentMode === 'advance' ? item.totalAmount/2 : item.totalAmount)}
                </Text>
              </View>
              <View style={[styles.amountRow, { borderTopWidth: 0, paddingTop: 4 }]}>
                <Text style={styles.amountLabel}>Remaining Balance</Text>
                <Text style={[styles.amountValue, { color: '#dc3545', fontSize: 16 }]}>
                  Rs. {item.remainingBalance?.toLocaleString() || (item.paymentMode === 'advance' ? item.totalAmount/2 : 0)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {isProcessing ? (
            <ActivityIndicator color="#003580" style={{ flex: 1 }} />
          ) : (
            <>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleReject(item._id, facilityName)}
              >
                <Text style={styles.rejectBtnText}>✕ Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => handleVerify(item._id, facilityName, userName)}
              >
                <Text style={styles.approveBtnText}>✓ Accept & Confirm</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003580" />
        <Text style={styles.loadingText}>Loading pending bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Summary Banner */}
      <View style={styles.summaryBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryCount}>{bookings.length}</Text>
          <Text style={styles.summaryLabel}>Booking{bookings.length !== 1 ? 's' : ''} awaiting approval</Text>
        </View>
        <TouchableOpacity onPress={handleTestAPI} style={styles.testBtn}>
          <Text style={styles.testBtnText}>Test API</Text>
        </TouchableOpacity>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>All clear!</Text>
          <Text style={styles.emptyText}>No bookings are awaiting verification.</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#003580']} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#666', fontSize: 14 },

  summaryBanner: { backgroundColor: '#003580', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryCount: { fontSize: 32, fontWeight: 'bold', color: '#febb02' },
  summaryLabel: { fontSize: 14, color: '#ffffffcc', fontWeight: '500' },

  testBtn: { backgroundColor: '#ffffff22', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: '#ffffff44' },
  testBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  card: { backgroundColor: '#fff', borderRadius: 2, marginBottom: 12, borderWidth: 1, borderColor: '#e7e7e7', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  cardTitleGroup: { flex: 1 },
  facilityName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  pendingBadge: { backgroundColor: '#fff3cd', borderRadius: 2, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  pendingBadgeText: { color: '#856404', fontSize: 10, fontWeight: 'bold' },

  refRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  refTag: { fontSize: 11, color: '#666', backgroundColor: '#f2f2f2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },

  detailsGrid: { flexDirection: 'row', padding: 16, gap: 16, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 11, fontWeight: 'bold', color: '#999', textTransform: 'uppercase', marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#333', fontWeight: '600' },
  detailSub: { fontSize: 12, color: '#666', marginTop: 2 },

  paymentDetailsRow: { flexDirection: 'row', padding: 16, gap: 16, backgroundColor: '#fafafa' },
  paymentDetailItem: { flex: 1 },

  financialContainer: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f2f2f2', backgroundColor: '#fff' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  amountLabel: { fontSize: 14, color: '#666', fontWeight: '500' },
  amountValue: { fontSize: 16, fontWeight: 'bold', color: '#003580' },

  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e7e7e7', minHeight: 50 },
  rejectBtn: { flex: 1, padding: 14, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#e7e7e7' },
  rejectBtnText: { color: '#dc3545', fontWeight: 'bold', fontSize: 14 },
  approveBtn: { flex: 2, padding: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#003580' },
  approveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 40 },
  emptyIcon: { fontSize: 60 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  emptyText: { fontSize: 15, color: '#666', textAlign: 'center' },
  refreshBtn: { marginTop: 10, backgroundColor: '#003580', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 2 },
  refreshBtnText: { color: '#fff', fontWeight: 'bold' },
});

export default AdminBookingListScreen;
