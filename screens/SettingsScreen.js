import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { api } from '../services/api';

export default function SettingsScreen({ navigation }) {
  const handleChangePassword = () => {
    // Reuse existing flow
    navigation.navigate('SettingsPasswordReset');
  };

  const handleAbout = () => {
    Alert.alert(
      'About ShakeApp',
      'Version 1.0.0\n\nShakeApp helps you stay active with fun daily shake challenges.'
    );
  };

  const handleTerms = () => {
    Alert.alert(
      'Terms of Service',
      'Terms of Service will be provided here.'
    );
  };

  const confirmDisable = () => {
    Alert.alert(
      'Disable Account',
      'This will prevent login until re-enabled by support. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.disableAccount();
              Alert.alert('Account disabled', 'You have been signed out.');
              navigation.replace('Login');
            } catch (e) {
              Alert.alert('Error', e?.message || 'Failed to disable account');
            }
          },
        },
      ]
    );
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and will delete your account and data. Type DELETE to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAccount();
              Alert.alert('Account deleted', 'Your account has been removed.');
              navigation.replace('Login');
            } catch (e) {
              Alert.alert('Error', e?.message || 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Simple List */}
      <View style={styles.list}>
        <TouchableOpacity style={styles.item} onPress={handleChangePassword}>
          <Text style={styles.itemText}>Password</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handleAbout}>
          <Text style={styles.itemText}>About</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handleTerms}>
          <Text style={styles.itemText}>Terms of Service</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={styles.sectionLabelWrap}>
        <Text style={styles.sectionLabel}>Danger Zone</Text>
      </View>
      <View style={styles.list}>
        <TouchableOpacity style={styles.item} onPress={confirmDisable}>
          <Text style={[styles.itemText, { color: '#B26A00' }]}>Disable Account</Text>
          <Text style={[styles.arrow, { color: '#B26A00' }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={confirmDelete}>
          <Text style={[styles.itemText, { color: '#D64545' }]}>Delete Account</Text>
          <Text style={[styles.arrow, { color: '#D64545' }]}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 24,
    color: '#4A80F0',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  list: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  arrow: {
    fontSize: 20,
    color: '#4A80F0',
    fontWeight: '600',
  },
  sectionLabelWrap: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#8A8A8E',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
