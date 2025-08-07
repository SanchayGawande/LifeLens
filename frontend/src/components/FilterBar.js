import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../styles/theme';
import GlassCard from './GlassCard';

const CATEGORY_FILTERS = [
  { id: null, name: 'All', icon: 'apps' },
  { id: 'food', name: 'Food', icon: 'restaurant' },
  { id: 'clothing', name: 'Clothing', icon: 'shirt' },
  { id: 'activity', name: 'Activity', icon: 'bicycle' },
  { id: 'work', name: 'Work', icon: 'briefcase' },
  { id: 'social', name: 'Social', icon: 'people' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
];

const MOOD_FILTERS = [
  { id: null, name: 'All Moods', icon: 'layers' },
  { id: 'excited', name: 'Excited', icon: 'star' },
  { id: 'happy', name: 'Happy', icon: 'happy' },
  { id: 'relaxed', name: 'Relaxed', icon: 'leaf' },
  { id: 'focused', name: 'Focused', icon: 'eye' },
  { id: 'tired', name: 'Tired', icon: 'moon' },
  { id: 'stressed', name: 'Stressed', icon: 'alert-circle' },
  { id: 'sad', name: 'Sad', icon: 'sad' },
  { id: 'anxious', name: 'Anxious', icon: 'alert' },
  { id: 'energetic', name: 'Energetic', icon: 'flash' },
  { id: 'calm', name: 'Calm', icon: 'heart' },
];

export default function FilterBar({ 
  selectedCategory, 
  selectedMood, 
  onCategoryChange, 
  onMoodChange,
  totalCount = 0,
  filteredCount = 0,
}) {
  const [showMoodModal, setShowMoodModal] = useState(false);

  const selectedCategoryData = CATEGORY_FILTERS.find(cat => cat.id === selectedCategory);
  const selectedMoodData = MOOD_FILTERS.find(mood => mood.id === selectedMood);

  const hasActiveFilters = selectedCategory !== null || selectedMood !== null;

  const clearAllFilters = () => {
    onCategoryChange(null);
    onMoodChange(null);
  };

  return (
    <GlassCard style={styles.container}>
      {/* Category Filter Row */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContainer}
      >
        {CATEGORY_FILTERS.map((category) => (
          <TouchableOpacity
            key={category.id || 'all'}
            style={[
              styles.filterButton,
              selectedCategory === category.id && styles.filterButtonActive,
            ]}
            onPress={() => onCategoryChange(category.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={category.icon}
              size={16}
              color={selectedCategory === category.id ? COLORS.text.primary : COLORS.accent.primary}
            />
            <Text
              style={[
                styles.filterText,
                selectedCategory === category.id && styles.filterTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Mood Filter & Results Row */}
      <View style={styles.secondRow}>
        <TouchableOpacity
          style={[styles.moodFilterButton, selectedMood && styles.moodFilterButtonActive]}
          onPress={() => setShowMoodModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={selectedMoodData?.icon || 'layers'} 
            size={16} 
            color={selectedMood ? COLORS.text.primary : COLORS.accent.primary} 
          />
          <Text style={[
            styles.moodFilterText,
            selectedMood && styles.moodFilterTextActive
          ]}>
            {selectedMoodData?.name || 'All Moods'}
          </Text>
          <Ionicons 
            name="chevron-down" 
            size={16} 
            color={selectedMood ? COLORS.text.primary : COLORS.accent.primary} 
          />
        </TouchableOpacity>

        <View style={styles.resultsInfo}>
          {hasActiveFilters && (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={clearAllFilters}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={16} color={COLORS.text.tertiary} />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.resultCount}>
            {filteredCount} of {totalCount}
          </Text>
        </View>
      </View>

      {/* Mood Selection Modal */}
      <Modal
        visible={showMoodModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMoodModal(false)}
      >
        <View style={styles.modalContainer}>
          <GlassCard style={styles.modalHeader} variant="secondary">
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowMoodModal(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={COLORS.text.secondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filter by Mood</Text>
            <View style={styles.modalPlaceholder} />
          </GlassCard>

          <ScrollView style={styles.modalContent}>
            <View style={styles.moodGrid}>
              {MOOD_FILTERS.map((mood) => (
                <GlassCard
                  key={mood.id || 'all'}
                  style={[
                    styles.moodOption,
                    selectedMood === mood.id && styles.moodOptionSelected,
                  ]}
                  onPress={() => {
                    onMoodChange(mood.id);
                    setShowMoodModal(false);
                  }}
                >
                  <Ionicons name={mood.icon} size={32} color={COLORS.accent.primary} />
                  <Text style={[
                    styles.moodOptionText,
                    selectedMood === mood.id && styles.moodOptionTextSelected,
                  ]}>
                    {mood.name}
                  </Text>
                </GlassCard>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.base,
    margin: SPACING.lg,
    marginBottom: SPACING.base,
  },
  
  // Category Filter Row
  filterScrollContainer: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass.primary,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.radius.full,
    marginRight: SPACING.sm,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow.glass,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  filterButtonActive: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
  },
  
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.accent.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginLeft: SPACING.xs,
  },
  
  filterTextActive: {
    color: COLORS.text.primary,
  },
  
  // Second Row
  secondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
  },
  
  moodFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass.primary,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.radius.full,
    minWidth: 120,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow.glass,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  moodFilterButtonActive: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
  },
  
  
  moodFilterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.accent.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginLeft: SPACING.xs,
    marginRight: SPACING.xs,
    flex: 1,
  },
  
  moodFilterTextActive: {
    color: COLORS.text.primary,
  },
  
  resultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass.primary,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.radius.base,
    marginRight: SPACING.sm,
  },
  
  clearText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginLeft: SPACING.xs,
  },
  
  resultCount: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: SPACING.lg,
    marginBottom: SPACING.base,
  },
  
  modalCloseButton: {
    padding: SPACING.xs,
  },
  
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  
  modalPlaceholder: {
    width: 32,
  },
  
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  moodOption: {
    width: '48%',
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  
  moodOptionSelected: {
    backgroundColor: COLORS.accent.primary,
  },
  
  
  moodOptionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  
  moodOptionTextSelected: {
    color: COLORS.text.primary,
  },
});