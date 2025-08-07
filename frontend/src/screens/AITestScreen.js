import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { decisionsAPI } from '../services/api';
import PhotoUploader from '../components/PhotoUploader';
import MoodSelector from '../components/MoodSelector';

const CATEGORIES = [
  { id: 'food', name: 'Food', icon: 'restaurant' },
  { id: 'clothing', name: 'Clothing', icon: 'shirt' },
  { id: 'activity', name: 'Activity', icon: 'bicycle' },
  { id: 'work', name: 'Work', icon: 'briefcase' },
  { id: 'social', name: 'Social', icon: 'people' },
  { id: 'other', name: 'Other', icon: 'apps' },
];

export default function AITestScreen({ navigation }) {
  const [images, setImages] = useState([]);
  const [question, setQuestion] = useState('Which t-shirt should I wear today?');
  const [selectedMood, setSelectedMood] = useState('energetic');
  const [selectedCategory, setSelectedCategory] = useState('clothing');
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAITest = async () => {
    if (images.length < 2) {
      Alert.alert('Need Images', 'Please upload at least 2 images to test.');
      return;
    }

    if (!question.trim()) {
      Alert.alert('Need Question', 'Please provide a question for the AI to answer.');
      return;
    }

    setLoading(true);
    setTestResults(null);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      // Use the test endpoint
      const response = await fetch('http://localhost:3001/api/decisions/test-photo-ai', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'multipart/form-data',
        },
        body: createTestFormData()
      });

      const result = await response.json();
      
      if (response.ok) {
        setTestResults(result);
        
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        throw new Error(result.error || 'Test failed');
      }

    } catch (error) {
      console.error('AI Test error:', error);
      Alert.alert('Test Failed', error.message || 'Unable to run AI test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createTestFormData = () => {
    const formData = new FormData();
    
    // Add images
    images.forEach((image, index) => {
      if (Platform.OS === 'web') {
        if (image.base64) {
          const byteCharacters = atob(image.base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });
          const file = new File([blob], `test_image_${index}.jpg`, { type: 'image/jpeg' });
          formData.append('images', file);
        }
      } else {
        const imageFile = {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: `test_image_${index}.jpg`,
        };
        formData.append('images', imageFile);
      }
    });
    
    // Add metadata
    formData.append('question', question);
    if (selectedMood) formData.append('mood', selectedMood);
    if (selectedCategory) formData.append('category', selectedCategory);
    
    const labels = images.map(img => img.label);
    formData.append('labels', JSON.stringify(labels));

    return formData;
  };

  const getAuthToken = async () => {
    // You'll need to get this from your auth service
    // This is a placeholder - implement based on your auth system
    return 'your-auth-token';
  };

  const renderTestResults = () => {
    if (!testResults) return null;

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>🔬 AI Test Results</Text>
        
        {/* Input Verification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Input Verification</Text>
          <Text style={styles.resultText}>Question: {testResults.inputVerification.question}</Text>
          <Text style={styles.resultText}>Mood: {testResults.inputVerification.mood}</Text>
          <Text style={styles.resultText}>Category: {testResults.inputVerification.category}</Text>
          <Text style={styles.resultText}>Images: {testResults.inputVerification.imageCount}</Text>
          
          <Text style={styles.subTitle}>AI's Understanding of Images:</Text>
          {testResults.inputVerification.imageCaptions.map((caption, index) => (
            <Text key={index} style={styles.captionText}>
              {index + 1}. {testResults.inputVerification.imageLabels[index]}: {caption}
            </Text>
          ))}
        </View>

        {/* AI Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI Analysis</Text>
          <Text style={styles.resultText}>
            Used Fallback: {testResults.aiAnalysis.usedFallback ? '⚠️ Yes' : '✅ No'}
          </Text>
          {testResults.aiAnalysis.processingError && (
            <Text style={styles.errorText}>Error: {testResults.aiAnalysis.processingError}</Text>
          )}
          
          <Text style={styles.subTitle}>AI's Reasoning:</Text>
          <Text style={styles.reasoningText}>{testResults.recommendationAnalysis.reasoning}</Text>
        </View>

        {/* Recommendation Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Recommendation Analysis</Text>
          <Text style={styles.resultText}>
            Recommended: {testResults.recommendationAnalysis.recommendedOption?.label}
          </Text>
          <Text style={styles.resultText}>
            Confidence: {Math.round(testResults.recommendationAnalysis.confidence * 100)}%
          </Text>
          <Text style={styles.resultText}>
            Mood Factor Score: {Math.round((testResults.recommendationAnalysis.moodFactorScore || 0) * 100)}%
          </Text>
          
          <Text style={styles.subTitle}>All Rankings:</Text>
          {testResults.recommendationAnalysis.allRankings?.map((ranking, index) => (
            <View key={index} style={styles.rankingItem}>
              <Text style={styles.rankingText}>
                #{index + 1} {ranking.label}: {Math.round(ranking.score * 100)}%
              </Text>
              <Text style={styles.rankingReason}>{ranking.reason}</Text>
            </View>
          ))}
        </View>

        {/* Test Validation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Test Validation</Text>
          {Object.entries(testResults.testValidation).map(([key, value]) => (
            <Text key={key} style={styles.validationText}>
              {value ? '✅' : '❌'} {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </Text>
          ))}
        </View>

        {/* Processing Time */}
        <Text style={styles.processingTime}>
          Processing Time: {testResults.processingTime}ms
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backIcon}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#6366f1" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerText}>🔬 AI Testing Lab</Text>
            <Text style={styles.headerSubtext}>
              Test and verify AI image analysis accuracy
            </Text>
          </View>
        </View>

        {/* Photo Uploader */}
        <PhotoUploader
          onImagesSelected={setImages}
          initialImages={images}
          disabled={loading}
          style={styles.photoUploader}
        />

        {/* Question Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Test Question *</Text>
          <TextInput
            style={styles.questionInput}
            placeholder="e.g., Which outfit should I wear today?"
            placeholderTextColor="#9ca3af"
            value={question}
            onChangeText={setQuestion}
            multiline
            maxLength={200}
            textAlignVertical="top"
          />
        </View>

        {/* Mood Selector */}
        <MoodSelector
          selectedMood={selectedMood}
          onMoodChange={setSelectedMood}
          style={styles.moodContainer}
        />

        {/* Category Selection */}
        <View style={styles.categoryContainer}>
          <Text style={styles.sectionTitle}>Category</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContainer}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons
                  name={category.icon}
                  size={20}
                  color={selectedCategory === category.id ? '#fff' : '#6366f1'}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.categoryTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Test Button */}
        <TouchableOpacity
          style={[
            styles.testButton,
            (loading || images.length < 2 || !question.trim()) && styles.testButtonDisabled
          ]}
          onPress={runAITest}
          disabled={loading || images.length < 2 || !question.trim()}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.loadingText}>Testing AI...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="flask" size={24} color="#fff" />
              <Text style={styles.testButtonText}>Run AI Test</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Test Results */}
        {renderTestResults()}

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  backIcon: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
  },
  photoUploader: {
    marginHorizontal: 20,
  },
  inputContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  questionInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 80,
    maxHeight: 120,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  moodContainer: {
    marginHorizontal: 20,
  },
  categoryContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  categoryScrollContainer: {
    paddingRight: 20,
  },
  categoryButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  testButton: {
    backgroundColor: '#f59e0b',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
      },
    }),
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  resultsContainer: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  resultText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 10,
    marginBottom: 5,
  },
  captionText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 10,
    marginBottom: 3,
  },
  reasoningText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontStyle: 'italic',
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 8,
  },
  rankingItem: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  rankingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  rankingReason: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 3,
  },
  validationText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 3,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  processingTime: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    height: 40,
  },
});