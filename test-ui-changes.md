np# UI Changes Test Plan

## Changes Made:
1. **ShakesHistoryScreen**: Updated to show "Shaked and received: X coins" format
2. **RecentActivityScreen**: 
   - Filtered to show only yesterday and today's activities
   - Updated activity text to match dashboard format
   - Added support for both `metadata.reward` and `reward` fields

## Test Cases:

### 1. ShakesHistoryScreen Tests
- [ ] Verify "Shaked and received: X coins" text appears for shakes with rewards
- [ ] Verify regular "Shake" text appears for shakes without rewards
- [ ] Check that reward descriptions are displayed when available
- [ ] Test UI responsiveness and layout consistency
- [ ] Verify date formatting works correctly

### 2. RecentActivityScreen Tests  
- [ ] Verify only yesterday and today's activities are shown
- [ ] Check that older activities are filtered out
- [ ] Test "Shaked and received: X coins" format for shake activities
- [ ] Verify other activity types (feedback, profile updates) still work
- [ ] Test UI layout and responsiveness

### 3. Integration Tests
- [ ] Verify both screens work with mock data containing rewards
- [ ] Test edge cases (no activities, activities from different days)
- [ ] Check that the screens handle API errors gracefully

## Test Data Needed:
- Shakes with rewards (both metadata.reward and reward fields)
- Shakes without rewards
- Activities from yesterday, today, and older dates
- Different activity types (shake, feedback, profile_update)

## Expected Results:
- Both screens should display consistent "Shaked and received: X coins" format
- RecentActivityScreen should only show yesterday and today's activities
- UI should remain responsive and visually consistent
- Error handling should work properly
