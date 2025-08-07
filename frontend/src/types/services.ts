// Frontend service types

import { DecisionCategory, MoodSentiment } from '@lifelens/shared-types';

// API Service Types
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
}

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
  };
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

// Auth Service Types
export interface AuthService {
  signIn: (email: string, password: string) => Promise<ApiResponse>;
  signUp: (email: string, password: string, fullName?: string) => Promise<ApiResponse>;
  signOut: () => Promise<ApiResponse>;
  refreshToken: () => Promise<ApiResponse>;
  resetPassword: (email: string) => Promise<ApiResponse>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<ApiResponse>;
  verifyEmail: (token: string) => Promise<ApiResponse>;
  getCurrentUser: () => Promise<ApiResponse>;
  updateProfile: (updates: any) => Promise<ApiResponse>;
}

// Decision Service Types
export interface DecisionService {
  getDecisions: (params?: {
    page?: number;
    limit?: number;
    category?: DecisionCategory;
    search?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => Promise<ApiResponse>;
  createDecision: (data: {
    prompt: string;
    options: string[];
    category: DecisionCategory;
    context?: any;
    autoDecide?: boolean;
    image?: any;
  }) => Promise<ApiResponse>;
  getDecision: (id: string) => Promise<ApiResponse>;
  updateDecision: (id: string, updates: any) => Promise<ApiResponse>;
  deleteDecision: (id: string) => Promise<ApiResponse>;
  addFeedback: (id: string, rating: number, notes?: string) => Promise<ApiResponse>;
  selectOption: (id: string, option: string, moodAfter?: string) => Promise<ApiResponse>;
}

// Mood Service Types
export interface MoodService {
  getMoods: (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    sentiment?: MoodSentiment;
    minScore?: number;
    maxScore?: number;
  }) => Promise<ApiResponse>;
  createMood: (data: {
    textInput?: string;
    moodScore?: number;
    context?: any;
    decisionId?: string;
  }) => Promise<ApiResponse>;
  getMood: (id: string) => Promise<ApiResponse>;
  updateMood: (id: string, updates: any) => Promise<ApiResponse>;
  deleteMood: (id: string) => Promise<ApiResponse>;
  getMoodTrends: (period?: 'week' | 'month' | 'year') => Promise<ApiResponse>;
}

// User Service Types
export interface UserService {
  getProfile: () => Promise<ApiResponse>;
  updateProfile: (updates: any) => Promise<ApiResponse>;
  getStats: () => Promise<ApiResponse>;
  getAchievements: () => Promise<ApiResponse>;
  exportData: () => Promise<ApiResponse>;
  deleteAccount: () => Promise<ApiResponse>;
}

// Image Service Types
export interface ImageService {
  uploadImage: (image: any, category?: DecisionCategory) => Promise<ApiResponse>;
  analyzeImage: (image: any, category?: DecisionCategory) => Promise<ApiResponse>;
  deleteImage: (imageId: string) => Promise<ApiResponse>;
}

// Weather Service Types
export interface WeatherService {
  getCurrentWeather: (latitude: number, longitude: number) => Promise<ApiResponse>;
  getForecast: (latitude: number, longitude: number, days?: number) => Promise<ApiResponse>;
}

// Cache Service Types
export interface CacheService {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => Promise<string[]>;
  size: () => Promise<number>;
}

export interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  storage: 'memory' | 'storage' | 'secure';
  encrypt: boolean;
}

// Storage Service Types
export interface StorageService {
  getItem: <T>(key: string) => Promise<T | null>;
  setItem: <T>(key: string, value: T) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  getAllKeys: () => Promise<string[]>;
  multiGet: (keys: string[]) => Promise<Array<[string, any]>>;
  multiSet: (keyValuePairs: Array<[string, any]>) => Promise<void>;
  multiRemove: (keys: string[]) => Promise<void>;
}

// Analytics Service Types
export interface AnalyticsService {
  track: (event: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  screen: (name: string, properties?: Record<string, any>) => void;
  group: (groupId: string, traits?: Record<string, any>) => void;
  alias: (userId: string) => void;
  reset: () => void;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  anonymousId?: string;
}

// Notification Service Types
export interface NotificationService {
  requestPermission: () => Promise<boolean>;
  getPermissionStatus: () => Promise<'granted' | 'denied' | 'undetermined'>;
  scheduleNotification: (notification: LocalNotification) => Promise<string>;
  cancelNotification: (id: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  getPendingNotifications: () => Promise<LocalNotification[]>;
  onNotificationReceived: (callback: (notification: any) => void) => () => void;
  onNotificationPressed: (callback: (notification: any) => void) => () => void;
}

export interface LocalNotification {
  id?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  trigger?: {
    type: 'time' | 'calendar' | 'location';
    seconds?: number;
    date?: Date;
    repeats?: boolean;
    repeatInterval?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
  };
  sound?: string;
  badge?: number;
  categoryId?: string;
}

// Geolocation Service Types
export interface LocationService {
  getCurrentPosition: (options?: LocationOptions) => Promise<LocationResult>;
  watchPosition: (
    callback: (position: LocationResult) => void,
    errorCallback?: (error: LocationError) => void,
    options?: LocationOptions
  ) => Promise<{ remove: () => void }>;
  requestPermission: () => Promise<LocationPermission>;
  getPermissionStatus: () => Promise<LocationPermission>;
}

export interface LocationOptions {
  accuracy?: 'lowest' | 'low' | 'balanced' | 'high' | 'highest';
  timeout?: number;
  maximumAge?: number;
  distanceFilter?: number;
}

export interface LocationResult {
  coords: {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
  };
  timestamp: number;
}

export interface LocationError {
  code: number;
  message: string;
}

export type LocationPermission = 'granted' | 'denied' | 'undetermined' | 'restricted';

// Biometric Service Types
export interface BiometricService {
  isAvailable: () => Promise<boolean>;
  getSupportedTypes: () => Promise<BiometricType[]>;
  authenticate: (options?: BiometricOptions) => Promise<BiometricResult>;
}

export type BiometricType = 'TouchID' | 'FaceID' | 'Fingerprint' | 'FaceRecognition' | 'Iris';

export interface BiometricOptions {
  promptMessage?: string;
  cancelButtonText?: string;
  fallbackPromptMessage?: string;
  disableDeviceFallback?: boolean;
}

export interface BiometricResult {
  success: boolean;
  error?: string;
  warning?: string;
}

// Haptic Service Types
export interface HapticService {
  impact: (style: 'light' | 'medium' | 'heavy') => void;
  notification: (type: 'success' | 'warning' | 'error') => void;
  selection: () => void;
}

// Deep Linking Service Types
export interface DeepLinkService {
  getInitialURL: () => Promise<string | null>;
  addEventListener: (callback: (url: string) => void) => () => void;
  canOpenURL: (url: string) => Promise<boolean>;
  openURL: (url: string) => Promise<void>;
  createURL: (path: string, params?: Record<string, any>) => string;
}

// Share Service Types
export interface ShareService {
  share: (content: ShareContent, options?: ShareOptions) => Promise<ShareResult>;
  isAvailable: () => boolean;
}

export interface ShareContent {
  title?: string;
  message?: string;
  url?: string;
  data?: any;
}

export interface ShareOptions {
  dialogTitle?: string;
  excludedActivityTypes?: string[];
  tintColor?: string;
  subject?: string;
}

export interface ShareResult {
  action: 'sharedAction' | 'dismissedAction';
  activityType?: string;
}

// Network Service Types
export interface NetworkService {
  getNetworkState: () => Promise<NetworkState>;
  addEventListener: (callback: (state: NetworkState) => void) => () => void;
}

export interface NetworkState {
  isConnected: boolean;
  type: 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'vpn' | 'other' | 'none' | 'unknown';
  isInternetReachable: boolean;
  details?: {
    strength?: number;
    frequency?: number;
    ipAddress?: string;
    subnet?: string;
    ssid?: string;
  };
}

// App State Service Types
export interface AppStateService {
  getCurrentState: () => 'active' | 'background' | 'inactive' | 'unknown';
  addEventListener: (callback: (state: string) => void) => () => void;
}

// Keyboard Service Types
export interface KeyboardService {
  addKeyboardShowListener: (callback: (event: KeyboardEvent) => void) => () => void;
  addKeyboardHideListener: (callback: (event: KeyboardEvent) => void) => () => void;
  dismiss: () => void;
}

export interface KeyboardEvent {
  startCoordinates?: {
    width: number;
    height: number;
    screenX: number;
    screenY: number;
  };
  endCoordinates: {
    width: number;
    height: number;
    screenX: number;
    screenY: number;
  };
  duration?: number;
  easing?: 'easeIn' | 'easeInEaseOut' | 'easeOut' | 'linear' | 'keyboard';
}

// Service registry types
export interface ServiceRegistry {
  auth: AuthService;
  decisions: DecisionService;
  moods: MoodService;
  users: UserService;
  images: ImageService;
  weather: WeatherService;
  cache: CacheService;
  storage: StorageService;
  analytics: AnalyticsService;
  notifications: NotificationService;
  location: LocationService;
  biometric: BiometricService;
  haptic: HapticService;
  deepLink: DeepLinkService;
  share: ShareService;
  network: NetworkService;
  appState: AppStateService;
  keyboard: KeyboardService;
}

// Service factory types
export type ServiceFactory<T> = (config?: any) => T;
export type ServiceFactoryRegistry = {
  [K in keyof ServiceRegistry]: ServiceFactory<ServiceRegistry[K]>;
};