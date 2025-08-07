// Shared data models across frontend and backend

// Base model interface
export interface BaseModel {
  id: string;
  created_at: string;
  updated_at: string;
}

// User and Profile models
export interface UserProfile extends BaseModel {
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferences: UserPreferences;
  stats: UserStats;
  subscription?: UserSubscription;
  status: UserStatus;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  auto_decision_enabled: boolean;
  mood_tracking_enabled: boolean;
  weather_integration_enabled: boolean;
  language: string;
  timezone: string;
  privacy_level: 'public' | 'friends' | 'private';
  data_retention_days: number;
  ai_model_preference?: string;
}

export interface UserStats {
  total_decisions: number;
  decisions_this_week: number;
  decisions_this_month: number;
  avg_mood_score: number;
  mood_trend: 'improving' | 'declining' | 'stable';
  current_streak: number;
  longest_streak: number;
  favorite_categories: Array<{
    category: DecisionCategory;
    count: number;
    percentage: number;
  }>;
  satisfaction_rate: number;
  last_activity: string;
}

export interface UserSubscription {
  plan: 'free' | 'premium' | 'pro';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  features: string[];
  limits: {
    decisions_per_month: number;
    ai_requests_per_month: number;
    image_analyses_per_month: number;
    storage_mb: number;
  };
}

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned' | 'pending_verification';

// Decision models
export interface Decision extends BaseModel {
  user_id: string;
  prompt: string;
  options: string[];
  ai_recommendation: string;
  selected_option?: string;
  confidence_score: number;
  category: DecisionCategory;
  mood_before?: string;
  mood_after?: string;
  context: DecisionContext;
  auto_decided: boolean;
  feedback_rating?: number;
  feedback_notes?: string;
  tags: string[];
  image_url?: string;
  image_analysis?: ImageAnalysisResult;
  completion_status: 'pending' | 'completed' | 'skipped' | 'expired';
  urgency: 'low' | 'medium' | 'high';
  importance: 'low' | 'medium' | 'high';
  expires_at?: string;
}

export interface DecisionContext {
  weather?: WeatherContext;
  time_of_day: string;
  day_of_week: string;
  location?: LocationContext;
  device_context?: DeviceContext;
  session_context?: SessionContext;
}

export interface WeatherContext {
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  wind_speed: number;
  visibility: string;
  city: string;
  country: string;
  timestamp: string;
  icon: string;
}

export interface LocationContext {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  accuracy?: number;
}

export interface DeviceContext {
  platform: 'ios' | 'android' | 'web';
  version: string;
  screen_size: {
    width: number;
    height: number;
  };
  connection_type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
}

export interface SessionContext {
  session_id: string;
  duration_ms: number;
  decisions_in_session: number;
  user_engagement: 'high' | 'medium' | 'low';
}

// Mood models
export interface Mood extends BaseModel {
  user_id: string;
  mood_score: number;
  sentiment: MoodSentiment;
  confidence: number;
  text_input?: string;
  context: MoodContext;
  decision_id?: string;
  tags: string[];
  notes?: string;
}

export interface MoodContext {
  activity?: string;
  location?: string;
  weather?: string;
  energy_level?: number;
  stress_level?: number;
  sleep_quality?: number;
  social_context?: 'alone' | 'family' | 'friends' | 'colleagues' | 'strangers';
  triggers?: string[];
}

// Achievement models
export interface Achievement extends BaseModel {
  user_id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  badge_color: string;
  criteria: AchievementCriteria;
  progress: AchievementProgress;
  unlocked_at?: string;
  is_public: boolean;
  category: 'decisions' | 'mood' | 'streak' | 'engagement' | 'quality';
}

export interface AchievementCriteria {
  metric: string;
  target_value: number;
  time_period?: string;
  conditions?: Record<string, any>;
}

export interface AchievementProgress {
  current_value: number;
  percentage: number;
  is_completed: boolean;
  milestones?: Array<{
    value: number;
    reached_at?: string;
  }>;
}

// Image Analysis models
export interface ImageAnalysisResult {
  labels: string[];
  confidence_scores: number[];
  dominant_colors?: string[];
  objects_detected: Array<{
    name: string;
    confidence: number;
    bounding_box?: BoundingBox;
  }>;
  text_detected?: string[];
  categories: string[];
  analysis_provider: 'google' | 'openrouter' | 'replicate' | 'basic';
  processing_time_ms: number;
  cost_estimate?: number;
  quality_score: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// AI Response models
export interface AIResponse {
  recommendation: string;
  confidence_score: number;
  reasoning: string;
  alternatives?: string[];
  model_used: string;
  processing_time_ms: number;
  cost_estimate?: number;
  metadata: {
    tokens_used: number;
    temperature: number;
    max_tokens: number;
  };
}

// Notification models
export interface Notification extends BaseModel {
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  category: 'decision' | 'mood' | 'achievement' | 'reminder' | 'system';
  data?: Record<string, any>;
  read: boolean;
  read_at?: string;
  action_url?: string;
  expires_at?: string;
  scheduled_for?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// Analytics models
export interface AnalyticsEvent {
  id: string;
  user_id?: string;
  anonymous_id?: string;
  event_name: string;
  properties: Record<string, any>;
  timestamp: string;
  session_id?: string;
  device_context: DeviceContext;
  location_context?: LocationContext;
}

export interface UserSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  page_views: number;
  events_count: number;
  device_context: DeviceContext;
  location_context?: LocationContext;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

// Error and Logging models
export interface ErrorLog {
  id: string;
  user_id?: string;
  error_type: 'javascript' | 'api' | 'network' | 'validation' | 'auth' | 'external';
  error_message: string;
  stack_trace?: string;
  request_url?: string;
  request_method?: string;
  response_status?: number;
  device_context?: DeviceContext;
  user_agent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolved_at?: string;
}

// Feature Flag models
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout_percentage: number;
  user_segments?: string[];
  conditions?: Record<string, any>;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

// Utility types
export type ID = string;
export type Timestamp = string;
export type Email = string;
export type URL = string;

// Enums as types for better TypeScript support
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
  | 'relationships'
  | 'lifestyle'
  | 'other';

export type MoodSentiment = 'positive' | 'negative' | 'neutral';

export type AchievementType = 
  | 'first_decision'
  | 'streak_milestone'
  | 'category_expert'
  | 'mood_tracker'
  | 'satisfaction_master'
  | 'early_adopter'
  | 'social_butterfly'
  | 'data_driven'
  | 'consistency_king'
  | 'improvement_seeker';

export type NotificationType = 
  | 'decision_reminder'
  | 'mood_check'
  | 'achievement_unlocked'
  | 'streak_milestone'
  | 'weekly_summary'
  | 'app_update'
  | 'security_alert'
  | 'promotional'
  | 'system_maintenance';

// Generic utility types
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Required<T> = {
  [P in keyof T]-?: T[P];
};

export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

export type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

export type Record<K extends keyof any, T> = {
  [P in K]: T;
};

// API response wrapper types
export type ApiResult<T> = {
  success: true;
  data: T;
  message?: string;
} | {
  success: false;
  error: string;
  message?: string;
  details?: any;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
};

// Search and filter types
export interface SearchFilters {
  query?: string;
  categories?: DecisionCategory[];
  date_range?: {
    start_date: string;
    end_date: string;
  };
  sentiment?: MoodSentiment;
  rating_range?: {
    min: number;
    max: number;
  };
  tags?: string[];
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryOptions {
  filters?: SearchFilters;
  sort?: SortOptions;
  pagination?: {
    page: number;
    limit: number;
  };
  include_related?: boolean;
}