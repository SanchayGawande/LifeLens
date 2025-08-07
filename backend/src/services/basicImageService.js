/**
 * Basic Image Analysis Service
 * Zero-cost image analysis using image metadata and smart heuristics
 * Fallback service when vision AI APIs are unavailable
 */

class BasicImageService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Analyze image without external AI APIs
   * Uses image properties, metadata, and smart heuristics
   */
  async analyzeImage(imageData, category = 'general', userLabel = '') {
    // Check cache first (include user label in cache key for uniqueness)
    const cacheKey = this.generateCacheKey(imageData, category, userLabel);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('Using cached basic image analysis');
        return cached.result;
      }
    }

    try {
      let analysis = 'Image uploaded for analysis';
      
      // Extract basic image information if possible
      if (typeof imageData === 'string' && imageData.startsWith('data:')) {
        // Analyze data URL for basic info
        const imageInfo = this.analyzeDataURL(imageData);
        analysis = this.generateSmartDescription(imageInfo, category, userLabel);
      } else if (Buffer.isBuffer(imageData)) {
        // Analyze buffer for basic info
        const imageInfo = this.analyzeImageBuffer(imageData);
        analysis = this.generateSmartDescription(imageInfo, category, userLabel);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        result: analysis,
        timestamp: Date.now()
      });

      console.log('Generated basic image analysis:', analysis);
      return analysis;

    } catch (error) {
      console.warn('Basic image analysis failed:', error.message);
      return this.getFallbackDescription(category);
    }
  }

  /**
   * Analyze data URL to extract basic information
   */
  analyzeDataURL(dataURL) {
    const info = {
      format: 'unknown',
      size: 0,
      aspectRatio: 'unknown',
      dataLength: 0
    };

    try {
      // Extract format from data URL
      const formatMatch = dataURL.match(/data:image\/([^;]+)/);
      if (formatMatch) {
        info.format = formatMatch[1];
      }

      // Extract base64 data and estimate size
      const base64Data = dataURL.split(',')[1];
      if (base64Data) {
        info.dataLength = base64Data.length;
        info.size = Math.round((base64Data.length * 3) / 4); // Approximate file size
      }

    } catch (error) {
      console.warn('Error analyzing data URL:', error.message);
    }

    return info;
  }

  /**
   * Analyze image buffer for basic information
   */
  analyzeImageBuffer(buffer) {
    const info = {
      format: 'unknown',
      size: buffer.length,
      hasImageSignature: false
    };

    try {
      // Check for common image format signatures
      const firstBytes = buffer.slice(0, 10);
      
      if (firstBytes[0] === 0xFF && firstBytes[1] === 0xD8) {
        info.format = 'jpeg';
        info.hasImageSignature = true;
      } else if (firstBytes[0] === 0x89 && firstBytes[1] === 0x50 && firstBytes[2] === 0x4E) {
        info.format = 'png';
        info.hasImageSignature = true;
      } else if (firstBytes[0] === 0x47 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46) {
        info.format = 'gif';
        info.hasImageSignature = true;
      }

    } catch (error) {
      console.warn('Error analyzing image buffer:', error.message);
    }

    return info;
  }

  /**
   * Generate smart description based on image info and category
   */
  generateSmartDescription(imageInfo, category, userLabel = '') {
    let description = '';

    // Extract color and type hints from user label if available
    const colorHints = this.extractColorFromLabel(userLabel);
    const typeHints = this.extractTypeFromLabel(userLabel, category);

    // Category-specific base descriptions
    const categoryDescriptions = {
      clothing: [
        'A clothing item with various design elements',
        'A garment suitable for different occasions', 
        'A piece of clothing with distinctive styling',
        'An apparel item with unique characteristics'
      ],
      food: [
        'A food item with appealing presentation',
        'A dish with various ingredients and preparation',
        'A meal option with different nutritional elements',
        'A food choice with distinct visual appeal'
      ],
      electronics: [
        'An electronic device with modern design',
        'A tech product with functional features',
        'A digital device suitable for various uses',
        'An electronic item with practical applications'
      ],
      general: [
        'An item with distinctive characteristics',
        'An object with various visual elements',
        'A product with unique design features',
        'An item suitable for comparison and analysis'
      ]
    };

    // Build description with color and type intelligence
    let baseDescription;
    if (colorHints.length > 0 && typeHints.length > 0) {
      // Use specific color and type information
      const color = colorHints[0];
      const type = typeHints[0];
      baseDescription = `A ${color} ${type} with distinct styling and visual appeal`;
    } else if (colorHints.length > 0) {
      // Use color information
      const color = colorHints[0];
      const descriptions = categoryDescriptions[category] || categoryDescriptions.general;
      baseDescription = descriptions[0].replace(/clothing item|food item|electronic device|item/, `${color} ${this.getCategoryNoun(category)}`);
    } else if (typeHints.length > 0) {
      // Use type information
      const type = typeHints[0];
      baseDescription = `A ${type} with distinctive characteristics and design elements`;
    } else {
      // Fallback to generic description
      const descriptions = categoryDescriptions[category] || categoryDescriptions.general;
      baseDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    }

    // Add format-specific details
    if (imageInfo.format && imageInfo.format !== 'unknown') {
      description = `${baseDescription} captured in ${imageInfo.format.toUpperCase()} format`;
    } else {
      description = baseDescription;
    }

    // Add size-based hints
    if (imageInfo.size) {
      if (imageInfo.size > 500000) { // > 500KB
        description += ', showing high detail and quality';
      } else if (imageInfo.size > 100000) { // > 100KB
        description += ', with good visual clarity';
      } else {
        description += ', with standard image quality';
      }
    }

    // Add category-specific enhancements
    description += this.getCategoryEnhancement(category);

    return description;
  }

  /**
   * Extract color information from user label
   */
  extractColorFromLabel(label) {
    const colors = ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'black', 'white', 'gray', 'grey', 'brown', 'navy', 'maroon', 'teal', 'lime', 'olive', 'silver', 'gold'];
    const labelLower = label.toLowerCase();
    return colors.filter(color => labelLower.includes(color));
  }

  /**
   * Extract type information from user label
   */
  extractTypeFromLabel(label, category) {
    const types = {
      clothing: ['t-shirt', 'tshirt', 'shirt', 'hoodie', 'dress', 'pants', 'jeans', 'jacket', 'sweater', 'blouse', 'skirt', 'shorts'],
      food: ['pizza', 'burger', 'salad', 'pasta', 'sandwich', 'soup', 'rice', 'chicken', 'fish', 'vegetables', 'fruit'],
      electronics: ['phone', 'laptop', 'headphones', 'speaker', 'tablet', 'watch', 'monitor', 'keyboard', 'mouse']
    };
    
    const categoryTypes = types[category] || [];
    const labelLower = label.toLowerCase();
    return categoryTypes.filter(type => labelLower.includes(type));
  }

  /**
   * Get category-specific noun
   */
  getCategoryNoun(category) {
    const nouns = {
      clothing: 'garment',
      food: 'dish',
      electronics: 'device',
      general: 'item'
    };
    return nouns[category] || nouns.general;
  }

  /**
   * Get category-specific enhancement text
   */
  getCategoryEnhancement(category) {
    const enhancements = {
      clothing: '. The garment displays various colors, patterns, and styling elements that can influence mood and confidence levels.',
      food: '. The dish presents a combination of ingredients, textures, and visual appeal that can affect appetite and satisfaction.',
      electronics: '. The device features design elements, functionality indicators, and build quality that influence user experience.',
      general: '. The item contains visual elements and characteristics that can be evaluated for decision-making purposes.'
    };

    return enhancements[category] || enhancements.general;
  }

  /**
   * Analyze multiple images for comparison
   */
  async analyzeMultipleImages(images, context = {}) {
    const { category = 'general', mood, question } = context;
    
    console.log(`Analyzing ${images.length} images with basic analysis for category: ${category}`);
    
    const analysisPromises = images.map(async (image, index) => {
      try {
        const userLabel = image.label || image.caption || '';
        const description = await this.analyzeImage(image.url || image.data, category, userLabel);
        
        return {
          ...image,
          enhancedCaption: description,
          analysisIndex: index,
          category,
          analysisSuccess: true,
          analysisMethod: 'basic'
        };
      } catch (error) {
        console.warn(`Basic analysis failed for image ${index}:`, error.message);
        return {
          ...image,
          enhancedCaption: image.caption || this.getFallbackDescription(category),
          analysisIndex: index,
          category,
          analysisSuccess: false,
          analysisMethod: 'fallback'
        };
      }
    });

    const analyzedImages = await Promise.all(analysisPromises);
    
    // Add comparative analysis
    const comparison = this.generateComparativeAnalysis(analyzedImages, context);
    
    return {
      images: analyzedImages,
      comparison,
      category,
      mood,
      analysisMetadata: {
        timestamp: new Date().toISOString(),
        model: 'basic-heuristic',
        analysisType: 'zero-cost',
        successRate: analyzedImages.filter(img => img.analysisSuccess).length / analyzedImages.length
      }
    };
  }

  /**
   * Generate comparative analysis for multiple images
   */
  generateComparativeAnalysis(images, context) {
    const { category, mood } = context;
    
    const analysis = {
      totalOptions: images.length,
      category,
      mood,
      insights: []
    };

    // Generate insights based on image index and category
    images.forEach((image, index) => {
      let insight = `Option ${index + 1}: ${this.generateOptionInsight(index, category, mood)}`;
      analysis.insights.push(insight);
    });

    return analysis;
  }

  /**
   * Generate insight for a specific option
   */
  generateOptionInsight(index, category, mood) {
    const insights = {
      clothing: [
        'Features design elements that can complement different moods and occasions',
        'Displays styling characteristics suitable for various preferences',
        'Shows color and pattern combinations that may align with your current state',
        'Presents a design approach that could match your desired aesthetic'
      ],
      food: [
        'Offers nutritional elements that can support different energy levels',
        'Presents ingredients and preparation that may satisfy current cravings',
        'Shows visual appeal and composition that could enhance meal satisfaction',
        'Features characteristics that align with different dietary preferences'
      ],
      electronics: [
        'Displays features and design elements for various use cases',
        'Shows build quality and aesthetics suitable for different needs',
        'Presents functionality that could match your requirements',
        'Features design characteristics that may appeal to your preferences'
      ],
      general: [
        'Contains characteristics that may align with your current preferences',
        'Shows features that could satisfy your current needs',
        'Displays elements that might complement your decision criteria',
        'Presents qualities that could match your intended use'
      ]
    };

    const categoryInsights = insights[category] || insights.general;
    let selectedInsight = categoryInsights[index % categoryInsights.length];

    // Add mood-specific context if available
    if (mood) {
      const moodContext = this.getMoodContext(mood, category);
      selectedInsight += ` ${moodContext}`;
    }

    return selectedInsight;
  }

  /**
   * Get mood-specific context
   */
  getMoodContext(mood, category) {
    const moodMappings = {
      happy: 'which could maintain your positive energy',
      sad: 'which might help improve your current mood',
      energetic: 'which could complement your active state',
      tired: 'which may provide comfort and ease',
      stressed: 'which could offer calming influence',
      excited: 'which might enhance your enthusiasm'
    };

    const moodLower = mood.toLowerCase();
    for (const [key, value] of Object.entries(moodMappings)) {
      if (moodLower.includes(key)) {
        return value;
      }
    }

    return 'which may align with your current state of mind';
  }

  /**
   * Generate cache key
   */
  generateCacheKey(imageData, category, userLabel = '') {
    const crypto = require('crypto');
    
    let dataHash;
    if (typeof imageData === 'string') {
      dataHash = crypto.createHash('md5').update(imageData.substring(0, 100)).digest('hex');
    } else {
      dataHash = crypto.createHash('md5').update(imageData.slice(0, 1000)).digest('hex');
    }
    
    // Include user label in cache key to ensure unique descriptions
    const labelHash = crypto.createHash('md5').update(userLabel).digest('hex').substring(0, 8);
    return `basic:${dataHash}:${category}:${labelHash}`;
  }

  /**
   * Get fallback description
   */
  getFallbackDescription(category) {
    const fallbacks = {
      clothing: 'Clothing item ready for comparison and analysis',
      food: 'Food option available for evaluation',
      electronics: 'Electronic device uploaded for review',
      general: 'Item available for comparison'
    };
    
    return fallbacks[category] || fallbacks.general;
  }

  /**
   * Check if service is available (always true for basic service)
   */
  isAvailable() {
    return true;
  }

  /**
   * Get service stats
   */
  getStats() {
    return {
      available: true,
      cacheSize: this.cache.size,
      provider: 'Basic Heuristic Analysis',
      cost: '$0.00 (Zero Cost)',
      features: ['Image metadata analysis', 'Smart heuristics', 'Category-specific insights']
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('Basic image service cache cleared');
  }
}

module.exports = new BasicImageService();