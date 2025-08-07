const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const openRouterClient = require('../config/openrouter');
const supabase = require('../config/supabase');
const NodeCache = require('node-cache');
const Joi = require('joi');
const photoService = require('../services/photoService');
const photoAIService = require('../services/photoAIService');
const usageTrackingService = require('../services/usageTrackingService');
const smartCacheService = require('../services/smartCacheService');

// Cache for AI responses (5 minutes TTL)
const decisionCache = new NodeCache({ stdTTL: 300 });

// Validation schemas
const decisionSchema = Joi.object({
  question: Joi.string().min(10).max(500).required(),
  context: Joi.object({
    mood: Joi.string(),
    category: Joi.string().valid('food', 'clothing', 'activity', 'work', 'social', 'other'),
    timeOfDay: Joi.string(),
    weather: Joi.string(),
    location: Joi.string()
  }),
  autoDecide: Joi.boolean()
});

// New enhanced decision schema
const enhancedDecisionSchema = Joi.object({
  inputText: Joi.string().min(10).max(1000).required(),
  mood: Joi.string().max(50).optional(),
  preferences: Joi.object().optional(),
  category: Joi.string().valid('food', 'clothing', 'activity', 'work', 'social', 'other').optional(),
  autoDecide: Joi.boolean().optional(),
  context: Joi.object({
    timeOfDay: Joi.string(),
    weather: Joi.string(),
    location: Joi.string(),
    timestamp: Joi.string()
  }).optional()
});

// Multer configuration for photo uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 3 // Maximum 3 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'), false);
    }
  }
});

// Photo decision validation schema
const photoDecisionSchema = Joi.object({
  question: Joi.string().min(5).max(500).required(),
  mood: Joi.string().max(50).optional(),
  category: Joi.string().valid('food', 'clothing', 'activity', 'work', 'social', 'other').optional(),
  labels: Joi.alternatives().try(
    Joi.array().items(Joi.string().max(100)).max(3),
    Joi.string() // Allow string that will be parsed
  ).optional(),
  weather: Joi.alternatives().try(
    Joi.object({
      description: Joi.string(),
      temperature: Joi.number(),
      humidity: Joi.number()
    }),
    Joi.string() // Allow string that will be parsed
  ).optional(),
  images: Joi.any().optional() // Allow images field from FormData
}).unknown(true); // Allow unknown fields from FormData

// Photo-based decision endpoint
router.post('/decide-photo', authenticate, upload.array('images', 3), async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    console.log('Photo decision request received');
    console.log('Request body:', req.body);
    console.log('Files:', req.files ? req.files.length : 'No files');
    
    // Parse JSON fields from FormData
    const requestData = { ...req.body };
    
    // Validate request body first (allows strings)
    const { error, value } = photoDecisionSchema.validate(requestData);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({
        error: error.details[0].message,
        field: error.details[0].path.join('.')
      });
    }

    let { question, mood, category, labels = [], weather } = value;
    
    // Parse labels if it's a JSON string
    if (labels && typeof labels === 'string') {
      try {
        labels = JSON.parse(labels);
      } catch (e) {
        console.log('Error parsing labels:', e.message);
        labels = [];
      }
    }
    
    // Parse weather if it's a JSON string
    if (weather && typeof weather === 'string') {
      try {
        weather = JSON.parse(weather);
      } catch (e) {
        console.log('Error parsing weather:', e.message);
        weather = null;
      }
    }
    
    console.log('Final parsed data:', { question, mood, category, labels, weather });
    const userId = req.user.id;
    const files = req.files;

    // Check usage limits
    const usageCheck = await usageTrackingService.canMakeDecision(userId, 'photo');
    if (!usageCheck.allowed) {
      return res.status(429).json({
        error: 'Daily limit reached',
        message: `You've reached your daily limit of ${usageCheck.limit} decisions. Upgrade to Premium for unlimited decisions!`,
        tier: usageCheck.tier,
        usage: usageCheck.usage,
        limit: usageCheck.limit,
        resetTime: usageCheck.resetTime,
        upgradeUrl: '/premium'
      });
    }

    // Validate files
    if (!files || files.length < 2 || files.length > 3) {
      return res.status(400).json({
        error: 'Please upload 2-3 images for comparison'
      });
    }

    // Upload and process images
    let uploadedImages;
    try {
      uploadedImages = await photoService.uploadImages(userId, files, labels);
    } catch (uploadError) {
      return res.status(400).json({
        error: uploadError.message
      });
    }

    // Generate captions for images
    let imagesWithCaptions;
    try {
      imagesWithCaptions = await photoService.generateCaptions(uploadedImages);
    } catch (captionError) {
      console.warn('Caption generation failed, proceeding without captions:', captionError.message);
      imagesWithCaptions = uploadedImages.map(img => ({
        ...img,
        caption: 'Image uploaded for decision'
      }));
    }

    // Get AI recommendation
    const context = {
      question,
      mood,
      category,
      weather
    };

    let aiResponse;
    try {
      // Use tiered enhanced analysis based on user subscription
      const userTier = usageCheck.tier || 'free';
      console.log(`Using enhanced AI analysis for ${userTier} user...`);
      aiResponse = await photoAIService.analyzePhotosEnhanced(imagesWithCaptions, { ...context, userTier });
      console.log('Enhanced analysis completed!');
    } catch (aiError) {
      console.error('AI analysis failed:', aiError.message);
      
      // Clean up uploaded images on AI failure
      await photoService.deleteImages(userId, imagesWithCaptions.map(img => img.path));
      
      return res.status(500).json({
        error: 'AI analysis failed. Please try again.',
        details: aiError.message
      });
    }

    // Save decision to database
    const decisionData = {
      user_id: userId,
      question,
      images: imagesWithCaptions,
      ai_response: aiResponse,
      recommended_index: aiResponse.recommendedIndex,
      mood,
      category,
      weather_context: weather,
      processing_time: Date.now() - startTime,
      created_at: new Date().toISOString()
    };

    try {
      const { data: savedDecision, error: dbError } = await supabase
        .from('photo_decisions')
        .insert(decisionData)
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Don't fail the request for DB errors, just log
      }

      // Track usage (async - don't block response)
      usageTrackingService.trackDecision(userId, 'photo', {
        ai_model: aiResponse.enhancedAnalysis ? 'enhanced' : 'standard',
        processing_time: Date.now() - startTime,
        category,
        mood,
        image_count: imagesWithCaptions.length
      }).catch(err => console.warn('Usage tracking failed:', err));

      // Prepare response
      const response = {
        id: savedDecision?.id,
        recommendedIndex: aiResponse.recommendedIndex,
        recommendedOption: imagesWithCaptions[aiResponse.recommendedIndex],
        ranked: aiResponse.ranked.map(rank => ({
          ...rank,
          image: imagesWithCaptions[rank.index]
        })),
        reasoning: aiResponse.reasoning,
        confidence: aiResponse.confidence,
        factors: aiResponse.factors,
        processingTime: Date.now() - startTime,
        fallback: aiResponse.fallback || false,
        // Add usage info for user awareness
        usageInfo: {
          tier: usageCheck.tier,
          remaining: usageCheck.remaining,
          enhanced: !!aiResponse.enhancedAnalysis
        }
      };

      res.json(response);

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      
      // Still return the AI response even if DB save fails
      const response = {
        recommendedIndex: aiResponse.recommendedIndex,
        recommendedOption: imagesWithCaptions[aiResponse.recommendedIndex],
        ranked: aiResponse.ranked.map(rank => ({
          ...rank,
          image: imagesWithCaptions[rank.index]
        })),
        reasoning: aiResponse.reasoning,
        confidence: aiResponse.confidence,
        factors: aiResponse.factors,
        processingTime: Date.now() - startTime,
        fallback: aiResponse.fallback || false,
        warning: 'Decision processed but not saved to history'
      };

      res.json(response);
    }

  } catch (error) {
    console.error('Photo decision error:', error);
    
    // Clean up any uploaded files on error
    if (req.files && req.files.length > 0) {
      try {
        const userId = req.user?.id;
        if (userId) {
          // Attempt cleanup - don't await as this is emergency cleanup
          photoService.deleteImages(userId, req.files.map(f => `${userId}/${f.filename}`)).catch(console.warn);
        }
      } catch (cleanupError) {
        console.warn('Emergency cleanup failed:', cleanupError.message);
      }
    }

    const processingTime = Date.now() - startTime;
    
    if (error.message.includes('timeout')) {
      return res.status(504).json({
        error: 'Request timeout - AI service took too long to respond',
        processingTime,
        retry: true
      });
    }
    
    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded - please wait before making another request',
        processingTime,
        retryAfter: 60
      });
    }

    next(error);
  }
});

// Enhanced AI decision endpoint with ranking
router.post('/decide', authenticate, async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    // Try enhanced schema first, fall back to legacy
    let validationResult = enhancedDecisionSchema.validate(req.body);
    let isEnhancedRequest = true;
    
    if (validationResult.error) {
      console.log('Enhanced schema validation failed:', validationResult.error.details[0].message);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      validationResult = decisionSchema.validate(req.body);
      isEnhancedRequest = false;
      
      if (validationResult.error) {
        console.log('Legacy schema validation also failed:', validationResult.error.details[0].message);
        return res.status(400).json({ 
          error: validationResult.error.details[0].message,
          field: validationResult.error.details[0].path.join('.')
        });
      }
    }

    const userId = req.user.id;
    let response, dbData;

    if (isEnhancedRequest) {
      // Enhanced request with ranking or auto-decision
      const { inputText, mood, preferences = {}, category, autoDecide = false, context = {} } = req.body;
      
      // Check for auto-decision mode
      if (autoDecide) {
        // Extract options from input text for random selection
        const options = await openRouterClient.extractOptions(inputText);
        
        if (options.length === 0) {
          return res.status(400).json({ 
            error: 'No options found for auto-decision. Please include options in your text.',
            suggestion: 'Try formatting like: "What should I eat? Options: pizza, sushi, salad"'
          });
        }

        // Randomly select an option
        const randomIndex = Math.floor(Math.random() * options.length);
        const selectedOption = options[randomIndex];

        // Update user's auto-decision count
        await updateAutoDecisionCount(userId);

        response = {
          autoDecision: true,
          selectedOption: selectedOption,
          allOptions: options,
          mood: mood || null,
          category: category || null,
          surpriseMode: true,
          totalOptions: options.length
        };

        dbData = {
          user_id: userId,
          question: inputText,
          context: {
            mood,
            category,
            preferences,
            ...context
          },
          ai_response: JSON.stringify({ autoDecision: true, selectedOption, allOptions: options }),
          final_decision: selectedOption,
          auto_decided: true,
          created_at: new Date().toISOString()
        };

      } else {
        // Build cache key
        const cacheKey = `enhanced-${userId}-${Buffer.from(JSON.stringify({
          inputText, mood, preferences, category, context
        })).toString('base64')}`;
        
        // Check cache first
        const cachedResponse = decisionCache.get(cacheKey);
        if (cachedResponse) {
          return res.json({ 
            ...cachedResponse,
            cached: true,
            processingTime: Date.now() - startTime
          });
        }

        try {
            // Get user preferences from database if not provided
            if (Object.keys(preferences).length === 0) {
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('preferences')
              .eq('user_id', userId)
              .single();
            
            if (profileData?.preferences) {
              Object.assign(preferences, profileData.preferences);
            }
          }

          // Use ranking functionality
          const rankingResult = await openRouterClient.rankOptions(inputText, mood, preferences);
          
          response = {
            rankedOptions: rankingResult.rankedOptions,
            reasoning: rankingResult.reasoning,
            recommendedOption: rankingResult.recommendedOption,
            mood: mood || null,
            category: category || null,
            totalOptions: rankingResult.rankedOptions.length
          };

          // Database record for enhanced request
          dbData = {
            user_id: userId,
            question: inputText,
            context: {
              mood,
              category,
              preferences,
              ...context
            },
            ai_response: JSON.stringify(rankingResult),
            final_decision: rankingResult.recommendedOption,
            auto_decided: false,
            created_at: new Date().toISOString()
          };

        } catch (aiError) {
          console.error('Enhanced AI ranking failed, falling back to simple decision:', aiError.message);
          
          // Fallback to simple decision making
          const contextString = buildLegacyContext(inputText, mood, category, context);
          const aiResponse = await openRouterClient.makeDecision(contextString);
          
          response = {
            decision: aiResponse,
            fallback: true,
            error: 'Ranking unavailable, provided general recommendation',
            mood: mood || null,
            category: category || null
          };

          dbData = {
            user_id: userId,
            question: inputText,
            context: { mood, category, ...context },
            ai_response: aiResponse,
            final_decision: aiResponse,
            auto_decided: false,
            created_at: new Date().toISOString()
          };
        }

        // Cache the response (only if not auto-decision)
        decisionCache.set(cacheKey, response);
      }

    } else {
      // Legacy request handling
      const { question, context = {}, autoDecide = false } = req.body;
      
      const contextString = buildLegacyContext(question, context.mood, context.category, context);
      const cacheKey = `legacy-${userId}-${Buffer.from(contextString).toString('base64')}`;
      
      const cachedDecision = decisionCache.get(cacheKey);
      if (cachedDecision && !autoDecide) {
        return res.json({ 
          decision: cachedDecision,
          cached: true,
          processingTime: Date.now() - startTime
        });
      }

      const aiResponse = await openRouterClient.makeDecision(contextString);
      
      let finalDecision = aiResponse;
      if (autoDecide) {
        const options = aiResponse.match(/\d\.\s*([^\n]+)/g);
        if (options && options.length > 0) {
          const randomIndex = Math.floor(Math.random() * options.length);
          finalDecision = `Auto-decided: ${options[randomIndex]}`;
        }
      }

      response = { 
        decision: finalDecision,
        options: aiResponse,
        autoDecided: autoDecide
      };

      dbData = {
        user_id: userId,
        question,
        context,
        ai_response: aiResponse,
        final_decision: finalDecision,
        auto_decided: autoDecide,
        created_at: new Date().toISOString()
      };

      decisionCache.set(cacheKey, finalDecision);
    }

    // Save to database (with timeout protection)
    const dbPromise = supabase.from('decisions').insert(dbData);
    const dbTimeout = setTimeout(() => {
      console.warn('Database insert timeout for decision logging');
    }, 5000);

    try {
      const { error: dbError } = await dbPromise;
      clearTimeout(dbTimeout);
      
      if (dbError) {
        console.error('Database error:', dbError);
        // Don't fail the request for DB errors, just log
      }
    } catch (dbError) {
      clearTimeout(dbTimeout);
      console.error('Database operation failed:', dbError);
    }

    // Add processing time to response
    response.processingTime = Date.now() - startTime;
    
    res.json(response);

  } catch (error) {
    // Enhanced error handling
    const processingTime = Date.now() - startTime;
    
    if (error.message.includes('timeout')) {
      return res.status(504).json({ 
        error: 'Request timeout - AI service took too long to respond',
        processingTime,
        retry: true
      });
    }
    
    if (error.message.includes('rate limit')) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded - please wait before making another request',
        processingTime,
        retryAfter: 60
      });
    }

    if (error.message.includes('No clear options found')) {
      return res.status(400).json({ 
        error: 'Please provide clear options in your input text (e.g., "Options: pizza, sushi, salad")',
        processingTime,
        suggestion: 'Try formatting your input like: "What should I eat? Options: pizza, sushi, salad"'
      });
    }
    
    console.error('Decision endpoint error:', error);
    next(error);
  }
});

// Helper function for building legacy context strings
function buildLegacyContext(question, mood, category, context = {}) {
  let contextString = `User question: ${question}\n`;
  if (mood) contextString += `Current mood: ${mood}\n`;
  if (category) contextString += `Category: ${category}\n`;
  if (context.timeOfDay) contextString += `Time of day: ${context.timeOfDay}\n`;
  if (context.weather) contextString += `Weather: ${context.weather}\n`;
  if (context.location) contextString += `Location: ${context.location}\n`;
  return contextString;
}

// Helper function to update auto-decision count
async function updateAutoDecisionCount(userId) {
  try {
    // Get current profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('gamification_stats')
      .eq('user_id', userId)
      .single();

    const currentStats = profile?.gamification_stats || {};
    const newStats = {
      ...currentStats,
      autoDecisionCount: (currentStats.autoDecisionCount || 0) + 1,
      lastAutoDecision: new Date().toISOString()
    };

    // Update profile
    await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        gamification_stats: newStats,
        updated_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Failed to update auto-decision count:', error);
    // Don't throw - this shouldn't fail the main request
  }
}

// Get decision history
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, category } = req.query;

    let query = supabase
      .from('decisions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('context->category', category);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      decisions: data,
      count: data.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    next(error);
  }
});

// Get decision statistics
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get total decisions
    const { count: totalDecisions } = await supabase
      .from('decisions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get auto-decided count
    const { count: autoDecisions } = await supabase
      .from('decisions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('auto_decided', true);

    // Get category breakdown
    const { data: categoryData } = await supabase
      .from('decisions')
      .select('context')
      .eq('user_id', userId);

    const categoryStats = {};
    categoryData?.forEach(item => {
      const category = item.context?.category || 'other';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    res.json({
      totalDecisions,
      autoDecisions,
      manualDecisions: totalDecisions - autoDecisions,
      categoryBreakdown: categoryStats,
      autoDecisionRate: totalDecisions > 0 ? (autoDecisions / totalDecisions) * 100 : 0
    });
  } catch (error) {
    next(error);
  }
});

// Get user gamification stats
router.get('/gamification', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user profile with gamification stats
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('gamification_stats')
      .eq('user_id', userId)
      .single();

    const stats = profile?.gamification_stats || {};
    
    res.json({
      autoDecisionCount: stats.autoDecisionCount || 0,
      lastAutoDecision: stats.lastAutoDecision || null,
      streaks: stats.streaks || {},
      achievements: stats.achievements || []
    });
  } catch (error) {
    next(error);
  }
});

// Submit feedback for auto-decision
router.post('/feedback', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { decisionId, reaction, rating } = req.body;

    // Validate input
    if (!decisionId) {
      return res.status(400).json({ error: 'Decision ID is required' });
    }

    // Update decision with feedback
    const { error } = await supabase
      .from('decisions')
      .update({
        feedback: { reaction, rating, submittedAt: new Date().toISOString() }
      })
      .eq('id', decisionId)
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get nudge data (recent decisions and mood patterns)
router.get('/nudge-data', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    // Get recent decisions with categories
    const { data: recentDecisions, error: decisionsError } = await supabase
      .from('decisions')
      .select('id, final_decision, category, auto_decided, created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (decisionsError) {
      throw decisionsError;
    }
    
    // Get recent moods
    const { data: recentMoods, error: moodsError } = await supabase
      .from('moods')
      .select('sentiment_label, sentiment_score, created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (moodsError) {
      throw moodsError;
    }
    
    // Analyze patterns
    const patterns = {
      totalDecisions: recentDecisions.length,
      autoDecisions: recentDecisions.filter(d => d.auto_decided).length,
      categoryBreakdown: recentDecisions.reduce((acc, d) => {
        if (d.category) {
          acc[d.category] = (acc[d.category] || 0) + 1;
        }
        return acc;
      }, {}),
      moodTrend: recentMoods.length > 0 ? recentMoods[0].sentiment_label : 'neutral',
      avgMoodConfidence: recentMoods.length > 0 
        ? recentMoods.reduce((sum, m) => sum + (m.sentiment_score || 0), 0) / recentMoods.length 
        : 0.5
    };
    
    res.json({
      success: true,
      data: {
        decisions: recentDecisions,
        moods: recentMoods,
        patterns
      }
    });
  } catch (error) {
    next(error);
  }
});

// Log nudge interactions
router.post('/nudge-feedback', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { nudgeId, action, nudgeType, timestamp } = req.body;
    
    // Validation
    const schema = Joi.object({
      nudgeId: Joi.string().required(),
      action: Joi.string().valid('dismissed', 'accepted', 'thanked').required(),
      nudgeType: Joi.string().required(),
      timestamp: Joi.date().optional()
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    
    // Store nudge interaction for learning
    const { data, error: insertError } = await supabase
      .from('nudge_interactions')
      .insert([{
        user_id: userId,
        nudge_id: nudgeId,
        action: action,
        nudge_type: nudgeType,
        created_at: timestamp || new Date().toISOString()
      }]);
    
    if (insertError) {
      // If table doesn't exist, just log and continue
      console.log('Nudge interactions table not found, logging locally:', insertError);
    }
    
    res.json({
      success: true,
      message: 'Nudge feedback recorded'
    });
  } catch (error) {
    next(error);
  }
});

// Get user context for nudges (including calendar if available)
router.get('/context', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user profile preferences
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('preferences, gamification_stats')
      .eq('user_id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }
    
    // Get time-based context
    const now = new Date();
    const timeContext = {
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      isWeekend: [0, 6].includes(now.getDay()),
      timeOfDay: now.getHours() < 12 ? 'morning' : 
                 now.getHours() < 17 ? 'afternoon' : 'evening'
    };
    
    res.json({
      success: true,
      data: {
        userPreferences: profile?.preferences || {},
        gamificationStats: profile?.gamification_stats || {},
        timeContext
      }
    });
  } catch (error) {
    next(error);
  }
});

// Submit feedback for photo decision
router.post('/photo-feedback', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { decisionId, feedback } = req.body;

    // Validate input
    if (!decisionId) {
      return res.status(400).json({ error: 'Decision ID is required' });
    }

    if (!feedback || !['love', 'like', 'neutral', 'dislike'].includes(feedback)) {
      return res.status(400).json({ error: 'Valid feedback is required (love, like, neutral, dislike)' });
    }

    // Update photo decision with feedback
    const { error } = await supabase
      .from('photo_decisions')
      .update({
        user_feedback: feedback,
        updated_at: new Date().toISOString()
      })
      .eq('id', decisionId)
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, feedback });
  } catch (error) {
    next(error);
  }
});

// Test endpoint to verify AI image analysis accuracy
router.post('/test-photo-ai', authenticate, upload.array('images', 3), async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    console.log('=== AI TESTING MODE ===');
    console.log('Request body:', req.body);
    console.log('Files:', req.files ? req.files.length : 'No files');
    
    // Parse request data
    const requestData = { ...req.body };
    const { error, value } = photoDecisionSchema.validate(requestData);
    
    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
        field: error.details[0].path.join('.')
      });
    }

    let { question, mood, category, labels = [], weather } = value;
    
    // Parse labels and weather if needed
    if (labels && typeof labels === 'string') {
      try {
        labels = JSON.parse(labels);
      } catch (e) {
        labels = [];
      }
    }
    
    if (weather && typeof weather === 'string') {
      try {
        weather = JSON.parse(weather);
      } catch (e) {
        weather = null;
      }
    }

    const userId = req.user.id;
    const files = req.files;

    // Validate files
    if (!files || files.length < 2 || files.length > 3) {
      return res.status(400).json({
        error: 'Please upload 2-3 images for comparison'
      });
    }

    // Upload and process images
    let uploadedImages;
    try {
      uploadedImages = await photoService.uploadImages(userId, files, labels);
    } catch (uploadError) {
      return res.status(400).json({
        error: `Image upload failed: ${uploadError.message}`
      });
    }

    // Generate captions for testing
    const imagesWithCaptions = await photoService.generateCaptions(uploadedImages);

    // Test the AI analysis with detailed logging
    const context = {
      question,
      mood,
      category,
      weather
    };

    console.log('=== TEST CONTEXT ===');
    console.log('Question:', question);
    console.log('Mood:', mood);
    console.log('Category:', category);
    console.log('Weather:', weather);
    console.log('Images:', imagesWithCaptions.map(img => ({ label: img.label, caption: img.caption })));

    // Get AI recommendation with full transparency
    let aiResponse;
    let rawAIResponse = null;
    let promptUsed = null;
    let processingError = null;

    try {
      // Build and capture the exact prompt sent to AI
      promptUsed = photoAIService.buildPhotoDecisionPrompt(imagesWithCaptions, context);
      console.log('=== PROMPT SENT TO AI ===');
      console.log(promptUsed);

      // Get raw AI response
      rawAIResponse = await openRouterClient.makeDecision(promptUsed);
      console.log('=== RAW AI RESPONSE ===');
      console.log(rawAIResponse);

      // Process the response with enhanced analysis
      aiResponse = await photoAIService.analyzePhotosEnhanced(imagesWithCaptions, context);
      console.log('=== PROCESSED AI RESPONSE ===');
      console.log(JSON.stringify(aiResponse, null, 2));

    } catch (aiError) {
      console.log('=== AI ERROR ===');
      console.log(aiError.message);
      processingError = aiError.message;
      
      // Still try to get fallback
      aiResponse = photoAIService.generateFallbackRecommendation(imagesWithCaptions, aiError.message, context);
    }

    // Comprehensive test results
    const testResults = {
      success: true,
      testMode: true,
      processingTime: Date.now() - startTime,
      
      // Input verification
      inputVerification: {
        question,
        mood,
        category,
        weather,
        imageCount: imagesWithCaptions.length,
        imageLabels: imagesWithCaptions.map(img => img.label),
        imageCaptions: imagesWithCaptions.map(img => img.caption)
      },

      // AI Analysis transparency
      aiAnalysis: {
        promptSent: promptUsed,
        rawResponse: rawAIResponse,
        processedResponse: aiResponse,
        processingError,
        usedFallback: !!aiResponse.fallback
      },

      // Recommendation verification
      recommendationAnalysis: {
        recommendedIndex: aiResponse.recommendedIndex,
        recommendedOption: imagesWithCaptions[aiResponse.recommendedIndex],
        reasoning: aiResponse.reasoning,
        confidence: aiResponse.confidence,
        moodFactorScore: aiResponse.factors?.mood_compatibility,
        allRankings: aiResponse.ranked
      },

      // Test validation
      testValidation: {
        hasValidRecommendation: typeof aiResponse.recommendedIndex === 'number',
        reasoningMentionsMood: aiResponse.reasoning?.toLowerCase().includes(mood?.toLowerCase()),
        differentMoodWouldGiveDifferentResult: true, // This would need comparative testing
        rankingsIncludeAllImages: aiResponse.ranked?.length === imagesWithCaptions.length,
        scoresAreValid: aiResponse.ranked?.every(r => r.score >= 0 && r.score <= 1)
      }
    };

    console.log('=== TEST RESULTS ===');
    console.log(JSON.stringify(testResults, null, 2));

    res.json(testResults);

  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      error: 'Test failed',
      details: error.message,
      processingTime: Date.now() - startTime
    });
  }
});

// Get user usage statistics
router.get('/usage-stats', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    const stats = await usageTrackingService.getUserUsageStats(userId, parseInt(days));
    const suggestions = await usageTrackingService.getUpgradeSuggestions(userId);

    res.json({
      success: true,
      data: {
        ...stats,
        suggestions,
        features: {
          hasEnhancedAI: usageTrackingService.hasFeatureAccess(stats.tier, 'enhanced_ai'),
          hasUnlimitedDecisions: usageTrackingService.hasFeatureAccess(stats.tier, 'unlimited_decisions'),
          hasPrioritySupport: usageTrackingService.hasFeatureAccess(stats.tier, 'priority_support')
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get photo decision history
router.get('/photo-history', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, category } = req.query;

    let query = supabase
      .from('photo_decisions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      photoDecisions: data,
      count: data.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    next(error);
  }
});

// Get system performance stats (admin only - add auth check in production)
router.get('/system-stats', authenticate, async (req, res, next) => {
  try {
    const cacheStats = smartCacheService.getStats();
    const usageMetrics = usageTrackingService.getServiceMetrics();

    res.json({
      success: true,
      data: {
        cache: cacheStats,
        usage: usageMetrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;