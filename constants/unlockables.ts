import { Unlockable } from '@/types';

export const UNLOCKABLES: Unlockable[] = [
  {
    id: 'stabilizer-calm-wave',
    type: 'stabilizer-style',
    name: 'Calm Wave',
    description: 'A gentle wave pulse for your stabilizer',
    icon: '🌊',
  },
  {
    id: 'stabilizer-heartbeat',
    type: 'stabilizer-style',
    name: 'Heartbeat',
    description: 'Sync with your calm heartbeat',
    icon: '💓',
  },
  {
    id: 'stabilizer-zen-glow',
    type: 'stabilizer-style',
    name: 'Zen Glow',
    description: 'A peaceful glowing pulse',
    icon: '✨',
  },
  {
    id: 'theme-sunset',
    type: 'theme',
    name: 'Sunset Theme',
    description: 'Warm orange and pink gradient',
    icon: '🌅',
  },
  {
    id: 'theme-ocean',
    type: 'theme',
    name: 'Ocean Theme',
    description: 'Cool blue and teal colors',
    icon: '🌊',
  },
  {
    id: 'theme-forest',
    type: 'theme',
    name: 'Forest Theme',
    description: 'Natural green and earth tones',
    icon: '🌲',
  },
  {
    id: 'reflection-card-triumph',
    type: 'reflection-card',
    name: 'Triumph Card',
    description: 'Celebrate your victories',
    icon: '🏆',
  },
  {
    id: 'reflection-card-growth',
    type: 'reflection-card',
    name: 'Growth Card',
    description: 'Track your personal growth',
    icon: '🌱',
  },
  {
    id: 'insight-weekend',
    type: 'insight-type',
    name: 'Weekend Patterns',
    description: 'See how weekends affect your cravings',
    icon: '📅',
  },
  {
    id: 'insight-streaks',
    type: 'insight-type',
    name: 'Streak Analysis',
    description: 'Understand your momentum patterns',
    icon: '🔥',
  },
];

export const getRandomUnlockable = (excludeIds: string[]): Unlockable | null => {
  const available = UNLOCKABLES.filter(u => !excludeIds.includes(u.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
};
