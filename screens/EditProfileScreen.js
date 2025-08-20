import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { avatars } from '../assets/avatars';
import { api } from '../services/api';

const { width, height } = Dimensions.get('window');

export default function EditProfileScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await api.getCurrentUser();
        if (user) {
          setName(user.username || '');
          setEmail(user.email || '');
          setSelectedAvatar(typeof user.avatarIndex === 'number' ? user.avatarIndex : 0);
          setBio(user.bio || '');
          setPhone(user.phone || '');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (bio && bio.length > 150) {
      newErrors.bio = 'Bio must be less than 150 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsUpdating(true);
    try {
      // Update profile via API (works offline with mocks)
      await api.updateProfile({
        name: name.trim(),
        username: name.trim(),
        email: email.trim(),
        avatarIndex: selectedAvatar,
        bio: bio.trim(),
        phone: phone.trim(),
        updatedAt: new Date().toISOString(),
      });

      // Log activity (non-blocking)
      try {
        await api.logActivity({
          type: 'profile_update',
          description: 'Profile information updated',
          metadata: { avatarIndex: selectedAvatar },
        });
      } catch (e) {
        // ignore
      }

      Alert.alert(
        'Success! 🎉', 
        'Your profile has been updated successfully.',
        [{ text: 'Great!', style: 'default', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Update Failed', error?.message || 'Unable to update your profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarSelect = (index) => {
    setSelectedAvatar(index);
    // Haptic-like animation
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderInput = (label, value, onChangeText, placeholder, options = {}) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          errors[label.toLowerCase()] && styles.inputError
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        {...options}
      />
      {errors[label.toLowerCase()] && (
        <Text style={styles.errorText}>{errors[label.toLowerCase()]}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#97c5cc', '#669198']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={isUpdating}
            style={styles.saveButtonContainer}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Avatar Selection */}
          <View style={styles.avatarSection}>
            <Text style={styles.sectionTitle}>Choose Your Avatar</Text>
            <Text style={styles.sectionSubtitle}>Tap to select your profile picture</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarScrollContent}
            >
              {avatars.map((avatar, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleAvatarSelect(index)}
                  style={[
                    styles.avatarItem,
                    selectedAvatar === index && styles.selectedAvatar,
                  ]}
                >
                  <Image source={avatar} style={styles.avatarImage} />
                  {selectedAvatar === index && (
                    <View style={styles.avatarCheckmark}>
                      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Profile Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            {renderInput(
              'Name',
              name,
              setName,
              'Enter your full name',
              {
                autoCapitalize: 'words',
                maxLength: 50,
              }
            )}

            {renderInput(
              'Email',
              email,
              setEmail,
              'Enter your email address',
              {
                keyboardType: 'email-address',
                autoCapitalize: 'none',
                autoCorrect: false,
              }
            )}

            {renderInput(
              'Phone',
              phone,
              setPhone,
              'Enter your phone number (optional)',
              {
                keyboardType: 'phone-pad',
                maxLength: 20,
              }
            )}

            {renderInput(
              'Bio',
              bio,
              setBio,
              'Tell something about yourself (max 150 chars)',
              {
                maxLength: 150,
              }
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  content: {
    paddingHorizontal: 20,
  },
  avatarSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  avatarScrollContent: {
    paddingHorizontal: 10,
  },
  avatarItem: {
    width: 70,
    height: 70,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: 5,
  },
  selectedAvatar: {
    borderColor: '#669198',
    transform: [{ scale: 1.0 }],
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarCheckmark: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  formSection: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fdf2f2',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
});
