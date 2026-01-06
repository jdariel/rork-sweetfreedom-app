import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { RewardItem } from '@/types';
import colors from '@/constants/colors';
import { Sparkles, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';

interface CalmRewardModalProps {
  reward: RewardItem | null;
  visible: boolean;
  onDismiss: () => void;
  onTryNow?: () => void;
}

export default function CalmRewardModal({ reward, visible, onDismiss, onTryNow }: CalmRewardModalProps) {
  const [scaleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && reward) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, reward, scaleAnim]);

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

          <View style={styles.iconContainer}>
            <Sparkles size={32} color={colors.calm.teal} />
          </View>

          <Text style={styles.title}>
            {reward.rarity === 'surprise' ? 'Tiny unlock ✨' : 'New calm unlocked'}
          </Text>
          <Text style={styles.subtitle}>You showed up — that matters.</Text>

          <View style={styles.rewardCard}>
            <Text style={styles.rewardName}>{reward.name}</Text>
            <Text style={styles.rewardDescription}>{reward.description}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {reward.category === 'circleStyle' ? 'Circle Style' : 
                 reward.category === 'tonePack' ? 'Tone Pack' :
                 reward.category === 'deckSkin' ? 'Deck Skin' :
                 reward.category === 'insight' ? 'Insight' :
                 reward.category === 'qol' ? 'Quality of Life' :
                 'Theme'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              if (onTryNow) {
                onTryNow();
              }
              onDismiss();
            }}
          >
            <Text style={styles.continueButtonText}>
              {onTryNow ? 'Try it now' : 'Nice'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.laterButton}
            onPress={onDismiss}
          >
            <Text style={styles.laterButtonText}>Later</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.calm.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  rewardCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
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
    marginBottom: 12,
    lineHeight: 20,
  },
  categoryBadge: {
    backgroundColor: colors.calm.tealLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.calm.teal,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  laterButton: {
    paddingVertical: 8,
  },
  laterButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
});
