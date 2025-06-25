"use client"

import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { Spending, Currency, CreditDebitRecord, LendBorrowStatus } from '@/lib/types';

interface StoreState {
  name: string;
  income: number;
  budget: number;
  spendings: Spending[];
  currency: Currency;
  lendBorrow: CreditDebitRecord[];
  isSetupComplete: boolean;
}

type Action =
  | { type: 'ADD_SPENDING'; payload: Spending }
  | { type: 'DELETE_SPENDING'; payload: string }
  | { type: 'SET_FINANCES'; payload: { income: number; budget: number } }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LEND_BORROW'; payload: CreditDebitRecord }
  | { type: 'UPDATE_LEND_BORROW_STATUS'; payload: { id: string; status: LendBorrowStatus } }
  | { type: 'DELETE_LEND_BORROW'; payload: string }
  | { type: 'COMPLETE_SETUP'; payload: { name: string; income: number; budget: number } }
  | { type: 'RESET_DATA' }
  | { type: 'HYDRATE'; payload: Partial<StoreState> };

const initialState: StoreState = {
  name: '',
  income: 0,
  budget: 0,
  spendings: [],
  currency: 'INR',
  lendBorrow: [],
  isSetupComplete: false,
};

const storeReducer = (state: StoreState, action: Action): StoreState => {
  switch (action.type) {
    case 'ADD_SPENDING':
      return { ...state, spendings: [action.payload, ...state.spendings] };
    case 'DELETE_SPENDING':
      return { ...state, spendings: state.spendings.filter(t => t.id !== action.payload) };
    case 'SET_FINANCES':
      return { ...state, income: action.payload.income, budget: action.payload.budget };
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
    case 'COMPLETE_SETUP':
      return {
        ...state,
        name: action.payload.name,
        income: action.payload.income,
        budget: action.payload.budget,
        isSetupComplete: true,
      };
    case 'RESET_DATA':
      return { ...initialState, isSetupComplete: false };
    case 'HYDRATE':
       // For existing users, if isSetupComplete is not in their stored data, default to true.
      return { ...initialState, ...action.payload, isSetupComplete: action.payload.isSetupComplete ?? true };
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
    return <div className="flex min-h-screen w-full items-center justify-center bg-background"><p>Loading StuSave...</p></div>;
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
