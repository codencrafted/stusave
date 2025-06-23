"use client"

import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { Transaction, SavingsGoal, Currency, CreditDebitRecord, LendBorrowStatus } from '@/lib/types';

interface StoreState {
  income: number;
  budget: number;
  transactions: Transaction[];
  goal: SavingsGoal;
  currency: Currency;
  lendBorrow: CreditDebitRecord[];
}

type Action =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_FINANCES'; payload: { income: number; budget: number } }
  | { type: 'SET_GOAL'; payload: SavingsGoal }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LEND_BORROW'; payload: CreditDebitRecord }
  | { type: 'UPDATE_LEND_BORROW_STATUS'; payload: { id: string; status: LendBorrowStatus } }
  | { type: 'DELETE_LEND_BORROW'; payload: string }
  | { type: 'RESET_DATA' }
  | { type: 'HYDRATE'; payload: Partial<StoreState> };

const initialState: StoreState = {
  income: 5000,
  budget: 3000,
  transactions: [],
  goal: { name: 'New Laptop', targetAmount: 10000, savedAmount: 0 },
  currency: 'INR',
  lendBorrow: [],
};

const storeReducer = (state: StoreState, action: Action): StoreState => {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
    case 'SET_FINANCES':
      return { ...state, income: action.payload.income, budget: action.payload.budget };
    case 'SET_GOAL':
      return { ...state, goal: action.payload };
    case 'SET_CURRENCY':
      return { ...state, currency: action.payload };
    case 'ADD_LEND_BORROW':
      return { ...state, lendBorrow: [action.payload, ...state.lendBorrow] };
    case 'UPDATE_LEND_BORROW_STATUS':
      return {
        ...state,
        lendBorrow: state.lendBorrow.map(record =>
          record.id === action.payload.id
            ? { ...record, status: action.payload.status }
            : record
        ),
      };
    case 'DELETE_LEND_BORROW':
      return { ...state, lendBorrow: state.lendBorrow.filter(r => r.id !== action.payload) };
    case 'RESET_DATA':
      return initialState;
    case 'HYDRATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const StoreContext = createContext<{ state: StoreState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'stuSaveData';

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(storeReducer, initialState);
  const [isHydrated, setIsHydrated] = React.useState(false);

  useEffect(() => {
    try {
      const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedState) {
        dispatch({ type: 'HYDRATE', payload: JSON.parse(storedState) });
      }
    } catch (error) {
      console.error("Could not load state from localStorage", error);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error("Could not save state to localStorage", error);
        }
    }
  }, [state, isHydrated]);

  if (!isHydrated) {
    return null; // or a loading spinner
  }

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
