// Authentication and authorization types

import { User as SupabaseUser } from '@supabase/supabase-js';

// Extended user type with profile information
export interface AuthUser extends SupabaseUser {
  profile?: {
    full_name?: string;
    avatar_url?: string;
    preferences?: UserPreferences;
    created_at: string;
    updated_at: string;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  auto_decision_enabled: boolean;
  mood_tracking_enabled: boolean;
  weather_integration_enabled: boolean;
  language: string;
  timezone: string;
  privacy_level: 'public' | 'friends' | 'private';
}

// JWT token types
export interface JWTPayload {
  sub: string; // user ID
  email: string;
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  role?: string;
  app_metadata?: {
    provider?: string;
    providers?: string[];
  };
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
  };
}

// Authentication session types
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: 'bearer';
  user: AuthUser;
}

// Authentication context for middleware
export interface AuthContext {
  user: AuthUser;
  session: AuthSession;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
}

// User roles and permissions
export type UserRole = 
  | 'user'
  | 'premium_user'
  | 'admin'
  | 'super_admin';

export type Permission = 
  | 'read_own_data'
  | 'write_own_data'
  | 'delete_own_data'
  | 'use_ai_features'
  | 'use_premium_features'
  | 'upload_images'
  | 'export_data'
  | 'manage_users'
  | 'manage_system'
  | 'view_analytics';

// Role-based access control
export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  limitations?: {
    max_api_calls_per_hour?: number;
    max_ai_requests_per_day?: number;
    max_image_analyses_per_day?: number;
    max_storage_mb?: number;
    features_enabled?: string[];
  };
}

// Authentication configuration
export interface AuthConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    algorithm: string;
  };
  session: {
    name: string;
    secret: string;
    maxAge: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: boolean | 'lax' | 'strict' | 'none';
  };
  oauth?: {
    google?: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };
    apple?: {
      clientId: string;
      teamId: string;
      keyId: string;
      privateKey: string;
    };
  };
  rate_limiting: {
    auth_attempts: {
      window_ms: number;
      max_attempts: number;
      block_duration_ms: number;
    };
  };
}

// Login/Signup request types
export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface SignupCredentials {
  email: string;
  password: string;
  full_name?: string;
  marketing_consent?: boolean;
}

export interface ResetPasswordRequest {
  email: string;
  redirect_url?: string;
}

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface VerifyEmailRequest {
  token: string;
  type: 'signup' | 'recovery' | 'email_change';
}

// OAuth types
export interface OAuthRequest {
  provider: 'google' | 'apple' | 'facebook' | 'twitter';
  redirect_url?: string;
  scopes?: string[];
}

export interface OAuthCallback {
  code: string;
  state?: string;
  error?: string;
  error_description?: string;
}

// Two-factor authentication types
export interface TwoFactorSetup {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

export interface TwoFactorVerification {
  token: string;
  backup_code?: string;
}

// Security events
export interface SecurityEvent {
  user_id: string;
  event_type: 
    | 'login_success'
    | 'login_failed'
    | 'logout'
    | 'password_changed'
    | 'email_changed'
    | 'account_locked'
    | 'suspicious_activity'
    | 'data_export_requested';
  ip_address: string;
  user_agent: string;
  location?: {
    country: string;
    city: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  metadata?: any;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Account status types
export type AccountStatus = 
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'banned'
  | 'pending_verification'
  | 'pending_deletion';

export interface AccountInfo {
  user_id: string;
  status: AccountStatus;
  created_at: string;
  last_login: string;
  email_verified: boolean;
  phone_verified: boolean;
  two_factor_enabled: boolean;
  security_events_count: number;
  subscription?: {
    plan: string;
    status: 'active' | 'cancelled' | 'past_due';
    current_period_start: string;
    current_period_end: string;
  };
}