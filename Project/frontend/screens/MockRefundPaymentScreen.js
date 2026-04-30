import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import api from '../services/api';

const MockRefundPaymentScreen = ({ route, navigation }) => {
  const { ticketId, refundAmount, bookingId, note } = route.params;
  const [loading, setLoading] = useState(false);

  const confirmRefund = async () => {
    setLoading(true);
    try {
      const payload = { note };
      const response = await api.post(`/admin/tickets/${ticketId}/process-refund`, payload);
      
      Alert.alert('Success', response.data.message || 'Refund successfully processed!');
      
      // Navigate back to AdminTicketList
      navigation.navigate('AdminTicketList');
    } catch (error) {
      console.error('Mock Refund Error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to process refund';
      Alert.alert('Refund Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const cancelRefund = () => {
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.centerContent}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🏦</Text>
          <Text style={styles.title}>Mock Refund Gateway</Text>
          <Text style={styles.subtitle}>Simulating transaction to user's original payment method</Text>
        </View>
        
        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Booking ID</Text>
            <Text style={styles.value}>{bookingId}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.label}>Refund Amount</Text>
            <Text style={[styles.value, styles.refundAmt]}>Rs. {refundAmount}</Text>
          </View>
        </View>

        <View style={styles.policyBox}>
          <Text style={styles.policyText}>
            ⚠️ ACTION REQUIRED: By clicking "Confirm Refund", the funds will be transferred to the user's account and the booking will be marked as "Cancelled" permanently.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.confirmBtn, loading && styles.disabledBtn]} 
          onPress={confirmRefund}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Confirm & Process Refund</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.cancelBtn, loading && styles.disabledBtn]} 
          onPress={cancelRefund}
          disabled={loading}
        >
          <Text style={styles.cancelBtnText}>Cancel & Go Back</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.footerNote}>This is a secure mock environment for administrative use only.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  centerContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { 
    backgroundColor: '#fff', 
    padding: 25, 
    borderRadius: 20, 
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12,
  },
  header: { alignItems: 'center', marginBottom: 25 },
  headerEmoji: { fontSize: 40, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18 },
  detailsBox: { 
    backgroundColor: '#f8f9fa', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  label: { fontSize: 14, color: '#6c757d' },
  value: { fontSize: 15, fontWeight: 'bold', color: '#212529' },
  refundAmt: { color: '#dc3545', fontSize: 18 },
  divider: { height: 1, backgroundColor: '#dee2e6', marginVertical: 12 },
  policyBox: { 
    backgroundColor: '#fff4f4', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#ffe5e5'
  },
  policyText: { fontSize: 12, color: '#c53030', textAlign: 'center', lineHeight: 18, fontStyle: 'italic' },
  confirmBtn: { 
    backgroundColor: '#28a745', 
    padding: 16, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: 12,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cancelBtn: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 10, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#dee2e6' 
  },
  disabledBtn: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelBtnText: { color: '#495057', fontSize: 16, fontWeight: 'medium' },
  footerNote: { marginTop: 20, fontSize: 11, color: '#adb5bd', textAlign: 'center' },
});

export default MockRefundPaymentScreen;
