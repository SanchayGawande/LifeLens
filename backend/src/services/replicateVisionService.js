const Replicate = require('replicate');

class ReplicateVisionService {
  constructor() {
    this.apiKey = process.env.REPLICATE_API_TOKEN;
    
    if (!this.apiKey) {
      console.warn('No Replicate API key found - vision analysis will use fallbacks');
      this.replicate = null;
    } else {
      this.replicate = new Replicate({
        auth: this.apiKey
      });
      console.log('Replicate client initialized successfully');
    }
    
    // Available vision models
    this.models = {
      llava: 'yorickvp/llava-v1.6-34b:41ecfbfb261e6c1adf3ad896c9066ca98346996d7c4045c5bc944a79d430f174',
      blip: 'salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746'
    };
    
    // Cache for expensive operations
    this.cache = new Map();
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour cache
  }

  /**
   * Analyze image using LLaVA model
   */
  async analyzeImage(imageData, prompt, category = 'general') {
    if (!this.replicate) {
      throw new Error('Replicate not available - no API key');
    }

    const cacheKey = this.generateCacheKey(imageData, prompt);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('Using cached Replicate analysis');
        return cached.result;
      }
    }

    try {
      console.log('Analyzing image with Replicate LLaVA model...');
      
      // Convert image data to base64 if needed
      let imageInput;
      if (typeof imageData === 'string' && imageData.startsWith('data:')) {
        imageInput = imageData;
      } else if (Buffer.isBuffer(imageData)) {
        const base64 = imageData.toString('base64');
        imageInput = `data:image/jpeg;base64,${base64}`;
      } else {
        throw new Error('Invalid image data format');
      }

      const output = await this.replicate.run(this.models.llava, {
        input: {
          image: imageInput,
          prompt: prompt,
          max_tokens: 500,
          temperature: 0.2
        }
      });

      // LLaVA returns an array of strings
      const result = Array.isArray(output) ? output.join('') : output;
      
      console.log('Replicate analysis result:', result);

      // Cache the result
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('Replicate analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate detailed image description for clothing
   */
  async analyzeClothing(imageData) {
    const prompt = `Analyze this clothing item in detail. Focus on:
1. The exact color(s) of the garment (ignore any background)
2. The type of clothing (t-shirt, hoodie, dress, etc.)
3. The style and fit (loose, fitted, oversized, etc.)
4. Any patterns, designs, or text on the clothing
5. The material/fabric appearance

IMPORTANT: Only describe the actual clothing item, not the background, mannequin, or display setup. If you see a pink shirt on a black background, describe it as a "pink shirt" not a "dark shirt".

Respond with a clear, detailed description in 2-3 sentences.`;

    return await this.analyzeImage(imageData, prompt, 'clothing');
  }

  /**
   * Generate detailed image description for food
   */
  async analyzeFood(imageData) {
    const prompt = `Analyze this food item in detail. Focus on:
1. The type of food (pizza, salad, burger, etc.)
2. Key ingredients you can see
3. Preparation style (grilled, fresh, baked, etc.)
4. Portion size and presentation
5. Any nutritional aspects (healthy, indulgent, etc.)

IMPORTANT: Only describe the actual food, not the plate, background, or table setting.

Respond with a clear, detailed description in 2-3 sentences.`;

    return await this.analyzeImage(imageData, prompt, 'food');
  }

  /**
   * Generate detailed image description for electronics
   */
  async analyzeElectronics(imageData) {
    const prompt = `Analyze this electronic device in detail. Focus on:
1. The type of device (headphones, phone, laptop, etc.)
2. The brand if visible
3. Key features you can see (buttons, ports, design elements)
4. The color and style
5. Build quality and design aesthetic

IMPORTANT: Only describe the actual device, not the packaging, background, or accessories.

Respond with a clear, detailed description in 2-3 sentences.`;

    return await this.analyzeImage(imageData, prompt, 'electronics');
  }

  /**
   * Analyze image based on category
   */
  async analyzeByCategory(imageData, category) {
    switch (category) {
      case 'clothing':
        return await this.analyzeClothing(imageData);
      case 'food':
        return await this.analyzeFood(imageData);
      case 'electronics':
        return await this.analyzeElectronics(imageData);
      default:
        const prompt = `Describe this image in detail, focusing on the main object or item. Ignore any background or display setup. Provide a clear, accurate description in 2-3 sentences.`;
        return await this.analyzeImage(imageData, prompt, category);
    }
  }

  /**
   * Generate cache key for image analysis
   */
  generateCacheKey(imageData, prompt) {
    const crypto = require('crypto');
    
    let dataHash;
    if (typeof imageData === 'string') {
      dataHash = crypto.createHash('md5').update(imageData.substring(0, 100)).digest('hex');
    } else {
      dataHash = crypto.createHash('md5').update(imageData.slice(0, 1000)).digest('hex');
    }
    
    const promptHash = crypto.createHash('md5').update(prompt).digest('hex');
    return `replicate:${dataHash}:${promptHash}`;
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return !!this.replicate;
  }

  /**
   * Get service stats
   */
  getStats() {
    return {
      available: this.isAvailable(),
      cacheSize: this.cache.size,
      models: Object.keys(this.models),
      provider: 'Replicate (LLaVA)',
      cost: '~$0.001 per image'
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('Replicate vision cache cleared');
  }
}

module.exports = new ReplicateVisionService();