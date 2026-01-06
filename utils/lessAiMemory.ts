import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserInsightProfile, AiTurn, Craving, RecentStats } from '@/types';

export function incrementStat(map: Record<string, number>, key: string, amount: number = 1): Record<string, number> {
  const updated = { ...map };
  updated[key] = (updated[key] || 0) + amount;
  return updated;
}

export function topK(map: Record<string, number>, k: number): [string, number][] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, k);
}

export function computeConfidence(primaryCount: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((primaryCount / total) * 100) / 100;
}

export function pruneStats(map: Record<string, number>, maxKeys: number = 20): Record<string, number> {
  const sorted = topK(map, maxKeys);
  return Object.fromEntries(sorted);
}

export interface InferredSignals {
  inferredTimeBucket?: string;
  inferredTriggers: string[];
  inferredSweetPrefs: string[];
  inferredEmotions: string[];
}

export function inferSignalsFromUserText(text: string, now: number = Date.now()): InferredSignals {
  const lowerText = text.toLowerCase();
  
  const result: InferredSignals = {
    inferredTriggers: [],
    inferredSweetPrefs: [],
    inferredEmotions: [],
  };
  
  const hour = new Date(now).getHours();
  if (hour >= 5 && hour < 12) {
    result.inferredTimeBucket = 'morning';
  } else if (hour >= 12 && hour < 17) {
    result.inferredTimeBucket = 'afternoon';
  } else if (hour >= 17 && hour < 22) {
    result.inferredTimeBucket = 'evening';
  } else {
    result.inferredTimeBucket = 'late-night';
  }
  
  if (lowerText.includes('night') || lowerText.includes('late') || lowerText.includes('midnight') || lowerText.includes('before bed')) {
    result.inferredTimeBucket = 'late-night';
  } else if (lowerText.includes('morning') || lowerText.includes('breakfast')) {
    result.inferredTimeBucket = 'morning';
  } else if (lowerText.includes('afternoon') || lowerText.includes('after lunch')) {
    result.inferredTimeBucket = 'afternoon';
  } else if (lowerText.includes('evening') || lowerText.includes('dinner')) {
    result.inferredTimeBucket = 'evening';
  }
  
  if (lowerText.includes('stress') || lowerText.includes('stressed') || lowerText.includes('overwhelm') || lowerText.includes('pressure')) {
    result.inferredTriggers.push('stressed');
    result.inferredEmotions.push('stressed');
  }
  if (lowerText.includes('bored') || lowerText.includes('boring') || lowerText.includes('nothing to do')) {
    result.inferredTriggers.push('bored');
    result.inferredEmotions.push('bored');
  }
  if (lowerText.includes('tired') || lowerText.includes('exhausted') || lowerText.includes('sleepy') || lowerText.includes('fatigue')) {
    result.inferredTriggers.push('tired');
    result.inferredEmotions.push('tired');
  }
  if (lowerText.includes('anxious') || lowerText.includes('anxiety') || lowerText.includes('worried') || lowerText.includes('nervous')) {
    result.inferredTriggers.push('anxious');
    result.inferredEmotions.push('anxious');
  }
  if (lowerText.includes('sad') || lowerText.includes('down') || lowerText.includes('depressed') || lowerText.includes('blue')) {
    result.inferredTriggers.push('sad');
    result.inferredEmotions.push('sad');
  }
  if (lowerText.includes('deserve') || lowerText.includes('treat') || lowerText.includes('reward') || lowerText.includes('earned')) {
    result.inferredTriggers.push('celebratory');
    result.inferredEmotions.push('celebratory');
  }
  if (lowerText.includes('work') && (lowerText.includes('after') || lowerText.includes('stress'))) {
    result.inferredTriggers.push('stressed');
  }
  
  if (lowerText.includes('chocolate')) {
    result.inferredSweetPrefs.push('chocolate');
  }
  if (lowerText.includes('candy') || lowerText.includes('candies')) {
    result.inferredSweetPrefs.push('candy');
  }
  if (lowerText.includes('soda') || lowerText.includes('pop') || lowerText.includes('soft drink')) {
    result.inferredSweetPrefs.push('soda');
  }
  if (lowerText.includes('ice cream') || lowerText.includes('icecream')) {
    result.inferredSweetPrefs.push('ice-cream');
  }
  if (lowerText.includes('dessert') || lowerText.includes('sweet')) {
    result.inferredSweetPrefs.push('other');
  }
  if (lowerText.includes('cookie') || lowerText.includes('cookies')) {
    result.inferredSweetPrefs.push('cookies');
  }
  if (lowerText.includes('cake') || lowerText.includes('cupcake')) {
    result.inferredSweetPrefs.push('cake');
  }
  if (lowerText.includes('pastry') || lowerText.includes('pastries') || lowerText.includes('donut') || lowerText.includes('doughnut')) {
    result.inferredSweetPrefs.push('pastry');
  }
  
  return result;
}

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
        triggerStats: {},
        emotionStats: {},
        sweetPreferenceStats: {},
        timeBucketStats: {},
        patternConfidence: {},
      };
    }
    const parsed = JSON.parse(stored);
    if (!parsed.triggerStats) parsed.triggerStats = {};
    if (!parsed.emotionStats) parsed.emotionStats = {};
    if (!parsed.sweetPreferenceStats) parsed.sweetPreferenceStats = {};
    if (!parsed.timeBucketStats) parsed.timeBucketStats = {};
    if (!parsed.patternConfidence) parsed.patternConfidence = {};
    return parsed;
  } catch (error) {
    console.error('Error loading AI insight profile:', error);
    return {
      tonePreference: 'gentle',
      peakCravingTimes: [],
      topTriggers: [],
      sweetPreferences: [],
      commonEmotions: [],
      distressFlag: false,
      triggerStats: {},
      emotionStats: {},
      sweetPreferenceStats: {},
      timeBucketStats: {},
      patternConfidence: {},
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
    avgIntensity?: number;
  }
): string {
  const parts: string[] = [];
  
  parts.push('IMPORTANT CONTEXT (use this first):');
  
  const triggerStats = profile.triggerStats || {};
  const timeBucketStats = profile.timeBucketStats || {};
  const totalTriggers = Object.values(triggerStats).reduce((sum, val) => sum + val, 0);
  const totalTimeBuckets = Object.values(timeBucketStats).reduce((sum, val) => sum + val, 0);
  
  if (profile.patternConfidence?.primaryTrigger && profile.patternConfidence?.triggerConfidence) {
    const primaryCount = triggerStats[profile.patternConfidence.primaryTrigger] || 0;
    parts.push(`• Primary trigger: ${profile.patternConfidence.primaryTrigger} (${primaryCount}/${totalTriggers}, confidence ${profile.patternConfidence.triggerConfidence})`);
  } else if (totalTriggers >= 3) {
    const top = topK(triggerStats, 1)[0];
    if (top) {
      const conf = computeConfidence(top[1], totalTriggers);
      parts.push(`• Primary trigger: ${top[0]} (${top[1]}/${totalTriggers}, confidence ${conf})`);
    }
  }
  
  if (profile.patternConfidence?.peakTime && profile.patternConfidence?.timeConfidence) {
    const peakCount = timeBucketStats[profile.patternConfidence.peakTime] || 0;
    parts.push(`• Peak time: ${profile.patternConfidence.peakTime} (${peakCount}/${totalTimeBuckets}, confidence ${profile.patternConfidence.timeConfidence})`);
  } else if (totalTimeBuckets >= 3) {
    const top = topK(timeBucketStats, 1)[0];
    if (top) {
      const conf = computeConfidence(top[1], totalTimeBuckets);
      parts.push(`• Peak time: ${top[0]} (${top[1]}/${totalTimeBuckets}, confidence ${conf})`);
    }
  }
  
  if (profile.goalMode) {
    parts.push(`• Goal mode: ${profile.goalMode}`);
  }
  
  parts.push(`• Distress mode: ${profile.distressFlag ? 'true' : 'false'}`);
  
  parts.push('\nAdditional context:');
  
  const sweetStats = profile.sweetPreferenceStats || {};
  const topSweets = topK(sweetStats, 2);
  if (topSweets.length > 0) {
    const sweetStr = topSweets.map(([name, count]) => `${name} (${count})`).join(', ');
    parts.push(`• Sweet prefs: ${sweetStr}`);
  }
  
  parts.push(`• Last 7d: cravings=${stats.cravingsCount7d}, delay completion=${stats.delayCompletionRate7d}%, avg intensity drop=${stats.avgIntensityDropAfterDelay7d}`);
  
  if (currentMoment) {
    parts.push('\nCurrent moment:');
    if (currentMoment.timeBucket) {
      const isPeak = profile.patternConfidence?.peakTime === currentMoment.timeBucket;
      parts.push(`• Time bucket: ${currentMoment.timeBucket}${isPeak ? ' (peak time)' : ''}`);
    }
    if (currentMoment.intensity !== undefined) {
      let intensityStr = `• Intensity: ${currentMoment.intensity}`;
      if (currentMoment.avgIntensity !== undefined && currentMoment.avgIntensity > 0) {
        const delta = currentMoment.intensity - currentMoment.avgIntensity;
        if (Math.abs(delta) >= 1) {
          intensityStr += ` (${delta > 0 ? '+' : ''}${delta.toFixed(1)} vs usual)`;
        }
      }
      parts.push(intensityStr);
    }
    if (currentMoment.emotion) {
      const isPrimary = profile.patternConfidence?.primaryTrigger === currentMoment.emotion;
      parts.push(`• Emotion: ${currentMoment.emotion}${isPrimary ? ' (primary trigger)' : ''}`);
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
  
  let triggerStats = { ...(updated.triggerStats || {}) };
  let sweetStats = { ...(updated.sweetPreferenceStats || {}) };
  let timeStats = { ...(updated.timeBucketStats || {}) };
  
  if (updates.addTriggers && updates.addTriggers.length > 0) {
    const existing = updated.topTriggers || [];
    const merged = [...new Set([...existing, ...updates.addTriggers])];
    updated.topTriggers = merged.slice(0, 10);
    
    updates.addTriggers.forEach(trigger => {
      triggerStats = incrementStat(triggerStats, trigger, 1);
    });
  }
  
  if (updates.addSweetPreferences && updates.addSweetPreferences.length > 0) {
    const existing = updated.sweetPreferences || [];
    const merged = [...new Set([...existing, ...updates.addSweetPreferences])];
    updated.sweetPreferences = merged.slice(0, 10);
    
    updates.addSweetPreferences.forEach(sweet => {
      sweetStats = incrementStat(sweetStats, sweet, 1);
    });
  }
  
  if (updates.addPeakTimes && updates.addPeakTimes.length > 0) {
    const existing = updated.peakCravingTimes || [];
    const merged = [...new Set([...existing, ...updates.addPeakTimes])];
    updated.peakCravingTimes = merged.slice(0, 10);
    
    updates.addPeakTimes.forEach(time => {
      timeStats = incrementStat(timeStats, time, 1);
    });
  }
  
  if (updates.distressFlag !== undefined) {
    updated.distressFlag = updates.distressFlag;
  }
  
  updated.triggerStats = pruneStats(triggerStats, 20);
  updated.sweetPreferenceStats = pruneStats(sweetStats, 20);
  updated.timeBucketStats = pruneStats(timeStats, 20);
  
  const totalTriggers = Object.values(updated.triggerStats).reduce((sum, val) => sum + val, 0);
  const totalTimes = Object.values(updated.timeBucketStats).reduce((sum, val) => sum + val, 0);
  
  if (totalTriggers >= 3) {
    const topTrigger = topK(updated.triggerStats, 1)[0];
    if (topTrigger) {
      updated.patternConfidence = {
        ...updated.patternConfidence,
        primaryTrigger: topTrigger[0],
        triggerConfidence: computeConfidence(topTrigger[1], totalTriggers),
      };
    }
  }
  
  if (totalTimes >= 3) {
    const topTime = topK(updated.timeBucketStats, 1)[0];
    if (topTime) {
      updated.patternConfidence = {
        ...updated.patternConfidence,
        peakTime: topTime[0],
        timeConfidence: computeConfidence(topTime[1], totalTimes),
      };
    }
  }
  
  return updated;
}
