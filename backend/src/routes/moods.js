const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const axios = require('axios');
const supabase = require('../config/supabase');
const Joi = require('joi');

// Validation schema
const moodSchema = Joi.object({
  text: Joi.string().min(5).max(1000).required(),
  type: Joi.string().valid('text', 'voice', 'image').default('text')
});

// Analyze mood from text
router.post('/analyze', authenticate, async (req, res, next) => {
  try {
    const { error: validationError } = moodSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const { text, type } = req.body;
    const userId = req.user.id;

    // Use OpenRouter for fast, reliable sentiment analysis
    const openRouterClient = require('../config/openrouter');
    
    const prompt = `Analyze the sentiment/mood of this text and respond with ONLY a JSON object:

Text: "${text}"

Response format:
{
  "label": "positive|negative|neutral",
  "score": 0.85,
  "scores": {
    "positive": 0.85,
    "negative": 0.10,
    "neutral": 0.05
  }
}`;

    const aiResponse = await openRouterClient.makeDecision(prompt);
    
    // Parse AI response to extract JSON
    let mood;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        mood = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback: analyze the text response for sentiment keywords
      const lowerText = text.toLowerCase();
      const positiveWords = ['happy', 'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'excited', 'joy'];
      const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'depressed', 'worried', 'stressed'];
      
      const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
      const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
      
      if (positiveCount > negativeCount) {
        mood = { label: 'positive', score: 0.75, scores: { positive: 0.75, negative: 0.15, neutral: 0.10 } };
      } else if (negativeCount > positiveCount) {
        mood = { label: 'negative', score: 0.75, scores: { positive: 0.15, negative: 0.75, neutral: 0.10 } };
      } else {
        mood = { label: 'neutral', score: 0.70, scores: { positive: 0.30, negative: 0.20, neutral: 0.50 } };
      }
    }

    // Save mood to database
    const { error: dbError } = await supabase
      .from('moods')
      .insert({
        user_id: userId,
        input_text: text,
        input_type: type,
        sentiment_label: mood.label,
        sentiment_score: mood.score,
        positive_score: mood.scores?.positive,
        negative_score: mood.scores?.negative,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    res.json({ 
      mood: mood.label,
      confidence: mood.score,
      details: mood.scores,
      recommendation: getMoodRecommendation(mood.label)
    });
  } catch (error) {
    console.error('Mood analysis error:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze mood. Please try again.',
    });
  }
});

// Get mood history
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const { data, error } = await supabase
      .from('moods')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      moods: data,
      count: data.length,
      period: `Last ${days} days`
    });
  } catch (error) {
    next(error);
  }
});

// Get mood trends
router.get('/trends', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const { data, error } = await supabase
      .from('moods')
      .select('sentiment_label, positive_score, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Calculate daily averages
    const dailyMoods = {};
    data.forEach(mood => {
      const date = new Date(mood.created_at).toLocaleDateString();
      if (!dailyMoods[date]) {
        dailyMoods[date] = { positive: [], negative: [], count: 0 };
      }
      dailyMoods[date].positive.push(mood.positive_score || 0);
      dailyMoods[date].count++;
    });

    // Calculate averages
    const trends = Object.entries(dailyMoods).map(([date, scores]) => ({
      date,
      averagePositivity: scores.positive.reduce((a, b) => a + b, 0) / scores.positive.length,
      moodCount: scores.count
    }));

    // Overall stats
    const overallPositivity = data.reduce((sum, mood) => sum + (mood.positive_score || 0), 0) / data.length;
    const positiveCount = data.filter(m => m.sentiment_label === 'positive').length;
    const negativeCount = data.filter(m => m.sentiment_label === 'negative').length;

    res.json({
      trends,
      summary: {
        totalMoods: data.length,
        averagePositivity: overallPositivity || 0,
        positivePercentage: data.length > 0 ? (positiveCount / data.length) * 100 : 0,
        negativePercentage: data.length > 0 ? (negativeCount / data.length) * 100 : 0,
        period: `Last ${days} days`
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function for mood recommendations
function getMoodRecommendation(mood) {
  const recommendations = {
    positive: "Great mood! Consider tackling challenging decisions or trying something new today.",
    negative: "Take it easy today. Consider simpler choices or activities that usually bring you joy.",
    neutral: "Balanced mood. You're in a good state to make thoughtful decisions."
  };
  
  return recommendations[mood] || recommendations.neutral;
}

module.exports = router;