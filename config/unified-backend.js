// Unified backend configuration for single backend approach

// Development - localhost
const DEVELOPMENT = {
  BACKEND: 'http://localhost:4000', // Single backend for both users and admins
};

// Production - your actual deployed domain
const PRODUCTION = {
  BACKEND: 'https://adminmanagementsystem.up.railway.app', // Single backend for both
};

// Staging (optional)
const STAGING = {
  BACKEND: 'https://staging-adminmanagementsystem.up.railway.app', // Single backend for both
};

// Get current environment
const getEnvironment = () => {
  // Check if we're in a React Native environment with __DEV__
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // For mobile development, use production backend since localhost won't work
    return 'production';
  }
  // Check Node.js environment variable
  if (process.env.NODE_ENV === 'development') {
    return 'development';
  }
  // Check if we're running in Expo development
  if (process.env.EXPO_DEVICE_TYPE || process.env.EXPO_PUBLISH_URL) {
    // For Expo mobile development, use production backend
    return 'production';
  }
  // Check if we're in Expo Go (mobile app)
  if (typeof Expo !== 'undefined' || typeof expo !== 'undefined') {
    return 'production'; // Expo Go should use production backend
  }
  // Default to production
  return 'production';
};

// Get backend URL based on environment
const getBackendConfig = () => {
  const env = getEnvironment();
  
  switch (env) {
    case 'development':
      return DEVELOPMENT;
    case 'staging':
      return STAGING;
    case 'production':
    default:
      return PRODUCTION;
  }
};

// For easy access to backend URL
const getBackendUrl = () => getBackendConfig().BACKEND;

module.exports = {
  getBackendConfig,
  getBackendUrl,
  getEnvironment,
  DEVELOPMENT,
  PRODUCTION,
  STAGING
};