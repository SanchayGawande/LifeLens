import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../styles/theme';
import GlassCard from './GlassCard';

const PREDEFINED_MOODS = [
  { id: 'excited', name: 'Excited', icon: 'star', color: '#10b981' },
  { id: 'happy', name: 'Happy', icon: 'happy', color: '#34d399' },
  { id: 'relaxed', name: 'Relaxed', icon: 'leaf', color: '#60a5fa' },
  { id: 'focused', name: 'Focused', icon: 'eye', color: '#8b5cf6' },
  { id: 'tired', name: 'Tired', icon: 'moon', color: '#6b7280' },
  { id: 'stressed', name: 'Stressed', icon: 'alert-circle', color: '#f59e0b' },
  { id: 'sad', name: 'Sad', icon: 'sad', color: '#ef4444' },
  { id: 'anxious', name: 'Anxious', icon: 'alert', color: '#f97316' },
  { id: 'energetic', name: 'Energetic', icon: 'flash', color: '#eab308' },
  { id: 'calm', name: 'Calm', icon: 'heart', color: '#06b6d4' },
];

export default function MoodSelector({ selectedMood, onMoodChange, style }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [customMood, setCustomMood] = useState('');

  const handleMoodSelect = (mood) => {
    onMoodChange(mood.id);
    setIsModalVisible(false);
  };

  const handleCustomMoodSubmit = () => {
    if (customMood.trim()) {
      onMoodChange(customMood.trim());
      setCustomMood('');
      setIsModalVisible(false);
    }
  };

  const selectedMoodData = PREDEFINED_MOODS.find(mood => mood.id === selectedMood);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>How are you feeling? (optional)</Text>
      
      <TouchableOpacity
        style={[styles.selector, {backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 12}]}
        onPress={() => setIsModalVisible(true)}
      >
        {selectedMoodData ? (
          <View style={styles.selectedMood}>
            <Ionicons name={selectedMoodData.icon} size={20} color={selectedMoodData.color} />
            <Text style={styles.selectedMoodText}>{selectedMoodData.name}</Text>
          </View>
        ) : selectedMood ? (
          <View style={styles.selectedMood}>
            <Ionicons name="chatbubble" size={20} color={COLORS.accent.primary} />
            <Text style={styles.selectedMoodText}>{selectedMood}</Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>Select your mood</Text>
        )}
        
        <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
      </TouchableOpacity>

      {selectedMood && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => onMoodChange(null)}
        >
          <Ionicons name="close-circle" size={20} color="#6b7280" />
        </TouchableOpacity>
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <GlassCard style={styles.modalHeader} variant="modal">
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.text.secondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Your Mood</Text>
            <View style={styles.modalPlaceholder} />
          </GlassCard>

          <ScrollView style={styles.modalContent}>
            <View style={styles.moodGrid}>
              {PREDEFINED_MOODS.map((mood) => (
                <GlassCard
                  key={mood.id}
                  style={[
                    styles.moodOption,
                    selectedMood === mood.id && styles.moodOptionSelected,
                  ]}
                  onPress={() => handleMoodSelect(mood)}
                  variant="primary"
                >
                  <Ionicons name={mood.icon} size={32} color={mood.color} />
                  <Text style={[
                    styles.moodName,
                    selectedMood === mood.id && styles.moodNameSelected,
                  ]}>
                    {mood.name}
                  </Text>
                </GlassCard>
              ))}
            </View>

            <GlassCard style={styles.customMoodSection} variant="primary">
              <Text style={styles.customMoodLabel}>Or describe your mood:</Text>
              <View style={styles.customMoodContainer}>
                <GlassCard style={styles.customMoodInputWrapper} variant="input">
                  <TextInput
                    style={styles.customMoodInput}
                    placeholder="e.g., overwhelmed, creative, nostalgic..."
                    placeholderTextColor={COLORS.text.placeholder}
                    value={customMood}
                    onChangeText={setCustomMood}
                    maxLength={50}
                    onSubmitEditing={handleCustomMoodSubmit}
                    returnKeyType="done"
                  />
                </GlassCard>
                {customMood.trim() && (
                  <TouchableOpacity
                    style={styles.customMoodSubmit}
                    onPress={handleCustomMoodSubmit}
                  >
                    <Ionicons name="checkmark" size={20} color={COLORS.accent.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </GlassCard>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.component.inputGap,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.text.subheaderBottom,
  },
  selector: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedMood: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIcon: {
    marginRight: SPACING.base,
  },
  selectedMoodText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.placeholder,
  },
  clearButton: {
    position: 'absolute',
    right: 40,
    top: 45,
    padding: SPACING.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.section.margin,
    marginTop: SPACING.section.margin,
    marginBottom: SPACING.base,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
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
    paddingHorizontal: SPACING.section.margin,
    paddingVertical: SPACING.base,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.section.gap,
  },
  moodOption: {
    width: '48%',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.base,
    alignItems: 'center',
    marginBottom: SPACING.component.inputGap,
  },
  moodOptionSelected: {
    backgroundColor: COLORS.accent.primary,
  },
  moodIcon: {
    marginBottom: SPACING.sm,
  },
  moodName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  moodNameSelected: {
    color: COLORS.text.primary,
  },
  customMoodSection: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  customMoodLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.text.subheaderBottom,
  },
  customMoodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customMoodInputWrapper: {
    flex: 1,
    paddingHorizontal: 0, // Remove default GlassCard padding
  },
  customMoodInput: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    backgroundColor: 'transparent',
    borderWidth: 0,
    minHeight: 40,
  },
  customMoodSubmit: {
    marginLeft: SPACING.base,
    backgroundColor: `${COLORS.accent.primary}20`,
    borderRadius: SPACING.radius.sm,
    padding: SPACING.base,
  },
});