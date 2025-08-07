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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Web-safe haptics wrapper
const safeHaptics = {
  impactAsync: (style) => {
    if (Platform.OS !== 'web') {
      return Haptics.impactAsync(style);
    }
    return Promise.resolve();
  },
  notificationAsync: (type) => {
    if (Platform.OS !== 'web') {
      return Haptics.notificationAsync(type);
    }
    return Promise.resolve();
  }
};
import { decisionsAPI } from '../services/api';
import { COLORS, TYPOGRAPHY, SPACING, COMPONENTS } from '../styles/theme';
import GlassCard from '../components/GlassCard';
import MoodSelector from '../components/MoodSelector';
import RankedOptionsList from '../components/RankedOptionsList';
import AutoDecisionToggle from '../components/AutoDecisionToggle';
import SurpriseAnimation from '../components/SurpriseAnimation';
import NudgeEngine from '../components/NudgeEngine';

const CATEGORIES = [
  { id: 'food', name: 'Food', icon: 'restaurant' },
  { id: 'clothing', name: 'Clothing', icon: 'shirt' },
  { id: 'activity', name: 'Activity', icon: 'bicycle' },
  { id: 'work', name: 'Work', icon: 'briefcase' },
  { id: 'social', name: 'Social', icon: 'people' },
  { id: 'other', name: 'Other', icon: 'apps' },
];

export default function DecisionSnapScreen({ navigation }) {
  const [inputText, setInputText] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState(null);
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const [autoDecisionMode, setAutoDecisionMode] = useState(false);
  const [autoDecisionCount, setAutoDecisionCount] = useState(0);
  const [gamificationStats, setGamificationStats] = useState(null);
  const [nudgeVisible, setNudgeVisible] = useState(true);

  // Load gamification stats on component mount
  useEffect(() => {
    loadGamificationStats();
  }, []);

  const loadGamificationStats = async () => {
    try {
      const stats = await decisionsAPI.getGamificationStats();
      setGamificationStats(stats);
      setAutoDecisionCount(stats.autoDecisionCount || 0);
    } catch (error) {
      console.error('Failed to load gamification stats:', error);
    }
  };

  const handleDecision = async () => {
    if (!inputText.trim()) {
      Alert.alert('Missing Input', 'Please describe your decision and include options.\n\nExample: "What should I eat? Options: pizza, sushi, salad"');
      return;
    }

    setLoading(true);
    setError(null);
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      let result;
      
      if (autoDecisionMode) {
        // Auto-decision mode
        result = await decisionsAPI.makeAutoDecision(
          inputText.trim(),
          selectedMood,
          selectedCategory
        );
        
        // Update local auto-decision count immediately
        setAutoDecisionCount(prev => prev + 1);
        
        // Reload stats to get updated count from server
        setTimeout(loadGamificationStats, 1000);
      } else {
        // Regular enhanced decision
        result = await decisionsAPI.makeEnhancedDecision(
          inputText.trim(),
          selectedMood,
          selectedCategory
        );
      }

      setDecision(result);
      setShowResult(true);
      setOptionsExpanded(false);
      
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Decision error:', error);
      
      let errorMessage = 'Failed to get decision. Please try again.';
      let suggestion = null;
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data.error || errorMessage;
        suggestion = error.response.data.suggestion;
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (error.response?.status === 504) {
        errorMessage = 'Request timeout. The service is taking too long to respond.';
      } else if (!error.response) {
        errorMessage = 'Network error. Check your internet connection.';
      }
      
      setError({ message: errorMessage, suggestion });
      
      if (suggestion) {
        Alert.alert(
          'Input Format Help',
          `${errorMessage}\n\n${suggestion}`,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetDecision = () => {
    setInputText('');
    setSelectedMood(null);
    setSelectedCategory(null);
    setDecision(null);
    setShowResult(false);
    setError(null);
    setOptionsExpanded(false);
    setAutoDecisionMode(false);
  };

  const handleRevealAll = () => {
    // Already handled in SurpriseAnimation component
    console.log('Revealing all options');
  };

  const handleFeedback = async (reaction) => {
    try {
      if (decision?.id) {
        await decisionsAPI.submitFeedback(decision.id, reaction);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleNudgeAction = async (nudge, action) => {
    console.log(`Nudge action: ${action}`, nudge);
    
    if (action === 'accepted') {
      // Pre-fill input based on nudge type
      if (nudge.type === 'food') {
        setInputText('What should I eat? Options: ');
        setSelectedCategory('food');
      } else if (nudge.type === 'outdoor') {
        setInputText('What outdoor activity should I do? Options: walk, bike ride, park visit');
        setSelectedCategory('activity');
      } else if (nudge.type === 'planning') {
        setInputText('What should I plan for today? Options: ');
        setSelectedCategory('work');
      }
      
      setNudgeVisible(false);
    } else if (action === 'thanked') {
      setNudgeVisible(false);
    }
  };

  if (showResult && decision) {
    // Check if this is an auto-decision
    const isAutoDecision = decision.autoDecision || decision.surpriseMode;
    
    if (isAutoDecision) {
      // Show surprise animation for auto-decisions
      return (
        <SurpriseAnimation
          selectedOption={decision.selectedOption}
          allOptions={decision.allOptions || []}
          onRevealAll={handleRevealAll}
          onFeedback={handleFeedback}
          autoDecisionCount={autoDecisionCount}
        />
      );
    }

    // Handle regular enhanced and legacy response formats
    const hasRankedOptions = decision.rankedOptions && decision.rankedOptions.length > 0;
    const topRecommendation = hasRankedOptions ? decision.recommendedOption : decision.decision;
    const overallReasoning = hasRankedOptions ? decision.reasoning : null;
    const isFallback = decision.fallback;

    return (
      <ScrollView style={styles.container}>
        <View style={styles.resultContainer}>
          {/* Header */}
          <View style={styles.resultHeader}>
            <Ionicons 
              name={hasRankedOptions ? "trophy" : "checkmark-circle"} 
              size={60} 
              color={hasRankedOptions ? "#f59e0b" : "#10b981"} 
            />
            <Text style={styles.resultTitle}>
              {hasRankedOptions ? 'Smart Recommendation' : 'Decision Made!'}
            </Text>
            {decision.processingTime && (
              <Text style={styles.processingTime}>
                Processed in {decision.processingTime}ms
              </Text>
            )}
          </View>

          {/* Fallback Notice */}
          {isFallback && (
            <View style={styles.fallbackNotice}>
              <Ionicons name="information-circle" size={20} color="#f59e0b" />
              <Text style={styles.fallbackText}>
                Used simplified recommendation (ranking unavailable)
              </Text>
            </View>
          )}

          {/* Enhanced Results */}
          {hasRankedOptions ? (
            <>
              <RankedOptionsList
                rankedOptions={decision.rankedOptions}
                recommendedOption={decision.recommendedOption}
                isExpanded={optionsExpanded}
                onToggle={() => setOptionsExpanded(!optionsExpanded)}
              />
              
              {overallReasoning && (
                <View style={styles.reasoningBox}>
                  <View style={styles.reasoningHeader}>
                    <Ionicons name="bulb" size={20} color="#6366f1" />
                    <Text style={styles.reasoningTitle}>Why this ranking?</Text>
                  </View>
                  <Text style={styles.reasoningText}>{overallReasoning}</Text>
                </View>
              )}
            </>
          ) : (
            /* Legacy Results */
            <>
              <View style={styles.decisionBox}>
                <Text style={styles.decisionText}>{topRecommendation}</Text>
              </View>

              {decision.options && (
                <View style={styles.optionsBox}>
                  <Text style={styles.optionsTitle}>Full Analysis:</Text>
                  <Text style={styles.optionsText}>{decision.options}</Text>
                </View>
              )}
            </>
          )}

          {/* Context Info */}
          {(decision.mood || decision.category) && (
            <View style={styles.contextInfo}>
              <Text style={styles.contextTitle}>Context used:</Text>
              <View style={styles.contextTags}>
                {decision.mood && (
                  <View style={styles.contextTag}>
                    <Text style={styles.contextTagText}>Mood: {decision.mood}</Text>
                  </View>
                )}
                {decision.category && (
                  <View style={styles.contextTag}>
                    <Text style={styles.contextTagText}>Category: {decision.category}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.newDecisionButton} onPress={resetDecision}>
            <Text style={styles.newDecisionButtonText}>Make Another Decision</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Contextual Nudge Engine */}
        {nudgeVisible && (
          <GlassCard style={styles.nudgeContainer}>
            <NudgeEngine
              onNudgeAction={handleNudgeAction}
            />
          </GlassCard>
        )}

        {/* Header Section */}
        <GlassCard style={styles.headerCard} variant="secondary">
          <Text style={styles.headerText}>What decision do you need help with?</Text>
          <Text style={styles.headerSubtext}>
            Describe your situation and include your options for the best recommendations
          </Text>
        </GlassCard>


        {/* Input Section */}
        <GlassCard style={styles.inputCard}>
          <Text style={styles.inputLabel}>
            Describe your decision <Text style={styles.requiredText}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.questionInput}
              placeholder="e.g., What should I eat? Options: sushi, pizza, salad"
              placeholderTextColor={COLORS.text.placeholder}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={[
              styles.charCount,
              inputText.length > 900 && styles.charCountWarning
            ]}>
              {inputText.length}/1000
            </Text>
          </View>
          
          {/* Input format hint */}
          <GlassCard style={styles.hintContainer} variant="primary">
            <View style={styles.hintContent}>
              <Ionicons name="information-circle" size={16} color={COLORS.accent.info} />
              <Text style={styles.hintText}>
                Include your options for smart ranking (e.g., "Options: A, B, C" or "1. A 2. B 3. C")
              </Text>
            </View>
          </GlassCard>
        </GlassCard>

        {/* Mood Selector */}
        <GlassCard style={styles.moodCard}>
          <MoodSelector
            selectedMood={selectedMood}
            onMoodChange={setSelectedMood}
          />
        </GlassCard>

        {/* Category Selection */}
        <GlassCard style={styles.categoryCard}>
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
                  safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
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

        {/* Auto-Decision Toggle */}
        <GlassCard style={styles.autoToggleCard}>
          <AutoDecisionToggle
            isEnabled={autoDecisionMode}
            onToggle={setAutoDecisionMode}
            autoDecisionCount={autoDecisionCount}
          />
        </GlassCard>

        {/* Error Display */}
        {error && (
          <GlassCard style={styles.errorCard}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle" size={20} color={COLORS.accent.error} />
              <Text style={styles.errorText}>{error.message}</Text>
            </View>
          </GlassCard>
        )}

        {/* Submit Button */}
        <GlassCard style={styles.submitButtonCard} onPress={handleDecision} disabled={loading || !inputText.trim()}>
          <TouchableOpacity
            style={[styles.submitButton, (loading || !inputText.trim()) && styles.submitButtonDisabled]}
            onPress={handleDecision}
            disabled={loading || !inputText.trim()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={COLORS.gradient.primary}
              style={styles.submitButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={COLORS.text.primary} size="small" />
                  <Text style={styles.loadingText}>
                    {autoDecisionMode ? "Preparing surprise..." : "Analyzing options..."}
                  </Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons 
                    name={autoDecisionMode ? "flash" : "analytics"} 
                    size={24} 
                    color={COLORS.text.primary} 
                  />
                  <Text style={styles.submitButtonText}>
                    {autoDecisionMode ? "Surprise Me!" : "Get Smart Recommendation"}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </GlassCard>

        {/* Footer spacing for tab bar */}
        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  
  scrollContainer: {
    flex: 1,
  },
  
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120, // Space for floating dock tab bar
  },
  
  nudgeContainer: {
    marginBottom: 24,
  },
  
  headerCard: {
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  
  headerText: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  
  headerSubtext: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
    textAlign: 'center',
    opacity: 0.8,
  },
  
  inputCard: {
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  
  requiredText: {
    color: COLORS.accent.error,
  },
  
  inputWrapper: {
    marginBottom: SPACING.base,
  },
  
  questionInput: {
    backgroundColor: COLORS.glass.primary,
    borderRadius: SPACING.radius.base,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    minHeight: 120,
    maxHeight: 200,
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
  },
  
  charCountWarning: {
    color: COLORS.accent.warning,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  hintContainer: {
    padding: 0,
    marginTop: SPACING.base,
  },
  
  hintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
  },
  
  hintText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
  },
  
  moodCard: {
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  
  categoryCard: {
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  
  categoryScrollContainer: {
    paddingRight: SPACING.lg,
  },
  
  categoryButton: {
    backgroundColor: COLORS.glass.primary,
    borderRadius: SPACING.radius.xl,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
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
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  categoryTextActive: {
    color: COLORS.text.primary,
  },
  
  autoToggleCard: {
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  
  errorCard: {
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent.error,
    backgroundColor: `${COLORS.accent.error}20`,
  },
  
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
  },
  
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.accent.error,
    marginLeft: SPACING.base,
    flex: 1,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  submitButtonCard: {
    marginBottom: SPACING.lg,
    padding: 0,
  },
  
  submitButton: {
    borderRadius: SPACING.radius.base,
    overflow: 'hidden',
  },
  
  submitButtonGradient: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  submitButtonDisabled: {
    opacity: 0.5,
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
  
  // Result screen styles (Dark Theme)
  resultContainer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background.primary,
  },
  
  resultHeader: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  
  resultTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginTop: SPACING.base,
    textAlign: 'center',
  },
  
  processingTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    marginTop: SPACING.xs,
  },
  
  fallbackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent.warning}20`,
    borderRadius: SPACING.radius.base,
    borderWidth: 1,
    borderColor: COLORS.accent.warning,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
  },
  
  fallbackText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.accent.warning,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  
  reasoningBox: {
    ...COMPONENTS.card,
    marginBottom: SPACING.lg,
  },
  
  reasoningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  
  reasoningTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  
  reasoningText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
  },
  
  contextInfo: {
    ...COMPONENTS.card,
    backgroundColor: COLORS.glass.secondary,
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
  
  // Legacy result styles (Dark Theme)
  decisionBox: {
    backgroundColor: COLORS.accent.success,
    borderRadius: SPACING.radius.base,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  
  decisionText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textAlign: 'center',
  },
  
  optionsBox: {
    ...COMPONENTS.card,
    marginBottom: SPACING.lg,
  },
  
  optionsTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.base,
  },
  
  optionsText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
  },
  
  newDecisionButton: {
    backgroundColor: COLORS.accent.primary,
    borderRadius: SPACING.radius.base,
    padding: SPACING.lg,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  
  newDecisionButtonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});