import { Redirect } from 'expo-router';
import { useApp } from '@/contexts/AppContext';

export default function Index() {
  const { profile, isLoading } = useApp();

  if (isLoading) {
    return null;
  }

  if (!profile?.hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
