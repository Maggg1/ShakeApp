import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function ShakesHistoryScreen({ navigation }) {
  const [shakes, setShakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadShakesHistory = useCallback(async () => {
    try {
      const data = await api.getShakes();
      const list = Array.isArray(data) ? data : [];

      // Normalize and process shake data
      const normalized = list
        .map((shake, idx) => {
          // Extract reward information from API response
          let coinAmount = 0;
          let rewardText = '';
          let rewardDetails = '';
          
          // Handle different reward formats from API
          if (shake.details && shake.details.reward) {
            // Handle reward object format: {reward: {name: "1 coins", ...}, summary: "Reward: 1 coins · P: 50%"}
            const rewardObj = shake.details.reward;
            if (typeof rewardObj === 'object') {
              rewardText = rewardObj.name || rewardObj.title || '';
              rewardDetails = shake.details.summary || '';
            } else {
              rewardText = String(rewardObj);
              rewardDetails = shake.details.summary || '';
            }
          } else if (shake.reward) {
            // Handle direct reward field
            rewardText = String(shake.reward);
          } else if (shake.metadata && shake.metadata.reward) {
            // Handle metadata reward
            rewardText = String(shake.metadata.reward);
          }
          
          // Parse coin amount from reward text
          const coinMatch = rewardText.match(/(\d+)\s*coins?/i);
          if (coinMatch && coinMatch[1]) {
            coinAmount = parseInt(coinMatch[1], 10);
          } else {
            const numberMatch = rewardText.match(/\d+/);
            if (numberMatch) {
              coinAmount = parseInt(numberMatch[0], 10);
            }
          }

          const timestamp = new Date(shake.timestamp || shake.createdAt || shake.date || Date.now());

          return {
            id: String(shake.id || shake._id || `shake-${idx}-${Date.now()}`),
            reward: rewardText,
            rewardDescription: rewardDetails,
            coinAmount,
            timestamp,
            rawData: shake,
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);

      setShakes(normalized);
    } catch (error) {
      console.warn('Error loading shakes history:', error?.message || error);
      setShakes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadShakesHistory();
  }, [loadShakesHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadShakesHistory();
  }, [loadShakesHistory]);

  const getRewardColor = (coinAmount) => {
    if (coinAmount >= 50) return '#FF6B35'; // Orange for high rewards
    if (coinAmount >= 20) return '#4CAF50'; // Green for medium rewards
    if (coinAmount >= 10) return '#2196F3'; // Blue for decent rewards
    return '#FF6B81'; // Pink for small rewards
  };

  const getRewardIcon = (coinAmount) => {
    return 'gift'; // Use the same icon for all rewards
  };

  const formatDate = (date) => {
    if (!date) return '';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date >= today) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date >= yesterday) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const groupShakesByDate = () => {
    const groups = {};
    shakes.forEach(shake => {
      const dateKey = shake.timestamp.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(shake);
    });
    return groups;
  };

  const renderShakeItem = ({ item }) => {
    const rewardColor = getRewardColor(item.coinAmount);
    const rewardIcon = getRewardIcon(item.coinAmount);

    return (
      <View style={styles.shakeCard}>
        <View style={[styles.iconContainer, { backgroundColor: `${rewardColor}20` }]}>
          <Ionicons name={rewardIcon} size={24} color={rewardColor} />
        </View>
        
        <View style={styles.shakeContent}>
          <Text style={styles.shakeTitle}>Shake Reward</Text>
          <Text style={styles.shakeTime}>{formatDate(item.timestamp)}</Text>
          
          {item.reward ? (
            <Text style={styles.rewardText}>
              {item.reward.replace(/· P: \d+%/, '').trim()}
            </Text>
          ) : null}
        </View>

      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../assets/images/gift.png')} 
        style={styles.emptyImage}
      />
      <Text style={styles.emptyTitle}>No Shakes Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start shaking your phone to earn rewards and see them here!
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.loadingText}>Loading your shake history...</Text>
    </View>
  );

  if (loading) {
    return renderLoadingState();
  }

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient 
        colors={['#97c5cc', '#669198']} 
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shake History</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      {shakes.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={shakes}
          renderItem={renderShakeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#667EEA']}
              tintColor="#667EEA"
            />
          }
          ListHeaderComponent={
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Total Shakes: {shakes.length}</Text>
              <Text style={styles.statsSubtitle}>
                Total Coins: {shakes.reduce((sum, shake) => sum + shake.coinAmount, 0)}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#667EEA',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyImage: {
    width: 120,
    height: 120,
    opacity: 0.7,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  shakeCard: {
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  shakeContent: {
    flex: 1,
  },
  shakeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  shakeTime: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  rewardText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  rewardDescription: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  coinAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
});
