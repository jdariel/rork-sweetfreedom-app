import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { GoalMode } from '@/types';
import { goalModeData } from '@/constants/goalModes';
import colors from '@/constants/colors';
import { Sparkles } from 'lucide-react-native';

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const [selectedMode, setSelectedMode] = useState<GoalMode | null>(null);
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleSelectMode = (mode: GoalMode) => {
    setSelectedMode(mode);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleContinue = () => {
    if (selectedMode) {
      completeOnboarding(selectedMode);
      router.replace('/(tabs)/home');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Sparkles size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>Welcome to CRAVELESS</Text>
          <Text style={styles.subtitle}>
            Take control of your sugar cravings with support, not judgment
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose your goal</Text>
          <View style={styles.modeGrid}>
            {(Object.keys(goalModeData) as GoalMode[]).map((mode) => {
              const data = goalModeData[mode];
              const isSelected = selectedMode === mode;

              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeCard, isSelected && styles.modeCardSelected]}
                  onPress={() => handleSelectMode(mode)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modeEmoji}>{data.emoji}</Text>
                  <Text style={[styles.modeTitle, isSelected && styles.modeTextSelected]}>
                    {data.title}
                  </Text>
                  <Text style={[styles.modeDescription, isSelected && styles.modeDescriptionSelected]}>
                    {data.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedMode && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedMode}
          activeOpacity={0.8}
        >
          <Text style={[styles.continueButtonText, !selectedMode && styles.continueButtonTextDisabled]}>
            Continue
          </Text>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.calm.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 16,
  },
  modeGrid: {
    gap: 12,
  },
  modeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border,
  },
  modeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.calm.tealLight,
  },
  modeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  modeTextSelected: {
    color: colors.primaryDark,
  },
  modeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modeDescriptionSelected: {
    color: colors.primaryDark,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  continueButtonTextDisabled: {
    color: colors.textLight,
  },
});
