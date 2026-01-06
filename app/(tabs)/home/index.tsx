import { router } from 'expo-router';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { useRewards } from '@/contexts/RewardsContext';
import colors from '@/constants/colors';
import { useState, useEffect, useRef } from 'react';
import CalmRewardModal from '@/components/CalmRewardModal';
import LevelUpModal from '@/components/LevelUpModal';
import CircleButton from '@/components/CircleButton';

export default function HomeScreen() {
  const { clearCoachConversation, profile } = useApp();
  const { pendingReward, pendingLevelUp, dismissPendingReward, dismissPendingLevelUp, awardXP, equipReward } = useRewards();
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [phaseTimer, setPhaseTimer] = useState(4);
  const [totalTime, setTotalTime] = useState(60);
  const [hasCheckedComeback, setHasCheckedComeback] = useState(false);
  const breathingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasCheckedComeback) {
      awardXP('comeback-24h', profile?.isInDistressMode || false, profile?.lastActiveDate);
      setHasCheckedComeback(true);
    }
  }, [hasCheckedComeback, awardXP, profile?.isInDistressMode, profile?.lastActiveDate]);

  useEffect(() => {
    if (showBreathing && totalTime > 0) {
      breathingTimerRef.current = setTimeout(() => {
        setTotalTime((prev) => prev - 1);
        setPhaseTimer((prev) => {
          if (prev <= 1) {
            if (breathingPhase === 'inhale') {
              setBreathingPhase('hold');
              return 4;
            } else if (breathingPhase === 'hold') {
              setBreathingPhase('exhale');
              return 4;
            } else {
              setBreathingPhase('inhale');
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
  }, [showBreathing, totalTime, breathingPhase, phaseTimer]);

  const handleTap = async () => {
    await clearCoachConversation();
    router.push('/coach');
  };

  const handleLongPress = () => {
    setShowBreathing(true);
    setBreathingPhase('inhale');
    setPhaseTimer(4);
    setTotalTime(60);
  };

  const closeBreathing = () => {
    setShowBreathing(false);
    setBreathingPhase('inhale');
    setPhaseTimer(4);
    setTotalTime(60);
    if (breathingTimerRef.current) {
      clearTimeout(breathingTimerRef.current);
    }
  };

  const handleBreathingDone = () => {
    awardXP('complete-1min-pause', profile?.isInDistressMode || false, profile?.lastActiveDate);
    closeBreathing();
  };

  const handleTalkToLess = async () => {
    closeBreathing();
    await clearCoachConversation();
    router.push('/coach');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Take a breath.</Text>
        
        <View style={styles.circleContainer}>
          <CircleButton onPress={handleTap} onLongPress={handleLongPress} />
        </View>

        <Text style={styles.subtitle}>Tap to talk to Less AI.</Text>
        <Text style={styles.hint}>Long-press for breathing exercise.</Text>
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
                <Text style={styles.breathingTimer}>{totalTime}s</Text>
                <Text style={styles.breathingInstruction}>
                  {breathingPhase === 'inhale' && 'Breathe in...'}
                  {breathingPhase === 'hold' && 'Hold...'}
                  {breathingPhase === 'exhale' && 'Breathe out...'}
                </Text>
                <View style={styles.breathingCircleContainer}>
                  <View
                    style={[
                      styles.breathingCircle,
                      breathingPhase === 'inhale' && styles.breathingCircleExpand,
                      breathingPhase === 'exhale' && styles.breathingCircleShrink,
                    ]}
                  />
                </View>
                <Text style={styles.phaseCounter}>{phaseTimer}</Text>
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
                <Text style={styles.breathingTitle}>Nice work.</Text>
                <Text style={styles.completeText}>
                  Want to talk to Less or save this as a moment?
                </Text>
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

      <CalmRewardModal 
        reward={pendingReward}
        visible={!!pendingReward}
        onDismiss={dismissPendingReward}
        onTryNow={() => {
          if (pendingReward) {
            equipReward(pendingReward.id);
          }
        }}
      />
      
      <LevelUpModal
        level={pendingLevelUp?.level || 0}
        reward={pendingLevelUp?.reward || null}
        visible={!!pendingLevelUp}
        onDismiss={dismissPendingLevelUp}
        onUseNow={() => {
          if (pendingLevelUp?.reward) {
            equipReward(pendingLevelUp.reward.id);
          }
        }}
      />
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
  title: {
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
  breathingTimer: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textLight,
    marginBottom: 24,
  },
  breathingInstruction: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 32,
    minHeight: 40,
  },
  breathingCircleContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  breathingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.calm.teal,
  },
  breathingCircleExpand: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  breathingCircleShrink: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  phaseCounter: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: colors.primary,
    marginBottom: 24,
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
