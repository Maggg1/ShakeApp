// Backend configuration for different environments

// Development - localhost
const DEVELOPMENT = {
  USER_BACKEND: 'http://localhost:4001',
  ADMIN_BACKEND: 'http://localhost:3000',
};

// Production - your actual deployed domains
const PRODUCTION = {
  USER_BACKEND: 'https://adminmanagementsystem.up.railway.app', // Single backend for both
  ADMIN_BACKEND: 'https://adminmanagementsystem.up.railway.app',
};

// Get current environment
const getEnvironment = () => {
  if (__DEV__) return 'development';
  // You can add more environment detection logic here
  return 'production';
};

// Get backend URLs based on environment
export const getBackendConfig = () => {
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

// For easy access to user backend URL
export const getUserBackendUrl = () => getBackendConfig().USER_BACKEND;

// For easy access to admin backend URL  
export const getAdminBackendUrl = () => getBackendConfig().ADMIN_BACKEND;

export default getBackendConfig;