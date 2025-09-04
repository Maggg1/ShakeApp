// Test script to check backend connectivity and API responses

const API_BASE_URL = 'https://adminmanagementsystem.up.railway.app';

async function testBackendConnectivity() {
  console.log('=== Testing Backend Connectivity ===\n');

  try {
    // Test 1: Check basic connectivity
    console.log('Test 1: Testing basic backend connectivity');
    try {
      const rootResponse = await fetch(`${API_BASE_URL}/`);
      console.log('Root endpoint status:', rootResponse.status);
      const rootText = await rootResponse.text();
      console.log('Root response type:', rootResponse.headers.get('content-type'));
      console.log('Root response (first 200 chars):', rootText.substring(0, 200));
    } catch (e) {
      console.log('❌ Cannot connect to backend root:', e.message);
    }
    console.log('');

    // Test 2: Check API endpoint availability
    console.log('Test 2: Testing API endpoint availability');
    const endpoints = ['/api', '/api/shakes', '/api/auth', '/api/users'];
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        console.log(`${endpoint}: ${response.status} (${response.headers.get('content-type')})`);
      } catch (e) {
        console.log(`${endpoint}: ❌ Connection failed - ${e.message}`);
      }
    }
    console.log('');

    // Test 3: Try shakes endpoint with different approaches
    console.log('Test 3: Testing shakes endpoint responses');

    // Try without date filter
    try {
      console.log('Trying /api/shakes without date filter...');
      const response = await fetch(`${API_BASE_URL}/api/shakes`);
      const text = await response.text();
      console.log('Status:', response.status);
      console.log('Content-Type:', response.headers.get('content-type'));

      if (response.headers.get('content-type')?.includes('application/json')) {
        try {
          const data = JSON.parse(text);
          console.log('✅ JSON Response received');
          console.log('Data type:', typeof data);
          console.log('Is array:', Array.isArray(data));
          if (Array.isArray(data)) {
            console.log('Array length:', data.length);
          }
        } catch (e) {
          console.log('❌ JSON parse error:', e.message);
        }
      } else {
        console.log('❌ Not JSON response');
        console.log('Response preview:', text.substring(0, 300));
      }
    } catch (e) {
      console.log('❌ Request failed:', e.message);
    }
    console.log('');

    // Try with date filter
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayDate = `${yyyy}-${mm}-${dd}`;

      console.log(`Trying /api/shakes?date=${todayDate}...`);
      const response = await fetch(`${API_BASE_URL}/api/shakes?date=${todayDate}`);
      const text = await response.text();
      console.log('Status:', response.status);
      console.log('Content-Type:', response.headers.get('content-type'));

      if (response.headers.get('content-type')?.includes('application/json')) {
        try {
          const data = JSON.parse(text);
          console.log('✅ JSON Response received');
          console.log('Data type:', typeof data);
          console.log('Is array:', Array.isArray(data));
          if (Array.isArray(data)) {
            console.log('Array length:', data.length);
          }
        } catch (e) {
          console.log('❌ JSON parse error:', e.message);
        }
      } else {
        console.log('❌ Not JSON response');
        console.log('Response preview:', text.substring(0, 300));
      }
    } catch (e) {
      console.log('❌ Request failed:', e.message);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testBackendConnectivity();
