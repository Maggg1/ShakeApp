// Test script for DashboardScreen daily reset functionality
// This simulates the daily reset logic without running the full React Native app

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

// Mock Date for testing
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

// Simulate DashboardScreen daily reset logic
const STORAGE_KEY = 'dashboard_last_reset_date';

const checkAndResetDailyShakes = async () => {
  try {
    const today = new Date().toDateString();
    const storedDate = await AsyncStorage.getItem(STORAGE_KEY);

    console.log(`[Test] Today: ${today}`);
    console.log(`[Test] Stored date: ${storedDate}`);

    if (storedDate !== today) {
      console.log('[Test] New day detected, resetting daily shakes');
      // setDailyShakes(0);
      // setLastResetDate(today);
      await AsyncStorage.setItem(STORAGE_KEY, today);
      return { reset: true, dailyShakes: 0, lastResetDate: today };
    } else {
      console.log('[Test] Same day, no reset needed');
      return { reset: false, dailyShakes: 5, lastResetDate: storedDate };
    }
  } catch (error) {
    console.error('[Test] Error checking/resetting daily shakes:', error);
    return { error: error.message };
  }
};

const calculateTimeUntilReset = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Midnight

  const timeDiff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
};

// Test scenarios
async function runTests() {
  console.log('=== Daily Reset Dashboard Test ===\n');

  // Test 1: First run (no stored date)
  console.log('Test 1: First run (no stored date)');
  let result = await checkAndResetDailyShakes();
  console.log('Result:', result);
  console.log('Timer until reset:', calculateTimeUntilReset());
  console.log('');

  // Test 2: Same day (should not reset)
  console.log('Test 2: Same day (should not reset)');
  result = await checkAndResetDailyShakes();
  console.log('Result:', result);
  console.log('');

  // Test 3: Next day (should reset)
  console.log('Test 3: Next day (should reset)');
  mockDate = new Date('2024-01-02T10:00:00Z'); // Next day
  result = await checkAndResetDailyShakes();
  console.log('Result:', result);
  console.log('');

  // Test 4: Same day again (should not reset)
  console.log('Test 4: Same day again (should not reset)');
  result = await checkAndResetDailyShakes();
  console.log('Result:', result);
  console.log('');

  // Test 5: Timer calculation at different times
  console.log('Test 5: Timer calculation at different times');

  mockDate = new Date('2024-01-02T23:30:00Z'); // 11:30 PM
  console.log('At 11:30 PM:', calculateTimeUntilReset());

  mockDate = new Date('2024-01-02T23:45:00Z'); // 11:45 PM
  console.log('At 11:45 PM:', calculateTimeUntilReset());

  mockDate = new Date('2024-01-02T23:59:00Z'); // 11:59 PM
  console.log('At 11:59 PM:', calculateTimeUntilReset());

  console.log('\n=== Test Complete ===');
}

// Run the tests
runTests().catch(console.error);
