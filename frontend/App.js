import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASSMORPHISM, SPACING } from './src/styles/theme';

import AuthScreen from './src/screens/AuthScreen';
import DecisionSnapScreen from './src/screens/DecisionSnapScreen';
import DecisionSnapPhotoScreen from './src/screens/DecisionSnapPhotoScreen';
import MoodTrackerScreen from './src/screens/MoodTrackerScreen';
import DecisionJournal from './src/screens/DecisionJournal';
import ProfileScreen from './src/screens/ProfileScreen';
import { useAuthStore } from './src/services/authStore';
import { supabase } from './src/services/supabase';
import GlassDockTabBar from './src/components/GlassDockTabBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <GlassDockTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Mood" 
        component={MoodTrackerScreen}
        options={{ 
          title: 'Mood Check',
          tabBarLabel: 'Mood'
        }}
      />
      <Tab.Screen 
        name="Text" 
        component={DecisionSnapScreen}
        options={{ 
          title: 'Text Decisions',
          tabBarLabel: 'Text'
        }}
      />
      <Tab.Screen 
        name="Camera" 
        component={DecisionSnapPhotoScreen}
        options={{ 
          title: 'Photo Decisions',
          tabBarLabel: 'Camera'
        }}
      />
      <Tab.Screen 
        name="History" 
        component={DecisionJournal}
        options={{ 
          title: 'Decision Journal',
          tabBarLabel: 'History'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Profile',
          tabBarLabel: 'Profile'
        }}
      />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PhotoDecision" 
        component={DecisionSnapPhotoScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const { session, setSession } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <PaperProvider>
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: COLORS.accent.primary,
            background: COLORS.background.primary,
            card: COLORS.background.secondary,
            text: COLORS.text.primary,
            border: COLORS.glass.border,
            notification: COLORS.accent.primary,
          },
        }}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.background.primary }}>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {session ? (
              <Stack.Screen name="Main" component={MainStack} />
            ) : (
              <Stack.Screen name="Auth" component={AuthScreen} />
            )}
          </Stack.Navigator>
        </View>
      </NavigationContainer>
    </PaperProvider>
  );
}