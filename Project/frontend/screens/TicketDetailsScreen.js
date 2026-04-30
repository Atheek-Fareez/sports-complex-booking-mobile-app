import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import api from '../services/api';

const TicketDetailsScreen = ({ route, navigation }) => {
  const { ticketId } = route.params;
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    try {
      const response = await api.get(`/tickets/${ticketId}`);
      setTicket(response.data.data);
    } catch (error) {
      console.log('Failed to fetch ticket details:', error);
      Alert.alert('Error', 'Could not load ticket details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [updating, setUpdating] = useState(false);

  const startEditing = () => {
    setEditedSubject(ticket.subject);
    setEditedDescription(ticket.description);
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    if (!editedSubject.trim()) {
      Alert.alert('Validation Error', 'Subject is required.');
      return;
    }
    if (editedSubject.trim().length < 5) {
      Alert.alert('Validation Error', 'Subject must be at least 5 characters long.');
      return;
    }
    if (!editedDescription.trim()) {
      Alert.alert('Validation Error', 'Description is required.');
      return;
    }
    if (editedDescription.trim().length < 10) {
      Alert.alert('Validation Error', 'Description must be at least 10 characters long.');
      return;
    }
    setUpdating(true);
    try {
      const response = await api.put(`/tickets/${ticketId}`, {
        subject: editedSubject,
        description: editedDescription,
      });
      setTicket(response.data.data);
      setIsEditing(false);
      setSuccessMsg('Ticket updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000); // Auto-hide after 3 seconds
    } catch (error) {
      console.log('Update error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update ticket.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    console.log('[DEBUG-USER] User trying to delete ticket:', ticketId);
    console.log('[DEBUG-USER] Ticket Status:', ticket.status);

    if (ticket.status !== 'Closed') {
      if (Platform.OS === 'web') {
        window.alert('Cannot Delete: You can only delete your ticket record after it is marked as "Closed".');
      } else {
        Alert.alert('Cannot Delete', 'You can only delete your ticket record after it is marked as "Closed".');
      }
      return;
    }

    const proceedDelete = async () => {
      console.log('[DEBUG-USER] Calling Delete API...');
      try {
        await api.delete(`/tickets/${ticketId}`);
        console.log('[DEBUG-USER] Success.');
        setSuccessMsg('Ticket deleted permanently! Redirecting...');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } catch (error) {
        console.log('[DEBUG-USER] API Error:', error.response?.data || error.message);
        const errMsg = error.response?.data?.message || 'Failed to delete record.';
        if (Platform.OS === 'web') {
          window.alert('Error: ' + errMsg);
        } else {
          Alert.alert('Error', errMsg);
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to remove this ticket from your history? This action is permanent.');
      if (confirmed) {
        proceedDelete();
      }
    } else {
      Alert.alert(
        'Delete Ticket Record',
        'Are you sure you want to remove this ticket from your history? This action is permanent.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete Permanently', 
            style: 'destructive',
            onPress: proceedDelete
          },
        ]
      );
    }
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
      <View style={styles.header}>
        <Text style={styles.category}>{ticket.category.toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusStyle.color }]}>{ticket.status}</Text>
        </View>
      </View>

      {successMsg ? (
        <View style={styles.successBox}>
          <Text style={styles.successBoxText}>✅ {successMsg}</Text>
        </View>
      ) : null}

      {isEditing ? (
        <View style={styles.editSection}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            value={editedSubject}
            onChangeText={setEditedSubject}
          />
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={editedDescription}
            onChangeText={setEditedDescription}
            multiline
          />
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={updating}>
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveTxt}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.subject}>{ticket.subject}</Text>
          <Text style={styles.date}>Raised on {new Date(ticket.createdAt).toLocaleString()}</Text>

          {ticket.relatedBookingId && (
            <View style={styles.bookingCard}>
              <Text style={styles.bookingTitle}>Related Booking</Text>
              <Text style={styles.bookingText}>
                {ticket.relatedBookingId.bookingType?.toUpperCase() || 'BOOKING'} - {new Date(ticket.relatedBookingId.startDate || Date.now()).toDateString()} (LKR {ticket.relatedBookingId.totalAmount || 0})
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{ticket.description}</Text>
          </View>
        </>
      )}

      {!isEditing && ticket.status === 'Open' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editBtn} onPress={startEditing}>
            <Text style={styles.actionBtnTxt}>✏️ Edit Ticket</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isEditing && ticket.status === 'Closed' && (
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.actionBtnTxt}>🗑️ Delete Ticket Record</Text>
        </TouchableOpacity>
      )}

      {ticket.adminReply ? (
        <View style={[styles.section, styles.replySection]}>
          <View style={styles.replyHeader}>
            <Text style={styles.replyTitle}>Admin Response</Text>
            <Text style={styles.replyDate}>{new Date(ticket.updatedAt).toLocaleString()}</Text>
          </View>
          <Text style={styles.replyText}>{ticket.adminReply}</Text>
        </View>
      ) : (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>Awaiting official admin response...</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  category: { fontSize: 12, fontWeight: 'bold', color: '#999', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  subject: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  date: { fontSize: 13, color: '#666', marginBottom: 20 },
  bookingCard: { backgroundColor: '#e9f0fa', padding: 15, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#003580' },
  bookingTitle: { fontSize: 12, fontWeight: 'bold', color: '#003580', marginBottom: 4 },
  bookingText: { fontSize: 14, color: '#333' },
  section: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#e7e7e7' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#999', marginBottom: 8, textTransform: 'uppercase' },
  descriptionText: { fontSize: 16, color: '#333', lineHeight: 24 },
  replySection: { backgroundColor: '#f1f8e9', borderColor: '#c5e1a5' },
  replyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#dcedc8', paddingBottom: 5 },
  replyTitle: { fontSize: 14, fontWeight: 'bold', color: '#2e7d32' },
  replyDate: { fontSize: 10, color: '#689f38' },
  replyText: { fontSize: 16, color: '#333', lineHeight: 24, fontStyle: 'italic' },
  waitingContainer: { alignItems: 'center', marginTop: 10 },
  waitingText: { fontSize: 14, fontStyle: 'italic', color: '#999' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  editBtn: { flex: 1, backgroundColor: '#003580', padding: 12, borderRadius: 8, alignItems: 'center', marginRight: 10 },
  deleteBtn: { flex: 1, backgroundColor: '#dc3545', padding: 12, borderRadius: 8, alignItems: 'center' },
  actionBtnTxt: { color: '#fff', fontWeight: 'bold' },
  editSection: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#003580' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, fontSize: 16, marginBottom: 15, color: '#333' },
  textArea: { height: 100, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { padding: 10, marginRight: 10 },
  cancelTxt: { color: '#666', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#2e7d32', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
  saveTxt: { color: '#fff', fontWeight: 'bold' },
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
});

export default TicketDetailsScreen;
