import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import colors from '@/constants/colors';
import { TrendingUp, Target, Heart, Calendar } from 'lucide-react-native';
import { useMemo } from 'react';

export default function ProgressScreen() {
  const { cravings, streak, shouldShowStreaks, resumeStreak } = useApp();

  const stats = useMemo(() => {
    const total = cravings.length;
    const resisted = cravings.filter(c => c.outcome === 'resisted').length;
    const smallPortion = cravings.filter(c => c.outcome === 'small-portion').length;
    const gaveIn = cravings.filter(c => c.outcome === 'gave-in').length;
    const withDelay = cravings.filter(c => c.delayUsed).length;

    const last7Days = cravings.filter(c => {
      const daysDiff = (Date.now() - c.timestamp) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });

    const emotionCounts = cravings.reduce((acc, c) => {
      acc[c.emotion] = (acc[c.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      total,
      resisted,
      smallPortion,
      gaveIn,
      withDelay,
      last7DaysCount: last7Days.length,
      resistanceRate: total > 0 ? Math.round((resisted / total) * 100) : 0,
      awarenessRate: total > 0 ? Math.round(((resisted + smallPortion) / total) * 100) : 0,
      topEmotion: topEmotion ? topEmotion[0] : 'N/A',
    };
  }, [cravings]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <TrendingUp size={40} color={colors.primary} />
          <Text style={styles.heroNumber}>{stats.awarenessRate}%</Text>
          <Text style={styles.heroLabel}>Awareness Rate</Text>
          <Text style={styles.heroSubtext}>Moments you paused or made a mindful choice</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.calm.peachLight }]}>
              <Target size={24} color={colors.secondary} />
            </View>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Cravings</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.calm.sage }]}>
              <Heart size={24} color={colors.success} />
            </View>
            <Text style={styles.statNumber}>{stats.resisted}</Text>
            <Text style={styles.statLabel}>Resisted</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.calm.cream }]}>
              <Calendar size={24} color={colors.warning} />
            </View>
            <Text style={styles.statNumber}>{stats.last7DaysCount}</Text>
            <Text style={styles.statLabel}>Last 7 Days</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.calm.tealLight }]}>
              <TrendingUp size={24} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{shouldShowStreaks ? streak.longest : '—'}</Text>
            <Text style={styles.statLabel}>{shouldShowStreaks ? 'Best Streak' : 'Paused'}</Text>
          </View>
        </View>

        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Learning Insights</Text>
          
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Most Common Emotion</Text>
            <Text style={styles.insightValue}>{stats.topEmotion}</Text>
          </View>

          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Used Delay Technique</Text>
            <Text style={styles.insightValue}>{stats.withDelay} times</Text>
          </View>

          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Gave In (Learning Data)</Text>
            <Text style={styles.insightValue}>{stats.gaveIn}</Text>
          </View>
        </View>

        {!shouldShowStreaks && (
          <TouchableOpacity
            style={styles.resumeButton}
            onPress={resumeStreak}
          >
            <Text style={styles.resumeButtonText}>Resume Tracking Streaks</Text>
          </TouchableOpacity>
        )}

        {cravings.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptySubtitle}>
              Start logging your cravings to see insights and progress
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  heroNumber: {
    fontSize: 72,
    fontWeight: '800' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  heroSubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  insightsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  insightLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  resumeButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  resumeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.surface,
  },
});
