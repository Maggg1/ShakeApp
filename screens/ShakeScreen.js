import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function ShakeScreen({ navigation }) {
  const DAILY_LIMIT = 5;

  const [totalShakes, setTotalShakes] = useState(0);
  const [dailyShakes, setDailyShakes] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await api.getCurrentUser();
        await checkAndResetDaily(user);
      } catch (e) {
        // If offline mocks or errors, still allow UI
        console.warn('Failed to load user on Shake screen:', e?.message || e);
      }
    };
    init();
  }, []);

  const sameDay = (a, b) => {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const checkAndResetDaily = async (user) => {
    try {
      const now = new Date();
      const lastShakeTime = user?.lastShakeTime ? new Date(user.lastShakeTime) : null;

      if (!lastShakeTime || !sameDay(lastShakeTime, now)) {
        // Reset daily count
        const updated = await api.updateProfile({ dailyShakes: 0, lastShakeTime: null });
        setDailyShakes(updated?.dailyShakes || 0);
        setTotalShakes(updated?.totalShakes || user?.totalShakes || 0);
      } else {
        setDailyShakes(user?.dailyShakes || 0);
        setTotalShakes(user?.totalShakes || 0);
      }
    } catch (e) {
      console.warn('checkAndResetDaily error:', e?.message || e);
      setDailyShakes(user?.dailyShakes || 0);
      setTotalShakes(user?.totalShakes || 0);
    }
  };

  const handleShake = async () => {
    if (isShaking) return;

    if (dailyShakes >= DAILY_LIMIT) {
      Alert.alert('Daily limit reached', 'You have reached 5 shakes for today. Come back tomorrow!');
      return;
    }

    setIsShaking(true);
    try {
      await api.recordShake({ count: 1 });

      // Update local counters immediately
      setDailyShakes((prev) => prev + 1);
      setTotalShakes((prev) => prev + 1);

      // Small visual feedback delay
      setTimeout(() => setIsShaking(false), 600);
    } catch (e) {
      console.error('Shake failed:', e);
      setIsShaking(false);
      Alert.alert('Error', 'Failed to record shake. Please try again.');
    }
  };

  const limitReached = dailyShakes >= DAILY_LIMIT;

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
          <Image source={require('../assets/images/gift.png')} style={[styles.shakeImage, isShaking && styles.shakeImageActive]} />
        </TouchableOpacity>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dailyShakes}/{DAILY_LIMIT}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalShakes}</Text>
            <Text style={styles.statLabel}>Total Shakes</Text>
          </View>
        </View>

        {limitReached ? (
          <View style={styles.limitNotice}>
            <Ionicons name="information-circle-outline" size={20} color="#8A8A8E" />
            <Text style={styles.limitText}>Daily limit reached. Come back tomorrow!</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.historyButton} onPress={() => navigation.navigate('ShakesHistory')}>
          <Text style={styles.historyButtonText}>View History</Text>
        </TouchableOpacity>
      </View>

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
});
