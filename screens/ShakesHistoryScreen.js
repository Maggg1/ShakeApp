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
import { api } from '../services/api';

export default function ShakesHistoryScreen({ navigation }) {
  const [shakes, setShakes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShakesHistory();
  }, []);

  const loadShakesHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getShakes();
      const list = Array.isArray(data) ? data : [];
      // Ensure objects have proper Date objects and sort by timestamp desc
      const normalized = list
        .map((s, idx) => {
          const reward = (s.reward != null ? s.reward : (s.metadata && s.metadata.reward != null ? s.metadata.reward : (s.prize != null ? s.prize : s.rewardName)));
          const rewardDescription = (s.rewardDescription != null ? s.rewardDescription : (s.metadata && s.metadata.rewardDescription != null ? s.metadata.rewardDescription : s.description));
          const tsRaw = s.timestamp || s.createdAt || s.date || s.time || Date.now();
          const ts = new Date(tsRaw);
          return {
            id: String((s.id != null ? s.id : (s._id != null ? s._id : (tsRaw ? tsRaw : `shake-${idx}-${Date.now()}`)))),
            ...s,
            reward,
            rewardDescription,
            timestamp: ts,
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);
      setShakes(normalized);
    } catch (error) {
      console.warn('Error loading shakes history:', error?.message || error);
      setShakes([]);
    } finally {
      setLoading(false);
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

  const renderShakeItem = ({ item, index }) => (
    <View style={styles.shakeItem}>
      <View style={styles.iconBg}>
        <Image source={require('../assets/images/gift.png')} style={styles.iconImage} />
      </View>
      <View style={styles.shakeInfo}>
        <Text style={styles.shakeTitle}>Shake</Text>
        <Text style={styles.shakeDate}>{formatDate(item.timestamp)}</Text>
        {item.reward ? (
          <View style={styles.rewardRow}>
            <Ionicons name="gift-outline" size={14} color="#FF6B81" />
            <Text style={styles.rewardBadgeText}>{item.reward}</Text>
          </View>
        ) : null}
        {item.rewardDescription && (
          <Text style={styles.rewardDescription}>{item.rewardDescription}</Text>
        )}
      </View>
      {item.reward ? (
        <Text style={styles.rewardRight}>{item.reward}</Text>
      ) : (
        <Text style={styles.shakeCount}>+1</Text>
      )}
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
          <Text style={styles.headerTitle}>Shake History</Text>
          <View style={styles.iconBtn} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : shakes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Image 
            source={require('../assets/images/gift.png')} 
            style={styles.emptyImage}
          />
          <Text style={styles.emptyText}>No shakes recorded yet</Text>
        </View>
      ) : (
        <FlatList
          data={shakes}
          renderItem={renderShakeItem}
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
  shakeItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(102,145,152,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconImage: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  shakeInfo: {
    flex: 1,
  },
  shakeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  shakeDate: {
    fontSize: 12,
    color: '#8A8A8E',
  },
  rewardDescription: {
    fontSize: 11,
    color: '#669198',
    fontStyle: 'italic',
    marginTop: 2,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE9EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 6,
  },
  rewardBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B81',
  },
  rewardRight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B81',
    backgroundColor: '#FFE9EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  shakeCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A80F0',
  },
});
