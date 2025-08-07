// Shared API request and response types

import { DecisionCategory, MoodSentiment, Decision, Mood, UserProfile } from './models';

// Base API types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp?: string;
    version?: string;
    request_id?: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Auth API types
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
  device_info?: {
    name: string;
    type: string;
    os: string;
    app_version: string;
  };
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name?: string;
  marketing_consent?: boolean;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  referral_code?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    email_verified: boolean;
    created_at: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: string;
    expires_in: number;
    token_type: 'Bearer';
  };
  profile?: UserProfile;
}

export interface ResetPasswordRequest {
  email: string;
  redirect_url?: string;
}

export interface UpdatePasswordRequest {
  current_password?: string;
  new_password: string;
  token?: string; // For password reset
}

export interface VerifyEmailRequest {
  token: string;
  type: 'signup' | 'recovery' | 'email_change';
}

export interface RefreshTokenRequest {
  refresh_token: string;
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
    weather_enabled?: boolean;
    deadline?: string;
    budget?: number;
    tags?: string[];
    notes?: string;
  };
  mood_before?: string;
  auto_decide?: boolean;
  image?: {
    data: string; // base64 encoded
    type: string; // mime type
    name: string;
  } | FormData;
  share_settings?: {
    is_public: boolean;
    allow_comments: boolean;
    visibility: 'public' | 'friends' | 'private';
  };
}

export interface UpdateDecisionRequest {
  selected_option?: string;
  mood_after?: string;
  feedback_rating?: number; // 1-5 scale
  feedback_notes?: string;
  tags?: string[];
  notes?: string;
  completion_status?: 'pending' | 'completed' | 'skipped' | 'expired';
  share_settings?: {
    is_public: boolean;
    allow_comments: boolean;
    visibility: 'public' | 'friends' | 'private';
  };
}

export interface GetDecisionsQuery {
  page?: number;
  limit?: number;
  category?: DecisionCategory | DecisionCategory[];
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
  search?: string;
  sort_by?: 'created_at' | 'confidence_score' | 'feedback_rating' | 'urgency' | 'importance';
  sort_order?: 'asc' | 'desc';
  completion_status?: 'pending' | 'completed' | 'skipped' | 'expired';
  has_feedback?: boolean;
  min_confidence?: number;
  max_confidence?: number;
  tags?: string[];
  auto_decided?: boolean;
  include_images?: boolean;
}

export interface DecisionResponse extends Decision {
  ai_reasoning?: string;
  similar_decisions?: Array<{
    id: string;
    prompt: string;
    category: DecisionCategory;
    similarity_score: number;
  }>;
  insights?: {
    category_average_confidence: number;
    user_satisfaction_rate: number;
    popular_choice?: string;
    decision_time_ms?: number;
  };
}

// Mood API types
export interface CreateMoodRequest {
  text_input?: string;
  mood_score?: number; // 1-10 scale
  context?: {
    activity?: string;
    location?: string;
    energy_level?: number; // 1-10 scale
    stress_level?: number; // 1-10 scale
    sleep_quality?: number; // 1-10 scale
    social_context?: 'alone' | 'family' | 'friends' | 'colleagues' | 'strangers';
    weather_impact?: boolean;
    tags?: string[];
    notes?: string;
  };
  decision_id?: string;
  is_private?: boolean;
}

export interface UpdateMoodRequest {
  mood_score?: number;
  text_input?: string;
  context?: CreateMoodRequest['context'];
  notes?: string;
  tags?: string[];
}

export interface GetMoodsQuery {
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  sentiment?: MoodSentiment | MoodSentiment[];
  min_score?: number;
  max_score?: number;
  has_text?: boolean;
  has_context?: boolean;
  tags?: string[];
  decision_linked?: boolean;
}

export interface MoodResponse extends Mood {
  insights?: {
    mood_trend: 'improving' | 'declining' | 'stable';
    average_for_period: number;
    compared_to_last_period: {
      change: number;
      percentage: number;
      direction: 'up' | 'down' | 'same';
    };
    patterns?: Array<{
      pattern: string;
      frequency: number;
      correlation: number;
    }>;
  };
}

export interface MoodTrendsResponse {
  period: 'week' | 'month' | 'quarter' | 'year';
  daily_averages: Array<{
    date: string;
    avg_score: number;
    mood_count: number;
    sentiment_distribution: {
      positive: number;
      negative: number;
      neutral: number;
    };
  }>;
  weekly_averages?: Array<{
    week_start: string;
    week_end: string;
    avg_score: number;
    mood_count: number;
    trend: 'improving' | 'declining' | 'stable';
  }>;
  monthly_averages?: Array<{
    month: string;
    year: number;
    avg_score: number;
    mood_count: number;
    highlights: string[];
  }>;
  insights: {
    overall_trend: 'improving' | 'declining' | 'stable';
    best_day_of_week: string;
    best_time_of_day: string;
    mood_decision_correlation: number;
    improvement_suggestions: string[];
    patterns: Array<{
      name: string;
      description: string;
      frequency: number;
      impact_score: number;
    }>;
  };
}

// User API types
export interface UpdateProfileRequest {
  full_name?: string;
  avatar_url?: string;
  preferences?: Partial<UserProfile['preferences']>;
  bio?: string;
  location?: string;
  timezone?: string;
  language?: string;
  privacy_settings?: {
    profile_visibility: 'public' | 'friends' | 'private';
    decision_visibility: 'public' | 'friends' | 'private';
    mood_visibility: 'public' | 'friends' | 'private';
    show_achievements: boolean;
    show_stats: boolean;
  };
}

export interface UserStatsResponse {
  stats: UserProfile['stats'];
  insights: {
    most_productive_time: string;
    decision_satisfaction_trend: 'improving' | 'declining' | 'stable';
    mood_decision_correlation: number;
    category_performance: Array<{
      category: DecisionCategory;
      count: number;
      avg_confidence: number;
      satisfaction_rate: number;
      completion_rate: number;
    }>;
    streaks: {
      current: number;
      longest: number;
      this_month: number;
      last_broken: string;
    };
    achievements: {
      total_unlocked: number;
      recent: Array<{
        id: string;
        title: string;
        unlocked_at: string;
      }>;
      progress: Array<{
        id: string;
        title: string;
        progress_percentage: number;
        estimated_completion: string;
      }>;
    };
  };
  comparisons?: {
    avg_user_stats?: Partial<UserProfile['stats']>;
    percentile_ranking?: number;
    similar_users_performance?: {
      decision_count_rank: number;
      satisfaction_rank: number;
      consistency_rank: number;
    };
  };
}

// Image API types
export interface ImageUploadRequest {
  image: {
    data: string; // base64 encoded
    type: string; // mime type
    name: string;
    size?: number;
  };
  category?: DecisionCategory;
  analysis_options?: {
    include_text: boolean;
    include_objects: boolean;
    include_colors: boolean;
    include_faces: boolean;
    quality: 'fast' | 'balanced' | 'accurate';
  };
  metadata?: {
    caption?: string;
    tags?: string[];
    location?: string;
  };
}

export interface ImageAnalysisResponse {
  image_url: string;
  thumbnail_url?: string;
  analysis: {
    labels: Array<{
      name: string;
      confidence: number;
      category?: string;
    }>;
    objects?: Array<{
      name: string;
      confidence: number;
      bounding_box: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
    text?: Array<{
      text: string;
      confidence: number;
      language?: string;
    }>;
    colors?: Array<{
      color: string;
      percentage: number;
      hex: string;
    }>;
    metadata: {
      provider: string;
      processing_time_ms: number;
      cost_estimate?: number;
      quality_score: number;
    };
  };
  suggestions?: Array<{
    option: string;
    reasoning: string;
    confidence: number;
  }>;
  similar_images?: Array<{
    url: string;
    similarity_score: number;
    decision_id?: string;
  }>;
}

// Weather API types
export interface WeatherRequest {
  latitude: number;
  longitude: number;
  units?: 'metric' | 'imperial';
  include_forecast?: boolean;
  forecast_days?: number;
}

export interface WeatherResponse {
  current: {
    temperature: number;
    feels_like: number;
    condition: string;
    description: string;
    humidity: number;
    visibility: number;
    wind_speed: number;
    wind_direction: number;
    pressure: number;
    uv_index?: number;
    icon: string;
  };
  location: {
    city: string;
    region: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  forecast?: Array<{
    date: string;
    temperature: {
      min: number;
      max: number;
    };
    condition: string;
    description: string;
    humidity: number;
    wind_speed: number;
    precipitation_chance: number;
    icon: string;
  }>;
  last_updated: string;
  metadata: {
    provider: string;
    cache_hit: boolean;
    response_time_ms: number;
  };
}

// Analytics API types
export interface TrackEventRequest {
  event_name: string;
  properties?: Record<string, any>;
  timestamp?: string;
  session_id?: string;
}

export interface AnalyticsResponse {
  event_id: string;
  processed_at: string;
  status: 'processed' | 'queued' | 'failed';
}

// Notification API types
export interface NotificationPreferencesRequest {
  categories: {
    decisions: boolean;
    moods: boolean;
    achievements: boolean;
    reminders: boolean;
    social: boolean;
    marketing: boolean;
    system: boolean;
  };
  delivery_methods: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  quiet_hours?: {
    enabled: boolean;
    start_time: string; // HH:MM format
    end_time: string; // HH:MM format
    timezone: string;
  };
  frequency: {
    daily_summary: boolean;
    weekly_report: boolean;
    monthly_insights: boolean;
  };
}

// Error response types
export interface ValidationErrorResponse {
  success: false;
  error: 'VALIDATION_ERROR';
  message: string;
  details: Array<{
    field: string;
    code: string;
    message: string;
    value?: any;
  }>;
}

export interface AuthenticationErrorResponse {
  success: false;
  error: 'AUTHENTICATION_ERROR';
  message: string;
  code: 'INVALID_CREDENTIALS' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'ACCOUNT_LOCKED' | 'EMAIL_NOT_VERIFIED';
}

export interface AuthorizationErrorResponse {
  success: false;
  error: 'AUTHORIZATION_ERROR';
  message: string;
  required_permission?: string;
  required_role?: string;
}

export interface NotFoundErrorResponse {
  success: false;
  error: 'NOT_FOUND';
  message: string;
  resource?: string;
  id?: string;
}

export interface RateLimitErrorResponse {
  success: false;
  error: 'RATE_LIMIT_EXCEEDED';
  message: string;
  retry_after?: number; // seconds
  limit?: number;
  remaining?: number;
  reset_time?: string;
}

export interface ServerErrorResponse {
  success: false;
  error: 'SERVER_ERROR';
  message: string;
  error_id?: string;
  details?: any;
}

// Health check types
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    external_apis: {
      openrouter: ServiceHealth;
      google_vision: ServiceHealth;
      weather: ServiceHealth;
      analytics: ServiceHealth;
    };
  };
  metrics?: {
    requests_per_minute: number;
    average_response_time: number;
    error_rate: number;
    active_users: number;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms?: number;
  last_check: string;
  error_message?: string;
}

// Utility types for API
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiRequestConfig {
  method: ApiMethod;
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export type ApiErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: any;
  status?: number;
  timestamp: string;
}

// Webhook types
export interface WebhookPayload<T = any> {
  id: string;
  event: string;
  created_at: string;
  data: T;
  user_id?: string;
  signature?: string;
}

export type WebhookEvent = 
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'decision.created'
  | 'decision.updated'
  | 'decision.completed'
  | 'mood.created'
  | 'mood.updated'
  | 'achievement.unlocked'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled';