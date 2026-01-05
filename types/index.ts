export type GoalMode = 'quit' | 'reduce' | 'weight-loss' | 'diabetes' | 'habit-control';

export type Emotion = 'stressed' | 'bored' | 'sad' | 'happy' | 'anxious' | 'tired' | 'celebratory' | 'other';

export type SweetType = 'chocolate' | 'candy' | 'ice-cream' | 'cookies' | 'cake' | 'pastry' | 'soda' | 'other';

export type CravingOutcome = 'resisted' | 'small-portion' | 'gave-in';

export interface Craving {
  id: string;
  timestamp: number;
  sweetType: SweetType;
  intensity: number;
  emotion: Emotion;
  outcome?: CravingOutcome;
  delayUsed: boolean;
  notes?: string;
}

export interface UserProfile {
  goalMode: GoalMode;
  startDate: number;
  hasCompletedOnboarding: boolean;
}

export interface Streak {
  current: number;
  longest: number;
  lastCravingDate: number | null;
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
