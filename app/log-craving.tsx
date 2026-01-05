import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { SweetType, Emotion } from '@/types';
import { sweetTypes, emotions } from '@/constants/goalModes';
import colors from '@/constants/colors';
import { X } from 'lucide-react-native';

export default function LogCravingScreen() {
  const { addCraving } = useApp();
  const [sweetType, setSweetType] = useState<SweetType | null>(null);
  const [intensity, setIntensity] = useState<number>(5);
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [notes, setNotes] = useState<string>('');

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

    router.replace(`/delay-flow?cravingId=${createdCraving.id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Log Your Craving</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What are you craving?</Text>
          <View style={styles.optionsGrid}>
            {sweetTypes.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.optionButton,
                  sweetType === item.value && styles.optionButtonSelected
                ]}
                onPress={() => setSweetType(item.value)}
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
          <Text style={styles.sectionTitle}>Intensity (1-10)</Text>
          <View style={styles.intensityContainer}>
            <View style={styles.intensityButtons}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.intensityButton,
                    intensity === num && styles.intensityButtonSelected
                  ]}
                  onPress={() => setIntensity(num)}
                >
                  <Text style={[
                    styles.intensityButtonText,
                    intensity === num && styles.intensityButtonTextSelected
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <View style={styles.optionsGrid}>
            {emotions.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.optionButton,
                  emotion === item.value && styles.optionButtonSelected
                ]}
                onPress={() => setEmotion(item.value)}
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
          <Text style={styles.sectionTitle}>Notes (optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Add any additional notes..."
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
          disabled={!sweetType || !emotion}
        >
          <Text style={[styles.submitButtonText, (!sweetType || !emotion) && styles.submitButtonTextDisabled]}>
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
    padding: 16,
  },
  intensityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intensityButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.calm.tealLight,
  },
  intensityButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  intensityButtonTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700' as const,
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
