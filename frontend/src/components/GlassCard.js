import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GLASSMORPHISM, SPACING } from '../styles/theme';

/**
 * GlassCard - Reusable glassmorphism card component
 * Provides consistent dark theme glass effect across the app
 */
export default function GlassCard({ 
  children, 
  style = {}, 
  variant = 'primary', 
  onPress = null,
  disabled = false,
  gradient = false,
  ...props 
}) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary': return styles.secondary;
      case 'input': return styles.input;
      case 'dropdown': return styles.dropdown;
      case 'modal': return styles.modal;
      default: return styles.primary;
    }
  };

  const cardStyles = [
    styles.base,
    getVariantStyle(),
    disabled && styles.disabled,
    style
  ];

  // If onPress is provided, make it touchable
  if (onPress && !disabled) {
    return (
      <TouchableOpacity 
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.8}
        {...props}
      >
        {gradient ? (
          <LinearGradient
            colors={COLORS.gradient.glass}
            style={styles.gradientOverlay}
          >
            {children}
          </LinearGradient>
        ) : (
          children
        )}
      </TouchableOpacity>
    );
  }

  // Static card
  return (
    <View style={cardStyles} {...props}>
      {gradient ? (
        <LinearGradient
          colors={COLORS.gradient.glass}
          style={styles.gradientOverlay}
        >
          {children}
        </LinearGradient>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden', // Ensure border radius is applied
  },
  
  primary: {
    ...GLASSMORPHISM.card,
  },
  
  secondary: {
    ...GLASSMORPHISM.cardSecondary,
  },
  
  // New variants for consistent theming
  input: {
    backgroundColor: COLORS.glass.primary,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    borderRadius: SPACING.radius.base,
    minHeight: 50,
  },
  
  dropdown: {
    backgroundColor: COLORS.glass.primary,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    borderRadius: SPACING.radius.base,
    minHeight: 50,
  },
  
  modal: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SPACING.radius.lg,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  
  disabled: {
    opacity: 0.5,
  },
  
  gradientOverlay: {
    flex: 1,
    padding: SPACING.lg,
  }
});

/**
 * Specialized Glass Components
 */

// Glass Input Container
export function GlassInput({ children, style = {}, ...props }) {
  return (
    <GlassCard 
      style={[styles.inputContainer, style]} 
      variant="primary"
      {...props}
    >
      {children}
    </GlassCard>
  );
}

// Glass Button
export function GlassButton({ children, onPress, style = {}, ...props }) {
  return (
    <GlassCard 
      style={[styles.buttonContainer, style]}
      onPress={onPress}
      variant="primary"
      {...props}
    >
      {children}
    </GlassCard>
  );
}

// Glass Header
export function GlassHeader({ children, style = {}, ...props }) {
  return (
    <GlassCard 
      style={[styles.headerContainer, style]}
      variant="secondary"
      gradient={true}
      {...props}
    >
      {children}
    </GlassCard>
  );
}

const componentStyles = StyleSheet.create({
  inputContainer: {
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.lg,
  },
  
  buttonContainer: {
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerContainer: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.base,
  }
});

// Merge component styles
Object.assign(styles, componentStyles);