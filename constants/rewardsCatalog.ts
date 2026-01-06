import { RewardItem } from '@/types';

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950
];

export const getLevelFromXP = (totalXP: number): number => {
  if (totalXP < LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]) {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalXP >= LEVEL_THRESHOLDS[i]) return i;
    }
    return 0;
  }
  const xpAfter15 = totalXP - LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const levelsAfter15 = Math.floor(xpAfter15 / 900);
  return LEVEL_THRESHOLDS.length - 1 + levelsAfter15;
};

export const getXPForNextLevel = (level: number): number => {
  if (level < LEVEL_THRESHOLDS.length - 1) {
    return LEVEL_THRESHOLDS[level + 1];
  }
  const levelsAfter15 = level - (LEVEL_THRESHOLDS.length - 1);
  return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (levelsAfter15 + 1) * 900;
};

export const REWARDS_CATALOG: Record<string, Omit<RewardItem, 'isUnlocked' | 'unlockedAtISO' | 'isEquipped'>> = {
  theme_default: {
    id: 'theme_default',
    category: 'theme',
    name: 'Classic Calm',
    description: 'The original calm aesthetic',
    rarity: 'standard',
  },
  theme_dawn_quiet: {
    id: 'theme_dawn_quiet',
    category: 'theme',
    name: 'Dawn Quiet',
    description: 'Soft morning pastels and gentle light',
    rarity: 'standard',
  },
  theme_night_lantern: {
    id: 'theme_night_lantern',
    category: 'theme',
    name: 'Night Lantern',
    description: 'Deep blues with warm amber accents',
    rarity: 'standard',
  },
  theme_forest_soft: {
    id: 'theme_forest_soft',
    category: 'theme',
    name: 'Forest Soft',
    description: 'Natural greens and earthy browns',
    rarity: 'standard',
  },
  theme_ocean_mist: {
    id: 'theme_ocean_mist',
    category: 'theme',
    name: 'Ocean Mist',
    description: 'Cool blues with white foam accents',
    rarity: 'surprise',
  },
  theme_desert_sunset: {
    id: 'theme_desert_sunset',
    category: 'theme',
    name: 'Desert Sunset',
    description: 'Warm sands and golden hour hues',
    rarity: 'surprise',
  },
  circle_soft_pulse: {
    id: 'circle_soft_pulse',
    category: 'circleStyle',
    name: 'Soft Pulse',
    description: 'Gentle rhythmic breathing',
    rarity: 'standard',
  },
  circle_soft_pulse_plus: {
    id: 'circle_soft_pulse_plus',
    category: 'circleStyle',
    name: 'Soft Pulse+',
    description: 'Enhanced gentle breathing with subtle glow',
    rarity: 'standard',
  },
  circle_ocean_drift: {
    id: 'circle_ocean_drift',
    category: 'circleStyle',
    name: 'Ocean Drift',
    description: 'Slow wave-like motion',
    rarity: 'standard',
  },
  circle_box_breathing: {
    id: 'circle_box_breathing',
    category: 'circleStyle',
    name: 'Box Breathing',
    description: '4-4-4-4 structured breathing pattern',
    rarity: 'standard',
  },
  circle_heartbeat: {
    id: 'circle_heartbeat',
    category: 'circleStyle',
    name: 'Heartbeat',
    description: 'Double-pulse rhythm pattern',
    rarity: 'surprise',
  },
  tone_gentle: {
    id: 'tone_gentle',
    category: 'tonePack',
    name: 'Gentle',
    description: 'Soft, nurturing support',
    rarity: 'standard',
  },
  tone_direct_kind: {
    id: 'tone_direct_kind',
    category: 'tonePack',
    name: 'Direct but Kind',
    description: 'Clear guidance with warmth',
    rarity: 'standard',
  },
  tone_minimal: {
    id: 'tone_minimal',
    category: 'tonePack',
    name: 'Minimal',
    description: 'Short, focused messages',
    rarity: 'standard',
  },
  tone_playful_warm: {
    id: 'tone_playful_warm',
    category: 'tonePack',
    name: 'Playful Warm',
    description: 'Light and encouraging (non-craving moments)',
    rarity: 'standard',
  },
  deck_classic: {
    id: 'deck_classic',
    category: 'deckSkin',
    name: 'Classic Cards',
    description: 'Traditional card design',
    rarity: 'standard',
  },
  deck_polaroid: {
    id: 'deck_polaroid',
    category: 'deckSkin',
    name: 'Polaroid Memories',
    description: 'Vintage photo-style cards',
    rarity: 'surprise',
  },
  deck_minimal_ink: {
    id: 'deck_minimal_ink',
    category: 'deckSkin',
    name: 'Minimal Ink',
    description: 'Clean line art style',
    rarity: 'surprise',
  },
  insight_top_trigger_card: {
    id: 'insight_top_trigger_card',
    category: 'insight',
    name: 'Top Trigger Card',
    description: 'See your most common trigger at a glance',
    rarity: 'standard',
  },
  insight_peak_time: {
    id: 'insight_peak_time',
    category: 'insight',
    name: 'Peak Time Insight',
    description: 'Know when cravings are strongest',
    rarity: 'standard',
  },
  insight_pause_effectiveness: {
    id: 'insight_pause_effectiveness',
    category: 'insight',
    name: 'Pause Effectiveness View',
    description: 'See how pausing reduces intensity',
    rarity: 'standard',
  },
  insight_emotion_pattern: {
    id: 'insight_emotion_pattern',
    category: 'insight',
    name: 'Emotion Pattern Card',
    description: 'Understand your emotional triggers',
    rarity: 'standard',
  },
  qol_quiet_mode: {
    id: 'qol_quiet_mode',
    category: 'qol',
    name: 'Quiet Mode',
    description: 'Less speaks less, fewer prompts',
    rarity: 'standard',
  },
};

export const LEVEL_REWARDS: Record<number, string> = {
  1: 'theme_default',
  2: 'theme_dawn_quiet',
  3: 'circle_soft_pulse_plus',
  4: 'insight_top_trigger_card',
  5: 'tone_direct_kind',
  6: 'theme_night_lantern',
  7: 'insight_peak_time',
  8: 'circle_ocean_drift',
  9: 'tone_minimal',
  10: 'insight_pause_effectiveness',
  11: 'theme_forest_soft',
  12: 'insight_emotion_pattern',
  13: 'circle_box_breathing',
  14: 'tone_playful_warm',
  15: 'qol_quiet_mode',
};

export const SURPRISE_REWARD_POOL: string[] = [
  'theme_ocean_mist',
  'theme_desert_sunset',
  'circle_heartbeat',
  'deck_polaroid',
  'deck_minimal_ink',
];

export const getRewardForLevel = (level: number): RewardItem | null => {
  const rewardId = LEVEL_REWARDS[level];
  if (!rewardId) return null;
  
  const catalogItem = REWARDS_CATALOG[rewardId];
  if (!catalogItem) return null;
  
  return {
    ...catalogItem,
    isUnlocked: true,
    unlockedAtISO: new Date().toISOString(),
    isEquipped: false,
  };
};

export const getSurpriseReward = (unlockedIds: string[]): RewardItem | null => {
  const available = SURPRISE_REWARD_POOL.filter(id => !unlockedIds.includes(id));
  if (available.length === 0) return null;
  
  const randomId = available[Math.floor(Math.random() * available.length)];
  const catalogItem = REWARDS_CATALOG[randomId];
  if (!catalogItem) return null;
  
  return {
    ...catalogItem,
    isUnlocked: true,
    unlockedAtISO: new Date().toISOString(),
    isEquipped: false,
    rarity: 'surprise',
  };
};

export const getDefaultEquipped = () => ({
  themeId: 'theme_default',
  circleStyleId: 'circle_soft_pulse',
  tonePackId: 'tone_gentle',
  deckSkinId: 'deck_classic',
});

export const initializeDefaultRewards = (): Record<string, RewardItem> => {
  const defaults: Record<string, RewardItem> = {};
  
  const defaultIds = ['theme_default', 'circle_soft_pulse', 'tone_gentle', 'deck_classic'];
  
  defaultIds.forEach(id => {
    const catalogItem = REWARDS_CATALOG[id];
    if (catalogItem) {
      defaults[id] = {
        ...catalogItem,
        isUnlocked: true,
        unlockedAtISO: new Date().toISOString(),
        isEquipped: true,
      };
    }
  });
  
  return defaults;
};
