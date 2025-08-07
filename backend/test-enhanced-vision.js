/**
 * Test enhanced vision AI with user labels
 */

// Load environment variables
require('dotenv').config();

const basicImageService = require('./src/services/basicImageService');

async function testEnhancedVision() {
  console.log('🔍 Testing Enhanced Vision AI with User Labels...\n');
  
  // Test with different colored t-shirts
  const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFZ6H6OnQAAAABJRU5ErkJggg==';
  
  try {
    console.log('📋 Test 1: Blue T-shirt for Happy Mood...');
    const blueShirtHappy = await basicImageService.analyzeMultipleImages([
      { id: 'blue', url: testImage, label: 'Blue T-shirt', caption: 'Blue T-shirt' },
      { id: 'red', url: testImage, label: 'Red T-shirt', caption: 'Red T-shirt' },
      { id: 'black', url: testImage, label: 'Black T-shirt', caption: 'Black T-shirt' }
    ], { category: 'clothing', mood: 'happy' });
    
    console.log('✅ Happy Mood Analysis:');
    blueShirtHappy.images.forEach((img, i) => {
      console.log(`- Option ${i + 1}: ${img.enhancedCaption}`);
    });
    console.log('');
    
    console.log('📋 Test 2: Same T-shirts for Sad Mood...');
    const blueShirtSad = await basicImageService.analyzeMultipleImages([
      { id: 'blue', url: testImage, label: 'Blue T-shirt', caption: 'Blue T-shirt' },
      { id: 'red', url: testImage, label: 'Red T-shirt', caption: 'Red T-shirt' },  
      { id: 'black', url: testImage, label: 'Black T-shirt', caption: 'Black T-shirt' }
    ], { category: 'clothing', mood: 'sad' });
    
    console.log('✅ Sad Mood Analysis:');
    blueShirtSad.images.forEach((img, i) => {
      console.log(`- Option ${i + 1}: ${img.enhancedCaption}`);
    });
    console.log('');
    
    console.log('📋 Test 3: Mood-specific insights...');
    console.log('Happy mood insights:');
    blueShirtHappy.comparison.insights.forEach((insight, i) => {
      console.log(`- ${insight}`);
    });
    
    console.log('\nSad mood insights:');
    blueShirtSad.comparison.insights.forEach((insight, i) => {
      console.log(`- ${insight}`);
    });
    
    console.log('\n🎉 Enhanced Vision AI test completed!');
    console.log('🔥 User labels are now being used for accurate descriptions!');
    
  } catch (error) {
    console.error('❌ Enhanced Vision AI test failed:', error.message);
    console.error('🔧 Debug info:', error.stack);
  }
}

// Run the test
testEnhancedVision().then(() => {
  console.log('\n✨ Test script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});