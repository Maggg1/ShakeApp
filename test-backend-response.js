// Test script to check what the backend is actually returning
// This will help identify if the issue is with the backend date filtering

const API_BASE_URL = 'https://adminmanagementsystem.up.railway.app';

async function testBackendResponse() {
  console.log('=== Testing Backend Response ===\n');

  try {
    // Test 1: Get all shakes without date filter
    console.log('Test 1: Getting all shakes (no date filter)');
    const allResponse = await fetch(`${API_BASE_URL}/api/shakes`);
    const allData = await allResponse.json();
    console.log('All shakes response status:', allResponse.status);
    console.log('All shakes count:', Array.isArray(allData) ? allData.length : 'N/A');
    console.log('All shakes data:', allData);
    console.log('');

    // Test 2: Get shakes with today's date filter
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayDate = `${yyyy}-${mm}-${dd}`;

    console.log('Test 2: Getting shakes with date filter');
    console.log('Today\'s date:', todayDate);
    const todayResponse = await fetch(`${API_BASE_URL}/api/shakes?date=${todayDate}`);
    const todayData = await todayResponse.json();
    console.log('Today shakes response status:', todayResponse.status);
    console.log('Today shakes count:', Array.isArray(todayData) ? todayData.length : 'N/A');
    console.log('Today shakes data:', todayData);
    console.log('');

    // Test 3: Check if backend supports date filtering
    console.log('Test 3: Analyzing backend behavior');
    if (Array.isArray(allData) && Array.isArray(todayData)) {
      console.log('Backend supports date filtering:', allData.length !== todayData.length);
      console.log('All shakes:', allData.length);
      console.log('Today shakes:', todayData.length);

      if (allData.length === todayData.length && allData.length > 0) {
        console.log('❌ BACKEND ISSUE: Backend is not filtering by date!');
        console.log('The backend is returning all shakes regardless of date filter.');
      } else if (todayData.length === 0) {
        console.log('✅ Backend is filtering correctly - no shakes today');
      } else {
        console.log('✅ Backend is filtering correctly');
      }
    } else {
      console.log('❌ BACKEND ISSUE: Backend not returning arrays');
      console.log('All data type:', typeof allData, Array.isArray(allData) ? 'array' : 'not array');
      console.log('Today data type:', typeof todayData, Array.isArray(todayData) ? 'array' : 'not array');
    }
    console.log('');

    // Test 4: Check shake timestamps if available
    if (Array.isArray(todayData) && todayData.length > 0) {
      console.log('Test 4: Analyzing shake timestamps');
      todayData.forEach((shake, index) => {
        console.log(`Shake ${index + 1}:`, {
          id: shake.id || shake._id,
          timestamp: shake.timestamp,
          createdAt: shake.createdAt,
          date: shake.date
        });
      });
    }

  } catch (error) {
    console.error('❌ Error testing backend:', error);
  }
}

testBackendResponse();
