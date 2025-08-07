// State management types for Zustand stores

import { User } from '@supabase/supabase-js';
import { Decision, Mood, UserProfile, DecisionCategory, MoodSentiment } from '@lifelens/shared-types';

// Auth Store Types
export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  lastLoginAt: string | null;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
  completeOnboarding: () => Promise<void>;
  clearAuth: () => void;
}

export interface AuthStore extends AuthState, AuthActions {}

// Decision Store Types
export interface DecisionState {
  decisions: Decision[];
  currentDecision: Decision | null;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  filters: {
    categories: DecisionCategory[];
    dateRange: {
      startDate: Date | null;
      endDate: Date | null;
    };
    searchQuery: string;
    sortBy: 'created_at' | 'confidence_score' | 'feedback_rating';
    sortOrder: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface DecisionActions {
  fetchDecisions: (options?: {
    page?: number;
    limit?: number;
    category?: DecisionCategory;
    search?: string;
    dateRange?: { startDate: Date; endDate: Date };
  }) => Promise<void>;
  createDecision: (data: {
    prompt: string;
    options: string[];
    category: DecisionCategory;
    context?: any;
    image?: any;
  }) => Promise<Decision | null>;
  updateDecision: (id: string, updates: Partial<Decision>) => Promise<void>;
  deleteDecision: (id: string) => Promise<void>;
  setCurrentDecision: (decision: Decision | null) => void;
  addFeedback: (id: string, rating: number, notes?: string) => Promise<void>;
  selectOption: (id: string, option: string) => Promise<void>;
  setFilters: (filters: Partial<DecisionState['filters']>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearDecisions: () => void;
  refreshDecisions: () => Promise<void>;
  loadMoreDecisions: () => Promise<void>;
}

export interface DecisionStore extends DecisionState, DecisionActions {}

// Mood Store Types
export interface MoodState {
  moods: Mood[];
  currentMood: Mood | null;
  isLoading: boolean;
  isTracking: boolean;
  error: string | null;
  trends: {
    daily: Array<{ date: string; avgScore: number; count: number }>;
    weekly: Array<{ week: string; avgScore: number; count: number }>;
    monthly: Array<{ month: string; avgScore: number; count: number }>;
  };
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  streaks: {
    current: number;
    longest: number;
    lastTrackedDate: string | null;
  };
}

export interface MoodActions {
  trackMood: (data: {
    moodScore?: number;
    textInput?: string;
    context?: any;
    decisionId?: string;
  }) => Promise<Mood | null>;
  fetchMoods: (options?: {
    page?: number;
    limit?: number;
    dateRange?: { startDate: Date; endDate: Date };
    sentiment?: MoodSentiment;
  }) => Promise<void>;
  fetchMoodTrends: (period?: 'week' | 'month' | 'year') => Promise<void>;
  updateMood: (id: string, updates: Partial<Mood>) => Promise<void>;
  deleteMood: (id: string) => Promise<void>;
  setCurrentMood: (mood: Mood | null) => void;
  setLoading: (loading: boolean) => void;
  setTracking: (tracking: boolean) => void;
  setError: (error: string | null) => void;
  clearMoods: () => void;
  calculateStreaks: () => void;
}

export interface MoodStore extends MoodState, MoodActions {}

// App Store Types (Global app state)
export interface AppState {
  isInitialized: boolean;
  isOnline: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    enabled: boolean;
    types: {
      decisions: boolean;
      moods: boolean;
      achievements: boolean;
      reminders: boolean;
    };
  };
  preferences: {
    autoDecisionEnabled: boolean;
    moodTrackingEnabled: boolean;
    weatherIntegrationEnabled: boolean;
    analyticsEnabled: boolean;
  };
  cache: {
    lastSync: string | null;
    version: string;
  };
  error: {
    global: string | null;
    network: string | null;
  };
}

export interface AppActions {
  initialize: () => Promise<void>;
  setOnlineStatus: (online: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  updateNotificationSettings: (settings: Partial<AppState['notifications']>) => Promise<void>;
  updatePreferences: (preferences: Partial<AppState['preferences']>) => Promise<void>;
  setGlobalError: (error: string | null) => void;
  setNetworkError: (error: string | null) => void;
  clearErrors: () => void;
  syncData: () => Promise<void>;
  clearCache: () => Promise<void>;
  reset: () => void;
}

export interface AppStore extends AppState, AppActions {}

// Statistics Store Types
export interface StatsState {
  stats: {
    totalDecisions: number;
    decisionsThisWeek: number;
    decisionsThisMonth: number;
    avgMoodScore: number;
    moodTrend: 'improving' | 'declining' | 'stable';
    currentStreak: number;
    longestStreak: number;
    favoriteCategories: Array<{
      category: DecisionCategory;
      count: number;
      percentage: number;
    }>;
  };
  insights: {
    moodDecisionCorrelation: number;
    bestDecisionTimes: string[];
    categoryPerformance: Array<{
      category: DecisionCategory;
      satisfactionRate: number;
      averageConfidence: number;
    }>;
    improvementSuggestions: string[];
  };
  isLoading: boolean;
  lastUpdated: string | null;
  error: string | null;
}

export interface StatsActions {
  fetchStats: () => Promise<void>;
  fetchInsights: () => Promise<void>;
  refreshStats: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearStats: () => void;
}

export interface StatsStore extends StatsState, StatsActions {}

// UI Store Types (UI state management)
export interface UIState {
  activeScreen: string;
  isNavigating: boolean;
  modals: {
    [key: string]: {
      visible: boolean;
      data?: any;
    };
  };
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
    action?: {
      label: string;
      onPress: () => void;
    };
  }>;
  bottomSheet: {
    visible: boolean;
    content: React.ReactNode | null;
    snapPoints?: string[];
  };
  loading: {
    global: boolean;
    overlay: boolean;
    text?: string;
  };
}

export interface UIActions {
  setActiveScreen: (screen: string) => void;
  setNavigating: (navigating: boolean) => void;
  showModal: (modalId: string, data?: any) => void;
  hideModal: (modalId: string) => void;
  showToast: (toast: Omit<UIState['toasts'][0], 'id'>) => void;
  hideToast: (id: string) => void;
  clearToasts: () => void;
  showBottomSheet: (content: React.ReactNode, snapPoints?: string[]) => void;
  hideBottomSheet: () => void;
  showLoading: (text?: string, overlay?: boolean) => void;
  hideLoading: () => void;
  reset: () => void;
}

export interface UIStore extends UIState, UIActions {}

// Combined store type
export interface RootStore {
  auth: AuthStore;
  decisions: DecisionStore;
  moods: MoodStore;
  app: AppStore;
  stats: StatsStore;
  ui: UIStore;
}

// Store creation options
export interface StoreOptions {
  persist?: boolean;
  devtools?: boolean;
  storage?: any;
  partialize?: (state: any) => any;
  onRehydrateStorage?: () => (state?: any, error?: any) => void;
}

// Selector types
export type StoreSelector<T, R> = (state: T) => R;
export type AuthSelector<R> = StoreSelector<AuthStore, R>;
export type DecisionSelector<R> = StoreSelector<DecisionStore, R>;
export type MoodSelector<R> = StoreSelector<MoodStore, R>;
export type AppSelector<R> = StoreSelector<AppStore, R>;
export type StatsSelector<R> = StoreSelector<StatsStore, R>;
export type UISelector<R> = StoreSelector<UIStore, R>;

// Action types
export type AsyncAction<T = void, Args extends any[] = []> = (...args: Args) => Promise<T>;
export type SyncAction<T = void, Args extends any[] = []> = (...args: Args) => T;

// Middleware types
export interface StoreMiddleware<T> {
  (config: T): T;
}

export interface LoggerConfig {
  enabled: boolean;
  collapsed: boolean;
  filter: (mutation: any, stateBefore: any, stateAfter: any) => boolean;
}

export interface PersistConfig {
  name: string;
  storage: any;
  partialize?: (state: any) => any;
  version?: number;
  migrate?: (persistedState: any, version: number) => any;
}