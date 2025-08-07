// Shared enums and constants

// Decision categories
export enum DecisionCategory {
  FOOD = 'food',
  CLOTHING = 'clothing',
  ENTERTAINMENT = 'entertainment',
  TRAVEL = 'travel',
  SHOPPING = 'shopping',
  HEALTH = 'health',
  WORK = 'work',
  PERSONAL = 'personal',
  FINANCE = 'finance',
  EDUCATION = 'education',
  RELATIONSHIPS = 'relationships',
  LIFESTYLE = 'lifestyle',
  OTHER = 'other',
}

// Mood sentiments
export enum MoodSentiment {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
}

// User status
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  PENDING_VERIFICATION = 'pending_verification',
}

// Subscription plans
export enum SubscriptionPlan {
  FREE = 'free',
  PREMIUM = 'premium',
  PRO = 'pro',
}

// Subscription status
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
}

// Decision completion status
export enum DecisionCompletionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  EXPIRED = 'expired',
}

// Priority levels
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Theme options
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

// Language codes (ISO 639-1)
export enum Language {
  ENGLISH = 'en',
  SPANISH = 'es',
  FRENCH = 'fr',
  GERMAN = 'de',
  ITALIAN = 'it',
  PORTUGUESE = 'pt',
  RUSSIAN = 'ru',
  CHINESE = 'zh',
  JAPANESE = 'ja',
  KOREAN = 'ko',
}

// Privacy levels
export enum PrivacyLevel {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private',
}

// Achievement types
export enum AchievementType {
  FIRST_DECISION = 'first_decision',
  STREAK_MILESTONE = 'streak_milestone',
  CATEGORY_EXPERT = 'category_expert',
  MOOD_TRACKER = 'mood_tracker',
  SATISFACTION_MASTER = 'satisfaction_master',
  EARLY_ADOPTER = 'early_adopter',
  SOCIAL_BUTTERFLY = 'social_butterfly',
  DATA_DRIVEN = 'data_driven',
  CONSISTENCY_KING = 'consistency_king',
  IMPROVEMENT_SEEKER = 'improvement_seeker',
}

// Notification types
export enum NotificationType {
  DECISION_REMINDER = 'decision_reminder',
  MOOD_CHECK = 'mood_check',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  STREAK_MILESTONE = 'streak_milestone',
  WEEKLY_SUMMARY = 'weekly_summary',
  APP_UPDATE = 'app_update',
  SECURITY_ALERT = 'security_alert',
  PROMOTIONAL = 'promotional',
  SYSTEM_MAINTENANCE = 'system_maintenance',
}

// Image analysis providers
export enum ImageAnalysisProvider {
  GOOGLE = 'google',
  OPENROUTER = 'openrouter',
  REPLICATE = 'replicate',
  BASIC = 'basic',
}

// API error codes
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// HTTP status codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

// Time periods for analytics
export enum TimePeriod {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

// Chart types
export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  DOUGHNUT = 'doughnut',
  AREA = 'area',
  SCATTER = 'scatter',
  HISTOGRAM = 'histogram',
}

// Sort directions
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

// Connection types
export enum ConnectionType {
  WIFI = 'wifi',
  CELLULAR = 'cellular',
  ETHERNET = 'ethernet',
  BLUETOOTH = 'bluetooth',
  VPN = 'vpn',
  OTHER = 'other',
  NONE = 'none',
  UNKNOWN = 'unknown',
}

// Platform types
export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
  DESKTOP = 'desktop',
}

// Device types
export enum DeviceType {
  PHONE = 'phone',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
  WATCH = 'watch',
  TV = 'tv',
  OTHER = 'other',
}

// Social contexts
export enum SocialContext {
  ALONE = 'alone',
  FAMILY = 'family',
  FRIENDS = 'friends',
  COLLEAGUES = 'colleagues',
  STRANGERS = 'strangers',
}

// Weather conditions
export enum WeatherCondition {
  CLEAR = 'clear',
  PARTLY_CLOUDY = 'partly_cloudy',
  CLOUDY = 'cloudy',
  OVERCAST = 'overcast',
  RAIN = 'rain',
  DRIZZLE = 'drizzle',
  THUNDERSTORM = 'thunderstorm',
  SNOW = 'snow',
  SLEET = 'sleet',
  HAIL = 'hail',
  FOG = 'fog',
  MIST = 'mist',
  SMOKE = 'smoke',
  DUST = 'dust',
  SAND = 'sand',
  TORNADO = 'tornado',
  HURRICANE = 'hurricane',
}

// Time of day
export enum TimeOfDay {
  EARLY_MORNING = 'early_morning', // 5-8 AM
  MORNING = 'morning', // 8-12 PM
  AFTERNOON = 'afternoon', // 12-5 PM
  EVENING = 'evening', // 5-8 PM
  NIGHT = 'night', // 8 PM-12 AM
  LATE_NIGHT = 'late_night', // 12-5 AM
}

// Days of week
export enum DayOfWeek {
  SUNDAY = 'sunday',
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
}

// Months
export enum Month {
  JANUARY = 'january',
  FEBRUARY = 'february',
  MARCH = 'march',
  APRIL = 'april',
  MAY = 'may',
  JUNE = 'june',
  JULY = 'july',
  AUGUST = 'august',
  SEPTEMBER = 'september',
  OCTOBER = 'october',
  NOVEMBER = 'november',
  DECEMBER = 'december',
}

// Trend directions
export enum TrendDirection {
  IMPROVING = 'improving',
  DECLINING = 'declining',
  STABLE = 'stable',
  VOLATILE = 'volatile',
}

// Quality levels
export enum QualityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EXCELLENT = 'excellent',
}

// Processing states
export enum ProcessingState {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// File types
export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  ARCHIVE = 'archive',
  OTHER = 'other',
}

// Export formats
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  XLSX = 'xlsx',
}

// Webhook events
export enum WebhookEvent {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  DECISION_CREATED = 'decision.created',
  DECISION_UPDATED = 'decision.updated',
  DECISION_COMPLETED = 'decision.completed',
  MOOD_CREATED = 'mood.created',
  MOOD_UPDATED = 'mood.updated',
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
}

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Feature flag states
export enum FeatureFlagState {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  ROLLOUT = 'rollout',
  TESTING = 'testing',
}

// Cache strategies
export enum CacheStrategy {
  NO_CACHE = 'no_cache',
  CACHE_FIRST = 'cache_first',
  NETWORK_FIRST = 'network_first',
  CACHE_ONLY = 'cache_only',
  NETWORK_ONLY = 'network_only',
}