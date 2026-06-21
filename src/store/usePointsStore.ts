import { create } from 'zustand';
import type { CustomerPointsAccount, PointsTransaction, PointsTransactionType } from '@/types';
import { generateId } from '@/utils/format';
import { loadPointsAccounts, savePointsAccounts } from '@/utils/storage';

interface PointsStore {
  accounts: CustomerPointsAccount[];
  selectedAccount: CustomerPointsAccount | null;

  init: () => void;
  getOrCreateAccount: (customerName: string, customerPhone: string) => CustomerPointsAccount;
  getAccountByPhone: (customerPhone: string) => CustomerPointsAccount | undefined;
  addPoints: (
    customerPhone: string,
    customerName: string,
    amount: number,
    description: string,
    referenceId?: string
  ) => CustomerPointsAccount | null;
  deductPoints: (
    customerPhone: string,
    customerName: string,
    amount: number,
    description: string,
    referenceId?: string
  ) => { success: boolean; account: CustomerPointsAccount | null; message?: string };
  adjustPoints: (
    accountId: string,
    amount: number,
    description: string
  ) => CustomerPointsAccount | null;
  setSelectedAccount: (account: CustomerPointsAccount | null) => void;
  getAllAccounts: () => CustomerPointsAccount[];
}

export const usePointsStore = create<PointsStore>((set, get) => ({
  accounts: [],
  selectedAccount: null,

  init: () => {
    const stored = loadPointsAccounts();
    set({ accounts: stored });
  },

  getOrCreateAccount: (customerName: string, customerPhone: string) => {
    const existing = get().accounts.find((a) => a.customerPhone === customerPhone);
    if (existing) return existing;

    const newAccount: CustomerPointsAccount = {
      id: generateId(),
      customerName,
      customerPhone,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      transactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const accounts = [...get().accounts, newAccount];
    set({ accounts });
    savePointsAccounts(accounts);
    return newAccount;
  },

  getAccountByPhone: (customerPhone: string) => {
    return get().accounts.find((a) => a.customerPhone === customerPhone);
  },

  addPoints: (
    customerPhone: string,
    customerName: string,
    amount: number,
    description: string,
    referenceId?: string
  ) => {
    if (amount <= 0) return null;

    const account = get().getOrCreateAccount(customerName, customerPhone);
    const newBalance = account.balance + amount;

    const transaction: PointsTransaction = {
      id: generateId(),
      type: 'earn_trade_in',
      amount,
      balanceAfter: newBalance,
      description,
      referenceId,
      createdAt: new Date().toISOString(),
    };

    const updatedAccount: CustomerPointsAccount = {
      ...account,
      balance: newBalance,
      totalEarned: account.totalEarned + amount,
      transactions: [transaction, ...account.transactions],
      updatedAt: new Date().toISOString(),
    };

    const accounts = get().accounts.map((a) =>
      a.id === account.id ? updatedAccount : a
    );
    set({ accounts });
    savePointsAccounts(accounts);
    return updatedAccount;
  },

  deductPoints: (
    customerPhone: string,
    customerName: string,
    amount: number,
    description: string,
    referenceId?: string
  ) => {
    if (amount <= 0) {
      return { success: false, account: null, message: '抵扣积分必须大于0' };
    }

    const account = get().getOrCreateAccount(customerName, customerPhone);

    if (account.balance < amount) {
      return {
        success: false,
        account,
        message: `积分不足，当前余额：${account.balance}，需要：${amount}`,
      };
    }

    const newBalance = account.balance - amount;

    const transaction: PointsTransaction = {
      id: generateId(),
      type: 'spend_purchase',
      amount: -amount,
      balanceAfter: newBalance,
      description,
      referenceId,
      createdAt: new Date().toISOString(),
    };

    const updatedAccount: CustomerPointsAccount = {
      ...account,
      balance: newBalance,
      totalSpent: account.totalSpent + amount,
      transactions: [transaction, ...account.transactions],
      updatedAt: new Date().toISOString(),
    };

    const accounts = get().accounts.map((a) =>
      a.id === account.id ? updatedAccount : a
    );
    set({ accounts });
    savePointsAccounts(accounts);
    return { success: true, account: updatedAccount };
  },

  adjustPoints: (accountId: string, amount: number, description: string) => {
    const account = get().accounts.find((a) => a.id === accountId);
    if (!account) return null;

    const newBalance = Math.max(0, account.balance + amount);

    const transaction: PointsTransaction = {
      id: generateId(),
      type: 'adjust',
      amount,
      balanceAfter: newBalance,
      description,
      createdAt: new Date().toISOString(),
    };

    const updatedAccount: CustomerPointsAccount = {
      ...account,
      balance: newBalance,
      totalEarned: amount > 0 ? account.totalEarned + amount : account.totalEarned,
      totalSpent: amount < 0 ? account.totalSpent + Math.abs(amount) : account.totalSpent,
      transactions: [transaction, ...account.transactions],
      updatedAt: new Date().toISOString(),
    };

    const accounts = get().accounts.map((a) =>
      a.id === accountId ? updatedAccount : a
    );
    set({ accounts });
    savePointsAccounts(accounts);
    return updatedAccount;
  },

  setSelectedAccount: (account: CustomerPointsAccount | null) => {
    set({ selectedAccount: account });
  },

  getAllAccounts: () => {
    return get().accounts;
  },
}));
