// Test script to check which backend URL is being used
const { getBackendUrl, getEnvironment } = require('./config/unified-backend');

console.log('Testing backend URL configuration...');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('EXPO_DEVICE_TYPE:', process.env.EXPO_DEVICE_TYPE || 'not set');
console.log('EXPO_PUBLISH_URL:', process.env.EXPO_PUBLISH_URL || 'not set');

try {
  const env = getEnvironment();
  console.log('Detected environment:', env);
  const url = getBackendUrl();
  console.log('Current backend URL:', url);
  console.log('Note: The app is now configured to use http://localhost:4000');
} catch (error) {
  console.error('Error getting backend URL:', error.message);
  console.log('Using fallback URL: http://localhost:4000');
}
