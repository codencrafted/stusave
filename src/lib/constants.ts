import type { Category } from './types';

export const CATEGORIES: { name: Category; emoji: string; }[] = [
  { name: 'Food', emoji: '🍕' },
  { name: 'Books', emoji: '📚' },
  { name: 'Travel', emoji: '🚌' },
  { name: 'Shopping', emoji: '🛍️' },
  { name: 'Entertainment', emoji: '🎬' },
  { name: 'Utilities', emoji: '💡' },
  { name: 'Other', emoji: '🤷' },
];

export const findCategoryEmoji = (categoryName: Category): string => {
  const category = CATEGORIES.find(c => c.name === categoryName);
  return category ? category.emoji : '🤷';
};
