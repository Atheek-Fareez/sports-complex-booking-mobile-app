import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import api, { getImageUrl } from '../services/api';

const PoolListScreen = ({ navigation, route }) => {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchPoolsAndRole = async () => {
      try {
        const profileRes = await api.get('/auth/profile');
        setUserRole(profileRes.data.role);
        const poolRes = await api.get('/pools');
        setPools(poolRes.data);
      } catch (error) {
        console.error('Error fetching pools:', error);
        Alert.alert('Error', 'Failed to load pools');
      } finally {
        setLoading(false);
      }
    };
    fetchPoolsAndRole();
  }, [route.params?.refresh]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PoolDetails', { pool: item, userRole })}
      activeOpacity={0.92}
    >
      <Image
        source={item.imageUrl ? { uri: getImageUrl(item.imageUrl) } : require('../assets/icon.png')}
        style={styles.cardCoverImage}
        resizeMode="cover"
      />
      <View style={styles.cardOverlay} />
      <View style={styles.statusBadge}>
        <View style={[styles.statusDot, { backgroundColor: item.availabilityStatus === 'available' ? '#00d084' : '#ff4444' }]} />
        <Text style={styles.statusText}>{item.availabilityStatus === 'available' ? 'Available' : 'Booked'}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.poolName}>{item.poolName}</Text>
        <Text style={styles.poolSub}>🏊 Swimming Pool • {item.capacity} person capacity</Text>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>Per session</Text>
            <Text style={styles.price}>LKR {item.pricePerSession}<Text style={styles.perUnit}> /session</Text></Text>
          </View>
          <View style={styles.bookBtn}>
            <Text style={styles.bookBtnText}>See details</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003580" />
        <Text style={styles.loadingText}>Loading pools...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏊 Swimming Pools</Text>
        <Text style={styles.headerSub}>{pools.length} pool{pools.length !== 1 ? 's' : ''} available</Text>
      </View>
      {pools.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏊</Text>
          <Text style={styles.emptyTitle}>No pools available</Text>
          <Text style={styles.emptyText}>Check back later for available pools.</Text>
        </View>
      ) : (
        <FlatList
          data={pools}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}
      {userRole === 'admin' && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('PoolForm')}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
  loadingText: { marginTop: 12, color: '#003580', fontSize: 14, fontWeight: '500' },
  header: { backgroundColor: '#003580', paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', elevation: 4, shadowColor: '#003580', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
  cardCoverImage: { width: '100%', height: 200, backgroundColor: '#c8d6e5' },
  cardOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 200, backgroundColor: 'rgba(0,53,128,0.08)' },
  statusBadge: { position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#333' },
  cardContent: { padding: 16 },
  poolName: { fontSize: 20, fontWeight: '700', color: '#1a2340', marginBottom: 4 },
  poolSub: { fontSize: 13, color: '#6b7c93', marginBottom: 14 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
  price: { fontSize: 22, fontWeight: '800', color: '#003580' },
  perUnit: { fontSize: 13, fontWeight: '400', color: '#888' },
  bookBtn: { backgroundColor: '#febb02', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  bookBtnText: { color: '#1a2340', fontWeight: '700', fontSize: 14 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a2340', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#003580', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: -2 }
});

export default PoolListScreen;
