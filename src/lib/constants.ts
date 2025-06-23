import type { Category, Currency } from './types';
import { Pizza, BookOpen, Plane, ShoppingBag, Film, Lightbulb, MoreHorizontal } from 'lucide-react';
import type { ElementType } from 'react';

export const CATEGORIES: { name: Category; emoji: string; icon: ElementType }[] = [
  { name: 'Food', emoji: '🍕', icon: Pizza },
  { name: 'Books', emoji: '📚', icon: BookOpen },
  { name: 'Travel', emoji: '🚌', icon: Plane },
  { name: 'Shopping', emoji: '🛍️', icon: ShoppingBag },
  { name: 'Entertainment', emoji: '🎬', icon: Film },
  { name: 'Utilities', emoji: '💡', icon: Lightbulb },
  { name: 'Other', emoji: '🤷', icon: MoreHorizontal },
];

export const CURRENCIES: { name: string, code: Currency, symbol: string }[] = [
  { name: 'Indian Rupee', code: 'INR', symbol: '₹' },
  { name: 'US Dollar', code: 'USD', symbol: '$' },
  { name: 'Euro', code: 'EUR', symbol: '€' },
  { name: 'British Pound', code: 'GBP', symbol: '£' },
  { name: 'Japanese Yen', code: 'JPY', symbol: '¥' },
];

export const findCategoryEmoji = (categoryName: Category): string => {
  const category = CATEGORIES.find(c => c.name === categoryName);
  return category ? category.emoji : '🤷';
};

export const findCategoryIcon = (categoryName: Category): ElementType => {
    const category = CATEGORIES.find(c => c.name === categoryName);
    return category ? category.icon : MoreHorizontal;
};

export const findCurrencySymbol = (currencyCode: Currency): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency ? currency.symbol : '₹';
};
