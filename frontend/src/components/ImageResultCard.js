import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function ImageResultCard({
  image,
  rank,
  isRecommended = false,
  isExpanded = false,
  onToggleExpand,
  style
}) {
  // Extract rank data - handle both object and number formats
  const rankData = typeof rank === 'number' ? { index: rank - 1, score: 0 } : (rank || {});
  const rankPosition = (rankData.index !== undefined ? rankData.index : 0) + 1; // Convert 0-based index to 1-based position
  const rankScore = rankData.score || 0;
  const rankReason = rankData.reason || '';
  const rankFactors = rankData.factors || {};
  const [fadeAnim] = useState(new Animated.Value(isExpanded ? 1 : 0));
  const [heightAnim] = useState(new Animated.Value(isExpanded ? 1 : 0));

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(heightAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: false, // Height animations can't use native driver
      }),
    ]).start();
  }, [isExpanded]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggleExpand && onToggleExpand();
  };

  const getRankColor = (position) => {
    switch (position) {
      case 1: return '#f59e0b'; // Gold
      case 2: return '#9ca3af'; // Silver
      case 3: return '#cd7c2f'; // Bronze
      default: return '#6b7280';
    }
  };

  const getRankIcon = (position) => {
    switch (position) {
      case 1: return 'trophy';
      case 2: return 'medal';
      case 3: return 'ribbon';
      default: return 'star';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return '#10b981'; // Green
    if (score >= 0.6) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getRecommendedBadgeColor = () => {
    return isRecommended ? '#10b981' : 'transparent';
  };

  // Animated height for expanded content
  const expandedHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120], // Approximate height of expanded content
  });

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isRecommended && styles.recommendedContainer,
        style
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Recommended Badge */}
      {isRecommended && (
        <View style={styles.recommendedBadge}>
          <Ionicons name="star" size={14} color="#fff" />
          <Text style={styles.recommendedText}>Recommended</Text>
        </View>
      )}

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: image.url || image.uri }} style={styles.image} />
          
          {/* Rank Badge */}
          <View style={[styles.rankBadge, { backgroundColor: getRankColor(rankPosition) }]}>
            <Ionicons 
              name={getRankIcon(rankPosition)} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.rankNumber}>{rankPosition}</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.headerRow}>
            <Text style={styles.label} numberOfLines={1}>
              {image.label || `Option ${rankPosition}`}
            </Text>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#6b7280"
            />
          </View>

          {/* Score Bar */}
          <View style={styles.scoreContainer}>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreFill,
                  {
                    width: `${(rankScore * 100) || 0}%`,
                    backgroundColor: getScoreColor(rankScore || 0),
                  },
                ]}
              />
            </View>
            <Text style={styles.scoreText}>
              {Math.round((rankScore || 0) * 100)}%
            </Text>
          </View>

          {/* Quick Reason Preview */}
          {!isExpanded && rankReason && (
            <Text style={styles.reasonPreview} numberOfLines={2}>
              {rankReason}
            </Text>
          )}
        </View>
      </View>

      {/* Expanded Content */}
      <Animated.View
        style={[
          styles.expandedContent,
          {
            height: expandedHeight,
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.expandedInner}>
          {/* Detailed Reasoning */}
          <View style={styles.reasoningSection}>
            <Text style={styles.reasoningTitle}>Why this ranking?</Text>
            <Text style={styles.reasoningText}>
              {rankReason || 'Smart analysis based on your context and preferences.'}
            </Text>
          </View>

          {/* Score Breakdown */}
          {rankFactors && Object.keys(rankFactors).length > 0 && (
            <View style={styles.factorsSection}>
              <Text style={styles.factorsTitle}>Analysis factors:</Text>
              <View style={styles.factorsList}>
                {Object.entries(rankFactors).map(([factor, score]) => (
                  <View key={factor} style={styles.factorItem}>
                    <Text style={styles.factorName}>
                      {factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                    <View style={styles.factorBar}>
                      <View
                        style={[
                          styles.factorFill,
                          {
                            width: `${score * 100}%`,
                            backgroundColor: getScoreColor(score),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.factorScore}>{Math.round(score * 100)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Expand Hint */}
      {!isExpanded && (
        <View style={styles.expandHint}>
          <Text style={styles.expandHintText}>Tap for details</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 8,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  recommendedContainer: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    zIndex: 1,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  mainContent: {
    flexDirection: 'row',
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  rankBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
  },
  rankNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginRight: 12,
  },
  scoreFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 35,
  },
  reasonPreview: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  expandedContent: {
    overflow: 'hidden',
  },
  expandedInner: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  reasoningSection: {
    marginBottom: 16,
  },
  reasoningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  reasoningText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  factorsSection: {
    marginBottom: 8,
  },
  factorsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  factorsList: {
    gap: 6,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  factorName: {
    fontSize: 11,
    color: '#9ca3af',
    width: 80,
  },
  factorBar: {
    flex: 1,
    height: 3,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    marginHorizontal: 8,
  },
  factorFill: {
    height: '100%',
    borderRadius: 2,
  },
  factorScore: {
    fontSize: 11,
    color: '#6b7280',
    minWidth: 30,
  },
  expandHint: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
  },
  expandHintText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});