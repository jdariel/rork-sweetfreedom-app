import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { GoalMode } from '@/types';
import { goalModeData } from '@/constants/goalModes';
import colors from '@/constants/colors';
import { Sparkles, Heart, AlertCircle, ExternalLink } from 'lucide-react-native';

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState<'disclaimer' | 'goal'>('disclaimer');
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
    if (step === 'disclaimer') {
      setStep('goal');
    } else if (selectedMode) {
      completeOnboarding(selectedMode);
      router.replace('/(tabs)/home' as any);
    }
  };

  if (step === 'disclaimer') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Heart size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>Welcome to CraveLess</Text>
            <Text style={styles.subtitle}>
              Before we begin, let&apos;s clarify what we offer
            </Text>
          </View>

          <View style={styles.disclaimerCard}>
            <View style={styles.disclaimerHeader}>
              <AlertCircle size={24} color={colors.secondary} />
              <Text style={styles.disclaimerTitle}>Important Notice</Text>
            </View>
            <Text style={styles.disclaimerText}>
              CraveLess provides habit and wellness support. It is <Text style={styles.boldText}>not medical or nutritional advice</Text>.
            </Text>
            <Text style={[styles.disclaimerText, { marginTop: 16 }]}>
              We are here to:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Help you track and understand your cravings</Text>
              <Text style={styles.bulletItem}>• Provide supportive coaching and encouragement</Text>
              <Text style={styles.bulletItem}>• Offer strategies to manage cravings mindfully</Text>
            </View>
            <Text style={[styles.disclaimerText, { marginTop: 16 }]}>
              We are <Text style={styles.boldText}>not</Text> here to:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Diagnose or treat medical conditions</Text>
              <Text style={styles.bulletItem}>• Replace professional healthcare advice</Text>
              <Text style={styles.bulletItem}>• Provide nutrition plans or meal guidance</Text>
            </View>
          </View>

          <View style={styles.resourcesCard}>
            <Text style={styles.resourcesTitle}>Need Professional Help?</Text>
            <Text style={styles.resourcesText}>
              If you&apos;re struggling with disordered eating, health conditions, or mental health concerns, please reach out to:
            </Text>
            <View style={styles.resourceLinks}>
              <View style={styles.resourceLink}>
                <ExternalLink size={16} color={colors.primary} />
                <Text style={styles.resourceLinkText}>Healthcare provider or registered dietitian</Text>
              </View>
              <View style={styles.resourceLink}>
                <ExternalLink size={16} color={colors.primary} />
                <Text style={styles.resourceLinkText}>Mental health professional or counselor</Text>
              </View>
              <View style={styles.resourceLink}>
                <ExternalLink size={16} color={colors.primary} />
                <Text style={styles.resourceLinkText}>Crisis services (988 - US Suicide & Crisis Lifeline)</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              I Understand
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
  disclaimerCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  disclaimerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginLeft: 12,
  },
  disclaimerText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: '700' as const,
    color: colors.primaryDark,
  },
  bulletList: {
    marginTop: 8,
    marginLeft: 8,
  },
  bulletItem: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 4,
  },
  resourcesCard: {
    backgroundColor: colors.calm.peachLight,
    borderRadius: 16,
    padding: 20,
  },
  resourcesTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  resourcesText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  resourceLinks: {
    gap: 12,
  },
  resourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resourceLinkText: {
    fontSize: 14,
    color: colors.primaryDark,
    lineHeight: 20,
    flex: 1,
  },
});
