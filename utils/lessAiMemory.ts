import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserInsightProfile, AiTurn, Craving, RecentStats } from '@/types';

const STORAGE_KEYS = {
  AI_INSIGHT_PROFILE: '@craveless_ai_insight_profile',
  AI_TURNS: '@craveless_ai_turns',
};

const MAX_TURNS = 10;

export async function loadUserInsightProfile(): Promise<UserInsightProfile> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.AI_INSIGHT_PROFILE);
    if (!stored || stored === 'undefined' || stored === 'null') {
      return {
        tonePreference: 'gentle',
        peakCravingTimes: [],
        topTriggers: [],
        sweetPreferences: [],
        commonEmotions: [],
        distressFlag: false,
      };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading AI insight profile:', error);
    return {
      tonePreference: 'gentle',
      peakCravingTimes: [],
      topTriggers: [],
      sweetPreferences: [],
      commonEmotions: [],
      distressFlag: false,
    };
  }
}

export async function saveUserInsightProfile(profile: UserInsightProfile): Promise<void> {
  try {
    const updated = {
      ...profile,
      lastUpdatedISO: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.AI_INSIGHT_PROFILE, JSON.stringify(updated));
    console.log('AI insight profile saved:', updated);
  } catch (error) {
    console.error('Error saving AI insight profile:', error);
  }
}

export async function loadAiTurns(): Promise<AiTurn[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.AI_TURNS);
    if (!stored || stored === 'undefined' || stored === 'null') return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading AI turns:', error);
    return [];
  }
}

export async function saveAiTurns(turns: AiTurn[]): Promise<void> {
  try {
    const limited = turns.slice(-MAX_TURNS);
    await AsyncStorage.setItem(STORAGE_KEYS.AI_TURNS, JSON.stringify(limited));
  } catch (error) {
    console.error('Error saving AI turns:', error);
  }
}

export async function addAiTurn(role: 'user' | 'assistant', content: string): Promise<void> {
  try {
    const turns = await loadAiTurns();
    const newTurn: AiTurn = {
      id: `${Date.now()}-${Math.random()}`,
      timestampISO: new Date().toISOString(),
      role,
      content: content.trim(),
    };
    const updated = [...turns, newTurn].slice(-MAX_TURNS);
    await saveAiTurns(updated);
  } catch (error) {
    console.error('Error adding AI turn:', error);
  }
}

export function buildRecentStats(cravings: Craving[], now: number = Date.now()): RecentStats {
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recent = cravings.filter(c => c.timestamp >= sevenDaysAgo);

  const timeMap: Record<string, number> = {};
  const emotionMap: Record<string, number> = {};
  const triggerMap: Record<string, number> = {};
  
  let delayCompleted = 0;
  let delayStarted = 0;
  let totalIntensityDrop = 0;
  let intensityDropCount = 0;

  recent.forEach(c => {
    const hour = new Date(c.timestamp).getHours();
    let timeBucket = '';
    if (hour >= 5 && hour < 12) timeBucket = 'morning';
    else if (hour >= 12 && hour < 17) timeBucket = 'afternoon';
    else if (hour >= 17 && hour < 22) timeBucket = 'evening';
    else timeBucket = 'late-night';
    
    timeMap[timeBucket] = (timeMap[timeBucket] || 0) + 1;

    if (c.emotion) {
      emotionMap[c.emotion] = (emotionMap[c.emotion] || 0) + 1;
      triggerMap[c.emotion] = (triggerMap[c.emotion] || 0) + 1;
    }

    if (c.delayUsed) {
      delayStarted++;
      if (c.delayCompletedAt) {
        delayCompleted++;
      }
    }

    if (c.postDelayIntensity !== undefined && c.intensity !== undefined) {
      const drop = c.intensity - c.postDelayIntensity;
      if (drop > 0) {
        totalIntensityDrop += drop;
        intensityDropCount++;
      }
    }
  });

  const peakTimeBuckets = Object.entries(timeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([bucket]) => bucket);

  const topEmotions = Object.entries(emotionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([emotion]) => emotion);

  const topTriggers = Object.entries(triggerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([trigger]) => trigger);

  const delayCompletionRate7d = delayStarted > 0 ? (delayCompleted / delayStarted) * 100 : 0;
  const avgIntensityDropAfterDelay7d = intensityDropCount > 0 ? totalIntensityDrop / intensityDropCount : 0;

  return {
    cravingsCount7d: recent.length,
    peakTimeBuckets,
    topEmotions,
    topTriggers,
    delayCompletionRate7d: Math.round(delayCompletionRate7d),
    avgIntensityDropAfterDelay7d: Math.round(avgIntensityDropAfterDelay7d * 10) / 10,
  };
}

export function buildLessContextSnapshot(
  profile: UserInsightProfile,
  stats: RecentStats,
  currentMoment?: {
    timeBucket?: string;
    intensity?: number;
    emotion?: string;
  }
): string {
  const parts: string[] = [];
  
  parts.push('User context:');
  
  if (profile.goalMode) {
    parts.push(`• Goal mode: ${profile.goalMode}`);
  }
  
  if (profile.tonePreference) {
    parts.push(`• Tone: ${profile.tonePreference}`);
  }
  
  if (profile.peakCravingTimes && profile.peakCravingTimes.length > 0) {
    parts.push(`• Peak times: ${profile.peakCravingTimes.join(', ')}`);
  } else if (stats.peakTimeBuckets.length > 0) {
    parts.push(`• Peak times: ${stats.peakTimeBuckets.join(', ')}`);
  }
  
  if (profile.topTriggers && profile.topTriggers.length > 0) {
    parts.push(`• Top triggers: ${profile.topTriggers.join(', ')}`);
  } else if (stats.topTriggers.length > 0) {
    parts.push(`• Top triggers: ${stats.topTriggers.join(', ')}`);
  }
  
  if (profile.sweetPreferences && profile.sweetPreferences.length > 0) {
    parts.push(`• Sweet prefs: ${profile.sweetPreferences.join(', ')}`);
  }
  
  parts.push(`• Last 7d: cravings=${stats.cravingsCount7d}, delay completion=${stats.delayCompletionRate7d}%, avg intensity drop=${stats.avgIntensityDropAfterDelay7d}`);
  
  if (profile.distressFlag) {
    parts.push(`• Distress mode: true`);
  } else {
    parts.push(`• Distress mode: false`);
  }
  
  if (currentMoment) {
    parts.push('\nCurrent moment:');
    if (currentMoment.timeBucket) {
      parts.push(`• Time bucket: ${currentMoment.timeBucket}`);
    }
    if (currentMoment.intensity !== undefined) {
      parts.push(`• Intensity: ${currentMoment.intensity}`);
    }
    if (currentMoment.emotion) {
      parts.push(`• Emotion: ${currentMoment.emotion}`);
    }
  }
  
  return parts.join('\n');
}

export function applyMemoryUpdates(
  profile: UserInsightProfile,
  updates: {
    goalMode?: 'reduce' | 'quit' | 'weight' | 'health' | 'habit' | null;
    addTriggers?: string[];
    addSweetPreferences?: string[];
    addPeakTimes?: string[];
    tonePreference?: 'professional-calm' | 'gentle' | 'direct' | null;
    distressFlag?: boolean;
  }
): UserInsightProfile {
  const updated = { ...profile };
  
  if (updates.goalMode && updates.goalMode !== null) {
    updated.goalMode = updates.goalMode;
  }
  
  if (updates.tonePreference && updates.tonePreference !== null) {
    updated.tonePreference = updates.tonePreference;
  }
  
  if (updates.addTriggers && updates.addTriggers.length > 0) {
    const existing = updated.topTriggers || [];
    const merged = [...new Set([...existing, ...updates.addTriggers])];
    updated.topTriggers = merged.slice(0, 10);
  }
  
  if (updates.addSweetPreferences && updates.addSweetPreferences.length > 0) {
    const existing = updated.sweetPreferences || [];
    const merged = [...new Set([...existing, ...updates.addSweetPreferences])];
    updated.sweetPreferences = merged.slice(0, 10);
  }
  
  if (updates.addPeakTimes && updates.addPeakTimes.length > 0) {
    const existing = updated.peakCravingTimes || [];
    const merged = [...new Set([...existing, ...updates.addPeakTimes])];
    updated.peakCravingTimes = merged.slice(0, 10);
  }
  
  if (updates.distressFlag !== undefined) {
    updated.distressFlag = updates.distressFlag;
  }
  
  return updated;
}
