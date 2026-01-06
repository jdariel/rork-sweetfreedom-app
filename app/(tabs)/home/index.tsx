import { router } from 'expo-router';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import colors from '@/constants/colors';
import { useState, useEffect, useRef } from 'react';
import RewardModal from '@/components/RewardModal';
import CircleButton from '@/components/CircleButton';

export default function HomeScreen() {
  const { pendingReward, dismissReward, addXP } = useApp();
  const [showQuickPause, setShowQuickPause] = useState(false);
  const [pauseCountdown, setPauseCountdown] = useState(60);
  const [hasCheckedComeback, setHasCheckedComeback] = useState(false);
  const countdownTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasCheckedComeback) {
      addXP('comeback-bonus', 'Welcome back!');
      setHasCheckedComeback(true);
    }
  }, [hasCheckedComeback, addXP]);

  useEffect(() => {
    if (showQuickPause && pauseCountdown > 0) {
      countdownTimerRef.current = setTimeout(() => {
        setPauseCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, [showQuickPause, pauseCountdown]);

  const handleTap = () => {
    router.push('/(tabs)/coach' as any);
  };

  const handleLongPress = () => {
    setShowQuickPause(true);
    setPauseCountdown(60);
  };

  const closeQuickPause = () => {
    setShowQuickPause(false);
    setPauseCountdown(60);
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
    }
  };

  const handlePauseDone = () => {
    addXP('delay-1min', 'Completed quick pause');
    closeQuickPause();
  };

  const handleTalkToLess = () => {
    closeQuickPause();
    router.push('/(tabs)/coach' as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>When a moment shows up, tap.</Text>
        
        <View style={styles.circleContainer}>
          <CircleButton onPress={handleTap} onLongPress={handleLongPress} />
        </View>

        <Text style={styles.subtitle}>No logging required.</Text>
        <Text style={styles.hint}>Long-press to pause.</Text>
      </View>

      <Modal
        visible={showQuickPause}
        transparent
        animationType="fade"
        onRequestClose={closeQuickPause}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pauseModal}>
            <Text style={styles.pauseTitle}>
              {pauseCountdown > 0 ? "Let's pause together for 60 seconds." : "Nice."}
            </Text>
            
            {pauseCountdown > 0 ? (
              <>
                <Text style={styles.pauseCountdown}>{pauseCountdown}s</Text>
                <View style={styles.pauseProgressContainer}>
                  <View
                    style={[
                      styles.pauseProgressBar,
                      { width: `${((60 - pauseCountdown) / 60) * 100}%` },
                    ]}
                  />
                </View>
              </>
            ) : (
              <View style={styles.pauseCompleteActions}>
                <Text style={styles.pauseCompleteText}>
                  Want to talk to Less or save this as a moment?
                </Text>
                <TouchableOpacity style={styles.pauseButton} onPress={handleTalkToLess}>
                  <Text style={styles.pauseButtonText}>Talk to Less</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pauseButton, styles.pauseButtonSecondary]}
                  onPress={handlePauseDone}
                >
                  <Text style={[styles.pauseButtonText, styles.pauseButtonTextSecondary]}>
                    Not now
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <RewardModal 
        reward={pendingReward}
        visible={!!pendingReward}
        onDismiss={dismissReward}
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
  pauseModal: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  pauseTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 28,
  },
  pauseCountdown: {
    fontSize: 64,
    fontWeight: '800' as const,
    color: colors.primary,
    marginBottom: 24,
  },
  pauseProgressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  pauseProgressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  pauseCompleteActions: {
    width: '100%',
    alignItems: 'center',
  },
  pauseCompleteText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  pauseButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  pauseButtonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pauseButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  pauseButtonTextSecondary: {
    color: colors.textSecondary,
  },
});
