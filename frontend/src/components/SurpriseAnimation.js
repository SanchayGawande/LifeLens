import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function SurpriseAnimation({
  selectedOption,
  allOptions = [],
  onRevealAll,
  onFeedback,
  autoDecisionCount = 0,
}) {
  const [revealAnimation] = useState(new Animated.Value(0));
  const [bounceAnimation] = useState(new Animated.Value(0));
  const [sparkleAnimations] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  useEffect(() => {
    // Start the surprise animation sequence
    startSurpriseSequence();
  }, []);

  const startSurpriseSequence = () => {
    // Haptic feedback for iOS
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Stagger the animations
    Animated.sequence([
      // Initial bounce
      Animated.timing(bounceAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Reveal text
      Animated.timing(revealAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Sparkle animations with delays
    sparkleAnimations.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  const handleRevealAll = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowAllOptions(true);
    onRevealAll();
  };

  const handleFeedback = (reaction) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFeedbackGiven(true);
    onFeedback(reaction);
  };

  const bounceTransform = bounceAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1.2, 1],
  });

  const revealOpacity = revealAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const revealTranslateY = revealAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  return (
    <View style={styles.container}>
      {/* Sparkle Effects */}
      {sparkleAnimations.map((anim, index) => {
        const sparkleOpacity = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 1, 0],
        });
        
        const sparkleScale = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 1.5, 0],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.sparkle,
              {
                opacity: sparkleOpacity,
                transform: [{ scale: sparkleScale }],
                left: (width * 0.2) + (index * (width * 0.15)),
                top: 50 + (index % 2) * 80,
              },
            ]}
          >
            <Ionicons name="star" size={20} color="#f59e0b" />
          </Animated.View>
        );
      })}

      {/* Main Content */}
      <Animated.View
        style={[
          styles.surpriseContainer,
          {
            transform: [{ scale: bounceTransform }],
          },
        ]}
      >
        <View style={styles.surpriseHeader}>
          <Ionicons name="gift" size={60} color="#6366f1" />
          <Text style={styles.surpriseTitle}>Surprise!</Text>
          <Text style={styles.surpriseSubtitle}>LifeLens picked for you:</Text>
        </View>

        <Animated.View
          style={[
            styles.resultContainer,
            {
              opacity: revealOpacity,
              transform: [{ translateY: revealTranslateY }],
            },
          ]}
        >
          <View style={styles.selectedOptionBox}>
            <Text style={styles.selectedOptionText}>{selectedOption}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {!showAllOptions ? (
              <TouchableOpacity
                style={styles.revealButton}
                onPress={handleRevealAll}
              >
                <Ionicons name="eye" size={20} color="#6366f1" />
                <Text style={styles.revealButtonText}>Reveal All Options</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.allOptionsContainer}>
                <Text style={styles.allOptionsTitle}>All your options were:</Text>
                {allOptions.map((option, index) => (
                  <View
                    key={index}
                    style={[
                      styles.optionItem,
                      option === selectedOption && styles.selectedOptionItem,
                    ]}
                  >
                    <Ionicons
                      name={option === selectedOption ? "radio-button-on" : "radio-button-off"}
                      size={16}
                      color={option === selectedOption ? "#6366f1" : "#9ca3af"}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        option === selectedOption && styles.selectedOptionText,
                      ]}
                    >
                      {option}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Feedback Section */}
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackTitle}>How do you feel about this choice?</Text>
            <View style={styles.emojiRow}>
              {[
                { icon: 'heart', id: 'love', label: 'Love it!' },
                { icon: 'thumbs-up', id: 'like', label: 'Good choice' },
                { icon: 'remove', id: 'neutral', label: 'It\'s okay' },
                { icon: 'thumbs-down', id: 'dislike', label: 'Not great' },
              ].map((reaction) => (
                <TouchableOpacity
                  key={reaction.id}
                  style={[
                    styles.emojiButton,
                    feedbackGiven && styles.emojiButtonDisabled,
                  ]}
                  onPress={() => handleFeedback(reaction.id)}
                  disabled={feedbackGiven}
                >
                  <Ionicons name={reaction.icon} size={28} color="#6366f1" />
                  <Text style={styles.emojiLabel}>{reaction.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {feedbackGiven && (
              <View style={styles.feedbackThankYou}>
                <Ionicons name="heart" size={16} color="#6366f1" />
                <Text style={styles.feedbackThankYouText}>Thanks for your feedback!</Text>
              </View>
            )}
          </View>

          {/* Stats Badge */}
          <View style={styles.statsContainer}>
            <Ionicons name="trophy" size={16} color="#f59e0b" />
            <Text style={styles.statsText}>
              Auto-Decision #{autoDecisionCount}
            </Text>
            {autoDecisionCount % 5 === 0 && autoDecisionCount > 0 && (
              <View style={styles.milestoneContainer}>
                <Ionicons name="star" size={16} color="#f59e0b" />
                <Text style={styles.milestoneText}>Milestone!</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  sparkle: {
    position: 'absolute',
  },
  surpriseContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  surpriseHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  surpriseTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  surpriseSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  resultContainer: {
    width: '100%',
    alignItems: 'center',
  },
  selectedOptionBox: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    minWidth: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedOptionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
  },
  actionButtons: {
    width: '100%',
    marginBottom: 24,
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    padding: 16,
  },
  revealButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 8,
  },
  allOptionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  allOptionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectedOptionItem: {
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
  },
  optionText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
  },
  selectedOptionText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  feedbackContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  emojiButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  emojiButtonDisabled: {
    opacity: 0.5,
  },
  emojiLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  feedbackThankYou: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackThankYouText: {
    fontSize: 14,
    color: '#6366f1',
    textAlign: 'center',
    fontWeight: '500',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    width: '100%',
  },
  statsText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  milestoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  milestoneText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
});