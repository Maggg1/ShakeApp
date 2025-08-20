import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useFonts } from 'expo-font';

export default function HomeScreen({ navigation }) {
  const [fontsLoaded] = useFonts({
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
  });

  if (!fontsLoaded) {
    return null; // just don't render until fonts are loaded
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome To ShakeApp</Text>
        <Text style={styles.subtitle}>Login daily for free shakes!</Text>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 20 },
  content: { alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginTop: 300, marginBottom: 20, color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20, textAlign: 'center' },
  button: {
    alignItems: 'center',
    backgroundColor: '#91CDD7',
    borderRadius: 50,
    height: 69,
    justifyContent: 'center',
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: { color: '#1f1f69', fontFamily: 'Poppins-Medium', fontSize: 20, fontWeight: '500' },
});
