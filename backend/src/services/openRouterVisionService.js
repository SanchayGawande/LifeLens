const axios = require('axios');

class OpenRouterVisionService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1';
    
    if (!this.apiKey) {
      console.warn('No OpenRouter API key found - premium vision analysis unavailable');
    } else {
      console.log('OpenRouter vision service initialized');
    }
    
    // Available vision models
    this.models = {
      'gpt-4v': 'openai/gpt-4-vision-preview',
      'claude-opus': 'anthropic/claude-3-opus',
      'claude-sonnet': 'anthropic/claude-3-sonnet', 
      'claude-haiku': 'anthropic/claude-3-haiku',
      'gemini-pro': 'google/gemini-pro-vision'
    };
    
    // Model costs (per image)
    this.costs = {
      'gpt-4v': 0.01,
      'claude-opus': 0.024,
      'claude-sonnet': 0.003,
      'claude-haiku': 0.0025,
      'gemini-pro': 0.0025
    };
  }

  /**
   * Analyze image using vision-capable models
   */
  async analyzeImage(imageData, prompt, model = 'claude-haiku') {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not available');
    }

    const selectedModel = this.models[model];
    if (!selectedModel) {
      throw new Error(`Unknown model: ${model}`);
    }

    try {
      console.log(`Analyzing image with ${model} vision model...`);
      
      // Ensure image is in proper format
      let imageUrl;
      if (typeof imageData === 'string' && imageData.startsWith('data:')) {
        imageUrl = imageData;
      } else if (Buffer.isBuffer(imageData)) {
        const base64 = imageData.toString('base64');
        imageUrl = `data:image/jpeg;base64,${base64}`;
      } else {
        throw new Error('Invalid image data format');
      }

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: selectedModel,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'https://lifelens.app',
            'X-Title': 'LifeLens AI Decision Assistant'
          },
          timeout: 30000
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        const result = response.data.choices[0].message.content;
        console.log(`${model} analysis successful:`, result.substring(0, 100) + '...');
        return result;
      } else {
        throw new Error('Invalid response from vision model');
      }

    } catch (error) {
      console.error(`${model} vision analysis failed:`, error.message);
      throw error;
    }
  }

  /**
   * Analyze clothing with premium vision models
   */
  async analyzeClothing(imageData, userTier = 'free') {
    const model = this.selectModelByTier(userTier);
    
    const prompt = `You are an expert fashion analyst. Analyze this clothing item with precise detail:

1. **Color Analysis**: Describe the exact color(s) of the garment. Be specific about shades and tones.
2. **Item Type**: Identify the specific type of clothing (t-shirt, hoodie, dress, etc.)
3. **Style & Fit**: Describe the cut, fit, and overall style
4. **Design Elements**: Note any patterns, graphics, text, or decorative elements
5. **Fabric & Quality**: Assess the material appearance and quality level

CRITICAL: Focus ONLY on the actual clothing item. Ignore any background, mannequin, or display setup. If you see a pink shirt on a black background, it's still a pink shirt.

Provide a detailed but concise analysis in 2-3 sentences that would help someone make a mood-based decision about wearing this item.`;

    return await this.analyzeImage(imageData, prompt, model);
  }

  /**
   * Analyze food with premium vision models
   */
  async analyzeFood(imageData, userTier = 'free') {
    const model = this.selectModelByTier(userTier);
    
    const prompt = `You are a culinary expert. Analyze this food item with detailed precision:

1. **Food Identification**: Identify the exact type of food/dish
2. **Ingredients**: List visible ingredients and components
3. **Preparation**: Describe cooking method and presentation
4. **Nutritional Assessment**: Evaluate healthiness, calories, and nutritional value
5. **Mood Impact**: Consider how this food might affect someone's mood and energy

CRITICAL: Focus ONLY on the actual food. Ignore plates, utensils, table settings, or background.

Provide a detailed analysis in 2-3 sentences that considers both nutritional and psychological aspects for decision-making.`;

    return await this.analyzeImage(imageData, prompt, model);
  }

  /**
   * Analyze electronics with premium vision models
   */
  async analyzeElectronics(imageData, userTier = 'free') {
    const model = this.selectModelByTier(userTier);
    
    const prompt = `You are a technology expert. Analyze this electronic device with technical precision:

1. **Device Identification**: Identify the specific type and brand if visible
2. **Key Features**: Note important features, ports, buttons, and design elements
3. **Build Quality**: Assess the apparent build quality and materials
4. **Design Aesthetic**: Describe the style, color, and overall design appeal
5. **Use Case Assessment**: Consider what this device is best suited for

CRITICAL: Focus ONLY on the actual device. Ignore packaging, accessories, or background.

Provide a detailed analysis in 2-3 sentences that helps evaluate this device's suitability for different needs and preferences.`;

    return await this.analyzeImage(imageData, prompt, model);
  }

  /**
   * Select appropriate model based on user tier
   */
  selectModelByTier(userTier) {
    switch (userTier) {
      case 'premium':
        return 'claude-sonnet'; // Good balance of quality and cost
      case 'pro':
        return 'gpt-4v'; // Highest quality
      case 'unlimited':
        return 'claude-opus'; // Best reasoning
      default:
        return 'claude-haiku'; // Most cost-effective for upgrades
    }
  }

  /**
   * Analyze by category with tier-appropriate model
   */
  async analyzeByCategory(imageData, category, userTier = 'free') {
    switch (category) {
      case 'clothing':
        return await this.analyzeClothing(imageData, userTier);
      case 'food':
        return await this.analyzeFood(imageData, userTier);
      case 'electronics':
        return await this.analyzeElectronics(imageData, userTier);
      default:
        const model = this.selectModelByTier(userTier);
        const prompt = `Analyze this image with expert precision. Describe the main object/item in detail, focusing on characteristics that would help someone make a decision about it. Ignore any background or display elements. Provide 2-3 sentences of detailed analysis.`;
        return await this.analyzeImage(imageData, prompt, model);
    }
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return !!this.apiKey;
  }

  /**
   * Get estimated cost for analysis
   */
  getCost(model = 'claude-haiku') {
    return this.costs[model] || 0.0025;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      available: this.isAvailable(),
      models: this.models,
      costs: this.costs,
      provider: 'OpenRouter (Premium Vision)',
      recommendedModel: 'claude-sonnet'
    };
  }
}

module.exports = new OpenRouterVisionService();