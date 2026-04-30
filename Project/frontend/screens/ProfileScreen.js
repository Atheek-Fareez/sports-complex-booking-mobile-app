import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import api, { setAuthToken } from '../services/api';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [userPendingCount, setUserPendingCount] = useState(0);
  const [adminTicketCount, setAdminTicketCount] = useState(0);
  const [userTicketCount, setUserTicketCount] = useState(0);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      const userData = response.data;
      setUser(userData);
      if (userData.role === 'admin') fetchPendingCount();
      fetchUserPendingCount();
    } catch (error) {
      Alert.alert('Session Expired', 'Please login again.');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const response = await api.get('/admin/pending-verifications/count');
      if (response.data.success) setPendingCount(response.data.count);
      const ticketRes = await api.get('/admin/tickets/pending-count');
      if (ticketRes.data.success) setAdminTicketCount(ticketRes.data.count);
    } catch (error) {
      console.log('Failed to fetch pending count:', error);
    }
  };

  const fetchUserPendingCount = async () => {
    try {
      const response = await api.get('/user/my-pending-bookings/count');
      if (response.data.success) setUserPendingCount(response.data.count);
      const ticketRes = await api.get('/tickets/notifications-count');
      if (ticketRes.data.success) setUserTicketCount(ticketRes.data.count);
    } catch (error) {
      console.log('Failed to fetch user pending count:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserPendingCount();
      if (user?.role === 'admin') fetchPendingCount();
      else if (!user) fetchProfile();
    });
    return unsubscribe;
  }, [navigation, user?.role]);

  const handleLogout = () => {
    setAuthToken(null);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003580" />
      </View>
    );
  }

  const isAdmin = user?.role === 'admin';
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{user?.fullName}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {isAdmin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>⚙️ ADMINISTRATOR</Text>
          </View>
        )}
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{userPendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{userTicketCount}</Text>
            <Text style={styles.statLabel}>Tickets</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{user?.phone ? '✓' : '–'}</Text>
            <Text style={styles.statLabel}>Phone</Text>
          </View>
        </View>
      </View>

      {/* Info card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📱 Phone</Text>
          <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>👤 Account Type</Text>
          <Text style={[styles.infoValue, isAdmin && { color: '#003580', fontWeight: '800' }]}>
            {isAdmin ? 'Administrator' : 'Member'}
          </Text>
        </View>
      </View>

      {/* Admin Dashboard */}
      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Dashboard</Text>
          
          <TouchableOpacity style={styles.adminCard} onPress={() => navigation.navigate('AdminDashboard')}>
            <View style={styles.adminCardLeft}>
              <Text style={styles.adminCardIcon}>📊</Text>
              <View>
                <Text style={styles.adminCardTitle}>Business Analytics</Text>
                <Text style={styles.adminCardSub}>Monitor revenue, bookings & growth</Text>
              </View>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.adminCard, { marginTop: 10 }]} onPress={() => navigation.navigate('AdminBookingList')}>
            <View style={styles.adminCardLeft}>
              <Text style={styles.adminCardIcon}>📋</Text>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.adminCardTitle}>Verify Bookings</Text>
                  {pendingCount > 0 && <View style={styles.notifBadge}><Text style={styles.notifText}>{pendingCount}</Text></View>}
                </View>
                <Text style={styles.adminCardSub}>Paid bookings awaiting approval</Text>
              </View>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.adminCard, { marginTop: 10 }]} onPress={() => navigation.navigate('AdminTicketList')}>
            <View style={styles.adminCardLeft}>
              <Text style={styles.adminCardIcon}>🎫</Text>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.adminCardTitle}>Support Tickets</Text>
                  {adminTicketCount > 0 && <View style={styles.notifBadge}><Text style={styles.notifText}>{adminTicketCount}</Text></View>}
                </View>
                <Text style={styles.adminCardSub}>Manage user issues & refunds</Text>
              </View>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* My Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Account</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyBookings')}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>🗓</Text>
              <Text style={styles.menuText}>My Bookings</Text>
              {userPendingCount > 0 && <View style={styles.notifBadge}><Text style={styles.notifText}>{userPendingCount}</Text></View>}
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('RoomList')}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>🏨</Text>
              <Text style={styles.menuText}>Browse Rooms</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('CourtList')}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>⚽</Text>
              <Text style={styles.menuText}>Browse Courts</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PoolList')}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>🏊</Text>
              <Text style={styles.menuText}>Browse Pools</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support & Help</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('RaiseTicket')}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>🎫</Text>
              <Text style={styles.menuText}>Raise a Ticket</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyTickets')}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>📄</Text>
              <Text style={styles.menuText}>My Tickets</Text>
              {userTicketCount > 0 && <View style={styles.notifBadge}><Text style={styles.notifText}>{userTicketCount}</Text></View>}
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
  heroHeader: { backgroundColor: '#003580', paddingTop: 50, paddingBottom: 30, alignItems: 'center', paddingHorizontal: 20 },
  avatarCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#febb02', justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontSize: 34, fontWeight: '900', color: '#1a2340' },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  adminBadge: { backgroundColor: '#febb02', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 16 },
  adminBadgeText: { fontSize: 12, fontWeight: '800', color: '#1a2340' },
  statRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, gap: 0, marginTop: 8, width: '100%', justifyContent: 'space-evenly' },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  infoCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#003580', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f4f8' },
  infoLabel: { fontSize: 14, color: '#6b7c93', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#1a2340', fontWeight: '600' },
  section: { marginTop: 20, marginHorizontal: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#6b7c93', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1.2 },
  adminCard: { backgroundColor: '#003580', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 3 },
  adminCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  adminCardIcon: { fontSize: 28 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  adminCardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  adminCardSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 3 },
  arrow: { color: '#fff', fontSize: 26, opacity: 0.7 },
  notifBadge: { backgroundColor: '#dc3545', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  notifText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  menuGroup: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#003580', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  menuText: { fontSize: 15, color: '#1a2340', fontWeight: '600' },
  menuArrow: { color: '#c0ccd9', fontSize: 22, fontWeight: '300' },
  menuDivider: { height: 1, backgroundColor: '#f0f4f8', marginLeft: 56 },
  logoutButton: { marginHorizontal: 16, marginTop: 24, padding: 16, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#dc3545', alignItems: 'center', elevation: 1 },
  logoutText: { color: '#dc3545', fontWeight: '800', fontSize: 15 },
});

export default ProfileScreen;
