export type Category = 'Food' | 'Books' | 'Travel' | 'Shopping' | 'Entertainment' | 'Utilities' | 'Other';
export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';
export type LendBorrowType = 'credit' | 'debit'; // 'credit' = I borrowed, 'debit' = I lent
export type LendBorrowStatus = 'pending' | 'paid';

export interface Spending {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string;
}

export interface CreditDebitRecord {
    id: string;
    type: LendBorrowType;
    person: string;
    amount: number;
    purpose: string;
    date: string;
    status: LendBorrowStatus;
}
