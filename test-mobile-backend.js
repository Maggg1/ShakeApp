// Test script to check mobile backend connection from Expo perspective
const { getBackendUrl } = require('./config/unified-backend');

console.log('🧪 Testing Mobile Backend Connection for Expo');
console.log('=============================================');

const testBackendConnection = async () => {
  try {
    const backendUrl = getBackendUrl();
    console.log('📱 Backend URL from config:', backendUrl);
    
    // Test if this is localhost (which won't work in Expo)
    if (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1')) {
      console.log('❌ WARNING: Using localhost in Expo mobile app');
      console.log('   Mobile apps cannot access localhost directly.');
      console.log('   You need to:');
      console.log('   1. Use your computer\'s IP address instead of localhost');
      console.log('   2. Or use a tunneling service like ngrok');
      console.log('   3. Or deploy your backend to a cloud service');
    }
    
    // Test the connection
    console.log('\n🔗 Testing connection to backend...');
    try {
      const response = await fetch(`${backendUrl}/health`);
      const data = await response.json();
      console.log('✅ Backend health check:', data.status);
      console.log('✅ Backend is accessible from this environment');
    } catch (error) {
      console.log('❌ Backend connection failed:', error.message);
      console.log('   This could be due to:');
      console.log('   1. Backend server not running');
      console.log('   2. CORS issues');
      console.log('   3. Network configuration');
    }
    
    // Test registration endpoint specifically
    console.log('\n👤 Testing registration endpoint...');
    try {
      // Generate a unique email for testing
      const timestamp = Date.now();
      const testEmail = `test${timestamp}@example.com`;
      
      const testPayload = {
        name: 'Test User',
        email: testEmail,
        password: 'testpassword123'
      };
      
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });
      
      console.log('📋 Registration endpoint status:', response.status);
      
      let responseData;
      try {
        responseData = await response.json();
        console.log('📋 Response data:', JSON.stringify(responseData, null, 2));
      } catch (e) {
        console.log('📋 No JSON response body');
      }
      
      if (response.status === 201 || response.status === 200) {
        console.log('✅ Registration endpoint is working correctly');
      } else if (response.status === 400) {
        console.log('⚠️  Registration endpoint exists but returned validation error');
      } else if (response.status === 409) {
        console.log('⚠️  Registration endpoint exists - email conflict (user already exists)');
      } else if (response.status === 404) {
        console.log('❌ Registration endpoint not found (404)');
      } else {
        console.log('⚠️  Registration endpoint returned:', response.status);
      }
      
    } catch (error) {
      console.log('❌ Registration endpoint test failed:', error.message);
      if (error.message.includes('CORS')) {
        console.log('🚨 CORS ERROR DETECTED!');
        console.log('   The backend needs CORS configuration to accept requests from your app');
        console.log('   Add this to your backend server:');
        console.log('   - Allow origin: https://your-expo-app.com (or *)');
        console.log('   - Allow methods: GET, POST, PUT, DELETE, OPTIONS');
        console.log('   - Allow headers: Content-Type, Authorization');
      }
    }
    
  } catch (error) {
    console.error('Error testing backend:', error.message);
  }
};

testBackendConnection().catch(console.error);
