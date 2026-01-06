import AsyncStorage from '@react-native-async-storage/async-storage';

const OLD_KEYS = {
  PROFILE: '@sweetfreedom_profile',
  CRAVINGS: '@sweetfreedom_cravings',
  STREAK: '@sweetfreedom_streak',
  COACH_MESSAGES: '@sweetfreedom_coach_messages',
  REWARDS: '@sweetfreedom_rewards',
  AI_INSIGHT_PROFILE: '@sweetfreedom_ai_insight_profile',
  AI_TURNS: '@sweetfreedom_ai_turns',
};

const NEW_KEYS = {
  PROFILE: '@craveless_profile',
  CRAVINGS: '@craveless_cravings',
  STREAK: '@craveless_streak',
  COACH_MESSAGES: '@craveless_coach_messages',
  REWARDS: '@craveless_rewards',
  AI_INSIGHT_PROFILE: '@craveless_ai_insight_profile',
  AI_TURNS: '@craveless_ai_turns',
  MIGRATION_COMPLETE: '@craveless_migration_complete',
};

export async function migrateStorageKeysIfNeeded(): Promise<void> {
  try {
    const migrationComplete = await AsyncStorage.getItem(NEW_KEYS.MIGRATION_COMPLETE);
    
    if (migrationComplete === 'true') {
      console.log('[Storage Migration] Already completed, skipping');
      return;
    }

    console.log('[Storage Migration] Starting migration from old keys to new keys...');

    const migrations = [
      { old: OLD_KEYS.PROFILE, new: NEW_KEYS.PROFILE },
      { old: OLD_KEYS.CRAVINGS, new: NEW_KEYS.CRAVINGS },
      { old: OLD_KEYS.STREAK, new: NEW_KEYS.STREAK },
      { old: OLD_KEYS.COACH_MESSAGES, new: NEW_KEYS.COACH_MESSAGES },
      { old: OLD_KEYS.REWARDS, new: NEW_KEYS.REWARDS },
      { old: OLD_KEYS.AI_INSIGHT_PROFILE, new: NEW_KEYS.AI_INSIGHT_PROFILE },
      { old: OLD_KEYS.AI_TURNS, new: NEW_KEYS.AI_TURNS },
    ];

    let migratedCount = 0;

    for (const { old, new: newKey } of migrations) {
      try {
        const existingNew = await AsyncStorage.getItem(newKey);
        
        if (existingNew && existingNew !== 'null' && existingNew !== 'undefined') {
          console.log(`[Storage Migration] ${newKey} already exists, skipping`);
          continue;
        }

        const oldValue = await AsyncStorage.getItem(old);
        
        if (oldValue && oldValue !== 'null' && oldValue !== 'undefined') {
          await AsyncStorage.setItem(newKey, oldValue);
          console.log(`[Storage Migration] Migrated ${old} → ${newKey}`);
          migratedCount++;
        }
      } catch (error) {
        console.error(`[Storage Migration] Error migrating ${old}:`, error);
      }
    }

    await AsyncStorage.setItem(NEW_KEYS.MIGRATION_COMPLETE, 'true');
    console.log(`[Storage Migration] Complete! Migrated ${migratedCount} items.`);
  } catch (error) {
    console.error('[Storage Migration] Fatal error during migration:', error);
  }
}
