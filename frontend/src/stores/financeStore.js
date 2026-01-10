import { create } from 'zustand';
import axios from 'axios';
import { db, queueOperation } from '../lib/db';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const useFinanceStore = create((set, get) => ({
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  summary: null,
  loading: false,
  error: null,
  isOnline: navigator.onLine,

  setOnlineStatus: (status) => set({ isOnline: status }),

  // ACCOUNTS
  fetchAccounts: async (token) => {
    set({ loading: true });
    try {
      const { data } = await axios.get(`${API}/accounts`, getAuthHeader(token));
      set({ accounts: data, loading: false });
      await db.accounts.clear();
      await db.accounts.bulkAdd(data.map(a => ({ ...a, syncStatus: 'synced' })));
    } catch (error) {
      console.error('Fetch accounts error:', error);
      const localAccounts = await db.accounts.toArray();
      set({ accounts: localAccounts, loading: false, error: error.message });
    }
  },

  createAccount: async (accountData, token) => {
    const { isOnline } = get();
    try {
      if (isOnline) {
        const { data } = await axios.post(`${API}/accounts`, accountData, getAuthHeader(token));
        set((state) => ({ accounts: [...state.accounts, data] }));
        return data;
      } else {
        await queueOperation('POST', `${API}/accounts`, accountData);
        const tempAccount = { ...accountData, id: `temp-${Date.now()}`, syncStatus: 'pending' };
        set((state) => ({ accounts: [...state.accounts, tempAccount] }));
        return tempAccount;
      }
    } catch (error) {
      console.error('Create account error:', error);
      throw error;
    }
  },

  // CATEGORIES
  fetchCategories: async (token) => {
    try {
      const { data } = await axios.get(`${API}/categories`, getAuthHeader(token));
      set({ categories: data });
      await db.categories.clear();
      await db.categories.bulkAdd(data.map(c => ({ ...c, syncStatus: 'synced' })));
    } catch (error) {
      console.error('Fetch categories error:', error);
      const localCategories = await db.categories.toArray();
      set({ categories: localCategories });
    }
  },

  // TRANSACTIONS
  fetchTransactions: async (token, filters = {}) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams(filters);
      const { data } = await axios.get(`${API}/transactions?${params}`, getAuthHeader(token));
      set({ transactions: data, loading: false });
      await db.transactions.clear();
      await db.transactions.bulkAdd(data.map(t => ({ ...t, syncStatus: 'synced' })));
    } catch (error) {
      console.error('Fetch transactions error:', error);
      const localTransactions = await db.transactions.orderBy('txDate').reverse().toArray();
      set({ transactions: localTransactions, loading: false });
    }
  },

  createTransaction: async (transactionData, token) => {
    const { isOnline } = get();
    try {
      if (isOnline) {
        const { data } = await axios.post(`${API}/transactions`, transactionData, getAuthHeader(token));
        set((state) => ({ transactions: [data, ...state.transactions] }));
        await get().fetchAccounts(token);
        return data;
      } else {
        await queueOperation('POST', `${API}/transactions`, transactionData);
        const tempTransaction = { 
          ...transactionData, 
          id: `temp-${Date.now()}`, 
          syncStatus: 'pending',
          created_at: new Date().toISOString()
        };
        set((state) => ({ transactions: [tempTransaction, ...state.transactions] }));
        return tempTransaction;
      }
    } catch (error) {
      console.error('Create transaction error:', error);
      throw error;
    }
  },

  deleteTransaction: async (transactionId, token) => {
    try {
      await axios.delete(`${API}/transactions/${transactionId}`, getAuthHeader(token));
      set((state) => ({
        transactions: state.transactions.filter(t => t.id !== transactionId)
      }));
      await get().fetchAccounts(token);
    } catch (error) {
      console.error('Delete transaction error:', error);
      throw error;
    }
  },

  // SUMMARY
  fetchSummary: async (token) => {
    try {
      const { data } = await axios.get(`${API}/stats/summary`, getAuthHeader(token));
      set({ summary: data });
    } catch (error) {
      console.error('Fetch summary error:', error);
    }
  },

  // BUDGETS
  fetchBudgets: async (token) => {
    try {
      const { data } = await axios.get(`${API}/budgets`, getAuthHeader(token));
      set({ budgets: data });
    } catch (error) {
      console.error('Fetch budgets error:', error);
    }
  },

  createBudget: async (budgetData, token) => {
    try {
      const { data } = await axios.post(`${API}/budgets`, budgetData, getAuthHeader(token));
      set((state) => ({ budgets: [...state.budgets, data] }));
      return data;
    } catch (error) {
      console.error('Create budget error:', error);
      throw error;
    }
  },
}));