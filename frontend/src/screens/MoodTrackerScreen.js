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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { moodsAPI } from '../services/api';
import { COLORS, TYPOGRAPHY, SPACING, COMPONENTS } from '../styles/theme';
import GlassCard from '../components/GlassCard';

const screenWidth = Dimensions.get('window').width;

const MOOD_COLORS = {
  positive: COLORS.accent.success,
  negative: COLORS.accent.error,
  neutral: COLORS.text.tertiary,
};

const MOOD_ICONS = {
  positive: 'happy',
  negative: 'sad',
  neutral: 'remove',
};

export default function MoodTrackerScreen() {
  const [moodText, setMoodText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState(null);
  const [moodTrends, setMoodTrends] = useState(null);
  const [loadingTrends, setLoadingTrends] = useState(true);

  useEffect(() => {
    loadMoodTrends();
  }, []);

  const loadMoodTrends = async () => {
    try {
      const trends = await moodsAPI.getTrends(7);
      setMoodTrends(trends);
    } catch (error) {
      console.error('Failed to load mood trends:', error);
    } finally {
      setLoadingTrends(false);
    }
  };

  const analyzeMood = async () => {
    if (!moodText.trim()) {
      Alert.alert('Error', 'Please describe how you\'re feeling');
      return;
    }

    setLoading(true);

    try {
      const result = await moodsAPI.analyzeMood(moodText);
      setCurrentMood(result);
      setMoodText('');
      
      // Reload trends after new mood entry
      loadMoodTrends();
      
      Alert.alert(
        'Mood Analyzed!',
        `You're feeling ${result.mood}\n\n${result.recommendation}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze mood. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!moodTrends || moodTrends.trends.length === 0) {
      return (
        <GlassCard style={styles.noDataContainer} variant="primary">
          <Ionicons name="bar-chart-outline" size={48} color={COLORS.text.tertiary} />
          <Text style={styles.noDataText}>No mood data yet</Text>
          <Text style={styles.noDataSubtext}>Start tracking your mood to see trends!</Text>
        </GlassCard>
      );
    }

    const chartData = {
      labels: moodTrends.trends.map(t => {
        const date = new Date(t.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: [
        {
          data: moodTrends.trends.map(t => t.averagePositivity * 100),
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <LineChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        yAxisLabel=""
        yAxisSuffix="%"
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: COLORS.background.secondary,
          backgroundGradientFrom: COLORS.background.secondary,
          backgroundGradientTo: COLORS.background.tertiary,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          labelColor: (opacity = 1) => COLORS.text.secondary,
          style: {
            borderRadius: SPACING.radius.lg,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: COLORS.accent.primary,
          },
        }}
        bezier
        style={styles.chart}
      />
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Mood Check</Text>
      </View>

      {/* Mood Input Section */}
      <GlassCard style={styles.inputSection}>
        <Text style={styles.sectionTitle}>How are you feeling?</Text>
        <Text style={styles.sectionSubtitle}>
          Share your thoughts and emotions to track your wellbeing journey
        </Text>
        
        <GlassCard style={styles.inputWrapper} variant="input">
          <TextInput
            style={styles.moodInput}
            placeholder="Describe your current mood or feelings..."
            placeholderTextColor={COLORS.text.placeholder}
            value={moodText}
            onChangeText={setMoodText}
            multiline
            maxLength={1000}
          />
          <Text style={[
            styles.charCount,
            moodText.length > 900 && styles.charCountWarning
          ]}>
            {moodText.length}/1000
          </Text>
        </GlassCard>

        <TouchableOpacity
          style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
          onPress={analyzeMood}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? [COLORS.text.disabled, COLORS.text.disabled] : COLORS.gradient.primary}
            style={styles.analyzeButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.text.primary} size="small" />
                <Text style={styles.loadingText}>Analyzing mood...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="happy" size={24} color={COLORS.text.primary} />
                <Text style={styles.analyzeButtonText}>Analyze Mood</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </GlassCard>

      {/* Current Mood Display */}
      {currentMood && (
        <GlassCard style={styles.currentMoodCard} variant="secondary">
          <View style={styles.currentMoodHeader}>
            <Ionicons name="analytics" size={20} color={COLORS.accent.info} />
            <Text style={styles.currentMoodTitle}>Current Mood Assessment</Text>
          </View>
          
          <View style={styles.currentMoodContent}>
            <Ionicons 
              name={MOOD_ICONS[currentMood.mood]} 
              size={64} 
              color={MOOD_COLORS[currentMood.mood]} 
            />
            <Text style={[styles.currentMoodLabel, { color: MOOD_COLORS[currentMood.mood] }]}>
              {currentMood.mood.charAt(0).toUpperCase() + currentMood.mood.slice(1)}
            </Text>
            <Text style={styles.currentMoodConfidence}>
              Confidence: {(currentMood.confidence * 100).toFixed(1)}%
            </Text>
          </View>
          
          <View style={[styles.moodIndicator, { backgroundColor: MOOD_COLORS[currentMood.mood] }]} />
        </GlassCard>
      )}

      {/* Mood Trends Section */}
      <GlassCard style={styles.trendsSection}>
        <View style={styles.trendsHeader}>
          <Ionicons name="trending-up" size={24} color={COLORS.accent.primary} />
          <Text style={styles.sectionTitle}>Your Mood Trends</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Track your emotional patterns over time
        </Text>
        
        {loadingTrends ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent.primary} />
            <Text style={styles.loadingText}>Loading trends...</Text>
          </View>
        ) : (
          <>
            {renderChart()}
            {moodTrends && moodTrends.summary.totalMoods > 0 && (
              <View style={styles.statsContainer}>
                <GlassCard style={styles.statCard} variant="primary">
                  <Ionicons name="trending-up" size={20} color={COLORS.accent.info} />
                  <Text style={styles.statValue}>
                    {moodTrends.summary.averagePositivity.toFixed(1)}%
                  </Text>
                  <Text style={styles.statLabel}>Avg Positivity</Text>
                </GlassCard>
                
                <GlassCard style={styles.statCard} variant="primary">
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.accent.success} />
                  <Text style={styles.statValue}>{moodTrends.summary.totalMoods}</Text>
                  <Text style={styles.statLabel}>Total Checks</Text>
                </GlassCard>
                
                <GlassCard style={styles.statCard} variant="primary">
                  <Ionicons name="happy" size={20} color={COLORS.accent.success} />
                  <Text style={[styles.statValue, { color: MOOD_COLORS.positive }]}>
                    {moodTrends.summary.positivePercentage.toFixed(0)}%
                  </Text>
                  <Text style={styles.statLabel}>Positive</Text>
                </GlassCard>
              </View>
            )}
          </>
        )}
      </GlassCard>
      
      {/* Footer spacing for tab bar */}
      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  
  scrollContent: {
    paddingBottom: SPACING.section.gap,
  },
  
  // Page Header
  pageHeader: {
    paddingHorizontal: SPACING.section.margin,
    paddingTop: Platform.OS === 'ios' ? SPACING.base : SPACING.lg,
    paddingBottom: SPACING.text.sectionTitle,
  },
  
  pageTitle: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  
  // Input Section
  inputSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    marginBottom: 24,
    opacity: 0.8,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
  },
  
  inputWrapper: {
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  
  moodInput: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    minHeight: 100,
    maxHeight: 180,
    textAlignVertical: 'top',
    marginBottom: SPACING.text.paragraphBottom,
    backgroundColor: 'transparent', // Use GlassCard background
    borderWidth: 0, // Use GlassCard border
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
  
  analyzeButton: {
    borderRadius: SPACING.radius.base,
    overflow: 'hidden',
    marginTop: SPACING.base,
  },
  
  analyzeButtonGradient: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  analyzeButtonDisabled: {
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
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginLeft: SPACING.sm,
  },
  
  analyzeButtonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginLeft: SPACING.base,
  },
  
  // Current Mood Section
  currentMoodCard: {
    marginHorizontal: SPACING.section.margin,
    marginBottom: SPACING.section.gap,
    position: 'relative',
    paddingVertical: SPACING.section.padding,
  },
  
  currentMoodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  
  currentMoodTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  
  currentMoodContent: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  
  currentMoodIcon: {
    marginBottom: SPACING.base,
  },
  
  currentMoodLabel: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.sm,
  },
  
  currentMoodConfidence: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  moodIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 4,
    height: '100%',
    borderTopRightRadius: SPACING.radius.lg,
    borderBottomRightRadius: SPACING.radius.lg,
  },
  
  // Trends Section
  trendsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  
  trendsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  chart: {
    marginVertical: SPACING.lg,
    borderRadius: SPACING.radius.lg,
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  
  // No Data State
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    marginVertical: SPACING.lg,
  },
  
  noDataText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.base,
    marginBottom: SPACING.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  noDataSubtext: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    opacity: 0.8,
  },
  
  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.base,
  },
  
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  footer: {
    height: 120, // Space for floating dock tab bar
  },
});