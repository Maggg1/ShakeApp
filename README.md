# ShakeApp - React Native App

A React Native application with MongoDB API authentication and user management.

## Features

### Authentication
- **User Registration**: Complete signup flow with direct MongoDB API integration
- **User Login**: Secure authentication with MongoDB API
- **Password Management**: Forgot password functionality with MongoDB API

### UI/UX Improvements
- **Modern Design**: Beautiful gradient backgrounds and card-based layouts
- **Smooth Animations**: Entrance animations and interactive feedback
- **Enhanced Forms**: Better input styling with labels and validation
- **Password Visibility**: Toggle password visibility for better UX
- **Responsive Layout**: Optimized for different screen sizes

### Core Functionality
- **Shake Tracking**: Record and track phone shakes with daily limits
- **User Profile**: Manage user profile and avatar selection
- **Activity History**: View recent shake activities and feedback
- **Feedback System**: Submit user feedback and ratings

## Technical Implementation

### MongoDB API Integration
- Direct MongoDB API calls for authentication
- Custom API service for user management
- Secure token-based authentication
- Real-time data synchronization

### Navigation
- Stack-based navigation with React Navigation
- Seamless flow between authentication screens
- Proper screen transitions and state management

### State Management
- Local state for form inputs and UI states
- API state synchronization
- Proper error handling and user feedback

## File Structure

```
screens/
├── SignupScreen.js          # User registration with MongoDB API
├── LoginScreen.js           # User login with MongoDB API
├── ForgotPasswordScreen.js  # Password reset functionality
├── DashboardScreen.js       # Main dashboard with user stats
├── ProfileScreen.js         # User profile management
├── ShakeScreen.js          # Shake tracking functionality
├── ShakesHistoryScreen.js  # Shake activity history
├── RecentActivtyScreen.js  # Recent user activities
├── FeedbackScreen.js       # User feedback submission
└── ...                      # Other screens

services/
└── api.js                  # MongoDB API service layer

App.js                      # Main application navigation
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure MongoDB API:
   - Ensure your MongoDB API endpoints are properly configured
   - Update API base URL in `services/api.js` if needed

3. Run the app:
   ```bash
   npm start
   ```

## Dependencies

- React Native
- React Navigation
- Expo Linear Gradient
- AsyncStorage for persistence
- Axios for API calls

## Security Features

- Secure token-based authentication
- Password strength validation
- Rate limiting for failed login attempts
- User data validation and sanitization
- Secure API communication

## API Endpoints Used

- User registration (`/api/auth/register`)
- User login (`/api/auth/login`)
- Password reset (`/api/auth/forgot-password`)
- User profile management (`/api/user/profile`)
- Shake recording (`/api/shakes/record`)
- Activity tracking (`/api/activities`)
- Feedback submission (`/api/feedback`)

## Future Enhancements

- Enhanced user profile customization
- Social features and user connections
- Advanced analytics and reporting
- Push notifications
- Multi-language support
