import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  Alert, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Animated 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      // Direct MongoDB login - no Firebase intermediate step
      const response = await api.login({ email: email.trim(), password });
      
      if (response && response.token) {
        // Log login activity to MongoDB (ignore failures)
        try {
          await api.logActivity({
            type: 'login',
            description: 'Successfully logged into the app',
            metadata: {},
          });
        } catch (e) {
          console.warn('Could not create login activity:', e?.message || e);
        }

        navigation.replace('Dashboard');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      let errorMessage = error?.message || 'Login failed';
      
      // Handle different error types from MongoDB backend
      if (error.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.status === 404) {
        errorMessage = 'Account not found';
      } else if (error.status === 400) {
        errorMessage = 'Invalid credentials format';
      } else if (error.status === 429) {
        errorMessage = 'Too many attempts. Please try again later.';
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <LinearGradient 
      colors={['#97c5cc', '#669198']}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Please sign in to continue</Text>
          </View>
          
          <LinearGradient 
            colors={['rgba(255,255,255,0.9)', 'rgba(194,205,255,0.8)']}
            style={styles.inputBox}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeButton}>
                  <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.forgotPasswordButton}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </LinearGradient>
          
          <TouchableOpacity 
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            onPress={handleLogin}
            disabled={loading}
            style={styles.buttonContainer}
          >
            <LinearGradient
              colors={
                isPressed
                  ? ['#4f9fb4ff', '#93d8ddff']
                  : ['#4f9fb4', '#93d8dd']
              }
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { 
    flex: 1 
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: { 
    paddingHorizontal: 24 
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: { 
    fontSize: 36, 
    fontWeight: '700', 
    marginBottom: 8, 
    color: '#0f323f', 
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 16, 
    color: '#666', 
    marginBottom: 32, 
    textAlign: 'center',
  },
  inputBox: { 
    padding: 28, 
    borderRadius: 24, 
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f323f',
    marginBottom: 8,
  },
  input: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    paddingVertical: 16, 
    paddingHorizontal: 20, 
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  eyeText: {
    fontSize: 20,
  },
  forgotPasswordButton: { 
    alignSelf: 'flex-end', 
    marginTop: 8,
  },
  forgotPasswordText: { 
    color: '#4f9fb4', 
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: { 
    borderRadius: 28, 
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: { 
    fontSize: 18, 
    fontWeight: '700',
    color: '#fff',
  },
  createAccountContainer: {
    marginBottom: 24,
  },
  createAccountButton: {
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4f9fb4',
  },
  createAccountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4f9fb4',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 16,
  },
  footerLink: {
    color: '#c7d5d8ff',
    fontWeight: '700',
  },
});