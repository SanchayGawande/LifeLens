import axios from 'axios';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && session) {
        // Retry the original request
        error.config.headers.Authorization = `Bearer ${session.access_token}`;
        return axios(error.config);
      }
    }
    return Promise.reject(error);
  }
);

// API methods
export const decisionsAPI = {
  // Legacy method for backward compatibility
  makeDecision: async (data) => {
    const response = await api.post('/decisions/decide', data);
    return response.data;
  },

  // Enhanced decision method with ranking
  makeEnhancedDecision: async (inputText, mood = null, category = null, preferences = {}, autoDecide = false) => {
    const requestData = {
      inputText,
      mood,
      category,
      preferences,
      autoDecide,
      context: {
        timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening',
        timestamp: new Date().toISOString()
      }
    };

    const response = await api.post('/decisions/decide', requestData);
    return response.data;
  },

  // Auto-decision method for surprise mode
  makeAutoDecision: async (inputText, mood = null, category = null) => {
    return decisionsAPI.makeEnhancedDecision(inputText, mood, category, {}, true);
  },
  
  getHistory: async (params = {}) => {
    const response = await api.get('/decisions/history', { params });
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/decisions/stats');
    return response.data;
  },

  // Get gamification stats
  getGamificationStats: async () => {
    const response = await api.get('/decisions/gamification');
    return response.data;
  },

  // Submit feedback for decisions
  submitFeedback: async (decisionId, reaction, rating = null) => {
    const response = await api.post('/decisions/feedback', {
      decisionId,
      reaction,
      rating
    });
    return response.data;
  },

  // Get nudge data for contextual suggestions
  getNudgeData: async (days = 7) => {
    const response = await api.get('/decisions/nudge-data', { params: { days } });
    return response.data;
  },

  // Submit nudge feedback
  submitNudgeFeedback: async (nudgeId, action, nudgeType) => {
    const response = await api.post('/decisions/nudge-feedback', {
      nudgeId,
      action,
      nudgeType,
      timestamp: new Date().toISOString()
    });
    return response.data;
  },

  // Get user context for nudges
  getUserContext: async () => {
    const response = await api.get('/decisions/context');
    return response.data;
  },

  // Photo-based decisions
  makePhotoDecision: async (images, question, mood = null, category = null, labels = [], weather = null) => {
    const formData = new FormData();
    
    // Add images to form data
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      if (Platform.OS === 'web') {
        // For web platform, use base64 data if available
        try {
          let blob;
          if (image.base64) {
            // Convert base64 to blob
            const base64Data = image.base64;
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let j = 0; j < byteCharacters.length; j++) {
              byteNumbers[j] = byteCharacters.charCodeAt(j);
            }
            const byteArray = new Uint8Array(byteNumbers);
            blob = new Blob([byteArray], { type: 'image/jpeg' });
          } else if (image.uri.startsWith('blob:') || image.uri.startsWith('data:')) {
            // For blob URLs or data URLs, fetch directly
            const response = await fetch(image.uri);
            blob = await response.blob();
          } else {
            // For file input on web, create blob from file
            const response = await fetch(image.uri);
            blob = await response.blob();
          }
          
          const file = new File([blob], `image_${i}.jpg`, { type: blob.type || 'image/jpeg' });
          formData.append('images', file);
        } catch (error) {
          console.error('Error converting web image to file:', error);
          throw new Error(`Failed to process image ${i + 1}. Please try selecting the image again.`);
        }
      } else {
        // For React Native mobile platforms
        const imageFile = {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: `image_${i}.jpg`,
        };
        formData.append('images', imageFile);
      }
    }
    
    // Add metadata
    formData.append('question', question);
    if (mood) formData.append('mood', mood);
    if (category) formData.append('category', category);
    if (labels.length > 0) formData.append('labels', JSON.stringify(labels));
    if (weather) formData.append('weather', JSON.stringify(weather));

    const response = await api.post('/decisions/decide-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds for photo processing
    });
    
    return response.data;
  },

  // Submit feedback for photo decision
  submitPhotoFeedback: async (decisionId, feedback) => {
    const response = await api.post('/decisions/photo-feedback', {
      decisionId,
      feedback
    });
    return response.data;
  },

  // Get photo decision history
  getPhotoHistory: async (params = {}) => {
    const response = await api.get('/decisions/photo-history', { params });
    return response.data;
  },
};

export const moodsAPI = {
  analyzeMood: async (text, type = 'text') => {
    const response = await api.post('/moods/analyze', { text, type });
    return response.data;
  },
  
  getHistory: async (params = {}) => {
    const response = await api.get('/moods/history', { params });
    return response.data;
  },
  
  getTrends: async (days = 7) => {
    const response = await api.get('/moods/trends', { params: { days } });
    return response.data;
  },
};

export const usersAPI = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  
  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },
  
  getAchievements: async () => {
    const response = await api.get('/users/achievements');
    return response.data;
  },
};

export default api;