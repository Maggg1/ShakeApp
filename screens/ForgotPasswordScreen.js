import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await api.sendPasswordReset(email.trim());
      setEmailSent(true);
      
      // Auto-navigate after 2 seconds
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error) {
      handleResetError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetError = (error) => {
    let errorMessage = 'Failed to send reset email';
    
    // Handle MongoDB API errors
    if (error.status === 404) {
      errorMessage = 'Password reset endpoint not available';
    } else if (error.status === 400) {
      errorMessage = 'Invalid email address';
    } else if (error.status === 429) {
      errorMessage = 'Too many attempts. Please try again later';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    Alert.alert('Error', errorMessage);
  };

  const handleResend = async () => {
    if (emailSent || !email.trim()) return;
    
    setLoading(true);
    try {
      await api.sendPasswordReset(email.trim());
      Alert.alert('Success', 'Reset link resent successfully!');
    } catch (error) {
      handleResetError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#97c5cc', '#669198']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Animated.View style={[styles.imageContainer, { transform: [{ scale: scaleAnim }] }]}>
            <Image
              source={require('../assets/images/resetpass.png')}
              style={styles.image}
              resizeMode="contain"
              accessibilityLabel="Password reset illustration"
            />
          </Animated.View>

          <View style={styles.card}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

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
                editable={!loading && !emailSent}
                accessibilityLabel="Email input"
              />
            </View>

            {emailSent ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
                <Text style={styles.successText}>Reset link sent!</Text>
                <Text style={styles.successSubtext}>Check your email inbox</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleResetPassword}
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

            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                Didn't receive the email?{' '}
                <Text 
                  style={[styles.linkText, (emailSent || !email.trim()) && styles.linkDisabled]} 
                  onPress={handleResend}
                  accessibilityLabel="Resend reset password email"
                >
                  Resend
                </Text>
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
              disabled={loading}
              accessibilityLabel="Go back to login"
            >
              <Ionicons name="arrow-back" size={20} color="#667eea" />
              <Text style={styles.backText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  image: {
    width: 150,
    height: 150,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#a3b1ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 10,
  },
  successSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  helpContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    color: '#667eea',
    fontWeight: '600',
  },
  linkDisabled: {
    color: '#aaa',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  backText: {
    color: '#667eea',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});