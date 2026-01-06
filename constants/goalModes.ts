import { GoalMode, ReplacementSuggestion } from '@/types';

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

export const replacementSuggestions: ReplacementSuggestion[] = [
  { id: 'berries', title: 'Fresh Berries', description: 'Natural sweetness with fiber', emoji: '🫐', category: 'fruit', tags: ['sweet', 'healthy', 'fiber'] },
  { id: 'tea', title: 'Herbal Tea', description: 'Calming & naturally sweet', emoji: '🍵', category: 'beverage', tags: ['calming', 'warm', 'soothing'] },
  { id: 'dark-choc', title: 'Dark Chocolate', description: 'Small piece (70%+ cacao)', emoji: '🍫', category: 'healthy-sweet', tags: ['chocolate', 'treat', 'satisfying'] },
  { id: 'apple', title: 'Apple Slices', description: 'With almond butter', emoji: '🍎', category: 'fruit', tags: ['crunchy', 'protein', 'filling'] },
  { id: 'yogurt', title: 'Greek Yogurt', description: 'With cinnamon', emoji: '🥣', category: 'protein', tags: ['creamy', 'protein', 'filling'] },
  { id: 'water', title: 'Sparkling Water', description: 'With lemon or lime', emoji: '💧', category: 'beverage', tags: ['refreshing', 'hydrating', 'crisp'] },
  { id: 'walk', title: 'Short Walk', description: '5 minutes around the block', emoji: '🚶', category: 'activity', tags: ['movement', 'distraction', 'outdoor'] },
  { id: 'breath', title: 'Deep Breathing', description: '3 slow breaths', emoji: '🫁', category: 'mindful', tags: ['calming', 'quick', 'grounding'] },
  { id: 'orange', title: 'Orange Segments', description: 'Fresh and juicy', emoji: '🍊', category: 'fruit', tags: ['citrus', 'refreshing', 'vitamin-c'] },
  { id: 'nuts', title: 'Handful of Nuts', description: 'Almonds or walnuts', emoji: '🥜', category: 'protein', tags: ['crunchy', 'protein', 'satisfying'] },
  { id: 'frozen-grapes', title: 'Frozen Grapes', description: 'Sweet like candy', emoji: '🍇', category: 'fruit', tags: ['sweet', 'cold', 'treat'] },
  { id: 'coffee', title: 'Black Coffee', description: 'Or with a splash of milk', emoji: '☕', category: 'beverage', tags: ['energizing', 'warm', 'ritual'] },
  { id: 'stretch', title: 'Quick Stretch', description: 'Release tension', emoji: '🧘', category: 'activity', tags: ['movement', 'relaxing', 'quick'] },
  { id: 'music', title: 'Favorite Song', description: 'Shift your mood', emoji: '🎵', category: 'activity', tags: ['distraction', 'mood-boost', 'quick'] },
  { id: 'banana', title: 'Banana', description: 'With peanut butter', emoji: '🍌', category: 'fruit', tags: ['sweet', 'filling', 'protein'] },
  { id: 'cucumber', title: 'Cucumber Slices', description: 'Cool and refreshing', emoji: '🥒', category: 'mindful', tags: ['crunchy', 'hydrating', 'light'] },
  { id: 'green-tea', title: 'Green Tea', description: 'Light and energizing', emoji: '🍃', category: 'beverage', tags: ['energizing', 'antioxidants', 'ritual'] },
  { id: 'carrots', title: 'Baby Carrots', description: 'With hummus', emoji: '🥕', category: 'protein', tags: ['crunchy', 'savory', 'satisfying'] },
  { id: 'watermelon', title: 'Watermelon', description: 'Hydrating and sweet', emoji: '🍉', category: 'fruit', tags: ['sweet', 'hydrating', 'refreshing'] },
  { id: 'journal', title: 'Quick Journal', description: 'Write what you feel', emoji: '📝', category: 'mindful', tags: ['reflection', 'processing', 'calm'] },
  { id: 'call-friend', title: 'Text a Friend', description: 'Quick connection', emoji: '💬', category: 'activity', tags: ['social', 'distraction', 'connection'] },
  { id: 'mint-tea', title: 'Peppermint Tea', description: 'Naturally sweet taste', emoji: '🌿', category: 'beverage', tags: ['refreshing', 'calming', 'sweet'] },
  { id: 'cheese', title: 'String Cheese', description: 'Protein boost', emoji: '🧀', category: 'protein', tags: ['savory', 'protein', 'quick'] },
  { id: 'dates', title: 'Medjool Dates', description: 'Naturally sweet', emoji: '🌴', category: 'fruit', tags: ['sweet', 'chewy', 'natural'] },
];
