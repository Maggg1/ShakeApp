// Test script to check CORS configuration on the backend
const { getBackendUrl } = require('./config/unified-backend');

console.log('🔍 Testing CORS Configuration');
console.log('=============================');

const testCORS = async () => {
  const backendUrl = getBackendUrl();
  console.log('Backend URL:', backendUrl);

  // Test OPTIONS request (preflight)
  console.log('\n1. Testing OPTIONS preflight request...');
  try {
    const optionsResponse = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://expo.dev',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    console.log('OPTIONS Status:', optionsResponse.status);
    console.log('OPTIONS Headers:');
    optionsResponse.headers.forEach((value, name) => {
      if (name.toLowerCase().includes('access-control')) {
        console.log(`  ${name}: ${value}`);
      }
    });

    if (optionsResponse.status === 204) {
      console.log('✅ OPTIONS preflight successful');
    } else {
      console.log('⚠️  OPTIONS preflight returned:', optionsResponse.status);
    }
  } catch (error) {
    console.log('❌ OPTIONS preflight failed:', error.message);
  }

  // Test actual POST request with Origin header
  console.log('\n2. Testing POST request with Origin header...');
  try {
    const timestamp = Date.now();
    const testEmail = `cors_test${timestamp}@example.com`;
    
    const postResponse = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://expo.dev'
      },
      body: JSON.stringify({
        name: 'CORS Test User',
        email: testEmail,
        password: 'testpassword123'
      })
    });

    console.log('POST Status:', postResponse.status);
    console.log('POST CORS Headers:');
    postResponse.headers.forEach((value, name) => {
      if (name.toLowerCase().includes('access-control')) {
        console.log(`  ${name}: ${value}`);
      }
    });

    if (postResponse.ok) {
      console.log('✅ POST request successful with CORS headers');
    } else {
      console.log('⚠️  POST request returned:', postResponse.status);
    }
  } catch (error) {
    console.log('❌ POST request failed:', error.message);
    if (error.message.includes('CORS') || error.message.includes('Origin')) {
      console.log('🚨 CORS ISSUE DETECTED!');
      console.log('The backend is blocking requests from different origins.');
    }
  }

  // Test without Origin header (simulating same-origin)
  console.log('\n3. Testing POST request without Origin header...');
  try {
    const timestamp = Date.now();
    const testEmail = `no_origin_test${timestamp}@example.com`;
    
    const postResponse = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'No Origin Test User',
        email: testEmail,
        password: 'testpassword123'
      })
    });

    console.log('POST Status (no Origin):', postResponse.status);

    if (postResponse.ok) {
      console.log('✅ POST request successful without Origin header');
    } else {
      console.log('⚠️  POST request returned:', postResponse.status);
    }
  } catch (error) {
    console.log('❌ POST request failed:', error.message);
  }
};

testCORS().catch(console.error);
