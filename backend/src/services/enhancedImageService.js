const { HfInference } = require('@huggingface/inference');
const axios = require('axios');
const smartCacheService = require('./smartCacheService');
const replicateVisionService = require('./replicateVisionService');
const openRouterVisionService = require('./openRouterVisionService');
const basicImageService = require('./basicImageService');
const googleVisionService = require('./googleVisionService');

class EnhancedImageService {
  constructor() {
    // Initialize Hugging Face client with proper error handling
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.warn('No Hugging Face API key found - enhanced analysis will use fallbacks');
      this.hf = null;
    } else {
      this.hf = new HfInference(apiKey);
      console.log('Hugging Face client initialized successfully');
    }
    
    // Available models for different analysis types (using confirmed working free tier models)
    this.models = {
      imageToText: 'microsoft/DialoGPT-medium', // Fallback to basic text model
      imageClassification: 'google/vit-base-patch16-224', // This one should work
      imageToTextBasic: 'microsoft/DialoGPT-medium', // Basic text processing
      objectDetection: 'facebook/detr-resnet-50'
    };

    // Cache for image analyses
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Get detailed image description using tiered vision models
   */
  async getDetailedImageDescription(imageUrl, category = 'general', userTier = 'free') {
    // Check smart cache first
    const cachedAnalysis = smartCacheService.getCachedImageAnalysis(imageUrl, category);
    if (cachedAnalysis) {
      console.log('Using smart cached image description');
      return cachedAnalysis.analysis;
    }

    try {
      // Try Google Vision API first (best reliability and accuracy)
      if (googleVisionService.isAvailable()) {
        console.log('Using Google Vision API for image analysis...');
        
        try {
          let imageBuffer;
          if (imageUrl.startsWith('data:')) {
            imageBuffer = await googleVisionService.urlToBuffer(imageUrl);
          } else {
            imageBuffer = await this.urlToBlob(imageUrl);
          }

          const visionAnalysis = await googleVisionService.analyzeByCategory(imageBuffer, category);
          const description = visionAnalysis.summary || this.generateDescriptionFromVisionAnalysis(visionAnalysis, category);
          
          // Cache the result
          smartCacheService.setCachedImageAnalysis(imageUrl + ':google', category, description);
          
          console.log('Google Vision analysis successful:', description);
          return description;
        } catch (googleError) {
          console.log('Google Vision failed, falling back to premium services:', googleError.message);
        }
      }

      // For premium users, use OpenRouter vision models as backup
      if (userTier !== 'free' && openRouterVisionService.isAvailable()) {
        console.log(`Using premium vision analysis for ${userTier} user...`);
        
        let imageData;
        if (imageUrl.startsWith('data:')) {
          imageData = imageUrl;
        } else {
          const buffer = await this.urlToBlob(imageUrl);
          const base64 = buffer.toString('base64');
          imageData = `data:image/jpeg;base64,${base64}`;
        }

        try {
          const description = await openRouterVisionService.analyzeByCategory(imageData, category, userTier);
          
          // Cache the result with premium tag
          smartCacheService.setCachedImageAnalysis(imageUrl + ':premium', category, description);
          
          console.log('Premium vision analysis successful:', description);
          return description;
        } catch (premiumError) {
          console.log('Premium vision failed, falling back to free tier:', premiumError.message);
        }
      }

      // Try Replicate for free tier (best accuracy for low cost)
      if (replicateVisionService.isAvailable()) {
        console.log('Using Replicate vision analysis...');
        
        let imageData;
        if (imageUrl.startsWith('data:')) {
          imageData = imageUrl;
        } else {
          const buffer = await this.urlToBlob(imageUrl);
          const base64 = buffer.toString('base64');
          imageData = `data:image/jpeg;base64,${base64}`;
        }

        try {
          const description = await replicateVisionService.analyzeByCategory(imageData, category);
          
          // Cache the result
          smartCacheService.setCachedImageAnalysis(imageUrl, category, description);
          
          console.log('Replicate analysis successful:', description);
          return description;
        } catch (replicateError) {
          console.log('Replicate failed, falling back to Hugging Face:', replicateError.message);
        }
      }

      // Try basic image service as zero-cost alternative
      console.log('Using zero-cost basic image analysis...');
      try {
        const description = await basicImageService.analyzeImage(imageUrl, category);
        
        // Cache the result
        smartCacheService.setCachedImageAnalysis(imageUrl + ':basic', category, description);
        
        console.log('Basic analysis successful:', description);
        return description;
      } catch (basicError) {
        console.log('Basic analysis failed, using final fallback:', basicError.message);
      }

      // Final fallback to Hugging Face if available
      if (!this.hf) {
        console.log('No vision services available, using smart fallback');
        return this.getFallbackDescription(imageUrl, category);
      }

      console.log('Analyzing image with Hugging Face BLIP model...');
      
      // For data URLs, extract the base64 part
      let imageData;
      if (imageUrl.startsWith('data:')) {
        const base64Data = imageUrl.split(',')[1];
        imageData = Buffer.from(base64Data, 'base64');
      } else {
        // Convert image URL to buffer
        imageData = await this.urlToBlob(imageUrl);
      }
      
      // Get detailed description with timeout and proper error handling
      let result;
      try {
        console.log('Calling Hugging Face API...');
        
        // Try image classification first (more reliable)
        try {
          result = await Promise.race([
            this.hf.imageClassification({
              data: imageData,
              model: this.models.imageClassification
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Classification timeout after 15 seconds')), 15000)
            )
          ]);
          
          if (result && result.length > 0) {
            // Convert classification results to description
            const topLabel = result[0];
            const description = `This appears to be ${topLabel.label} (confidence: ${(topLabel.score * 100).toFixed(1)}%)`;
            result = { generated_text: description };
            console.log('Hugging Face classification result:', result);
          } else {
            throw new Error('No classification results');
          }
          
        } catch (classError) {
          console.log('Classification failed, trying image-to-text:', classError.message);
          
          // Fallback to trying a known working image-to-text model
          result = await Promise.race([
            this.hf.imageToText({
              data: imageData,
              model: 'Salesforce/blip-image-captioning-base' // Try this specific model
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
            )
          ]);
          console.log('Hugging Face imageToText response:', result);
        }
      } catch (modelError) {
        console.log('Primary model failed, trying alternative approach:', modelError.message);
        
        // Try using the HTTP API directly
        try {
          const response = await axios.post(
            `https://api-inference.huggingface.co/models/${this.models.imageToText}`,
            imageData,
            {
              headers: {
                'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                'Content-Type': 'application/octet-stream'
              },
              timeout: 15000
            }
          );
          
          if (response.data && response.data[0] && response.data[0].generated_text) {
            result = { generated_text: response.data[0].generated_text };
          } else {
            throw new Error('No valid response from HTTP API');
          }
        } catch (httpError) {
          console.log('HTTP API also failed:', httpError.message);
          throw new Error('All Hugging Face methods failed');
        }
      }

      let description = result.generated_text || 'Image analysis not available';
      
      // Enhance description based on category
      description = this.enhanceDescriptionByCategory(description, category);
      
      // Cache the result in smart cache
      smartCacheService.setCachedImageAnalysis(imageUrl, category, description);

      console.log('Generated enhanced description:', description);
      return description;

    } catch (error) {
      console.warn('Hugging Face image analysis failed:', error.message);
      return this.getFallbackDescription(imageUrl, category);
    }
  }

  /**
   * Generate description from Google Vision analysis results
   */
  generateDescriptionFromVisionAnalysis(visionAnalysis, category) {
    const { labels, objects, text } = visionAnalysis;
    
    if (!labels || labels.length === 0) {
      return this.getFallbackDescription('', category);
    }

    // Get top labels with confidence > 0.5
    const relevantLabels = labels.filter(label => label.confidence > 0.5);
    
    if (relevantLabels.length === 0) {
      return this.getFallbackDescription('', category);
    }

    // Build description based on category
    switch (category) {
      case 'clothing':
        return this.buildClothingDescription(relevantLabels, objects, text);
      case 'food':
        return this.buildFoodDescription(relevantLabels, objects, text);
      case 'electronics':
        return this.buildElectronicsDescription(relevantLabels, objects, text);
      default:
        return this.buildGeneralDescription(relevantLabels, objects, text);
    }
  }

  /**
   * Build clothing-specific description
   */
  buildClothingDescription(labels, objects, text) {
    const clothingTerms = ['clothing', 'shirt', 'dress', 'pants', 'jacket', 'sweater', 'hoodie', 'top', 'bottom'];
    const colorTerms = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'pink', 'purple', 'orange', 'gray'];
    
    const clothingLabels = labels.filter(label => 
      clothingTerms.some(term => label.description.toLowerCase().includes(term))
    );
    
    const colorLabels = labels.filter(label =>
      colorTerms.some(term => label.description.toLowerCase().includes(term))
    );

    let description = '';
    
    if (clothingLabels.length > 0) {
      description = `This is a ${clothingLabels[0].description.toLowerCase()}`;
    } else {
      description = 'This appears to be a clothing item';
    }

    if (colorLabels.length > 0) {
      description += ` in ${colorLabels[0].description.toLowerCase()}`;
    }

    // Add confidence
    const confidence = clothingLabels.length > 0 ? Math.round(clothingLabels[0].confidence * 100) : 75;
    description += ` (${confidence}% confidence)`;

    return description;
  }

  /**
   * Build food-specific description
   */
  buildFoodDescription(labels, objects, text) {
    const foodTerms = ['food', 'meal', 'dish', 'pizza', 'burger', 'salad', 'sandwich', 'fruit', 'vegetable'];
    
    const foodLabels = labels.filter(label => 
      foodTerms.some(term => label.description.toLowerCase().includes(term))
    );

    let description = '';
    
    if (foodLabels.length > 0) {
      description = `This appears to be ${foodLabels[0].description.toLowerCase()}`;
    } else {
      description = 'This appears to be a food item';
    }

    // Add confidence
    const confidence = foodLabels.length > 0 ? Math.round(foodLabels[0].confidence * 100) : 75;
    description += ` (${confidence}% confidence)`;

    return description;
  }

  /**
   * Build electronics-specific description
   */
  buildElectronicsDescription(labels, objects, text) {
    const electronicsTerms = ['electronics', 'phone', 'computer', 'headphones', 'device', 'gadget', 'technology'];
    
    const electronicsLabels = labels.filter(label => 
      electronicsTerms.some(term => label.description.toLowerCase().includes(term))
    );

    let description = '';
    
    if (electronicsLabels.length > 0) {
      description = `This appears to be ${electronicsLabels[0].description.toLowerCase()}`;
    } else {
      description = 'This appears to be an electronic device';
    }

    // Add confidence
    const confidence = electronicsLabels.length > 0 ? Math.round(electronicsLabels[0].confidence * 100) : 75;
    description += ` (${confidence}% confidence)`;

    return description;
  }

  /**
   * Build general description
   */
  buildGeneralDescription(labels, objects, text) {
    const topLabel = labels[0];
    const confidence = Math.round(topLabel.confidence * 100);
    
    return `This image shows ${topLabel.description.toLowerCase()} (${confidence}% confidence)`;
  }

  /**
   * Enhance description based on category context
   */
  enhanceDescriptionByCategory(description, category) {
    const categoryEnhancements = {
      clothing: {
        keywords: ['shirt', 'dress', 'pants', 'jacket', 'sweater', 'hoodie'],
        enhancements: {
          'shirt': 'This appears to be a shirt',
          'dress': 'This appears to be a dress',
          'pants': 'These appear to be pants'
        }
      },
      food: {
        keywords: ['pizza', 'burger', 'salad', 'pasta', 'sandwich', 'soup'],
        enhancements: {
          'pizza': 'This is a pizza',
          'burger': 'This is a burger',
          'salad': 'This is a salad'
        }
      },
      electronics: {
        keywords: ['headphones', 'phone', 'laptop', 'speaker', 'watch'],
        enhancements: {
          'headphones': 'These are headphones',
          'phone': 'This is a mobile phone',
          'laptop': 'This is a laptop computer'
        }
      }
    };

    if (!categoryEnhancements[category]) {
      return description;
    }

    const categoryInfo = categoryEnhancements[category];
    
    // Add category-specific context
    let enhanced = description;
    
    // Check for category-specific keywords and enhance
    for (const [keyword, enhancement] of Object.entries(categoryInfo.enhancements)) {
      if (description.toLowerCase().includes(keyword)) {
        enhanced = `${enhancement}. ${description}`;
        break;
      }
    }

    // Add category context if not already clear
    if (!enhanced.toLowerCase().includes(category) && enhanced === description) {
      enhanced = `${this.getCategoryPrefix(category)} ${description}`;
    }

    return enhanced;
  }

  /**
   * Get category-specific prefix
   */
  getCategoryPrefix(category) {
    const prefixes = {
      clothing: 'This clothing item shows',
      food: 'This food item appears to be',
      electronics: 'This electronic device is',
      general: 'This item shows'
    };
    
    return prefixes[category] || prefixes.general;
  }

  /**
   * Analyze multiple images and get comparative descriptions
   */
  async analyzeMultipleImages(images, context = {}) {
    const { category = 'general', mood, question, userTier = 'free' } = context;
    
    console.log(`Analyzing ${images.length} images for category: ${category}`);
    
    const analysisPromises = images.map(async (image, index) => {
      try {
        const description = await this.getDetailedImageDescription(image.url, category, userTier);
        
        return {
          ...image,
          enhancedCaption: description,
          analysisIndex: index,
          category,
          analysisSuccess: true
        };
      } catch (error) {
        console.warn(`Analysis failed for image ${index}:`, error.message);
        return {
          ...image,
          enhancedCaption: image.caption || `Option ${index + 1} - analysis unavailable`,
          analysisIndex: index,
          category,
          analysisSuccess: false
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
        model: this.models.imageToText,
        analysisType: 'enhanced',
        successRate: analyzedImages.filter(img => img.analysisSuccess).length / analyzedImages.length
      }
    };
  }

  /**
   * Generate comparative analysis between images
   */
  generateComparativeAnalysis(images, context) {
    const { category, mood } = context;
    
    const analysis = {
      totalOptions: images.length,
      category,
      mood,
      insights: []
    };

    // Category-specific comparative insights
    switch (category) {
      case 'clothing':
        analysis.insights = this.generateClothingInsights(images, mood);
        break;
      case 'food':
        analysis.insights = this.generateFoodInsights(images, mood);
        break;
      case 'electronics':
        analysis.insights = this.generateElectronicsInsights(images, mood);
        break;
      default:
        analysis.insights = this.generateGeneralInsights(images, mood);
    }

    return analysis;
  }

  /**
   * Generate clothing-specific insights
   */
  generateClothingInsights(images, mood) {
    const insights = [];
    
    images.forEach((image, index) => {
      const description = image.enhancedCaption.toLowerCase();
      
      let insight = `Option ${index + 1}: `;
      
      // Color analysis
      if (description.includes('blue')) {
        insight += 'Blue coloring suggests calm and professional vibes. ';
      } else if (description.includes('red') || description.includes('pink')) {
        insight += 'Warm colors that can boost energy and confidence. ';
      } else if (description.includes('black')) {
        insight += 'Classic black provides versatility and sophistication. ';
      } else if (description.includes('white')) {
        insight += 'Clean white offers freshness and simplicity. ';
      }
      
      // Mood compatibility
      if (mood) {
        if (mood.toLowerCase().includes('sad') && (description.includes('blue') || description.includes('soft'))) {
          insight += 'Particularly suitable for improving mood. ';
        } else if (mood.toLowerCase().includes('energetic') && (description.includes('bright') || description.includes('vibrant'))) {
          insight += 'Matches your energetic mood perfectly. ';
        }
      }
      
      insights.push(insight.trim());
    });
    
    return insights;
  }

  /**
   * Generate food-specific insights
   */
  generateFoodInsights(images, mood) {
    const insights = [];
    
    images.forEach((image, index) => {
      const description = image.enhancedCaption.toLowerCase();
      
      let insight = `Option ${index + 1}: `;
      
      // Food type analysis
      if (description.includes('salad') || description.includes('vegetables')) {
        insight += 'Healthy option that provides nutrition and energy. ';
      } else if (description.includes('pizza') || description.includes('burger')) {
        insight += 'Comfort food that can boost mood but higher in calories. ';
      } else if (description.includes('soup')) {
        insight += 'Warming and comforting, good for relaxation. ';
      }
      
      // Mood-food connection
      if (mood) {
        if (mood.toLowerCase().includes('stressed') && description.includes('comfort')) {
          insight += 'Good comfort food choice for stress relief. ';
        } else if (mood.toLowerCase().includes('energetic') && description.includes('healthy')) {
          insight += 'Aligns with your active energy levels. ';
        }
      }
      
      insights.push(insight.trim());
    });
    
    return insights;
  }

  /**
   * Generate electronics-specific insights
   */
  generateElectronicsInsights(images, mood) {
    const insights = [];
    
    images.forEach((image, index) => {
      const description = image.enhancedCaption.toLowerCase();
      
      let insight = `Option ${index + 1}: `;
      
      // Device analysis
      if (description.includes('headphones')) {
        insight += 'Audio device for music, calls, or gaming. ';
        if (description.includes('black')) {
          insight += 'Professional appearance suitable for work. ';
        } else if (description.includes('white') || description.includes('colorful')) {
          insight += 'Stylish design that stands out. ';
        }
      }
      
      insights.push(insight.trim());
    });
    
    return insights;
  }

  /**
   * Generate general insights
   */
  generateGeneralInsights(images, mood) {
    return images.map((image, index) => 
      `Option ${index + 1}: ${image.enhancedCaption}`
    );
  }

  /**
   * Convert image URL to blob for API
   */
  async urlToBlob(imageUrl) {
    try {
      // Handle data URLs (base64)
      if (imageUrl.startsWith('data:')) {
        const base64Data = imageUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        return buffer;
      }
      
      // Handle regular URLs
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to convert image URL to blob: ${error.message}`);
    }
  }

  /**
   * Fallback description when AI analysis fails
   */
  getFallbackDescription(imageUrl, category) {
    const fallbacks = {
      clothing: 'Clothing item uploaded for comparison',
      food: 'Food item uploaded for comparison', 
      electronics: 'Electronic device uploaded for comparison',
      general: 'Item uploaded for comparison'
    };
    
    return fallbacks[category] || fallbacks.general;
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      cacheSize: this.cache.size,
      modelsAvailable: Object.keys(this.models).length,
      lastAnalysis: new Date().toISOString()
    };
  }

  /**
   * Clear cache to free memory
   */
  clearCache() {
    this.cache.clear();
    console.log('Enhanced image service cache cleared');
  }
}

module.exports = new EnhancedImageService();