import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { RewardsState, RewardItem, XpReason, XpEvent } from '@/types';
import { 
  getLevelFromXP, 
  getXPForNextLevel, 
  getRewardForLevel, 
  getSurpriseReward, 
  getDefaultEquipped, 
  initializeDefaultRewards 
} from '@/constants/rewardsCatalog';
import { shouldAwardXP, calculateXPToAward } from '@/utils/xp';

const STORAGE_KEY = '@craveless_rewards_state';

const createDefaultRewardsState = (): RewardsState => ({
  totalXP: 0,
  level: 1,
  unlocks: initializeDefaultRewards(),
  equipped: getDefaultEquipped(),
  rewardHistory: [],
  quietModeEnabled: false,
});

export const [RewardsProvider, useRewards] = createContextHook(() => {
  const [rewardsState, setRewardsState] = useState<RewardsState>(createDefaultRewardsState());
  const [pendingReward, setPendingReward] = useState<RewardItem | null>(null);
  const [pendingLevelUp, setPendingLevelUp] = useState<{ level: number; reward: RewardItem } | null>(null);

  const rewardsQuery = useQuery({
    queryKey: ['rewardsState'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          console.log('[Rewards] No stored data, using defaults');
          return createDefaultRewardsState();
        }

        if (stored === 'undefined' || stored === 'null' || stored.trim() === '' || stored === '{}' || stored === '[]') {
          console.log('[Rewards] Empty/invalid stored data, using defaults');
          await AsyncStorage.removeItem(STORAGE_KEY);
          return createDefaultRewardsState();
        }
        
        if (!stored.startsWith('{')) {
          console.error('[Rewards] Invalid JSON format (starts with:', stored.substring(0, 20), '), clearing');
          await AsyncStorage.removeItem(STORAGE_KEY);
          return createDefaultRewardsState();
        }
        
        let parsed;
        try {
          parsed = JSON.parse(stored);
        } catch (parseError) {
          console.error('[Rewards] JSON parse error:', parseError, 'Data:', stored.substring(0, 50));
          await AsyncStorage.removeItem(STORAGE_KEY);
          return createDefaultRewardsState();
        }
        
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          console.log('[Rewards] Invalid data type, using defaults');
          await AsyncStorage.removeItem(STORAGE_KEY);
          return createDefaultRewardsState();
        }
        
        console.log('[Rewards] Loaded from storage');
        return parsed;
      } catch (error) {
        console.error('[Rewards] Storage error:', error);
        try {
          await AsyncStorage.removeItem(STORAGE_KEY);
        } catch {}
        return createDefaultRewardsState();
      }
    },
    retry: false,
    retryOnMount: false,
  });

  const saveRewardsMutation = useMutation({
    mutationFn: async (newState: RewardsState) => {
      try {
        if (!newState || typeof newState !== 'object' || Array.isArray(newState)) {
          console.error('[RewardsState] Invalid data type, cannot save');
          return createDefaultRewardsState();
        }
        const jsonString = JSON.stringify(newState);
        if (!jsonString.startsWith('{')) {
          console.error('[RewardsState] JSON stringify produced invalid result');
          return newState;
        }
        await AsyncStorage.setItem(STORAGE_KEY, jsonString);
        return newState;
      } catch (error) {
        console.error('Error saving rewards state:', error);
        throw error;
      }
    }
  });

  useEffect(() => {
    if (rewardsQuery.data) {
      setRewardsState(rewardsQuery.data);
    }
  }, [rewardsQuery.data]);

  const awardXP = (
    reason: XpReason, 
    isDistressMode: boolean,
    lastActiveTimestamp?: number
  ): { awarded: boolean; xpGained: number; leveledUp: boolean; newLevel: number; reason?: string } => {
    const events: XpEvent[] = rewardsState.rewardHistory.map(h => ({
      reason: h.reason as XpReason,
      amount: 0,
      timestamp: new Date(h.atISO).getTime(),
    }));

    const shouldAward = shouldAwardXP(reason, events, isDistressMode, lastActiveTimestamp);
    
    if (!shouldAward.allowed) {
      console.log(`[XP] Not awarded: ${shouldAward.reason}`);
      return { 
        awarded: false, 
        xpGained: 0, 
        leveledUp: false, 
        newLevel: rewardsState.level,
        reason: shouldAward.reason 
      };
    }

    const xpAmount = calculateXPToAward(reason, events, isDistressMode);
    const newTotalXP = rewardsState.totalXP + xpAmount;
    const oldLevel = rewardsState.level;
    const newLevel = getLevelFromXP(newTotalXP);
    const leveledUp = newLevel > oldLevel;

    const newHistory = [
      ...rewardsState.rewardHistory,
      {
        id: `${Date.now()}-${Math.random()}`,
        atISO: new Date().toISOString(),
        reason,
      }
    ];

    let updatedUnlocks = { ...rewardsState.unlocks };

    if (leveledUp) {
      for (let level = oldLevel + 1; level <= newLevel; level++) {
        const reward = getRewardForLevel(level);
        if (reward && !updatedUnlocks[reward.id]) {
          updatedUnlocks[reward.id] = reward;
          console.log(`[Rewards] Unlocked level ${level} reward: ${reward.name}`);
          
          if (!isDistressMode) {
            setPendingLevelUp({ level, reward });
          }
        }
      }
    }

    const newState: RewardsState = {
      ...rewardsState,
      totalXP: newTotalXP,
      level: newLevel,
      unlocks: updatedUnlocks,
      rewardHistory: newHistory,
    };

    setRewardsState(newState);
    saveRewardsMutation.mutate(newState);

    console.log(`[XP] Awarded ${xpAmount} for ${reason}. Total: ${newTotalXP}, Level: ${newLevel}`);

    return {
      awarded: true,
      xpGained: xpAmount,
      leveledUp,
      newLevel,
    };
  };

  const triggerSurpriseReward = (
    trigger: 'delay-complete' | 'reflection' | 'return' | 'weekly-reflection',
    isDistressMode: boolean
  ): boolean => {
    if (isDistressMode) {
      console.log('[Surprise] Skipped: distress mode active');
      return false;
    }

    const lastRewardTime = rewardsState.lastRewardAtISO 
      ? new Date(rewardsState.lastRewardAtISO).getTime() 
      : 0;
    const hoursSinceLast = (Date.now() - lastRewardTime) / (1000 * 60 * 60);

    if (hoursSinceLast < 24) {
      console.log('[Surprise] Skipped: cooldown active');
      return false;
    }

    let chance = 0;
    if (trigger === 'delay-complete') chance = 0.15;
    else if (trigger === 'reflection') chance = 0.20;
    else if (trigger === 'return') chance = 0.30;
    else if (trigger === 'weekly-reflection') chance = 0.40;

    const roll = Math.random();
    if (roll >= chance) {
      console.log('[Surprise] Skipped: chance roll failed');
      return false;
    }

    const unlockedIds = Object.keys(rewardsState.unlocks);
    const surpriseReward = getSurpriseReward(unlockedIds);

    if (!surpriseReward) {
      console.log('[Surprise] Skipped: all surprise rewards unlocked');
      return false;
    }

    const newUnlocks = {
      ...rewardsState.unlocks,
      [surpriseReward.id]: surpriseReward,
    };

    const newState: RewardsState = {
      ...rewardsState,
      unlocks: newUnlocks,
      lastRewardAtISO: new Date().toISOString(),
    };

    setRewardsState(newState);
    saveRewardsMutation.mutate(newState);
    setPendingReward(surpriseReward);

    console.log(`[Surprise] Triggered: ${surpriseReward.name}`);
    return true;
  };

  const equipReward = (rewardId: string) => {
    const reward = rewardsState.unlocks[rewardId];
    if (!reward || !reward.isUnlocked) {
      console.log(`[Rewards] Cannot equip: ${rewardId} not unlocked`);
      return;
    }

    const updatedUnlocks = { ...rewardsState.unlocks };
    const category = reward.category;

    Object.keys(updatedUnlocks).forEach(id => {
      const item = updatedUnlocks[id];
      if (item.category === category) {
        item.isEquipped = false;
      }
    });

    updatedUnlocks[rewardId].isEquipped = true;

    let updatedEquipped = { ...rewardsState.equipped };
    if (category === 'theme') updatedEquipped.themeId = rewardId;
    else if (category === 'circleStyle') updatedEquipped.circleStyleId = rewardId;
    else if (category === 'tonePack') updatedEquipped.tonePackId = rewardId;
    else if (category === 'deckSkin') updatedEquipped.deckSkinId = rewardId;

    const newState: RewardsState = {
      ...rewardsState,
      unlocks: updatedUnlocks,
      equipped: updatedEquipped,
    };

    setRewardsState(newState);
    saveRewardsMutation.mutate(newState);
    console.log(`[Rewards] Equipped: ${reward.name}`);
  };

  const toggleQuietMode = () => {
    const qolUnlock = rewardsState.unlocks['qol_quiet_mode'];
    if (!qolUnlock || !qolUnlock.isUnlocked) {
      console.log('[Rewards] Quiet mode not unlocked');
      return;
    }

    const newState: RewardsState = {
      ...rewardsState,
      quietModeEnabled: !rewardsState.quietModeEnabled,
    };

    setRewardsState(newState);
    saveRewardsMutation.mutate(newState);
    console.log(`[Rewards] Quiet mode: ${newState.quietModeEnabled ? 'ON' : 'OFF'}`);
  };

  const dismissPendingReward = () => {
    setPendingReward(null);
  };

  const dismissPendingLevelUp = () => {
    setPendingLevelUp(null);
  };

  const getXPProgress = () => {
    const currentLevelXP = rewardsState.level === 1 ? 0 : getXPForNextLevel(rewardsState.level - 1);
    const nextLevelXP = getXPForNextLevel(rewardsState.level);
    const current = rewardsState.totalXP - currentLevelXP;
    const needed = nextLevelXP - currentLevelXP;
    const percentage = (current / needed) * 100;
    
    return { 
      current, 
      needed, 
      percentage: Math.min(100, Math.max(0, percentage)),
      totalXP: rewardsState.totalXP,
      level: rewardsState.level,
    };
  };

  const getUnlockedRewardsByCategory = (category: string) => {
    return Object.values(rewardsState.unlocks).filter(
      r => r.category === category && r.isUnlocked
    );
  };

  const isRewardUnlocked = (rewardId: string): boolean => {
    const reward = rewardsState.unlocks[rewardId];
    return reward ? reward.isUnlocked : false;
  };

  const getEquippedTheme = () => {
    return rewardsState.unlocks[rewardsState.equipped.themeId];
  };

  const getEquippedCircleStyle = () => {
    return rewardsState.unlocks[rewardsState.equipped.circleStyleId];
  };

  const getEquippedTonePack = () => {
    return rewardsState.unlocks[rewardsState.equipped.tonePackId];
  };

  const getEquippedDeckSkin = () => {
    return rewardsState.unlocks[rewardsState.equipped.deckSkinId];
  };

  return {
    rewardsState,
    pendingReward,
    pendingLevelUp,
    awardXP,
    triggerSurpriseReward,
    equipReward,
    toggleQuietMode,
    dismissPendingReward,
    dismissPendingLevelUp,
    getXPProgress,
    getUnlockedRewardsByCategory,
    isRewardUnlocked,
    getEquippedTheme,
    getEquippedCircleStyle,
    getEquippedTonePack,
    getEquippedDeckSkin,
    isLoading: rewardsQuery.isLoading,
  };
});
