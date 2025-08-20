import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { avatars } from '../assets/avatars';
import { api } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      const run = async () => {
        try {
          const user = await api.getCurrentUser();
          if (active) setUserData(user || null);
        } catch (e) {
          console.warn('Failed to load user data:', e?.message || e);
          if (active) setUserData(null);
        } finally {
          if (active) setLoading(false);
        }
      };
      setLoading(true);
      run();
      return () => {
        active = false;
      };
    }, [])
  );

  const handleLogout = async () => {
    try {
      await api.logout();
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const pickDate = (v) => {
    if (v == null) return null;
    if (typeof v === 'number') {
      const ms = v < 1e12 ? v * 1000 : v; // handle seconds vs ms
      const d = new Date(ms);
      return isNaN(d) ? null : d;
    }
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return null;
      // numeric string (seconds or ms)
      if (/^\d+$/.test(s)) {
        const n = parseInt(s, 10);
        const ms = n < 1e12 ? n * 1000 : n;
        const d = new Date(ms);
        return isNaN(d) ? null : d;
      }
      const d = new Date(s);
      return isNaN(d) ? null : d;
    }
    if (typeof v === 'object') {
      if (typeof v.toDate === 'function') {
        try {
          const d = v.toDate();
          return isNaN(d) ? null : d;
        } catch (_) {}
      }
      if (typeof v.seconds === 'number') {
        const d = new Date(v.seconds * 1000);
        return isNaN(d) ? null : d;
      }
    }
    return null;
  };

  const objectIdToDate = (val) => {
    if (!val) return null;
    let hex = '';
    if (typeof val === 'string') {
      const m = val.match(/[0-9a-fA-F]{24}/);
      hex = m ? m[0] : '';
    } else if (typeof val === 'object') {
      const str = String(val);
      const m = str.match(/[0-9a-fA-F]{24}/);
      hex = m ? m[0] : '';
    }
    if (hex.length !== 24) return null;
    const tsHex = hex.substring(0, 8);
    const seconds = parseInt(tsHex, 16);
    if (!seconds || Number.isNaN(seconds)) return null;
    const d = new Date(seconds * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const getJoinedDate = () => {
    const s = userData || {};

    const directLevels = [
      s,
      s.user,
      s.profile,
      s.data,
      s.data?.user,
      s.data?.profile,
      s.account,
      s.meta,
      s.metadata,
    ].filter(Boolean);

    const keys = [
      'createdAt', 'created_at', 'created',
      'registeredAt', 'registered_at',
      'createdOn', 'created_on',
      'joinedAt', 'joined_at', 'joinDate',
      'accountCreatedAt', 'account_created_at',
      'creationTime', 'createdDate', 'created_time', 'dateCreated',
      'signUpDate', 'signupDate', 'signUp_at', 'signup_at',
      'firstLoginAt', 'first_login_at'
    ];

    // 1) Try direct known keys first (fast path)
    for (const lvl of directLevels) {
      for (const k of keys) {
        const d = pickDate(lvl[k]);
        if (d) return d.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
      }
    }

    // 2) Deep search for any key that looks like a created/join/registered date
    const visited = new WeakSet();
    const matchesKey = (k) => /created|register|joined|signup|signUp|creation/i.test(k);
    let foundDate = null;

    const dfs = (obj, depth = 0) => {
      if (!obj || typeof obj !== 'object' || visited.has(obj) || depth > 3 || foundDate) return;
      visited.add(obj);

      for (const [k, v] of Object.entries(obj)) {
        if (foundDate) break;
        if (matchesKey(k)) {
          const d = pickDate(v);
          if (d) {
            foundDate = d;
            break;
          }
        }
        if (v && typeof v === 'object') {
          dfs(v, depth + 1);
        }
      }
    };

    dfs(s, 0);
    if (foundDate) {
      return foundDate.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // Fallback: derive from MongoDB ObjectId if available
    for (const lvl of directLevels) {
      const cand = lvl && (lvl._id || lvl.id);
      const d = objectIdToDate(cand);
      if (d) return d.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
    }

    return 'Unknown';
  };

  const getAvatarSource = () => {
    const raw = userData?.avatarIndex;
    const index = raw !== undefined && raw !== null ? Number(raw) : null;
    if (index !== null && !isNaN(index) && avatars[index]) return avatars[index];
    if (typeof userData?.avatar === 'string' && userData.avatar.trim()) return { uri: userData.avatar };
    return require('../assets/images/profile.png');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Gradient */}
      <LinearGradient colors={['#97c5cc', '#669198']} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image source={getAvatarSource()} style={styles.avatar} />
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.joinedLabel}>Joined</Text>
            <Text style={styles.joinedDate}>{getJoinedDate()}</Text>
            <Text style={styles.emailText}>{userData?.email || ''}</Text>
          </View>
        </View>

        {/* Menu List */}
        <View style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(102,145,152,0.12)' }]}>
              <Ionicons name="person-outline" size={20} color="#669198" />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={22} color="#C4C4C4" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(102,145,152,0.12)' }]}>
              <Ionicons name="settings-outline" size={20} color="#669198" />
            </View>
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={22} color="#C4C4C4" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Feedback')}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(102,145,152,0.12)' }]}>
              <Ionicons name="chatbubble-outline" size={20} color="#669198" />
            </View>
            <Text style={styles.menuText}>Feedbacks</Text>
            <Ionicons name="chevron-forward" size={22} color="#C4C4C4" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ShakesHistory')}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(102,145,152,0.12)' }]}>
              <Ionicons name="time-outline" size={20} color="#669198" />
            </View>
            <Text style={styles.menuText}>Shake History</Text>
            <Ionicons name="chevron-forward" size={22} color="#C4C4C4" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#669198',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 50,
    textAlign: 'center',
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#669198',
    marginBottom: 12,
  },
  joinedLabel: {
    fontSize: 12,
    color: '#8A8A8E',
    marginBottom: 4,
  },
  joinedDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  emailText: {
    fontSize: 14,
    color: '#8A8A8E',
    marginTop: 6,
  },
  menuList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  logoutBtn: {
    marginTop: 20,
    backgroundColor: '#E45A5A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
});
