# ShakeApp - React Native App

A React Native application with Firebase authentication and email verification.

## Features

### Authentication
- **User Registration**: Complete signup flow with email verification
- **Email Verification**: Required before users can access the app
- **User Login**: Secure authentication with Firebase
- **Password Management**: Forgot password functionality

### UI/UX Improvements
- **Modern Design**: Beautiful gradient backgrounds and card-based layouts
- **Smooth Animations**: Entrance animations and interactive feedback
- **Enhanced Forms**: Better input styling with labels and validation
- **Password Visibility**: Toggle password visibility for better UX
- **Responsive Layout**: Optimized for different screen sizes

## Email Verification Flow

1. **User Signup**: Users create an account with email, password, username, and phone
2. **Verification Email**: Firebase automatically sends a verification email
3. **Email Verification Screen**: Users are directed to a dedicated verification screen
4. **Verification Process**: Users click the link in their email
5. **Account Activation**: Once verified, users can sign in and access the app

## Technical Implementation

### Firebase Integration
- Firebase Authentication for user management
- Firestore for user data storage
- Email verification through Firebase Auth
- Real-time authentication state monitoring

### Navigation
- Stack-based navigation with React Navigation
- Seamless flow between authentication screens
- Proper screen transitions and state management

### State Management
- Local state for form inputs and UI states
- Firebase Auth state synchronization
- Proper error handling and user feedback

## File Structure

```
screens/
├── SignupScreen.js          # Enhanced signup with email verification
├── EmailVerificationScreen.js # New email verification screen
├── LoginScreen.js           # Enhanced login with verification check
└── ...                      # Other existing screens

App.js                       # Updated navigation with EmailVerification
firebase.js                  # Firebase configuration and helpers
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Firebase:
   - Update `firebase.js` with your Firebase project credentials
   - Enable Email/Password authentication in Firebase Console
   - Enable Email verification in Firebase Console

3. Run the app:
   ```bash
   npm start
   ```

## Dependencies

- React Native
- Firebase (v12+)
- React Navigation
- Expo Linear Gradient
- AsyncStorage for persistence

## Security Features

- Email verification required for account activation
- Password strength validation
- Rate limiting for failed login attempts
- Secure Firebase authentication
- User data validation and sanitization

## Future Enhancements

- Phone number verification (SMS)
- Two-factor authentication
- Social media login integration
- Advanced password policies
- User profile customization
