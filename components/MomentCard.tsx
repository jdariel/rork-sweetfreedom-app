import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Craving, MomentCardState } from '@/types';
import colors from '@/constants/colors';
import { Heart, Clock, ThumbsUp, Smile, Brain, Zap, TrendingDown } from 'lucide-react-native';
import { useMemo, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';

interface MomentCardProps {
  craving: Craving;
  showDetails?: boolean;
}

const emotionEmojis: Record<string, string> = {
  stressed: '😰',
  bored: '😑',
  sad: '😢',
  happy: '😊',
  anxious: '😟',
  tired: '😴',
  celebratory: '🎉',
  other: '🤔',
};

const sweetTypeLabels: Record<string, string> = {
  chocolate: 'Chocolate',
  candy: 'Candy',
  'ice-cream': 'Ice Cream',
  cookies: 'Cookies',
  cake: 'Cake',
  pastry: 'Pastry',
  soda: 'Soda',
  other: 'Sweet',
};

export default function MomentCard({ craving, showDetails = false }: MomentCardProps) {
  const [glowAnim] = useState(new Animated.Value(0));

  const cardState: MomentCardState = useMemo(() => {
    if (craving.outcome) return 'settled';
    if (craving.delayUsed || craving.postDelayIntensity !== undefined) return 'cooling';
    return 'active';
  }, [craving]);

  useEffect(() => {
    if (cardState === 'settled') {
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
      ]).start();

      if (Platform.OS !== 'web' && craving.outcome === 'resisted') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [cardState, glowAnim, craving.outcome]);

  const cardColors = useMemo(() => {
    switch (cardState) {
      case 'active':
        return {
          bg: colors.calm.peachLight,
          border: colors.secondary,
          tagBg: colors.secondary,
          tagText: colors.surface,
        };
      case 'cooling':
        return {
          bg: colors.calm.tealLight,
          border: colors.primary,
          tagBg: colors.primary,
          tagText: colors.surface,
        };
      case 'settled':
        return {
          bg: colors.calm.sage,
          border: colors.success,
          tagBg: colors.success,
          tagText: colors.surface,
        };
    }
  }, [cardState]);

  const progressTag = useMemo(() => {
    if (cardState === 'settled') {
      if (craving.outcome === 'resisted') return 'Resisted';
      if (craving.outcome === 'small-portion') return 'Mindful Choice';
      if (craving.outcome === 'gave-in') return 'Learning Data';
    }
    if (cardState === 'cooling') return 'Cooling Down';
    return 'Active Moment';
  }, [cardState, craving.outcome]);

  const intensityDrop = useMemo(() => {
    if (craving.postDelayIntensity !== undefined && craving.intensity) {
      return craving.intensity - craving.postDelayIntensity;
    }
    return null;
  }, [craving]);

  const formattedTime = useMemo(() => {
    const date = new Date(craving.timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }, [craving.timestamp]);

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 0, 0, 0)', cardColors.border + '40'],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: cardColors.bg,
          borderColor: cardColors.border,
          shadowColor: glowColor,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.emotionContainer}>
          <Text style={styles.emotionEmoji}>{emotionEmojis[craving.emotion]}</Text>
          <Text style={styles.emotionLabel}>{craving.emotion}</Text>
        </View>
        <View style={[styles.progressTag, { backgroundColor: cardColors.tagBg }]}>
          <Text style={[styles.progressTagText, { color: cardColors.tagText }]}>
            {progressTag}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cravingType}>{sweetTypeLabels[craving.sweetType]}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formattedTime}</Text>
          </View>
          <View style={styles.metaItem}>
            <Zap size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>Intensity: {craving.intensity}/10</Text>
          </View>
        </View>
      </View>

      {showDetails && (
        <>
          {intensityDrop !== null && intensityDrop > 0 && (
            <View style={styles.detailRow}>
              <TrendingDown size={16} color={colors.success} />
              <Text style={styles.detailText}>
                Intensity dropped by {intensityDrop} points
              </Text>
            </View>
          )}

          {craving.delayUsed && (
            <View style={styles.detailRow}>
              <Heart size={16} color={colors.primary} />
              <Text style={styles.detailText}>Used pause technique</Text>
            </View>
          )}

          {craving.whatHelped && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>What helped:</Text>
              <Text style={styles.detailText}>{craving.whatHelped}</Text>
            </View>
          )}
        </>
      )}

      {cardState === 'settled' && craving.outcome && (
        <View style={styles.outcomeRow}>
          {craving.outcome === 'resisted' && (
            <>
              <ThumbsUp size={18} color={colors.success} />
              <Text style={[styles.outcomeText, { color: colors.success }]}>Victory!</Text>
            </>
          )}
          {craving.outcome === 'small-portion' && (
            <>
              <Smile size={18} color={colors.warning} />
              <Text style={[styles.outcomeText, { color: colors.warning }]}>Mindful</Text>
            </>
          )}
          {craving.outcome === 'gave-in' && (
            <>
              <Brain size={18} color={colors.textSecondary} />
              <Text style={[styles.outcomeText, { color: colors.textSecondary }]}>
                Data collected
              </Text>
            </>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emotionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emotionEmoji: {
    fontSize: 28,
  },
  emotionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    textTransform: 'capitalize' as const,
  },
  progressTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressTagText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  cardContent: {
    marginBottom: 8,
  },
  cravingType: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  outcomeText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
