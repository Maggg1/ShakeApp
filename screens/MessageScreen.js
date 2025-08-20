import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function MessageScreen() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with mock data
    setTimeout(() => {
      setMessage("Hello from ShakeApp! Backend connection pending...");
      setLoading(false);
    }, 1500);
    
    // Uncomment and modify the following for real API connection:
    // fetch("http://192.168.0.86:5000/api/message")
    //   .then((res) => res.json())
    //   .then((data) => {
    //     setMessage(data.text);
    //     setLoading(false);
    //   })
    //   .catch((error) => {
    //     setMessage("Error: Could not connect to backend");
    //     setLoading(false);
    //   });
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
  },
});
