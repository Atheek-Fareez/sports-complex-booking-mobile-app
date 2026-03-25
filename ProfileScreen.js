import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import api, { setAuthToken } from '../services/api';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch profile. Please login again.');
      navigation.navigate('Login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    navigation.navigate('Login');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Profile</Text>
      {user && (
        <View style={styles.profileCard}>
          <Text style={styles.label}>Name: <Text style={styles.value}>{user.fullName}</Text></Text>
          <Text style={styles.label}>Email: <Text style={styles.value}>{user.email}</Text></Text>
          <Text style={styles.label}>Phone: <Text style={styles.value}>{user.phone}</Text></Text>
          <Text style={styles.label}>Role: <Text style={styles.value}>{user.role}</Text></Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('RoomList')}
          >
            <Text style={styles.actionButtonText}>Browse Rooms</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { marginTop: 10 }]}
            onPress={() => navigation.navigate('CourtList')}
          >
            <Text style={styles.actionButtonText}>Browse Courts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { marginTop: 10 }]}
            onPress={() => navigation.navigate('PoolList')}
          >
            <Text style={styles.actionButtonText}>Browse Pools</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  profileCard: { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 3, marginBottom: 30 },
  label: { fontSize: 18, fontWeight: '600', color: '#555', marginBottom: 10 },
  value: { fontWeight: '400', color: '#000' },
  actionButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 5, width: '100%', alignItems: 'center', marginTop: 20 },
  actionButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  logoutButton: { backgroundColor: '#dc3545', padding: 15, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default ProfileScreen;
