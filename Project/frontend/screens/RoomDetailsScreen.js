import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import api, { getImageUrl } from '../services/api';

const RoomDetailsScreen = ({ route, navigation }) => {
  const { room, userRole } = route.params;

  const handleDelete = async () => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this room?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/rooms/${room._id}`);
            Alert.alert('Success', 'Room deleted!');
            navigation.navigate('RoomList', { refresh: Date.now() });
          } catch (error) {
            Alert.alert('Error', error.response?.data?.message || error.message);
          }
        }
      }
    ]);
  };

  const defaultGuidelines = [
    "Guests must provide valid identification during check-in",
    "The number of guests must not exceed the room capacity",
    "Only registered guests are allowed to stay in the room",
    "Early check-in or late check-out is subject to availability",
    "Booking is valid only for the selected dates and duration",
    "Guests are responsible for their personal belongings",
    "Maintain a peaceful environment at all times",
    "Late cancellations may result in no refund or partial refund",
    "All refund requests are subject to management approval",
  ];

  const displayGuidelines = (room.guidelines && room.guidelines.length > 0) ? room.guidelines : defaultGuidelines;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Image */}
      <Image
        source={room.imageUrl ? { uri: getImageUrl(room.imageUrl) } : require('../assets/icon.png')}
        style={styles.heroImage}
        resizeMode="cover"
      />

      {/* Status ribbon */}
      <View style={[styles.statusRibbon, { backgroundColor: room.availabilityStatus === 'available' ? '#00d084' : '#ff4444' }]}>
        <Text style={styles.statusRibbonText}>
          {room.availabilityStatus === 'available' ? '✓ Available Now' : '✗ Currently Unavailable'}
        </Text>
      </View>

      {/* Main Card */}
      <View style={styles.card}>
        <Text style={styles.title}>{room.roomName}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}><Text style={styles.badgeText}>Room #{room.roomNumber}</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>{room.roomType?.charAt(0).toUpperCase() + room.roomType?.slice(1)}</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>👥 {room.capacity} guests</Text></View>
        </View>

        {room.description ? (
          <Text style={styles.description}>{room.description}</Text>
        ) : null}

        {/* Price Card */}
        <View style={styles.priceCard}>
          <View>
            <Text style={styles.priceSub}>Price per night</Text>
            <Text style={styles.priceMain}>LKR {room.price}</Text>
          </View>
          <View style={styles.taxNote}>
            <Text style={styles.taxText}>Taxes & fees included</Text>
          </View>
        </View>

        {/* Guidelines */}
        <View style={styles.guidelinesContainer}>
          <Text style={styles.guidelinesTitle}>🏨 Room Rules & Guidelines</Text>
          {displayGuidelines.map((rule, index) => (
            <View key={index} style={styles.guidelineRow}>
              <Text style={styles.guidelineBullet}>•</Text>
              <Text style={styles.guidelineText}>{rule}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Book Button */}
      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => navigation.navigate('Booking', { facilityType: 'room', facilityData: room })}
      >
        <Text style={styles.bookButtonText}>Reserve • LKR {room.price} / night</Text>
      </TouchableOpacity>

      {/* Admin Actions */}
      {userRole === 'admin' && (
        <View style={styles.adminActions}>
          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('RoomForm', { room })}>
            <Text style={styles.editButtonText}>✏️  Edit Room</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>🗑️  Delete Room</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  heroImage: { width: '100%', height: 280, backgroundColor: '#c8d6e5' },
  statusRibbon: { paddingVertical: 8, alignItems: 'center' },
  statusRibbonText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 20, padding: 20, elevation: 4, shadowColor: '#003580', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a2340', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  badge: { backgroundColor: '#e8f0fe', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: '#003580', fontSize: 12, fontWeight: '600' },
  description: { fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 16 },
  priceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f4ff', borderRadius: 14, padding: 16, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#003580' },
  priceSub: { fontSize: 12, color: '#888', marginBottom: 4 },
  priceMain: { fontSize: 28, fontWeight: '800', color: '#003580' },
  taxNote: { alignItems: 'flex-end' },
  taxText: { fontSize: 11, color: '#888', fontStyle: 'italic' },
  guidelinesContainer: { backgroundColor: '#fafbff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5eaf5' },
  guidelinesTitle: { fontSize: 15, fontWeight: '700', color: '#003580', marginBottom: 12 },
  guidelineRow: { flexDirection: 'row', marginBottom: 7 },
  guidelineBullet: { color: '#003580', fontWeight: '700', marginRight: 8, marginTop: 1 },
  guidelineText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 20 },
  bookButton: { marginHorizontal: 16, backgroundColor: '#003580', borderRadius: 14, padding: 18, alignItems: 'center', elevation: 4 },
  bookButtonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  adminActions: { margin: 16, gap: 10 },
  editButton: { backgroundColor: '#fff8e1', borderWidth: 1, borderColor: '#febb02', borderRadius: 12, padding: 15, alignItems: 'center' },
  editButtonText: { color: '#b8860b', fontSize: 16, fontWeight: '700' },
  deleteButton: { backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#dc3545', borderRadius: 12, padding: 15, alignItems: 'center' },
  deleteButtonText: { color: '#dc3545', fontSize: 16, fontWeight: '700' },
});

export default RoomDetailsScreen;
