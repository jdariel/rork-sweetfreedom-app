import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { goalModeData } from '@/constants/goalModes';
import colors from '@/constants/colors';
import { Plus, Flame, Target, Clock, TrendingUp, Heart, Sparkles } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import MomentCard from '@/components/MomentCard';
import RewardModal from '@/components/RewardModal';

export default function HomeScreen() {
  const { profile, streak, todayCravings, resistedToday, shouldShowStreaks, getXPProgress, cravings, pendingReward, dismissReward } = useApp();
  const [pulseAnim] = useState(new Animated.Value(1));

  const recentMoments = cravings.slice(-5).reverse();

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const goalData = profile ? goalModeData[profile.goalMode] : null;
  const xpProgress = getXPProgress();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {profile && (
          <View style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <View style={styles.levelIconContainer}>
                <Sparkles size={20} color={colors.secondary} />
              </View>
              <View style={styles.levelInfo}>
                <Text style={styles.levelLabel}>Control Level</Text>
                <Text style={styles.levelNumber}>Level {profile.level}</Text>
              </View>
            </View>
            <View style={styles.xpBarContainer}>
              <View style={styles.xpBar}>
                <View style={[styles.xpBarFill, { width: `${xpProgress.percentage}%` }]} />
              </View>
              <Text style={styles.xpText}>
                {xpProgress.current} / {xpProgress.needed} XP
              </Text>
            </View>
          </View>
        )}

        {shouldShowStreaks ? (
          <View style={styles.streakCard}>
            <Animated.View style={[styles.streakIconContainer, { transform: [{ scale: pulseAnim }] }]}>
              <Flame size={48} color={colors.secondary} />
            </Animated.View>
            <Text style={styles.streakNumber}>{streak.current}</Text>
            <Text style={styles.streakLabel}>Calm Streak</Text>
            <Text style={styles.streakSubtext}>Best run: {streak.longest} days</Text>
          </View>
        ) : (
          <View style={styles.pausedCard}>
            <Heart size={40} color={colors.primary} />
            <Text style={styles.pausedTitle}>Taking a Breath</Text>
            <Text style={styles.pausedSubtext}>Your streak is resting. It&apos;ll be ready when you are.</Text>
          </View>
        )}

        {goalData && (
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalEmoji}>{goalData.emoji}</Text>
              <View style={styles.goalTextContainer}>
                <Text style={styles.goalLabel}>Your Goal</Text>
                <Text style={styles.goalTitle}>{goalData.title}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Target size={24} color={colors.primary} />
            <Text style={styles.todayTitle}>Today</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{todayCravings.length}</Text>
              <Text style={styles.statLabel}>Moments</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statNumberSuccess]}>{resistedToday}</Text>
              <Text style={styles.statLabel}>Resisted</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/log-craving')}
            activeOpacity={0.7}
          >
            <View style={styles.actionContent}>
              <View style={[styles.actionIcon, { backgroundColor: colors.calm.peachLight }]}>
                <Clock size={24} color={colors.secondary} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Handle a Moment</Text>
                <Text style={styles.actionDescription}>Track what you&apos;re feeling right now</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/progress')}
            activeOpacity={0.7}
          >
            <View style={styles.actionContent}>
              <View style={[styles.actionIcon, { backgroundColor: colors.calm.tealLight }]}>
                <TrendingUp size={24} color={colors.primary} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>View Progress</Text>
                <Text style={styles.actionDescription}>See your insights and patterns</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {recentMoments.length > 0 && (
          <View style={styles.momentsSection}>
            <Text style={styles.sectionTitle}>Recent Moments</Text>
            {recentMoments.map((moment) => (
              <MomentCard key={moment.id} craving={moment} showDetails={false} />
            ))}
          </View>
        )}
      </ScrollView>

      <RewardModal 
        reward={pendingReward}
        visible={!!pendingReward}
        onDismiss={dismissReward}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/log-craving')}
        activeOpacity={0.8}
      >
        <Plus size={28} color={colors.surface} strokeWidth={3} />
      </TouchableOpacity>
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
    paddingBottom: 100,
  },
  streakCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  streakIconContainer: {
    marginBottom: 16,
  },
  streakNumber: {
    fontSize: 64,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
  },
  streakLabel: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  streakSubtext: {
    fontSize: 14,
    color: colors.textLight,
  },
  pausedCard: {
    backgroundColor: colors.calm.tealLight,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  pausedTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  pausedSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  levelCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.calm.peachLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    marginBottom: 2,
  },
  levelNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  xpBarContainer: {
    gap: 8,
  },
  xpBar: {
    height: 12,
    backgroundColor: colors.background,
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 6,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  goalCard: {
    backgroundColor: colors.calm.tealLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.primaryDark,
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  todayCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  statNumberSuccess: {
    color: colors.success,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  quickActions: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  momentsSection: {
    marginBottom: 16,
  },
  fab: {
    position: 'absolute' as const,
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
