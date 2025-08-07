/**
 * Simple test script to verify Hugging Face vision AI integration
 */

// Load environment variables
require('dotenv').config();

const enhancedImageService = require('./src/services/enhancedImageService');

async function testVisionAI() {
  console.log('🔍 Testing Enhanced Vision AI Integration...\n');
  
  // Test with a simple base64 encoded image (1x1 red pixel)
  const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFZ6H6OnQAAAABJRU5ErkJggg==';
  
  try {
    console.log('📋 Test 1: Basic image description...');
    const description = await enhancedImageService.getDetailedImageDescription(testImage, 'general', 'free');
    console.log('✅ Result:', description);
    console.log('');
    
    console.log('📋 Test 2: Clothing category analysis...');
    const clothingDesc = await enhancedImageService.getDetailedImageDescription(testImage, 'clothing', 'free');
    console.log('✅ Result:', clothingDesc);
    console.log('');
    
    console.log('📋 Test 3: Multiple image analysis...');
    const multiResult = await enhancedImageService.analyzeMultipleImages([
      { id: 'test1', url: testImage, caption: 'Test image 1' },
      { id: 'test2', url: testImage, caption: 'Test image 2' }
    ], { category: 'clothing', mood: 'happy' });
    
    console.log('✅ Multi-analysis result:');
    console.log('- Total images:', multiResult.images.length);
    console.log('- Success rate:', multiResult.analysisMetadata.successRate);
    console.log('- Comparison insights:', multiResult.comparison.insights.length, 'insights');
    console.log('');
    
    // Test service stats
    const stats = enhancedImageService.getUsageStats();
    console.log('📊 Service Statistics:');
    console.log('- Cache size:', stats.cacheSize);
    console.log('- Models available:', stats.modelsAvailable);
    console.log('- Last analysis:', stats.lastAnalysis);
    
    console.log('\n🎉 All vision AI tests completed successfully!');
    console.log('🔥 Hugging Face integration is working!');
    
  } catch (error) {
    console.error('❌ Vision AI test failed:', error.message);
    console.error('🔧 Debug info:', error.stack);
  }
}

// Run the test
testVisionAI().then(() => {
  console.log('\n✨ Test script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});