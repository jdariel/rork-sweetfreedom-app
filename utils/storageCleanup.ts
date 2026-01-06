import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = [
  '@craveless_profile',
  '@craveless_cravings',
  '@craveless_streak',
  '@craveless_calm_momentum',
  '@craveless_coach_messages',
  '@craveless_rewards',
  '@craveless_rewards_state',
  '@craveless_ai_insight_profile',
  '@craveless_ai_turns',
];

export async function cleanupCorruptStorage(): Promise<void> {
  console.log('[Storage Cleanup] Starting validation...');
  let cleanedCount = 0;

  for (const key of STORAGE_KEYS) {
    try {
      const stored = await AsyncStorage.getItem(key);
      
      if (!stored || stored === 'undefined' || stored === 'null' || stored.trim() === '') {
        continue;
      }

      if (!stored.startsWith('{') && !stored.startsWith('[')) {
        console.warn(`[Storage Cleanup] Invalid format for ${key}, removing`);
        await AsyncStorage.removeItem(key);
        cleanedCount++;
        continue;
      }

      try {
        const parsed = JSON.parse(stored);
        
        if (key.includes('profile') && Array.isArray(parsed)) {
          console.warn(`[Storage Cleanup] Profile is array, removing ${key}`);
          await AsyncStorage.removeItem(key);
          cleanedCount++;
        } else if ((key.includes('cravings') || key.includes('messages') || key.includes('rewards') || key.includes('turns')) && !Array.isArray(parsed)) {
          if (key !== '@craveless_rewards_state' && key !== '@craveless_ai_insight_profile') {
            console.warn(`[Storage Cleanup] Expected array for ${key}, removing`);
            await AsyncStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch {
        console.warn(`[Storage Cleanup] Parse error for ${key}, removing`);
        await AsyncStorage.removeItem(key);
        cleanedCount++;
      }
    } catch (error) {
      console.error(`[Storage Cleanup] Error checking ${key}:`, error);
    }
  }

  if (cleanedCount > 0) {
    console.log(`[Storage Cleanup] Cleaned ${cleanedCount} corrupt entries`);
  } else {
    console.log('[Storage Cleanup] All storage entries valid');
  }
}
