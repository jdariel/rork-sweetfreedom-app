import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { replacementSuggestions } from '@/constants/goalModes';
import { Clock, CheckCircle, X } from 'lucide-react-native';

export default function DelayFlowScreen() {
  const [stage, setStage] = useState<'delay' | 'suggestions' | 'complete'>('delay');
  const [countdown, setCountdown] = useState<number>(300);
  const [pulseAnim] = useState(new Animated.Value(1));

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    setStage('complete');
    setTimeout(() => {
      router.back();
    }, 2000);
  };

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

        <View style={styles.suggestionsContainer}>
          {replacementSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionCard}
              onPress={handleComplete}
            >
              <Text style={styles.suggestionEmoji}>{suggestion.emoji}</Text>
              <View style={styles.suggestionText}>
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.skipButton} onPress={() => router.back()}>
            <Text style={styles.skipButtonText}>Skip</Text>
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
        <Animated.View style={[styles.timerCircle, { transform: [{ scale: pulseAnim }] }]}>
          <Clock size={48} color={colors.primary} />
        </Animated.View>

        <Text style={styles.timerText}>{formatTime(countdown)}</Text>
        <Text style={styles.delaySubtitle}>
          Take a few deep breaths.{'\n'}Your craving will likely pass.
        </Text>

        <View style={styles.breathingCard}>
          <Text style={styles.breathingTitle}>Breathing Exercise</Text>
          <Text style={styles.breathingText}>
            1. Breathe in slowly for 4 counts{'\n'}
            2. Hold for 4 counts{'\n'}
            3. Breathe out for 4 counts{'\n'}
            4. Repeat 3 times
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => setStage('suggestions')}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={() => router.back()}>
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
  timerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.calm.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  delaySubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 48,
  },
  breathingCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
  },
  breathingTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  breathingText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  suggestionsContainer: {
    flex: 1,
    padding: 20,
  },
  suggestionCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  suggestionEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
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
});
