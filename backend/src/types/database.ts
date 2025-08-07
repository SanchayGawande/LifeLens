// Database model types based on Supabase schema

export interface UserProfile {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications_enabled?: boolean;
    auto_decision_enabled?: boolean;
    mood_tracking_enabled?: boolean;
    weather_integration_enabled?: boolean;
  };
  stats?: {
    total_decisions?: number;
    decisions_this_month?: number;
    avg_mood_score?: number;
    streak_days?: number;
  };
}

export interface Decision {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  prompt: string;
  options: string[];
  ai_recommendation: string;
  selected_option?: string;
  confidence_score: number;
  category: DecisionCategory;
  mood_before?: string;
  mood_after?: string;
  context?: {
    weather?: WeatherContext;
    time_of_day?: string;
    location?: string;
    urgency?: 'low' | 'medium' | 'high';
    importance?: 'low' | 'medium' | 'high';
  };
  auto_decided?: boolean;
  feedback_rating?: number;
  feedback_notes?: string;
  tags?: string[];
  image_url?: string;
  image_analysis?: ImageAnalysisResult;
}

export interface Mood {
  id: string;
  user_id: string;
  created_at: string;
  mood_score: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  text_input?: string;
  context?: {
    activity?: string;
    location?: string;
    weather?: string;
    energy_level?: number;
    stress_level?: number;
  };
  decision_id?: string;
}

export interface UserStats {
  user_id: string;
  total_decisions: number;
  decisions_this_week: number;
  decisions_this_month: number;
  avg_mood_score: number;
  mood_trend: 'improving' | 'declining' | 'stable';
  current_streak: number;
  longest_streak: number;
  favorite_categories: DecisionCategory[];
  last_updated: string;
}

// Enum types
export type DecisionCategory = 
  | 'food'
  | 'clothing'
  | 'entertainment'
  | 'travel'
  | 'shopping'
  | 'health'
  | 'work'
  | 'personal'
  | 'finance'
  | 'education'
  | 'other';

export type MoodSentiment = 'positive' | 'negative' | 'neutral';

// Context types
export interface WeatherContext {
  temperature: number;
  condition: string;
  humidity: number;
  visibility: string;
  city: string;
  country: string;
  timestamp: string;
}

export interface ImageAnalysisResult {
  labels: string[];
  confidence_scores: number[];
  dominant_colors?: string[];
  objects_detected?: Array<{
    name: string;
    confidence: number;
    bounding_box?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  text_detected?: string[];
  categories?: string[];
  analysis_provider: 'google' | 'openrouter' | 'replicate' | 'basic';
  processing_time_ms: number;
}

// Database query options
export interface QueryOptions {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  filter?: Record<string, any>;
  search?: string;
}

// Database operation results
export interface DatabaseResult<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Supabase specific types
export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
  anonKey?: string;
}

// Row Level Security policies
export type RLSOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';

export interface RLSPolicy {
  table_name: string;
  policy_name: string;
  operation: RLSOperation;
  using_expression: string;
  check_expression?: string;
}