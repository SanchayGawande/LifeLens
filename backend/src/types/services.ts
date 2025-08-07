// Service layer types

import { DecisionCategory, ImageAnalysisResult } from './database';

// OpenRouter AI Service types
export interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeout: number;
  maxRetries: number;
}

export interface AIPromptRequest {
  prompt: string;
  options: string[];
  category: DecisionCategory;
  context?: {
    mood?: string;
    weather?: any;
    time_of_day?: string;
    urgency?: string;
    importance?: string;
  };
  max_tokens?: number;
  temperature?: number;
}

export interface AIResponse {
  recommendation: string;
  confidence_score: number;
  reasoning: string;
  model_used: string;
  processing_time_ms: number;
  cost_estimate?: number;
}

// Vision Service types
export interface VisionServiceConfig {
  provider: 'google' | 'openrouter' | 'replicate';
  apiKey: string;
  projectId?: string;
  model?: string;
  timeout: number;
  confidence_threshold: number;
}

export interface VisionAnalysisRequest {
  image_buffer: Buffer;
  image_type: string;
  category?: DecisionCategory;
  features?: {
    labels: boolean;
    objects: boolean;
    text: boolean;
    colors: boolean;
    faces: boolean;
  };
  max_results?: number;
}

export interface VisionAnalysisResponse {
  analysis: ImageAnalysisResult;
  cost_estimate?: number;
  quota_remaining?: number;
}

// Enhanced Image Service types
export interface EnhancedImageConfig {
  primary_provider: 'google' | 'openrouter' | 'replicate';
  fallback_providers: Array<'google' | 'openrouter' | 'replicate' | 'basic'>;
  cost_optimization: boolean;
  quality_threshold: number;
  timeout_ms: number;
}

export interface ImageProcessingResult {
  analysis: ImageAnalysisResult;
  provider_used: string;
  fallback_attempts: number;
  total_cost: number;
  quality_score: number;
  processing_time_ms: number;
}

// Sentiment Analysis Service types
export interface SentimentConfig {
  serviceUrl: string;
  model: string;
  confidence_threshold: number;
  timeout: number;
  batch_size: number;
}

export interface SentimentRequest {
  text: string;
  context?: {
    previous_sentiment?: string;
    user_mood_history?: Array<{
      sentiment: string;
      confidence: number;
      timestamp: string;
    }>;
  };
}

export interface SentimentResponse {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  mood_score: number;
  emotions?: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  processing_time_ms: number;
}

// Weather Service types
export interface WeatherConfig {
  apiKey: string;
  baseUrl: string;
  units: 'metric' | 'imperial';
  cache_duration: number;
}

export interface WeatherLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export interface WeatherData {
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
  city: string;
  country: string;
  timestamp: string;
  icon: string;
  sunrise?: string;
  sunset?: string;
}

// Cache Service types
export interface CacheConfig {
  redis_url: string;
  default_ttl: number;
  prefix: string;
  max_memory_policy: string;
}

export interface CacheItem<T> {
  key: string;
  value: T;
  ttl?: number;
  tags?: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  hit_rate: number;
  total_keys: number;
  memory_usage: number;
  uptime: number;
}

// Usage Tracking Service types
export interface UsageMetrics {
  user_id: string;
  api_calls: {
    total: number;
    by_endpoint: Record<string, number>;
    by_date: Record<string, number>;
  };
  ai_requests: {
    total: number;
    by_model: Record<string, number>;
    total_tokens: number;
    total_cost: number;
  };
  image_analysis: {
    total: number;
    by_provider: Record<string, number>;
    total_cost: number;
  };
  data_transfer: {
    upload_bytes: number;
    download_bytes: number;
  };
  period_start: string;
  period_end: string;
}

export interface UsageLimit {
  user_id: string;
  api_calls_per_hour: number;
  ai_requests_per_day: number;
  image_analyses_per_day: number;
  max_upload_size_mb: number;
  max_storage_mb: number;
}

// Photo Service types
export interface PhotoUploadConfig {
  max_size_mb: number;
  allowed_types: string[];
  storage_provider: 'supabase' | 'cloudinary' | 'aws-s3';
  compression_quality: number;
  thumbnail_sizes: number[];
}

export interface PhotoUploadRequest {
  file: Express.Multer.File;
  category?: DecisionCategory;
  compress?: boolean;
  generate_thumbnails?: boolean;
  extract_metadata?: boolean;
}

export interface PhotoUploadResult {
  url: string;
  thumbnail_urls?: string[];
  file_size: number;
  dimensions: {
    width: number;
    height: number;
  };
  format: string;
  metadata?: {
    exif?: any;
    location?: {
      latitude: number;
      longitude: number;
    };
    timestamp?: string;
  };
  processing_time_ms: number;
}

// Smart Cache Service types
export interface SmartCacheConfig {
  cache_layers: Array<'memory' | 'redis' | 'database'>;
  ttl_strategies: {
    ai_responses: number;
    image_analysis: number;
    weather_data: number;
    user_stats: number;
  };
  invalidation_rules: {
    pattern_matching: boolean;
    tag_based: boolean;
    time_based: boolean;
  };
  compression: boolean;
  encryption: boolean;
}

export interface CacheInvalidationEvent {
  type: 'user_action' | 'data_update' | 'time_based' | 'manual';
  patterns: string[];
  tags: string[];
  user_id?: string;
  timestamp: string;
}

// Service health and monitoring types
export interface ServiceHealth {
  service_name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms: number;
  error_rate: number;
  last_check: string;
  dependencies: Array<{
    name: string;
    status: 'available' | 'unavailable';
    response_time_ms?: number;
  }>;
}

export interface ServiceMetrics {
  service_name: string;
  requests_per_minute: number;
  average_response_time: number;
  error_rate: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: {
    in_mbps: number;
    out_mbps: number;
  };
  timestamp: string;
}