import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../services/authStore';
import { usersAPI, decisionsAPI } from '../services/api';
import { COLORS, TYPOGRAPHY, SPACING } from '../styles/theme';
import GlassCard from '../components/GlassCard';
import GamificationBadge from '../components/GamificationBadge';

const ACHIEVEMENT_ICONS = {
  first_decision: 'checkmark-circle',
  decision_10: 'ribbon',
  decision_100: 'trophy',
  auto_pilot: 'flash',
  week_streak: 'flame',
  positive_vibes: 'happy',
};

export default function ProfileScreen() {
  const { user, clearAuth } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [gamificationStats, setGamificationStats] = useState(null);
  const [decisionStats, setDecisionStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    autoDecideEnabled: false,
    notificationsEnabled: false,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [profileData, achievementsData, gamificationData, decisionsData] = await Promise.all([
        usersAPI.getProfile(),
        usersAPI.getAchievements(),
        decisionsAPI.getGamificationStats(),
        decisionsAPI.getStats(),
      ]);
      
      setProfile(profileData);
      setAchievements(achievementsData);
      setGamificationStats(gamificationData);
      setDecisionStats(decisionsData);
      
      if (profileData.user.preferences) {
        setPreferences(profileData.user.preferences);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      await usersAPI.updateProfile({ preferences: newPreferences });
    } catch (error) {
      // Revert on error
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to update preferences');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            clearAuth();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <GlassCard style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </GlassCard>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Profile</Text>
      </View>

      {/* Profile Section */}
      <GlassCard style={styles.profileSection}>
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={COLORS.gradient.primary}
            style={styles.avatar}
          >
            <Ionicons name="person" size={40} color={COLORS.text.primary} />
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {profile?.user?.name || user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

      </GlassCard>

      {/* Progress Section */}
      {achievements && (
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={24} color={COLORS.accent.warning} />
            <Text style={styles.sectionTitle}>Your Progress</Text>
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelLabel}>Level {achievements.level}</Text>
            <Text style={styles.pointsLabel}>{achievements.totalPoints} points</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${achievements.progressToNextLevel}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {achievements.progressToNextLevel.toFixed(0)}% to Level {achievements.level + 1}
          </Text>
        </GlassCard>
      )}

      {/* Auto-Decision Stats Section */}
      {gamificationStats && decisionStats && (
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={24} color={COLORS.accent.warning} />
            <Text style={styles.sectionTitle}>Auto-Decision Stats</Text>
          </View>
          <View style={styles.gamificationContainer}>
            <GamificationBadge
              autoDecisionCount={gamificationStats.autoDecisionCount || 0}
              totalDecisions={decisionStats.totalDecisions || 0}
              showAnimation={false}
            />
          </View>
        </GlassCard>
      )}

      {/* Preferences Section */}
      <GlassCard style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="settings" size={24} color={COLORS.accent.primary} />
          <Text style={styles.sectionTitle}>Preferences</Text>
        </View>
        
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Ionicons name="flash" size={24} color={COLORS.accent.warning} />
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceName}>Auto-Decide Default</Text>
              <Text style={styles.preferenceDescription}>
                Enable auto-decide by default for new decisions
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.autoDecideEnabled}
            onValueChange={(value) => updatePreference('autoDecideEnabled', value)}
            trackColor={{ false: COLORS.glass.primary, true: `${COLORS.accent.warning}60` }}
            thumbColor={preferences.autoDecideEnabled ? COLORS.accent.warning : COLORS.text.disabled}
            ios_backgroundColor={COLORS.glass.primary}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Ionicons name="notifications" size={24} color={COLORS.accent.primary} />
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceName}>Daily Reminders</Text>
              <Text style={styles.preferenceDescription}>
                Get reminders to check your mood
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.notificationsEnabled}
            onValueChange={(value) => updatePreference('notificationsEnabled', value)}
            trackColor={{ false: COLORS.glass.primary, true: `${COLORS.accent.primary}60` }}
            thumbColor={preferences.notificationsEnabled ? COLORS.accent.primary : COLORS.text.disabled}
            ios_backgroundColor={COLORS.glass.primary}
          />
        </View>
      </GlassCard>

      {/* Achievements Section */}
      <GlassCard style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy" size={24} color={COLORS.accent.success} />
          <Text style={styles.sectionTitle}>Achievements</Text>
        </View>
        
        {achievements?.achievements.map((achievement) => (
          <View
            key={achievement.id}
            style={[
              styles.achievementItem,
              achievement.unlocked && styles.achievementUnlocked,
            ]}
          >
            <LinearGradient
              colors={achievement.unlocked 
                ? [COLORS.accent.success, COLORS.accent.info] 
                : [COLORS.glass.primary, COLORS.glass.secondary]
              }
              style={[
                styles.achievementIcon,
                achievement.unlocked && styles.achievementIconUnlocked,
              ]}
            >
              <Ionicons
                name={ACHIEVEMENT_ICONS[achievement.id] || 'star'}
                size={24}
                color={achievement.unlocked ? COLORS.text.primary : COLORS.text.tertiary}
              />
            </LinearGradient>
            <View style={styles.achievementInfo}>
              <Text
                style={[
                  styles.achievementName,
                  !achievement.unlocked && styles.achievementNameLocked,
                ]}
              >
                {achievement.name}
              </Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
              <View style={styles.achievementProgress}>
                <View style={styles.achievementProgressBar}>
                  <View
                    style={[
                      styles.achievementProgressFill,
                      {
                        width: `${(achievement.progress / achievement.total) * 100}%`,
                        backgroundColor: achievement.unlocked ? COLORS.accent.success : COLORS.accent.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.achievementProgressText}>
                  {achievement.progress}/{achievement.total}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </GlassCard>

      {/* Statistics Section */}
      <GlassCard style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bar-chart" size={24} color={COLORS.accent.info} />
          <Text style={styles.sectionTitle}>Statistics</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statItem} variant="primary">
            <Ionicons name="checkmark-circle" size={20} color={COLORS.accent.success} />
            <Text style={styles.statValue}>{profile?.stats.totalDecisions || 0}</Text>
            <Text style={styles.statLabel}>Decisions Made</Text>
          </GlassCard>
          
          <GlassCard style={styles.statItem} variant="primary">
            <Ionicons name="happy" size={20} color={COLORS.accent.warning} />
            <Text style={styles.statValue}>{profile?.stats.totalMoods || 0}</Text>
            <Text style={styles.statLabel}>Mood Checks</Text>
          </GlassCard>
          
          <GlassCard style={styles.statItem} variant="primary">
            <Ionicons name="flame" size={20} color={COLORS.accent.error} />
            <Text style={styles.statValue}>
              {achievements?.streaks.currentDecisionStreak || 0}
            </Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </GlassCard>
          
          <GlassCard style={styles.statItem} variant="primary">
            <Ionicons name="calendar" size={20} color={COLORS.accent.info} />
            <Text style={styles.statValue}>
              {profile?.stats.memberSince
                ? Math.floor(
                    (new Date() - new Date(profile.stats.memberSince)) / (1000 * 60 * 60 * 24)
                  )
                : 0}
            </Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </GlassCard>
        </View>
      </GlassCard>

      {/* Sign Out Button */}
      <GlassCard style={styles.signOutCard}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.accent.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
    paddingBottom: 24,
  },
  
  // Page Header
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: 24,
  },
  
  pageTitle: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  
  // Loading State
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: SPACING.lg,
    marginTop: SPACING['4xl'],
    paddingVertical: SPACING['2xl'],
  },
  
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    marginTop: SPACING.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  // Profile Section
  profileSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  
  profileInfo: {
    flex: 1,
  },
  
  userName: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  userEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    opacity: 0.8,
  },
  
  
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.base,
  },
  
  levelLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  
  pointsLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.accent.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  
  progressBar: {
    height: 8,
    backgroundColor: COLORS.glass.primary,
    borderRadius: SPACING.radius.sm,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent.primary,
    borderRadius: SPACING.radius.sm,
  },
  
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  // Section Styles
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  
  gamificationContainer: {
    paddingHorizontal: 0,
  },
  
  // Preferences
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
    marginBottom: SPACING.sm,
  },
  
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  preferenceText: {
    marginLeft: SPACING.base,
    flex: 1,
  },
  
  preferenceName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  preferenceDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    opacity: 0.8,
  },
  
  // Achievements
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
    marginBottom: SPACING.sm,
    opacity: 0.6,
  },
  
  achievementUnlocked: {
    opacity: 1,
  },
  
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
    overflow: 'hidden',
  },
  
  achievementIconUnlocked: {
    // Gradient handled by LinearGradient component
  },
  
  achievementInfo: {
    flex: 1,
  },
  
  achievementName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  achievementNameLocked: {
    color: COLORS.text.tertiary,
  },
  
  achievementDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
    opacity: 0.8,
  },
  
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  achievementProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.glass.primary,
    borderRadius: 2,
    marginRight: SPACING.sm,
  },
  
  achievementProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  
  achievementProgressText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    minWidth: 35,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  // Statistics
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.base,
  },
  
  statItem: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.base,
  },
  
  statValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    opacity: 0.8,
  },
  
  // Sign Out
  signOutCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 0,
  },
  
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: SPACING.radius.base,
  },
  
  signOutText: {
    color: COLORS.accent.error,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.sm,
  },
  
  footer: {
    height: 120, // Space for floating dock tab bar
  },
});