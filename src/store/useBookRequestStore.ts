import { create } from 'zustand';
import type { BookRequest, BookRequestStatus, SmsNotification, NotificationStatus, Book } from '@/types';
import { generateId } from '@/utils/format';
import { loadBookRequests, saveBookRequests, loadSmsNotifications, saveSmsNotifications } from '@/utils/storage';
import { mockBookRequests, mockSmsNotifications } from '@/data/mockData';

export interface BookRequestFormData {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  customerName: string;
  customerPhone: string;
  maxPrice?: number;
  notes: string;
}

interface BookRequestStore {
  bookRequests: BookRequest[];
  smsNotifications: SmsNotification[];
  isLoading: boolean;

  init: () => void;
  addBookRequest: (formData: BookRequestFormData) => BookRequest;
  updateBookRequest: (id: string, data: Partial<BookRequest>) => void;
  updateRequestStatus: (id: string, status: BookRequestStatus) => void;
  deleteBookRequest: (id: string) => void;
  getPendingRequests: () => BookRequest[];
  getRequestById: (id: string) => BookRequest | undefined;

  matchBookToRequests: (book: Book) => BookRequest[];
  createSmsNotification: (request: BookRequest, book: Book, autoMarkSent?: boolean) => SmsNotification;
  markNotificationSent: (id: string) => void;
  markNotificationRead: (id: string) => void;
  getUnreadNotifications: () => SmsNotification[];
}

export const useBookRequestStore = create<BookRequestStore>((set, get) => ({
  bookRequests: [],
  smsNotifications: [],
  isLoading: false,

  init: () => {
    const storedRequests = loadBookRequests();
    const storedNotifications = loadSmsNotifications();

    if (storedRequests.length > 0) {
      set({ bookRequests: storedRequests, smsNotifications: storedNotifications });
    } else {
      set({ bookRequests: mockBookRequests, smsNotifications: mockSmsNotifications });
      saveBookRequests(mockBookRequests);
      saveSmsNotifications(mockSmsNotifications);
    }
  },

  addBookRequest: (formData: BookRequestFormData) => {
    const newRequest: BookRequest = {
      id: generateId(),
      ...formData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const bookRequests = [...get().bookRequests, newRequest];
    set({ bookRequests });
    saveBookRequests(bookRequests);
    return newRequest;
  },

  updateBookRequest: (id: string, data: Partial<BookRequest>) => {
    const bookRequests = get().bookRequests.map((req) =>
      req.id === id
        ? {
            ...req,
            ...data,
            updatedAt: new Date().toISOString(),
          }
        : req
    );
    set({ bookRequests });
    saveBookRequests(bookRequests);
  },

  updateRequestStatus: (id: string, status: BookRequestStatus) => {
    get().updateBookRequest(id, { status });
  },

  deleteBookRequest: (id: string) => {
    const bookRequests = get().bookRequests.filter((req) => req.id !== id);
    set({ bookRequests });
    saveBookRequests(bookRequests);
  },

  getPendingRequests: () => {
    return get().bookRequests.filter((req) => req.status === 'pending' || req.status === 'matched');
  },

  getRequestById: (id: string) => {
    return get().bookRequests.find((req) => req.id === id);
  },

  matchBookToRequests: (book: Book) => {
    const pendingRequests = get().bookRequests.filter(
      (req) => req.status === 'pending' || req.status === 'matched'
    );

    const matched: BookRequest[] = [];

    for (const req of pendingRequests) {
      let isMatch = false;

      if (req.isbn && book.isbn && req.isbn === book.isbn) {
        isMatch = true;
      } else {
        const reqTitle = req.title.toLowerCase().trim();
        const bookTitle = book.title.toLowerCase().trim();
        const reqAuthor = req.author.toLowerCase().trim();
        const bookAuthor = book.author.toLowerCase().trim();

        if (
          reqTitle &&
          bookTitle &&
          (reqTitle === bookTitle || bookTitle.includes(reqTitle) || reqTitle.includes(bookTitle))
        ) {
          if (!reqAuthor || !bookAuthor || reqAuthor === bookAuthor || bookAuthor.includes(reqAuthor) || reqAuthor.includes(bookAuthor)) {
            isMatch = true;
          }
        }
      }

      if (isMatch) {
        if (req.maxPrice !== undefined && book.salePrice > req.maxPrice) {
          continue;
        }
        matched.push(req);
      }
    }

    return matched;
  },

  createSmsNotification: (request: BookRequest, book: Book, autoMarkSent = true) => {
    const safeRequest = request || {} as BookRequest;
    const safeBook = book || {} as Book;

    const customerName = safeRequest.customerName || '顾客';
    const bookTitle = safeBook.title || safeRequest.title || '该书';
    const bookPrice = safeBook.salePrice || safeRequest.maxPrice || 0;

    const message = `【旧书店通知】尊敬的${customerName}，您登记的《${bookTitle}》已到货！售价：${bookPrice}元，请尽快到店选购。`;

    const notification: SmsNotification = {
      id: generateId(),
      bookRequestId: safeRequest.id || '',
      customerName: customerName,
      customerPhone: safeRequest.customerPhone || '',
      bookTitle: bookTitle,
      bookIsbn: safeBook.isbn || safeRequest.isbn || '',
      bookId: safeBook.id || '',
      message,
      status: autoMarkSent ? 'sent' : 'pending',
      sentAt: autoMarkSent ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };

    const smsNotifications = [...get().smsNotifications, notification];
    set({ smsNotifications });
    saveSmsNotifications(smsNotifications);

    if (safeRequest.id) {
      get().updateBookRequest(safeRequest.id, {
        status: 'notified',
        matchedBookId: safeBook.id || undefined,
      });
    }

    return notification;
  },

  markNotificationSent: (id: string) => {
    const smsNotifications = get().smsNotifications.map((n) =>
      n.id === id
        ? {
            ...n,
            status: 'sent' as NotificationStatus,
            sentAt: new Date().toISOString(),
          }
        : n
    );
    set({ smsNotifications });
    saveSmsNotifications(smsNotifications);
  },

  markNotificationRead: (id: string) => {
    const smsNotifications = get().smsNotifications.map((n) =>
      n.id === id ? { ...n, status: 'read' as NotificationStatus } : n
    );
    set({ smsNotifications });
    saveSmsNotifications(smsNotifications);
  },

  getUnreadNotifications: () => {
    return get().smsNotifications.filter((n) => n.status !== 'read');
  },
}));
