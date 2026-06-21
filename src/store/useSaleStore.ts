import { create } from 'zustand';
import type { Sale, SaleItem, PaymentMethod, TradeIn, Book } from '@/types';
import { generateId } from '@/utils/format';
import { loadSales, saveSales, loadTradeIns, saveTradeIns } from '@/utils/storage';
import { mockSales, mockTradeIns } from '@/data/mockData';
import { useBookStore } from './useBookStore';

interface SaleStore {
  sales: Sale[];
  cart: SaleItem[];
  tradeIns: TradeIn[];
  isCheckoutOpen: boolean;

  init: () => void;
  addToCart: (book: Book) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  checkout: (paymentMethod: PaymentMethod, discount?: number, notes?: string) => Sale;
  setCheckoutOpen: (open: boolean) => void;
  addTradeIn: (tradeIn: Omit<TradeIn, 'id' | 'tradeDate'>) => TradeIn;
  getTodaySales: () => Sale[];
  getTodayRevenue: () => number;
  getMonthRevenue: () => number;
}

export const useSaleStore = create<SaleStore>((set, get) => ({
  sales: [],
  cart: [],
  tradeIns: [],
  isCheckoutOpen: false,

  init: () => {
    const storedSales = loadSales();
    const storedTradeIns = loadTradeIns();

    if (storedSales.length > 0) {
      set({ sales: storedSales });
    } else {
      set({ sales: mockSales });
      saveSales(mockSales);
    }

    if (storedTradeIns.length > 0) {
      const migratedTradeIns = storedTradeIns.map((t) => ({
        ...t,
        mode: (t as any).mode ?? 'value_only',
        pointsEarned: (t as any).pointsEarned ?? 0,
        pointsUsed: (t as any).pointsUsed ?? 0,
      }));
      set({ tradeIns: migratedTradeIns });
      saveTradeIns(migratedTradeIns);
    } else {
      set({ tradeIns: mockTradeIns });
      saveTradeIns(mockTradeIns);
    }
  },

  addToCart: (book: Book) => {
    const existingItem = get().cart.find(item => item.bookId === book.id);

    if (existingItem) {
      get().updateCartQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: SaleItem = {
        id: generateId(),
        bookId: book.id,
        bookTitle: book.title,
        bookIsbn: book.isbn,
        coverImage: book.coverImage,
        unitPrice: book.salePrice,
        quantity: 1,
        subtotal: book.salePrice,
      };

      set({ cart: [...get().cart, newItem] });
    }
  },

  removeFromCart: (itemId: string) => {
    set({ cart: get().cart.filter(item => item.id !== itemId) });
  },

  updateCartQuantity: (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeFromCart(itemId);
      return;
    }

    const cart = get().cart.map(item =>
      item.id === itemId
        ? { ...item, quantity, subtotal: Math.round(item.unitPrice * quantity * 100) / 100 }
        : item
    );
    set({ cart });
  },

  clearCart: () => {
    set({ cart: [] });
  },

  getCartTotal: () => {
    return get().cart.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getCartCount: () => {
    return get().cart.reduce((sum, item) => sum + item.quantity, 0);
  },

  checkout: (paymentMethod: PaymentMethod, discount: number = 0, notes: string = '') => {
    const cart = get().cart;
    const totalAmount = get().getCartTotal();
    const actualAmount = Math.round((totalAmount - discount) * 100) / 100;

    const sale: Sale = {
      id: generateId(),
      saleDate: new Date().toISOString(),
      totalAmount,
      discount,
      actualAmount,
      paymentMethod,
      type: 'normal',
      notes,
      items: [...cart],
    };

    const sales = [sale, ...get().sales];
    set({ sales, cart: [], isCheckoutOpen: false });
    saveSales(sales);

    const { updateStatus } = useBookStore.getState();
    cart.forEach(item => {
      updateStatus(item.bookId, 'sold');
    });

    return sale;
  },

  setCheckoutOpen: (open: boolean) => {
    set({ isCheckoutOpen: open });
  },

  addTradeIn: (tradeInData: Omit<TradeIn, 'id' | 'tradeDate'>) => {
    const tradeIn: TradeIn = {
      id: generateId(),
      tradeDate: new Date().toISOString(),
      mode: tradeInData.mode ?? 'value_only',
      oldBook: tradeInData.oldBook,
      oldBookValue: tradeInData.oldBookValue ?? 0,
      pointsEarned: tradeInData.pointsEarned ?? 0,
      newBook: tradeInData.newBook,
      pointsUsed: tradeInData.pointsUsed ?? 0,
      priceDifference: tradeInData.priceDifference ?? 0,
      direction: tradeInData.direction,
      customerName: tradeInData.customerName,
      customerPhone: tradeInData.customerPhone,
      notes: tradeInData.notes,
    };

    const tradeIns = [tradeIn, ...get().tradeIns];
    set({ tradeIns });
    saveTradeIns(tradeIns);

    return tradeIn;
  },

  getTodaySales: () => {
    const today = new Date().toDateString();
    return get().sales.filter(sale => new Date(sale.saleDate).toDateString() === today);
  },

  getTodayRevenue: () => {
    return get().getTodaySales().reduce((sum, sale) => sum + sale.actualAmount, 0);
  },

  getMonthRevenue: () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return get().sales
      .filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      })
      .reduce((sum, sale) => sum + sale.actualAmount, 0);
  },
}));
