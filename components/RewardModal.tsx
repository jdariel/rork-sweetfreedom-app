import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SurpriseReward } from '@/types';
import colors from '@/constants/colors';
import { Gift, X, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';

interface RewardModalProps {
  reward: SurpriseReward | null;
  visible: boolean;
  onDismiss: () => void;
}

export default function RewardModal({ reward, visible, onDismiss }: RewardModalProps) {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [confettiAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && reward) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      confettiAnim.setValue(0);
    }
  }, [visible, reward, scaleAnim, confettiAnim]);

  if (!reward) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onDismiss}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onDismiss}
          >
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <View style={styles.giftBackground}>
              <Gift size={48} color={colors.secondary} />
            </View>
            <Animated.View 
              style={[
                styles.sparkle,
                styles.sparkle1,
                {
                  opacity: confettiAnim,
                  transform: [
                    {
                      translateY: confettiAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -20],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Sparkles size={20} color={colors.warning} />
            </Animated.View>
            <Animated.View 
              style={[
                styles.sparkle,
                styles.sparkle2,
                {
                  opacity: confettiAnim,
                  transform: [
                    {
                      translateY: confettiAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -15],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Sparkles size={16} color={colors.primary} />
            </Animated.View>
          </View>

          <Text style={styles.title}>Surprise!</Text>
          <Text style={styles.subtitle}>You unlocked something new</Text>

          <View style={styles.rewardCard}>
            <Text style={styles.rewardIcon}>{reward.unlockable.icon}</Text>
            <Text style={styles.rewardName}>{reward.unlockable.name}</Text>
            <Text style={styles.rewardDescription}>{reward.unlockable.description}</Text>
            <View style={styles.rewardTypeBadge}>
              <Text style={styles.rewardTypeText}>
                {reward.unlockable.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={onDismiss}
          >
            <Text style={styles.continueButtonText}>Awesome!</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Keep engaging with your moments to unlock more
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 32,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.calm.peachLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute' as const,
  },
  sparkle1: {
    top: -10,
    right: -10,
  },
  sparkle2: {
    top: 10,
    left: -15,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  rewardCard: {
    backgroundColor: colors.calm.tealLight,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  rewardIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  rewardName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  rewardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  rewardTypeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rewardTypeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.surface,
    textTransform: 'uppercase' as const,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginBottom: 16,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  footerText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
});
