import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { decisionsAPI } from '../services/api';

const CATEGORY_ICONS = {
  food: 'restaurant',
  clothing: 'shirt',
  activity: 'bicycle',
  work: 'briefcase',
  social: 'people',
  other: 'apps',
};

export default function HistoryScreen() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      const [decisionsData, statsData] = await Promise.all([
        decisionsAPI.getHistory({ category: filter }),
        decisionsAPI.getStats(),
      ]);
      setDecisions(decisionsData.decisions);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderDecisionItem = ({ item }) => {
    const category = item.context?.category || 'other';
    const date = new Date(item.created_at);
    
    return (
      <View style={styles.decisionCard}>
        <View style={styles.decisionHeader}>
          <View style={styles.categoryIcon}>
            <Ionicons name={CATEGORY_ICONS[category]} size={24} color="#6366f1" />
          </View>
          <View style={styles.decisionInfo}>
            <Text style={styles.decisionQuestion} numberOfLines={2}>
              {item.question}
            </Text>
            <Text style={styles.decisionDate}>
              {format(date, 'MMM d, yyyy • h:mm a')}
            </Text>
          </View>
          {item.auto_decided && (
            <View style={styles.autoDecideBadge}>
              <Ionicons name="flash" size={16} color="#f59e0b" />
            </View>
          )}
        </View>
        <View style={styles.decisionContent}>
          <Text style={styles.decisionText} numberOfLines={3}>
            {item.final_decision}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {stats && (
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalDecisions}</Text>
            <Text style={styles.statLabel}>Total Decisions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.autoDecisionRate.toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Auto-Decide Rate</Text>
          </View>
        </View>
      )}

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, !filter && styles.filterButtonActive]}
            onPress={() => setFilter(null)}
          >
            <Text style={[styles.filterText, !filter && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          {Object.entries(CATEGORY_ICONS).map(([key, icon]) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterButton, filter === key && styles.filterButtonActive]}
              onPress={() => setFilter(key)}
            >
              <Ionicons
                name={icon}
                size={16}
                color={filter === key ? '#fff' : '#6366f1'}
                style={styles.filterIcon}
              />
              <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={decisions}
        renderItem={renderDecisionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#e5e7eb" />
            <Text style={styles.emptyText}>No decisions yet</Text>
            <Text style={styles.emptySubtext}>
              Start making decisions to see your history here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterSection: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
  },
  filterIcon: {
    marginRight: 5,
  },
  filterText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  decisionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  decisionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  decisionInfo: {
    flex: 1,
  },
  decisionQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  decisionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  autoDecideBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 6,
  },
  decisionContent: {
    paddingLeft: 52,
  },
  decisionText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});