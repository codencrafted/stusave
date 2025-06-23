export type Category = 'Food' | 'Books' | 'Travel' | 'Shopping' | 'Entertainment' | 'Utilities' | 'Other';

export interface Transaction {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string;
}

export interface SavingsGoal {
  name: string;
  targetAmount: number;
  savedAmount: number;
}
