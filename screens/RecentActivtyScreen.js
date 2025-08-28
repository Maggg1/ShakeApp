import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';

export default function RecentActivityScreen({ navigation }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const list = await api.getRecentShakeActivities({ limit: 100 });
        const normalized = (Array.isArray(list) ? list : [])
          .filter(a => a && a.type !== 'login' && a.type !== 'logout')
          .map((a, idx) => ({
            id: String(a._id || a.id || (a.timestamp ? a.timestamp : `act-${idx}-${Date.now()}`)),
            ...a,
            timestamp: a.timestamp ? new Date(a.timestamp) : new Date(),
          }))
          .sort((a, b) => b.timestamp - a.timestamp);
        if (isMounted) setActivities(normalized);
      } catch (error) {
        console.warn('Error loading activities:', error?.message || error);
        if (isMounted) setActivities([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const run = async () => {
        setLoading(true);
        try {
          const list = await api.getRecentShakeActivities({ limit: 100 });
          const normalized = (Array.isArray(list) ? list : [])
            .filter(a => a && a.type !== 'login' && a.type !== 'logout')
            .map((a, idx) => ({
              id: String(a._id || a.id || (a.timestamp ? a.timestamp : `act-${idx}-${Date.now()}`)),
              ...a,
              timestamp: a.timestamp ? new Date(a.timestamp) : new Date(),
            }))
            .sort((a, b) => b.timestamp - a.timestamp);
          if (isActive) setActivities(normalized);
        } catch (error) {
          if (isActive) setActivities([]);
        } finally {
          if (isActive) setLoading(false);
        }
      };
      run();
      return () => { isActive = false; };
    }, [])
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'shake':
        return 'hand-left-outline';
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
      default: '#F0F0F0',
    };
    return colors[type] || colors.default;
  };

  const getActivityText = (activity) => {
    switch (activity.type) {
      case 'shake':
        if (activity.metadata?.reward) {
          return `Shaked and received: ${activity.metadata.reward}`;
        }
        return `Shaked ${activity.count || 1} time${(activity.count || 1) > 1 ? 's' : ''}`;
      case 'feedback':
        return activity.title ? `Feedback: ${activity.title}` : 'Feedback submitted';
      case 'profile_update':
      case 'profile':
      case 'update_profile':
        return 'Updated profile';
      case 'reward':
        return activity.title || activity.description || 'Reward received';
      case 'login':
        return 'Logged in';
      default:
        return activity.title || activity.description || 'Activity';
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (sameDay) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();
    if (isYesterday) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderActivityItem = ({ item }) => (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: getBackgroundColor(item.type) }]}>
        <Ionicons name={getActivityIcon(item.type)} size={22} color="#669198" />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>{getActivityText(item)}</Text>
        <Text style={styles.activityTime}>{formatDate(item.timestamp)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient colors={['#97c5cc', '#669198']} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recent Activity</Text>
          <View style={styles.iconBtn} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.centerContainer}>
          <Image source={require('../assets/images/gift.png')} style={styles.emptyImage} />
          <Text style={styles.emptyText}>No recent activities</Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item, idx) => (item.id && item.id !== 'undefined' ? String(item.id) : `idx-${idx}`)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: { padding: 6 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#669198',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: '#333',
    fontSize: 16,
    opacity: 0.8,
    marginTop: 16,
    fontWeight: '600',
  },
  emptyImage: {
    width: 80,
    height: 80,
    opacity: 0.5,
    resizeMode: 'contain',
  },
  listContainer: {
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(102, 145, 152, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '700',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#8A8A8E',
  },
});
