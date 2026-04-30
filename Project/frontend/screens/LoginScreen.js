import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import api, { setAuthToken, clearAuthToken } from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMsg('');
    clearAuthToken();

    if (!email || !password) {
      setErrorMsg('Please enter your email and password to continue.');
      return;
    }
    if (!email.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token } = response.data;
      setAuthToken(token);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <Text style={styles.brandName}>White House Sports Complex</Text>
        <Text style={styles.brandTagline}>Premium Facilities • Easy Booking</Text>
      </View>

      {/* Glass card */}
      <View style={styles.glassCard}>
        <Text style={styles.cardTitle}>Sign in</Text>
        <Text style={styles.cardSubtitle}>Access your bookings and reservations</Text>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        <Text style={styles.fieldLabel}>Email address</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          placeholderTextColor="#adb5bd"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.fieldLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Your password"
          placeholderTextColor="#adb5bd"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.loginButtonText}>Sign in →</Text>
          }
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>New to White House?</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerButtonText}>Create an account</Text>
        </TouchableOpacity>
      </View>

      {/* Trust badges */}
      <View style={styles.trustRow}>
        <View style={styles.trustBadge}><Text style={styles.trustText}>🔒 Secure Login</Text></View>
        <View style={styles.trustBadge}><Text style={styles.trustText}>✓ Free Registration</Text></View>
        <View style={styles.trustBadge}><Text style={styles.trustText}>🎯 Easy Booking</Text></View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#003580' },
  headerBanner: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, alignItems: 'center' },
  brandName: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 0.5, textAlign: 'center' },
  brandTagline: { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 8, textAlign: 'center' },
  glassCard: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  cardTitle: { fontSize: 26, fontWeight: '800', color: '#1a2340', marginBottom: 6 },
  cardSubtitle: { fontSize: 14, color: '#6b7c93', marginBottom: 24 },
  errorBox: { backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#ffcdd2', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: '#c62828', fontSize: 13, fontWeight: '600' },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#1a2340', marginBottom: 6, marginTop: 4 },
  input: {
    height: 52,
    borderColor: '#d0d9e8',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1a2340',
    backgroundColor: '#f8faff',
    marginBottom: 16,
  },
  loginButton: { backgroundColor: '#003580', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e0e7f0' },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: '#888' },
  registerButton: { backgroundColor: '#f0f4ff', borderWidth: 2, borderColor: '#003580', borderRadius: 12, padding: 14, alignItems: 'center' },
  registerButtonText: { color: '#003580', fontSize: 15, fontWeight: '700' },
  trustRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8, padding: 20, paddingTop: 24 },
  trustBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  trustText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
});

export default LoginScreen;
