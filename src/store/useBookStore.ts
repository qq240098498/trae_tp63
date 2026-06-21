import { create } from 'zustand';
import type { Book, BookFormData, PriceHistory, ScarcityLevel } from '@/types';
import { generateId } from '@/utils/format';
import { calculateSalePrice, updateBookPremiumInfo } from '@/utils/pricing';
import { loadBooks, saveBooks, loadPriceHistory, savePriceHistory } from '@/utils/storage';
import { mockBooks } from '@/data/mockData';

interface BookStore {
  books: Book[];
  priceHistory: PriceHistory[];
  selectedBook: Book | null;
  isLoading: boolean;

  init: () => void;
  addBook: (formData: BookFormData) => Book;
  updateBook: (id: string, data: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  updatePrice: (id: string, newPrice: number, reason: string) => void;
  updateStatus: (id: string, status: Book['status']) => void;
  setSelectedBook: (book: Book | null) => void;
  getBookById: (id: string) => Book | undefined;
  getBookByIsbn: (isbn: string) => Book | undefined;
  getOnSaleBooks: () => Book[];
  getPendingBooks: () => Book[];
  autoPriceBook: (id: string) => void;
  batchUpdatePrice: (ids: string[], factor: number, reason: string) => void;
  confirmPremiumPrice: (id: string, operator?: string) => void;
  updateBookMarketData: (id: string, data: { doubanRating?: number; doubanWantToRead?: number; kongfzPrice?: number }) => void;
  getBooksWithPremium: () => Book[];
}

export const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  priceHistory: [],
  selectedBook: null,
  isLoading: false,

  init: () => {
    const storedBooks = loadBooks();
    const storedPriceHistory = loadPriceHistory();

    if (storedBooks.length > 0) {
      const migratedBooks = storedBooks.map(book => ({
        ...book,
        conditionPhotos: book.conditionPhotos || [],
      }));
      set({ books: migratedBooks, priceHistory: storedPriceHistory });
      if (migratedBooks.some((b, i) => !storedBooks[i]?.conditionPhotos)) {
        saveBooks(migratedBooks);
      }
    } else {
      set({ books: mockBooks, priceHistory: storedPriceHistory });
      saveBooks(mockBooks);
    }
  },

  addBook: (formData: BookFormData) => {
    const salePrice = calculateSalePrice(
      formData.purchasePrice,
      formData.condition,
      formData.scarcityLevel
    );

    const newBook: Book = {
      id: generateId(),
      ...formData,
      conditionPhotos: formData.conditionPhotos || [],
      salePrice,
      scarcityFactor: getScarcityFactor(formData.scarcityLevel),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const books = [...get().books, newBook];
    set({ books });
    saveBooks(books);
    return newBook;
  },

  updateBook: (id: string, data: Partial<Book>) => {
    const books = get().books.map(book =>
      book.id === id
        ? {
            ...book,
            ...data,
            conditionPhotos: data.conditionPhotos !== undefined
              ? data.conditionPhotos
              : (book.conditionPhotos || []),
            updatedAt: new Date().toISOString(),
          }
        : book
    );
    set({ books });
    saveBooks(books);
  },

  deleteBook: (id: string) => {
    const books = get().books.filter(book => book.id !== id);
    set({ books });
    saveBooks(books);
  },

  updatePrice: (id: string, newPrice: number, reason: string) => {
    const book = get().getBookById(id);
    if (!book) return;

    const historyEntry: PriceHistory = {
      id: generateId(),
      bookId: id,
      oldPrice: book.salePrice,
      newPrice,
      reason,
      changedAt: new Date().toISOString(),
    };

    const priceHistory = [...get().priceHistory, historyEntry];
    const books = get().books.map(b =>
      b.id === id
        ? { ...b, salePrice: newPrice, updatedAt: new Date().toISOString() }
        : b
    );

    set({ books, priceHistory });
    saveBooks(books);
    savePriceHistory(priceHistory);
  },

  updateStatus: (id: string, status: Book['status']) => {
    const books = get().books.map(book =>
      book.id === id
        ? {
            ...book,
            status,
            conditionPhotos: book.conditionPhotos || [],
            updatedAt: new Date().toISOString(),
          }
        : book
    );
    set({ books });
    saveBooks(books);
  },

  setSelectedBook: (book: Book | null) => {
    set({ selectedBook: book });
  },

  getBookById: (id: string) => {
    return get().books.find(book => book.id === id);
  },

  getBookByIsbn: (isbn: string) => {
    return get().books.find(book => book.isbn === isbn && book.status === 'on_sale');
  },

  getOnSaleBooks: () => {
    return get().books.filter(book => book.status === 'on_sale');
  },

  getPendingBooks: () => {
    return get().books.filter(book => book.status === 'pending');
  },

  autoPriceBook: (id: string) => {
    const book = get().getBookById(id);
    if (!book) return;

    const newPrice = calculateSalePrice(
      book.purchasePrice,
      book.condition,
      book.scarcityLevel
    );

    get().updatePrice(id, newPrice, '智能定价重新计算');
  },

  batchUpdatePrice: (ids: string[], factor: number, reason: string) => {
    ids.forEach(id => {
      const book = get().getBookById(id);
      if (book) {
        const newPrice = Math.round(book.salePrice * factor * 100) / 100;
        get().updatePrice(id, newPrice, reason);
      }
    });
  },

  confirmPremiumPrice: (id: string, operator?: string) => {
    const book = get().getBookById(id);
    if (!book || !book.premiumInfo) return;

    const newPrice = book.premiumInfo.suggestedPrice;
    const reason = `溢价确认：${book.premiumInfo.reasons.join('；')}`;

    get().updatePrice(id, newPrice, reason);

    const books = get().books.map(b =>
      b.id === id
        ? {
            ...b,
            premiumInfo: {
              ...b.premiumInfo!,
              isConfirmed: true,
              confirmedAt: new Date().toISOString(),
              confirmedBy: operator || '系统',
            },
            updatedAt: new Date().toISOString(),
          }
        : b
    );

    set({ books });
    saveBooks(books);
  },

  updateBookMarketData: (id: string, data: { doubanRating?: number; doubanWantToRead?: number; kongfzPrice?: number }) => {
    const book = get().getBookById(id);
    if (!book) return;

    const updatedBook = {
      ...book,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const premiumInfo = updateBookPremiumInfo(updatedBook);
    if (premiumInfo) {
      updatedBook.premiumInfo = premiumInfo;
    }

    const books = get().books.map(b => (b.id === id ? updatedBook : b));
    set({ books });
    saveBooks(books);
  },

  getBooksWithPremium: () => {
    return get().books.filter(
      b => b.premiumInfo && b.premiumInfo.level !== 'none' && b.status === 'on_sale'
    );
  },
}));

function getScarcityFactor(level: ScarcityLevel): number {
  const factors: Record<ScarcityLevel, number> = {
    rare: 1.5,
    uncommon: 1.3,
    common: 1.0,
    abundant: 0.8,
  };
  return factors[level];
}
