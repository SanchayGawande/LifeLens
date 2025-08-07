// API request and response types

import { DecisionCategory, MoodSentiment, ImageAnalysisResult } from './database';

// Auth API types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
  token: string;
  expires_at: string;
}

// Decision API types
export interface CreateDecisionRequest {
  prompt: string;
  options: string[];
  category: DecisionCategory;
  context?: {
    urgency?: 'low' | 'medium' | 'high';
    importance?: 'low' | 'medium' | 'high';
    location?: string;
  };
  mood_before?: string;
  auto_decide?: boolean;
  image?: Express.Multer.File;
}

export interface DecisionResponse {
  id: string;
  prompt: string;
  options: string[];
  ai_recommendation: string;
  confidence_score: number;
  reasoning?: string;
  category: DecisionCategory;
  created_at: string;
  context?: any;
  image_analysis?: ImageAnalysisResult;
}

export interface UpdateDecisionRequest {
  selected_option?: string;
  mood_after?: string;
  feedback_rating?: number;
  feedback_notes?: string;
  tags?: string[];
}

export interface GetDecisionsQuery {
  page?: number;
  limit?: number;
  category?: DecisionCategory;
  start_date?: string;
  end_date?: string;
  search?: string;
  sort_by?: 'created_at' | 'confidence_score' | 'feedback_rating';
  sort_order?: 'asc' | 'desc';
}

// Mood API types
export interface CreateMoodRequest {
  text_input?: string;
  mood_score?: number;
  context?: {
    activity?: string;
    location?: string;
    energy_level?: number;
    stress_level?: number;
  };
  decision_id?: string;
}

export interface MoodResponse {
  id: string;
  mood_score: number;
  sentiment: MoodSentiment;
  confidence: number;
  text_input?: string;
  context?: any;
  created_at: string;
}

export interface GetMoodsQuery {
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  sentiment?: MoodSentiment;
  min_score?: number;
  max_score?: number;
}

export interface MoodTrendsResponse {
  daily_averages: Array<{
    date: string;
    avg_score: number;
    mood_count: number;
  }>;
  weekly_averages: Array<{
    week: string;
    avg_score: number;
    mood_count: number;
  }>;
  monthly_averages: Array<{
    month: string;
    avg_score: number;
    mood_count: number;
  }>;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

// User API types
export interface UpdateProfileRequest {
  full_name?: string;
  avatar_url?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications_enabled?: boolean;
    auto_decision_enabled?: boolean;
    mood_tracking_enabled?: boolean;
    weather_integration_enabled?: boolean;
  };
}

export interface UserStatsResponse {
  total_decisions: number;
  decisions_this_week: number;
  decisions_this_month: number;
  avg_mood_score: number;
  mood_trend: 'improving' | 'declining' | 'stable';
  current_streak: number;
  longest_streak: number;
  favorite_categories: {
    category: DecisionCategory;
    count: number;
    percentage: number;
  }[];
  recent_activity: {
    decisions_by_day: Array<{
      date: string;
      count: number;
    }>;
    moods_by_day: Array<{
      date: string;
      avg_score: number;
    }>;
  };
}

// Image analysis API types
export interface ImageAnalysisRequest {
  image: Express.Multer.File;
  category?: DecisionCategory;
  include_text?: boolean;
  include_objects?: boolean;
  include_colors?: boolean;
}

export interface ImageAnalysisResponse {
  analysis: ImageAnalysisResult;
  suggestions?: string[];
  confidence_threshold_met: boolean;
  processing_time_ms: number;
  cost_estimate?: number;
}

// Weather API types
export interface WeatherRequest {
  latitude: number;
  longitude: number;
  units?: 'metric' | 'imperial';
}

export interface WeatherResponse {
  temperature: number;
  feels_like: number;
  condition: string;
  description: string;
  humidity: number;
  visibility: number;
  wind_speed: number;
  wind_direction: number;
  city: string;
  country: string;
  timestamp: string;
  icon: string;
}

// Nudge API types
export interface NudgeRequest {
  decision_prompt?: string;
  category?: DecisionCategory;
  time_context?: 'morning' | 'afternoon' | 'evening' | 'night';
  weather_context?: WeatherResponse;
  mood_context?: {
    recent_score: number;
    sentiment: MoodSentiment;
  };
}

export interface NudgeResponse {
  nudges: Array<{
    type: 'weather' | 'mood' | 'time' | 'category' | 'streak' | 'goal';
    message: string;
    priority: 'low' | 'medium' | 'high';
    action_required: boolean;
    action_text?: string;
  }>;
  confidence_score: number;
  applicable_rules: string[];
}

// Error response types
export interface ValidationErrorResponse {
  success: false;
  error: 'VALIDATION_ERROR';
  message: string;
  details: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

export interface NotFoundErrorResponse {
  success: false;
  error: 'NOT_FOUND';
  message: string;
  resource?: string;
  id?: string;
}

export interface UnauthorizedErrorResponse {
  success: false;
  error: 'UNAUTHORIZED';
  message: string;
}

export interface ServerErrorResponse {
  success: false;
  error: 'SERVER_ERROR';
  message: string;
  details?: any;
}

// Health check types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      response_time_ms?: number;
    };
    redis: {
      status: 'connected' | 'disconnected';
      response_time_ms?: number;
    };
    external_apis: {
      openrouter: {
        status: 'available' | 'unavailable';
        response_time_ms?: number;
      };
      google_vision: {
        status: 'available' | 'unavailable';
        response_time_ms?: number;
      };
      weather: {
        status: 'available' | 'unavailable';
        response_time_ms?: number;
      };
    };
  };
}