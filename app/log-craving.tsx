import { router } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, PanResponder, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { SweetType, Emotion } from '@/types';
import { sweetTypes, emotions } from '@/constants/goalModes';
import colors from '@/constants/colors';
import { X, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function LogCravingScreen() {
  const { addCraving, addXP, cravings } = useApp();
  const [sweetType, setSweetType] = useState<SweetType | null>(null);
  const [intensity, setIntensity] = useState<number>(5);
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [intensityAnim] = useState(new Animated.Value(0.5));
  const [glowIntensity] = useState(new Animated.Value(0.5));
  const [dragValue, setDragValue] = useState(0.5);

  const smartDefaults = useMemo(() => {
    if (cravings.length === 0) return { emotion: null, sweetType: null, intensity: 5 };
    
    const recent = cravings.slice(-10);
    const emotionCounts: Record<string, number> = {};
    const sweetCounts: Record<string, number> = {};
    let totalIntensity = 0;
    
    recent.forEach(c => {
      emotionCounts[c.emotion] = (emotionCounts[c.emotion] || 0) + 1;
      sweetCounts[c.sweetType] = (sweetCounts[c.sweetType] || 0) + 1;
      totalIntensity += c.intensity;
    });
    
    const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as Emotion | null;
    const topSweet = Object.entries(sweetCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as SweetType | null;
    const avgIntensity = Math.round(totalIntensity / recent.length);
    
    return { emotion: topEmotion, sweetType: topSweet, intensity: avgIntensity || 5 };
  }, [cravings]);

  useEffect(() => {
    const initialValue = (smartDefaults.intensity - 1) / 9;
    if (smartDefaults.emotion && !emotion) {
      setEmotion(smartDefaults.emotion);
    }
    if (smartDefaults.sweetType && !sweetType) {
      setSweetType(smartDefaults.sweetType);
    }
    if (smartDefaults.intensity) {
      setIntensity(smartDefaults.intensity);
      setDragValue(initialValue);
      intensityAnim.setValue(initialValue);
      glowIntensity.setValue(initialValue);
    }
  }, [smartDefaults, emotion, sweetType, intensityAnim, glowIntensity]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        },
        onPanResponderMove: (_, gestureState) => {
          const newValue = Math.max(0, Math.min(1, dragValue - gestureState.dy / 200));
          setDragValue(newValue);
          intensityAnim.setValue(newValue);
          glowIntensity.setValue(newValue);
          const newIntensity = Math.round(newValue * 9) + 1;
          if (newIntensity !== intensity) {
            setIntensity(newIntensity);
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        },
        onPanResponderRelease: () => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        },
      }),
    [intensityAnim, glowIntensity, intensity, dragValue]
  );

  const glowColor = glowIntensity.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [colors.calm.tealLight, colors.warning, colors.error],
  });

  const intensityLabel = useMemo(() => {
    if (intensity <= 3) return 'Soft';
    if (intensity <= 6) return 'Medium';
    if (intensity <= 8) return 'Strong';
    return 'Very Strong';
  }, [intensity]);

  const handleSubmit = () => {
    if (!sweetType || !emotion) return;

    const newCraving = {
      sweetType,
      intensity,
      emotion,
      delayUsed: false,
      notes: notes || undefined,
    };
    
    const createdCraving = addCraving(newCraving);
    addXP('log-moment', 'Logged a moment');
    
    if (notes && notes.trim()) {
      addXP('add-note', 'Added notes to moment');
    }

    router.replace(`/delay-flow?cravingId=${createdCraving.id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Handle a Moment</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What&apos;s calling to you?</Text>
          <View style={styles.optionsGrid}>
            {sweetTypes.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.optionButton,
                  sweetType === item.value && styles.optionButtonSelected
                ]}
                onPress={() => setSweetType(item.value)}
                onPressIn={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <Text style={styles.optionEmoji}>{item.emoji}</Text>
                <Text style={[
                  styles.optionLabel,
                  sweetType === item.value && styles.optionLabelSelected
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How loud is it right now?</Text>
          <View style={styles.intensityContainer}>
            <View style={styles.intensityDragContainer} {...panResponder.panHandlers}>
              <Animated.View
                style={[
                  styles.intensityOrb,
                  {
                    backgroundColor: glowColor,
                    transform: [
                      {
                        scale: Animated.add(
                          1,
                          Animated.multiply(glowIntensity, 0.5)
                        ),
                      },
                    ],
                  },
                ]}
              >
                <Zap size={32} color={colors.surface} />
              </Animated.View>
              <Text style={styles.intensityValue}>{intensity}</Text>
              <Text style={styles.intensityLabel}>{intensityLabel}</Text>
              <Text style={styles.intensityHint}>Drag up or down</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What&apos;s underneath this moment?</Text>
          {smartDefaults.emotion && emotion === smartDefaults.emotion && (
            <Text style={styles.smartDefaultHint}>Based on your patterns ✨</Text>
          )}
          <View style={styles.optionsGrid}>
            {emotions.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.optionButton,
                  emotion === item.value && styles.optionButtonSelected
                ]}
                onPress={() => setEmotion(item.value)}
                onPressIn={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <Text style={styles.optionEmoji}>{item.emoji}</Text>
                <Text style={[
                  styles.optionLabel,
                  emotion === item.value && styles.optionLabelSelected
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Anything else? (optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textLight}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, (!sweetType || !emotion) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          onPressIn={() => {
            if (Platform.OS !== 'web' && sweetType && emotion) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }}
          disabled={!sweetType || !emotion}
        >
          <Text style={[styles.submitButtonText, (!sweetType || !emotion) && styles.submitButtonTextDisabled]}>
            {sweetType && emotion ? "That's it" : 'Continue'}
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
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.calm.tealLight,
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: colors.primaryDark,
  },
  intensityContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 32,
  },
  intensityDragContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  intensityValue: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  intensityLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  intensityHint: {
    fontSize: 14,
    color: colors.textLight,
  },
  smartDefaultHint: {
    fontSize: 13,
    color: colors.primary,
    marginBottom: 12,
    fontWeight: '600' as const,
  },
  textInput: {
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
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  submitButtonTextDisabled: {
    color: colors.textLight,
  },
});
