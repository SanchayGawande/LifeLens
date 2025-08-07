#!/usr/bin/env node

/**
 * Simple AI Test - Run this to verify AI is working correctly
 * 
 * Usage: node test-ai-simple.js
 */

console.log('🔬 Quick AI Test - Checking if AI analyzes images differently based on mood\n');

// Simple test without dependencies
const testData = [
  {
    mood: 'energetic',
    question: 'Which t-shirt should I wear today?',
    expected: 'Should prefer bright/vibrant options'
  },
  {
    mood: 'sad', 
    question: 'Which t-shirt should I wear today?',
    expected: 'Should prefer comforting/neutral options'
  }
];

const images = [
  { label: 'Navy Blue T-shirt', caption: 'Dark navy blue cotton t-shirt' },
  { label: 'Bright Yellow T-shirt', caption: 'Vibrant yellow cotton t-shirt' },
  { label: 'White T-shirt', caption: 'Clean white cotton t-shirt' }
];

console.log('📋 Test Scenarios:');
testData.forEach((test, index) => {
  console.log(`${index + 1}. Mood: ${test.mood}`);
  console.log(`   Question: ${test.question}`);
  console.log(`   Expected: ${test.expected}\n`);
});

console.log('🎯 What to check:');
console.log('1. Different moods should give DIFFERENT recommendations');
console.log('2. Energetic mood should prefer brighter colors (yellow)');
console.log('3. Sad mood should prefer comforting colors (navy/white)');
console.log('4. AI reasoning should mention the mood');
console.log('5. Confidence scores should be reasonable (60-90%)');

console.log('\n📡 To run the full test:');
console.log('1. Make sure your backend is running');
console.log('2. Upload the same 2-3 t-shirt images twice');
console.log('3. First time: Select "energetic" mood');
console.log('4. Second time: Select "sad" mood');
console.log('5. Compare the recommendations - they should be DIFFERENT!');

console.log('\n🔧 For developers:');
console.log('- Check backend console logs for detailed AI processing');
console.log('- Use the /test-photo-ai endpoint for full transparency');
console.log('- Look for "Photo AI Analysis - Context:" logs');

console.log('\n✅ If working correctly:');
console.log('- Same images + different moods = different recommendations');
console.log('- AI reasoning explains why choice fits the mood');
console.log('- No fallback mode being used');

console.log('\n❌ Red flags:');
console.log('- Same recommendation for opposite moods');
console.log('- AI reasoning doesn\'t mention mood');
console.log('- "Used fallback: Yes" in responses');
console.log('- Very low confidence scores (<50%)');

console.log('\n💡 Need more details? Check the backend console while testing!');