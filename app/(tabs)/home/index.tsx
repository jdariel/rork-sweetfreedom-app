import { router } from 'expo-router';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Platform, AccessibilityInfo } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { useRewards } from '@/contexts/RewardsContext';
import colors from '@/constants/colors';
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import CircleButton from '@/components/CircleButton';

export default function HomeScreen() {
  const { clearCoachConversation, profile, incrementBreathsCompleted } = useApp();
  const { awardXP } = useRewards();
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [phaseTimer, setPhaseTimer] = useState(0);
  const [totalTime, setTotalTime] = useState(60);
  const [hasCheckedComeback, setHasCheckedComeback] = useState(false);
  const [breathingLineIndex, setBreathingLineIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const breathingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const circleScale = useRef(new Animated.Value(0.5)).current;

  const breathingLines = [
    'Inhale...',
    'Hold...',
    'Exhale...',
    'Nothing to fix.',
    'Just breathing.',
  ];

  useEffect(() => {
    if (!hasCheckedComeback) {
      awardXP('comeback-24h', profile?.isInDistressMode || false, profile?.lastActiveDate);
      setHasCheckedComeback(true);
    }
  }, [hasCheckedComeback, awardXP, profile?.isInDistressMode, profile?.lastActiveDate]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      setReducedMotion(enabled);
    }).catch(() => {});
  }, []);

  const animateCircle = useCallback((toValue: number) => {
    if (reducedMotion) {
      circleScale.setValue(toValue);
      return;
    }
    Animated.spring(circleScale, {
      toValue,
      useNativeDriver: true,
      tension: 20,
      friction: 7,
    }).start();
  }, [reducedMotion, circleScale]);

  useEffect(() => {
    if (showBreathing && totalTime > 0) {
      breathingTimerRef.current = setTimeout(() => {
        setTotalTime((prev) => prev - 1);
        setPhaseTimer((prev) => {
          if (prev <= 1) {
            if (breathingPhase === 'inhale') {
              setBreathingPhase('hold');
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }
              animateCircle(0.7);
              setBreathingLineIndex(1);
              return 2;
            } else if (breathingPhase === 'hold') {
              setBreathingPhase('exhale');
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }
              animateCircle(0.3);
              const nextLine = (breathingLineIndex + 1) % 5;
              setBreathingLineIndex(nextLine);
              return 6;
            } else {
              setBreathingPhase('inhale');
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }
              animateCircle(1);
              const nextLine = (breathingLineIndex + 1) % 5;
              setBreathingLineIndex(nextLine);
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (breathingTimerRef.current) {
        clearTimeout(breathingTimerRef.current);
      }
    };
  }, [showBreathing, totalTime, breathingPhase, phaseTimer, breathingLineIndex, animateCircle]);

  const handleTap = () => {
    console.log('[Home] handleTap called - navigating to coach');
    clearCoachConversation().catch(err => 
      console.error('[Home] Failed to clear coach conversation:', err)
    );
    console.log('[Home] Calling router.push to /coach');
    router.push('/coach');
  };

  const handleLongPress = () => {
    console.log('[Home] handleLongPress called - showing breathing modal');
    setShowBreathing(true);
    setBreathingPhase('inhale');
    setPhaseTimer(4);
    setTotalTime(60);
    setBreathingLineIndex(0);
    animateCircle(1);
  };

  const closeBreathing = () => {
    setShowBreathing(false);
    setBreathingPhase('inhale');
    setPhaseTimer(4);
    setTotalTime(60);
    setBreathingLineIndex(0);
    circleScale.setValue(0.5);
    if (breathingTimerRef.current) {
      clearTimeout(breathingTimerRef.current);
    }
  };

  const handleBreathingDone = () => {
    awardXP('complete-1min-pause', profile?.isInDistressMode || false, profile?.lastActiveDate);
    incrementBreathsCompleted();
    closeBreathing();
  };

  const handleTalkToLess = async () => {
    awardXP('complete-1min-pause', profile?.isInDistressMode || false, profile?.lastActiveDate);
    incrementBreathsCompleted();
    closeBreathing();
    await clearCoachConversation();
    router.push('/coach');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.instruction}>When a moment shows up, tap.</Text>
        
        <View style={styles.circleContainer}>
          <CircleButton onPress={handleTap} onLongPress={handleLongPress} />
        </View>

        <Text style={styles.subtitle}>No logging required.</Text>
        <Text style={styles.hint}>Long-press to breathe.</Text>
      </View>

      <Modal
        visible={showBreathing}
        transparent
        animationType="fade"
        onRequestClose={closeBreathing}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.breathingModal}>
            {totalTime > 0 ? (
              <>
                <Text style={styles.breathingInstruction}>
                  {breathingLines[breathingLineIndex]}
                </Text>
                <View style={styles.breathingCircleContainer}>
                  <Animated.View
                    style={[
                      styles.breathingCircle,
                      {
                        transform: [{ scale: circleScale }],
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${((60 - totalTime) / 60) * 100}%` },
                    ]}
                  />
                </View>
              </>
            ) : (
              <View style={styles.completeActions}>
                <Text style={styles.breathingTitle}>Nice. How do you want to continue?</Text>
                <TouchableOpacity style={styles.actionButton} onPress={handleTalkToLess}>
                  <Text style={styles.actionButtonText}>Talk to Less</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={handleBreathingDone}
                >
                  <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                    Not now
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  instruction: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
    letterSpacing: 0.3,
  },
  circleContainer: {
    marginVertical: 32,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 48,
    marginBottom: 16,
  },
  hint: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textLight,
    textAlign: 'center',
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  breathingModal: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 40,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  breathingTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },

  breathingInstruction: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 48,
    minHeight: 36,
  },
  breathingCircleContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  breathingCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.calm.teal,
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  completeActions: {
    width: '100%',
    alignItems: 'center',
  },
  completeText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  actionButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  actionButtonTextSecondary: {
    color: colors.textSecondary,
  },
});
