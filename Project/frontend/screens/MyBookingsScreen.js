import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import api, { getImageUrl } from '../services/api';

const MyBookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBookings = async () => {
    try {
      const response = await api.get('/bookings/my');
      setBookings(response.data.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch your bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = (bookingId) => {
    console.log('[CANCEL] handleCancelBooking called with ID:', bookingId);
    
    // Fallback for Web if Alert.alert is not showing
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmCancel = window.confirm('Are you sure you want to cancel this booking and delete the payment record? This action cannot be undone.');
      if (confirmCancel) {
        performCancellation(bookingId);
      }
      return;
    }

    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking and delete the payment record? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => performCancellation(bookingId)
        }
      ]
    );
  };

  const performCancellation = async (bookingId) => {
    try {
      console.log('[CANCEL] Initiating API call for ID:', bookingId);
      setLoading(true);
      const response = await api.delete(`/bookings/cancel-pending/${bookingId}`);
      console.log('[CANCEL] API Response:', response.data);
      if (response.data.success) {
        Alert.alert('Success', 'Booking cancelled successfully.');
        fetchMyBookings();
      }
    } catch (error) {
      console.error('[CANCEL] Error details:', error);
      const msg = error.response?.data?.message || 'Failed to cancel booking.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyBookings();
    });
    return unsubscribe;
  }, [navigation]);

  const getStatusColor = (status, type = 'booking') => {
    switch (status) {
      case 'success': return '#28a745';
      case 'confirmed': return '#28a745';
      case 'pending_verification': return '#febb02';
      case 'paid_pending_approval': return '#febb02';
      case 'pending_payment': return '#007bff';
      case 'rejected': return '#dc3545';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status, type = 'booking') => {
    const prefix = type === 'booking' ? 'Booking' : 'Payment';
    switch (status) {
      case 'success': return '✅ Success';
      case 'confirmed': return '✅ Confirmed';
      case 'pending_verification': return '⏳ Pending Verification';
      case 'paid_pending_approval': return '⏳ Pending Admin Approval';
      case 'pending_payment': return '💳 Awaiting Payment';
      case 'rejected': return '❌ Rejected';
      case 'cancelled': return '❌ Cancelled';
      case 'pending': return '⏳ Pending';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const renderBookingItem = ({ item }) => {
    const facility = item.roomId || item.courtId || item.poolId;
    const name = facility ? (facility.roomName || facility.courtName || facility.poolName) : 'Facility';

    return (
      <View style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <Image 
             source={facility?.image ? { uri: getImageUrl(facility?.image) } : require('../assets/icon.png')} 
             style={styles.thumbnail} 
             resizeMode="cover"
          />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.facilityName}>{name}</Text>
          </View>
          <View style={styles.badgesContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status, 'booking') }]}>
              <Text style={styles.statusText}>{getStatusText(item.status, 'booking')}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.paymentStatus, 'payment'), marginTop: 5 }]}>
              <Text style={styles.statusText}>Payment: {getStatusText(item.paymentStatus, 'payment')}</Text>
            </View>
            {item.refundStatus === 'Processed' && (
              <View style={[styles.statusBadge, { backgroundColor: '#7b1fa2', marginTop: 5 }]}>
                <Text style={styles.statusText}>Refund Processed</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.details}>
          <Text style={styles.detailItem}>📅 {new Date(item.startDate).toDateString()}</Text>
          {item.bookingType !== 'room' && (
            <Text style={styles.detailItem}>⏰ {new Date(item.startDate).getHours()}:00 - {new Date(item.endDate).getHours()}:00</Text>
          )}

          {item.bookingType === 'room' ? (
            <View style={styles.financialContainer}>
              <Text style={styles.detailItem}><Text style={{fontWeight: 'bold'}}>Total Amount:</Text> Rs. {item.totalAmount?.toLocaleString()}</Text>
              <Text style={styles.detailItem}><Text style={{fontWeight: 'bold'}}>Payment Method:</Text> {item.paymentMode === 'advance' ? 'Advance Payment' : 'Full Payment'}</Text>
              <Text style={styles.detailItem}><Text style={{fontWeight: 'bold'}}>Paid Amount:</Text> Rs. {item.paidAmount?.toLocaleString() || (item.paymentMode === 'advance' ? item.totalAmount/2 : item.totalAmount)}</Text>
              <Text style={styles.detailItem}><Text style={{fontWeight: 'bold'}}>Remaining Balance:</Text> <Text style={{color: '#dc3545'}}>Rs. {item.remainingBalance?.toLocaleString() || (item.paymentMode === 'advance' ? item.totalAmount/2 : 0)}</Text></Text>
            </View>
          ) : (
            <Text style={styles.amount}>LKR {item.totalAmount?.toLocaleString()}</Text>
          )}
        </View>

        {item.status === 'pending_payment' && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={styles.continuePaymentBtn}
              onPress={() => navigation.navigate('Payment', {
                bookingId: item._id,
                totalAmount: item.totalAmount,
                facilityType: item.bookingType,
                facilityName: name,
                startDate: item.startDate,
                endDate: item.endDate,
                startTime: new Date(item.startDate).getHours(),
                endTime: new Date(item.endDate).getHours()
              })}
            >
              <Text style={styles.continuePaymentBtnText}>💳 Continue Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelBookingBtn}
              onPress={() => handleCancelBooking(item._id)}
            >
              <Text style={styles.cancelBookingBtnText}>🗑️ Cancel Booking</Text>
            </TouchableOpacity>
          </View>
        )}

        {(item.status === 'confirmed' || item.status === 'success') && item.refundStatus !== 'Processed' && (
          <View style={styles.refundSection}>
            {item.hasRefundTicket ? (
              <View style={styles.refundStatusContainer}>
                <Text style={styles.refundStatusText}>
                  📩 {item.bookingType === 'room' ? 'Refund Request Submitted' : 'Rebooking Request Submitted'}
                </Text>
                <Text style={styles.refundNoticeText}>We are reviewing your request. Check "My Tickets" for updates.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.refundNotice}>
                  {item.bookingType === 'room' 
                    ? 'Have an issue or need to request a refund? You can raise a support ticket.' 
                    : 'Need to rebook? (Rebooking allowed within 2 weeks of the booking date) You can raise a support ticket.'}
                </Text>
                <TouchableOpacity 
                  style={styles.raiseTicketBtn}
                  onPress={() => navigation.navigate('RaiseTicket', { 
                    prefillBookingId: item._id, 
                    prefillCategory: 'Refund Request' 
                  })}
                >
                  <Text style={styles.raiseTicketBtnText}>
                    {item.bookingType === 'room' ? '🎫 Raise Support Ticket' : '🎫 Request Rebooking'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Bookings</Text>
      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You have no bookings yet.</Text>
          <Text style={styles.emptySubText}>Select a facility type to get started:</Text>
          
          <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('RoomList')}>
            <Text style={styles.browseButtonText}>🛏️ Browse Rooms</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.browseButton, { backgroundColor: '#28a745', marginTop: 12 }]} onPress={() => navigation.navigate('CourtList')}>
            <Text style={styles.browseButtonText}>🏸 Browse Courts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.browseButton, { backgroundColor: '#17a2b8', marginTop: 12 }]} onPress={() => navigation.navigate('PoolList')}>
            <Text style={styles.browseButtonText}>🏊 Browse Pools</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchMyBookings}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  listContainer: { paddingBottom: 20 },
  bookingCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  thumbnail: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#eee', marginRight: 10 },
  headerTitleContainer: { flex: 1, justifyContent: 'flex-start' },
  facilityName: { fontSize: 18, fontWeight: 'bold', color: '#007bff', flex: 1, marginRight: 10 },
  badgesContainer: { alignItems: 'flex-end', flexShrink: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, minWidth: 100, alignItems: 'center' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  details: { gap: 5 },
  detailItem: { fontSize: 13, color: '#666', marginBottom: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#28a745', marginTop: 5 },
  financialContainer: { marginTop: 6, backgroundColor: '#f9f9f9', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#eee' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#333', fontWeight: 'bold', marginBottom: 5 },
  emptySubText: { fontSize: 14, color: '#666', marginBottom: 25 },
  browseButton: { backgroundColor: '#007bff', width: '80%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', elevation: 2 },
  browseButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  refundSection: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  refundNotice: { fontSize: 12, color: '#666', fontStyle: 'italic', marginBottom: 8 },
  raiseTicketBtn: { backgroundColor: '#febb02', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  raiseTicketBtnText: { color: '#003580', fontWeight: 'bold', fontSize: 14 },
  refundStatusContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#90caf9',
    alignItems: 'center',
  },
  refundStatusText: {
    color: '#0d47a1',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  refundNoticeText: {
    color: '#1565c0',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  continuePaymentBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1.5,
    borderWidth: 1,
    borderColor: '#0056b3',
  },
  continuePaymentBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelBookingBtn: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  cancelBookingBtnText: {
    color: '#dc3545',
    fontWeight: 'bold',
    fontSize: 15,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
});

export default MyBookingsScreen;
