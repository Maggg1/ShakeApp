// Test script for AppState handling in DashboardScreen
// This simulates app state changes and verifies the reset logic

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

// Simulate DashboardScreen AppState logic
const STORAGE_KEY = 'dashboard_last_reset_date';

const checkAndResetDailyShakes = async () => {
  try {
    const today = new Date().toDateString();
    const storedDate = await AsyncStorage.getItem(STORAGE_KEY);

    console.log(`[AppState Test] Today: ${today}`);
    console.log(`[AppState Test] Stored date: ${storedDate}`);

    if (storedDate !== today) {
      console.log('[AppState Test] New day detected, resetting daily shakes');
      await AsyncStorage.setItem(STORAGE_KEY, today);
      return { reset: true, dailyShakes: 0, lastResetDate: today };
    } else {
      console.log('[AppState Test] Same day, no reset needed');
      return { reset: false, dailyShakes: 5, lastResetDate: storedDate };
    }
  } catch (error) {
    console.error('[AppState Test] Error checking/resetting daily shakes:', error);
    return { error: error.message };
  }
};

const fetchUserData = async () => {
  console.log('[AppState Test] Fetching user data...');
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));
  return { name: 'Test User' };
};

// Simulate the useEffect for AppState
const handleAppStateChange = async (nextAppState) => {
  console.log(`[AppState Test] App state changed to: ${nextAppState}`);

  if (nextAppState === 'active') {
    console.log('[AppState Test] App became active, checking for daily reset');
    const resetResult = await checkAndResetDailyShakes();
    const userData = await fetchUserData();

    console.log('[AppState Test] Reset result:', resetResult);
    console.log('[AppState Test] User data:', userData);
  }
};

// Set up AppState listener (simulating the useEffect)
const subscription = AppState.addEventListener('change', handleAppStateChange);

// Test scenarios
async function runAppStateTests() {
  console.log('=== AppState Handling Test ===\n');

  // Initialize with first day
  console.log('Initializing app...');
  await checkAndResetDailyShakes();
  console.log('');

  // Test 1: App goes to background and comes back same day
  console.log('Test 1: App background/foreground same day');
  appState = 'background';
  appStateListeners.forEach(listener => listener('background'));

  appState = 'active';
  appStateListeners.forEach(listener => listener('active'));
  console.log('');

  // Test 2: Simulate next day while app is in background
  console.log('Test 2: Next day while app in background');
  mockDate = new Date('2024-01-02T10:00:00Z'); // Next day

  appState = 'active';
  appStateListeners.forEach(listener => listener('active'));
  console.log('');

  // Test 3: App goes inactive then active again
  console.log('Test 3: App inactive/active cycle');
  appState = 'inactive';
  appStateListeners.forEach(listener => listener('inactive'));

  appState = 'active';
  appStateListeners.forEach(listener => listener('active'));
  console.log('');

  // Test 4: Multiple state changes
  console.log('Test 4: Multiple rapid state changes');
  const states = ['background', 'active', 'inactive', 'active', 'background', 'active'];
  for (const state of states) {
    appState = state;
    appStateListeners.forEach(listener => listener(state));
    await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
  }
  console.log('');

  // Clean up
  subscription.remove();

  console.log('=== AppState Test Complete ===');
}

// Run the tests
runAppStateTests().catch(console.error);
