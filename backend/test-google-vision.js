require('dotenv').config();
const googleVisionService = require('./src/services/googleVisionService');
const fs = require('fs');
const path = require('path');

async function testGoogleVision() {
  console.log('🔍 Testing Google Vision API Integration...\n');
  
  // Check if service is available
  console.log('1. Checking service availability...');
  const isAvailable = googleVisionService.isAvailable();
  console.log(`   Service available: ${isAvailable ? '✅ Yes' : '❌ No'}`);
  
  if (!isAvailable) {
    console.log('\n❌ Google Vision API not available. Please check your configuration:');
    console.log('   - Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_VISION_API_KEY');
    console.log('   - Ensure your Google Cloud project has Vision API enabled');
    console.log('   - Verify your service account has the necessary permissions');
    return;
  }
  
  // Get service stats
  console.log('\n2. Service configuration:');
  const stats = googleVisionService.getStats();
  console.log('   Provider:', stats.provider);
  console.log('   Features:', stats.features.join(', '));
  console.log('   Cost effective:', stats.costEffective ? '✅ Yes' : '❌ No');
  console.log('   Accuracy:', stats.accuracy);
  
  // Test with a sample image (create a simple test image data URL)
  console.log('\n3. Testing with sample image...');
  
  // Create a simple red square as base64 for testing
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const testImageDataUrl = `data:image/png;base64,${testImageBase64}`;
  
  try {
    // Test general analysis
    console.log('   Testing general image analysis...');
    const imageBuffer = await googleVisionService.urlToBuffer(testImageDataUrl);
    const generalAnalysis = await googleVisionService.analyzeImage(imageBuffer);
    
    console.log('   ✅ General analysis completed');
    console.log(`   - Found ${generalAnalysis.labels.length} labels`);
    console.log(`   - Found ${generalAnalysis.objects.length} objects`);
    console.log(`   - Found ${generalAnalysis.text.length} text elements`);
    
    if (generalAnalysis.labels.length > 0) {
      console.log('   - Top label:', generalAnalysis.labels[0].description, 
                 `(${Math.round(generalAnalysis.labels[0].confidence * 100)}% confidence)`);
    }
    
    // Test category-specific analysis
    console.log('\n   Testing clothing analysis...');
    const clothingAnalysis = await googleVisionService.analyzeClothing(imageBuffer);
    console.log('   ✅ Clothing analysis completed');
    console.log('   - Summary:', clothingAnalysis.summary);
    
    console.log('\n   Testing food analysis...');
    const foodAnalysis = await googleVisionService.analyzeFood(imageBuffer);
    console.log('   ✅ Food analysis completed');
    console.log('   - Summary:', foodAnalysis.summary);
    
    console.log('\n   Testing electronics analysis...');
    const electronicsAnalysis = await googleVisionService.analyzeElectronics(imageBuffer);
    console.log('   ✅ Electronics analysis completed');
    console.log('   - Summary:', electronicsAnalysis.summary);
    
  } catch (error) {
    console.log('   ❌ Analysis failed:', error.message);
    
    if (error.message.includes('permission')) {
      console.log('\n   💡 This might be a permissions issue. Make sure:');
      console.log('      - Your Google Cloud project has Vision API enabled');
      console.log('      - Your service account has Vision API permissions');
      console.log('      - Your credentials file is valid and accessible');
    } else if (error.message.includes('quota')) {
      console.log('\n   💡 This might be a quota issue. Check your Google Cloud quotas.');
    } else if (error.message.includes('billing')) {
      console.log('\n   💡 Make sure billing is enabled for your Google Cloud project.');
    }
  }
  
  console.log('\n🏁 Test completed!');
  console.log('\nNext steps:');
  console.log('1. If the test passed, your Google Vision API is ready to use');
  console.log('2. Upload real images through your LifeLens app to see actual image analysis');
  console.log('3. The system will now use Google Vision instead of placeholder text');
}

// Run the test
testGoogleVision().catch(console.error);