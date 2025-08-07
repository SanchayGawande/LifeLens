import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function RankedOptionsList({ rankedOptions, recommendedOption, isExpanded, onToggle }) {
  const [animatedValue] = useState(new Animated.Value(isExpanded ? 1 : 0));

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    Animated.timing(animatedValue, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    onToggle();
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return '#10b981'; // Green
    if (score >= 0.6) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const getScoreText = (score) => {
    return `${Math.round(score * 100)}%`;
  };

  if (!rankedOptions || rankedOptions.length === 0) {
    return null;
  }

  const topOption = rankedOptions[0];
  const otherOptions = rankedOptions.slice(1);

  return (
    <View style={styles.container}>
      {/* Top Recommendation */}
      <View style={styles.topRecommendation}>
        <View style={styles.topHeader}>
          <Ionicons name="trophy" size={20} color="#f59e0b" />
          <Text style={styles.topLabel}>Top Recommendation</Text>
        </View>
        
        <View style={styles.optionCard}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionTitle}>{topOption.option}</Text>
            <View style={[styles.scoreChip, { backgroundColor: getScoreColor(topOption.score) }]}>
              <Text style={styles.scoreText}>{getScoreText(topOption.score)}</Text>
            </View>
          </View>
          <Text style={styles.reasoningText}>{topOption.reasoning}</Text>
        </View>
      </View>

      {/* Other Options Toggle */}
      {otherOptions.length > 0 && (
        <TouchableOpacity style={styles.toggleButton} onPress={toggleExpanded}>
          <Text style={styles.toggleText}>
            {isExpanded ? 'Hide' : 'Show'} Other Options ({otherOptions.length})
          </Text>
          <Animated.View
            style={[
              styles.toggleIcon,
              {
                transform: [
                  {
                    rotate: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="chevron-down" size={20} color="#6366f1" />
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Expanded Options List */}
      {isExpanded && otherOptions.length > 0 && (
        <Animated.View
          style={[
            styles.expandedContainer,
            {
              opacity: animatedValue,
              maxHeight: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1000],
              }),
            },
          ]}
        >
          {otherOptions.map((option, index) => (
            <View key={`${option.option}-${index}`} style={styles.optionCard}>
              <View style={styles.optionHeader}>
                <View style={styles.optionTitleContainer}>
                  <Text style={styles.rankNumber}>#{option.rank}</Text>
                  <Text style={styles.optionTitle}>{option.option}</Text>
                </View>
                <View style={[styles.scoreChip, { backgroundColor: getScoreColor(option.score) }]}>
                  <Text style={styles.scoreText}>{getScoreText(option.score)}</Text>
                </View>
              </View>
              <Text style={styles.reasoningText}>{option.reasoning}</Text>
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  topRecommendation: {
    marginBottom: 15,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  topLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
    marginRight: 8,
    minWidth: 24,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  scoreChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  scoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reasoningText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
    marginRight: 5,
  },
  toggleIcon: {
    marginLeft: 5,
  },
  expandedContainer: {
    overflow: 'hidden',
  },
});