import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';
import { api } from '../services/api';

export default function ShakeScreen({ navigation }) {

  // Remove total and daily shakes state from ShakeScreen
  const [isShaking, setIsShaking] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [currentReward, setCurrentReward] = useState(null);
  const [dailyShakes, setDailyShakes] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(5); // Daily limit of 5 shakes
  const [limitReached, setLimitReached] = useState(false);

  const inFlightRef = useRef(false);
  const accelSubRef = useRef(null);
  const lastMagRef = useRef(0);
  const lastTriggerRef = useRef(0);

  // Fetch today's shake count on mount
  useEffect(() => {
    fetchTodayShakes();
  }, []);

  // Accelerometer-based shake detection with threshold and debounce
  useEffect(() => {
    let subscribed = true;
    let subscription = null;

    // Only enable accelerometer on native platforms
    if (Platform.OS !== 'web') {
      const initializeAccelerometer = async () => {
        try {
          // Check if accelerometer is available
          const isAvailable = await Accelerometer.isAvailableAsync();
          if (!isAvailable) {
            console.warn('Accelerometer not available on this device');
            return;
          }

          // Set update interval with error handling
          try { 
            Accelerometer.setUpdateInterval(120); 
          } catch (error) {
            console.warn('Failed to set accelerometer update interval:', error);
          }

          subscription = Accelerometer.addListener(({ x, y, z }) => {
            if (!subscribed) return;
            // avoid triggering when limit reached or a request is in-flight
            if (limitReached || inFlightRef.current) return;

            const mag = Math.sqrt((x || 0) * (x || 0) + (y || 0) * (y || 0) + (z || 0) * (z || 0));
            const lastMag = lastMagRef.current || 0;
            const delta = Math.abs(mag - lastMag);
            lastMagRef.current = mag;

            const now = Date.now();
            const since = now - (lastTriggerRef.current || 0);
            const THRESHOLD = 1.2; // tune as needed; higher => harder to trigger
            const DEBOUNCE_MS = 1200; // prevent rapid repeats

            if (delta > THRESHOLD && since > DEBOUNCE_MS && !isShaking) {
              lastTriggerRef.current = now;
              // trigger existing flow
              handleShake();
            }
          });
          accelSubRef.current = subscription;
        } catch (error) {
          console.error('Failed to initialize accelerometer:', error);
        }
      };

      initializeAccelerometer();
    }

    return () => {
      subscribed = false;
      try { 
        if (subscription && subscription.remove) {
          subscription.remove();
        }
      } catch (error) {
        console.warn('Error removing accelerometer subscription:', error);
      }
      accelSubRef.current = null;
    };
  }, [limitReached, isShaking]);

  const fetchTodayShakes = async () => {
    try {
      const todayShakes = await api.getShakesToday();
      const count = Array.isArray(todayShakes) ? todayShakes.length : 0;
      setDailyShakes(count);
      setLimitReached(count >= dailyLimit);
    } catch (error) {
      console.error('Error fetching today\'s shakes:', error);
    }
  };

  // Don't fetch statistics on mount - DashboardScreen handles this
  // We'll update local state when shakes are recorded

  const getRandomReward = async () => {
    try {
      // Fetch rewards from backend
      const response = await fetch(`${api.API_BASE_URL}/api/rewards`);
      const rewards = await response.json();
      
      if (rewards && rewards.length > 0) {
        // Filter active rewards
        const activeRewards = rewards.filter(reward => reward.active);
        
        if (activeRewards.length > 0) {
          // Simple probability-based selection
          const totalProbability = activeRewards.reduce((sum, reward) => sum + reward.probability, 0);
          let random = Math.random() * totalProbability;
          
          for (const reward of activeRewards) {
            if (random < reward.probability) {
              return reward;
            }
            random -= reward.probability;
          }
          
          // Fallback to first reward if probability calculation fails
          return activeRewards[0];
        }
      }
    } catch (error) {
      console.warn('Failed to fetch rewards:', error);
    }
    
    // Default reward if no rewards available
    return {
      name: '10 Coins',
      description: 'Congratulations! You earned 10 coins!',
      points: 10
    };
  };

  const handleShake = async () => {
    // Sync re-entry guard to prevent double taps creating duplicate shakes
    if (inFlightRef.current) return;

    if (isShaking) return;
    
    // Check daily limit before allowing shake (quick UI check)
    if (limitReached) {
      Alert.alert(
        'Daily Limit Reached',
        `You've reached your daily limit of ${dailyLimit} shakes. Come back tomorrow to shake again!`,
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }

    // Server-synced pre-check to avoid races with other devices/sessions
    try {
      const todayShakes = await api.getShakesToday();
      const currentCount = Array.isArray(todayShakes) ? todayShakes.length : 0;
      if (currentCount >= dailyLimit) {
        setDailyShakes(currentCount);
        setLimitReached(true);
        Alert.alert(
          'Daily Limit Reached',
          `You've reached your daily limit of ${dailyLimit} shakes. Come back tomorrow to shake again!`,
          [{ text: 'OK', style: 'cancel' }]
        );
        return;
      }
    } catch (_) {
      // If pre-check fails, continue; backend will enforce if necessary
    }

    inFlightRef.current = true;
    setIsShaking(true);
    try {
      // Get random reward first
      const reward = await getRandomReward();
      
      console.log('Shake recorded with reward:', reward.name);
      await api.recordShake({ 
        count: 1,
        reward: reward.name,
        rewardDescription: reward.description
      });

      // Refresh from backend to ensure accurate count (prevents +2 issues)
      await fetchTodayShakes();

      // Show reward
      setCurrentReward(reward);
      setShowReward(true);

      // Small visual feedback delay
      setTimeout(() => {
        setIsShaking(false);
        // Hide reward after a few seconds
        setTimeout(() => {
          setShowReward(false);
          setCurrentReward(null);
        }, 3000); // Keep reward visible for 3 seconds
      }, 600);
    } catch (e) {
      console.error('Shake failed:', e);
      setIsShaking(false);
      
      // Handle specific error cases
      if (e.code === 'DAILY_LIMIT_EXCEEDED' || e.status === 429) {
        // Backend validation caught the limit - update local state to match
        Alert.alert(
          'Daily Limit Reached',
          `You've reached your daily limit of ${dailyLimit} shakes. Come back tomorrow to shake again!`,
          [{ text: 'OK', style: 'cancel' }]
        );
        
        // Refresh today's shake count to get accurate data from backend
        try {
          await fetchTodayShakes();
        } catch (refreshError) {
          console.error('Error refreshing shake count:', refreshError);
        }
      } else if (e.isNetworkError) {
        Alert.alert(
          'Network Error',
          'Unable to connect to the server. Please check your internet connection and try again.',
          [{ text: 'OK', style: 'cancel' }]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to record shake. Please try again.',
          [{ text: 'OK', style: 'cancel' }]
        );
      }
    } finally {
      inFlightRef.current = false;
    }
  };

  const closeRewardPopup = () => {
    setShowReward(false);
    setCurrentReward(null);
  };

  // Limit checking is handled by DashboardScreen, not here

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Gradient */}
      <LinearGradient colors={['#97c5cc', '#669198']} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shake</Text>
          <View style={styles.iconBtn} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.title}>Shake Your Phone!</Text>

        <TouchableOpacity
          style={[styles.shakeButton, isShaking && styles.shakeButtonActive, limitReached && styles.shakeButtonDisabled]}
          onPress={handleShake}
          disabled={isShaking || limitReached}
          activeOpacity={0.85}
        >
          <Image 
            source={require('../assets/images/gift.png')} 
            style={[styles.shakeImage, isShaking && styles.shakeImageActive, limitReached && styles.shakeImageDisabled]} 
          />
        </TouchableOpacity>

        {/* Reward Display */}
        {showReward && currentReward && (
          <View style={styles.rewardContainer}>
            <Ionicons name="gift" size={30} color="#FF6B81" />
            <View style={styles.rewardTextContainer}>
              <Text style={styles.rewardName}>{currentReward.name}</Text>
              <Text style={styles.rewardDescription}>{currentReward.description}</Text>
            </View>
          </View>
        )}

        {/* Daily Limit Status */}
        <View style={styles.limitNotice}>
          <Ionicons 
            name={limitReached ? "alert-circle" : "information-circle"} 
            size={20} 
            color={limitReached ? "#FF6B6B" : "#669198"} 
          />
          <Text style={[styles.limitText, limitReached && styles.limitTextReached]}>
            {limitReached 
              ? `Daily limit reached (${dailyShakes}/${dailyLimit})` 
              : `Shakes today: ${dailyShakes}/${dailyLimit}`
            }
          </Text>
        </View>

        {/* Stats are handled by DashboardScreen, not shown here */}

        <TouchableOpacity style={styles.historyButton} onPress={() => navigation.navigate('ShakesHistory')}>
          <Text style={styles.historyButtonText}>View History</Text>
        </TouchableOpacity>
      </View>

      {/* Reward Popup Modal */}
      <Modal
        visible={showReward}
        transparent={true}
        animationType="fade"
        onRequestClose={closeRewardPopup}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rewardPopup}>
            <View style={styles.rewardHeader}>
              <Ionicons name="gift" size={40} color="#FF6B81" />
              <Text style={styles.rewardTitle}>Congratulations!</Text>
            </View>
            
            <View style={styles.rewardContent}>
              <Text style={styles.rewardName}>{currentReward?.name}</Text>
              <Text style={styles.rewardDescription}>{currentReward?.description}</Text>
            </View>

            <TouchableOpacity 
              style={styles.rewardButton}
              onPress={closeRewardPopup}
            >
              <Text style={styles.rewardButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: { padding: 6 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  shakeButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  shakeButtonActive: {
    transform: [{ scale: 0.97 }],
  },
  shakeButtonDisabled: {
    opacity: 0.6,
  },
  shakeImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  shakeImageActive: {
    transform: [{ rotate: '15deg' }],
  },
  shakeImageDisabled: {
    opacity: 0.5,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 20,
    shadowColor: '#FF6B81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    width: '100%',
  },
  rewardTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8A8A8E',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    alignSelf: 'stretch',
  },
  limitNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  limitText: {
    color: '#8A8A8E',
    fontSize: 14,
    fontWeight: '500',
  },
  limitTextReached: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  historyButton: {
    marginTop: 20,
    backgroundColor: '#669198',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#4A80F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  historyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Reward Popup Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rewardPopup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  rewardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rewardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  rewardContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  rewardName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B81',
    marginBottom: 8,
  },
  rewardDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  rewardPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  rewardButton: {
    backgroundColor: '#669198',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  rewardButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});