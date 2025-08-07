const openRouterClient = require('../config/openrouter');
const enhancedImageService = require('./enhancedImageService');
const smartCacheService = require('./smartCacheService');

class PhotoAIService {
  constructor() {
    this.model = process.env.AI_MODEL || 'openai/gpt-3.5-turbo';
  }

  /**
   * Generate decision prompt for photo comparison
   */
  buildPhotoDecisionPrompt(images, context = {}) {
    const { mood, category, weather, question } = context;
    
    let prompt = `You are LifeLens, an AI assistant that helps people make decisions by analyzing photos.

The user has submitted ${images.length} photos and needs help choosing the best option.

IMPORTANT: When analyzing clothing items, focus on the ACTUAL ITEM (t-shirt, dress, etc.) not the background or display setup. Many product photos have contrasting backgrounds that should be ignored.

User Context:
- Question: "${question || 'Which option should I choose?'}"`;

    if (mood) {
      prompt += `\n- Current mood: ${mood}`;
    }
    
    if (category) {
      prompt += `\n- Category: ${category}`;
    }
    
    if (weather?.description) {
      prompt += `\n- Weather: ${weather.description}, ${weather.temperature}°C`;
    }

    prompt += `\n\nImages for analysis:`;
    
    images.forEach((image, index) => {
      prompt += `\n${index + 1}. ${image.label}`;
      
      // Use the user-provided label as the primary description since captions are unreliable
      if (image.label && image.label !== `Option ${index + 1}`) {
        prompt += ` - ${image.label}`;
      } else {
        prompt += ` - Image uploaded for comparison`;
      }
      
      if (category === 'clothing') {
        prompt += ` (IMPORTANT: Analyze only the clothing item itself, ignoring any background, mannequin, or display setup)`;
      } else if (category === 'food') {
        prompt += ` (IMPORTANT: Focus on the food item itself, not the plate, background, or presentation)`;
      } else if (category === 'electronics') {
        prompt += ` (IMPORTANT: Analyze the device itself, not the packaging or background)`;
      }
    });

    prompt += `\n\nCRITICAL ANALYSIS RULES:
1. For clothing items: ONLY analyze the actual garment (t-shirt, dress, etc.), NOT the background, mannequin, or display setup
2. A pink t-shirt on a black background is still a PINK t-shirt
3. Focus on the item's actual color, pattern, and style, not how it's photographed

IMPORTANT: The user's current mood is "${mood || 'neutral'}". This should be the PRIMARY factor in your recommendation.

Mood-based guidance:
- Energetic/Happy moods: Recommend bright, vibrant, bold options that match their positive energy
- Sad/Down moods: Suggest comforting, softer, or uplifting choices that might improve their mood (e.g., soft pinks, light blues, warm colors)
- Anxious/Stressed moods: Choose calming, simple, familiar options that reduce decision fatigue
- Confident moods: Bold, standout choices that let them express themselves
- Neutral moods: Practical, versatile options suitable for various situations

Please analyze these options and provide a recommendation that STRONGLY considers their "${mood || 'neutral'}" mood:

Analysis criteria (in order of importance):
1. MOOD COMPATIBILITY - How well does this option match/improve their current ${mood || 'neutral'} mood? (Most important)
2. Practical considerations for weather/situation
3. Overall appropriateness and visual appeal
4. Category-specific factors for ${category || 'general decision'}

Respond with valid JSON in this exact format:
{
  "recommendedIndex": 0,
  "reasoning": "Explanation focusing heavily on how this choice fits their ${mood || 'neutral'} mood, plus other factors",
  "ranked": [
    {
      "index": 0,
      "label": "Option 1",
      "score": 0.95,
      "reason": "Detailed explanation emphasizing mood compatibility and why this ranks here"
    }
  ],
  "confidence": 0.85,
  "factors": {
    "mood_compatibility": 0.9,
    "weather_appropriateness": 0.8,
    "overall_appeal": 0.9
  }
}

CRITICAL: Since you cannot see the actual images, rely heavily on the item labels provided by the user. If they say "Pink T-shirt" then treat it as a pink t-shirt, regardless of any background or display context mentioned.

CRITICAL: Ensure different moods lead to different recommendations. A person feeling "energetic" vs "sad" should get completely different suggestions, even for the same options.

IMPORTANT: If the user labels indicate specific colors (e.g., "Pink T-shirt", "Blue Hoodie", "Black Shirt"), use those colors in your analysis rather than making assumptions.`;

    return prompt;
  }

  /**
   * Build enhanced prompt with detailed image descriptions
   */
  buildEnhancedPhotoDecisionPrompt(enhancedAnalysis, context = {}) {
    const { mood, category, weather, question } = context;
    const { images, comparison } = enhancedAnalysis;
    
    let prompt = `You are LifeLens, an advanced AI assistant that helps people make decisions by analyzing photos with detailed visual understanding.

The user has submitted ${images.length} photos and needs help choosing the best option.

ENHANCED VISUAL ANALYSIS: Each image has been analyzed by an advanced vision AI system to provide detailed descriptions.

IMPORTANT: When analyzing items, focus on the ACTUAL ITEM described, not the background or display setup.

User Context:
- Question: "${question || 'Which option should I choose?'}"`;

    if (mood) {
      prompt += `\n- Current mood: ${mood}`;
    }
    
    if (category) {
      prompt += `\n- Category: ${category}`;
    }
    
    if (weather?.description) {
      prompt += `\n- Weather: ${weather.description}, ${weather.temperature}°C`;
    }

    prompt += `\n\nDETAILED IMAGE ANALYSIS:`;
    
    images.forEach((image, index) => {
      prompt += `\n${index + 1}. ${image.label}`;
      prompt += `\n   Visual Analysis: ${image.enhancedCaption}`;
      if (comparison.insights && comparison.insights[index]) {
        prompt += `\n   AI Insight: ${comparison.insights[index]}`;
      }
      prompt += `\n   Analysis Success: ${image.analysisSuccess ? 'Yes' : 'No (using fallback)'}`;
    });

    prompt += `\n\nCRITICAL ANALYSIS RULES:
1. Use the detailed visual analysis above to understand what each item actually looks like
2. For clothing: Focus on the actual garment colors and style, not backgrounds
3. For food: Consider nutrition, satisfaction, and mood-food connections  
4. For electronics: Consider features, quality, and use case fit
5. The visual analysis provides accurate descriptions - trust this over assumptions

IMPORTANT: The user's current mood is "${mood || 'neutral'}". This should be the PRIMARY factor in your recommendation.

Enhanced mood-based guidance for ${category || 'general items'}:`;

    // Category-specific mood guidance
    if (category === 'clothing') {
      prompt += `
- Energetic/Happy moods: Recommend bright, vibrant colors and bold styles that match positive energy
- Sad/Down moods: Suggest comforting, soft colors (pinks, light blues, warm tones) that can uplift mood
- Anxious/Stressed moods: Choose calming, simple, comfortable options that reduce decision fatigue
- Confident moods: Bold, standout choices that let them express themselves
- Neutral moods: Practical, versatile options suitable for various situations`;
    } else if (category === 'food') {
      prompt += `
- Energetic/Happy moods: Suggest nutritious, energizing foods that sustain positive energy
- Sad/Down moods: Recommend comforting foods that provide emotional satisfaction
- Anxious/Stressed moods: Choose calming, familiar foods that provide comfort without excess stimulation
- Confident moods: Bold, flavorful options that match their assertive energy
- Neutral moods: Balanced, practical meal choices`;
    } else if (category === 'electronics') {
      prompt += `
- Energetic/Happy moods: Recommend vibrant, feature-rich options that match their active lifestyle
- Sad/Down moods: Suggest comforting, high-quality options that provide enjoyment and distraction
- Anxious/Stressed moods: Choose simple, reliable options that won't add complexity
- Confident moods: Premium, standout choices that reflect their assertive personality
- Neutral moods: Practical, value-focused options with good overall features`;
    }

    prompt += `\n\nPlease analyze these options and provide a recommendation that STRONGLY considers their "${mood || 'neutral'}" mood:

Analysis criteria (in order of importance):
1. MOOD COMPATIBILITY - How well does this option match/improve their current ${mood || 'neutral'} mood? (Most important)
2. Item-specific factors based on detailed visual analysis
3. Practical considerations for weather/situation
4. Overall appropriateness and appeal
5. Category-specific factors for ${category || 'general decision'}

Respond with valid JSON in this exact format:
{
  "recommendedIndex": 0,
  "reasoning": "Explanation focusing heavily on how this choice fits their ${mood || 'neutral'} mood, using the detailed visual analysis provided",
  "ranked": [
    {
      "index": 0,
      "label": "Option 1",
      "score": 0.95,
      "reason": "Detailed explanation emphasizing mood compatibility and visual analysis insights"
    }
  ],
  "confidence": 0.85,
  "factors": {
    "mood_compatibility": 0.9,
    "visual_accuracy": 0.9,
    "category_appropriateness": 0.8,
    "overall_appeal": 0.9
  }
}

CRITICAL: Base your recommendation on the detailed visual analysis provided. Different moods should lead to different recommendations for the same items.`;

    return prompt;
  }

  /**
   * Analyze photos with enhanced AI vision (free tier using Hugging Face)
   */
  async analyzePhotosEnhanced(images, context = {}) {
    try {
      console.log('Enhanced Photo AI Analysis - Context:', context);
      console.log('Images being analyzed:', images.map(img => img.label));
      
      // Check smart cache for similar decisions first
      const cachedResponse = smartCacheService.getCachedAIResponse(images, context);
      if (cachedResponse) {
        console.log('Using cached AI response for enhanced analysis');
        return cachedResponse;
      }
      
      // Step 1: Get detailed image descriptions using Hugging Face
      const enhancedAnalysis = await enhancedImageService.analyzeMultipleImages(images, context);
      
      if (!enhancedAnalysis.images || enhancedAnalysis.images.length === 0) {
        throw new Error('Enhanced image analysis failed');
      }

      // Step 2: Build rich prompt with enhanced descriptions
      const prompt = this.buildEnhancedPhotoDecisionPrompt(enhancedAnalysis, context);
      console.log('Generated enhanced prompt for mood:', context.mood);
      
      // Step 3: Get AI decision using text model with rich context
      const response = await openRouterClient.makeDecision(prompt);
      
      // Step 4: Parse and validate response
      let aiResponse;
      try {
        const cleanedResponse = response.replace(/```json\s*|\s*```/g, '').trim();
        aiResponse = JSON.parse(cleanedResponse);
        console.log('Enhanced AI Response for mood:', context.mood, 'Recommended index:', aiResponse.recommendedIndex);
      } catch (parseError) {
        console.error('Failed to parse enhanced AI response:', response);
        throw new Error('AI returned invalid response format');
      }

      // Step 5: Validate and enhance the response
      const validatedResponse = this.validateAIResponse(aiResponse, enhancedAnalysis.images);
      
      // Add enhanced analysis metadata
      validatedResponse.enhancedAnalysis = {
        model: 'blip-2 + gpt-3.5-turbo',
        analysisSuccess: enhancedAnalysis.analysisMetadata.successRate,
        insights: enhancedAnalysis.comparison.insights,
        category: context.category
      };
      
      console.log('Final enhanced response - Recommended index:', validatedResponse.recommendedIndex, 'for mood:', context.mood);
      
      // Cache the successful response
      smartCacheService.setCachedAIResponse(images, context, validatedResponse);
      
      return validatedResponse;
    } catch (error) {
      console.error('Enhanced photo AI analysis error for mood:', context.mood, 'Error:', error);
      
      // Fallback to standard analysis
      console.log('Falling back to standard analysis for mood:', context.mood);
      return this.analyzePhotos(images, context);
    }
  }

  /**
   * Get photo decision from AI (standard method)
   */
  async analyzePhotos(images, context = {}) {
    try {
      console.log('Photo AI Analysis - Context:', context);
      console.log('Images being analyzed:', images.map(img => img.label));
      
      const prompt = this.buildPhotoDecisionPrompt(images, context);
      console.log('Generated prompt for mood:', context.mood);
      
      const response = await openRouterClient.makeDecision(prompt);
      
      // Parse and validate the JSON response
      let aiResponse;
      try {
        // Clean the response - remove any markdown formatting
        const cleanedResponse = response.replace(/```json\s*|\s*```/g, '').trim();
        aiResponse = JSON.parse(cleanedResponse);
        console.log('AI Response for mood:', context.mood, 'Recommended index:', aiResponse.recommendedIndex);
      } catch (parseError) {
        console.error('Failed to parse AI response:', response);
        throw new Error('AI returned invalid response format');
      }

      // Validate the response structure
      const validatedResponse = this.validateAIResponse(aiResponse, images);
      console.log('Final validated response - Recommended index:', validatedResponse.recommendedIndex, 'for mood:', context.mood);
      
      return validatedResponse;
    } catch (error) {
      console.error('Photo AI analysis error for mood:', context.mood, 'Error:', error);
      
      // Provide fallback recommendation
      console.log('Using fallback recommendation for mood:', context.mood);
      return this.generateFallbackRecommendation(images, error.message, context);
    }
  }

  /**
   * Validate AI response structure
   */
  validateAIResponse(response, originalImages) {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response structure');
    }

    // Ensure required fields exist
    if (typeof response.recommendedIndex !== 'number') {
      response.recommendedIndex = 0;
    }

    if (!response.reasoning || typeof response.reasoning !== 'string') {
      response.reasoning = 'AI recommendation based on visual analysis';
    }

    if (!Array.isArray(response.ranked)) {
      response.ranked = [];
    }

    // Ensure all images are represented in ranked array
    const expectedLength = originalImages.length;
    if (response.ranked.length !== expectedLength) {
      console.warn('AI response missing some images, filling gaps');
      
      // Create a complete ranked array
      const completeRanked = originalImages.map((image, index) => {
        const existingRank = response.ranked.find(r => r.index === index);
        
        return existingRank || {
          index,
          label: image.label,
          score: 0.5,
          reason: 'Analysis not available for this option'
        };
      });
      
      response.ranked = completeRanked;
    }

    // Validate individual ranked items
    response.ranked.forEach((item, arrayIndex) => {
      if (typeof item.index !== 'number') {
        item.index = arrayIndex;
      }
      
      if (!item.label) {
        item.label = originalImages[item.index]?.label || `Option ${item.index + 1}`;
      }
      
      if (typeof item.score !== 'number' || item.score < 0 || item.score > 1) {
        item.score = 0.5;
      }
      
      if (!item.reason) {
        item.reason = 'Standard recommendation based on visual analysis';
      }
    });

    // Sort by score descending
    response.ranked.sort((a, b) => b.score - a.score);
    
    // Ensure recommendedIndex points to highest scoring option
    response.recommendedIndex = response.ranked[0].index;

    // Add confidence if missing
    if (typeof response.confidence !== 'number') {
      response.confidence = 0.75;
    }

    // Add factors if missing
    if (!response.factors || typeof response.factors !== 'object') {
      response.factors = {
        mood_compatibility: 0.8,
        weather_appropriateness: 0.8,
        overall_appeal: 0.8
      };
    }

    return response;
  }

  /**
   * Generate fallback recommendation when AI fails
   */
  generateFallbackRecommendation(images, errorMessage, context = {}) {
    console.warn('Generating fallback recommendation due to AI failure:', errorMessage);
    
    const { mood, category } = context;
    
    // Mood-aware fallback logic
    let recommendedIndex = 0;
    let reasoning = 'Based on your uploaded options. ';
    
    // Add guidance about image analysis
    if (category === 'clothing') {
      reasoning = 'Note: When evaluating clothing, focus on the actual garment color and style, not the background. ';
    }
    
    if (mood) {
      // Simple mood-based fallback logic
      if (mood.toLowerCase().includes('energetic') || mood.toLowerCase().includes('happy') || mood.toLowerCase().includes('excited')) {
        // For positive moods, prefer later options (often brighter/bolder choices)
        recommendedIndex = Math.min(images.length - 1, 1);
        reasoning += `Given your ${mood} mood, selected what appears to be a more vibrant option to match your energy. `;
      } else if (mood.toLowerCase().includes('sad') || mood.toLowerCase().includes('down') || mood.toLowerCase().includes('tired')) {
        // For negative moods, prefer middle options (avoiding extremes)
        recommendedIndex = Math.floor(images.length / 2);
        reasoning += `Given your ${mood} mood, selected an option that might help uplift your spirits. Pink and soft colors can be comforting. `;
      } else {
        // For neutral or other moods, use first option
        recommendedIndex = 0;
        reasoning += `For your ${mood} mood, selected a versatile option. `;
      }
    }
    
    const ranked = images.map((image, index) => ({
      index,
      label: image.label,
      score: index === recommendedIndex ? 0.8 : 0.6 - (Math.abs(index - recommendedIndex) * 0.1),
      reason: index === recommendedIndex 
        ? `Selected for your ${mood || 'current'} mood and context`
        : `Alternative option ${index + 1} available for comparison`
    }));

    // Sort by score
    ranked.sort((a, b) => b.score - a.score);

    return {
      recommendedIndex,
      reasoning: reasoning + 'AI analysis temporarily unavailable, but this choice should work well for you.',
      ranked,
      confidence: 0.6,
      factors: {
        mood_compatibility: 0.7,
        weather_appropriateness: 0.7,
        overall_appeal: 0.7
      },
      fallback: true,
      error: 'AI analysis temporarily unavailable'
    };
  }

  /**
   * Build simple decision prompt for text-based fallback
   */
  buildSimplePrompt(images, context) {
    const { mood, category, weather, question } = context;
    
    let prompt = `Choose the best option from: ${images.map(img => img.label).join(', ')}. `;
    
    if (question) prompt += `Question: ${question}. `;
    if (mood) prompt += `Mood: ${mood}. `;
    if (category) prompt += `Category: ${category}. `;
    if (weather?.description) prompt += `Weather: ${weather.description}. `;
    
    prompt += 'Provide a brief recommendation with reasoning.';
    
    return prompt;
  }
}

module.exports = new PhotoAIService();