import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { decisionsAPI, moodsAPI } from '../services/api';
import { getWeatherData } from '../services/weather';
import nudgeRulesConfig from '../config/nudgeRules.json';

const { width } = Dimensions.get('window');

export default function NudgeEngine({ style, onNudgeAction }) {
  const [nudge, setNudge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [slideAnimation] = useState(new Animated.Value(-width));
  const [fadeAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    generateNudge();
  }, []);

  useEffect(() => {
    if (nudge && !dismissed) {
      showNudgeAnimation();
    }
  }, [nudge, dismissed]);

  const showNudgeAnimation = () => {
    Animated.sequence([
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  };

  const hideNudgeAnimation = (callback) => {
    Animated.sequence([
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnimation, {
        toValue: width,
        duration: 400,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(callback);
  };

  const generateNudge = async () => {
    try {
      setLoading(true);
      
      // Gather contextual data
      const [nudgeData, weatherData] = await Promise.all([
        decisionsAPI.getNudgeData(7),
        getWeatherData(),
      ]);

      const context = {
        currentTime: new Date(),
        recentMoods: nudgeData.data.moods || [],
        recentDecisions: nudgeData.data.decisions || [],
        weather: weatherData,
      };

      const generatedNudge = generateContextualNudge(context);
      setNudge(generatedNudge);
    } catch (error) {
      console.error('Failed to generate nudge:', error);
      setNudge(null);
    } finally {
      setLoading(false);
    }
  };

  const generateContextualNudge = (context) => {
    const { currentTime, recentMoods, recentDecisions, weather } = context;
    const hour = currentTime.getHours();
    const isWeekend = [0, 6].includes(currentTime.getDay());
    
    // Get latest mood sentiment
    const latestMood = recentMoods[0];
    const moodSentiment = latestMood?.sentiment || 'neutral';
    const moodConfidence = latestMood?.confidence || 0.5;
    
    // Analyze recent decision patterns
    const outdoorDecisions = recentDecisions.filter(d => 
      d.category === 'activity' && 
      (d.decision?.toLowerCase().includes('walk') || 
       d.decision?.toLowerCase().includes('outside') ||
       d.decision?.toLowerCase().includes('park'))
    );
    
    const workDecisions = recentDecisions.filter(d => d.category === 'work');
    const foodDecisions = recentDecisions.filter(d => d.category === 'food');
    
    // Weather context
    const isGoodWeather = weather?.main?.temp > 15 && 
                         weather?.weather?.[0]?.main !== 'Rain' &&
                         weather?.weather?.[0]?.main !== 'Snow';
    
    // Generate nudge based on rules from config
    const rules = nudgeRulesConfig.rules.filter(rule => rule.active);
    
    for (const rule of rules) {
      if (evaluateRule(rule, {
        hour,
        isWeekend,
        moodSentiment,
        moodConfidence,
        outdoorDecisions: outdoorDecisions.length,
        workDecisions: workDecisions.length,
        foodDecisions: foodDecisions.length,
        isGoodWeather,
        weather,
        weatherMain: weather?.weather?.[0]?.main,
        socialDecisions: recentDecisions.filter(d => d.category === 'social').length,
      })) {
        return rule.nudge;
      }
    }
    
    return null; // No nudge if no rules match
  };

  const evaluateRule = (rule, context) => {
    return rule.conditions.every(condition => {
      const { type, operator, value, field } = condition;
      const contextValue = context[field];
      
      switch (operator) {
        case 'equals':
          return contextValue === value;
        case 'greater_than':
          return contextValue > value;
        case 'less_than':
          return contextValue < value;
        case 'between':
          return contextValue >= value[0] && contextValue <= value[1];
        case 'includes':
          return value.includes(contextValue);
        case 'boolean':
          return contextValue === value;
        default:
          return false;
      }
    });
  };

  const handleNudgeAction = async (action) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    try {
      // Track nudge interaction
      if (nudge) {
        await decisionsAPI.submitNudgeFeedback(
          nudge.id || 'unknown',
          action === 'dismiss' ? 'dismissed' : action === 'accept' ? 'accepted' : 'thanked',
          nudge.type
        );
      }
    } catch (error) {
      console.error('Failed to track nudge feedback:', error);
    }
    
    if (action === 'dismiss') {
      hideNudgeAnimation(() => {
        setDismissed(true);
      });
    } else if (action === 'accept') {
      // Track nudge acceptance
      if (onNudgeAction) {
        onNudgeAction(nudge, 'accepted');
      }
      
      hideNudgeAnimation(() => {
        setDismissed(true);
      });
    } else if (action === 'thanks') {
      // Track positive feedback
      if (onNudgeAction) {
        onNudgeAction(nudge, 'thanked');
      }
      
      hideNudgeAnimation(() => {
        setDismissed(true);
      });
    }
  };

  if (loading || !nudge || dismissed) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ translateX: slideAnimation }],
          opacity: fadeAnimation,
        },
      ]}
    >
      <View style={[styles.card, { backgroundColor: nudge.color }]}>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => handleNudgeAction('dismiss')}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.iconContainer}>
          <Ionicons name={nudge.icon} size={28} color="#fff" />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>{nudge.title}</Text>
          <Text style={styles.message}>{nudge.message}</Text>
          
          {nudge.actionable && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleNudgeAction('accept')}
              >
                <Text style={styles.actionText}>{nudge.actionText}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.thanksButton}
                onPress={() => handleNudgeAction('thanks')}
              >
                <Text style={styles.thanksText}>Thanks! 😊</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  dismissButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.9,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  thanksButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  thanksText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});