import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useMemo } from 'react';
import { Craving, UserProfile, Streak, CalmMomentum, GoalMode, CravingOutcome, CoachMessage, XPAction, SurpriseReward, ReplacementSelection } from '@/types';
import { getRandomUnlockable, getLevelUnlock } from '@/constants/unlockables';

const STORAGE_KEYS = {
  PROFILE: '@craveless_profile',
  CRAVINGS: '@craveless_cravings',
  STREAK: '@craveless_streak',
  CALM_MOMENTUM: '@craveless_calm_momentum',
  COACH_MESSAGES: '@craveless_coach_messages',
  REWARDS: '@craveless_rewards',
};

const XP_VALUES: Record<XPAction['type'], number> = {
  'log-moment': 10,
  'add-emotion': 5,
  'add-note': 5,
  'delay-start': 10,
  'delay-1min': 10,
  'delay-complete': 30,
  'post-delay-checkin': 10,
  'select-outcome': 10,
  'coach-message': 5,
  'coach-helped': 10,
  'weekly-deck-open': 10,
  'weekly-deck-complete': 30,
  'weekly-highlight-save': 10,
  'comeback-bonus': 20,
};

const XP_DAILY_CAPS: Partial<Record<XPAction['type'], number>> = {
  'coach-message': 6,
  'coach-helped': 2,
  'comeback-bonus': 1,
};

const DISTRESS_MODE_DAILY_XP_CAP = 60;

const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950];

const calculateLevel = (xp: number): number => {
  if (xp < LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]) {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) return i;
    }
    return 0;
  }
  const xpAfter15 = xp - LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const levelsAfter15 = Math.floor(xpAfter15 / 900);
  return LEVEL_THRESHOLDS.length - 1 + levelsAfter15;
};

const getXPForNextLevel = (level: number): number => {
  if (level < LEVEL_THRESHOLDS.length - 1) {
    return LEVEL_THRESHOLDS[level + 1];
  }
  const levelsAfter15 = level - (LEVEL_THRESHOLDS.length - 1);
  return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (levelsAfter15 + 1) * 900;
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [cravings, setCravings] = useState<Craving[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [streak, setStreak] = useState<Streak>({ current: 0, longest: 0, lastCravingDate: null });
  const [calmMomentum, setCalmMomentum] = useState<CalmMomentum>({
    totalPausesCompleted: 0,
    momentumState: 'active',
  });
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [rewards, setRewards] = useState<SurpriseReward[]>([]);
  const [pendingReward, setPendingReward] = useState<SurpriseReward | null>(null);

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

  const calmMomentumQuery = useQuery({
    queryKey: ['calmMomentum'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.CALM_MOMENTUM);
        if (!stored || stored === 'undefined' || stored === 'null') {
          return { totalPausesCompleted: 0, momentumState: 'active' as const };
        }
        const parsed = JSON.parse(stored);
        return parsed;
      } catch (error) {
        console.error('Error parsing calm momentum:', error);
        await AsyncStorage.removeItem(STORAGE_KEYS.CALM_MOMENTUM);
        return { totalPausesCompleted: 0, momentumState: 'active' as const };
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

  const rewardsQuery = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.REWARDS);
        if (!stored || stored === 'undefined' || stored === 'null') return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('Error parsing rewards:', error);
        await AsyncStorage.removeItem(STORAGE_KEYS.REWARDS);
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
    if (calmMomentumQuery.data) {
      setCalmMomentum(calmMomentumQuery.data);
    }
  }, [calmMomentumQuery.data]);

  useEffect(() => {
    if (coachMessagesQuery.data) {
      setCoachMessages(coachMessagesQuery.data);
    }
  }, [coachMessagesQuery.data]);

  useEffect(() => {
    if (rewardsQuery.data) {
      setRewards(rewardsQuery.data);
    }
  }, [rewardsQuery.data]);

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

  const saveCalmMomentumMutation = useMutation({
    mutationFn: async (newMomentum: CalmMomentum) => {
      try {
        const jsonString = JSON.stringify(newMomentum);
        await AsyncStorage.setItem(STORAGE_KEYS.CALM_MOMENTUM, jsonString);
        return newMomentum;
      } catch (error) {
        console.error('Error saving calm momentum:', error);
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

  const saveRewardsMutation = useMutation({
    mutationFn: async (newRewards: SurpriseReward[]) => {
      try {
        const jsonString = JSON.stringify(newRewards);
        await AsyncStorage.setItem(STORAGE_KEYS.REWARDS, jsonString);
        return newRewards;
      } catch (error) {
        console.error('Error saving rewards:', error);
        throw error;
      }
    }
  });

  const completeOnboarding = (goalMode: GoalMode) => {
    const newProfile: UserProfile = {
      goalMode,
      startDate: Date.now(),
      hasCompletedOnboarding: true,
      xp: 0,
      level: 0,
      unlockedFeatures: [],
      coachTone: 'neutral',
    };
    setProfile(newProfile);
    saveProfileMutation.mutate(newProfile);
  };

  const addCraving = (craving: Omit<Craving, 'id' | 'timestamp'>): Craving => {
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
      setMomentumActive();
    } else if (craving.outcome === 'gave-in') {
      updateStreak(false);
      setMomentumResting('slip');
    }

    return newCraving;
  };

  const updateCravingOutcome = (id: string, outcome: CravingOutcome) => {
    const updated = cravings.map(c => 
      c.id === id ? { ...c, outcome } : c
    );
    setCravings(updated);
    saveCravingsMutation.mutate(updated);

    if (outcome === 'resisted') {
      updateStreak(true);
      setMomentumActive();
    } else if (outcome === 'gave-in') {
      updateStreak(false);
      setMomentumResting('slip');
    } else if (outcome === 'small-portion') {
      setMomentumActive();
    }
  };

  const updateCravingFeedback = (id: string, postDelayIntensity: number, whatHelped?: string) => {
    const updated = cravings.map(c => 
      c.id === id ? { ...c, postDelayIntensity, whatHelped } : c
    );
    setCravings(updated);
    saveCravingsMutation.mutate(updated);
  };

  const updateCravingDelayUsed = (id: string) => {
    const updated = cravings.map(c => 
      c.id === id ? { ...c, delayUsed: true } : c
    );
    setCravings(updated);
    saveCravingsMutation.mutate(updated);
  };

  const updateCravingDelayData = (id: string, delayData: {
    delayStartedAt: number;
    delayCompletedAt: number;
    delayDurationSec: number;
    stabilizerEngagementSec: number;
  }) => {
    const updated = cravings.map(c => 
      c.id === id ? { ...c, ...delayData } : c
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

  const setMomentumResting = (reason: 'slip' | 'distress' | 'manual') => {
    const newMomentum: CalmMomentum = {
      ...calmMomentum,
      momentumState: 'resting',
      restingReason: reason,
      lastRestISO: new Date().toISOString(),
    };
    setCalmMomentum(newMomentum);
    saveCalmMomentumMutation.mutate(newMomentum);
    console.log('[Calm Momentum] Set to resting:', reason);
  };

  const setMomentumActive = () => {
    const newMomentum: CalmMomentum = {
      ...calmMomentum,
      momentumState: 'active',
      restingReason: undefined,
      lastActiveISO: new Date().toISOString(),
    };
    setCalmMomentum(newMomentum);
    saveCalmMomentumMutation.mutate(newMomentum);
    console.log('[Calm Momentum] Set to active');
  };

  const incrementPausesCompleted = () => {
    const newMomentum: CalmMomentum = {
      ...calmMomentum,
      totalPausesCompleted: calmMomentum.totalPausesCompleted + 1,
      momentumState: 'active',
      restingReason: undefined,
      lastActiveISO: new Date().toISOString(),
    };
    setCalmMomentum(newMomentum);
    saveCalmMomentumMutation.mutate(newMomentum);
    console.log('[Calm Momentum] Pause completed, total:', newMomentum.totalPausesCompleted);
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
    setMomentumResting('distress');
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

  const toggleFavoriteReplacement = (replacementId: string) => {
    if (!profile) return;
    const favorites = profile.favoriteReplacements || [];
    const isFavorite = favorites.includes(replacementId);
    const newFavorites = isFavorite
      ? favorites.filter(id => id !== replacementId)
      : [...favorites, replacementId];
    const newProfile = {
      ...profile,
      favoriteReplacements: newFavorites,
    };
    setProfile(newProfile);
    saveProfileMutation.mutate(newProfile);
  };

  const toggleHiddenReplacement = (replacementId: string) => {
    if (!profile) return;
    const hidden = profile.hiddenReplacements || [];
    const isHidden = hidden.includes(replacementId);
    const newHidden = isHidden
      ? hidden.filter(id => id !== replacementId)
      : [...hidden, replacementId];
    const newProfile = {
      ...profile,
      hiddenReplacements: newHidden,
    };
    setProfile(newProfile);
    saveProfileMutation.mutate(newProfile);
  };

  const shouldShowStreaks = useMemo(() => {
    if (profile?.isInDistressMode) return false;
    if (streak.isPaused) return false;
    return true;
  }, [profile?.isInDistressMode, streak.isPaused]);

  const shouldShowMomentum = useMemo(() => {
    return !profile?.isInDistressMode;
  }, [profile?.isInDistressMode]);

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

  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PROFILE,
        STORAGE_KEYS.CRAVINGS,
        STORAGE_KEYS.STREAK,
        STORAGE_KEYS.CALM_MOMENTUM,
        STORAGE_KEYS.COACH_MESSAGES,
      ]);
      setProfile(null);
      setCravings([]);
      setStreak({ current: 0, longest: 0, lastCravingDate: null });
      setCalmMomentum({ totalPausesCompleted: 0, momentumState: 'active' });
      setCoachMessages([]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  };

  const exportData = () => {
    return {
      profile,
      cravings,
      streak,
      coachMessages,
      exportedAt: new Date().toISOString(),
    };
  };

  const markMessageHelpCheckComplete = (messageId: string) => {
    const updated = coachMessages.map(m => 
      m.id === messageId ? { ...m, needsHelpCheck: false } : m
    );
    setCoachMessages(updated);
    saveCoachMessagesMutation.mutate(updated);
  };

  const addXP = (actionType: XPAction['type'], label?: string) => {
    if (!profile) return;

    const now = Date.now();
    const todayStart = new Date(now).setHours(0, 0, 0, 0);
    const xpActions = profile.xpActions || [];

    const todaysActions = xpActions.filter(a => a.timestamp >= todayStart);
    const todaysXP = todaysActions.reduce((sum, a) => sum + a.xp, 0);

    if (profile.isInDistressMode && todaysXP >= DISTRESS_MODE_DAILY_XP_CAP) {
      console.log('XP skipped: distress mode daily cap reached');
      return { xpGain: 0, newLevel: profile.level, leveledUp: false, newUnlocks: [], capped: true };
    }

    const dailyCap = XP_DAILY_CAPS[actionType];
    if (dailyCap !== undefined) {
      const todaysCount = todaysActions.filter(a => a.type === actionType).length;
      if (todaysCount >= dailyCap) {
        console.log(`XP skipped: ${actionType} daily cap reached (${dailyCap})`);
        return { xpGain: 0, newLevel: profile.level, leveledUp: false, newUnlocks: [], capped: true };
      }
    }

    if (actionType === 'comeback-bonus') {
      const lastActive = profile.lastActiveDate || profile.startDate;
      const hoursSinceLastActive = (now - lastActive) / (1000 * 60 * 60);
      if (hoursSinceLastActive < 24) {
        console.log('XP skipped: comeback bonus requires 24h+ absence');
        return { xpGain: 0, newLevel: profile.level, leveledUp: false, newUnlocks: [], capped: true };
      }
    }

    const baseXP = XP_VALUES[actionType];
    let xpGain = baseXP;

    if (profile.isInDistressMode) {
      const remainingDailyXP = DISTRESS_MODE_DAILY_XP_CAP - todaysXP;
      if (xpGain > remainingDailyXP) {
        xpGain = remainingDailyXP;
        console.log(`XP reduced: distress mode daily cap (${xpGain}/${baseXP})`);
      }
    }

    const newAction: XPAction = {
      type: actionType,
      xp: xpGain,
      label: label || actionType,
      timestamp: now,
    };

    const newXP = profile.xp + xpGain;
    const newLevel = calculateLevel(newXP);
    const oldLevel = profile.level;
    
    const levelRewards: SurpriseReward[] = [];
    if (newLevel > oldLevel) {
      for (let level = oldLevel + 1; level <= newLevel; level++) {
        const levelUnlock = getLevelUnlock(level);
        if (levelUnlock) {
          const alreadyUnlocked = rewards.some(r => r.unlockable.id === levelUnlock.id);
          if (!alreadyUnlocked) {
            const levelReward: SurpriseReward = {
              id: `level-${level}-${Date.now()}`,
              unlockable: levelUnlock,
              timestamp: now,
            };
            levelRewards.push(levelReward);
          }
        }
      }
    }

    const reduceCelebratory = profile.isInDistressMode;

    const newProfile = {
      ...profile,
      xp: newXP,
      level: newLevel,
      xpActions: [...xpActions, newAction],
      lastActiveDate: now,
    };
    setProfile(newProfile);
    saveProfileMutation.mutate(newProfile);

    if (levelRewards.length > 0) {
      const updatedRewards = [...rewards, ...levelRewards];
      setRewards(updatedRewards);
      saveRewardsMutation.mutate(updatedRewards);
      setPendingReward(levelRewards[0]);
    }

    console.log(`XP awarded: +${xpGain} for ${actionType}`);
    if (levelRewards.length > 0) {
      console.log(`Level unlocks:`, levelRewards.map(r => r.unlockable.name));
    }
    return { xpGain, newLevel, leveledUp: newLevel > oldLevel, newUnlocks: levelRewards, reduceCelebratory };
  };

  const changeCoachTone = (tone: 'warm' | 'neutral' | 'playful') => {
    if (!profile) return;
    const newProfile = {
      ...profile,
      coachTone: tone,
    };
    setProfile(newProfile);
    saveProfileMutation.mutate(newProfile);
  };

  const getXPProgress = () => {
    if (!profile) return { current: 0, needed: 100, percentage: 0 };
    const currentLevelXP = LEVEL_THRESHOLDS[profile.level];
    const nextLevelXP = getXPForNextLevel(profile.level);
    const current = profile.xp - currentLevelXP;
    const needed = nextLevelXP - currentLevelXP;
    const percentage = (current / needed) * 100;
    return { current, needed, percentage };
  };

  const triggerReward = (trigger: 'delay-complete' | 'reflection' | 'return' | 'weekly-reflection') => {
    if (!profile || profile.isInDistressMode) {
      console.log('Reward skipped: distress mode active');
      return;
    }

    const now = Date.now();
    const lastReward = profile.lastRewardTimestamp || 0;
    const hoursSinceLastReward = (now - lastReward) / (1000 * 60 * 60);

    if (hoursSinceLastReward < 2) {
      console.log('Reward skipped: too soon since last reward');
      return;
    }

    const chance = Math.random();
    let shouldTrigger = false;

    if (trigger === 'delay-complete') shouldTrigger = chance < 0.15;
    else if (trigger === 'reflection') shouldTrigger = chance < 0.2;
    else if (trigger === 'return') shouldTrigger = chance < 0.3;
    else if (trigger === 'weekly-reflection') shouldTrigger = chance < 0.4;

    if (!shouldTrigger) {
      console.log('Reward skipped: chance roll failed');
      return;
    }

    const unlockedIds = rewards.map(r => r.unlockable.id);
    const newUnlockable = getRandomUnlockable(unlockedIds);

    if (!newUnlockable) {
      console.log('Reward skipped: all unlockables obtained');
      return;
    }

    const reward: SurpriseReward = {
      id: `${Date.now()}-${Math.random()}`,
      unlockable: newUnlockable,
      timestamp: now,
    };

    const updatedRewards = [...rewards, reward];
    setRewards(updatedRewards);
    saveRewardsMutation.mutate(updatedRewards);

    const updatedProfile = {
      ...profile,
      lastRewardTimestamp: now,
    };
    setProfile(updatedProfile);
    saveProfileMutation.mutate(updatedProfile);

    setPendingReward(reward);
    console.log('Reward triggered:', reward.unlockable.name);
  };

  const dismissReward = () => {
    setPendingReward(null);
  };

  const getUnlockedItems = () => {
    return rewards.map(r => r.unlockable);
  };

  const recordReplacementSelection = (replacementId: string, cravingId?: string) => {
    if (!profile) return;

    const selection: ReplacementSelection = {
      replacementId,
      timestamp: Date.now(),
      cravingId,
    };

    const history = profile.replacementSelectionHistory || [];
    const updatedHistory = [...history, selection];

    const newProfile = {
      ...profile,
      replacementSelectionHistory: updatedHistory,
    };

    setProfile(newProfile);
    saveProfileMutation.mutate(newProfile);
    console.log('Replacement selection recorded:', replacementId);
  };

  const getPersonalizedReplacements = (allSuggestions: any[], maxResults: number = 6) => {
    if (!profile) return allSuggestions.slice(0, maxResults);

    const history = profile.replacementSelectionHistory || [];
    const favorites = profile.favoriteReplacements || [];
    const hidden = profile.hiddenReplacements || [];

    const visible = allSuggestions.filter(s => !hidden.includes(s.id));

    if (history.length === 0) {
      const favItems = visible.filter(s => favorites.includes(s.id));
      const otherItems = visible.filter(s => !favorites.includes(s.id));
      const shuffled = [...favItems, ...otherItems.sort(() => Math.random() - 0.5)];
      return shuffled.slice(0, maxResults);
    }

    const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentSelections = history.filter(h => h.timestamp >= last30Days);

    const selectionCounts: Record<string, number> = {};
    recentSelections.forEach(s => {
      selectionCounts[s.replacementId] = (selectionCounts[s.replacementId] || 0) + 1;
    });

    const selectedIds = new Set(recentSelections.map(s => s.replacementId));
    const selectedItems = visible.filter(s => selectedIds.has(s.id));

    const categoryCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};

    selectedItems.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      item.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([cat]) => cat);

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);

    const scored = visible.map(item => {
      let score = 0;

      if (favorites.includes(item.id)) score += 100;

      const timesSelected = selectionCounts[item.id] || 0;
      score += timesSelected * 10;

      if (topCategories.includes(item.category)) score += 20;

      const matchingTags = item.tags?.filter((tag: string) => topTags.includes(tag)).length || 0;
      score += matchingTags * 15;

      const daysSinceLastSelection = recentSelections
        .filter(s => s.replacementId === item.id)
        .map(s => (Date.now() - s.timestamp) / (1000 * 60 * 60 * 24))
        .sort((a, b) => a - b)[0];

      if (daysSinceLastSelection !== undefined && daysSinceLastSelection < 7) {
        score -= (7 - daysSinceLastSelection) * 5;
      }

      score += Math.random() * 10;

      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, maxResults).map(s => s.item);
  };

  return {
    profile,
    cravings,
    streak,
    calmMomentum,
    coachMessages,
    rewards,
    pendingReward,
    todayCravings,
    resistedToday,
    shouldShowStreaks,
    shouldShowMomentum,
    completeOnboarding,
    addCraving,
    updateCravingOutcome,
    updateCravingFeedback,
    updateCravingDelayUsed,
    updateCravingDelayData,
    addCoachMessage,
    clearCoachMessages,
    clearAllData,
    exportData,
    markMessageHelpCheckComplete,
    activateDistressMode,
    deactivateDistressMode,
    pauseStreak,
    resumeStreak,
    setMomentumResting,
    setMomentumActive,
    incrementPausesCompleted,
    toggleFavoriteReplacement,
    toggleHiddenReplacement,
    addXP,
    changeCoachTone,
    getXPProgress,
    triggerReward,
    dismissReward,
    getUnlockedItems,
    recordReplacementSelection,
    getPersonalizedReplacements,
    isLoading: profileQuery.isLoading || cravingsQuery.isLoading || streakQuery.isLoading || calmMomentumQuery.isLoading || coachMessagesQuery.isLoading || rewardsQuery.isLoading,
  };
});
