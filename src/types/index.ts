export type BookCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export type BookStatus = 'pending' | 'on_sale' | 'sold' | 'off_shelf';

export type SaleType = 'normal' | 'trade_in';

export type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'card';

export type ScarcityLevel = 'rare' | 'uncommon' | 'common' | 'abundant';

export interface ConditionPhoto {
  id: string;
  type: 'cover' | 'spine' | 'inside' | 'defect';
  url: string;
  description?: string;
  uploadedAt: string;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishDate: string;
  coverImage: string;
  description: string;
  condition: BookCondition;
  purchasePrice: number;
  salePrice: number;
  scarcityFactor: number;
  scarcityLevel: ScarcityLevel;
  status: BookStatus;
  location: string;
  notes: string;
  conditionPhotos: ConditionPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  coverImage: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  saleDate: string;
  totalAmount: number;
  discount: number;
  actualAmount: number;
  paymentMethod: PaymentMethod;
  type: SaleType;
  notes: string;
  items: SaleItem[];
}

export interface TradeIn {
  id: string;
  tradeDate: string;
  oldBook: {
    id: string;
    title: string;
    isbn: string;
    coverImage: string;
    condition: BookCondition;
  };
  oldBookValue: number;
  newBook: {
    id: string;
    title: string;
    isbn: string;
    coverImage: string;
    salePrice: number;
  };
  priceDifference: number;
  direction: 'refund' | 'additional';
  notes: string;
}

export interface PriceHistory {
  id: string;
  bookId: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  changedAt: string;
}

export interface BookFormData {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishDate: string;
  coverImage: string;
  description: string;
  condition: BookCondition;
  purchasePrice: number;
  scarcityLevel: ScarcityLevel;
  location: string;
  notes: string;
  conditionPhotos: ConditionPhoto[];
}

export interface IsbnLookupResult {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishDate: string;
  coverImage: string;
  description: string;
}
