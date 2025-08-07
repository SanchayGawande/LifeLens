import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function GlassDockTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          'rgba(0, 0, 0, 0.8)',
          'rgba(0, 0, 0, 0.9)',
          'rgba(0, 0, 0, 0.95)',
        ]}
        style={styles.tabBarGradient}
      >
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            // Icon mapping
            const getIconName = (routeName, focused) => {
              switch (routeName) {
                case 'Mood':
                  return focused ? 'happy' : 'happy-outline';
                case 'Text':
                  return focused ? 'flash' : 'flash-outline';
                case 'Camera':
                  return focused ? 'camera' : 'camera-outline';
                case 'History':
                  return focused ? 'time' : 'time-outline';
                case 'Profile':
                  return focused ? 'person' : 'person-outline';
                default:
                  return focused ? 'home' : 'home-outline';
              }
            };

            return (
              <TouchableOpacity
                key={index}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabButton}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconContainer,
                  isFocused && styles.iconContainerActive
                ]}>
                  <Ionicons
                    name={getIconName(route.name, isFocused)}
                    size={isFocused ? 26 : 24}
                    color={isFocused ? COLORS.accent.primary : COLORS.text.tertiary}
                  />
                </View>
                
                {isFocused && (
                  <Text style={styles.tabLabel}>{label}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  
  tabBarGradient: {
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
    }),
  },
  
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  
  iconContainer: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
    transition: Platform.OS === 'web' ? 'all 0.2s ease' : undefined,
  },
  
  iconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ scale: 1.1 }],
    ...Platform.select({
      ios: {
        shadowColor: COLORS.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 4px 16px ${COLORS.accent.primary}40`,
      },
    }),
  },
  
  tabLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.accent.primary,
    marginTop: 4,
    textAlign: 'center',
  },
});