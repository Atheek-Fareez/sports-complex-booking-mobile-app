import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../services/api';

const isRefundCategory = (cat) => ['Refund Request', 'Booking Refund', 'Payment Refund'].includes(cat);

const AdminTicketDetailsScreen = ({ route, navigation }) => {
  const { ticketId } = route.params;
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const statuses = ['Open', 'In Progress', 'Replied', 'Resolved', 'Closed'];

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    try {
      const response = await api.get(`/admin/tickets/${ticketId}`);
      const data = response.data.data;
      setTicket(data);
      setReplyText(data.adminReply || '');
      setStatus(data.status);
    } catch (error) {
      console.log('Admin fetch ticket details error:', error);
      Alert.alert('Error', 'Could not load ticket details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!replyText.trim()) {
      Alert.alert('Validation Error', 'Please enter a reply message.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        adminReply: replyText,
        status: status,
      };

      await api.put(`/admin/tickets/${ticketId}/reply`, payload);
      setSuccessMsg('Ticket updated successfully! Redirecting...');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      console.error('Admin Ticket Reply Error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update ticket';
      Alert.alert('Update Failed', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    console.log('[DEBUG] Delete requested for ticketId:', ticketId);
    console.log('[DEBUG] Current status check:', status);

    if (status !== 'Closed') {
      if (Platform.OS === 'web') {
        window.alert('Cannot Delete: You can only delete tickets that have been set to "Closed" status.');
      } else {
        Alert.alert('Cannot Delete', 'You can only delete tickets that have been set to "Closed" status.');
      }
      return;
    }

    const proceedDelete = async () => {
      console.log('[DEBUG] Admin confirmed delete. Calling API...');
      try {
        const response = await api.delete(`/admin/tickets/${ticketId}`);
        console.log('[DEBUG] Delete Success:', response.data);
        setSuccessMsg('Ticket deleted permanently! Redirecting...');
        setTimeout(() => navigation.goBack(), 1500);
      } catch (error) {
        console.log('[DEBUG] Delete Failed:', error.response?.data || error.message);
        const msg = error.response?.data?.message || 'Failed to delete ticket.';
        if (Platform.OS === 'web') {
          window.alert('Delete Failed: ' + msg);
        } else {
          Alert.alert('Delete Failed', msg);
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('This will remove this ticket permanently from the system history. Are you sure?');
      if (confirmed) {
        proceedDelete();
      }
    } else {
      Alert.alert(
        'Confirm Permanent Delete',
        'This will remove this ticket permanently from the system history. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete Now', 
            style: 'destructive',
            onPress: proceedDelete
          }
        ]
      );
    }
  };

  const handleProcessRefund = () => {
    const booking = ticket.relatedBookingId;
    const refundAmt = booking?.paidAmount || (booking?.paymentMode === 'advance' ? booking?.totalAmount / 2 : booking?.totalAmount);
    
    // Redirect to Mock Refund Screen instead of immediate processing
    navigation.navigate('MockRefundPayment', {
      ticketId,
      refundAmount: refundAmt,
      bookingId: booking?._id,
      note: replyText // Pass the current reply text as the refund note
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Open': return { backgroundColor: '#e9f0fa', color: '#003580' };
      case 'In Progress': return { backgroundColor: '#fff8e1', color: '#f57f17' };
      case 'Replied': return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
      case 'Resolved': return { backgroundColor: '#f3e5f5', color: '#7b1fa2' };
      case 'Closed': return { backgroundColor: '#eeeeee', color: '#616161' };
      default: return { backgroundColor: '#f2f2f2', color: '#333' };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003580" />
      </View>
    );
  }

  if (!ticket) return null;

  const statusStyle = getStatusStyle(ticket.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.userSection}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarTxt}>{ticket.userId.fullName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{ticket.userId.fullName}</Text>
          <Text style={styles.userEmail}>{ticket.userId.email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBadgeBg(ticket.status) }]}>
          <Text style={[styles.statusText, { color: statusTextClr(ticket.status) }]}>{ticket.status}</Text>
        </View>
      </View>

      {successMsg ? (
        <View style={styles.successBox}>
          <Text style={styles.successBoxText}>✅ {successMsg}</Text>
        </View>
      ) : null}

      <Text style={styles.subject}>{ticket.subject}</Text>
      <Text style={styles.date}>Raised on {new Date(ticket.createdAt).toLocaleString()}</Text>

      {ticket.relatedBookingId && (
        <View style={styles.bookingCard}>
          <Text style={styles.bookingTitle}>Related Booking</Text>
          <Text style={styles.bookingText}>
            {ticket.relatedBookingId.bookingType.toUpperCase()} - {new Date(ticket.relatedBookingId.startDate).toDateString()} (LKR {ticket.relatedBookingId.totalAmount})
          </Text>
        </View>
      )}

      <View style={styles.issueSection}>
        <Text style={styles.sectionTitle}>User Issue (Category: {ticket.category})</Text>
        <Text style={styles.descriptionText}>{ticket.description}</Text>
      </View>

      <View style={styles.replySection}>
        <Text style={styles.sectionTitle}>Admin Response & Status</Text>
        
        <Text style={styles.label}>Update Ticket Status</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={status}
            onValueChange={(itemValue) => {
              setStatus(itemValue);
              if (Platform.OS === 'web' && typeof document !== 'undefined' && document.activeElement) {
                document.activeElement.blur();
              }
            }}
            style={styles.picker}
          >
            {statuses.map(s => (
              <Picker.Item key={s} label={s} value={s} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Reply Message</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Write your response to the user here..."
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={replyText}
          onChangeText={setReplyText}
        />

        <TouchableOpacity 
          style={[styles.updateBtn, submitting && styles.disabledBtn]} 
          onPress={handleUpdate}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateBtnTxt}>Update Ticket</Text>}
        </TouchableOpacity>

        {status === 'Closed' && (
          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={handleDelete}
          >
            <Text style={styles.deleteBtnTxt}>🗑️ Delete Ticket permanently</Text>
          </TouchableOpacity>
        )}
      </View>

      {ticket.relatedBookingId && isRefundCategory(ticket.category) && (
        <View style={styles.refundSection}>
          <Text style={styles.sectionTitle}>Admin Refund Validation</Text>
          
          <View style={styles.refundDetailsBox}>
            <View style={styles.rRow}><Text style={styles.rLabel}>Facility</Text><Text style={styles.rValue}>{ticket.relatedBookingId.bookingType?.toUpperCase()}</Text></View>
            <View style={styles.rRow}><Text style={styles.rLabel}>Total Amount</Text><Text style={styles.rValue}>Rs. {ticket.relatedBookingId.totalAmount}</Text></View>
            <View style={styles.rRow}><Text style={styles.rLabel}>Paid Amount</Text><Text style={[styles.rValue, {color: '#28a745'}]}>Rs. {ticket.relatedBookingId.paidAmount || (ticket.relatedBookingId.paymentMode === 'advance' ? ticket.relatedBookingId.totalAmount / 2 : ticket.relatedBookingId.totalAmount)}</Text></View>
            {ticket.relatedBookingId.bookingType === 'room' && (
              <View style={styles.rRow}><Text style={styles.rLabel}>Remaining Balance</Text><Text style={[styles.rValue, {color: '#dc3545'}]}>Rs. {ticket.relatedBookingId.remainingBalance || (ticket.relatedBookingId.paymentMode === 'advance' ? ticket.relatedBookingId.totalAmount / 2 : 0)}</Text></View>
            )}
            
            <View style={styles.rRow}>
              <Text style={styles.rLabel}>Refund Eligibility</Text>
              {(() => {
                const b = ticket.relatedBookingId;
                if (b.refundStatus === 'Processed') return <Text style={[styles.rValue, { color: '#666' }]}>Already Refunded</Text>;
                if (b.status === 'cancelled') return <Text style={[styles.rValue, { color: '#666' }]}>Already Cancelled</Text>;
                
                const diffHrs = (new Date(b.startDate) - new Date()) / 3600000;
                const minHrs = b.bookingType === 'room' ? 48 : 12;
                if (diffHrs >= minHrs) {
                  return <Text style={[styles.rValue, { color: '#28a745', fontWeight: 'bold' }]}>✅ Eligible ({Math.floor(diffHrs)}h remaining)</Text>;
                } else {
                  return <Text style={[styles.rValue, { color: '#dc3545', fontWeight: 'bold' }]}>❌ Not Eligible (Requires {minHrs}h)</Text>;
                }
              })()}
            </View>
          </View>

          {ticket.relatedBookingId.refundStatus !== 'Processed' && ticket.relatedBookingId.status !== 'cancelled' && (
            <React.Fragment>
              {ticket.relatedBookingId.bookingType === 'room' ? (
                <TouchableOpacity 
                  style={[styles.refundBtn, submitting && styles.disabledBtn]} 
                  onPress={handleProcessRefund}
                  disabled={submitting}
                >
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.refundBtnTxt}>✅ Process Refund & Cancel Booking</Text>}
                </TouchableOpacity>
              ) : (
                <View style={styles.rebookingNote}>
                  <Text style={styles.rebookingNoteTxt}>
                    ℹ️ Note: Pool and Court bookings follow a rebooking policy (within 2 weeks) instead of direct refunds. Please coordinate with the user.
                  </Text>
                </View>
              )}
            </React.Fragment>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// Helper functions for badge coloring
const statusBadgeBg = (status) => {
  switch (status) {
    case 'Open': return '#e9f0fa';
    case 'In Progress': return '#fff8e1';
    case 'Replied': return '#e8f5e9';
    case 'Resolved': return '#f3e5f5';
    default: return '#eeeeee';
  }
};
const statusTextClr = (status) => {
  switch (status) {
    case 'Open': return '#003580';
    case 'In Progress': return '#f57f17';
    case 'Replied': return '#2e7d32';
    case 'Resolved': return '#7b1fa2';
    default: return '#616161';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  userSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 20 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#003580', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 12, color: '#666' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  subject: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  date: { fontSize: 12, color: '#999', marginBottom: 20 },
  bookingCard: { backgroundColor: '#e9f0fa', padding: 12, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#003580' },
  bookingTitle: { fontSize: 10, fontWeight: 'bold', color: '#003580', marginBottom: 2 },
  bookingText: { fontSize: 13, color: '#333' },
  issueSection: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#e7e7e7' },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#999', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  descriptionText: { fontSize: 16, color: '#333', lineHeight: 24 },
  replySection: { backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#e7e7e7' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 10 },
  pickerContainer: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 15, overflow: 'hidden' },
  picker: { height: 50 },
  textArea: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, color: '#333', height: 120 },
  updateBtn: { backgroundColor: '#003580', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  disabledBtn: { backgroundColor: '#a3abb5' },
  updateBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dc3545', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  deleteBtnTxt: { color: '#dc3545', fontSize: 14, fontWeight: 'bold' },
  successBox: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  successBoxText: {
    color: '#155724',
    fontSize: 14,
    fontWeight: 'bold',
  },
  refundSection: { backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#e7e7e7', marginTop: 20 },
  refundDetailsBox: { backgroundColor: '#fdfdfd', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#eee', marginBottom: 15, gap: 5 },
  rRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  rLabel: { fontSize: 13, color: '#666' },
  rValue: { fontSize: 13, color: '#333', fontWeight: 'bold' },
  refundBtn: { backgroundColor: '#dc3545', padding: 16, borderRadius: 8, alignItems: 'center' },
  refundBtnTxt: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  rebookingNote: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeeba',
    marginTop: 5,
  },
  rebookingNoteTxt: {
    color: '#856404',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AdminTicketDetailsScreen;
