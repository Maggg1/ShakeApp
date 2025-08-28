import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function SettingsPasswordResetScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Animation values to match other screens
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, []);

  // Prefill email from current user when available
  useEffect(() => {
    (async () => {
      try {
        const user = await api.getCurrentUser();
        if (user?.email && !email) setEmail(user.email);
      } catch (_) {}
    })();
  }, []);

  const validateEmail = (v) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(v);

  const handlePasswordReset = async () => {
    const v = email.trim();
    if (!v) return Alert.alert('Error', 'Please enter your email address');
    if (!validateEmail(v)) return Alert.alert('Error', 'Please enter a valid email address');

    setLoading(true);
    try {
      await api.sendPasswordReset(v);
      setEmailSent(true);
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', error?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailSent) return;
    const v = email.trim();
    if (!v) return;
    setLoading(true);
    try {
      await api.sendPasswordReset(v);
      Alert.alert('Success', 'Reset link resent successfully!');
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#97c5cc', '#669198']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
            
            <View style={styles.imageContainer}>
              <Image source={require('../assets/images/resetpass.png')} style={styles.image} resizeMode="contain" />
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>Enter your email address and we'll send you a link to reset your password.</Text>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#667eea" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#999"
                  editable={!loading}
                  accessibilityLabel="Email input"
                />
              </View>

              {emailSent ? (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={56} color="#4CAF50" />
                  <Text style={styles.successText}>Reset link sent!</Text>
                  <Text style={styles.successSubtext}>Check your email inbox</Text>
                  <TouchableOpacity onPress={handleResend} disabled={loading} style={[styles.linkBtn, loading && styles.linkBtnDisabled]}>
                    <Text style={styles.linkText}>Resend</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.button, loading && styles.buttonDisabled]} 
                  onPress={handlePasswordReset}
                  disabled={loading}
                  accessibilityLabel="Send reset password link"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
              )}

              {!emailSent && (
                <View style={styles.helpContainer}>
                  <Text style={styles.helpText}>
                    Didn't receive the email?{' '}
                    <Text 
                      style={[styles.linkText, (!emailSent || !email.trim()) && styles.linkDisabled]} 
                      onPress={handleResend}
                      accessibilityLabel="Resend reset password email"
                    >
                      Resend
                    </Text>
                  </Text>
                </View>
              )}

              <TouchableOpacity 
                style={styles.backTextBtn} 
                onPress={() => navigation.goBack()}
                disabled={loading}
                accessibilityLabel="Back"
              >
                <Ionicons name="arrow-back" size={18} color="#667eea" />
                <Text style={styles.backText}>Back to Settings</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  imageContainer: { alignItems: 'center', marginBottom: 20 },
  image: { width: 150, height: 150 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 25, lineHeight: 22, paddingHorizontal: 10 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 48, fontSize: 16, color: '#333' },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: { backgroundColor: '#a3b1ff' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  successContainer: { alignItems: 'center', marginBottom: 10, paddingVertical: 6 },
  successText: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50', marginTop: 8 },
  successSubtext: { fontSize: 14, color: '#666', marginTop: 2 },
  linkBtn: { marginTop: 8, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e9ecef' },
  linkBtnDisabled: { opacity: 0.6 },
  linkText: { color: '#667eea', fontWeight: '600' },
  helpContainer: { alignItems: 'center', marginBottom: 10 },
  helpText: { fontSize: 14, color: '#666' },
  linkDisabled: { color: '#aaa' },
  backTextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  backText: { color: '#667eea', fontSize: 15, fontWeight: '600', marginLeft: 6 },
});
