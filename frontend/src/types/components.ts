import { ReactNode } from 'react';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { DecisionCategory, MoodSentiment } from '@lifelens/shared-types';

// Base component props
export interface BaseComponentProps {
  children?: ReactNode;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// Button component types
export interface ButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

// Input component types
export interface InputProps extends BaseComponentProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  maxLength?: number;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Card component types
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  elevation?: number;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  backgroundColor?: string;
  onPress?: () => void;
  header?: ReactNode;
  footer?: ReactNode;
}

// Modal component types
export interface ModalProps extends BaseComponentProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'bottom' | 'top';
  animationType?: 'slide' | 'fade' | 'none';
  backdrop?: boolean;
  backdropOpacity?: number;
  onBackdropPress?: () => void;
  header?: ReactNode;
  footer?: ReactNode;
}

// Loading component types
export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
  overlay?: boolean;
}

// Avatar component types
export interface AvatarProps extends BaseComponentProps {
  source?: { uri: string } | number;
  size?: number;
  name?: string;
  backgroundColor?: string;
  textColor?: string;
  borderWidth?: number;
  borderColor?: string;
  onPress?: () => void;
}

// Badge component types
export interface BadgeProps extends BaseComponentProps {
  count?: number;
  text?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showZero?: boolean;
  maxCount?: number;
}

// Decision-specific component types
export interface DecisionCardProps extends BaseComponentProps {
  decision: {
    id: string;
    prompt: string;
    options: string[];
    ai_recommendation: string;
    confidence_score: number;
    category: DecisionCategory;
    created_at: string;
    selected_option?: string;
    feedback_rating?: number;
    image_url?: string;
  };
  onSelect?: (option: string) => void;
  onFeedback?: (rating: number, notes?: string) => void;
  onShare?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export interface MoodSelectorProps extends BaseComponentProps {
  value?: number;
  onChange: (mood: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showValue?: boolean;
  disabled?: boolean;
  colors?: {
    very_negative: string;
    negative: string;
    neutral: string;
    positive: string;
    very_positive: string;
  };
}

export interface PhotoUploaderProps extends BaseComponentProps {
  onImageSelect: (image: { uri: string; type: string; name: string }) => void;
  onAnalysisResult?: (analysis: any) => void;
  category?: DecisionCategory;
  maxSize?: number;
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
  loading?: boolean;
  error?: string;
}

// Filter and search component types
export interface FilterBarProps extends BaseComponentProps {
  categories: DecisionCategory[];
  selectedCategories: DecisionCategory[];
  onCategoryToggle: (category: DecisionCategory) => void;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  onDateRangeChange?: (range: { startDate: Date; endDate: Date }) => void;
  sortBy?: 'created_at' | 'confidence_score' | 'feedback_rating';
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, order: 'asc' | 'desc') => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export interface SearchBarProps extends BaseComponentProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: (query: string) => void;
  placeholder?: string;
  showFilters?: boolean;
  onFiltersPress?: () => void;
  loading?: boolean;
  suggestions?: string[];
  onSuggestionPress?: (suggestion: string) => void;
}

// Chart and visualization component types
export interface ChartProps extends BaseComponentProps {
  data: any[];
  width?: number;
  height?: number;
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  animationDuration?: number;
  interactive?: boolean;
  onDataPointPress?: (data: any) => void;
}

export interface StatsCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: number;
    period: string;
  };
  color?: string;
  loading?: boolean;
}

// Animation component types
export interface AnimatedViewProps extends BaseComponentProps {
  animation?: 'fadeIn' | 'fadeOut' | 'slideInUp' | 'slideInDown' | 'bounceIn' | 'pulse';
  duration?: number;
  delay?: number;
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  loop?: boolean | number;
  autoPlay?: boolean;
  onAnimationComplete?: () => void;
}

// Form component types
export interface FormFieldProps extends BaseComponentProps {
  name: string;
  label?: string;
  required?: boolean;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | undefined;
  };
  component: ReactNode;
}

export interface FormProps extends BaseComponentProps {
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  validationSchema?: any;
  enableReinitialize?: boolean;
  loading?: boolean;
  submitText?: string;
  resetText?: string;
  showReset?: boolean;
}

// Theme and styling types
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface Theme {
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    h4: TextStyle;
    body: TextStyle;
    caption: TextStyle;
  };
  shadows: {
    sm: ViewStyle;
    md: ViewStyle;
    lg: ViewStyle;
  };
}

// Style utility types
export interface StyleProps {
  margin?: number | string;
  marginTop?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;
  marginRight?: number | string;
  marginHorizontal?: number | string;
  marginVertical?: number | string;
  padding?: number | string;
  paddingTop?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  paddingRight?: number | string;
  paddingHorizontal?: number | string;
  paddingVertical?: number | string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
}

// Responsive design types
export interface Breakpoints {
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ResponsiveValue<T> {
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}

// Accessibility types
export interface AccessibilityProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'text' | 'image' | 'header' | 'none';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityActions?: Array<{
    name: string;
    label?: string;
  }>;
  onAccessibilityAction?: (event: { nativeEvent: { actionName: string } }) => void;
}