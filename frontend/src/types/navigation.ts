import { NavigationProp, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DecisionCategory } from '@lifelens/shared-types';

// Root navigation stack parameter list
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Decision: {
    decisionId?: string;
    category?: DecisionCategory;
    prompt?: string;
    options?: string[];
  };
  DecisionPhoto: {
    decisionId?: string;
    category?: DecisionCategory;
  };
  MoodTracker: {
    fromDecision?: boolean;
    decisionId?: string;
  };
  Profile: undefined;
  Settings: undefined;
  History: {
    category?: DecisionCategory;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
  };
  AITest: undefined;
  OnboardingFlow: undefined;
  Tutorial: {
    screen?: string;
  };
};

// Main tab navigation parameter list
export type MainTabParamList = {
  Home: undefined;
  Decisions: undefined;
  Mood: undefined;
  History: undefined;
  Profile: undefined;
};

// Auth stack parameter list
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: {
    token: string;
  };
  VerifyEmail: {
    email: string;
  };
};

// Decision stack parameter list
export type DecisionStackParamList = {
  DecisionHome: undefined;
  DecisionCreate: {
    category?: DecisionCategory;
    prompt?: string;
    options?: string[];
  };
  DecisionSnap: {
    category?: DecisionCategory;
  };
  DecisionSnapPhoto: {
    category?: DecisionCategory;
    imageUri?: string;
  };
  DecisionResult: {
    decisionId: string;
  };
  DecisionHistory: {
    category?: DecisionCategory;
  };
  DecisionFeedback: {
    decisionId: string;
  };
};

// Profile stack parameter list
export type ProfileStackParamList = {
  ProfileHome: undefined;
  ProfileEdit: undefined;
  Settings: undefined;
  SettingsNotifications: undefined;
  SettingsPrivacy: undefined;
  SettingsAccount: undefined;
  SettingsAbout: undefined;
  Achievement: {
    achievementId: string;
  };
  DataExport: undefined;
  DeleteAccount: undefined;
};

// Navigation prop types for screens
export type RootStackNavigationProp<T extends keyof RootStackParamList> = StackNavigationProp<
  RootStackParamList,
  T
>;

export type MainTabNavigationProp<T extends keyof MainTabParamList> = BottomTabNavigationProp<
  MainTabParamList,
  T
>;

export type AuthStackNavigationProp<T extends keyof AuthStackParamList> = StackNavigationProp<
  AuthStackParamList,
  T
>;

export type DecisionStackNavigationProp<T extends keyof DecisionStackParamList> = StackNavigationProp<
  DecisionStackParamList,
  T
>;

export type ProfileStackNavigationProp<T extends keyof ProfileStackParamList> = StackNavigationProp<
  ProfileStackParamList,
  T
>;

// Route prop types for screens
export type RootStackRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;

export type MainTabRouteProp<T extends keyof MainTabParamList> = RouteProp<MainTabParamList, T>;

export type AuthStackRouteProp<T extends keyof AuthStackParamList> = RouteProp<
  AuthStackParamList,
  T
>;

export type DecisionStackRouteProp<T extends keyof DecisionStackParamList> = RouteProp<
  DecisionStackParamList,
  T
>;

export type ProfileStackRouteProp<T extends keyof ProfileStackParamList> = RouteProp<
  ProfileStackParamList,
  T
>;

// Combined navigation and route props for easier use in components
export interface ScreenProps<
  Navigation extends NavigationProp<any>,
  Route extends RouteProp<any, any>
> {
  navigation: Navigation;
  route: Route;
}

// Screen component type helpers
export type HomeScreenProps = ScreenProps<
  MainTabNavigationProp<'Home'>,
  MainTabRouteProp<'Home'>
>;

export type DecisionScreenProps = ScreenProps<
  RootStackNavigationProp<'Decision'>,
  RootStackRouteProp<'Decision'>
>;

export type DecisionPhotoScreenProps = ScreenProps<
  RootStackNavigationProp<'DecisionPhoto'>,
  RootStackRouteProp<'DecisionPhoto'>
>;

export type MoodTrackerScreenProps = ScreenProps<
  RootStackNavigationProp<'MoodTracker'>,
  RootStackRouteProp<'MoodTracker'>
>;

export type ProfileScreenProps = ScreenProps<
  MainTabNavigationProp<'Profile'>,
  MainTabRouteProp<'Profile'>
>;

export type HistoryScreenProps = ScreenProps<
  RootStackNavigationProp<'History'>,
  RootStackRouteProp<'History'>
>;

export type AuthScreenProps = ScreenProps<
  AuthStackNavigationProp<'Login'>,
  AuthStackRouteProp<'Login'>
>;

// Navigation state types
export interface NavigationState {
  index: number;
  routes: Array<{
    key: string;
    name: string;
    params?: any;
  }>;
  routeNames: string[];
  history?: any[];
  type: string;
  stale: boolean;
}

// Deep linking types
export interface LinkingConfig {
  prefixes: string[];
  config: {
    screens: Record<string, string | { path: string; parse?: any; stringify?: any }>;
  };
}

// Navigation options
export interface ScreenOptions {
  title?: string;
  headerShown?: boolean;
  headerTitle?: string;
  headerStyle?: object;
  headerTitleStyle?: object;
  headerTintColor?: string;
  headerBackTitle?: string;
  headerLeft?: () => React.ReactNode;
  headerRight?: () => React.ReactNode;
  gestureEnabled?: boolean;
  cardStyle?: object;
  animationTypeForReplace?: 'push' | 'pop';
  presentation?: 'card' | 'modal' | 'transparentModal';
  orientation?: 'default' | 'all' | 'portrait' | 'portrait_up' | 'portrait_down' | 'landscape' | 'landscape_left' | 'landscape_right';
}

// Tab bar options
export interface TabBarOptions {
  tabBarActiveTintColor?: string;
  tabBarInactiveTintColor?: string;
  tabBarShowLabel?: boolean;
  tabBarLabel?: string;
  tabBarIcon?: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => React.ReactNode;
  tabBarBadge?: string | number;
  tabBarBadgeStyle?: object;
  tabBarButton?: (props: any) => React.ReactNode;
  tabBarAccessibilityLabel?: string;
  tabBarTestID?: string;
}

// Navigation context
export interface NavigationContextValue {
  currentRoute: string;
  previousRoute?: string;
  isNavigating: boolean;
  canGoBack: boolean;
  navigate: (name: string, params?: any) => void;
  goBack: () => void;
  reset: (state: any) => void;
}

// Route change event
export interface RouteChangeEvent {
  route: {
    name: string;
    key: string;
    params?: any;
  };
  previousRoute?: {
    name: string;
    key: string;
    params?: any;
  };
  timestamp: number;
}