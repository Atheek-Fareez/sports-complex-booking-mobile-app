import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import api from '../services/api';

const AdminTicketListScreen = ({ navigation }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  const statuses = ['All', 'Open', 'In Progress', 'Replied', 'Resolved', 'Closed'];

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/admin/tickets');
      setTickets(response.data.data);
    } catch (error) {
      console.log('Admin fetch tickets error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const filteredTickets = filter === 'All' 
    ? tickets 
    : tickets.filter(t => t.status === filter);

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
        onPress={() => navigation.navigate('AdminTicketDetails', { ticketId: item._id })}
      >
        <View style={styles.ticketHeader}>
          <Text style={styles.userTxt}>{item.userId.fullName} • {item.userId.email}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.category}>{item.category.toUpperCase()}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        {item.adminReply && (
          <View style={styles.replyBubble}>
            <Text style={styles.replyPreview} numberOfLines={1}>Reply: {item.adminReply}</Text>
          </View>
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
        <Text style={styles.title}>🎫 Support Requests</Text>
        <Text style={styles.countTxt}>{filteredTickets.length} tickets</Text>
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {statuses.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.filterBtn, filter === s && styles.activeFilter]}
              onPress={() => setFilter(s)}
            >
              <Text style={[styles.filterBtnTxt, filter === s && styles.activeFilterTxt]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item._id}
        renderItem={renderTicketItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No tickets found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#003580' },
  countTxt: { fontSize: 12, color: '#999', marginTop: 4 },
  filterBar: { backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterBtn: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f2f2f2', marginHorizontal: 5 },
  activeFilter: { backgroundColor: '#003580' },
  filterBtnTxt: { fontSize: 12, color: '#666' },
  activeFilterTxt: { color: '#fff', fontWeight: 'bold' },
  listContent: { padding: 12 },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e7e7e7',
  },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  userTxt: { fontSize: 11, color: '#666', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  subject: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  category: { fontSize: 10, fontWeight: 'bold', color: '#003580' },
  date: { fontSize: 10, color: '#999' },
  replyBubble: { backgroundColor: '#f1f8e9', padding: 8, borderRadius: 4 },
  replyPreview: { fontSize: 12, color: '#2e7d32', fontStyle: 'italic' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 16, color: '#999' },
});

export default AdminTicketListScreen;
