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
      
      if (!stored) {
        continue;
      }

      if (stored === 'undefined' || stored === 'null' || stored.trim() === '' || stored === '{}' || stored === '[]') {
        console.warn(`[Storage Cleanup] Empty/invalid value for ${key}, removing`);
        await AsyncStorage.removeItem(key);
        cleanedCount++;
        continue;
      }

      if (!stored.startsWith('{') && !stored.startsWith('[')) {
        console.warn(`[Storage Cleanup] Non-JSON format for ${key} (starts with: ${stored.substring(0, 20)}), removing`);
        await AsyncStorage.removeItem(key);
        cleanedCount++;
        continue;
      }

      try {
        const parsed = JSON.parse(stored);
        
        if (parsed === null || parsed === undefined) {
          console.warn(`[Storage Cleanup] Null/undefined parsed value for ${key}, removing`);
          await AsyncStorage.removeItem(key);
          cleanedCount++;
          continue;
        }
        
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
      } catch (parseError) {
        console.warn(`[Storage Cleanup] Parse error for ${key}:`, parseError, 'Data preview:', stored.substring(0, 50));
        await AsyncStorage.removeItem(key);
        cleanedCount++;
      }
    } catch (error) {
      console.error(`[Storage Cleanup] Error checking ${key}:`, error);
      try {
        await AsyncStorage.removeItem(key);
        cleanedCount++;
      } catch {}
    }
  }

  if (cleanedCount > 0) {
    console.log(`[Storage Cleanup] Cleaned ${cleanedCount} corrupt entries`);
  } else {
    console.log('[Storage Cleanup] All storage entries valid');
  }
}
