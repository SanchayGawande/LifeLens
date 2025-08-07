import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../services/authStore';
import { COLORS, TYPOGRAPHY, SPACING, COMPONENTS } from '../styles/theme';
import GlassCard from '../components/GlassCard';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { loading, setLoading, setError } = useAuthStore();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || email.split('@')[0],
            },
          },
        });
        if (error) throw error;
        Alert.alert('Success', 'Please check your email to verify your account');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={COLORS.gradient.primary} 
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🔮</Text>
            <Text style={styles.title}>LifeLens</Text>
          </View>
          <Text style={styles.subtitle}>Your Intelligent Decision Assistant</Text>
        </View>

        {/* Auth Form Card */}
        <GlassCard style={styles.formCard} variant="secondary">
          <View style={styles.formContent}>
            <Text style={styles.formTitle}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={styles.formSubtitle}>
              {isLogin 
                ? 'Sign in to continue your decision journey' 
                : 'Join thousands making smarter decisions'
              }
            </Text>

            {/* Name Input (Sign Up Only) */}
            {!isLogin && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={COLORS.text.placeholder}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={COLORS.text.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.text.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCorrect={false}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? [COLORS.text.disabled, COLORS.text.disabled] : COLORS.gradient.primary}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={COLORS.text.primary} size="small" />
                    <Text style={styles.loadingText}>
                      {isLogin ? 'Signing In...' : 'Creating Account...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Switch Mode Button */}
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.switchTextAccent}>
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Bottom Spacing for Tab Bar */}
        <View style={styles.bottomSpacer} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  
  logoIcon: {
    fontSize: 40,
    marginRight: SPACING.base,
  },
  
  title: {
    fontSize: TYPOGRAPHY.fontSize['5xl'],
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text.secondary,
    textAlign: 'center',
    opacity: 0.8,
  },
  
  formCard: {
    marginHorizontal: 0,
    overflow: 'hidden',
  },
  
  formContent: {
    padding: SPACING['2xl'],
  },
  
  formTitle: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  
  formSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
    opacity: 0.8,
  },
  
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  
  input: {
    ...COMPONENTS.input,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  submitButton: {
    borderRadius: SPACING.radius.base,
    marginTop: SPACING.base,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow.primary,
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
  
  submitButtonGradient: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  submitButtonDisabled: {
    opacity: 0.6,
  },
  
  submitButtonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  loadingText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginLeft: SPACING.sm,
  },
  
  switchButton: {
    alignItems: 'center',
    paddingVertical: SPACING.base,
  },
  
  switchText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  
  switchTextAccent: {
    color: COLORS.accent.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  
  bottomSpacer: {
    height: 100, // Space for tab bar
  },
});