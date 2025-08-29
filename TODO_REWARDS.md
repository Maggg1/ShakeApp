# Reward Display Enhancement Plan

## Goal: Change shake history and recent activity screens to show "received X coins" format

### Files to Modify:
- [ ] screens/ShakesHistoryScreen.js - Enhance reward display
- [ ] screens/RecentActivtyScreen.js - Improve reward text formatting
- [ ] screens/DashboardScreen.js - Update activity display format

### Implementation Details:

1. **ShakesHistoryScreen.js**:
   - Add function to parse reward names and extract coin amounts
   - Update renderShakeItem to show "received X coins" format
   - Maintain existing reward badge styling but improve text

2. **RecentActivtyScreen.js**:
   - Enhance getActivityText function to parse reward names
   - Show "received X coins" format for shake activities with rewards
   - Ensure consistency with other screens

3. **DashboardScreen.js**:
   - Update activity title generation for shake rewards
   - Use same parsing logic as other screens

### Progress:
- [ ] ShakesHistoryScreen.js - Completed
- [ ] RecentActivtyScreen.js - Completed  
- [ ] DashboardScreen.js - Completed
- [ ] Testing - Pending
