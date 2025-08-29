import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import EmailVerificationScreen from './screens/EmailVerificationScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import SettingsPasswordResetScreen from './screens/SettingsPasswordResetScreen';
import DashboardScreen from './screens/DashboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import ShakeScreen from './screens/ShakeScreen';
import ShakesHistoryScreen from './screens/ShakesHistoryScreen';
import HomeScreen from './screens/HomeScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false}} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false}} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} options={{ headerShown: false}} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false}} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false}} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false}} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false}} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false}} />
        <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ headerShown: false}} />
        <Stack.Screen name="Shake" component={ShakeScreen} options={{ headerShown: false}} />
        <Stack.Screen name="ShakesHistory" component={ShakesHistoryScreen} options={{ headerShown: false}} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false}} />
        <Stack.Screen name="SettingsPasswordReset" component={SettingsPasswordResetScreen} options={{ headerShown: false}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
