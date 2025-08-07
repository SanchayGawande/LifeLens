#!/usr/bin/env node
/**
 * AI Testing Script
 * 
 * This script allows you to test the AI image analysis capabilities directly
 * without needing to use the frontend interface.
 * 
 * Usage: node test-ai.js
 */

const photoAIService = require('./src/services/photoAIService');
const openRouterClient = require('./src/config/openrouter');

async function runAITests() {
  console.log('🔬 Starting AI Testing Suite...\n');

  // Test 1: Mock T-shirt comparison with different moods
  console.log('=== TEST 1: T-shirt Selection with Different Moods ===');
  
  const mockImages = [
    {
      id: 'test1',
      label: 'Navy Blue T-shirt',
      caption: 'A dark navy blue cotton t-shirt, simple and classic design',
      url: 'data:image/jpeg;base64,test1'
    },
    {
      id: 'test2', 
      label: 'Bright Yellow T-shirt',
      caption: 'A vibrant yellow cotton t-shirt, bold and eye-catching',
      url: 'data:image/jpeg;base64,test2'
    },
    {
      id: 'test3',
      label: 'White T-shirt',
      caption: 'A clean white cotton t-shirt, versatile and neutral',
      url: 'data:image/jpeg;base64,test3'
    }
  ];

  const testScenarios = [
    {
      mood: 'energetic',
      question: 'Which t-shirt should I wear to match my energetic mood?',
      category: 'clothing',
      expectedBehavior: 'Should prefer bright/vibrant options like yellow'
    },
    {
      mood: 'sad',
      question: 'Which t-shirt would be comforting when I\'m feeling down?',
      category: 'clothing', 
      expectedBehavior: 'Should prefer comforting/neutral options like navy or white'
    },
    {
      mood: 'confident',
      question: 'Which t-shirt would help me feel more confident?',
      category: 'clothing',
      expectedBehavior: 'Should prefer bold/standout options'
    }
  ];

  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`\n--- Scenario ${i + 1}: ${scenario.mood.toUpperCase()} mood ---`);
    console.log(`Question: ${scenario.question}`);
    console.log(`Expected: ${scenario.expectedBehavior}`);
    
    try {
      const context = {
        mood: scenario.mood,
        question: scenario.question,
        category: scenario.category
      };

      console.log('\n📝 Prompt being sent to AI:');
      const prompt = photoAIService.buildPhotoDecisionPrompt(mockImages, context);
      console.log('---');
      console.log(prompt);
      console.log('---\n');

      console.log('🤖 Getting AI response...');
      const aiResponse = await photoAIService.analyzePhotos(mockImages, context);
      
      console.log('✅ AI Response:');
      console.log(`Recommended: ${mockImages[aiResponse.recommendedIndex].label}`);
      console.log(`Reasoning: ${aiResponse.reasoning}`);
      console.log(`Confidence: ${Math.round(aiResponse.confidence * 100)}%`);
      console.log(`Mood Factor Score: ${Math.round((aiResponse.factors?.mood_compatibility || 0) * 100)}%`);
      
      console.log('\n📊 All Rankings:');
      aiResponse.ranked?.forEach((rank, index) => {
        console.log(`  ${index + 1}. ${mockImages[rank.index].label}: ${Math.round(rank.score * 100)}% - ${rank.reason}`);
      });

      // Validate the response
      const validation = validateAIResponse(aiResponse, scenario, mockImages);
      console.log('\n🔍 Validation Results:');
      Object.entries(validation).forEach(([key, value]) => {
        const icon = value ? '✅' : '❌';
        console.log(`  ${icon} ${key}: ${value}`);
      });

      if (aiResponse.fallback) {
        console.log('\n⚠️  WARNING: AI used fallback logic (AI service may be unavailable)');
      }

    } catch (error) {
      console.log(`❌ Error testing scenario ${i + 1}:`, error.message);
    }
    
    console.log('\n' + '='.repeat(80));
  }

  // Test 2: Test with different categories
  console.log('\n=== TEST 2: Different Categories ===');
  
  const foodImages = [
    {
      id: 'food1',
      label: 'Pizza',
      caption: 'A cheesy pepperoni pizza with melted cheese',
      url: 'data:image/jpeg;base64,food1'
    },
    {
      id: 'food2',
      label: 'Salad',
      caption: 'A fresh green salad with vegetables and dressing',
      url: 'data:image/jpeg;base64,food2'
    }
  ];

  const foodTest = {
    mood: 'stressed',
    question: 'What should I eat when I\'m feeling stressed?',
    category: 'food'
  };

  console.log('\n--- Food Category Test ---');
  console.log(`Mood: ${foodTest.mood}`);
  console.log(`Question: ${foodTest.question}`);

  try {
    const foodResponse = await photoAIService.analyzePhotos(foodImages, foodTest);
    console.log('\n🍕 Food Recommendation:');
    console.log(`Recommended: ${foodImages[foodResponse.recommendedIndex].label}`);
    console.log(`Reasoning: ${foodResponse.reasoning}`);
    
  } catch (error) {
    console.log('❌ Food test error:', error.message);
  }

  console.log('\n🏁 AI Testing Complete!');
  console.log('\n📋 Summary:');
  console.log('- Check if different moods give different recommendations for the same images');
  console.log('- Verify that AI reasoning mentions the mood and explains the choice');
  console.log('- Ensure confidence scores and factors make sense');
  console.log('- Look for any fallback usage (indicates AI service issues)');
}

function validateAIResponse(response, scenario, images) {
  return {
    'Has valid recommendation': typeof response.recommendedIndex === 'number' && 
                                response.recommendedIndex >= 0 && 
                                response.recommendedIndex < images.length,
    'Reasoning mentions mood': response.reasoning?.toLowerCase().includes(scenario.mood.toLowerCase()),
    'All images ranked': response.ranked?.length === images.length,
    'Scores are valid': response.ranked?.every(r => r.score >= 0 && r.score <= 1),
    'Has confidence score': typeof response.confidence === 'number' && 
                           response.confidence >= 0 && response.confidence <= 1,
    'Has mood factor': response.factors?.mood_compatibility !== undefined,
    'Not using fallback': !response.fallback
  };
}

// Add a simple test for prompt building
function testPromptGeneration() {
  console.log('\n=== PROMPT GENERATION TEST ===');
  
  const testImages = [
    { label: 'Option A', caption: 'Description A' },
    { label: 'Option B', caption: 'Description B' }
  ];
  
  const testContext = {
    mood: 'happy',
    question: 'Test question?',
    category: 'test'
  };

  const prompt = photoAIService.buildPhotoDecisionPrompt(testImages, testContext);
  
  console.log('Generated Prompt:');
  console.log('---');
  console.log(prompt);
  console.log('---');
  
  // Check if prompt includes mood prominently
  const moodMentions = (prompt.match(/happy/gi) || []).length;
  console.log(`\n✅ Mood mentioned ${moodMentions} times in prompt`);
  
  if (moodMentions >= 3) {
    console.log('✅ Good: Mood is emphasized in the prompt');
  } else {
    console.log('⚠️  Warning: Mood should be mentioned more prominently');
  }
}

// Run the tests
if (require.main === module) {
  console.log('🚀 LifeLens AI Testing Tool');
  console.log('===========================\n');
  
  testPromptGeneration();
  
  runAITests().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runAITests, validateAIResponse };