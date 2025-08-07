import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { decisionsAPI } from '../services/api';
import { COLORS, TYPOGRAPHY, SPACING } from '../styles/theme';
import GlassCard from '../components/GlassCard';
import FilterBar from '../components/FilterBar';
import DecisionCard from '../components/DecisionCard';

export default function DecisionJournal() {
  const [decisions, setDecisions] = useState([]);
  const [filteredDecisions, setFilteredDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [error, setError] = useState(null);

  // Load decision history
  const loadDecisions = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await decisionsAPI.getHistory({
        limit: 100, // Load up to 100 recent decisions
        category: null, // Get all categories, filter client-side for better UX
      });

      const decisionsData = response.decisions || response || [];
      setDecisions(decisionsData);
      
    } catch (err) {
      console.error('Failed to load decisions:', err);
      setError('Failed to load decision history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Filter decisions based on selected filters
  const applyFilters = useCallback(() => {
    let filtered = [...decisions];

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(decision => {
        const category = decision.context?.category;
        return category === selectedCategory;
      });
    }

    // Apply mood filter
    if (selectedMood) {
      filtered = filtered.filter(decision => {
        const mood = decision.context?.mood;
        return mood && mood.toLowerCase() === selectedMood.toLowerCase();
      });
    }

    setFilteredDecisions(filtered);
  }, [decisions, selectedCategory, selectedMood]);

  // Load initial data
  useEffect(() => {
    loadDecisions();
  }, [loadDecisions]);

  // Apply filters when decisions or filter criteria change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    loadDecisions(true);
  }, [loadDecisions]);

  // Handle decision card press (for future navigation)
  const handleDecisionPress = useCallback((decision) => {
    // Could navigate to decision detail screen in the future
    console.log('Decision pressed:', decision.id);
  }, []);

  // Optimized FlatList item renderer
  const renderDecisionItem = useCallback(({ item }) => (
    <DecisionCard
      decision={item}
      onPress={() => handleDecisionPress(item)}
    />
  ), [handleDecisionPress]);

  // FlatList key extractor
  const keyExtractor = useCallback((item) => item.id.toString(), []);

  // Get item layout for better performance (approximate heights)
  const getItemLayout = useCallback((data, index) => ({
    length: 200, // Approximate height of collapsed card
    offset: 200 * index,
    index,
  }), []);

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <GlassCard style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Loading your decisions...</Text>
        </GlassCard>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <GlassCard style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color={COLORS.accent.error} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadDecisions()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    );
  }

  // Empty state
  const EmptyComponent = () => (
    <GlassCard style={styles.emptyContainer}>
      <Ionicons name="journal" size={80} color={COLORS.text.tertiary} />
      <Text style={styles.emptyTitle}>No decisions yet</Text>
      <Text style={styles.emptyText}>
        {selectedCategory || selectedMood
          ? 'No decisions match your current filters. Try adjusting your search criteria.'
          : 'Start making decisions to build your decision journal and track your patterns over time.'}
      </Text>
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <FilterBar
        selectedCategory={selectedCategory}
        selectedMood={selectedMood}
        onCategoryChange={setSelectedCategory}
        onMoodChange={setSelectedMood}
        totalCount={decisions.length}
        filteredCount={filteredDecisions.length}
      />

      {/* Decision List */}
      <FlatList
        data={filteredDecisions}
        renderItem={renderDecisionItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent.primary}
            colors={[COLORS.accent.primary]}
            progressBackgroundColor={COLORS.background.secondary}
          />
        }
        ListEmptyComponent={EmptyComponent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        contentContainerStyle={[
          styles.listContent,
          filteredDecisions.length === 0 && styles.listContentEmpty
        ]}
      />
      
      {/* Footer spacing for tab bar */}
      <View style={styles.footer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  
  // Loading state
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 80,
    marginBottom: 24,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    marginTop: SPACING.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  
  // Error state
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 80,
    marginBottom: 24,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
    marginBottom: SPACING.xl,
  },
  
  retryButton: {
    backgroundColor: COLORS.accent.primary,
    borderRadius: SPACING.radius.base,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  
  retryButtonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  
  // List styling
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 120, // Space for floating dock tab bar
  },
  
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 30,
    marginHorizontal: 20,
    marginVertical: 30,
  },
  
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.secondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
    opacity: 0.8,
  },
  
  footer: {
    height: 120, // Space for floating dock tab bar
  },
});