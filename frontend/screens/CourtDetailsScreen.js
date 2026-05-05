import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import api, { getImageUrl } from '../services/api';

const CourtDetailsScreen = ({ route, navigation }) => {
  const { court, userRole } = route.params;

  const handleDelete = async () => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this court?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/courts/${court._id}`);
            Alert.alert('Success', 'Court deleted!');
            navigation.navigate('CourtList', { refresh: Date.now() });
          } catch (error) {
            Alert.alert('Error', error.response?.data?.message || error.message);
          }
        }
      }
    ]);
  };

  const defaultGuidelines = [
    "Please arrive at least 15 minutes before your booking time",
    "Booking will start and end exactly on time — no extensions",
    "Only turf shoes or indoor shoes are allowed on the court",
    "No boots with metal studs allowed",
    "Keep the court and surroundings clean at all times",
    "Respect other players and facility staff",
    "Management is not liable for personal injuries or accidents",
    "Late cancellations may result in no refund or partial refund",
    "All refund requests are subject to management approval",
  ];

  const displayGuidelines = (court.guidelines && court.guidelines.length > 0) ? court.guidelines : defaultGuidelines;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image
        source={court.imageUrl ? { uri: getImageUrl(court.imageUrl) } : require('../assets/icon.png')}
        style={styles.heroImage}
        resizeMode="cover"
      />

      <View style={[styles.statusRibbon, { backgroundColor: court.availabilityStatus === 'available' ? '#00d084' : '#ff4444' }]}>
        <Text style={styles.statusRibbonText}>
          {court.availabilityStatus === 'available' ? '✓ Available Now' : '✗ Currently Unavailable'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{court.courtName}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}><Text style={styles.badgeText}>⚽ Futsal / Indoor</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>🕘 9AM – 12AM</Text></View>
        </View>

        {court.description ? <Text style={styles.description}>{court.description}</Text> : null}

        <View style={styles.priceCard}>
          <View style={styles.priceItem}>
            <Text style={styles.priceSub}>☀️ Day Rate (9AM–5PM)</Text>
            <Text style={styles.priceMain}>LKR {court.dayPrice}<Text style={styles.perUnit}>/hr</Text></Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceItem}>
            <Text style={styles.priceSub}>🌙 Night Rate (5PM+)</Text>
            <Text style={styles.priceMain}>LKR {court.nightPrice}<Text style={styles.perUnit}>/hr</Text></Text>
          </View>
        </View>

        <View style={styles.guidelinesContainer}>
          <Text style={styles.guidelinesTitle}>📌 Court Rules & Guidelines</Text>
          {displayGuidelines.map((rule, index) => (
            <View key={index} style={styles.guidelineRow}>
              <Text style={styles.guidelineBullet}>•</Text>
              <Text style={styles.guidelineText}>{rule}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => navigation.navigate('Booking', { facilityType: 'court', facilityData: court })}
      >
        <Text style={styles.bookButtonText}>Book This Court</Text>
      </TouchableOpacity>

      {userRole === 'admin' && (
        <View style={styles.adminActions}>
          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('CourtForm', { court })}>
            <Text style={styles.editButtonText}>✏️  Edit Court</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>🗑️  Delete Court</Text>
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
  priceCard: { flexDirection: 'row', backgroundColor: '#f0f4ff', borderRadius: 14, padding: 16, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#003580' },
  priceItem: { flex: 1 },
  priceDivider: { width: 1, backgroundColor: '#d0d8f0', marginHorizontal: 12 },
  priceSub: { fontSize: 11, color: '#888', marginBottom: 4 },
  priceMain: { fontSize: 22, fontWeight: '800', color: '#003580' },
  perUnit: { fontSize: 12, fontWeight: '400', color: '#888' },
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

export default CourtDetailsScreen;
