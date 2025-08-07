const axios = require('axios');

class OpenRouterClient {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.timeout = parseInt(process.env.AI_TIMEOUT) || 15000;
    
    if (!this.apiKey) {
      throw new Error('Missing OpenRouter API key');
    }
  }

  async makeDecision(context) {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: process.env.AI_MODEL || 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are LifeLens, an AI assistant that helps people make daily decisions. 
                       Be concise, helpful, and consider the user's context and mood when providing suggestions.
                       Always provide 2-3 options with brief explanations.`
            },
            {
              role: 'user',
              content: context
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': process.env.APP_URL || 'https://lifelens.app',
            'X-Title': 'LifeLens Decision Assistant'
          },
          timeout: this.timeout
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter API error:', error.response?.data || error.message);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('AI service timeout - please try again');
      }
      if (error.response?.status === 429) {
        throw new Error('AI service rate limit exceeded - please wait a moment');
      }
      if (error.response?.status >= 500) {
        throw new Error('AI service temporarily unavailable');
      }
      
      throw new Error('Failed to get AI decision');
    }
  }

  async rankOptions(inputText, mood = null, userPreferences = {}) {
    try {
      // Extract options from input text
      const options = this.extractOptions(inputText);
      
      if (options.length === 0) {
        throw new Error('No clear options found in input text');
      }

      // Build smart prompt for ranking
      const prompt = this.buildRankingPrompt(inputText, options, mood, userPreferences);

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: process.env.AI_MODEL || 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are LifeLens, an AI decision assistant that helps rank options based on user context and preferences.
                       You must respond with valid JSON only. No additional text or explanations outside the JSON.
                       Consider the user's mood, preferences, and context when ranking options.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3, // Lower temperature for more consistent JSON output
          max_tokens: 800
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': process.env.APP_URL || 'https://lifelens.app',
            'X-Title': 'LifeLens Decision Assistant'
          },
          timeout: this.timeout
        }
      );

      const aiResponse = response.data.choices[0].message.content.trim();
      
      // Parse and validate JSON response
      try {
        const parsedResponse = JSON.parse(aiResponse);
        return this.validateRankingResponse(parsedResponse, options);
      } catch (parseError) {
        console.error('Failed to parse AI JSON response:', aiResponse);
        throw new Error('Invalid AI response format');
      }

    } catch (error) {
      console.error('OpenRouter ranking error:', error.response?.data || error.message);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('AI service timeout - please try again');
      }
      if (error.response?.status === 429) {
        throw new Error('AI service rate limit exceeded - please wait a moment');
      }
      if (error.response?.status >= 500) {
        throw new Error('AI service temporarily unavailable');
      }
      
      throw error; // Re-throw if it's our custom error
    }
  }

  extractOptions(inputText) {
    const options = [];
    
    // Pattern 1: "Options: A, B, C"
    const optionsMatch = inputText.match(/options?\s*:?\s*([^.!?]+)/i);
    if (optionsMatch) {
      const optionsList = optionsMatch[1].split(/[,;]|(?:\s+or\s+)|(?:\s+and\s+)/)
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0 && opt.length < 50);
      options.push(...optionsList);
    }

    // Pattern 2: Numbered list "1. A 2. B 3. C"
    const numberedMatches = inputText.match(/\d+[.)]\s*([^0-9.]{2,50}?)(?=\s*\d+[.)]|$)/g);
    if (numberedMatches && numberedMatches.length > 1) {
      const numberedOptions = numberedMatches.map(match => 
        match.replace(/^\d+[.)]\s*/, '').trim()
      ).filter(opt => opt.length > 0);
      options.push(...numberedOptions);
    }

    // Pattern 3: Bullet points or dashes "- A - B - C"
    const bulletMatches = inputText.match(/[-•*]\s*([^-•*\n]{2,50}?)(?=\s*[-•*]|$)/g);
    if (bulletMatches && bulletMatches.length > 1) {
      const bulletOptions = bulletMatches.map(match => 
        match.replace(/^[-•*]\s*/, '').trim()
      ).filter(opt => opt.length > 0);
      options.push(...bulletOptions);
    }

    // Remove duplicates and limit to reasonable number
    const uniqueOptions = [...new Set(options)].slice(0, 10);
    
    return uniqueOptions;
  }

  buildRankingPrompt(inputText, options, mood, userPreferences) {
    let prompt = `Context: ${inputText}\n\n`;
    prompt += `Available options: ${options.map((opt, i) => `${i + 1}. ${opt}`).join(', ')}\n\n`;
    
    if (mood) {
      prompt += `User's current mood: ${mood}\n`;
    }

    if (userPreferences && Object.keys(userPreferences).length > 0) {
      prompt += `User preferences: ${JSON.stringify(userPreferences)}\n`;
    }

    prompt += `\nPlease rank these options from best to worst based on the context and user's mood. Consider factors like:
- How well each option fits the user's current mood and energy level
- Practical considerations (time, cost, effort, availability)
- Health and wellness implications
- User satisfaction and enjoyment potential

Respond with valid JSON in this exact format:
{
  "rankedOptions": [
    {
      "option": "exact option text",
      "rank": 1,
      "score": 0.95,
      "reasoning": "brief explanation why this ranks #1"
    }
  ],
  "recommendedOption": "exact text of top ranked option",
  "reasoning": "overall reasoning for the ranking considering mood and context"
}

Ensure all option texts match exactly from the provided list. Rank all ${options.length} options.`;

    return prompt;
  }

  validateRankingResponse(response, originalOptions) {
    // Validate structure
    if (!response.rankedOptions || !Array.isArray(response.rankedOptions)) {
      throw new Error('Invalid response structure: missing rankedOptions array');
    }

    if (!response.recommendedOption || !response.reasoning) {
      throw new Error('Invalid response structure: missing recommendedOption or reasoning');
    }

    // Validate that all original options are included
    const responseOptions = response.rankedOptions.map(item => item.option);
    const missingOptions = originalOptions.filter(opt => 
      !responseOptions.some(respOpt => 
        respOpt.toLowerCase().includes(opt.toLowerCase()) || 
        opt.toLowerCase().includes(respOpt.toLowerCase())
      )
    );

    if (missingOptions.length > 0) {
      console.warn('Some options missing from AI response:', missingOptions);
    }

    // Validate ranking structure
    response.rankedOptions.forEach((item, index) => {
      if (!item.option || typeof item.option !== 'string') {
        throw new Error(`Invalid option at rank ${index + 1}`);
      }
      if (typeof item.rank !== 'number' || item.rank < 1) {
        item.rank = index + 1; // Fix ranking
      }
      if (typeof item.score !== 'number' || item.score < 0 || item.score > 1) {
        item.score = Math.max(0, Math.min(1, 1 - (index * 0.1))); // Generate reasonable score
      }
      if (!item.reasoning || typeof item.reasoning !== 'string') {
        item.reasoning = 'AI-generated ranking based on context analysis';
      }
    });

    // Sort by rank to ensure proper ordering
    response.rankedOptions.sort((a, b) => a.rank - b.rank);

    return response;
  }
}

module.exports = new OpenRouterClient();