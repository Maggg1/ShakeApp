import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Dimensions, RefreshControl, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { avatars } from '../assets/avatars';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen({ navigation }) {
  const [username, setUsername] = useState('User');
  const [avatarIndex, setAvatarIndex] = useState(null);
  const [totalShakes, setTotalShakes] = useState(0);
  const [dailyShakes, setDailyShakes] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Add local state for last reset date to track daily reset
  const [lastResetDate, setLastResetDate] = useState(null);

  const STORAGE_KEY = 'dashboard_last_reset_date';

  const calculateTimeUntilReset = useCallback(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Midnight

    const timeDiff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }, []);

  // Function to check and reset daily shakes if date changed locally
  const checkAndResetDailyShakes = useCallback(async () => {
    try {
      const todayISO = new Date().toISOString().slice(0, 10);
      const storedRaw = await AsyncStorage.getItem(STORAGE_KEY);
      let storedISO = null;

      if (storedRaw) {
        try {
          const parsed = JSON.parse(storedRaw);
          storedISO = parsed?.lastResetISO || null;
        } catch (_) {
          // Backward compatibility: legacy plain string like toDateString
          const legacyToday = new Date().toDateString();
          if (storedRaw === legacyToday) storedISO = todayISO;
        }
      }

      if (storedISO !== todayISO) {
        console.log('[Dashboard] New day detected, resetting daily shakes');
        setDailyShakes(0);
        setLastResetDate(todayISO);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ lastResetISO: todayISO }));

        // Also update the local storage that ShakeScreen uses (unified key)
        try {
          const shakeKey = 'shake_meta';
          const raw = await AsyncStorage.getItem(shakeKey);
          const meta = raw ? JSON.parse(raw) : {};
          meta.lastResetISO = todayISO;
          await AsyncStorage.setItem(shakeKey, JSON.stringify(meta));
        } catch (e) {
          console.warn('[Dashboard] Error updating shake meta:', e);
        }

        // Reset local fallback counters
        try {
          await AsyncStorage.setItem('local_daily_shakes_count', '0');
          await AsyncStorage.setItem('local_daily_shakes_date', todayISO);
        } catch (_) {}

        return { reset: true, lastResetISO: todayISO };
      } else {
        setLastResetDate(storedISO);
        return { reset: false, lastResetISO: storedISO };
      }
    } catch (error) {
      console.error('[Dashboard] Error checking/resetting daily shakes:', error);
      return { reset: false, lastResetISO: null, error: error?.message };
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const userData = await api.getCurrentUser();
      console.log('Fetched user data:', userData);

      if (userData) {
        const name = userData.name || userData.username || (userData.email ? userData.email.split('@')[0] : 'User');
        setUsername(name);

        const idx = userData.avatarIndex;
        if (idx !== undefined && idx !== null && !isNaN(Number(idx))) {
          setAvatarIndex(Number(idx));
        } else {
          setAvatarIndex(null);
        }

        // Calculate statistics from shake data
        try {
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const dd = String(today.getDate()).padStart(2, '0');
          const todayDate = `${yyyy}-${mm}-${dd}`;

          // Get today's shakes - with fallback for backend issues
          let todayShakes = [];
          let dailyCount = 0;

          try {
            todayShakes = await api.getShakesToday();
            dailyCount = Array.isArray(todayShakes) ? todayShakes.length : 0;
            console.log('Successfully fetched today\'s shakes from backend:', dailyCount);
          } catch (shakeError) {
            console.warn('Backend API failed for today\'s shakes, using client-side fallback:', shakeError.message);

            // Fallback: Use local AsyncStorage to track daily shakes
            try {
              const storedDailyCount = await AsyncStorage.getItem('local_daily_shakes_count');
              const storedDate = await AsyncStorage.getItem('local_daily_shakes_date');

              if (storedDate === todayDate) {
                dailyCount = parseInt(storedDailyCount || '0', 10);
                console.log('Using stored daily count:', dailyCount);
              } else {
                // New day, reset to 0
                dailyCount = 0;
                await AsyncStorage.setItem('local_daily_shakes_count', '0');
                await AsyncStorage.setItem('local_daily_shakes_date', todayDate);
                console.log('New day detected, reset daily count to 0');
              }
            } catch (storageError) {
              console.warn('AsyncStorage fallback failed:', storageError.message);
              dailyCount = 0;
            }
          }

          // Check local reset and sync with API count
          const resetInfo = await checkAndResetDailyShakes();
          if (resetInfo?.reset) {
            setDailyShakes(0);
          } else {
            setDailyShakes(dailyCount);
          }

          // Get all shakes for total count - with fallback
          let allShakes = [];
          let totalCount = 0;

          try {
            allShakes = await api.getShakes();
            totalCount = Array.isArray(allShakes) ? allShakes.length : 0;
            console.log('Successfully fetched all shakes from backend:', totalCount);
          } catch (totalShakeError) {
            console.warn('Backend API failed for all shakes, using local fallback:', totalShakeError.message);

            // Fallback: Use local AsyncStorage to track total shakes
            try {
              const storedTotalCount = await AsyncStorage.getItem('local_total_shakes_count');
              totalCount = parseInt(storedTotalCount || '0', 10);
              console.log('Using stored total count:', totalCount);
            } catch (storageError) {
              console.warn('AsyncStorage fallback failed:', storageError.message);
              totalCount = 0;
            }
          }

          console.log('Final stats - Total:', totalCount, 'Daily:', dailyCount);
          setTotalShakes(totalCount);
        } catch (shakeError) {
          console.error("Error in shake statistics calculation:", shakeError);
          // Ultimate fallback: reset to 0 and try to recover
          setTotalShakes(0);
          setDailyShakes(0);
        }

        // Update reset timer
        setTimeUntilReset(calculateTimeUntilReset());
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Set fallback values
      setUsername('User');
      setTotalShakes(0);
      setDailyShakes(0);
    }
  }, [calculateTimeUntilReset, checkAndResetDailyShakes]);

  // Function to parse reward text and extract coin amount
  const parseRewardText = (rewardText) => {
    if (rewardText == null) return null;
    const txt = String(rewardText);
    // Try to extract coin amount from common reward formats
    const coinMatch = txt.match(/(\d+)\s*coins?/i);
    if (coinMatch && coinMatch[1]) {
      return `received ${coinMatch[1]} coins`;
    }
    // Try to extract any number from the reward text
    const numberMatch = txt.match(/\d+/);
    if (numberMatch) {
      return `received ${numberMatch[0]} coins`;
    }
    // Fallback: use the original text
    return `received ${txt}`;
  };

  const fetchRecentActivities = useCallback(async () => {
    try {
      const activities = await api.getRecentShakeActivities({ limit: 50 });
      console.log('Fetched activities:', activities);
      const arr = Array.isArray(activities) ? activities : [];
      console.log('Activities array length:', arr.length);

      const processedActivities = arr
        .map((activity, i) => {
          console.log('Processing activity:', activity);
          // Handle timestamp parsing more robustly
          let timestamp = null;
          const timestampSource = activity.timestamp || activity.createdAt || activity.updatedAt;
          if (timestampSource != null) {
            // Numbers may be epoch seconds or ms; strings may be ISO or numeric
            if (typeof timestampSource === 'number') {
              // treat < 1e12 as seconds
              timestamp = new Date(timestampSource < 1e12 ? timestampSource * 1000 : timestampSource);
            } else if (typeof timestampSource === 'string') {
              // numeric string?
              const numeric = Number(timestampSource);
              if (!Number.isNaN(numeric)) {
                timestamp = new Date(numeric < 1e12 ? numeric * 1000 : numeric);
              } else {
                timestamp = new Date(timestampSource);
              }
            } else if (timestampSource && timestampSource.seconds) {
              timestamp = new Date(timestampSource.seconds * 1000);
            } else if (timestampSource instanceof Date) {
              timestamp = timestampSource;
            }
          }

           // Generate fallback ID more robustly
           const fallbackId = activity._id || activity.id || (timestamp ? timestamp.getTime() : `idx-${i}`);

           let title = '';
           switch (activity.type) {
             case 'shake':
               if (activity.details && activity.details.reward) {
                 const rewardText = parseRewardText(activity.details.reward.name || activity.details.reward);
                 title = `Shaked and ${rewardText}`;
               } else if (activity.reward) {
                 const rewardText = parseRewardText(activity.reward);
                 title = `Shaked and ${rewardText}`;
               } else {
                 title = 'Shake';
               }
               break;
             case 'feedback':
               title = activity.title ? `Feedback: ${activity.title}` : 'Feedback submitted';
               break;
             case 'profile_update':
             case 'profile':
             case 'update_profile':
               title = 'Profile updated';
               break;
             case 'reward':
               title = activity.title || activity.description || 'Reward received';
               break;
             default:
               title = activity.title || activity.description || 'Activity';
           }

          return {
            id: String(fallbackId),
            ...activity,
            timestamp,
            title
          };
        })
        .filter(activity => {
          // Filter out activities without valid timestamps
          const isValid = activity.timestamp && !isNaN(activity.timestamp.getTime());
          if (!isValid) {
            console.log('Filtering out activity with invalid timestamp:', activity);
          }
          return isValid;
        });

      console.log('Processed activities before sorting:', processedActivities);

      // Sort activities by timestamp (newest first)
      processedActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      console.log('Processed activities after sorting:', processedActivities);

      // Limit to 6 most recent activities
      const limitedActivities = processedActivities.slice(0, 6);
      console.log('Setting recent activities:', limitedActivities);
      setRecentActivities(limitedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setRecentActivities([]);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    console.log('Dashboard focused - refreshing data');
    fetchUserData();
    fetchRecentActivities();
  }, [fetchUserData, fetchRecentActivities]));

  // Keep reset timer updated every minute
  useEffect(() => {
    setTimeUntilReset(calculateTimeUntilReset());
    const id = setInterval(() => setTimeUntilReset(calculateTimeUntilReset()), 60_000);
    return () => clearInterval(id);
  }, [calculateTimeUntilReset]);

  // Handle app state changes to check for daily reset when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('[Dashboard] App became active, checking for daily reset');
        checkAndResetDailyShakes();
        fetchUserData();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [checkAndResetDailyShakes, fetchUserData]);

  // Add this useEffect hook for initial data loading
  useEffect(() => {
    // Initial data loading when component mounts
    console.log('[Dashboard] Initial data loading');
    checkAndResetDailyShakes();
    fetchUserData();
    fetchRecentActivities();
    
    // Set up timer to update the reset countdown
    const timer = setInterval(() => {
      setTimeUntilReset(calculateTimeUntilReset());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [fetchUserData, fetchRecentActivities, calculateTimeUntilReset, checkAndResetDailyShakes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchUserData(), fetchRecentActivities()]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchUserData, fetchRecentActivities]);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: () => navigation.replace("Login") }
      ],
      { cancelable: true }
    );
  };

  const formatDate = (date) => {
    if (!date) return '';

    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'shake':
        return 'gift-outline'; // Changed from 'hand-left-outline' to 'gift-outline'
      case 'profile_update':
      case 'profile':
      case 'update_profile':
        return 'person-outline';
      case 'feedback':
        return 'chatbubble-outline';
      case 'reward':
        return 'gift-outline';
      case 'login':
        return 'log-in-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getBackgroundColor = (type) => {
    const colors = {
      shake: '#E9F5FF',
      feedback: '#FFEFCF',
      reward: '#FFE9EC',
      default: '#F0F0F0'
    };
    return colors[type] || colors.default;
  };

  const getIconColor = (type) => {
    const colors = {
      shake: '#4A80F0',
      feedback: '#F5A623',
      reward: '#FF6B81',
      default: '#8A8A8E'
    };
    return colors[type] || colors.default;
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#669198']}
          tintColor="#669198"
        />
      }
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarContainer}>
          {avatarIndex !== null && avatars[avatarIndex] ? (
            <Image source={avatars[avatarIndex]} style={styles.avatarIcon} />
          ) : (
            <Image source={require('../assets/images/Default.png')} style={styles.avatarIcon} />
          )}
        </TouchableOpacity>

        <View style={styles.greetingContainer}>
          <Text style={styles.welcomeText}>Hello,</Text>
          <Text style={styles.greeting}>{username}!</Text>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={28} color="#4A80F0" />
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={['#97c5cc', '#669198']}
        style={styles.statsCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.statsContent}>
          <View>
            <Text style={styles.statsTitle}>Your Shake Stats</Text>
            <Text style={styles.statsSubtitle}>Keep shaking to earn rewards!</Text>
          </View>
          <View style={styles.statsIconContainer}>
            <Image source={require('../assets/images/shakes.png')} style={styles.statsIcon} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalShakes}</Text>
            <Text style={styles.statLabel}>Total Shakes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dailyShakes}/5</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        <View style={styles.resetTimerContainer}>
          <Text style={styles.resetTimerText}>
            Reset in: {timeUntilReset}
          </Text>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>

      <View style={styles.featuresGrid}>
        <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('Shake')}>
          <View style={[styles.featureIconBg, { backgroundColor: '#FFE9EC' }]}>
            <Image source={require('../assets/images/gift.png')} style={styles.featureIcon} />
          </View>
          <Text style={styles.featureText}>Shake Now</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('ShakesHistory')}>
          <View style={[styles.featureIconBg, { backgroundColor: '#E6EFFF' }]}>
            <Ionicons name="time-outline" size={24} color="#4A80F0" />
          </View>
          <Text style={styles.featureText}>Shake History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('Profile')}>
          <View style={[styles.featureIconBg, { backgroundColor: '#E9F5FF' }]}>
            <Image source={require('../assets/images/profile.png')} style={styles.featureIcon} />
          </View>
          <Text style={styles.featureText}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('Feedback')}>
          <View style={[styles.featureIconBg, { backgroundColor: '#FFEFCF' }]}>
            <Image source={require('../assets/images/feedback.png')} style={styles.featureIcon} />
          </View>
          <Text style={styles.featureText}>Feedback</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
      </View>

      <View style={styles.activityList}>
        {recentActivities.length > 0 ? (
          recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={[styles.activityIconBg, { backgroundColor: getBackgroundColor(activity.type) }]}>
                <Ionicons
                  name={getIconForType(activity.type)}
                  size={20}
                  color={getIconColor(activity.type)}
                />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>{formatDate(activity.timestamp)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={32} color="#8A8A8E" />
            <Text style={styles.emptyText}>No activities yet</Text>
            <Text style={styles.emptySubtext}>Start shaking to see your activities here!</Text>
          </View>
        )}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    padding: 4,
  },
  greetingContainer: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#669198',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  avatarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#669198',
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#669198',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 8,
  },
  statsIcon: {
    width: 32,
    height: 32,
    tintColor: 'white',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureCard: {
    width: (width - 50) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activityList: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#8A8A8E',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8A8A8E',
    marginTop: 6,
  },
  resetTimerContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  resetTimerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
});
