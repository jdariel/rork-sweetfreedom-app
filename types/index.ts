export type GoalMode = 'quit' | 'reduce' | 'weight-loss' | 'diabetes' | 'habit-control';

export type Emotion = 'stressed' | 'bored' | 'sad' | 'happy' | 'anxious' | 'tired' | 'celebratory' | 'other';

export type SweetType = 'chocolate' | 'candy' | 'ice-cream' | 'cookies' | 'cake' | 'pastry' | 'soda' | 'other';

export type CravingOutcome = 'resisted' | 'small-portion' | 'gave-in';

export type MomentCardState = 'active' | 'cooling' | 'settled';

export interface Craving {
  id: string;
  timestamp: number;
  sweetType: SweetType;
  intensity: number;
  emotion: Emotion;
  outcome?: CravingOutcome;
  delayUsed: boolean;
  notes?: string;
  postDelayIntensity?: number;
  whatHelped?: string;
  delayStartedAt?: number;
  delayCompletedAt?: number;
  delayDurationSec?: number;
  stabilizerEngagementSec?: number;
}

export type UnlockableType = 'stabilizer-style' | 'theme' | 'coach-phrase-pack' | 'deck-skin' | 'badge';

export interface Unlockable {
  id: string;
  type: UnlockableType;
  name: string;
  description: string;
  icon?: string;
}

export interface UserProfile {
  goalMode: GoalMode;
  startDate: number;
  hasCompletedOnboarding: boolean;
  isInDistressMode?: boolean;
  distressModeActivatedAt?: number;
  favoriteReplacements?: string[];
  hiddenReplacements?: string[];
  replacementSelectionHistory?: ReplacementSelection[];
  xp: number;
  level: number;
  unlockedFeatures?: string[];
  coachTone?: 'warm' | 'neutral' | 'playful';
  selectedStabilizerStyle?: string;
  selectedTheme?: string;
  lastRewardTimestamp?: number;
  weeklyReflectionLastViewed?: number;
  xpActions?: XPAction[];
  lastActiveDate?: number;
}

export interface Streak {
  current: number;
  longest: number;
  lastCravingDate: number | null;
  isPaused?: boolean;
  pausedAt?: number;
}

export interface CalmMomentum {
  totalPausesCompleted: number;
  momentumState: 'active' | 'resting';
  restingReason?: 'slip' | 'distress' | 'manual';
  lastActiveISO?: string;
  lastRestISO?: string;
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  needsHelpCheck?: boolean;
}

export interface DailyStats {
  date: string;
  cravingsLogged: number;
  cravingsResisted: number;
  cravingsSmallPortion: number;
  cravingsGaveIn: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface XPAction {
  type: 
    | 'log-moment'
    | 'add-emotion'
    | 'add-note'
    | 'delay-start'
    | 'delay-1min'
    | 'delay-complete'
    | 'post-delay-checkin'
    | 'select-outcome'
    | 'coach-message'
    | 'coach-helped'
    | 'weekly-deck-open'
    | 'weekly-deck-complete'
    | 'weekly-highlight-save'
    | 'comeback-bonus';
  xp: number;
  label: string;
  timestamp: number;
}

export interface LevelData {
  level: number;
  xpRequired: number;
  unlocks: string[];
}

export interface SurpriseReward {
  id: string;
  unlockable: Unlockable;
  timestamp: number;
}

export interface WeeklyInsight {
  topEmotions: [string, number][];
  peakTime: string;
  whatHelpedMost: string;
  delaySuccessRate: number;
  avgIntensityDrop: number;
  totalMoments: number;
}

export interface ReplacementSelection {
  replacementId: string;
  timestamp: number;
  cravingId?: string;
}

export interface ReplacementSuggestion {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: 'fruit' | 'beverage' | 'protein' | 'activity' | 'mindful' | 'healthy-sweet';
  tags: string[];
}

export interface UserInsightProfile {
  goalMode?: 'reduce' | 'quit' | 'weight' | 'health' | 'habit';
  tonePreference?: 'professional-calm' | 'gentle' | 'direct';
  peakCravingTimes?: string[];
  topTriggers?: string[];
  sweetPreferences?: string[];
  commonEmotions?: string[];
  delaySuccessRate7d?: number;
  averageIntensityDrop7d?: number;
  distressFlag?: boolean;
  lastUpdatedISO?: string;
  triggerStats?: Record<string, number>;
  emotionStats?: Record<string, number>;
  sweetPreferenceStats?: Record<string, number>;
  timeBucketStats?: Record<string, number>;
  patternConfidence?: {
    primaryTrigger?: string;
    triggerConfidence?: number;
    peakTime?: string;
    timeConfidence?: number;
  };
}

export interface AiTurn {
  id: string;
  timestampISO: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface LessAiResult {
  assistantMessage: string;
  classification: 'normal' | 'slip' | 'health_condition' | 'disordered_eating' | 'mental_distress' | 'crisis' | 'medical_request';
  quickActions: string[];
  memoryUpdates: {
    goalMode: 'reduce' | 'quit' | 'weight' | 'health' | 'habit' | null;
    addTriggers: string[];
    addSweetPreferences: string[];
    addPeakTimes: string[];
    tonePreference: 'professional-calm' | 'gentle' | 'direct' | null;
    distressFlag: boolean;
  };
}

export interface RecentStats {
  cravingsCount7d: number;
  peakTimeBuckets: string[];
  topEmotions: string[];
  topTriggers: string[];
  delayCompletionRate7d: number;
  avgIntensityDropAfterDelay7d: number;
}
