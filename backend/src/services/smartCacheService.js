const NodeCache = require('node-cache');
const crypto = require('crypto');

class SmartCacheService {
  constructor() {
    // Different cache instances for different types of data
    this.aiResponseCache = new NodeCache({ 
      stdTTL: 300,        // 5 minutes for AI responses
      checkperiod: 60,    // Check for expired keys every minute
      maxKeys: 1000       // Maximum number of keys
    });
    
    this.imageAnalysisCache = new NodeCache({
      stdTTL: 86400,      // 24 hours for image analysis
      checkperiod: 3600,  // Check hourly
      maxKeys: 500
    });
    
    this.userPreferencesCache = new NodeCache({
      stdTTL: 1800,       // 30 minutes for user preferences
      checkperiod: 300,   // Check every 5 minutes
      maxKeys: 200
    });

    // Statistics for cache performance
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Generate a cache key for AI responses
   */
  generateAIResponseKey(images, context) {
    const imageHashes = images.map(img => 
      this.hashString(img.caption + img.label + (img.url || ''))
    );
    
    const contextHash = this.hashString(JSON.stringify({
      mood: context.mood,
      category: context.category,
      question: context.question,
      weather: context.weather
    }));

    return `ai_response:${imageHashes.join(':')}:${contextHash}`;
  }

  /**
   * Generate a cache key for image analysis
   */
  generateImageAnalysisKey(imageUrl, category = 'general') {
    const urlHash = this.hashString(imageUrl);
    return `image_analysis:${category}:${urlHash}`;
  }

  /**
   * Generate a cache key for user preferences
   */
  generateUserPreferencesKey(userId) {
    return `user_prefs:${userId}`;
  }

  /**
   * Get cached AI response
   */
  getCachedAIResponse(images, context) {
    try {
      const key = this.generateAIResponseKey(images, context);
      const cached = this.aiResponseCache.get(key);
      
      if (cached) {
        this.stats.hits++;
        console.log('Cache HIT for AI response:', key.substring(0, 50) + '...');
        return {
          ...cached,
          cached: true,
          cacheKey: key
        };
      }
      
      this.stats.misses++;
      console.log('Cache MISS for AI response');
      return null;
    } catch (error) {
      console.warn('Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Cache AI response
   */
  setCachedAIResponse(images, context, response) {
    try {
      const key = this.generateAIResponseKey(images, context);
      
      // Don't cache fallback responses
      if (response.fallback) {
        console.log('Not caching fallback response');
        return false;
      }

      // Add cache metadata
      const cacheData = {
        ...response,
        cachedAt: new Date().toISOString(),
        cacheKey: key
      };

      this.aiResponseCache.set(key, cacheData);
      this.stats.sets++;
      console.log('Cached AI response:', key.substring(0, 50) + '...');
      return true;
    } catch (error) {
      console.warn('Cache set error:', error.message);
      return false;
    }
  }

  /**
   * Get cached image analysis
   */
  getCachedImageAnalysis(imageUrl, category = 'general') {
    try {
      const key = this.generateImageAnalysisKey(imageUrl, category);
      const cached = this.imageAnalysisCache.get(key);
      
      if (cached) {
        this.stats.hits++;
        console.log('Cache HIT for image analysis');
        return cached;
      }
      
      this.stats.misses++;
      return null;
    } catch (error) {
      console.warn('Image analysis cache get error:', error.message);
      return null;
    }
  }

  /**
   * Cache image analysis
   */
  setCachedImageAnalysis(imageUrl, category = 'general', analysis) {
    try {
      const key = this.generateImageAnalysisKey(imageUrl, category);
      
      const cacheData = {
        analysis,
        cachedAt: new Date().toISOString(),
        category
      };

      this.imageAnalysisCache.set(key, cacheData);
      this.stats.sets++;
      console.log('Cached image analysis for category:', category);
      return true;
    } catch (error) {
      console.warn('Image analysis cache set error:', error.message);
      return false;
    }
  }

  /**
   * Get cached user preferences
   */
  getCachedUserPreferences(userId) {
    try {
      const key = this.generateUserPreferencesKey(userId);
      const cached = this.userPreferencesCache.get(key);
      
      if (cached) {
        this.stats.hits++;
        return cached;
      }
      
      this.stats.misses++;
      return null;
    } catch (error) {
      console.warn('User preferences cache get error:', error.message);
      return null;
    }
  }

  /**
   * Cache user preferences
   */
  setCachedUserPreferences(userId, preferences) {
    try {
      const key = this.generateUserPreferencesKey(userId);
      
      const cacheData = {
        preferences,
        cachedAt: new Date().toISOString()
      };

      this.userPreferencesCache.set(key, cacheData);
      this.stats.sets++;
      return true;
    } catch (error) {
      console.warn('User preferences cache set error:', error.message);
      return false;
    }
  }

  /**
   * Invalidate user preferences cache
   */
  invalidateUserPreferences(userId) {
    try {
      const key = this.generateUserPreferencesKey(userId);
      const deleted = this.userPreferencesCache.del(key);
      if (deleted) {
        this.stats.deletes++;
        console.log('Invalidated user preferences cache for:', userId);
      }
      return deleted;
    } catch (error) {
      console.warn('Cache invalidation error:', error.message);
      return false;
    }
  }

  /**
   * Clear all caches
   */
  clearAll() {
    try {
      this.aiResponseCache.flushAll();
      this.imageAnalysisCache.flushAll();
      this.userPreferencesCache.flushAll();
      
      console.log('All caches cleared');
      return true;
    } catch (error) {
      console.warn('Cache clear error:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      caches: {
        aiResponses: {
          keys: this.aiResponseCache.keys().length,
          stats: this.aiResponseCache.getStats()
        },
        imageAnalysis: {
          keys: this.imageAnalysisCache.keys().length,
          stats: this.imageAnalysisCache.getStats()
        },
        userPreferences: {
          keys: this.userPreferencesCache.keys().length,
          stats: this.userPreferencesCache.getStats()
        }
      }
    };
  }

  /**
   * Similar decisions optimization - find similar past decisions
   */
  findSimilarDecisions(images, context, threshold = 0.8) {
    try {
      // Get all AI response cache keys
      const keys = this.aiResponseCache.keys();
      const similarities = [];

      keys.forEach(key => {
        const similarity = this.calculateSimilarity(images, context, key);
        if (similarity >= threshold) {
          const cached = this.aiResponseCache.get(key);
          similarities.push({
            similarity,
            response: cached,
            key
          });
        }
      });

      // Sort by similarity (highest first)
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      if (similarities.length > 0) {
        console.log(`Found ${similarities.length} similar decisions`);
        return similarities[0].response; // Return most similar
      }

      return null;
    } catch (error) {
      console.warn('Similar decisions search error:', error.message);
      return null;
    }
  }

  /**
   * Calculate similarity between current request and cached decision
   */
  calculateSimilarity(images, context, cacheKey) {
    try {
      // Extract context hash from key
      const keyParts = cacheKey.split(':');
      if (keyParts.length < 3) return 0;

      // Simple similarity based on context matching
      let similarity = 0;
      
      // Mood similarity (40% weight)
      if (context.mood && keyParts.includes(this.hashString(context.mood))) {
        similarity += 0.4;
      }
      
      // Category similarity (30% weight)
      if (context.category && keyParts.includes(this.hashString(context.category))) {
        similarity += 0.3;
      }
      
      // Question similarity (20% weight) - basic check
      if (context.question && keyParts.some(part => 
        part.includes(this.hashString(context.question.substring(0, 20)))
      )) {
        similarity += 0.2;
      }
      
      // Image count similarity (10% weight)
      if (images.length === keyParts.length - 2) {
        similarity += 0.1;
      }

      return similarity;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Hash a string for cache keys
   */
  hashString(str) {
    return crypto.createHash('md5').update(str).digest('hex').substring(0, 8);
  }

  /**
   * Cleanup expired entries manually
   */
  cleanup() {
    try {
      // NodeCache handles this automatically, but we can force it
      const beforeAI = this.aiResponseCache.keys().length;
      const beforeImage = this.imageAnalysisCache.keys().length;
      const beforeUser = this.userPreferencesCache.keys().length;

      // Force cleanup of expired keys
      this.aiResponseCache.prune();
      this.imageAnalysisCache.prune();
      this.userPreferencesCache.prune();

      const afterAI = this.aiResponseCache.keys().length;
      const afterImage = this.imageAnalysisCache.keys().length;
      const afterUser = this.userPreferencesCache.keys().length;

      console.log('Cache cleanup completed:', {
        aiResponses: `${beforeAI} -> ${afterAI}`,
        imageAnalysis: `${beforeImage} -> ${afterImage}`,
        userPreferences: `${beforeUser} -> ${afterUser}`
      });

      return true;
    } catch (error) {
      console.warn('Cache cleanup error:', error.message);
      return false;
    }
  }
}

module.exports = new SmartCacheService();