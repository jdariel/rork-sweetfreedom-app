import { router } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { X, Sparkles, Clock, Smile, Heart, TrendingDown } from 'lucide-react-native';
import { WeeklyInsight } from '@/types';

interface FlippableCardProps {
  title: string;
  frontContent: string;
  backContent: string;
  icon: ReactNode;
  isFlipped: boolean;
  onFlip: () => void;
}

function FlippableCard({ title, frontContent, backContent, icon, isFlipped, onFlip }: FlippableCardProps) {
  const [flipAnim] = useState(new Animated.Value(0));

  const flipCard = () => {
    onFlip();
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 90, 90.01, 180],
    outputRange: [1, 0, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 90, 90.01, 180],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <TouchableOpacity onPress={flipCard} activeOpacity={0.9} style={styles.cardContainer}>
      <Animated.View
        style={[
          styles.card,
          styles.cardFront,
          { transform: [{ rotateY: frontInterpolate }], opacity: frontOpacity },
        ]}
      >
        <View style={styles.cardIconContainer}>{icon}</View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardContent}>{frontContent}</Text>
        <Text style={styles.cardHint}>Tap to flip</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          { transform: [{ rotateY: backInterpolate }], opacity: backOpacity },
        ]}
      >
        <Text style={styles.cardBackTitle}>Suggestion</Text>
        <Text style={styles.cardBackContent}>{backContent}</Text>
        <Text style={styles.cardHint}>Tap to flip back</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function WeeklyReflectionScreen() {
  const { cravings, profile, triggerReward, addXP } = useApp();
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [hasOpenedDeck, setHasOpenedDeck] = useState(false);

  const weeklyInsight = useMemo<WeeklyInsight>(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const weekCravings = cravings.filter(c => c.timestamp >= sevenDaysAgo);

    const emotionCounts = weekCravings.reduce((acc, c) => {
      acc[c.emotion] = (acc[c.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2) as [string, number][];

    const timeOfDayCounts = weekCravings.reduce((acc, c) => {
      const hour = new Date(c.timestamp).getHours();
      let period: string;
      if (hour >= 6 && hour < 12) period = 'Morning';
      else if (hour >= 12 && hour < 18) period = 'Afternoon';
      else period = 'Night';
      acc[period] = (acc[period] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const peakTime = Object.entries(timeOfDayCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    const whatHelpedCounts = weekCravings.reduce((acc, c) => {
      if (c.delayUsed) acc.delay = (acc.delay || 0) + 1;
      if (c.whatHelped?.toLowerCase().includes('coach')) acc.coach = (acc.coach || 0) + 1;
      if (c.whatHelped?.toLowerCase().includes('replac')) acc.replacement = (acc.replacement || 0) + 1;
      if (c.whatHelped?.toLowerCase().includes('breath')) acc.breathing = (acc.breathing || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const whatHelpedMost = Object.entries(whatHelpedCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'delay';

    const cravingsWithDelay = weekCravings.filter(c =>
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

    const delaySuccessRate = weekCravings.length > 0
      ? Math.round((cravingsWithDelay.length / weekCravings.length) * 100)
      : 0;

    return {
      topEmotions,
      peakTime,
      whatHelpedMost,
      delaySuccessRate,
      avgIntensityDrop,
      totalMoments: weekCravings.length,
    };
  }, [cravings]);

  useEffect(() => {
    if (!hasOpenedDeck && weeklyInsight.totalMoments > 0) {
      addXP('weekly-deck-open', 'Opened weekly reflection');
      setHasOpenedDeck(true);
    }
  }, [hasOpenedDeck, weeklyInsight.totalMoments, addXP]);

  const toggleCardFlip = (index: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      
      const totalCards = weeklyInsight.avgIntensityDrop > 0 ? 4 : 3;
      if (newSet.size === totalCards) {
        addXP('weekly-deck-complete', 'Flipped all reflection cards');
      }
      
      return newSet;
    });
  };

  const handleComplete = () => {
    addXP('weekly-highlight-save', 'Saved weekly highlights');
    
    if (profile) {
      const lastViewed = profile.weeklyReflectionLastViewed || 0;
      const daysSinceViewed = (Date.now() - lastViewed) / (1000 * 60 * 60 * 24);
      
      if (daysSinceViewed >= 6) {
        triggerReward('weekly-reflection');
      }
    }
    router.back();
  };

  if (weeklyInsight.totalMoments === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Weekly Reflection</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Sparkles size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>Not enough data yet</Text>
          <Text style={styles.emptySubtitle}>
            Log a few more moments this week to see your reflection deck
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Weekly Reflection</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Sparkles size={40} color={colors.secondary} />
          <Text style={styles.introTitle}>Weekly Deck</Text>
          <Text style={styles.introSubtitle}>
            {weeklyInsight.totalMoments} moments this week
          </Text>
          <Text style={styles.introDescription}>
            Tap each card to see what patterns emerged and what to try next
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          <FlippableCard
            title="Your Main Trigger"
            frontContent={
              weeklyInsight.topEmotions.length > 0
                ? `Most moments started with: ${weeklyInsight.topEmotions.map(([emotion]) => emotion).join(' & ')}`
                : 'Various emotions'
            }
            backContent={`Next time ${weeklyInsight.topEmotions[0]?.[0] || 'this emotion'} shows up, try a 60-second pause first.`}
            icon={<Smile size={32} color={colors.secondary} />}
            isFlipped={flippedCards.has(0)}
            onFlip={() => toggleCardFlip(0)}
          />

          <FlippableCard
            title="Your Peak Time"
            frontContent={`Peak moment time: ${weeklyInsight.peakTime}`}
            backContent={`Let's plan a tiny reset at ${weeklyInsight.peakTime.toLowerCase()}: breathe, stretch, or step outside.`}
            icon={<Clock size={32} color={colors.primary} />}
            isFlipped={flippedCards.has(1)}
            onFlip={() => toggleCardFlip(1)}
          />

          <FlippableCard
            title="What Helped"
            frontContent={`The biggest calm-maker: ${weeklyInsight.whatHelpedMost.charAt(0).toUpperCase() + weeklyInsight.whatHelpedMost.slice(1)}`}
            backContent={`Let's use ${weeklyInsight.whatHelpedMost} sooner next time — before the craving gets loud.`}
            icon={<Heart size={32} color={colors.success} />}
            isFlipped={flippedCards.has(2)}
            onFlip={() => toggleCardFlip(2)}
          />

          {weeklyInsight.avgIntensityDrop > 0 && (
            <FlippableCard
              title="Intensity Drop"
              frontContent={`-${weeklyInsight.avgIntensityDrop} points average`}
              backContent="That tool works. Keep it simple."
              icon={<TrendingDown size={32} color={colors.success} />}
              isFlipped={flippedCards.has(3)}
              onFlip={() => toggleCardFlip(3)}
            />
          )}
        </View>

        <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
          <Text style={styles.completeButtonText}>Save Highlights</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Check back next week for fresh insights
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
    marginBottom: 12,
  },
  introDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  cardsContainer: {
    gap: 20,
    marginBottom: 32,
  },
  cardContainer: {
    height: 220,
  },
  card: {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardFront: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cardBack: {
    backgroundColor: colors.calm.tealLight,
    borderWidth: 2,
    borderColor: colors.success,
  },
  cardIconContainer: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    marginBottom: 12,
    textAlign: 'center',
  },
  cardContent: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  cardHint: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic' as const,
  },
  cardBackTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.success,
    textTransform: 'uppercase' as const,
    marginBottom: 16,
  },
  cardBackContent: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 28,
  },
  completeButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
