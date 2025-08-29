import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';

export default function FeedbackScreen({ navigation }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState('general');
  const [rating, setRating] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  
  const categories = [
    { id: 'general', label: 'General', icon: 'chat' },
    { id: 'bug', label: 'Bug Report', icon: 'bug-report' },
    { id: 'feature', label: 'Feature Request', icon: 'lightbulb' },
    { id: 'improvement', label: 'Improvement', icon: 'trending-up' },
  ];

  const handleSubmit = async () => {
    setShowValidation(true);
    
    if (!message.trim()) {
      Alert.alert('Missing Information', 'Please enter your feedback message');
      return;
    }
    
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please provide a rating for your feedback');
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit feedback via API (works offline with mocks)
      await api.submitFeedback({ 
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''), 
        message: message, 
        category, 
        rating 
      });

      // Log to activities via API (ignore failures)
      try {
        await api.logActivity({
          type: 'feedback',
          description: `${category} feedback submitted`,
          metadata: { rating, category },
        });
      } catch (e) {
        console.warn('Could not create feedback activity:', e?.message || e);
      }

      Alert.alert('Thank you!', 'Your feedback has been submitted successfully. We appreciate your input!');
      setMessage('');
      setRating(0);
      setCategory('general');
      setShowValidation(false);
      navigation.goBack();
    } catch (error) {
      console.error('Feedback submit error:', error);
      Alert.alert('Error', 'Something went wrong while submitting your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity 
          key={i} 
          onPress={() => setRating(i)} 
          style={styles.starContainer}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={i <= rating ? 'star' : 'star-outline'} 
            size={36} 
            color={i <= rating ? '#FFD700' : '#CCCCCC'} 
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const getRatingLabel = () => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return rating > 0 ? labels[rating] : 'Select rating';
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#97c5cc', '#669198']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Send Feedback</Text>
            <View style={{ width: 24 }}></View>
          </View>
        </LinearGradient>

        <View style={styles.contentContainer}>
          {/* Category Selection */}
          <Text style={styles.sectionTitle}>What type of feedback is this?</Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={[
                  styles.categoryButton, 
                  category === cat.id ? styles.categoryButtonActive : null,
                  showValidation && category === cat.id ? styles.categoryButtonSelected : null
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <MaterialIcons 
                  name={cat.icon} 
                  size={20} 
                  color={category === cat.id ? '#FFFFFF' : '#555555'} 
                />
                <Text style={[styles.categoryText, category === cat.id ? styles.categoryTextActive : null]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Rating */}
          <Text style={styles.sectionTitle}>How would you rate your experience?</Text>
          <View style={styles.ratingSection}>
            <View style={styles.ratingContainer}>
              {renderStars()}
            </View>
            <Text style={[
              styles.ratingLabel,
              showValidation && rating === 0 ? styles.validationError : null
            ]}>
              {getRatingLabel()}
            </Text>
          </View>

          {/* Message Input */}
          <Text style={styles.label}>Your Feedback</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            style={[
              styles.input,
              styles.textArea,
              showValidation && !message.trim() ? styles.validationError : null
            ]}
            placeholder="Please share your thoughts, suggestions, or report any issues..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          {showValidation && !message.trim() && (
            <Text style={styles.errorText}>Please enter your feedback message</Text>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.button, 
              isSubmitting && styles.buttonDisabled,
              (!message.trim() || rating === 0) && styles.buttonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !message.trim() || rating === 0}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {!message.trim() || rating === 0 ? 'Complete all fields' : 'Submit Feedback'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
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
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F2F5',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
    width: '48%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: '#669198',
    borderColor: '#4A80F0',
  },
  categoryButtonSelected: {
    borderColor: '#4A80F0',
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#555555',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  ratingSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  starContainer: {
    padding: 8,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    marginTop: 12,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 30,
    backgroundColor: '#669198',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4A80F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#7AA1F4',
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  validationError: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
