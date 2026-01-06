import { Stack } from 'expo-router';
import colors from '@/constants/colors';

export default function CoachLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700' as const,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Less AI' }} />
    </Stack>
  );
}
