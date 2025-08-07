const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const supabase = require('../config/supabase');
const Joi = require('joi');

// Validation schemas
const profileUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  preferences: Joi.object({
    defaultCategory: Joi.string().valid('food', 'clothing', 'activity', 'work', 'social', 'other'),
    autoDecideEnabled: Joi.boolean(),
    notificationsEnabled: Joi.boolean(),
    timezone: Joi.string()
  })
});

// Get user profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      return res.status(400).json({ error: error.message });
    }

    // Get user stats
    const { count: totalDecisions } = await supabase
      .from('decisions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: totalMoods } = await supabase
      .from('moods')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        ...profile
      },
      stats: {
        totalDecisions,
        totalMoods,
        memberSince: req.user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { error: validationError } = profileUpdateSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const userId = req.user.id;
    const updates = req.body;

    // Check if profile exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existing) {
      // Update existing profile
      result = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select();
    } else {
      // Create new profile
      result = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          ...updates,
          created_at: new Date().toISOString()
        })
        .select();
    }

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({ 
      message: 'Profile updated successfully',
      profile: result.data[0]
    });
  } catch (error) {
    next(error);
  }
});

// Get user achievements/gamification stats
router.get('/achievements', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get various stats for achievements
    const { count: totalDecisions } = await supabase
      .from('decisions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: autoDecisions } = await supabase
      .from('decisions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('auto_decided', true);

    const { data: recentMoods } = await supabase
      .from('moods')
      .select('sentiment_label')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(7);

    // Calculate streaks
    const { data: dailyDecisions } = await supabase
      .from('decisions')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const currentStreak = calculateStreak(dailyDecisions);
    const positivityStreak = calculatePositivityStreak(recentMoods);

    // Define achievements
    const achievements = [
      {
        id: 'first_decision',
        name: 'Decision Maker',
        description: 'Made your first decision',
        unlocked: totalDecisions >= 1,
        progress: Math.min(totalDecisions, 1),
        total: 1
      },
      {
        id: 'decision_10',
        name: 'Getting Decisive',
        description: 'Made 10 decisions',
        unlocked: totalDecisions >= 10,
        progress: Math.min(totalDecisions, 10),
        total: 10
      },
      {
        id: 'decision_100',
        name: 'Decision Master',
        description: 'Made 100 decisions',
        unlocked: totalDecisions >= 100,
        progress: Math.min(totalDecisions, 100),
        total: 100
      },
      {
        id: 'auto_pilot',
        name: 'Auto Pilot',
        description: 'Used auto-decide 5 times',
        unlocked: autoDecisions >= 5,
        progress: Math.min(autoDecisions, 5),
        total: 5
      },
      {
        id: 'week_streak',
        name: 'Week Warrior',
        description: '7-day decision streak',
        unlocked: currentStreak >= 7,
        progress: Math.min(currentStreak, 7),
        total: 7
      },
      {
        id: 'positive_vibes',
        name: 'Positive Vibes',
        description: '3 days of positive mood',
        unlocked: positivityStreak >= 3,
        progress: Math.min(positivityStreak, 3),
        total: 3
      }
    ];

    // Calculate level based on total decisions
    const level = Math.floor(Math.sqrt(totalDecisions / 10)) + 1;
    const nextLevelDecisions = Math.pow(level, 2) * 10;
    const currentLevelDecisions = Math.pow(level - 1, 2) * 10;
    const progressToNextLevel = ((totalDecisions - currentLevelDecisions) / (nextLevelDecisions - currentLevelDecisions)) * 100;

    res.json({
      level,
      progressToNextLevel,
      totalPoints: totalDecisions * 10 + autoDecisions * 5,
      achievements,
      streaks: {
        currentDecisionStreak: currentStreak,
        positivityStreak
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to calculate daily streak
function calculateStreak(decisions) {
  if (!decisions || decisions.length === 0) return 0;
  
  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < decisions.length - 1; i++) {
    const currentDate = new Date(decisions[i].created_at);
    const nextDate = new Date(decisions[i + 1].created_at);
    
    currentDate.setHours(0, 0, 0, 0);
    nextDate.setHours(0, 0, 0, 0);
    
    const dayDiff = (currentDate - nextDate) / (1000 * 60 * 60 * 24);
    
    if (dayDiff === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// Helper function to calculate positivity streak
function calculatePositivityStreak(moods) {
  if (!moods || moods.length === 0) return 0;
  
  let streak = 0;
  for (const mood of moods) {
    if (mood.sentiment_label === 'positive') {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

module.exports = router;