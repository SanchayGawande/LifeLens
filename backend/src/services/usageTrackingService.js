const supabase = require('../config/supabase');

class UsageTrackingService {
  constructor() {
    this.dailyLimits = {
      free: 10,        // 10 decisions per day
      premium: 1000,   // 1000 decisions per day
      unlimited: -1    // No limit
    };
    
    this.features = {
      free: ['basic_ai', 'mood_tracking', 'simple_analysis'],
      premium: ['enhanced_ai', 'detailed_analysis', 'priority_support', 'unlimited_decisions'],
      unlimited: ['all_features', 'api_access', 'custom_models']
    };
  }

  /**
   * Check if user can make a decision (within daily limits)
   */
  async canMakeDecision(userId, decisionType = 'photo') {
    try {
      // Get user's subscription tier
      const userTier = await this.getUserTier(userId);
      
      // Get today's usage
      const todayUsage = await this.getTodayUsage(userId, decisionType);
      
      // Check limits
      const limit = this.dailyLimits[userTier];
      
      if (limit === -1) {
        return { allowed: true, tier: userTier, usage: todayUsage, limit: 'unlimited' };
      }
      
      const allowed = todayUsage < limit;
      
      return {
        allowed,
        tier: userTier,
        usage: todayUsage,
        limit,
        remaining: Math.max(0, limit - todayUsage),
        resetTime: this.getNextResetTime()
      };
      
    } catch (error) {
      console.error('Usage check failed:', error);
      // Allow on error (fail-open for better UX)
      return { allowed: true, tier: 'free', usage: 0, limit: this.dailyLimits.free, error: true };
    }
  }

  /**
   * Track a decision usage
   */
  async trackDecision(userId, decisionType = 'photo', metadata = {}) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const usageRecord = {
        user_id: userId,
        decision_type: decisionType,
        usage_date: today,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          ai_model: metadata.ai_model || 'standard',
          processing_time: metadata.processing_time || 0
        }
      };

      const { error } = await supabase
        .from('usage_tracking')
        .insert(usageRecord);

      if (error) {
        console.error('Failed to track usage:', error);
        // Don't fail the main operation if tracking fails
      }

      // Update daily summary
      await this.updateDailySummary(userId, today, decisionType);

    } catch (error) {
      console.error('Usage tracking error:', error);
      // Don't throw - tracking failures shouldn't break the main flow
    }
  }

  /**
   * Get user's subscription tier
   */
  async getUserTier(userId) {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('subscription_tier, subscription_status')
        .eq('user_id', userId)
        .single();

      if (error || !profile) {
        return 'free'; // Default to free tier
      }

      // Check if subscription is active
      if (profile.subscription_status === 'active' && profile.subscription_tier) {
        return profile.subscription_tier;
      }

      return 'free';
    } catch (error) {
      console.error('Failed to get user tier:', error);
      return 'free';
    }
  }

  /**
   * Get today's usage count
   */
  async getTodayUsage(userId, decisionType) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { count, error } = await supabase
        .from('usage_tracking')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('decision_type', decisionType)
        .eq('usage_date', today);

      if (error) {
        console.error('Failed to get usage count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Usage count error:', error);
      return 0;
    }
  }

  /**
   * Update daily usage summary
   */
  async updateDailySummary(userId, date, decisionType) {
    try {
      // Get current count for the day
      const { count } = await supabase
        .from('usage_tracking')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('usage_date', date)
        .eq('decision_type', decisionType);

      // Upsert daily summary
      const { error } = await supabase
        .from('daily_usage_summary')
        .upsert({
          user_id: userId,
          usage_date: date,
          decision_type: decisionType,
          count: count || 0,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to update daily summary:', error);
      }
    } catch (error) {
      console.error('Daily summary update error:', error);
    }
  }

  /**
   * Get next reset time (midnight UTC)
   */
  getNextResetTime() {
    const now = new Date();
    const tomorrow = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    return tomorrow.toISOString();
  }

  /**
   * Get user's usage statistics
   */
  async getUserUsageStats(userId, days = 7) {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

      const { data: dailyStats, error: dailyError } = await supabase
        .from('daily_usage_summary')
        .select('*')
        .eq('user_id', userId)
        .gte('usage_date', startDate)
        .lte('usage_date', endDate)
        .order('usage_date', { ascending: false });

      if (dailyError) {
        throw dailyError;
      }

      const userTier = await this.getUserTier(userId);
      const todayUsage = await this.getTodayUsage(userId, 'photo');

      return {
        tier: userTier,
        todayUsage,
        limit: this.dailyLimits[userTier],
        remaining: this.dailyLimits[userTier] === -1 ? 'unlimited' : Math.max(0, this.dailyLimits[userTier] - todayUsage),
        dailyStats: dailyStats || [],
        resetTime: this.getNextResetTime()
      };

    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return {
        tier: 'free',
        todayUsage: 0,
        limit: this.dailyLimits.free,
        remaining: this.dailyLimits.free,
        dailyStats: [],
        error: true
      };
    }
  }

  /**
   * Check if user has access to a feature
   */
  hasFeatureAccess(userTier, featureName) {
    const tierFeatures = this.features[userTier] || this.features.free;
    
    // Check specific feature
    if (tierFeatures.includes(featureName)) {
      return true;
    }
    
    // Check if user has all features
    if (tierFeatures.includes('all_features')) {
      return true;
    }
    
    return false;
  }

  /**
   * Get upgrade suggestions based on usage
   */
  async getUpgradeSuggestions(userId) {
    try {
      const stats = await this.getUserUsageStats(userId, 30);
      const suggestions = [];

      if (stats.tier === 'free') {
        // Check if user is hitting limits
        const avgDailyUsage = stats.dailyStats.reduce((sum, day) => sum + day.count, 0) / Math.max(stats.dailyStats.length, 1);
        
        if (avgDailyUsage > 7) {
          suggestions.push({
            type: 'upgrade_premium',
            reason: 'You\'re using LifeLens frequently! Upgrade to Premium for unlimited decisions.',
            benefit: 'Unlimited daily decisions + enhanced AI analysis',
            urgency: 'high'
          });
        } else if (avgDailyUsage > 3) {
          suggestions.push({
            type: 'consider_premium',
            reason: 'Consider Premium for enhanced AI features and detailed analysis.',
            benefit: 'Better image understanding + category-specific insights',
            urgency: 'medium'
          });
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Failed to get upgrade suggestions:', error);
      return [];
    }
  }

  /**
   * Get service health and performance metrics
   */
  getServiceMetrics() {
    return {
      dailyLimits: this.dailyLimits,
      availableFeatures: this.features,
      service: 'usage-tracking',
      status: 'active'
    };
  }
}

module.exports = new UsageTrackingService();