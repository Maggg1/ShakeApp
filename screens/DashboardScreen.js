import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { api } from '../services/api';
import { avatars } from '../assets/avatars'; // Ensure this exports an array of image imports
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

export default function DashboardScreen({ navigation }) {
  const [username, setUsername] = useState('User');
  const [avatarIndex, setAvatarIndex] = useState(null); // New: to store selected avatar
  const [totalShakes, setTotalShakes] = useState(0);
  const [dailyShakes, setDailyShakes] = useState(0);
    const [recentActivities, setRecentActivities] = useState([]);

  const fetchUserData = useCallback(async () => {
    try {
      const userData = await api.getCurrentUser();
      if (userData) {
        const name = userData.name || userData.username || (userData.email ? userData.email.split('@')[0] : 'User');
        setUsername(name);

        const idx = userData.avatarIndex;
        if (idx !== undefined && idx !== null && !isNaN(Number(idx))) {
          setAvatarIndex(Number(idx));
        } else {
          setAvatarIndex(null);
        }

        setTotalShakes(userData.totalShakes || 0);
        setDailyShakes(userData.dailyShakes || 0);

        await checkAndResetDailyShakes(userData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useFocusEffect(useCallback(() => {
    fetchUserData();
  }, [fetchUserData]));

  // Fetch recent activities (only shake activities)
  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const activities = await api.getRecentShakeActivities({ limit: 3 });
        // Ensure activities is an array before mapping
        const activitiesArray = Array.isArray(activities) ? activities : [];
        setRecentActivities(activitiesArray.map((activity, i) => {
          const fallbackId = activity._id || activity.id || (activity.timestamp ? String(activity.timestamp) : `idx-${i}`);
          return {
            id: String(fallbackId),
            ...activity,
            timestamp: activity.timestamp ? new Date(activity.timestamp) : null,
          };
        }));
      } catch (error) {
        console.error('Error fetching activities:', error);
        setRecentActivities([]);
      }
    };

    fetchRecentActivities();
  }, []);
  
  // Function to check and reset daily shakes at midnight
  const checkAndResetDailyShakes = async (userData) => {
    try {
      const lastShakeTime = userData.lastShakeTime ? new Date(userData.lastShakeTime) : null;
      
      if (lastShakeTime) {
        const today = new Date();
        const lastShakeDate = new Date(lastShakeTime);
        
        // Check if last shake was on a different day
        if (today.getDate() !== lastShakeDate.getDate() || 
            today.getMonth() !== lastShakeDate.getMonth() || 
            today.getFullYear() !== lastShakeDate.getFullYear()) {
          // Reset daily shakes count via API
          await api.updateProfile({ dailyShakes: 0 });
          setDailyShakes(0);
        }
      }
    } catch (error) {
      console.error('Error checking/resetting daily shakes:', error);
    }
  };

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

  // Helper functions for activities
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
    const icons = {
      shake: 'phone-portrait-outline',
      feedback: 'star-outline',
      reward: 'gift-outline',
      default: 'notifications-outline'
    };
    return icons[type] || icons.default;
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarContainer}>
          {avatarIndex !== null && avatars[avatarIndex] ? (
            <Image source={avatars[avatarIndex]} style={styles.avatarIcon} />
          ) : (
            <Ionicons name="person-circle-outline" size={36} color="#4A80F0" />
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
        <TouchableOpacity onPress={() => navigation.navigate('RecentActivty')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
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

      {/* Bottom Padding */}
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
  seeAllText: {
    fontSize: 14,
    color: '#4A80F0',
    fontWeight: '600',
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
  activityPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A80F0',
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
});