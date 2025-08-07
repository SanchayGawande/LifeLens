import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vnkekvwzlbxquprramco.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZua2Vrdnd6bGJ4cXVwcnJhbWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODUyMDUsImV4cCI6MjA2ODQ2MTIwNX0.ajOs8RvwBgJE3c0sbG9j-Kbf-qzatDourozRnifRAcE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});