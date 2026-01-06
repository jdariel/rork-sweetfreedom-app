import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, Pressable, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { replacementSuggestions } from '@/constants/goalModes';
import { Clock, CheckCircle, X, MessageCircle, ThumbsUp, Smile, Brain, Star, EyeOff } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import * as Haptics from 'expo-haptics';

export default function DelayFlowScreen() {
  const { cravingId } = useLocalSearchParams<{ cravingId: string }>();
  const { updateCravingFeedback, updateCravingDelayUsed, updateCravingOutcome, updateCravingDelayData, profile, toggleFavoriteReplacement, toggleHiddenReplacement, addXP, triggerReward } = useApp();
  const [stage, setStage] = useState<'delay' | 'suggestions' | 'feedback' | 'outcome' | 'complete'>('delay');
  const [countdown, setCountdown] = useState<number>(300);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [breathingCount, setBreathingCount] = useState<number>(0);
  const [breathingScale] = useState(new Animated.Value(1));
  const [postDelayIntensity, setPostDelayIntensity] = useState<number>(5);
  const [whatHelped, setWhatHelped] = useState<string>('');
  const [isHoldingCircle, setIsHoldingCircle] = useState<boolean>(false);
  const engagementStartTime = useRef<number>(0);
  const totalEngagementTime = useRef<number>(0);
  const delayStartTime = useRef<number>(Date.now());

  useEffect(() => {
    if (stage === 'delay' && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [stage, countdown]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
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
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useEffect(() => {
    if (stage !== 'delay') return;

    const breathingCycle = Animated.sequence([
      Animated.timing(breathingScale, {
        toValue: 1.4,
        duration: 4000,
        useNativeDriver: true,
      }),
      Animated.timing(breathingScale, {
        toValue: 1.4,
        duration: 4000,
        useNativeDriver: true,
      }),
      Animated.timing(breathingScale, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      }),
      Animated.timing(breathingScale, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]);

    const phaseTimer = setInterval(() => {
      setBreathingPhase((prev) => {
        if (prev === 'inhale') return 'hold';
        if (prev === 'hold') return 'exhale';
        if (prev === 'exhale') return 'rest';
        setBreathingCount((c) => c + 1);
        return 'inhale';
      });
    }, 4000);

    const loop = Animated.loop(breathingCycle);
    loop.start();

    return () => {
      loop.stop();
      clearInterval(phaseTimer);
    };
  }, [stage, breathingScale]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSuggestionTap = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const delayEndTime = Date.now();
    const delayDuration = Math.floor((delayEndTime - delayStartTime.current) / 1000);
    const engagementSec = Math.floor(totalEngagementTime.current / 1000);
    
    if (cravingId) {
      updateCravingDelayUsed(cravingId);
      updateCravingDelayData(cravingId, {
        delayStartedAt: delayStartTime.current,
        delayCompletedAt: delayEndTime,
        delayDurationSec: delayDuration,
        stabilizerEngagementSec: engagementSec,
      });
    }
    console.log('Delay completed:', delayDuration, 'sec, Engagement:', engagementSec, 'sec');
    setStage('feedback');
  };

  const handleBreathingCirclePressIn = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsHoldingCircle(true);
    engagementStartTime.current = Date.now();
  };

  const handleBreathingCirclePressOut = () => {
    if (isHoldingCircle && engagementStartTime.current > 0) {
      const engagementDuration = Date.now() - engagementStartTime.current;
      totalEngagementTime.current += engagementDuration;
      console.log('Engagement time:', engagementDuration, 'Total:', totalEngagementTime.current);
    }
    setIsHoldingCircle(false);
  };

  const visibleSuggestions = useMemo(() => {
    const hidden = profile?.hiddenReplacements || [];
    const favorites = profile?.favoriteReplacements || [];
    
    const filtered = replacementSuggestions.filter(s => !hidden.includes(s.id));
    
    return filtered.sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  }, [profile?.hiddenReplacements, profile?.favoriteReplacements]);

  const isFavorite = (id: string) => {
    return profile?.favoriteReplacements?.includes(id) || false;
  };

  const handleFeedbackSubmit = () => {
    if (cravingId) {
      updateCravingFeedback(cravingId, postDelayIntensity, whatHelped || undefined);
    }
    addXP('reflection');
    setStage('outcome');
  };

  const handleOutcomeSelect = (outcome: 'resisted' | 'small-portion' | 'gave-in') => {
    if (cravingId) {
      updateCravingOutcome(cravingId, outcome);
    }
    addXP('delay-complete');
    triggerReward('delay-complete');
    setStage('complete');
    setTimeout(() => {
      router.back();
    }, 2000);
  };

  if (stage === 'outcome') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>What Happened?</Text>
        </View>

        <View style={styles.outcomeContainer}>
          <Text style={styles.outcomeSubtitle}>
            Let&apos;s record what happened. This helps track your progress.
          </Text>

          <TouchableOpacity
            style={[styles.outcomeCard, styles.resistedCard]}
            onPress={() => handleOutcomeSelect('resisted')}
            onPressIn={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }
            }}
          >
            <View style={styles.outcomeIconContainer}>
              <ThumbsUp size={32} color={colors.success} />
            </View>
            <View style={styles.outcomeTextContainer}>
              <Text style={styles.outcomeTitle}>Resisted</Text>
              <Text style={styles.outcomeDescription}>I didn&apos;t give in to the craving</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.outcomeCard, styles.smallPortionCard]}
            onPress={() => handleOutcomeSelect('small-portion')}
            onPressIn={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
            }}
          >
            <View style={styles.outcomeIconContainer}>
              <Smile size={32} color={colors.warning} />
            </View>
            <View style={styles.outcomeTextContainer}>
              <Text style={styles.outcomeTitle}>Small Portion</Text>
              <Text style={styles.outcomeDescription}>I had a little bit mindfully</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.outcomeCard, styles.gaveInCard]}
            onPress={() => handleOutcomeSelect('gave-in')}
            onPressIn={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <View style={styles.outcomeIconContainer}>
              <Brain size={32} color={colors.textSecondary} />
            </View>
            <View style={styles.outcomeTextContainer}>
              <Text style={styles.outcomeTitle}>Gave In</Text>
              <Text style={styles.outcomeDescription}>Learning data - no judgment</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (stage === 'complete') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.completeContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <CheckCircle size={80} color={colors.success} />
          </Animated.View>
          <Text style={styles.completeTitle}>Great Job!</Text>
          <Text style={styles.completeSubtitle}>You took a moment for yourself</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (stage === 'suggestions') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Try These Instead</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.suggestionsScrollView}
          contentContainerStyle={styles.suggestionsContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.suggestionsSubtitle}>
            These activities can help redirect your focus
          </Text>
          {visibleSuggestions.map((suggestion) => (
            <View key={suggestion.id} style={styles.suggestionCardWrapper}>
              <TouchableOpacity
                style={[styles.suggestionCard, isFavorite(suggestion.id) && styles.suggestionCardFavorite]}
                onPress={handleSuggestionTap}
              >
                <View style={styles.suggestionEmojiContainer}>
                  <Text style={styles.suggestionEmoji}>{suggestion.emoji}</Text>
                </View>
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.suggestionActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => toggleFavoriteReplacement(suggestion.id)}
                >
                  <Star
                    size={20}
                    color={isFavorite(suggestion.id) ? colors.warning : colors.textLight}
                    fill={isFavorite(suggestion.id) ? colors.warning : 'transparent'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => toggleHiddenReplacement(suggestion.id)}
                >
                  <EyeOff size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.skipButton} onPress={() => setStage('feedback')}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (stage === 'feedback') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Quick Check-In</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.feedbackContainer}>
          <View style={styles.feedbackIconContainer}>
            <MessageCircle size={40} color={colors.primary} />
          </View>

          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackQuestion}>How strong is the craving now?</Text>
            <View style={styles.intensityButtons}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.intensityButton,
                    postDelayIntensity === num && styles.intensityButtonSelected
                  ]}
                  onPress={() => setPostDelayIntensity(num)}
                >
                  <Text style={[
                    styles.intensityButtonText,
                    postDelayIntensity === num && styles.intensityButtonTextSelected
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackQuestion}>What helped (if anything)?</Text>
            <TextInput
              style={styles.feedbackInput}
              placeholder="e.g., breathing exercise, distraction..."
              placeholderTextColor={colors.textLight}
              value={whatHelped}
              onChangeText={setWhatHelped}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleFeedbackSubmit}
            onPressIn={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
            }}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Take a Moment</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.delayContainer}>
        <Text style={styles.timerText}>{formatTime(countdown)}</Text>
        
        <Pressable
          onPressIn={handleBreathingCirclePressIn}
          onPressOut={handleBreathingCirclePressOut}
          style={styles.breathingCircleContainer}
        >
          <Animated.View
            style={[
              styles.breathingCircle,
              { 
                transform: [{ scale: breathingScale }],
                backgroundColor: isHoldingCircle ? colors.primary : colors.calm.tealLight,
              },
            ]}
          >
            <View style={styles.breathingCircleInner}>
              <Clock size={32} color={isHoldingCircle ? colors.surface : colors.primary} />
            </View>
          </Animated.View>
        </Pressable>

        <View style={styles.breathingInstructions}>
          <Text style={styles.breathingPhaseText}>
            {breathingPhase === 'inhale' && 'Breathe In...'}
            {breathingPhase === 'hold' && 'Hold...'}
            {breathingPhase === 'exhale' && 'Breathe Out...'}
            {breathingPhase === 'rest' && 'Rest...'}
          </Text>
          <Text style={styles.breathingCycleText}>
            {breathingCount > 0 && `${breathingCount} cycle${breathingCount > 1 ? 's' : ''} completed`}
          </Text>
          {totalEngagementTime.current > 0 && (
            <Text style={styles.engagementText}>
              Engaged: {Math.floor(totalEngagementTime.current / 1000)}s
            </Text>
          )}
        </View>

        <Text style={styles.delaySubtitle}>
          Hold the circle and breathe with it.{'\n'}Each second you hold adds to your control.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            if (cravingId) {
              updateCravingDelayUsed(cravingId);
            }
            addXP('delay-start');
            setStage('suggestions');
          }}
          onPressIn={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={() => setStage('feedback')}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
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
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  delayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  breathingCircleContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.calm.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  breathingCircleInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingInstructions: {
    alignItems: 'center',
    marginBottom: 24,
  },
  breathingPhaseText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.primary,
    marginBottom: 8,
  },
  breathingCycleText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  engagementText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  delaySubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 48,
  },
  suggestionsScrollView: {
    flex: 1,
  },
  suggestionsContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  suggestionsSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  suggestionCardWrapper: {
    marginBottom: 16,
  },
  suggestionCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    borderWidth: 2,
    borderColor: colors.border,
  },
  suggestionCardFavorite: {
    borderColor: colors.warning,
    backgroundColor: colors.calm.tealLight,
  },
  suggestionEmojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionEmoji: {
    fontSize: 32,
  },
  suggestionTextContainer: {
    flex: 1,
    paddingTop: 4,
  },
  suggestionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 6,
    lineHeight: 22,
  },
  suggestionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  suggestionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  feedbackContainer: {
    flex: 1,
    padding: 20,
  },
  feedbackIconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  feedbackSection: {
    marginBottom: 32,
  },
  feedbackQuestion: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  intensityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intensityButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.calm.tealLight,
  },
  intensityButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  intensityButtonTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700' as const,
  },
  feedbackInput: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  outcomeContainer: {
    flex: 1,
    padding: 20,
  },
  outcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    lineHeight: 24,
  },
  outcomeCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  resistedCard: {
    borderColor: colors.success,
  },
  smallPortionCard: {
    borderColor: colors.warning,
  },
  gaveInCard: {
    borderColor: colors.border,
  },
  outcomeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  outcomeTextContainer: {
    flex: 1,
  },
  outcomeTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  outcomeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
