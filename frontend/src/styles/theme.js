// LifeLens Dark Theme - Modern Glassmorphism Design System
// Based on premium mobile app reference design

import { Platform } from 'react-native';

export const COLORS = {
  // Background Colors (Dark Theme) - UPDATED
  background: {
    primary: '#000000',        // Pure black for main background
    secondary: '#1a1a1a',      // Dark gray for cards
    tertiary: '#2a2a2a',       // Medium gray for elevated elements
    quaternary: '#3a3a3a',     // Light gray for interactive elements
  },

  // Glass Colors (Glassmorphism)
  glass: {
    primary: 'rgba(255, 255, 255, 0.1)',      // Primary glass overlay
    secondary: 'rgba(255, 255, 255, 0.15)',   // Secondary glass overlay
    border: 'rgba(255, 255, 255, 0.2)',       // Glass border
    highlight: 'rgba(255, 255, 255, 0.05)',   // Subtle highlight
  },

  // Text Colors (Dark Theme Optimized)
  text: {
    primary: '#FFFFFF',        // Primary white text
    secondary: '#E5E5E7',      // Secondary light gray
    tertiary: '#8E8E93',       // Tertiary medium gray
    disabled: '#48484A',       // Disabled text
    placeholder: '#636366',    // Placeholder text
  },

  // Accent Colors
  accent: {
    primary: '#007AFF',        // iOS Blue - Primary action color
    secondary: '#5856D6',      // Purple accent
    success: '#34C759',        // Green success
    warning: '#FF9500',        // Orange warning
    error: '#FF3B30',          // Red error
    info: '#5AC8FA',          // Light blue info
  },

  // Gradient Colors
  gradient: {
    primary: ['#007AFF', '#5856D6'],         // Blue to purple
    secondary: ['#1a1a1a', '#2a2a2a'],       // Dark gradient
    glass: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'], // Glass gradient
  },

  // Shadow Colors
  shadow: {
    primary: 'rgba(0, 0, 0, 0.3)',
    secondary: 'rgba(0, 0, 0, 0.2)',
    glass: 'rgba(0, 0, 0, 0.1)',
  }
};

export const TYPOGRAPHY = {
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line Heights
  lineHeight: {
    tight: 16,
    normal: 20,
    relaxed: 24,
    loose: 28,
  }
};

export const SPACING = {
  // Padding & Margin
  xs: 4,
  sm: 8,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,

  // Section Spacing - For proper UI hierarchy
  section: {
    gap: 24,           // Between major sections
    padding: 20,       // Internal section padding
    margin: 16,        // Section margins
  },

  // Typography Spacing - For text hierarchy
  text: {
    headerBottom: 16,   // Space below headers
    subheaderBottom: 12, // Space below subheaders
    paragraphBottom: 8, // Space below paragraphs
    sectionTitle: 24,   // Space before section titles
  },

  // Component Spacing
  component: {
    buttonTop: 16,      // Space above buttons
    inputGap: 12,       // Between form inputs
    cardGap: 16,        // Between cards
  },

  // Border Radius
  radius: {
    sm: 8,
    base: 12,
    lg: 16,
    xl: 20,
    full: 999,
  }
};

export const GLASSMORPHISM = {
  // Primary Glass Card Style
  card: {
    backgroundColor: COLORS.glass.primary,
    borderRadius: SPACING.radius.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow.glass,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        webkitBackdropFilter: 'blur(10px)',
      }
    })
  },

  // Secondary Glass Card (More Prominent)
  cardSecondary: {
    backgroundColor: COLORS.glass.secondary,
    borderRadius: SPACING.radius.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(15px)',
        webkitBackdropFilter: 'blur(15px)',
      }
    })
  },

  // Button Glass Style
  button: {
    backgroundColor: COLORS.glass.primary,
    borderRadius: SPACING.radius.base,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow.secondary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(8px)',
        webkitBackdropFilter: 'blur(8px)',
      }
    })
  }
};

export const COMPONENTS = {
  // Primary Button Style
  button: {
    primary: {
      backgroundColor: COLORS.accent.primary,
      borderRadius: SPACING.radius.base,
      paddingVertical: SPACING.base,
      paddingHorizontal: SPACING.xl,
      ...Platform.select({
        ios: {
          shadowColor: COLORS.accent.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 6,
        },
        web: {
          boxShadow: `0 4px 20px ${COLORS.accent.primary}40`,
        }
      })
    },
    
    // Glass Button Style
    glass: {
      ...GLASSMORPHISM.button,
      paddingVertical: SPACING.base,
      paddingHorizontal: SPACING.xl,
    }
  },

  // Input Style
  input: {
    ...GLASSMORPHISM.card,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.lg,
    borderRadius: SPACING.radius.base,
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
  },

  // Card Style
  card: {
    ...GLASSMORPHISM.card,
    padding: SPACING.lg,
    marginVertical: SPACING.sm,
  }
};

// Animation Constants
export const ANIMATIONS = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
  }
};

// Layout Constants
export const LAYOUT = {
  headerHeight: 60,
  tabBarHeight: 70,
  cardSpacing: SPACING.base,
  screenPadding: SPACING.lg,
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  GLASSMORPHISM,
  COMPONENTS,
  ANIMATIONS,
  LAYOUT,
};