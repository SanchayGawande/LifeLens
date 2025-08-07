import React, { useState, useEffect } from 'react';
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

export default function AutoDecisionToggle({ 
  isEnabled, 
  onToggle, 
  autoDecisionCount = 0,
  style 
}) {
  const [slideAnim] = useState(new Animated.Value(isEnabled ? 1 : 0));
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isEnabled ? 1 : 0,
      useNativeDriver: true,
      tension: 120,
      friction: 7,
    }).start();
  }, [isEnabled]);

  const handleToggle = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle(!isEnabled);
  };

  const toggleBackgroundColor = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e5e7eb', '#6366f1'],
  });

  const toggleTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 27],
  });

  const iconRotate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        style,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Animated.View 
            style={[
              styles.iconContainer,
              { transform: [{ rotate: iconRotate }] }
            ]}
          >
            <Ionicons 
              name={isEnabled ? "flash" : "flash-outline"} 
              size={24} 
              color={isEnabled ? "#6366f1" : "#9ca3af"} 
            />
          </Animated.View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Let LifeLens Decide For Me</Text>
            <Text style={styles.subtitle}>
              {isEnabled 
                ? "Ready to surprise you!" 
                : "Skip the thinking, get instant decisions"
              }
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.toggleContainer}
          onPress={handleToggle}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.toggleBackground,
              { backgroundColor: toggleBackgroundColor }
            ]}
          >
            <Animated.View
              style={[
                styles.toggleCircle,
                { transform: [{ translateX: toggleTranslateX }] }
              ]}
            >
              <Ionicons
                name={isEnabled ? "checkmark" : "close"}
                size={16}
                color={isEnabled ? "#6366f1" : "#9ca3af"}
              />
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Gamification Badge */}
      {autoDecisionCount > 0 && (
        <View style={styles.badgeContainer}>
          <Ionicons name="trophy" size={16} color="#f59e0b" />
          <Text style={styles.badgeText}>
            You've used Auto-Decision {autoDecisionCount} time{autoDecisionCount !== 1 ? 's' : ''}!
          </Text>
          {autoDecisionCount >= 5 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={12} color="#fff" />
            </View>
          )}
        </View>
      )}

      {/* Features List */}
      <View style={styles.featuresContainer}>
        <View style={styles.feature}>
          <Ionicons name="shuffle" size={16} color="#6366f1" />
          <Text style={styles.featureText}>Random selection from your options</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="eye" size={16} color="#6366f1" />
          <Text style={styles.featureText}>Reveal all options anytime</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="heart" size={16} color="#6366f1" />
          <Text style={styles.featureText}>Rate your surprise decision</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  toggleContainer: {
    marginLeft: 16,
  },
  toggleBackground: {
    width: 54,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  streakBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featuresContainer: {
    gap: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 10,
    lineHeight: 18,
  },
});