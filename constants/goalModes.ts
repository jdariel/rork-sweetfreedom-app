import { GoalMode } from '@/types';

export const goalModeData: Record<GoalMode, { title: string; description: string; emoji: string }> = {
  'quit': {
    title: 'Quit Sugar',
    description: 'Eliminate added sugars completely',
    emoji: '🚫'
  },
  'reduce': {
    title: 'Reduce Gradually',
    description: 'Cut back on sweets step by step',
    emoji: '📉'
  },
  'weight-loss': {
    title: 'Weight Loss',
    description: 'Control sugar for weight management',
    emoji: '⚖️'
  },
  'diabetes': {
    title: 'Diabetes Friendly',
    description: 'Manage blood sugar levels',
    emoji: '💚'
  },
  'habit-control': {
    title: 'Habit Control',
    description: 'Break emotional eating patterns',
    emoji: '🧠'
  }
};

export const emotions = [
  { value: 'stressed', label: 'Stressed', emoji: '😰' },
  { value: 'bored', label: 'Bored', emoji: '😑' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'anxious', label: 'Anxious', emoji: '😟' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'celebratory', label: 'Celebrating', emoji: '🎉' },
  { value: 'other', label: 'Other', emoji: '🤷' }
] as const;

export const sweetTypes = [
  { value: 'chocolate', label: 'Chocolate', emoji: '🍫' },
  { value: 'candy', label: 'Candy', emoji: '🍬' },
  { value: 'ice-cream', label: 'Ice Cream', emoji: '🍦' },
  { value: 'cookies', label: 'Cookies', emoji: '🍪' },
  { value: 'cake', label: 'Cake', emoji: '🍰' },
  { value: 'pastry', label: 'Pastry', emoji: '🥐' },
  { value: 'soda', label: 'Soda', emoji: '🥤' },
  { value: 'other', label: 'Other', emoji: '🍭' }
] as const;

export const replacementSuggestions = [
  { id: 'berries', title: 'Fresh Berries', description: 'Natural sweetness with fiber', emoji: '🫐' },
  { id: 'tea', title: 'Herbal Tea', description: 'Calming & naturally sweet', emoji: '🍵' },
  { id: 'dark-choc', title: 'Dark Chocolate', description: 'Small piece (70%+ cacao)', emoji: '🍫' },
  { id: 'apple', title: 'Apple Slices', description: 'With almond butter', emoji: '🍎' },
  { id: 'yogurt', title: 'Greek Yogurt', description: 'With cinnamon', emoji: '🥣' },
  { id: 'water', title: 'Sparkling Water', description: 'With lemon or lime', emoji: '💧' },
];
