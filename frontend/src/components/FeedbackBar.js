import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const FEEDBACK_OPTIONS = [
  {
    id: 'love',
    icon: 'heart',
    label: 'Love it!',
    color: '#10b981',
  },
  {
    id: 'like',
    icon: 'thumbs-up',
    label: 'Good choice',
    color: '#6366f1',
  },
  {
    id: 'neutral',
    icon: 'remove',
    label: 'It\'s okay',
    color: '#f59e0b',
  },
  {
    id: 'dislike',
    icon: 'thumbs-down',
    label: 'Not great',
    color: '#ef4444',
  },
];

export default function FeedbackBar({
  onFeedback,
  selectedFeedback = null,
  disabled = false,
  showThankYou = false,
  style
}) {
  const [scaleAnims] = useState(
    FEEDBACK_OPTIONS.map(() => new Animated.Value(1))
  );
  const [thankYouAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (showThankYou) {
      Animated.sequence([
        Animated.timing(thankYouAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(thankYouAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showThankYou]);

  const handleFeedback = (feedbackId, index) => {
    if (disabled) return;

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Animation
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Call feedback handler
    if (onFeedback) {
      onFeedback(feedbackId);
    }
  };

  const getSelectedOption = () => {
    return FEEDBACK_OPTIONS.find(option => option.id === selectedFeedback);
  };

  if (showThankYou) {
    const selectedOption = getSelectedOption();
    
    return (
      <Animated.View
        style={[
          styles.container,
          styles.thankYouContainer,
          { opacity: thankYouAnim },
          style
        ]}
      >
        <View style={styles.thankYouContent}>
          <Ionicons name="heart" size={24} color="#10b981" />
          <Text style={styles.thankYouText}>
            Thanks for your feedback!
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>How do you feel about this choice?</Text>
        <Text style={styles.subtitle}>Your feedback helps improve recommendations</Text>
      </View>

      <View style={styles.optionsContainer}>
        {FEEDBACK_OPTIONS.map((option, index) => {
          const isSelected = selectedFeedback === option.id;
          
          return (
            <Animated.View
              key={option.id}
              style={{
                transform: [{ scale: scaleAnims[index] }],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  isSelected && styles.selectedOption,
                  isSelected && { borderColor: option.color },
                  disabled && styles.disabledOption,
                ]}
                onPress={() => handleFeedback(option.id, index)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Ionicons name={option.icon} size={32} color={isSelected ? option.color : '#6b7280'} />
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected && styles.selectedLabel,
                    isSelected && { color: option.color },
                  ]}
                >
                  {option.label}
                </Text>
                
                {isSelected && (
                  <View style={[styles.selectedIndicator, { backgroundColor: option.color }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {selectedFeedback && (
        <View style={styles.selectedFeedback}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.selectedFeedbackText}>
            Feedback recorded! This helps us improve future recommendations.
          </Text>
        </View>
      )}

      {disabled && !selectedFeedback && (
        <View style={styles.disabledMessage}>
          <Text style={styles.disabledText}>
            Feedback will be available after processing
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  thankYouContainer: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  thankYouContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thankYouText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginLeft: 8,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  optionButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    minWidth: 70,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedOption: {
    backgroundColor: '#fff',
    borderWidth: 2,
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  selectedLabel: {
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: 12,
  },
  selectedFeedbackText: {
    fontSize: 14,
    color: '#166534',
    marginLeft: 8,
    flex: 1,
  },
  disabledMessage: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  disabledText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});