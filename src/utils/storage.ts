import type { Book, Sale, TradeIn, PriceHistory } from '@/types';

const STORAGE_KEYS = {
  BOOKS: 'bookstore_books',
  SALES: 'bookstore_sales',
  TRADE_INS: 'bookstore_trade_ins',
  PRICE_HISTORY: 'bookstore_price_history',
};

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
    return defaultValue;
  }
}

export function saveBooks(books: Book[]): void {
  saveToStorage(STORAGE_KEYS.BOOKS, books);
}

export function loadBooks(): Book[] {
  return loadFromStorage<Book[]>(STORAGE_KEYS.BOOKS, []);
}

export function saveSales(sales: Sale[]): void {
  saveToStorage(STORAGE_KEYS.SALES, sales);
}

export function loadSales(): Sale[] {
  return loadFromStorage<Sale[]>(STORAGE_KEYS.SALES, []);
}

export function saveTradeIns(tradeIns: TradeIn[]): void {
  saveToStorage(STORAGE_KEYS.TRADE_INS, tradeIns);
}

export function loadTradeIns(): TradeIn[] {
  return loadFromStorage<TradeIn[]>(STORAGE_KEYS.TRADE_INS, []);
}

export function savePriceHistory(history: PriceHistory[]): void {
  saveToStorage(STORAGE_KEYS.PRICE_HISTORY, history);
}

export function loadPriceHistory(): PriceHistory[] {
  return loadFromStorage<PriceHistory[]>(STORAGE_KEYS.PRICE_HISTORY, []);
}
