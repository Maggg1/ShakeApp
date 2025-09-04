// Integration test for DashboardScreen with API service
// This tests the complete flow including API calls

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

// Mock API responses
let mockApiResponses = {
  user: {
    id: 'test-user',
    name: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    avatarIndex: 1,
    totalShakes: 25,
    dailyShakes: 3
  },
  shakesToday: [
    { id: 'shake-1', timestamp: '2024-01-01T08:00:00Z' },
    { id: 'shake-2', timestamp: '2024-01-01T09:00:00Z' },
    { id: 'shake-3', timestamp: '2024-01-01T10:00:00Z' }
  ],
  allShakes: Array.from({ length: 25 }, (_, i) => ({
    id: `shake-${i + 1}`,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }))
};

// Mock API service
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
  }
};

// DashboardScreen integration logic
const STORAGE_KEY = 'dashboard_last_reset_date';

const checkAndResetDailyShakes = async () => {
  try {
    const today = new Date().toDateString();
    const storedDate = await AsyncStorage.getItem(STORAGE_KEY);

    console.log(`[Integration] Today: ${today}`);
    console.log(`[Integration] Stored date: ${storedDate}`);

    if (storedDate !== today) {
      console.log('[Integration] New day detected, resetting daily shakes');
      await AsyncStorage.setItem(STORAGE_KEY, today);
      return { reset: true, dailyShakes: 0, lastResetDate: today };
    } else {
      console.log('[Integration] Same day, no reset needed');
      return { reset: false, dailyShakes: mockApiResponses.shakesToday.length, lastResetDate: storedDate };
    }
  } catch (error) {
    console.error('[Integration] Error checking/resetting daily shakes:', error);
    return { reset: false, dailyShakes: 0, lastResetDate: null, error: error.message };
  }
};

const fetchUserData = async () => {
  try {
    console.log('[Integration] Starting user data fetch...');

    const userData = await api.getCurrentUser();
    console.log('[Integration] User data received:', userData);

    if (userData) {
      const name = userData.name || userData.username || (userData.email ? userData.email.split('@')[0] : 'User');

      // Calculate statistics from shake data
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayDate = `${yyyy}-${mm}-${dd}`;

        console.log('[Integration] Fetching today\'s shakes...');
        const todayShakes = await api.getShakesToday();
        const dailyCount = Array.isArray(todayShakes) ? todayShakes.length : 0;

        console.log('[Integration] Checking for daily reset...');
        const resetResult = await checkAndResetDailyShakes();

        let finalDailyCount = dailyCount;
        if (resetResult.reset) {
          finalDailyCount = 0;
        }

        console.log('[Integration] Fetching all shakes...');
        const allShakes = await api.getShakes();
        const totalCount = Array.isArray(allShakes) ? allShakes.length : 0;

        console.log('[Integration] Final stats - Total:', totalCount, 'Daily:', finalDailyCount);

        return {
          username: name,
          avatarIndex: userData.avatarIndex,
          totalShakes: totalCount,
          dailyShakes: finalDailyCount,
          lastResetDate: resetResult.lastResetDate
        };
      } catch (shakeError) {
        console.error('[Integration] Error fetching shake statistics:', shakeError);
        return {
          username: name,
          avatarIndex: userData.avatarIndex,
          totalShakes: 0,
          dailyShakes: 0,
          lastResetDate: null,
          error: shakeError.message
        };
      }
    }
  } catch (error) {
    console.error('[Integration] Error fetching user data:', error);
    return {
      username: 'User',
      avatarIndex: null,
      totalShakes: 0,
      dailyShakes: 0,
      lastResetDate: null,
      error: error.message
    };
  }
};

// Test scenarios
async function runIntegrationTests() {
  console.log('=== Integration Test ===\n');

  // Test 1: Complete first-time user flow
  console.log('Test 1: Complete first-time user flow');
  let dashboardData = await fetchUserData();
  console.log('Dashboard data:', dashboardData);
  console.log('');

  // Test 2: Same day refresh
  console.log('Test 2: Same day refresh');
  dashboardData = await fetchUserData();
  console.log('Dashboard data (same day):', dashboardData);
  console.log('');

  // Test 3: Next day (should reset)
  console.log('Test 3: Next day (should reset)');
  mockDate = new Date('2024-01-02T10:00:00Z'); // Next day

  // Update mock API to have no shakes for new day
  mockApiResponses.shakesToday = [];

  dashboardData = await fetchUserData();
  console.log('Dashboard data (next day):', dashboardData);
  console.log('');

  // Test 4: API error handling
  console.log('Test 4: API error handling');

  // Temporarily break the API
  const originalGetCurrentUser = api.getCurrentUser;
  api.getCurrentUser = async () => {
    throw new Error('API server unavailable');
  };

  dashboardData = await fetchUserData();
  console.log('Dashboard data (API error):', dashboardData);

  // Restore API
  api.getCurrentUser = originalGetCurrentUser;
  console.log('');

  // Test 5: Partial API failure (shakes endpoint fails)
  console.log('Test 5: Partial API failure');

  const originalGetShakes = api.getShakes;
  api.getShakes = async () => {
    throw new Error('Shakes endpoint down');
  };

  dashboardData = await fetchUserData();
  console.log('Dashboard data (partial failure):', dashboardData);

  // Restore API
  api.getShakes = originalGetShakes;
  console.log('');

  console.log('=== Integration Test Complete ===');
}

// Run the tests
runIntegrationTests().catch(console.error);
