// Test script to check what the backend is actually returning for activities
// This will help identify if the issue is with the API response or the frontend parsing

const fetch = require('node-fetch');

async function testBackendActivities() {
  console.log('=== Backend Activities Test ===\n');

  // Test the actual backend API call
  const API_BASE_URL = 'http://localhost:3000'; // Adjust this to your backend URL
  const endpoint = '/api/activities?type=shake&limit=50';

  console.log('Testing backend endpoint:', API_BASE_URL + endpoint);

  try {
    console.log('Making API call...');
    const response = await fetch(API_BASE_URL + endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if needed
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Raw response text length:', responseText.length);

    if (responseText.length > 500) {
      console.log('Raw response (first 500 chars):', responseText.substring(0, 500) + '...');
    } else {
      console.log('Raw response:', responseText);
    }

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ Successfully parsed JSON response');

        if (Array.isArray(data)) {
          console.log('Response is an array with', data.length, 'items');

          if (data.length > 0) {
            console.log('\nFirst activity sample:');
            console.log(JSON.stringify(data[0], null, 2));

            console.log('\nAnalyzing timestamps in activities...');
            data.forEach((activity, index) => {
              if (index < 5) { // Only check first 5
                console.log(`\nActivity ${index + 1}:`);
                console.log('- ID:', activity.id || activity._id);
                console.log('- Type:', activity.type);
                console.log('- Timestamp:', activity.timestamp);
                console.log('- CreatedAt:', activity.createdAt);
                console.log('- UpdatedAt:', activity.updatedAt);

                // Check if timestamp is from today
                const timestamp = activity.timestamp || activity.createdAt || activity.updatedAt;
                if (timestamp) {
                  let parsedDate;
                  if (typeof timestamp === 'number') {
                    parsedDate = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
                  } else if (typeof timestamp === 'string') {
                    const numeric = Number(timestamp);
                    if (!isNaN(numeric)) {
                      parsedDate = new Date(numeric < 1e12 ? numeric * 1000 : numeric);
                    } else {
                      parsedDate = new Date(timestamp);
                    }
                  } else if (timestamp && timestamp.seconds) {
                    parsedDate = new Date(timestamp.seconds * 1000);
                  }

                  if (parsedDate && !isNaN(parsedDate.getTime())) {
                    const today = new Date();
                    const diffDays = Math.floor((today - parsedDate) / (1000 * 60 * 60 * 24));
                    console.log('- Parsed date:', parsedDate.toISOString());
                    console.log('- Days difference from today:', diffDays);
                    console.log('- Would show as:', diffDays === 0 ? 'TODAY' : diffDays === 1 ? 'YESTERDAY' : `${parsedDate.toLocaleDateString()}`);
                  } else {
                    console.log('- Could not parse timestamp');
                  }
                } else {
                  console.log('- No timestamp found');
                }
              }
            });

            // Count how many are from today vs other days
            let todayCount = 0;
            let otherCount = 0;

            data.forEach(activity => {
              const timestamp = activity.timestamp || activity.createdAt || activity.updatedAt;
              if (timestamp) {
                let parsedDate;
                if (typeof timestamp === 'number') {
                  parsedDate = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
                } else if (typeof timestamp === 'string') {
                  const numeric = Number(timestamp);
                  if (!isNaN(numeric)) {
                    parsedDate = new Date(numeric < 1e12 ? numeric * 1000 : numeric);
                  } else {
                    parsedDate = new Date(timestamp);
                  }
                } else if (timestamp && timestamp.seconds) {
                  parsedDate = new Date(timestamp.seconds * 1000);
                }

                if (parsedDate && !isNaN(parsedDate.getTime())) {
                  const today = new Date();
                  const diffDays = Math.floor((today - parsedDate) / (1000 * 60 * 60 * 24));
                  if (diffDays === 0) {
                    todayCount++;
                  } else {
                    otherCount++;
                  }
                }
              }
            });

            console.log(`\n📊 Summary:`);
            console.log(`- Total activities: ${data.length}`);
            console.log(`- From today: ${todayCount}`);
            console.log(`- From other days: ${otherCount}`);

            if (todayCount === data.length && data.length > 0) {
              console.log('\n🚨 ISSUE FOUND: All activities are from today!');
              console.log('This explains why everything shows as "Today" in the UI.');
            } else if (otherCount > 0) {
              console.log('\n✅ Activities span multiple days - timestamp parsing should work correctly.');
            }

          } else {
            console.log('Response array is empty');
          }
        } else {
          console.log('Response is not an array:', typeof data);
          console.log('Response structure:', Object.keys(data));
        }

      } catch (parseError) {
        console.log('❌ Failed to parse JSON response:', parseError.message);
        console.log('This might indicate the backend is returning HTML error pages instead of JSON');
      }
    } else {
      console.log('❌ API call failed with status:', response.status);
      console.log('This could be due to:');
      console.log('- Backend server not running');
      console.log('- Incorrect API endpoint');
      console.log('- Authentication issues');
      console.log('- CORS issues');
    }

  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('This could be due to:');
    console.log('- Backend server not accessible');
    console.log('- Network connectivity issues');
    console.log('- Firewall blocking requests');
  }

  console.log('\n=== Backend Activities Test Complete ===');
}

testBackendActivities();
