import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { COLORS, TYPOGRAPHY, SPACING } from '../styles/theme';
import GlassCard from './GlassCard';
import RankedOptionsList from './RankedOptionsList';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORY_ICONS = {
  food: 'restaurant',
  clothing: 'shirt',
  activity: 'bicycle',
  work: 'briefcase',
  social: 'people',
  other: 'apps',
};

const MOOD_ICONS = {
  excited: 'star',
  happy: 'happy',
  relaxed: 'leaf',
  focused: 'eye',
  tired: 'moon',
  stressed: 'alert-circle',
  sad: 'sad',
  anxious: 'alert',
  energetic: 'flash',
  calm: 'heart',
};

export default function DecisionCard({ decision, onPress }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [optionsExpanded, setOptionsExpanded] = useState(false);

  const category = decision.context?.category || 'other';
  const mood = decision.context?.mood;
  const date = new Date(decision.created_at);
  
  // Parse the response to check for enhanced format
  let parsedResponse = null;
  let hasRankedOptions = false;
  
  try {
    if (decision.ai_response && decision.ai_response.startsWith('{')) {
      parsedResponse = JSON.parse(decision.ai_response);
      hasRankedOptions = parsedResponse.rankedOptions && parsedResponse.rankedOptions.length > 0;
    }
  } catch (e) {
    // Legacy format, will use final_decision
  }

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      setOptionsExpanded(false);
    }
  };

  const getMoodDisplay = (moodText) => {
    const icon = MOOD_ICONS[moodText?.toLowerCase()];
    return { icon, text: moodText };
  };

  const getReasoningSummary = () => {
    if (hasRankedOptions && parsedResponse.reasoning) {
      // Truncate reasoning to first sentence or 100 chars
      const reasoning = parsedResponse.reasoning;
      const firstSentence = reasoning.split('.')[0];
      return firstSentence.length > 100 ? `${reasoning.substring(0, 100)}...` : `${firstSentence}.`;
    }
    return null;
  };

  const renderCompactContent = () => (
    <View style={styles.compactContent}>
      <Text style={styles.inputText} numberOfLines={2}>
        {decision.question}
      </Text>
      
      <View style={styles.recommendationRow}>
        <Ionicons name="checkmark-circle" size={16} color={COLORS.accent.success} />
        <Text style={styles.recommendationText} numberOfLines={1}>
          {hasRankedOptions ? parsedResponse.recommendedOption : decision.final_decision}
        </Text>
      </View>

      {getReasoningSummary() && (
        <Text style={styles.reasoningSummary} numberOfLines={2}>
          {getReasoningSummary()}
        </Text>
      )}
    </View>
  );

  const renderExpandedContent = () => (
    <View style={styles.expandedContent}>
      <Text style={styles.fullInputText}>{decision.question}</Text>
      
      {hasRankedOptions ? (
        <RankedOptionsList
          rankedOptions={parsedResponse.rankedOptions}
          recommendedOption={parsedResponse.recommendedOption}
          isExpanded={optionsExpanded}
          onToggle={() => setOptionsExpanded(!optionsExpanded)}
        />
      ) : (
        <GlassCard style={styles.legacyDecisionBox} variant="primary">
          <Text style={styles.legacyDecisionText}>{decision.final_decision}</Text>
        </GlassCard>
      )}

      {parsedResponse?.reasoning && (
        <GlassCard style={styles.fullReasoningBox} variant="primary">
          <View style={styles.reasoningHeader}>
            <Ionicons name="bulb" size={16} color={COLORS.accent.info} />
            <Text style={styles.reasoningTitle}>Reasoning</Text>
          </View>
          <Text style={styles.fullReasoningText}>{parsedResponse.reasoning}</Text>
        </GlassCard>
      )}
    </View>
  );

  return (
    <GlassCard 
      style={styles.card} 
      onPress={toggleExpanded}
    >
      {/* Card Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.categoryIcon, { backgroundColor: `${getCategoryColor(category)}30` }]}>
            <Ionicons name={CATEGORY_ICONS[category]} size={20} color={getCategoryColor(category)} />
          </View>
          
          <View style={styles.headerInfo}>
            <View style={styles.metaRow}>
              <Text style={styles.dateText}>
                {formatDistanceToNow(date, { addSuffix: true })}
              </Text>
              {mood && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <View style={styles.moodDisplay}>
                    {getMoodDisplay(mood).icon && (
                      <Ionicons 
                        name={getMoodDisplay(mood).icon} 
                        size={14} 
                        color={COLORS.accent.primary} 
                        style={styles.moodIcon}
                      />
                    )}
                    <Text style={styles.moodText}>{getMoodDisplay(mood).text}</Text>
                  </View>
                </>
              )}
            </View>
            <Text style={styles.fullDateText}>
              {format(date, 'MMM d, yyyy • h:mm a')}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {decision.auto_decided && (
            <View style={styles.autoDecideBadge}>
              <Ionicons name="flash" size={12} color={COLORS.accent.warning} />
            </View>
          )}
          <View style={[styles.expandIcon, isExpanded && styles.expandIconRotated]}>
            <Ionicons name="chevron-down" size={20} color={COLORS.text.tertiary} />
          </View>
        </View>
      </View>

      {/* Card Content */}
      {isExpanded ? renderExpandedContent() : renderCompactContent()}

      {/* Enhancement Indicator */}
      {hasRankedOptions && (
        <View style={styles.enhancementBadge}>
          <Ionicons name="analytics" size={12} color={COLORS.accent.primary} />
          <Text style={styles.enhancementText}>Smart Ranking</Text>
        </View>
      )}
    </GlassCard>
  );
}

const getCategoryColor = (category) => {
  const colors = {
    food: '#f59e0b',
    clothing: '#8b5cf6',
    activity: '#10b981',
    work: '#3b82f6',
    social: '#ec4899',
    other: '#6b7280',
  };
  return colors[category] || colors.other;
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    paddingBottom: SPACING.base,
  },
  
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  
  headerInfo: {
    flex: 1,
  },
  
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  
  dateText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
  },
  
  separator: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
    marginHorizontal: SPACING.xs,
  },
  
  moodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  moodIcon: {
    marginRight: SPACING.xs / 2,
  },
  
  moodText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.accent.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  fullDateText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  autoDecideBadge: {
    backgroundColor: `${COLORS.accent.warning}30`,
    borderRadius: SPACING.radius.base,
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  
  expandIcon: {
    transform: [{ rotate: '0deg' }],
  },
  
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  
  // Content Styles
  compactContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  
  inputText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
    marginBottom: SPACING.base,
  },
  
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  recommendationText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.accent.success,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  
  reasoningSummary: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  
  expandedContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  
  fullInputText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
    marginBottom: SPACING.lg,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  // Legacy Decision Box
  legacyDecisionBox: {
    padding: SPACING.lg,
    marginBottom: SPACING.base,
  },
  
  legacyDecisionText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
  },
  
  // Reasoning Box
  fullReasoningBox: {
    padding: SPACING.base,
    marginTop: SPACING.base,
  },
  
  reasoningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  reasoningTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginLeft: SPACING.xs,
  },
  
  fullReasoningText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    opacity: 0.9,
  },
  
  // Enhancement Badge
  enhancementBadge: {
    position: 'absolute',
    top: SPACING.base,
    right: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent.primary}20`,
    borderRadius: SPACING.radius.base,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  
  enhancementText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.accent.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.xs,
  },
});