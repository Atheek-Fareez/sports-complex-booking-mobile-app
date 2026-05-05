import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import api, { getImageUrl } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.72, 300);

// ─── Small reusable facility card ───────────────────────────────────────────
const FacilityCard = ({ item, imageField, nameField, priceField, priceLabel, onPress }) => {
  const imgUrl = item[imageField];
  const name = item[nameField];
  const price = item[priceField];

  return (
    <TouchableOpacity style={styles.facilityCard} onPress={onPress} activeOpacity={0.9}>
      <Image
        source={imgUrl ? { uri: getImageUrl(imgUrl) } : require('../assets/icon.png')}
        style={styles.facilityCardImg}
        resizeMode="cover"
      />
      <View style={styles.facilityCardOverlay} />
      <View style={styles.facilityCardBody}>
        <Text style={styles.facilityCardName} numberOfLines={1}>{name}</Text>
        <View style={styles.facilityCardPriceRow}>
          <Text style={styles.facilityCardPriceLabel}>{priceLabel}</Text>
          <Text style={styles.facilityCardPrice}>LKR {price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Section header ──────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, onSeeAll }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{icon} {title}</Text>
    <TouchableOpacity onPress={onSeeAll}>
      <Text style={styles.seeAll}>See all →</Text>
    </TouchableOpacity>
  </View>
);

// ─── Horizontal scrollable row ───────────────────────────────────────────────
const HScrollRow = ({ data, renderItem, loading }) => {
  if (loading) return (
    <View style={styles.rowLoader}>
      <ActivityIndicator color="#003580" />
    </View>
  );
  if (!data || data.length === 0) return (
    <View style={styles.emptyRow}>
      <Text style={styles.emptyRowText}>Nothing available right now</Text>
    </View>
  );
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.hScroll}
    >
      {data.map((item, idx) => renderItem(item, idx))}
    </ScrollView>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [courts, setCourts] = useState([]);
  const [pools, setPools] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [profileRes, roomsRes, courtsRes, poolsRes] = await Promise.all([
        api.get('/auth/profile'),
        api.get('/rooms'),
        api.get('/courts'),
        api.get('/pools'),
      ]);
      setUser(profileRes.data);
      setRooms(roomsRes.data.slice(0, 6));
      setCourts(courtsRes.data.slice(0, 6));
      setPools(poolsRes.data.slice(0, 6));

      // badge counts
      try {
        const pb = await api.get('/user/my-pending-bookings/count');
        if (pb.data.success) setPendingCount(pb.data.count);
      } catch (_) {}
      try {
        const tb = await api.get('/tickets/notifications-count');
        if (tb.data.success) setTicketCount(tb.data.count);
      } catch (_) {}
    } catch (err) {
      console.error('HomeScreen load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashBrand}>White House Sports Complex</Text>
        <ActivityIndicator color="#febb02" size="large" style={{ marginTop: 20 }} />
      </View>
    );
  }

  const isAdmin = user?.role === 'admin';
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#003580']} />}
    >
      {/* ── HERO HEADER ─────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreet}>Good {getGreeting()} 👋</Text>
            <Text style={styles.heroName}>{user?.fullName || 'Guest'}</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.avatarText}>{initials}</Text>
            {isAdmin && <View style={styles.adminDot} />}
          </TouchableOpacity>
        </View>

        <Text style={styles.heroTagline}>Book facilities. Play your game.</Text>

        {/* Quick nav pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
          <TouchableOpacity style={styles.pill} onPress={() => navigation.navigate('RoomList')}>
            <Text style={styles.pillIcon}>🏨</Text>
            <Text style={styles.pillText}>Rooms</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill} onPress={() => navigation.navigate('CourtList')}>
            <Text style={styles.pillIcon}>⚽</Text>
            <Text style={styles.pillText}>Courts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill} onPress={() => navigation.navigate('PoolList')}>
            <Text style={styles.pillIcon}>🏊</Text>
            <Text style={styles.pillText}>Pools</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill} onPress={() => navigation.navigate('MyBookings')}>
            <Text style={styles.pillIcon}>🗓</Text>
            <Text style={styles.pillText}>Bookings</Text>
            {pendingCount > 0 && <View style={styles.pillBadge}><Text style={styles.pillBadgeText}>{pendingCount}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill} onPress={() => navigation.navigate('MyTickets')}>
            <Text style={styles.pillIcon}>🎫</Text>
            <Text style={styles.pillText}>Tickets</Text>
            {ticketCount > 0 && <View style={styles.pillBadge}><Text style={styles.pillBadgeText}>{ticketCount}</Text></View>}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── QUICK STATS (admin only) ─────────────────────────────────── */}
      {isAdmin && (
        <View style={styles.adminStrip}>
          <Text style={styles.adminStripTitle}>⚙️ Admin Panel</Text>
          <View style={styles.adminStripBtns}>
            <TouchableOpacity style={styles.adminStripBtn} onPress={() => navigation.navigate('AdminDashboard')}>
              <Text style={styles.adminStripBtnText}>📊 Business Dashboard</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.adminStripBtns, { marginTop: 8 }]}>
            <TouchableOpacity style={styles.adminStripBtn} onPress={() => navigation.navigate('AdminBookingList')}>
              <Text style={styles.adminStripBtnText}>Verify Bookings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.adminStripBtn, { backgroundColor: '#e8f0fe' }]} onPress={() => navigation.navigate('AdminTicketList')}>
              <Text style={[styles.adminStripBtnText, { color: '#003580' }]}>Support Tickets</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── PENDING ACTION BANNER ───────────────────────────────────── */}
      {pendingCount > 0 && (
        <TouchableOpacity style={styles.alertBanner} onPress={() => navigation.navigate('MyBookings')}>
          <Text style={styles.alertBannerText}>⚠️ You have {pendingCount} booking{pendingCount > 1 ? 's' : ''} awaiting payment confirmation</Text>
          <Text style={styles.alertBannerAction}>View →</Text>
        </TouchableOpacity>
      )}

      {/* ── ROOMS ───────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader icon="🏨" title="Hotel Rooms" onSeeAll={() => navigation.navigate('RoomList')} />
        <HScrollRow
          data={rooms}
          loading={false}
          renderItem={(item) => (
            <FacilityCard
              key={item._id}
              item={item}
              imageField="imageUrl"
              nameField="roomName"
              priceField="price"
              priceLabel="per night"
              onPress={() => navigation.navigate('RoomDetails', { room: item, userRole: user?.role })}
            />
          )}
        />
      </View>

      {/* ── COURTS ───────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader icon="⚽" title="Futsal Courts" onSeeAll={() => navigation.navigate('CourtList')} />
        <HScrollRow
          data={courts}
          loading={false}
          renderItem={(item) => (
            <FacilityCard
              key={item._id}
              item={item}
              imageField="imageUrl"
              nameField="courtName"
              priceField="dayPrice"
              priceLabel="per hour (day)"
              onPress={() => navigation.navigate('CourtDetails', { court: item, userRole: user?.role })}
            />
          )}
        />
      </View>

      {/* ── POOLS ────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader icon="🏊" title="Swimming Pools" onSeeAll={() => navigation.navigate('PoolList')} />
        <HScrollRow
          data={pools}
          loading={false}
          renderItem={(item) => (
            <FacilityCard
              key={item._id}
              item={item}
              imageField="imageUrl"
              nameField="poolName"
              priceField="pricePerSession"
              priceLabel="per session"
              onPress={() => navigation.navigate('PoolDetails', { pool: item, userRole: user?.role })}
            />
          )}
        />
      </View>

      {/* ── QUICK ACTIONS ROW ────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('MyBookings')}>
            <Text style={styles.quickIcon}>🗓</Text>
            <Text style={styles.quickLabel}>My Bookings</Text>
            {pendingCount > 0 && <View style={styles.quickBadge}><Text style={styles.quickBadgeText}>{pendingCount}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('RaiseTicket')}>
            <Text style={styles.quickIcon}>🎫</Text>
            <Text style={styles.quickLabel}>Raise Ticket</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('MyTickets')}>
            <Text style={styles.quickIcon}>📄</Text>
            <Text style={styles.quickLabel}>My Tickets</Text>
            {ticketCount > 0 && <View style={styles.quickBadge}><Text style={styles.quickBadgeText}>{ticketCount}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.quickIcon}>👤</Text>
            <Text style={styles.quickLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>White House Sports Complex © 2026</Text>
        <Text style={styles.footerSub}>Premium Facilities • Easy Booking</Text>
      </View>
    </ScrollView>
  );
};

// ─── Helper ─────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },

  // Splash
  splash: { flex: 1, backgroundColor: '#003580', justifyContent: 'center', alignItems: 'center' },
  splashBrand: { fontSize: 28, fontWeight: '900', color: '#fff' },

  // Hero
  hero: { backgroundColor: '#003580', paddingTop: 54, paddingBottom: 28, paddingHorizontal: 20 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heroGreet: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  heroName: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  avatarBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#febb02', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900', color: '#1a2340' },
  adminDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#00d084', borderWidth: 2, borderColor: '#003580' },
  heroTagline: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 20, fontStyle: 'italic' },

  // Pills
  pillRow: { flexDirection: 'row' },
  pill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 24, paddingHorizontal: 14, paddingVertical: 9, marginRight: 10,
  },
  pillIcon: { fontSize: 16, marginRight: 6 },
  pillText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  pillBadge: { backgroundColor: '#dc3545', borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, marginLeft: 6 },
  pillBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Admin strip
  adminStrip: { backgroundColor: '#e8f0fe', margin: 16, borderRadius: 14, padding: 14, borderLeftWidth: 4, borderLeftColor: '#003580' },
  adminStripTitle: { fontSize: 13, fontWeight: '700', color: '#003580', marginBottom: 10 },
  adminStripBtns: { flexDirection: 'row', gap: 10 },
  adminStripBtn: { backgroundColor: '#003580', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, flex: 1, alignItems: 'center' },
  adminStripBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Alert banner
  alertBanner: { marginHorizontal: 16, marginBottom: 4, backgroundColor: '#fff8e1', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#febb02' },
  alertBannerText: { flex: 1, fontSize: 13, color: '#7c5600', fontWeight: '600' },
  alertBannerAction: { color: '#003580', fontWeight: '800', fontSize: 13, marginLeft: 12 },

  // Section
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1a2340' },
  seeAll: { fontSize: 13, color: '#003580', fontWeight: '700' },

  // H-scroll
  hScroll: { paddingRight: 16 },
  rowLoader: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyRow: { height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14 },
  emptyRowText: { color: '#aaa', fontSize: 13 },

  // Facility card
  facilityCard: {
    width: CARD_WIDTH, marginRight: 14, borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 4, shadowColor: '#003580', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12,
  },
  facilityCardImg: { width: '100%', height: 160, backgroundColor: '#c8d6e5' },
  facilityCardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: 'rgba(0,0,0,0)' },
  facilityCardBody: { padding: 12 },
  facilityCardName: { fontSize: 16, fontWeight: '800', color: '#1a2340', marginBottom: 6 },
  facilityCardPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  facilityCardPriceLabel: { fontSize: 11, color: '#888' },
  facilityCardPrice: { fontSize: 16, fontWeight: '800', color: '#003580' },

  // Quick grid
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  quickCard: {
    flex: 1, minWidth: (SCREEN_WIDTH - 56) / 2 - 6,
    backgroundColor: '#fff', borderRadius: 14, padding: 18,
    alignItems: 'center', elevation: 2,
    shadowColor: '#003580', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6,
  },
  quickIcon: { fontSize: 30, marginBottom: 8 },
  quickLabel: { fontSize: 13, fontWeight: '700', color: '#1a2340' },
  quickBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#dc3545', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  quickBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Footer
  footer: { padding: 24, alignItems: 'center', marginTop: 12 },
  footerText: { fontSize: 13, color: '#aaa', fontWeight: '600' },
  footerSub: { fontSize: 11, color: '#ccc', marginTop: 4 },
});

export default HomeScreen;
