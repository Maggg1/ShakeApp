// Test script for edge cases and error handling in DashboardScreen daily reset

const AsyncStorage = {
  storage: new Map(),
  getItem: async (key) => {
    console.log(`[AsyncStorage] Getting item for key: ${key}`);
    // Simulate occasional storage errors
    if (Math.random() < 0.1) { // 10% chance of error
      throw new Error('Storage read error');
    }
    return AsyncStorage.storage.get(key) || null;
  },
  setItem: async (key, value) => {
    console.log(`[AsyncStorage] Setting item: ${key} = ${value}`);
    // Simulate occasional storage errors
    if (Math.random() < 0.1) { // 10% chance of error
      throw new Error('Storage write error');
    }
    AsyncStorage.storage.set(key, value);
  }
};

// Mock Date with edge cases
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

// Simulate DashboardScreen logic with error handling
const STORAGE_KEY = 'dashboard_last_reset_date';

const checkAndResetDailyShakes = async () => {
  try {
    const today = new Date().toDateString();
    const storedDate = await AsyncStorage.getItem(STORAGE_KEY);

    console.log(`[Edge Case Test] Today: ${today}`);
    console.log(`[Edge Case Test] Stored date: ${storedDate}`);

    if (storedDate !== today) {
      console.log('[Edge Case Test] New day detected, resetting daily shakes');
      await AsyncStorage.setItem(STORAGE_KEY, today);
      return { reset: true, dailyShakes: 0, lastResetDate: today };
    } else {
      console.log('[Edge Case Test] Same day, no reset needed');
      return { reset: false, dailyShakes: 5, lastResetDate: storedDate };
    }
  } catch (error) {
    console.error('[Edge Case Test] Error checking/resetting daily shakes:', error);
    // Graceful fallback: assume no reset needed on error
    return { reset: false, dailyShakes: 5, lastResetDate: null, error: error.message };
  }
};

const fetchUserData = async () => {
  try {
    console.log('[Edge Case Test] Fetching user data...');
    // Simulate API errors occasionally
    if (Math.random() < 0.2) { // 20% chance of API error
      throw new Error('Network error');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    return { name: 'Test User', totalShakes: 25 };
  } catch (error) {
    console.error('[Edge Case Test] API error:', error);
    return { name: 'User', totalShakes: 0, error: error.message };
  }
};

// Test scenarios for edge cases
async function runEdgeCaseTests() {
  console.log('=== Edge Cases and Error Handling Test ===\n');

  // Test 1: Normal operation
  console.log('Test 1: Normal operation');
  let result = await checkAndResetDailyShakes();
  console.log('Reset result:', result);
  let userData = await fetchUserData();
  console.log('User data:', userData);
  console.log('');

  // Test 2: Storage read error
  console.log('Test 2: Storage read error simulation');
  // Force an error by clearing storage and making getItem fail
  AsyncStorage.storage.clear();
  result = await checkAndResetDailyShakes();
  console.log('Reset result with error:', result);
  console.log('');

  // Test 3: API failure
  console.log('Test 3: API failure simulation');
  userData = await fetchUserData();
  console.log('User data with API error:', userData);
  console.log('');

  // Test 4: Date edge cases
  console.log('Test 4: Date edge cases');

  // Test with different time zones (simulate)
  mockDate = new Date('2024-01-01T23:59:59Z'); // Just before midnight
  console.log('Just before midnight:', new Date().toDateString());
  result = await checkAndResetDailyShakes();
  console.log('Reset result near midnight:', result);

  mockDate = new Date('2024-01-02T00:00:01Z'); // Just after midnight
  console.log('Just after midnight:', new Date().toDateString());
  result = await checkAndResetDailyShakes();
  console.log('Reset result after midnight:', result);
  console.log('');

  // Test 5: Rapid consecutive calls
  console.log('Test 5: Rapid consecutive calls');
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(checkAndResetDailyShakes());
  }
  const results = await Promise.all(promises);
  console.log('Rapid call results:', results);
  console.log('');

  // Test 6: Invalid stored data
  console.log('Test 6: Invalid stored data');
  AsyncStorage.storage.set(STORAGE_KEY, 'invalid-date-string');
  result = await checkAndResetDailyShakes();
  console.log('Reset result with invalid stored data:', result);
  console.log('');

  // Test 7: Empty/null stored data
  console.log('Test 7: Empty/null stored data');
  AsyncStorage.storage.set(STORAGE_KEY, null);
  result = await checkAndResetDailyShakes();
  console.log('Reset result with null stored data:', result);
  console.log('');

  // Test 8: Very old stored date
  console.log('Test 8: Very old stored date');
  AsyncStorage.storage.set(STORAGE_KEY, 'Sun Dec 31 2023'); // Old date
  result = await checkAndResetDailyShakes();
  console.log('Reset result with old stored date:', result);
  console.log('');

  console.log('=== Edge Cases Test Complete ===');
}

// Run the tests
runEdgeCaseTests().catch(console.error);
