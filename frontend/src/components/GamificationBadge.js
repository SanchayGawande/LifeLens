import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../styles/theme';

export default function GamificationBadge({ 
  autoDecisionCount = 0,
  totalDecisions = 0,
  showAnimation = false,
  style 
}) {
  const [scaleAnimation] = useState(new Animated.Value(1));
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    if (showAnimation) {
      // Celebration animation for milestones
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous pulse for special milestones
      if (autoDecisionCount % 10 === 0 && autoDecisionCount > 0) {
        const pulse = () => {
          Animated.sequence([
            Animated.timing(pulseAnimation, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnimation, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]).start(() => pulse());
        };
        pulse();
      }
    }
  }, [showAnimation, autoDecisionCount]);

  const getAchievementLevel = () => {
    if (autoDecisionCount >= 50) return { level: 'Master', color: '#8b5cf6', icon: 'diamond' };
    if (autoDecisionCount >= 25) return { level: 'Expert', color: '#f59e0b', icon: 'star' };
    if (autoDecisionCount >= 10) return { level: 'Explorer', color: '#10b981', icon: 'trophy' };
    if (autoDecisionCount >= 5) return { level: 'Adventurer', color: '#3b82f6', icon: 'rocket' };
    if (autoDecisionCount >= 1) return { level: 'Beginner', color: '#6b7280', icon: 'flash' };
    return { level: 'New User', color: '#9ca3af', icon: 'person' };
  };

  const getStreakInfo = () => {
    const recentDecisions = autoDecisionCount;
    if (recentDecisions >= 5) return { icon: 'flame', color: '#f59e0b', text: 'On Fire!' };
    if (recentDecisions >= 3) return { icon: 'flash', color: '#8b5cf6', text: 'Good Streak' };
    return { icon: 'star', color: '#10b981', text: 'Getting Started' };
  };

  const achievement = getAchievementLevel();
  const streak = getStreakInfo();

  return (
    <Animated.View 
      style={[
        styles.container, 
        style,
        { 
          transform: [
            { scale: scaleAnimation },
            { scale: pulseAnimation }
          ] 
        }
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.levelBadge, { backgroundColor: `${achievement.color}20` }]}>
          <Ionicons name={achievement.icon} size={20} color={achievement.color} />
          <Text style={[styles.levelText, { color: achievement.color }]}>
            {achievement.level}
          </Text>
        </View>
        
        {autoDecisionCount > 0 && (
          <View style={styles.streakContainer}>
            <Ionicons name={streak.icon} size={16} color={streak.color} style={styles.streakIcon} />
            <Text style={styles.streakText}>{streak.text}</Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{autoDecisionCount}</Text>
          <Text style={styles.statLabel}>Auto-Decisions</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalDecisions}</Text>
          <Text style={styles.statLabel}>Total Decisions</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {totalDecisions > 0 ? Math.round((autoDecisionCount / totalDecisions) * 100) : 0}%
          </Text>
          <Text style={styles.statLabel}>Surprise Rate</Text>
        </View>
      </View>

      {/* Progress to next level */}
      {autoDecisionCount < 50 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {getNextLevelInfo(autoDecisionCount)}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${getProgressPercentage(autoDecisionCount)}%`,
                  backgroundColor: achievement.color 
                }
              ]} 
            />
          </View>
        </View>
      )}

      {/* Special milestone celebration */}
      {autoDecisionCount > 0 && autoDecisionCount % 5 === 0 && (
        <View style={styles.milestoneContainer}>
          <Ionicons name="star" size={16} color="#f59e0b" />
          <Text style={styles.milestoneText}>
            Milestone Reached!
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

function getNextLevelInfo(count) {
  if (count < 5) return `${5 - count} more for Adventurer level`;
  if (count < 10) return `${10 - count} more for Explorer level`;
  if (count < 25) return `${25 - count} more for Expert level`;
  if (count < 50) return `${50 - count} more for Master level`;
  return 'Master level achieved!';
}

function getProgressPercentage(count) {
  if (count < 5) return (count / 5) * 100;
  if (count < 10) return ((count - 5) / 5) * 100;
  if (count < 25) return ((count - 10) / 15) * 100;
  if (count < 50) return ((count - 25) / 25) * 100;
  return 100;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.glass.primary,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    borderRadius: SPACING.radius.lg,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SPACING.radius.base,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
  },
  levelText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginLeft: SPACING.xs,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIcon: {
    marginRight: SPACING.xs,
  },
  streakText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.glass.border,
    marginHorizontal: SPACING.sm,
  },
  progressContainer: {
    marginBottom: SPACING.base,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.glass.secondary,
    borderRadius: SPACING.radius.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: SPACING.radius.xs,
  },
  milestoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.accent.warning}20`,
    borderRadius: SPACING.radius.sm,
    padding: SPACING.sm,
  },
  milestoneText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.accent.warning,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginLeft: SPACING.xs,
  },
});