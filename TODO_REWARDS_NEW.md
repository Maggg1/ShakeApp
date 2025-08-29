# Reward Display Enhancement Plan

## Goal: Change shake history and recent activity screens to show "received X coins" format

### Files to Modify:
- [x] screens极速赛车开奖直播
- [x] screens/ShakesHistoryScreen.js - Enhance reward display
- [x] screens/RecentActivtyScreen.js - Improve reward text formatting
- [ ] screens/DashboardScreen.js - Update activity display format

### Implementation Details:

1. **ShakesHistoryScreen.js**:
   - ✅ Added function to parse reward names and extract coin amounts
   - ✅ Updated renderShakeItem to show "received X coins" format
   - ✅ Maintained existing reward badge styling but improved text

2. **RecentActivtyScreen.js**:
   - Enhance getActivityText function to parse reward names
   - Show "received X coins" format for shake activities with rewards
   - Ensure consistency with other screens

3. **DashboardScreen.js**:
   - Update activity title generation for shake rewards
   - Use same parsing logic as other screens

### Progress:
- [x] ShakesHistoryScreen.js - Completed
- [ ] RecentActivtyScreen.js - In Progress  
- [ ] DashboardScreen.js - Pending
- [ ] Testing - Pending
