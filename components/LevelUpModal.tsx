import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { RewardItem } from '@/types';
import colors from '@/constants/colors';
import { TrendingUp, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';

interface LevelUpModalProps {
  level: number;
  reward: RewardItem | null;
  visible: boolean;
  onDismiss: () => void;
  onUseNow?: () => void;
}

export default function LevelUpModal({ level, reward, visible, onDismiss, onUseNow }: LevelUpModalProps) {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [glowAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && reward) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      glowAnim.setValue(0);
    }
  }, [visible, reward, scaleAnim, glowAnim]);

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
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <Animated.View 
            style={[
              styles.levelBadge,
              { opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }
            ]}
          >
            <TrendingUp size={28} color={colors.success} />
            <Text style={styles.levelText}>Level {level}</Text>
          </Animated.View>

          <Text style={styles.title}>Level up</Text>
          <Text style={styles.subtitle}>More calm tools unlocked.</Text>

          <View style={styles.rewardCard}>
            <Text style={styles.unlockLabel}>NEW UNLOCK</Text>
            <Text style={styles.rewardName}>{reward.name}</Text>
            <Text style={styles.rewardDescription}>{reward.description}</Text>
          </View>

          <TouchableOpacity
            style={styles.useButton}
            onPress={() => {
              if (onUseNow) {
                onUseNow();
              }
              onDismiss();
            }}
          >
            <Text style={styles.useButtonText}>
              {onUseNow ? 'Use now' : 'Nice'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notNowButton}
            onPress={onDismiss}
          >
            <Text style={styles.notNowButtonText}>Not now</Text>
          </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    borderRadius: 24,
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
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 10,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.calm.peachLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20,
  },
  levelText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.success,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  rewardCard: {
    backgroundColor: colors.calm.tealLight,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  unlockLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  rewardName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  rewardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  useButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  useButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  notNowButton: {
    paddingVertical: 8,
  },
  notNowButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
});
