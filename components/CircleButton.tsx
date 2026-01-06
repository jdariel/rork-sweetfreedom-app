import { useEffect, useState, useRef } from 'react';
import { View, Animated, StyleSheet, Pressable, AccessibilityInfo, Platform } from 'react-native';
import colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

interface CircleButtonProps {
  onPress: () => void;
  onLongPress: () => void;
  size?: number;
}

export default function CircleButton({ onPress, onLongPress, size = 280 }: CircleButtonProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const breathingScaleAnim = useRef(new Animated.Value(1)).current;
  const pressScaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    }
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const breathingAnimation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(breathingScaleAnim, {
            toValue: 1.05,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(breathingScaleAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 3000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 3000,
            useNativeDriver: false,
          }),
        ]),
      ])
    );

    breathingAnimation.start();

    return () => {
      breathingAnimation.stop();
    };
  }, [breathingScaleAnim, glowAnim, reduceMotion]);

  const handlePressIn = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.spring(pressScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleLongPressAction = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onLongPress();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0.3, 0.5],
    outputRange: [0.3, 0.5],
  });

  const combinedScale = Animated.multiply(breathingScaleAnim, pressScaleAnim);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={handleLongPressAction}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      delayLongPress={800}
      accessibilityLabel="Handle a moment"
      accessibilityHint="Tap to open coach, or long press to start a quick pause"
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.glowOuter,
          {
            width: size + 40,
            height: size + 40,
            borderRadius: (size + 40) / 2,
            opacity: glowOpacity,
            transform: [{ scale: combinedScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: combinedScale }],
          },
        ]}
      >
        <View style={[styles.innerCircle, { width: size - 40, height: size - 40, borderRadius: (size - 40) / 2 }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute' as const,
    backgroundColor: colors.primary,
  },
  circle: {
    backgroundColor: colors.calm.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  innerCircle: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
});
