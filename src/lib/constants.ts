import type { Category, Currency } from './types';

export const CATEGORIES: { name: Category; emoji: string; }[] = [
  { name: 'Food', emoji: '🍕' },
  { name: 'Books', emoji: '📚' },
  { name: 'Travel', emoji: '🚌' },
  { name: 'Shopping', emoji: '🛍️' },
  { name: 'Entertainment', emoji: '🎬' },
  { name: 'Utilities', emoji: '💡' },
  { name: 'Other', emoji: '🤷' },
];

export const CURRENCIES: { name: string, code: Currency, symbol: string }[] = [
  { name: 'Indian Rupee', code: 'INR', symbol: 'Rs.' },
  { name: 'US Dollar', code: 'USD', symbol: '$' },
  { name: 'Euro', code: 'EUR', symbol: '€' },
  { name: 'British Pound', code: 'GBP', symbol: '£' },
  { name: 'Japanese Yen', code: 'JPY', symbol: '¥' },
];

export const findCategoryEmoji = (categoryName: Category): string => {
  const category = CATEGORIES.find(c => c.name === categoryName);
  return category ? category.emoji : '🤷';
};

export const findCurrencySymbol = (currencyCode: Currency): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency ? currency.symbol : 'Rs.';
};
