import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import colors from '@/constants/colors';
import { TrendingUp, Target, Heart, Calendar, Clock, Smile, Zap, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { router } from 'expo-router';

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

    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    const timeOfDayCounts = cravings.reduce((acc, c) => {
      const hour = new Date(c.timestamp).getHours();
      let period: string;
      if (hour >= 6 && hour < 12) period = 'Morning';
      else if (hour >= 12 && hour < 18) period = 'Afternoon';
      else period = 'Night';
      acc[period] = (acc[period] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const peakTime = Object.entries(timeOfDayCounts)
      .sort((a, b) => b[1] - a[1])[0];

    const cravingsWithDelay = cravings.filter(c => 
      c.delayUsed && 
      typeof c.intensity === 'number' && 
      typeof c.postDelayIntensity === 'number'
    );

    const totalIntensityDrop = cravingsWithDelay.reduce((sum, c) => {
      return sum + (c.intensity - (c.postDelayIntensity || c.intensity));
    }, 0);

    const avgIntensityDrop = cravingsWithDelay.length > 0 
      ? Math.round(totalIntensityDrop / cravingsWithDelay.length)
      : 0;

    return {
      total,
      resisted,
      smallPortion,
      gaveIn,
      withDelay,
      last7DaysCount: last7Days.length,
      resistanceRate: total > 0 ? Math.round((resisted / total) * 100) : 0,
      awarenessRate: total > 0 ? Math.round(((resisted + smallPortion) / total) * 100) : 0,
      topEmotions,
      peakTime: peakTime ? peakTime[0] : null,
      avgIntensityDrop,
      delaySuccessRate: cravingsWithDelay.length,
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
          <Text style={styles.insightsTitle}>Smart Insights</Text>
          
          {stats.peakTime && (
            <View style={styles.insightRow}>
              <View style={styles.insightLeft}>
                <Clock size={20} color={colors.primary} style={styles.insightIcon} />
                <Text style={styles.insightLabel}>Peak Craving Time</Text>
              </View>
              <Text style={styles.insightValue}>{stats.peakTime}</Text>
            </View>
          )}

          {stats.topEmotions.length > 0 && (
            <View style={styles.insightRow}>
              <View style={styles.insightLeft}>
                <Smile size={20} color={colors.secondary} style={styles.insightIcon} />
                <Text style={styles.insightLabel}>Top Emotions</Text>
              </View>
              <Text style={styles.insightValue}>
                {stats.topEmotions.map((e, i) => e[0]).join(', ')}
              </Text>
            </View>
          )}

          {stats.delaySuccessRate > 0 && (
            <View style={styles.insightRow}>
              <View style={styles.insightLeft}>
                <Zap size={20} color={colors.success} style={styles.insightIcon} />
                <Text style={styles.insightLabel}>Avg. Intensity Drop</Text>
              </View>
              <Text style={styles.insightValue}>-{stats.avgIntensityDrop} pts</Text>
            </View>
          )}

          <View style={styles.insightRow}>
            <View style={styles.insightLeft}>
              <Text style={styles.insightLabel}>Used Delay Technique</Text>
            </View>
            <Text style={styles.insightValue}>{stats.withDelay} times</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.reflectionCard}
          onPress={() => router.push('/weekly-reflection')}
        >
          <View style={styles.reflectionIconContainer}>
            <Sparkles size={32} color={colors.secondary} />
          </View>
          <View style={styles.reflectionContent}>
            <Text style={styles.reflectionTitle}>Weekly Reflection</Text>
            <Text style={styles.reflectionDescription}>
              View your personalized insight cards
            </Text>
          </View>
        </TouchableOpacity>

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
  insightLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  insightIcon: {
    marginRight: 8,
  },
  insightLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    textTransform: 'capitalize' as const,
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
  reflectionCard: {
    backgroundColor: colors.calm.peachLight,
    borderRadius: 20,
    padding: 20,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  reflectionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  reflectionContent: {
    flex: 1,
  },
  reflectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  reflectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
