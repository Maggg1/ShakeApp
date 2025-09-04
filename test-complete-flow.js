// Complete flow test simulating React Native DashboardScreen behavior
// This tests the full component lifecycle and state management

const AsyncStorage = {
  storage: new Map(),
  getItem: async (key) => {
    console.log(`[AsyncStorage] Getting item for key: ${key}`);
    return AsyncStorage.storage.get(key) || null;
  },
  setItem: async (key, value) => {
    console.log(`[AsyncStorage] Setting item: ${key} = ${value}`);
    AsyncStorage.storage.set(key, value);
  }
};

// Mock Date
let mockDate = new Date('2024-01-01T10:00:00Z');
const originalDate = global.Date;

global.Date = class extends originalDate {
  constructor(...args) {
    if (args.length === 0) {
      return mockDate;
    }
    return new originalDate(...args);
  }

  static now() {
    return mockDate.getTime();
  }

  toDateString() {
    return mockDate.toDateString();
  }
};

// Mock API with realistic responses
let mockApiResponses = {
  user: {
    id: 'test-user',
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    avatarIndex: 2
  },
  shakesToday: [
    { id: 'shake-1', timestamp: '2024-01-01T08:30:00Z', reward: { name: '5 coins' } },
    { id: 'shake-2', timestamp: '2024-01-01T09:15:00Z', reward: { name: '10 coins' } },
    { id: 'shake-3', timestamp: '2024-01-01T10:00:00Z', reward: { name: '15 coins' } }
  ],
  allShakes: Array.from({ length: 42 }, (_, i) => ({
    id: `shake-${i + 1}`,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    reward: { name: `${Math.floor(Math.random() * 20) + 1} coins` }
  })),
  activities: [
    {
      id: 'activity-1',
      type: 'shake',
      timestamp: '2024-01-01T10:00:00Z',
      details: { reward: { name: '15 coins' } }
    },
    {
      id: 'activity-2',
      type: 'shake',
      timestamp: '2024-01-01T09:15:00Z',
      details: { reward: { name: '10 coins' } }
    },
    {
      id: 'activity-3',
      type: 'profile_update',
      timestamp: '2024-01-01T08:00:00Z'
    }
  ]
};

const api = {
  getCurrentUser: async () => {
    console.log('[API] Fetching current user...');
    await new Promise(resolve => setTimeout(resolve, 200));
    return { ...mockApiResponses.user };
  },

  getShakesToday: async () => {
    console.log('[API] Fetching today\'s shakes...');
    await new Promise(resolve => setTimeout(resolve, 150));
    return [...mockApiResponses.shakesToday];
  },

  getShakes: async () => {
    console.log('[API] Fetching all shakes...');
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockApiResponses.allShakes];
  },

  getRecentShakeActivities: async ({ limit = 50 } = {}) => {
    console.log(`[API] Fetching recent activities (limit: ${limit})...`);
    await new Promise(resolve => setTimeout(resolve, 250));
    return [...mockApiResponses.activities];
  }
};

// Mock AppState
let appState = 'active';
const appStateListeners = [];

const AppState = {
  addEventListener: (event, listener) => {
    if (event === 'change') {
      appStateListeners.push(listener);
      return {
        remove: () => {
          const index = appStateListeners.indexOf(listener);
          if (index > -1) appStateListeners.splice(index, 1);
        }
      };
    }
  }
};

// Simulate DashboardScreen state and effects
class MockDashboardScreen {
  constructor() {
    this.state = {
      username: 'User',
      avatarIndex: null,
      totalShakes: 0,
      dailyShakes: 0,
      recentActivities: [],
      refreshing: false,
      timeUntilReset: '',
      lastResetDate: null
    };

    this.intervals = [];
    this.subscriptions = [];
    this.mounted = true;
  }

  // State setters
  setState(updates) {
    this.state = { ...this.state, ...updates };
    console.log('[Dashboard] State updated:', updates);
  }

  // Core logic from DashboardScreen
  calculateTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeDiff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  checkAndResetDailyShakes = async () => {
    try {
      const today = new Date().toDateString();
      const storedDate = await AsyncStorage.getItem('dashboard_last_reset_date');

      console.log(`[Dashboard] Today: ${today}, Stored: ${storedDate}`);

      if (storedDate !== today) {
        console.log('[Dashboard] New day detected, resetting daily shakes');
        this.setState({ dailyShakes: 0, lastResetDate: today });
        await AsyncStorage.setItem('dashboard_last_reset_date', today);
        return { reset: true, dailyShakes: 0, lastResetDate: today };
      } else {
        console.log('[Dashboard] Same day, no reset needed');
        this.setState({ lastResetDate: storedDate });
        return { reset: false, dailyShakes: this.state.dailyShakes, lastResetDate: storedDate };
      }
    } catch (error) {
      console.error('[Dashboard] Error checking/resetting daily shakes:', error);
      return { reset: false, dailyShakes: this.state.dailyShakes, lastResetDate: null, error: error.message };
    }
  };

  fetchUserData = async () => {
    try {
      console.log('[Dashboard] Fetching user data...');
      const userData = await api.getCurrentUser();

      if (userData && this.mounted) {
        const name = userData.name || userData.username || (userData.email ? userData.email.split('@')[0] : 'User');

        // Get shake statistics
        const todayShakes = await api.getShakesToday();
        const dailyCount = Array.isArray(todayShakes) ? todayShakes.length : 0;

        const resetResult = await this.checkAndResetDailyShakes();
        const finalDailyCount = resetResult.reset ? 0 : dailyCount;

        const allShakes = await api.getShakes();
        const totalCount = Array.isArray(allShakes) ? allShakes.length : 0;

        this.setState({
          username: name,
          avatarIndex: userData.avatarIndex,
          totalShakes: totalCount,
          dailyShakes: finalDailyCount,
          timeUntilReset: this.calculateTimeUntilReset()
        });

        console.log(`[Dashboard] Updated stats - Total: ${totalCount}, Daily: ${finalDailyCount}`);
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching user data:', error);
      this.setState({
        username: 'User',
        totalShakes: 0,
        dailyShakes: 0
      });
    }
  };

  fetchRecentActivities = async () => {
    try {
      console.log('[Dashboard] Fetching recent activities...');
      const activities = await api.getRecentShakeActivities({ limit: 50 });

      if (this.mounted) {
        const processedActivities = (activities || [])
          .slice(0, 6)
          .map(activity => ({
            id: activity.id || `activity-${Date.now()}`,
            type: activity.type || 'activity',
            timestamp: new Date(activity.timestamp || Date.now()),
            title: activity.type === 'shake' ? 'Shake completed' : 'Activity'
          }));

        this.setState({ recentActivities: processedActivities });
        console.log(`[Dashboard] Loaded ${processedActivities.length} activities`);
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching activities:', error);
      this.setState({ recentActivities: [] });
    }
  };

  // Simulate useFocusEffect
  onFocus = async () => {
    console.log('[Dashboard] Screen focused');
    await Promise.all([
      this.fetchUserData(),
      this.fetchRecentActivities()
    ]);
  };

  // Simulate useEffect for timer
  startTimer = () => {
    console.log('[Dashboard] Starting reset timer');
    const interval = setInterval(() => {
      if (this.mounted) {
        this.setState({ timeUntilReset: this.calculateTimeUntilReset() });
      }
    }, 60000); // Update every minute

    this.intervals.push(interval);
    return interval;
  };

  // Simulate useEffect for AppState
  setupAppStateListener = () => {
    console.log('[Dashboard] Setting up AppState listener');
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      console.log(`[Dashboard] App state changed to: ${nextAppState}`);
      if (nextAppState === 'active' && this.mounted) {
        console.log('[Dashboard] App became active, checking for daily reset');
        await this.checkAndResetDailyShakes();
        await this.fetchUserData();
      }
    });

    this.subscriptions.push(subscription);
    return subscription;
  };

  // Simulate component mount
  async componentDidMount() {
    console.log('[Dashboard] Component mounted');
    this.setupAppStateListener();
    this.startTimer();
    await this.onFocus();
  }

  // Simulate component unmount
  componentWillUnmount() {
    console.log('[Dashboard] Component unmounting');
    this.mounted = false;
    this.intervals.forEach(clearInterval);
    this.subscriptions.forEach(sub => sub?.remove?.());
  }

  // Simulate pull-to-refresh
  onRefresh = async () => {
    console.log('[Dashboard] Pull to refresh triggered');
    this.setState({ refreshing: true });
    try {
      await Promise.all([
        this.fetchUserData(),
        this.fetchRecentActivities()
      ]);
    } catch (error) {
      console.error('[Dashboard] Error during refresh:', error);
    } finally {
      this.setState({ refreshing: false });
    }
  };

  // Get current state snapshot
  getState() {
    return { ...this.state };
  }
}

// Test scenarios
async function runCompleteFlowTest() {
  console.log('=== Complete Flow Test ===\n');

  const dashboard = new MockDashboardScreen();

  // Test 1: Component mount (first load)
  console.log('Test 1: Component mount (first load)');
  await dashboard.componentDidMount();
  console.log('Initial state:', dashboard.getState());
  console.log('');

  // Test 2: Screen focus (navigation)
  console.log('Test 2: Screen focus (navigation)');
  await dashboard.onFocus();
  console.log('After focus state:', dashboard.getState());
  console.log('');

  // Test 3: App background/foreground
  console.log('Test 3: App background/foreground');
  appState = 'background';
  appStateListeners.forEach(listener => listener('background'));

  // Simulate time passing (next day)
  mockDate = new Date('2024-01-02T10:00:00Z');
  mockApiResponses.shakesToday = []; // No shakes for new day

  appState = 'active';
  appStateListeners.forEach(listener => listener('active'));
  console.log('After app resume (next day):', dashboard.getState());
  console.log('');

  // Test 4: Pull to refresh
  console.log('Test 4: Pull to refresh');
  await dashboard.onRefresh();
  console.log('After refresh state:', dashboard.getState());
  console.log('');

  // Test 5: Timer updates
  console.log('Test 5: Timer updates');
  // Simulate 5 minutes passing
  mockDate = new Date(mockDate.getTime() + 5 * 60 * 1000);
  await new Promise(resolve => setTimeout(resolve, 100)); // Allow timer to update
  console.log('Timer updated state:', dashboard.getState());
  console.log('');

  // Test 6: Component unmount
  console.log('Test 6: Component unmount');
  dashboard.componentWillUnmount();
  console.log('Final state before unmount:', dashboard.getState());
  console.log('');

  console.log('=== Complete Flow Test Complete ===');
}

// Run the test
runCompleteFlowTest().catch(console.error);
