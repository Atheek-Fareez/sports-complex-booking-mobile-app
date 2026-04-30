import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../services/api';

const RaiseTicketScreen = ({ route, navigation }) => {
  const [category, setCategory] = useState(route?.params?.prefillCategory || '');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [bookingId, setBookingId] = useState(route?.params?.prefillBookingId || '');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingBookings, setFetchingBookings] = useState(true);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [userTickets, setUserTickets] = useState([]);
  const [fetchingTickets, setFetchingTickets] = useState(true);

  const categories = [
    'Refund Request',
    'Booking Issue',
    'Payment Issue',
    'Account Issue',
    'Technical Issue',
    'Complaint',
    'General',
    'Other',
  ];

  useEffect(() => {
    fetchMyBookings();
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    try {
      const response = await api.get('/tickets/my');
      setUserTickets(response.data.data);
    } catch (error) {
      console.log('Failed to fetch tickets:', error);
    } finally {
      setFetchingTickets(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const response = await api.get('/bookings/my');
      setBookings(response.data.data);
    } catch (error) {
      console.log('Failed to fetch bookings:', error);
    } finally {
      setFetchingBookings(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!category || category.trim() === '') {
      newErrors.category = 'Category is required';
    }

    if (!subject || subject.trim() === '') {
      newErrors.subject = 'Subject is required';
    } else if (subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }

    if (!description || description.trim() === '') {
      newErrors.description = 'Description is required';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const isDuplicateRefund = () => {
    if (category === 'Refund Request' && bookingId) {
      // 1. Check booking status from current local data
      const selectedBooking = bookings.find(b => b._id === bookingId);
      if (selectedBooking && ['Processed', 'Pending'].includes(selectedBooking.refundStatus)) {
        return 'STATUS_ALREADY_PROCESSED';
      }

      // 2. Check for ANY existing ticket (audit trail)
      const hasTicket = userTickets.some(t => {
        const tBookingId = t.relatedBookingId?._id || t.relatedBookingId;
        return t.category === 'Refund Request' && tBookingId === bookingId;
      });
      if (hasTicket) return 'TICKET_ALREADY_EXISTS';
    }
    return null;
  };

  const handleSubmit = async () => {
    setSuccessMsg(''); // clear previous success
    if (!validateForm()) {
      return; // Stop API call if validation fails
    }

    setLoading(true);
    try {
      const payload = {
        category,
        subject,
        description,
        relatedBookingId: bookingId || null,
      };

      await api.post('/tickets', payload);
      setSuccessMsg('Your ticket has been submitted successfully! Redirecting...');
      
      // Navigate after a short delay so the user can read the success message
      setTimeout(() => {
        navigation.navigate('MyTickets');
      }, 1500);
    } catch (error) {
      console.error('Ticket Submission Error:', error);
      setErrors(prev => ({ ...prev, general: error.response?.data?.message || 'Failed to submit ticket' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🎫 Raise a Support Ticket</Text>
      <Text style={styles.subtitle}>Tell us what we can help you with</Text>

      {successMsg ? (
        <View style={styles.successBox}>
          <Text style={styles.successBoxText}>✅ {successMsg}</Text>
        </View>
      ) : null}

      {isDuplicateRefund() && (
        <View style={styles.warningBox}>
          <Text style={styles.warningBoxText}>
            ⚠️ {isDuplicateRefund() === 'TICKET_ALREADY_EXISTS' 
              ? 'Only one refund-related ticket is allowed per booking. You have already raised a request for this booking.' 
              : 'The refund for this booking is already being processed or has been completed. You cannot raise another ticket.'}
          </Text>
        </View>
      )}

      {errors.general ? (
        <View style={[styles.warningBox, { backgroundColor: '#ffebee', borderColor: '#ffcdd2' }]}>
          <Text style={[styles.warningBoxText, { color: '#c62828' }]}>
            ❌ {errors.general}
          </Text>
        </View>
      ) : null}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => {
              setCategory(itemValue);
              setErrors(prev => ({ ...prev, category: null }));
              if (Platform.OS === 'web' && typeof document !== 'undefined' && document.activeElement) {
                document.activeElement.blur();
              }
            }}
            style={styles.picker}
          >
            <Picker.Item label="-- Select Category --" value="" />
            {categories.map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Related Booking (Optional)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={bookingId}
            onValueChange={(itemValue) => {
              setBookingId(itemValue);
              if (Platform.OS === 'web' && typeof document !== 'undefined' && document.activeElement) {
                document.activeElement.blur();
              }
            }}
            style={styles.picker}
            enabled={!fetchingBookings}
          >
            <Picker.Item label="Not related to a booking" value="" />
            {bookings.map((b) => (
              <Picker.Item
                key={b._id}
                label={`${b.bookingType.toUpperCase()} - ${new Date(b.startDate).toLocaleDateString()} (LKR ${b.totalAmount})`}
                value={b._id}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={[styles.input, errors.subject && styles.inputError]}
          placeholder="Short title of your issue"
          value={subject}
          onChangeText={(text) => {
            setSubject(text);
            setErrors(prev => ({ ...prev, subject: null }));
          }}
        />
        {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.description && styles.inputError]}
          placeholder="Detailed explanation of your concern..."
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            setErrors(prev => ({ ...prev, description: null }));
          }}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, (loading || isDuplicateRefund()) && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={loading || isDuplicateRefund()}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Ticket</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#003580', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 25 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: { height: 120 },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: { height: 50 },
  submitButton: {
    backgroundColor: '#003580',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  disabledButton: { backgroundColor: '#a3abb5' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  successBox: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  successBoxText: {
    color: '#155724',
    fontSize: 15,
    fontWeight: 'bold',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  warningBoxText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RaiseTicketScreen;
