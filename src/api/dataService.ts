/**
 * שכבת הפשטה לניהול נתונים
 * תומכת גם ב-API (Web) וגם ב-LocalStorage (Electron)
 */

import { db } from '../database/database';
import { api } from './client';

// בדוק אם להשתמש ב-API או ב-DB מקומי
const USE_API = import.meta.env.VITE_USE_API === 'true';

console.log('🔧 Data Service Mode:', USE_API ? 'API (Web)' : 'Local DB (Electron)');

export const dataService = {
  // ========== Borrowers ==========
  getBorrowers: async () => {
    if (USE_API) {
      return await api.getBorrowers();
    }
    return db.getBorrowers();
  },

  getBorrower: async (id: number) => {
    if (USE_API) {
      return await api.getBorrower(id);
    }
    // מקומי - מחפש בין כל הלווים
    const borrowers = db.getBorrowers();
    return borrowers.find(b => b.id === id);
  },

  createBorrower: async (data: any) => {
    if (USE_API) {
      return await api.createBorrower(data);
    }
    return db.addBorrower(data);
  },

  updateBorrower: async (id: number, data: any) => {
    if (USE_API) {
      return await api.updateBorrower(id, data);
    }
    return db.updateBorrower(id, data);
  },

  deleteBorrower: async (id: number) => {
    if (USE_API) {
      return await api.deleteBorrower(id);
    }
    return db.deleteBorrower(id);
  },

  // ========== Loans ==========
  getLoans: async () => {
    if (USE_API) {
      return await api.getLoans();
    }
    return db.getLoans();
  },

  getLoan: async (id: number) => {
    if (USE_API) {
      return await api.getLoan(id);
    }
    const loans = db.getLoans();
    return loans.find(l => l.id === id);
  },

  createLoan: async (data: any) => {
    if (USE_API) {
      return await api.createLoan(data);
    }
    return db.addLoan(data);
  },

  updateLoan: async (id: number, data: any) => {
    if (USE_API) {
      return await api.updateLoan(id, data);
    }
    return db.updateLoan(id, data);
  },

  deleteLoan: async (id: number) => {
    if (USE_API) {
      return await api.deleteLoan(id);
    }
    return db.deleteLoan(id);
  },

  // ========== Depositors ==========
  getDepositors: async () => {
    if (USE_API) {
      return await api.getDepositors();
    }
    return db.getDepositors();
  },

  getDepositor: async (id: number) => {
    if (USE_API) {
      return await api.getDepositor(id);
    }
    const depositors = db.getDepositors();
    return depositors.find(d => d.id === id);
  },

  createDepositor: async (data: any) => {
    if (USE_API) {
      return await api.createDepositor(data);
    }
    return db.addDepositor(data);
  },

  updateDepositor: async (id: number, data: any) => {
    if (USE_API) {
      return await api.updateDepositor(id, data);
    }
    return db.updateDepositor(id, data);
  },

  deleteDepositor: async (id: number) => {
    if (USE_API) {
      return await api.deleteDepositor(id);
    }
    return db.deleteDepositor(id);
  },

  // ========== Deposits ==========
  getDeposits: async (status?: string) => {
    if (USE_API) {
      return await api.getDeposits(status);
    }
    return db.getDeposits();
  },

  getDeposit: async (id: number) => {
    if (USE_API) {
      return await api.getDeposit(id);
    }
    const deposits = db.getDeposits();
    return deposits.find(d => d.id === id);
  },

  createDeposit: async (data: any) => {
    if (USE_API) {
      return await api.createDeposit(data);
    }
    return db.addDeposit(data);
  },

  updateDeposit: async (id: number, data: any) => {
    if (USE_API) {
      return await api.updateDeposit(id, data);
    }
    return db.updateDeposit(id, data);
  },

  deleteDeposit: async (id: number) => {
    if (USE_API) {
      return await api.deleteDeposit(id);
    }
    return db.deleteDeposit(id);
  },

  // ========== Donations ==========
  getDonations: async () => {
    if (USE_API) {
      return await api.getDonations();
    }
    return db.getDonations();
  },

  getDonation: async (id: number) => {
    if (USE_API) {
      return await api.getDonation(id);
    }
    const donations = db.getDonations();
    return donations.find(d => d.id === id);
  },

  createDonation: async (data: any) => {
    if (USE_API) {
      return await api.createDonation(data);
    }
    return db.addDonation(data);
  },

  updateDonation: async (id: number, data: any) => {
    if (USE_API) {
      return await api.updateDonation(id, data);
    }
    return db.updateDonation(id, data);
  },

  deleteDonation: async (id: number) => {
    if (USE_API) {
      return await api.deleteDonation(id);
    }
    return db.deleteDonation(id);
  },

  // ========== Settings ==========
  getSettings: async () => {
    if (USE_API) {
      return await api.getSettings();
    }
    return db.getSettings();
  },

  updateSettings: async (data: any) => {
    if (USE_API) {
      return await api.updateSettings(data);
    }
    return db.updateSettings(data);
  },

  // ========== Helpers ==========
  // פונקציות אלו תמיד מקומיות (UI/Cache)
  getGemachName: () => db.getGemachName(),
  getGemachLogo: () => db.getGemachLogo(),
  getHeaderTitle: () => db.getHeaderTitle(),
  getFooterText: () => db.getFooterText(),
  getContactText: () => db.getContactText(),
  setGemachName: (name: string) => db.setGemachName(name),
  setHeaderTitle: (title: string) => db.setHeaderTitle(title),
  setFooterText: (text: string) => db.setFooterText(text),
  setContactText: (text: string) => db.setContactText(text),
  formatCurrency: (amount: number) => db.formatCurrency(amount),
  
  // סטטיסטיקות
  getStats: async () => {
    if (USE_API) {
      // TODO: צריך ליצור endpoint לסטטיסטיקות
      // בינתיים נשתמש במקומי
      return db.getStats();
    }
    return db.getStats();
  },
  
  // פונקציות נוספות שנשארות מקומיות לעת עתה
  hasOverdueLoans: () => db.hasOverdueLoans(),
  getOverdueLoans: () => db.getOverdueLoans(),
  getOverdueStats: () => db.getOverdueStats(),
  getFutureLoans: () => db.getFutureLoans(),
  getPendingRecurringLoans: () => db.getPendingRecurringLoans(),
  getPendingAutoPayments: () => db.getPendingAutoPayments(),
  createRecurringLoan: (id: number) => db.createRecurringLoan(id),
  createRecurringLoanWithPaymentTracking: (id: number) => db.createRecurringLoanWithPaymentTracking(id),
  executeAutoPayment: (id: number, amount: number) => db.executeAutoPayment(id, amount),
  executeAutoPaymentWithTracking: (id: number, amount: number) => db.executeAutoPaymentWithTracking(id, amount),
};
