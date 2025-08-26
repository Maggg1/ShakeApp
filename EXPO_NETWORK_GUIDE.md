# Expo Mobile App Network Configuration Guide

## Issue: "Registration failed network request failed"

Based on our testing, the backend is working correctly:
- ✅ Backend URL: `https://adminmanagementsystem.up.railway.app`
- ✅ Health check endpoint: Working
- ✅ Registration endpoint: Working (returns 201)
- ✅ CORS configuration: Properly configured

## Common Expo Mobile Network Issues

### 1. Android Network Security Configuration
For Android apps, you need to allow cleartext traffic or configure network security:

**android/app/src/main/AndroidManifest.xml**
```xml
<application
    android:usesCleartextTraffic="true"
    ...>
</application>
```

### 2. iOS App Transport Security
For iOS, you need to allow arbitrary loads:

**ios/ShakeApp/Info.plist**
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### 3. Expo Development Client Issues
When using Expo Go, try these solutions:

1. **Restart Expo Go app**
2. **Clear Expo Go cache** (Settings → Developer → Clear Cache)
3. **Use production build** instead of development build

### 4. Network Testing Commands

Run these to verify connectivity:

```bash
# Test backend connection
node test-mobile-backend.js

# Test CORS configuration  
node test-cors.js

# Test from mobile perspective (run this on your development machine)
npx uri-scheme open exp://192.168.x.x:19000 --android
```

### 5. Debugging Steps

1. **Check console logs** in Expo DevTools for detailed error messages
2. **Enable debug mode** in API service (already enabled in our updates)
3. **Test with different networks** (WiFi vs Mobile Data)

## Quick Fixes to Try

1. **Build production version**: `eas build --platform android --profile production`
2. **Use tunnel connection**: `expo start --tunnel`
3. **Check firewall/antivirus** blocking connections

## Backend Configuration Verified

The backend at `https://adminmanagementsystem.up.railway.app` is:
- ✅ Accepting requests
- ✅ Proper CORS configuration  
- ✅ Registration endpoint working
- ✅ Returning proper responses

The issue is likely on the mobile app side or network configuration.
