// Shared constants across the application

import { DecisionCategory, AchievementType, NotificationType } from './enums';

// Application constants
export const APP_CONFIG = {
  NAME: 'LifeLens',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-powered daily decision assistant',
  WEBSITE: 'https://lifelens.app',
  SUPPORT_EMAIL: 'support@lifelens.app',
  PRIVACY_URL: 'https://lifelens.app/privacy',
  TERMS_URL: 'https://lifelens.app/terms',
} as const;

// API Configuration
export const API_CONFIG = {
  VERSION: 'v1',
  TIMEOUT: 30000, // 30 seconds
  RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
} as const;

// Authentication constants
export const AUTH_CONFIG = {
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// Decision constants
export const DECISION_CONFIG = {
  MAX_OPTIONS: 10,
  MIN_OPTIONS: 2,
  MAX_PROMPT_LENGTH: 500,
  MAX_OPTION_LENGTH: 100,
  CONFIDENCE_THRESHOLD: 0.7,
  AUTO_EXPIRE_HOURS: 24,
  MAX_TAGS: 10,
  MAX_TAG_LENGTH: 30,
} as const;

// Mood constants
export const MOOD_CONFIG = {
  MIN_SCORE: 1,
  MAX_SCORE: 10,
  CONFIDENCE_THRESHOLD: 0.6,
  MAX_TEXT_LENGTH: 1000,
  STREAK_MIN_DAYS: 3,
  REMINDER_INTERVALS: [1, 3, 7, 14], // hours
} as const;

// Image processing constants
export const IMAGE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  THUMBNAIL_SIZES: [150, 300, 600] as const,
  COMPRESSION_QUALITY: 0.8,
  MAX_DIMENSIONS: {
    width: 2048,
    height: 2048,
  },
  ANALYSIS_TIMEOUT: 30000, // 30 seconds
} as const;

// Rate limiting constants
export const RATE_LIMITS = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_ATTEMPTS: 5,
    BLOCK_DURATION: 30 * 60 * 1000, // 30 minutes
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  AI: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 50,
  },
  IMAGE_ANALYSIS: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 20,
  },
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  TTL: {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 30 * 60, // 30 minutes
    LONG: 2 * 60 * 60, // 2 hours
    VERY_LONG: 24 * 60 * 60, // 24 hours
  },
  KEYS: {
    USER_PROFILE: 'user:profile',
    USER_STATS: 'user:stats',
    DECISIONS: 'user:decisions',
    MOODS: 'user:moods',
    WEATHER: 'weather',
    AI_RESPONSE: 'ai:response',
    IMAGE_ANALYSIS: 'image:analysis',
  },
} as const;

// Notification settings
export const NOTIFICATION_CONFIG = {
  DEFAULTS: {
    [NotificationType.DECISION_REMINDER]: true,
    [NotificationType.MOOD_CHECK]: true,
    [NotificationType.ACHIEVEMENT_UNLOCKED]: true,
    [NotificationType.STREAK_MILESTONE]: true,
    [NotificationType.WEEKLY_SUMMARY]: true,
    [NotificationType.APP_UPDATE]: false,
    [NotificationType.SECURITY_ALERT]: true,
    [NotificationType.PROMOTIONAL]: false,
    [NotificationType.SYSTEM_MAINTENANCE]: true,
  },
  QUIET_HOURS: {
    DEFAULT_START: '22:00',
    DEFAULT_END: '08:00',
  },
  BATCH_SIZE: 50,
  RETRY_ATTEMPTS: 3,
} as const;

// Achievement configuration
export const ACHIEVEMENT_CONFIG = {
  TYPES: {
    [AchievementType.FIRST_DECISION]: {
      title: 'Decision Maker',
      description: 'Made your first decision',
      icon: '🎯',
      points: 10,
    },
    [AchievementType.STREAK_MILESTONE]: {
      title: 'Consistent Chooser',
      description: 'Maintained a decision streak',
      icon: '🔥',
      points: 50,
    },
    [AchievementType.CATEGORY_EXPERT]: {
      title: 'Category Expert',
      description: 'Made 25 decisions in a category',
      icon: '🏆',
      points: 100,
    },
    [AchievementType.MOOD_TRACKER]: {
      title: 'Mood Master',
      description: 'Tracked mood for 7 days straight',
      icon: '😊',
      points: 75,
    },
    [AchievementType.SATISFACTION_MASTER]: {
      title: 'Satisfaction Master',
      description: 'Achieved 90% satisfaction rate',
      icon: '⭐',
      points: 150,
    },
    [AchievementType.EARLY_ADOPTER]: {
      title: 'Early Adopter',
      description: 'Joined during beta period',
      icon: '🚀',
      points: 200,
    },
    [AchievementType.SOCIAL_BUTTERFLY]: {
      title: 'Social Butterfly',
      description: 'Shared 10 decisions publicly',
      icon: '🦋',
      points: 80,
    },
    [AchievementType.DATA_DRIVEN]: {
      title: 'Data Driven',
      description: 'Provided feedback on 50 decisions',
      icon: '📊',
      points: 120,
    },
    [AchievementType.CONSISTENCY_KING]: {
      title: 'Consistency King',
      description: 'Used app for 30 consecutive days',
      icon: '👑',
      points: 300,
    },
    [AchievementType.IMPROVEMENT_SEEKER]: {
      title: 'Improvement Seeker',
      description: 'Showed mood improvement over time',
      icon: '📈',
      points: 250,
    },
  },
  MILESTONES: {
    DECISIONS: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
    STREAKS: [3, 7, 14, 30, 60, 100],
    SATISFACTION: [0.7, 0.8, 0.9, 0.95],
    CATEGORIES: [1, 3, 5, 8, 10],
  },
} as const;

// Category configuration
export const CATEGORY_CONFIG = {
  [DecisionCategory.FOOD]: {
    label: 'Food & Dining',
    icon: '🍽️',
    color: '#FF6B6B',
    description: 'Meal choices, restaurants, recipes',
    keywords: ['eat', 'food', 'meal', 'restaurant', 'recipe', 'cooking'],
  },
  [DecisionCategory.CLOTHING]: {
    label: 'Fashion & Style',
    icon: '👕',
    color: '#4ECDC4',
    description: 'Outfit choices, shopping, style',
    keywords: ['wear', 'outfit', 'clothes', 'fashion', 'style', 'shopping'],
  },
  [DecisionCategory.ENTERTAINMENT]: {
    label: 'Entertainment',
    icon: '🎬',
    color: '#45B7D1',
    description: 'Movies, shows, games, activities',
    keywords: ['watch', 'movie', 'show', 'game', 'fun', 'entertainment'],
  },
  [DecisionCategory.TRAVEL]: {
    label: 'Travel & Places',
    icon: '✈️',
    color: '#96CEB4',
    description: 'Destinations, activities, planning',
    keywords: ['travel', 'trip', 'vacation', 'destination', 'visit', 'go'],
  },
  [DecisionCategory.SHOPPING]: {
    label: 'Shopping',
    icon: '🛒',
    color: '#FFEAA7',
    description: 'Purchases, products, deals',
    keywords: ['buy', 'purchase', 'shop', 'product', 'deal', 'store'],
  },
  [DecisionCategory.HEALTH]: {
    label: 'Health & Fitness',
    icon: '💪',
    color: '#FD79A8',
    description: 'Exercise, wellness, medical',
    keywords: ['health', 'fitness', 'exercise', 'gym', 'medical', 'wellness'],
  },
  [DecisionCategory.WORK]: {
    label: 'Work & Career',
    icon: '💼',
    color: '#6C5CE7',
    description: 'Job decisions, career moves',
    keywords: ['work', 'job', 'career', 'office', 'business', 'professional'],
  },
  [DecisionCategory.PERSONAL]: {
    label: 'Personal Life',
    icon: '🧘',
    color: '#A29BFE',
    description: 'Personal choices, lifestyle',
    keywords: ['personal', 'life', 'lifestyle', 'self', 'me', 'personal'],
  },
  [DecisionCategory.FINANCE]: {
    label: 'Finance & Money',
    icon: '💰',
    color: '#00B894',
    description: 'Financial decisions, investments',
    keywords: ['money', 'finance', 'invest', 'budget', 'financial', 'cost'],
  },
  [DecisionCategory.EDUCATION]: {
    label: 'Education & Learning',
    icon: '📚',
    color: '#E17055',
    description: 'Learning, courses, skills',
    keywords: ['learn', 'study', 'education', 'course', 'skill', 'knowledge'],
  },
  [DecisionCategory.RELATIONSHIPS]: {
    label: 'Relationships',
    icon: '❤️',
    color: '#E84393',
    description: 'Social, dating, family decisions',
    keywords: ['relationship', 'dating', 'social', 'friend', 'family', 'love'],
  },
  [DecisionCategory.LIFESTYLE]: {
    label: 'Lifestyle',
    icon: '🌟',
    color: '#FDCB6E',
    description: 'Habits, routines, life choices',
    keywords: ['lifestyle', 'habit', 'routine', 'choice', 'living', 'way'],
  },
  [DecisionCategory.OTHER]: {
    label: 'Other',
    icon: '❓',
    color: '#636E72',
    description: 'Miscellaneous decisions',
    keywords: ['other', 'misc', 'miscellaneous', 'various', 'different'],
  },
} as const;

// Theme configuration
export const THEME_CONFIG = {
  COLORS: {
    LIGHT: {
      PRIMARY: '#007AFF',
      SECONDARY: '#5856D6',
      SUCCESS: '#34C759',
      WARNING: '#FF9500',
      ERROR: '#FF3B30',
      BACKGROUND: '#FFFFFF',
      SURFACE: '#F2F2F7',
      TEXT: '#000000',
      TEXT_SECONDARY: '#8E8E93',
      BORDER: '#C6C6C8',
    },
    DARK: {
      PRIMARY: '#0A84FF',
      SECONDARY: '#5E5CE6',
      SUCCESS: '#30D158',
      WARNING: '#FF9F0A',
      ERROR: '#FF453A',
      BACKGROUND: '#000000',
      SURFACE: '#1C1C1E',
      TEXT: '#FFFFFF',
      TEXT_SECONDARY: '#8E8E93',
      BORDER: '#38383A',
    },
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    XXL: 48,
  },
  BORDER_RADIUS: {
    SM: 4,
    MD: 8,
    LG: 16,
    XL: 24,
    ROUND: 9999,
  },
  FONT_SIZES: {
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
    XXXL: 32,
  },
} as const;

// Animation durations
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
  VERY_SLOW: 500,
} as const;

// Screen breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
  RATE_LIMIT: 'Too many requests. Please wait before trying again.',
  TIMEOUT: 'Request timed out. Please try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  DECISION_CREATED: 'Decision created successfully!',
  MOOD_TRACKED: 'Mood tracked successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  FEEDBACK_SUBMITTED: 'Feedback submitted successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const;

// Validation rules
export const VALIDATION_RULES = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  PASSWORD_MATCH: 'Passwords do not match',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must not exceed ${max} characters`,
  POSITIVE_NUMBER: 'Must be a positive number',
  VALID_URL: 'Please enter a valid URL',
} as const;

// Date formats
export const DATE_FORMATS = {
  SHORT: 'MMM dd',
  MEDIUM: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  TIME: 'HH:mm',
  DATETIME: 'MMM dd, yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@lifelens/auth_token',
  USER_PROFILE: '@lifelens/user_profile',
  THEME: '@lifelens/theme',
  LANGUAGE: '@lifelens/language',
  ONBOARDING_COMPLETED: '@lifelens/onboarding_completed',
  NOTIFICATION_TOKEN: '@lifelens/notification_token',
  CACHE_VERSION: '@lifelens/cache_version',
} as const;

// Analytics events
export const ANALYTICS_EVENTS = {
  APP_OPENED: 'app_opened',
  DECISION_CREATED: 'decision_created',
  DECISION_COMPLETED: 'decision_completed',
  MOOD_TRACKED: 'mood_tracked',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  FEATURE_USED: 'feature_used',
  ERROR_OCCURRED: 'error_occurred',
  SCREEN_VIEWED: 'screen_viewed',
  BUTTON_CLICKED: 'button_clicked',
  SEARCH_PERFORMED: 'search_performed',
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  MOOD_TRACKING: 'mood_tracking',
  AI_SUGGESTIONS: 'ai_suggestions',
  SOCIAL_FEATURES: 'social_features',
  PREMIUM_FEATURES: 'premium_features',
  ANALYTICS: 'analytics',
  PUSH_NOTIFICATIONS: 'push_notifications',
  OFFLINE_MODE: 'offline_mode',
  BETA_FEATURES: 'beta_features',
} as const;

// Regular expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s-()]+$/,
  URL: /^https?:\/\/.+/,
  HASHTAG: /#[\w]+/g,
  MENTION: /@[\w]+/g,
  EMOJI: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
} as const;