import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { decisionsAPI } from '../services/api';
import { getWeatherData } from '../services/weather';
import { COLORS, TYPOGRAPHY, SPACING } from '../styles/theme';
import GlassCard from '../components/GlassCard';
import PhotoUploader from '../components/PhotoUploader';
import ImageResultCard from '../components/ImageResultCard';
import FeedbackBar from '../components/FeedbackBar';
import MoodSelector from '../components/MoodSelector';

const CATEGORIES = [
  { id: 'food', name: 'Food', icon: 'restaurant' },
  { id: 'clothing', name: 'Clothing', icon: 'shirt' },
  { id: 'activity', name: 'Activity', icon: 'bicycle' },
  { id: 'work', name: 'Work', icon: 'briefcase' },
  { id: 'social', name: 'Social', icon: 'people' },
  { id: 'other', name: 'Other', icon: 'apps' },
];

export default function DecisionSnapPhotoScreen({ navigation }) {
  const [step, setStep] = useState('upload'); // upload, processing, results
  const [images, setImages] = useState([]);
  const [question, setQuestion] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [feedback, setFeedback] = useState(null);
  const [showFeedbackThanks, setShowFeedbackThanks] = useState(false);

  // Auto-select clothing category if not set
  useEffect(() => {
    if (images.length > 0 && !selectedCategory) {
      setSelectedCategory('clothing'); // Default assumption for photo decisions
    }
  }, [images]);

  const handleImagesSelected = (selectedImages) => {
    setImages(selectedImages);
    setError(null);
  };

  const handleSubmit = async () => {
    if (images.length < 2) {
      Alert.alert('Missing Photos', 'Please upload at least 2 photos to compare.');
      return;
    }

    if (!question.trim()) {
      Alert.alert('Missing Question', 'Please describe what you\'re deciding between.');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('processing');

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      // Get weather data for context
      let weatherData = null;
      try {
        weatherData = await getWeatherData();
      } catch (weatherError) {
        console.warn('Weather data unavailable:', weatherError.message);
      }

      // Extract labels from images
      const labels = images.map(img => img.label);

      // Make photo decision
      const result = await decisionsAPI.makePhotoDecision(
        images,
        question.trim(),
        selectedMood,
        selectedCategory,
        labels,
        weatherData
      );

      setDecision(result);
      setStep('results');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

    } catch (error) {
      console.error('Photo decision error:', error);
      
      setStep('upload');
      
      let errorMessage = 'Failed to get photo decision. Please try again.';
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data.error || errorMessage;
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (error.response?.status === 504) {
        errorMessage = 'Request timeout. The service is taking too long to respond.';
      } else if (!error.response) {
        errorMessage = 'Network error. Check your internet connection.';
      }
      
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCardToggle = (index) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  const handleFeedback = async (feedbackValue) => {
    if (!decision?.id) return;

    try {
      await decisionsAPI.submitPhotoFeedback(decision.id, feedbackValue);
      setFeedback(feedbackValue);
      setShowFeedbackThanks(true);
      
      setTimeout(() => {
        setShowFeedbackThanks(false);
      }, 3000);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    }
  };

  const resetDecision = () => {
    setStep('upload');
    setImages([]);
    setQuestion('');
    setSelectedMood(null);
    setSelectedCategory(null);
    setDecision(null);
    setError(null);
    setExpandedCards(new Set());
    setFeedback(null);
    setShowFeedbackThanks(false);
  };

  if (step === 'processing') {
    return (
      <SafeAreaView style={styles.container}>
        <GlassCard style={styles.processingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.processingTitle}>Analyzing your photos...</Text>
          <Text style={styles.processingSubtitle}>
            Comparing your options and considering your context
          </Text>
          <View style={styles.processingSteps}>
            <View style={styles.processingStepItem}>
              <Ionicons name="camera" size={24} color={COLORS.accent.primary} />
              <Text style={styles.processingStep}>Processing images</Text>
            </View>
            <View style={styles.processingStepItem}>
              <Ionicons name="analytics" size={24} color={COLORS.accent.primary} />
              <Text style={styles.processingStep}>Analyzing with advanced logic</Text>
            </View>
            <View style={styles.processingStepItem}>
              <Ionicons name="trophy" size={24} color={COLORS.accent.primary} />
              <Text style={styles.processingStep}>Ranking options</Text>
            </View>
          </View>
        </GlassCard>
      </SafeAreaView>
    );
  }

  if (step === 'results' && decision) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.container}>
          <View style={styles.resultsContainer}>
            {/* Header */}
            <GlassCard style={styles.resultsHeader}>
              <Ionicons name="camera" size={60} color={COLORS.accent.primary} />
              <Text style={styles.resultsTitle}>Photo Decision Complete!</Text>
              {decision.processingTime && (
                <Text style={styles.processingTime}>
                  Processed in {(decision.processingTime / 1000).toFixed(1)}s
                </Text>
              )}
            </GlassCard>

            {/* Fallback Notice */}
            {decision.fallback && (
              <GlassCard style={styles.fallbackNotice}>
                <Ionicons name="information-circle" size={20} color={COLORS.accent.warning} />
                <Text style={styles.fallbackText}>
                  Used simplified analysis (advanced features temporarily unavailable)
                </Text>
              </GlassCard>
            )}

            {/* Overall Reasoning */}
            {decision.reasoning && (
              <GlassCard style={styles.reasoningBox}>
                <View style={styles.reasoningHeader}>
                  <Ionicons name="bulb" size={20} color={COLORS.accent.info} />
                  <Text style={styles.reasoningTitle}>Smart Analysis</Text>
                </View>
                <Text style={styles.reasoningText}>{decision.reasoning}</Text>
              </GlassCard>
            )}

            {/* Ranked Results */}
            <View style={styles.rankedResults}>
              <Text style={styles.sectionTitle}>Ranked Options</Text>
              {decision.ranked?.map((rank, index) => (
                <ImageResultCard
                  key={rank.index}
                  image={rank.image}
                  rank={{
                    ...rank,
                    score: rank.score || 0.5,
                    factors: decision.factors || {}
                  }}
                  isRecommended={rank.index === decision.recommendedIndex}
                  isExpanded={expandedCards.has(index)}
                  onToggleExpand={() => handleCardToggle(index)}
                />
              ))}
            </View>

            {/* Confidence and Factors */}
            {decision.confidence && (
              <GlassCard style={styles.confidenceBox}>
                <View style={styles.confidenceHeader}>
                  <Ionicons name="analytics" size={20} color={COLORS.accent.success} />
                  <Text style={styles.confidenceTitle}>Analysis Confidence</Text>
                </View>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      { width: `${decision.confidence * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.confidenceText}>
                  {Math.round(decision.confidence * 100)}% confident in this ranking
                </Text>
              </GlassCard>
            )}

            {/* Context Info */}
            {(selectedMood || selectedCategory) && (
              <GlassCard style={styles.contextInfo}>
                <Text style={styles.contextTitle}>Context used:</Text>
                <View style={styles.contextTags}>
                  {selectedMood && (
                    <View style={styles.contextTag}>
                      <Text style={styles.contextTagText}>Mood: {selectedMood}</Text>
                    </View>
                  )}
                  {selectedCategory && (
                    <View style={styles.contextTag}>
                      <Text style={styles.contextTagText}>Category: {selectedCategory}</Text>
                    </View>
                  )}
                </View>
              </GlassCard>
            )}

            {/* Feedback Section */}
            <FeedbackBar
              onFeedback={handleFeedback}
              selectedFeedback={feedback}
              showThankYou={showFeedbackThanks}
            />

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.newDecisionButton} 
                onPress={resetDecision}
              >
                <LinearGradient
                  colors={COLORS.gradient.primary}
                  style={styles.gradientButton}
                >
                  <Ionicons name="camera" size={20} color={COLORS.text.primary} />
                  <Text style={styles.newDecisionButtonText}>New Photo Decision</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <GlassCard 
                style={styles.backButton} 
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>Back to Home</Text>
              </GlassCard>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.header}>
          <TouchableOpacity 
            style={styles.backIcon}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.accent.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerText}>Photo Decision Snap</Text>
            <Text style={styles.headerSubtext}>
              Upload photos and get smart ranking recommendations
            </Text>
          </View>
        </GlassCard>

        {/* Photo Uploader */}
        <PhotoUploader
          onImagesSelected={handleImagesSelected}
          initialImages={images}
          disabled={loading}
          style={styles.photoUploader}
        />

        {/* Question Input */}
        <GlassCard style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            What are you deciding between? <Text style={styles.requiredText}>*</Text>
          </Text>
          <TextInput
            style={styles.questionInput}
            placeholder="e.g., Which outfit should I wear today?"
            placeholderTextColor={COLORS.text.placeholder}
            value={question}
            onChangeText={setQuestion}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={[
            styles.charCount,
            question.length > 450 && styles.charCountWarning
          ]}>
            {question.length}/500
          </Text>
        </GlassCard>

        {/* Mood Selector */}
        <GlassCard style={styles.moodContainer}>
          <MoodSelector
            selectedMood={selectedMood}
            onMoodChange={setSelectedMood}
          />
        </GlassCard>

        {/* Category Selection */}
        <GlassCard style={styles.categoryContainer}>
          <Text style={styles.sectionTitle}>Category (optional)</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContainer}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                ]}
                onPress={() => {
                  setSelectedCategory(selectedCategory === category.id ? null : category.id);
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={category.icon}
                  size={20}
                  color={selectedCategory === category.id ? COLORS.text.primary : COLORS.accent.primary}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.categoryTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </GlassCard>

        {/* Error Display */}
        {error && (
          <GlassCard style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={COLORS.accent.error} />
            <Text style={styles.errorText}>{error}</Text>
          </GlassCard>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (loading || images.length < 2 || !question.trim()) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={loading || images.length < 2 || !question.trim()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? [COLORS.text.disabled, COLORS.text.disabled] : COLORS.gradient.primary}
            style={styles.submitButtonGradient}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.text.primary} size="small" />
                <Text style={styles.loadingText}>Analyzing photos...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="camera" size={24} color={COLORS.text.primary} />
                <Text style={styles.submitButtonText}>Get Photo Recommendation</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer spacing */}
        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  
  backIcon: {
    marginRight: 16,
  },
  
  headerContent: {
    flex: 1,
  },
  
  headerText: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  
  headerSubtext: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
    opacity: 0.8,
  },
  
  photoUploader: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  
  // Input Container
  inputContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  
  requiredText: {
    color: COLORS.accent.error,
  },
  
  questionInput: {
    backgroundColor: COLORS.glass.primary,
    borderRadius: SPACING.radius.base,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    minHeight: 100,
    maxHeight: 150,
    marginBottom: SPACING.sm,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow.glass,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  charCount: {
    textAlign: 'right',
    color: COLORS.text.tertiary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.sm,
  },
  
  charCountWarning: {
    color: COLORS.accent.warning,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  // Mood Container
  moodContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  
  // Category Section
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  
  categoryContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  
  categoryScrollContainer: {
    paddingRight: SPACING.lg,
  },
  
  categoryButton: {
    backgroundColor: COLORS.glass.primary,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    borderRadius: SPACING.radius.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    marginRight: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow.glass,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  categoryButtonActive: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
  },
  
  categoryText: {
    marginLeft: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  categoryTextActive: {
    color: COLORS.text.primary,
  },
  
  // Error Container
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent.error,
    backgroundColor: `${COLORS.accent.error}20`,
  },
  
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.accent.error,
    marginLeft: SPACING.base,
    flex: 1,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  // Submit Button
  submitButton: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: SPACING.radius.base,
    overflow: 'hidden',
  },
  
  submitButtonGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  submitButtonDisabled: {
    opacity: 0.6,
  },
  
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  loadingText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.base,
  },
  
  submitButtonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginLeft: SPACING.base,
  },
  
  footer: {
    height: 120, // Space for floating dock tab bar
  },
  
  // Processing Screen
  processingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: SPACING.lg,
    marginTop: SPACING['4xl'],
    paddingVertical: SPACING['2xl'],
  },
  
  processingTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  
  processingSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
    marginBottom: SPACING['2xl'],
    opacity: 0.8,
  },
  
  processingSteps: {
    alignItems: 'center',
    gap: SPACING.lg,
  },
  
  processingStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  processingStepEmoji: {
    fontSize: 24,
    marginRight: SPACING.base,
  },
  
  processingStep: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  // Results Screen
  resultsContainer: {
    padding: SPACING.lg,
  },
  
  resultsHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  
  resultsTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  
  processingTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  
  fallbackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent.warning,
    backgroundColor: `${COLORS.accent.warning}20`,
  },
  
  fallbackText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.accent.warning,
    marginLeft: SPACING.sm,
    flex: 1,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  reasoningBox: {
    marginBottom: SPACING.lg,
  },
  
  reasoningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  
  reasoningTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  
  reasoningText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
    opacity: 0.9,
  },
  
  rankedResults: {
    marginBottom: SPACING.lg,
  },
  
  confidenceBox: {
    marginBottom: SPACING.lg,
  },
  
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  
  confidenceTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  
  confidenceBar: {
    height: 8,
    backgroundColor: COLORS.glass.primary,
    borderRadius: SPACING.radius.sm,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  
  confidenceFill: {
    height: '100%',
    backgroundColor: COLORS.accent.success,
    borderRadius: SPACING.radius.sm,
  },
  
  confidenceText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  contextInfo: {
    marginBottom: SPACING.lg,
  },
  
  contextTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  
  contextTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  
  contextTag: {
    backgroundColor: COLORS.accent.primary,
    borderRadius: SPACING.radius.full,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  
  contextTagText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  actionButtons: {
    gap: SPACING.base,
  },
  
  newDecisionButton: {
    borderRadius: SPACING.radius.base,
    overflow: 'hidden',
  },
  
  gradientButton: {
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  newDecisionButtonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginLeft: SPACING.sm,
  },
  
  backButton: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  
  backButtonText: {
    color: COLORS.text.secondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});