import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import api, { getImageUrl } from '../services/api';

const RoomListScreen = ({ navigation, route }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchRoomsAndRole = async () => {
      try {
        const profileRes = await api.get('/auth/profile');
        setUserRole(profileRes.data.role);

        const roomRes = await api.get('/rooms');
        setRooms(roomRes.data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        Alert.alert('Error', 'Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };
    fetchRoomsAndRole();
  }, [route.params?.refresh]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('RoomDetails', { room: item, userRole })}
    >
      <Image 
        source={item.imageUrl ? { uri: getImageUrl(item.imageUrl) } : require('../assets/icon.png')} 
        style={styles.cardCoverImage} 
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.roomName}>{item.roomName}</Text>
        <Text style={styles.price}>LKR {item.price} / night</Text>
        <Text style={styles.status(item.availabilityStatus)}>{item.availabilityStatus}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003580" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {rooms.length === 0 ? (
        <View style={styles.center}><Text>No rooms found.</Text></View>
      ) : (
        <FlatList 
          data={rooms}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 10, paddingBottom: 80 }}
        />
      )}
      {userRole === 'admin' && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('RoomForm')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { 
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    marginVertical: 8, 
    borderRadius: 16, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  cardCoverImage: { width: '100%', height: 200 },
  cardContent: { padding: 16 },
  roomName: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  price: { fontSize: 18, color: '#003580', fontWeight: '600' },
  status: (status) => ({
    color: status === 'available' ? '#008009' : '#d10000',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 8,
    fontSize: 12
  }),
  fab: { 
    position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, 
    borderRadius: 30, backgroundColor: '#003580', justifyContent: 'center', 
    alignItems: 'center', elevation: 8 
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: 'bold' }
});

export default RoomListScreen;
