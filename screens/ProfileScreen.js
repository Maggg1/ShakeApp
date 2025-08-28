import React from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { avatars } from '../assets/avatars';
import { api } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      const run = async () => {
        setLoading(true);
        try {
          const user = await api.getCurrentUser();
          if (active) setUserData(user || null);
        } catch (e) {
          if (active) setUserData(null);
        } finally {
          if (active) setLoading(false);
        }
      };
      run();
      return () => { active = false; };
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.logout();
              navigation.replace('Login');
            } catch (_) {}
          }
        }
      ]
    );
  };

  const getAvatarSource = () => {
    const raw = userData?.avatarIndex;
    const index = raw !== undefined && raw !== null ? Number(raw) : null;
    if (index !== null && !isNaN(index) && avatars[index]) return avatars[index];
    if (typeof userData?.avatar === 'string' && userData.avatar.trim()) return { uri: userData.avatar };
    return require('../assets/images/Default.png');
  };

  const getDisplayName = () => {
    return userData?.name || userData?.username || (userData?.email ? userData.email.split('@')[0] : 'User');
  };

  // Robust joined date logic
  function parseAnyDate(v) {
    if (v == null) return null;
    if (typeof v === 'number') {
      const ms = v < 1e12 ? v * 1000 : v;
      const d = new Date(ms);
      return isNaN(d) ? null : d;
    }
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return null;
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
  }
  function objectIdToDate(val) {
    if (!val) return null;
    let hex = '';
    if (typeof val === 'string') {
      const m = val.match(/[0-9a-fA-F]{24}/);
      hex = m ? m[0] : '';
    } else {
      const str = String(val || '');
      const m = str.match(/[0-9a-fA-F]{24}/);
      hex = m ? m[0] : '';
    }
    if (hex.length !== 24) return null;
    const tsHex = hex.substring(0, 8);
    const seconds = parseInt(tsHex, 16);
    if (!seconds || Number.isNaN(seconds)) return null;
    const d = new Date(seconds * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function getJoinedDate() {
    const s = userData || {};
    const direct = parseAnyDate(s.createdAt) || parseAnyDate(s.created_at) || parseAnyDate(s.created);
    if (direct) return direct;
    const levels = [s, s.user, s.profile, s.data, s.data?.user, s.data?.profile, s.account, s.meta, s.metadata].filter(Boolean);
    const keys = [
      'registeredAt','registered_at',
      'createdOn','created_on',
      'joinedAt','joined_at','joinDate',
      'accountCreatedAt','account_created_at',
      'creationTime','createdDate','created_time','dateCreated',
      'signUpDate','signupDate','signUp_at','signup_at',
      'firstLoginAt','first_login_at'
    ];
    for (const lvl of levels) {
      for (const k of keys) {
        const d = parseAnyDate(lvl?.[k]);
        if (d) return d;
      }
    }
    const visited = new WeakSet();
    let found = null;
    const matchesKey = (k) => /created|register|joined|signup|signUp|creation/i.test(k);
    const dfs = (o, depth=0) => {
      if (!o || typeof o !== 'object' || visited.has(o) || depth>3 || found) return;
      visited.add(o);
      for (const [k,v] of Object.entries(o)) {
        if (found) break;
        if (matchesKey(k)) {
          const d = parseAnyDate(v);
          if (d) { found = d; break; }
        }
        if (v && typeof v === 'object') dfs(v, depth+1);
      }
    };
    dfs(s, 0);
    if (found) return found;
    return objectIdToDate(s._id || s.id) || null;
  }
  const joinedText = React.useMemo(() => {
    const d = getJoinedDate();
    if (!d) return 'Unknown';
    try {
      return d.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (_) {
      return 'Unknown';
    }
  }, [userData]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Curved Gradient Header */}
      <LinearGradient colors={['#97c5cc', '#669198']} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerBtn} />
        </View>
      </LinearGradient>

      {/* Clean White Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarHolder}>
          <Image source={getAvatarSource()} style={styles.avatar} />
        </View>
        <Text style={styles.nameDark}>{loading ? 'Loading...' : getDisplayName()}</Text>
        {!!userData?.email && <Text style={styles.emailDark}>{userData.email}</Text>}
        <Text style={styles.joinedDark}>Joined: {joinedText}</Text>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        <MenuItem
          title="Edit Profile"
          icon="person-outline"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <MenuItem
          title="Feedback"
          icon="chatbubble-outline"
          onPress={() => navigation.navigate('Feedback')}
        />
        <MenuItem
          title="Shake History"
          icon="time-outline"
          onPress={() => navigation.navigate('ShakesHistory')}
        />
        <MenuItem
          title="Settings"
          icon="settings-outline"
          onPress={() => navigation.navigate('Settings')}
          last
        />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function MenuItem({ title, icon, onPress, last }) {
  return (
    <TouchableOpacity style={[styles.menuItem, last && styles.menuItemLast]} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={18} color="#669198" />
      </View>
      <Text style={styles.menuText}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 28,
    paddingHorizontal: 16,
    shadowColor: '#669198',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: { padding: 6 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cardShadow: {
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 8,
    borderRadius: 18,
  },
  profileGradient: {
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginBottom: 10,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#669198',
  },
  glassPanel: {
    marginTop: 10,
    width: '100%',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameLight: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  emailLight: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
  },
  joinedLight: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  /* New white card styles */
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarHolder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF3F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  nameDark: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2D3D',
  },
  emailDark: {
    fontSize: 14,
    color: '#66737B',
    marginTop: 4,
  },
  joinedDark: {
    fontSize: 12,
    color: '#8A98A4',
    marginTop: 6,
  },
  menu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E6EDF3',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F6',
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(102, 145, 152, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2D3D',
  },
  logoutBtn: {
    marginTop: 16,
    marginHorizontal: 16,
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
