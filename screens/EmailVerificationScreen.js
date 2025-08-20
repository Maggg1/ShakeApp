import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Image, 
  ActivityIndicator, 
  Animated, 
  Linking,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function EmailVerificationScreen({ navigation, route }) {
  const { email } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start entrance animations
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

    // Start pulse animation for the email icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Countdown timer for resend button
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOpenEmailApp = () => {
    try {
      Linking.openURL('mailto:');
    } catch (error) {
      Alert.alert('Error', 'Could not open email app. Please check your email manually.');
    }
  };

  const handleCheckVerification = async () => {
    // In offline/test mode, allow user to proceed
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Proceed', 'Continuing to login screen for testing.');
      navigation.replace('Login');
    }, 800);
  };

  const handleResendEmail = async () => {
    if (!canResend) return;
    Alert.alert('Resent', 'A verification email would be resent in production.');
    setTimeLeft(60);
    setCanResend(false);
  };

  return (
    <LinearGradient
      colors={['#ffffff', '#EAF9FF', '#D4F1F7']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.View 
          style={[
            styles.container,
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
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.iconContainer}>
                <Text style={styles.emailIcon}>📧</Text>
              </View>
            </Animated.View>
            
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>We've sent a verification link to:</Text>
            <Text style={styles.emailText}>{email || 'your email'}</Text>
          </View>

          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'rgba(194,205,255,0.8)']}
            style={styles.contentBox}
          >
            <Text style={styles.instructions}>To complete your registration, please:</Text>
            
            <View style={styles.stepContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Check your email inbox</Text>
            </View>
            
            <View style={styles.stepContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Click the verification link</Text>
            </View>
            
            <View style={styles.stepContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Return here to sign in</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={handleOpenEmailApp} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Open Email App</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleCheckVerification} disabled={loading} style={styles.primaryButton}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>I've Verified My Email</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the email?</Text>
              <TouchableOpacity
                onPress={handleResendEmail}
                disabled={!canResend}
                style={[styles.resendButton, !canResend && styles.resendButtonDisabled]}
              >
                <Text style={[styles.resendButtonText, !canResend && styles.resendButtonTextDisabled]}>
                  {canResend ? 'Resend Email' : `Resend in ${timeLeft}s`}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Having trouble?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { 
    flex: 1 
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(79, 159, 180, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#4f9fb4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emailIcon: {
    fontSize: 48,
  },
  title: { 
    fontSize: 32, 
    fontWeight: '700', 
    marginBottom: 16,
    textAlign: 'center', 
    color: '#0f323f',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4f9fb4',
    textAlign: 'center',
    backgroundColor: 'rgba(79, 159, 180, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  contentBox: {
    padding: 28,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  instructions: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f323f',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4f9fb4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#4f9fb4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 16,
    color: '#0f323f',
    flex: 1,
    lineHeight: 22,
  },
  buttonContainer: {
    marginTop: 32,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#4f9fb4',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4f9fb4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  secondaryButton: {
    backgroundColor: 'rgba(79, 159, 180, 0.1)',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4f9fb4',
  },
  secondaryButtonText: {
    color: '#4f9fb4',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 159, 180, 0.1)',
    borderWidth: 1,
    borderColor: '#4f9fb4',
  },
  resendButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderColor: '#ccc',
  },
  resendButtonText: {
    color: '#4f9fb4',
    fontSize: 14,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: '#999',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  footerLink: {
    color: '#4f9fb4',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
