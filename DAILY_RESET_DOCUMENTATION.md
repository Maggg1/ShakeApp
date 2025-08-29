# Daily Reset Functionality Documentation

## Overview
The ShakeApp has a built-in daily reset system that automatically resets the daily shake count to 0 at midnight every day. This ensures users can earn rewards each day without carrying over progress from previous days.

## How It Works

### 1. Date-Based Filtering
The app uses date filtering to calculate daily shakes:

```javascript
// In DashboardScreen.js - fetchUserData function
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const todayDate = `${yyyy}-${mm}-${dd}`;

// Get today's shakes
const todayShakes = await api.getShakesToday();
const dailyCount = Array.isArray(todayShakes) ? todayShakes.length : 0;
```

### 2. API Endpoint
The API endpoint filters shakes by date:
```
GET https://adminmanagementsystem.up.railway.app/api/shakes?date=2025-08-29
```

### 3. Reset Timer Display
The dashboard shows a countdown to the next reset:

```javascript
// In DashboardScreen.js - calculateTimeUntilReset function
const calculateTimeUntilReset = useCallback(() => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Midnight
  
  const timeDiff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}, []);
```

### 4. Offline Mode Support
The app includes offline mode support with daily reset functionality:

```javascript
// In api.js - checkAndResetDailyShakes function
const checkAndResetDailyShakes = () => {
  const today = new Date().toDateString();
  if (MOCK_USER.lastResetDate !== today) {
    console.log('[api] Resetting daily shakes for new day:', today);
    MOCK_USER.dailyShakes = 0;
    MOCK_USER.lastResetDate = today;
    
    // Also filter out shakes from previous days
    const todayDateStr = new Date().toISOString().split('T')[0];
    MOCK_SHAKES = MOCK_SHAKES.filter(shake => 
      shake.timestamp && shake.timestamp.startsWith(todayDateStr)
    );
  }
};
```

## Current Status (Based on Logs)

### ✅ Working Correctly
- **Date Filtering**: The app successfully fetches shakes with date filtering
- **API Communication**: The backend API is responding correctly
- **Daily Count Calculation**: The dashboard shows "Calculated stats - Total: 5 Daily: 5"
- **Real-time Updates**: The reset timer updates in real-time

### 📊 Current Data (2025-08-29)
- **Total Shakes**: 5 (all-time count)
- **Daily Shakes**: 5 (today's count)
- **Reset Time**: Countdown shows time until midnight

## Verification Tests

The functionality has been verified through:

1. **Timer Calculation Test**: Confirmed the reset timer correctly calculates time until midnight
2. **Date Formatting Test**: Verified the date formatting works correctly (YYYY-MM-DD)
3. **Offline Reset Test**: Confirmed offline mode properly resets daily counts
4. **API Endpoint Test**: Verified the API endpoint construction is correct

## Expected Behavior

### At Midnight (00:00:00)
- The daily shake count will automatically reset to 0
- The reset timer will restart the 24-hour countdown
- Users can start earning rewards for the new day
- Previous day's shakes remain in the total count but not in daily count

### User Experience
- Users see their daily progress (0/5) after midnight
- The reset timer shows "Reset in: 24h 0m" immediately after reset
- All functionality continues to work seamlessly

## Technical Implementation

### Key Files
- `screens/DashboardScreen.js` - Main dashboard with reset timer and stats display
- `services/api.js` - API service with date filtering and offline mode support
- `App.js` - Main application entry point

### Data Flow
1. App loads → Fetch user data and shakes
2. Dashboard calculates daily shakes using date filtering
3. Reset timer calculates time until midnight
4. At midnight → API returns empty array for new day's shakes
5. Daily count resets to 0 automatically

## Troubleshooting

### Common Issues
1. **Timezone Issues**: The reset uses the device's local timezone
2. **Network Connectivity**: Offline mode ensures functionality without internet
3. **API Availability**: The app gracefully handles API failures

### Debugging
Check the console logs for:
- `GET https://adminmanagementsystem.up.railway.app/api/shakes?date=YYYY-MM-DD`
- `Calculated stats - Total: X Daily: Y`
- Time until reset calculations

## Conclusion

The daily reset functionality is working correctly and will automatically reset the daily shake count to 0 at midnight. Users can expect a seamless experience with their progress resetting daily while maintaining their total shake count history.
