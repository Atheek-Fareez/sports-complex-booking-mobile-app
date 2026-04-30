import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import api from '../services/api';

const MyTicketsScreen = ({ navigation }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets/my');
      setTickets(response.data.data);
    } catch (error) {
      console.log('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
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

  const renderTicketItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={() => navigation.navigate('TicketDetails', { ticketId: item._id })}
      >
        <View style={styles.ticketHeader}>
          <Text style={styles.category}>{item.category.toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        {item.adminReply ? (
          <Text style={styles.replyPreview} numberOfLines={1}>Reply: {item.adminReply}</Text>
        ) : (
          <Text style={styles.openText}>Awaiting admin response</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003580" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📄 My Tickets</Text>
        <TouchableOpacity
          style={styles.newTicketBtn}
          onPress={() => navigation.navigate('RaiseTicket')}
        >
          <Text style={styles.newTicketTxt}>+ New Ticket</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tickets}
        keyExtractor={(item) => item._id}
        renderItem={renderTicketItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No tickets found</Text>
            <Text style={styles.emptyText}>If you have any issues, please raise a support ticket.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#003580' },
  newTicketBtn: { backgroundColor: '#003580', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  newTicketTxt: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  listContent: { padding: 12 },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e7e7e7',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: { fontSize: 10, fontWeight: 'bold', color: '#999', letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  subject: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  date: { fontSize: 12, color: '#999', marginBottom: 8 },
  replyPreview: { fontSize: 13, color: '#2e7d32', fontStyle: 'italic', backgroundColor: '#f1f8e9', padding: 8, borderRadius: 4 },
  openText: { fontSize: 13, color: '#666', fontStyle: 'italic' },
  emptyContainer: { alignItems: 'center', marginTop: 100, padding: 20 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center' },
});

export default MyTicketsScreen;
