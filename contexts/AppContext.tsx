import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useMemo } from 'react';
import { Craving, UserProfile, Streak, GoalMode, CravingOutcome, CoachMessage } from '@/types';

const STORAGE_KEYS = {
  PROFILE: '@craveless_profile',
  CRAVINGS: '@craveless_cravings',
  STREAK: '@craveless_streak',
  COACH_MESSAGES: '@craveless_coach_messages',
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [cravings, setCravings] = useState<Craving[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [streak, setStreak] = useState<Streak>({ current: 0, longest: 0, lastCravingDate: null });
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
        if (!stored || stored === 'undefined' || stored === 'null') return null;
        const parsed = JSON.parse(stored);
        return parsed;
      } catch (error) {
        console.error('Error parsing profile:', error);
        await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE);
        return null;
      }
    }
  });

  const cravingsQuery = useQuery({
    queryKey: ['cravings'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.CRAVINGS);
        if (!stored || stored === 'undefined' || stored === 'null') return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('Error parsing cravings:', error);
        await AsyncStorage.removeItem(STORAGE_KEYS.CRAVINGS);
        return [];
      }
    }
  });

  const streakQuery = useQuery({
    queryKey: ['streak'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.STREAK);
        if (!stored || stored === 'undefined' || stored === 'null') return { current: 0, longest: 0, lastCravingDate: null };
        const parsed = JSON.parse(stored);
        return parsed;
      } catch (error) {
        console.error('Error parsing streak:', error);
        await AsyncStorage.removeItem(STORAGE_KEYS.STREAK);
        return { current: 0, longest: 0, lastCravingDate: null };
      }
    }
  });

  const coachMessagesQuery = useQuery({
    queryKey: ['coachMessages'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.COACH_MESSAGES);
        if (!stored || stored === 'undefined' || stored === 'null') return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('Error parsing coach messages:', error);
        await AsyncStorage.removeItem(STORAGE_KEYS.COACH_MESSAGES);
        return [];
      }
    }
  });

  useEffect(() => {
    if (profileQuery.data !== undefined) {
      setProfile(profileQuery.data);
    }
  }, [profileQuery.data]);

  useEffect(() => {
    if (cravingsQuery.data) {
      setCravings(cravingsQuery.data);
    }
  }, [cravingsQuery.data]);

  useEffect(() => {
    if (streakQuery.data) {
      setStreak(streakQuery.data);
    }
  }, [streakQuery.data]);

  useEffect(() => {
    if (coachMessagesQuery.data) {
      setCoachMessages(coachMessagesQuery.data);
    }
  }, [coachMessagesQuery.data]);

  const saveCravingsMutation = useMutation({
    mutationFn: async (newCravings: Craving[]) => {
      try {
        const jsonString = JSON.stringify(newCravings);
        await AsyncStorage.setItem(STORAGE_KEYS.CRAVINGS, jsonString);
        return newCravings;
      } catch (error) {
        console.error('Error saving cravings:', error);
        throw error;
      }
    }
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (newProfile: UserProfile) => {
      try {
        const jsonString = JSON.stringify(newProfile);
        await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, jsonString);
        return newProfile;
      } catch (error) {
        console.error('Error saving profile:', error);
        throw error;
      }
    }
  });

  const saveStreakMutation = useMutation({
    mutationFn: async (newStreak: Streak) => {
      try {
        const jsonString = JSON.stringify(newStreak);
        await AsyncStorage.setItem(STORAGE_KEYS.STREAK, jsonString);
        return newStreak;
      } catch (error) {
        console.error('Error saving streak:', error);
        throw error;
      }
    }
  });

  const saveCoachMessagesMutation = useMutation({
    mutationFn: async (newMessages: CoachMessage[]) => {
      try {
        const validMessages = newMessages
          .filter(m => m && typeof m.content === 'string' && m.content.trim())
          .map(m => ({
            id: String(m.id),
            role: m.role,
            content: String(m.content).trim(),
            timestamp: Number(m.timestamp)
          }));
        const jsonString = JSON.stringify(validMessages);
        await AsyncStorage.setItem(STORAGE_KEYS.COACH_MESSAGES, jsonString);
        return validMessages;
      } catch (error) {
        console.error('Error saving coach messages:', error);
        throw error;
      }
    }
  });

  const completeOnboarding = (goalMode: GoalMode) => {
    const newProfile: UserProfile = {
      goalMode,
      startDate: Date.now(),
      hasCompletedOnboarding: true,
    };
    setProfile(newProfile);
    saveProfileMutation.mutate(newProfile);
  };

  const addCraving = (craving: Omit<Craving, 'id' | 'timestamp'>) => {
    const newCraving: Craving = {
      ...craving,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    const updated = [...cravings, newCraving];
    setCravings(updated);
    saveCravingsMutation.mutate(updated);

    if (craving.outcome === 'resisted') {
      updateStreak(true);
    } else if (craving.outcome === 'gave-in') {
      updateStreak(false);
    }
  };

  const updateCravingOutcome = (id: string, outcome: CravingOutcome) => {
    const updated = cravings.map(c => 
      c.id === id ? { ...c, outcome } : c
    );
    setCravings(updated);
    saveCravingsMutation.mutate(updated);

    if (outcome === 'resisted') {
      updateStreak(true);
    } else if (outcome === 'gave-in') {
      updateStreak(false);
    }
  };

  const updateCravingFeedback = (id: string, postDelayIntensity: number, whatHelped?: string) => {
    const updated = cravings.map(c => 
      c.id === id ? { ...c, postDelayIntensity, whatHelped } : c
    );
    setCravings(updated);
    saveCravingsMutation.mutate(updated);
  };

  const updateStreak = (resisted: boolean) => {
    const now = Date.now();
    const today = new Date(now).setHours(0, 0, 0, 0);
    const lastDate = streak.lastCravingDate ? new Date(streak.lastCravingDate).setHours(0, 0, 0, 0) : null;

    let newStreak = { ...streak };

    if (resisted) {
      if (!lastDate || today > lastDate) {
        newStreak.current += 1;
        newStreak.longest = Math.max(newStreak.longest, newStreak.current);
        newStreak.lastCravingDate = now;
      }
    } else {
      newStreak.current = 0;
      newStreak.lastCravingDate = now;
      newStreak.isPaused = true;
      newStreak.pausedAt = now;
    }

    setStreak(newStreak);
    saveStreakMutation.mutate(newStreak);
  };

  const pauseStreak = () => {
    const newStreak = {
      ...streak,
      isPaused: true,
      pausedAt: Date.now(),
    };
    setStreak(newStreak);
    saveStreakMutation.mutate(newStreak);
  };

  const resumeStreak = () => {
    const newStreak = {
      ...streak,
      isPaused: false,
      pausedAt: undefined,
    };
    setStreak(newStreak);
    saveStreakMutation.mutate(newStreak);
  };

  const activateDistressMode = () => {
    if (!profile) return;
    const newProfile = {
      ...profile,
      isInDistressMode: true,
      distressModeActivatedAt: Date.now(),
    };
    setProfile(newProfile);
    saveProfileMutation.mutate(newProfile);
    pauseStreak();
  };

  const deactivateDistressMode = () => {
    if (!profile) return;
    const newProfile = {
      ...profile,
      isInDistressMode: false,
      distressModeActivatedAt: undefined,
    };
    setProfile(newProfile);
    saveProfileMutation.mutate(newProfile);
  };

  const shouldShowStreaks = useMemo(() => {
    if (profile?.isInDistressMode) return false;
    if (streak.isPaused) return false;
    return true;
  }, [profile?.isInDistressMode, streak.isPaused]);

  const todayCravings = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    return cravings.filter(c => new Date(c.timestamp).setHours(0, 0, 0, 0) === today);
  }, [cravings]);

  const resistedToday = useMemo(() => {
    return todayCravings.filter(c => c.outcome === 'resisted').length;
  }, [todayCravings]);

  const addCoachMessage = (message: Omit<CoachMessage, 'id' | 'timestamp'>) => {
    if (typeof message.content !== 'string' || !message.content.trim()) {
      console.warn('Invalid message content, skipping', message);
      return;
    }
    
    const newMessage: CoachMessage = {
      ...message,
      content: message.content.trim(),
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    const updated = [...coachMessages, newMessage];
    setCoachMessages(updated);
    saveCoachMessagesMutation.mutate(updated);
  };

  const clearCoachMessages = () => {
    setCoachMessages([]);
    saveCoachMessagesMutation.mutate([]);
  };

  const markMessageHelpCheckComplete = (messageId: string) => {
    const updated = coachMessages.map(m => 
      m.id === messageId ? { ...m, needsHelpCheck: false } : m
    );
    setCoachMessages(updated);
    saveCoachMessagesMutation.mutate(updated);
  };

  return {
    profile,
    cravings,
    streak,
    coachMessages,
    todayCravings,
    resistedToday,
    shouldShowStreaks,
    completeOnboarding,
    addCraving,
    updateCravingOutcome,
    updateCravingFeedback,
    addCoachMessage,
    clearCoachMessages,
    markMessageHelpCheckComplete,
    activateDistressMode,
    deactivateDistressMode,
    pauseStreak,
    resumeStreak,
    isLoading: profileQuery.isLoading || cravingsQuery.isLoading || streakQuery.isLoading || coachMessagesQuery.isLoading,
  };
});
