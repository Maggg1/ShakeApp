# Firebase Auth Removal & MongoDB Direct Login Implementation

## Phase 1: Remove Firebase Dependencies
- [ ] Delete `firebase.js`
- [ ] Delete `services/firebaseAuth.js`
- [ ] Update `package.json` to remove Firebase packages
- [ ] Remove Firebase imports from all screens

## Phase 2: Update Authentication Screens
- [ ] Update `screens/LoginScreen.js` - Replace Firebase with direct MongoDB login
- [ ] Update `screens/SignupScreen.js` - Replace Firebase with direct MongoDB registration
- [ ] Update `screens/ForgotPasswordScreen.js` - Replace Firebase with MongoDB password reset
- [ ] Update `screens/SettingsPasswordResetScreen.js` - Update to use MongoDB

## Phase 3: Update Other Screens
- [ ] Update `screens/DashboardScreen.js` - Remove Firebase auth checks
- [ ] Update `screens/ProfileScreen.js` - Remove Firebase auth
- [ ] Update `screens/ShakeScreen.js` - Remove Firebase auth
- [ ] Update `screens/ShakesHistoryScreen.js` - Remove Firebase auth
- [ ] Update `screens/RecentActivtyScreen.js` - Remove Firebase auth
- [ ] Update `screens/FeedbackScreen.js` - Remove Firebase auth

## Phase 4: Final Cleanup
- [ ] Test all authentication flows
- [ ] Verify MongoDB endpoints work correctly
- [ ] Update any remaining Firebase references
