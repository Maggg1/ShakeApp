import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Firebase configuration (keeping only auth-related config)
const firebaseConfig = {
  apiKey: 'AIzaSyD2nzqs0yZyQvnfDaftLl2Ub1b1e6nx5DE',
  authDomain: 'shakes-915ba.firebaseapp.com',
  projectId: 'shakes-915ba',
  storageBucket: 'shakes-915ba.appspot.com',
  messagingSenderId: '939934080842',
  appId: '1:939934080842:web:9af28a53e1286d1eb12bb3',
};

// ✅ Initialize Firebase App
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Initialize Auth with AsyncStorage persistence (Expo compatible)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  console.warn('Auth already initialized. Using existing instance.');
  auth = getAuth(app);
}

// ❌ Firestore has been removed - using Railway backend instead
// All data storage is now handled by the Railway API

export { app, auth };
