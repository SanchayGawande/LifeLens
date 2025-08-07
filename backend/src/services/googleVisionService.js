const vision = require('@google-cloud/vision');

class GoogleVisionService {
  constructor() {
    // Initialize the client
    try {
      // Will use GOOGLE_APPLICATION_CREDENTIALS env var if set,
      // or you can provide explicit credentials
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.client = new vision.ImageAnnotatorClient();
        console.log('Google Vision API initialized with credentials file');
      } else if (process.env.GOOGLE_CLOUD_VISION_API_KEY) {
        this.client = new vision.ImageAnnotatorClient({
          apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY
        });
        console.log('Google Vision API initialized with API key');
      } else {
        console.warn('No Google Vision credentials found - vision analysis unavailable');
        this.client = null;
      }
    } catch (error) {
      console.error('Failed to initialize Google Vision API:', error.message);
      this.client = null;
    }
  }

  /**
   * Check if the service is available
   */
  isAvailable() {
    return !!this.client;
  }

  /**
   * Analyze image for general object detection and labels
   */
  async analyzeImage(imageBuffer, options = {}) {
    if (!this.client) {
      throw new Error('Google Vision API not available');
    }

    try {
      console.log('Analyzing image with Google Vision API...');
      
      // Prepare the image
      const image = {
        content: Buffer.isBuffer(imageBuffer) ? imageBuffer.toString('base64') : imageBuffer
      };

      // Perform multiple types of analysis
      const [labelResult, objectResult, textResult] = await Promise.all([
        this.client.labelDetection({ image }),
        this.client.objectLocalization({ image }),
        this.client.textDetection({ image })
      ]);

      const labels = labelResult[0].labelAnnotations || [];
      const objects = objectResult[0].localizedObjectAnnotations || [];
      const texts = textResult[0].textAnnotations || [];

      return {
        labels: labels.map(label => ({
          description: label.description,
          confidence: label.score,
          topicality: label.topicality
        })),
        objects: objects.map(obj => ({
          name: obj.name,
          confidence: obj.score,
          boundingBox: obj.boundingPoly
        })),
        text: texts.map(text => ({
          description: text.description,
          confidence: text.confidence || 1.0
        })),
        dominantColors: null // We'll add this separately if needed
      };
    } catch (error) {
      console.error('Google Vision analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Analyze clothing items specifically
   */
  async analyzeClothing(imageBuffer) {
    const analysis = await this.analyzeImage(imageBuffer);
    
    // Filter for clothing-related labels
    const clothingKeywords = [
      'clothing', 'shirt', 'dress', 'pants', 'jacket', 'sweater', 
      'hoodie', 'skirt', 'blouse', 'top', 'bottom', 'garment',
      'apparel', 'fashion', 'wear', 'outfit', 'costume'
    ];
    
    const colorKeywords = [
      'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
      'black', 'white', 'gray', 'grey', 'brown', 'beige', 'navy',
      'maroon', 'violet', 'cyan', 'magenta', 'lime', 'olive'
    ];

    // Find clothing items
    const clothingLabels = analysis.labels.filter(label => 
      clothingKeywords.some(keyword => 
        label.description.toLowerCase().includes(keyword)
      )
    );

    // Find colors
    const colorLabels = analysis.labels.filter(label =>
      colorKeywords.some(keyword =>
        label.description.toLowerCase().includes(keyword)
      )
    );

    // Find patterns and styles
    const styleKeywords = [
      'striped', 'solid', 'plaid', 'floral', 'geometric', 'polka dot',
      'casual', 'formal', 'sporty', 'vintage', 'modern', 'classic'
    ];
    
    const styleLabels = analysis.labels.filter(label =>
      styleKeywords.some(keyword =>
        label.description.toLowerCase().includes(keyword)
      )
    );

    return {
      ...analysis,
      clothing: clothingLabels,
      colors: colorLabels,
      styles: styleLabels,
      summary: this.generateClothingSummary(clothingLabels, colorLabels, styleLabels, analysis.text)
    };
  }

  /**
   * Analyze food items specifically
   */
  async analyzeFood(imageBuffer) {
    const analysis = await this.analyzeImage(imageBuffer);
    
    // Filter for food-related labels
    const foodKeywords = [
      'food', 'meal', 'dish', 'cuisine', 'cooking', 'recipe',
      'breakfast', 'lunch', 'dinner', 'snack', 'appetizer', 'dessert',
      'pizza', 'burger', 'salad', 'pasta', 'sandwich', 'soup',
      'fruit', 'vegetable', 'meat', 'seafood', 'dairy', 'bread',
      'drink', 'beverage', 'coffee', 'tea', 'juice', 'water'
    ];

    const nutritionKeywords = [
      'healthy', 'organic', 'fresh', 'natural', 'nutritious',
      'protein', 'vegetarian', 'vegan', 'gluten-free', 'low-fat'
    ];

    // Find food items
    const foodLabels = analysis.labels.filter(label => 
      foodKeywords.some(keyword => 
        label.description.toLowerCase().includes(keyword)
      )
    );

    // Find nutritional indicators
    const nutritionLabels = analysis.labels.filter(label =>
      nutritionKeywords.some(keyword =>
        label.description.toLowerCase().includes(keyword)
      )
    );

    return {
      ...analysis,
      food: foodLabels,
      nutrition: nutritionLabels,
      summary: this.generateFoodSummary(foodLabels, nutritionLabels, analysis.text)
    };
  }

  /**
   * Analyze electronics specifically
   */
  async analyzeElectronics(imageBuffer) {
    const analysis = await this.analyzeImage(imageBuffer);
    
    // Filter for electronics-related labels
    const electronicsKeywords = [
      'electronics', 'device', 'gadget', 'technology', 'computer',
      'phone', 'smartphone', 'tablet', 'laptop', 'desktop',
      'headphones', 'speaker', 'camera', 'watch', 'smartwatch',
      'television', 'monitor', 'keyboard', 'mouse', 'charger',
      'cable', 'adapter', 'battery', 'gaming', 'console'
    ];

    const brandKeywords = [
      'apple', 'samsung', 'google', 'microsoft', 'sony', 'lg',
      'dell', 'hp', 'lenovo', 'asus', 'acer', 'nintendo', 'xbox'
    ];

    // Find electronics
    const electronicsLabels = analysis.labels.filter(label => 
      electronicsKeywords.some(keyword => 
        label.description.toLowerCase().includes(keyword)
      )
    );

    // Find potential brands
    const brandLabels = analysis.labels.filter(label =>
      brandKeywords.some(keyword =>
        label.description.toLowerCase().includes(keyword)
      )
    );

    // Extract text that might contain model numbers or specifications
    const technicalText = analysis.text.filter(text =>
      /\b[A-Z0-9]{3,}\b/.test(text.description) // Look for model numbers
    );

    return {
      ...analysis,
      electronics: electronicsLabels,
      brands: brandLabels,
      technicalInfo: technicalText,
      summary: this.generateElectronicsSummary(electronicsLabels, brandLabels, technicalText)
    };
  }

  /**
   * Analyze by category with appropriate specialization
   */
  async analyzeByCategory(imageBuffer, category = 'general') {
    switch (category.toLowerCase()) {
      case 'clothing':
        return await this.analyzeClothing(imageBuffer);
      case 'food':
        return await this.analyzeFood(imageBuffer);
      case 'electronics':
        return await this.analyzeElectronics(imageBuffer);
      default:
        return await this.analyzeImage(imageBuffer);
    }
  }

  /**
   * Generate clothing summary from analysis
   */
  generateClothingSummary(clothingLabels, colorLabels, styleLabels, textData) {
    let summary = '';
    
    // Primary clothing item
    if (clothingLabels.length > 0) {
      const primaryItem = clothingLabels[0];
      summary = `This appears to be a ${primaryItem.description.toLowerCase()}`;
    } else {
      summary = 'This appears to be a clothing item';
    }

    // Add color information
    if (colorLabels.length > 0) {
      const primaryColor = colorLabels[0];
      summary += ` in ${primaryColor.description.toLowerCase()}`;
    }

    // Add style information
    if (styleLabels.length > 0) {
      const style = styleLabels[0];
      summary += ` with a ${style.description.toLowerCase()} style`;
    }

    // Add confidence
    const avgConfidence = clothingLabels.length > 0 
      ? Math.round(clothingLabels[0].confidence * 100)
      : 70;
    
    summary += ` (${avgConfidence}% confidence)`;

    return summary;
  }

  /**
   * Generate food summary from analysis
   */
  generateFoodSummary(foodLabels, nutritionLabels, textData) {
    let summary = '';
    
    // Primary food item
    if (foodLabels.length > 0) {
      const primaryFood = foodLabels[0];
      summary = `This appears to be ${primaryFood.description.toLowerCase()}`;
    } else {
      summary = 'This appears to be a food item';
    }

    // Add nutritional characteristics
    if (nutritionLabels.length > 0) {
      const nutrition = nutritionLabels[0];
      summary += ` that looks ${nutrition.description.toLowerCase()}`;
    }

    // Add confidence
    const avgConfidence = foodLabels.length > 0 
      ? Math.round(foodLabels[0].confidence * 100)
      : 70;
    
    summary += ` (${avgConfidence}% confidence)`;

    return summary;
  }

  /**
   * Generate electronics summary from analysis
   */
  generateElectronicsSummary(electronicsLabels, brandLabels, technicalText) {
    let summary = '';
    
    // Primary device
    if (electronicsLabels.length > 0) {
      const primaryDevice = electronicsLabels[0];
      summary = `This appears to be ${primaryDevice.description.toLowerCase()}`;
    } else {
      summary = 'This appears to be an electronic device';
    }

    // Add brand if detected
    if (brandLabels.length > 0) {
      const brand = brandLabels[0];
      summary += ` from ${brand.description}`;
    }

    // Add confidence
    const avgConfidence = electronicsLabels.length > 0 
      ? Math.round(electronicsLabels[0].confidence * 100)
      : 70;
    
    summary += ` (${avgConfidence}% confidence)`;

    return summary;
  }

  /**
   * Convert image URL or data URL to buffer
   */
  async urlToBuffer(imageUrl) {
    try {
      if (imageUrl.startsWith('data:')) {
        // Handle data URLs
        const base64Data = imageUrl.split(',')[1];
        return Buffer.from(base64Data, 'base64');
      } else {
        // Handle regular URLs
        const axios = require('axios');
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 10000
        });
        return Buffer.from(response.data);
      }
    } catch (error) {
      throw new Error(`Failed to convert image URL to buffer: ${error.message}`);
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      available: this.isAvailable(),
      provider: 'Google Cloud Vision API',
      features: [
        'Label Detection',
        'Object Localization', 
        'Text Detection (OCR)',
        'Category-specific analysis'
      ],
      costEffective: true,
      accuracy: 'High'
    };
  }
}

module.exports = new GoogleVisionService();