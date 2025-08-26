// Quick test script to verify backend connections
const https = require('https');

const testEndpoints = async () => {
  console.log('🧪 Testing Backend Connections...\n');

  // Test local user backend (now unified backend)
  try {
    const response = await fetch('http://localhost:4000/health');
    const data = await response.json();
    console.log('✅ Unified Backend (localhost:4000):', data.status);
  } catch (error) {
    console.log('❌ Unified Backend (localhost:4000): Connection failed');
  }

  // Test production admin backend
  try {
    const response = await fetch('https://adminmanagementsystem.up.railway.app/health');
    const data = await response.json();
    console.log('✅ Production Admin Backend:', data.status);
  } catch (error) {
    console.log('❌ Production Admin Backend: Connection failed');
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Deploy user backend to Railway (see USER_BACKEND_DEPLOYMENT.md)');
  console.log('2. Update USER_BACKEND URL in config/backend.js');
  console.log('3. Test user registration on deployed backend');
  console.log('4. Build Expo app with updated configuration');
};

testEndpoints().catch(console.error);
