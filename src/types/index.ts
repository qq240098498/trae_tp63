export type BookCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export type BookStatus = 'pending' | 'on_sale' | 'sold' | 'off_shelf';

export type SaleType = 'normal' | 'trade_in';

export type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'card';

export type ScarcityLevel = 'rare' | 'uncommon' | 'common' | 'abundant';

export type PremiumLevel = 'high' | 'medium' | 'low' | 'none';

export interface PremiumInfo {
  level: PremiumLevel;
  score: number;
  suggestedPrice: number;
  priceRatio: number;
  reasons: string[];
  isConfirmed: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
}

export type PointsTransactionType = 'earn_trade_in' | 'spend_purchase' | 'bonus' | 'adjust' | 'expire';

export type TradeInMode = 'value' | 'points';

export interface ConditionConfig {
  key: BookCondition;
  label: string;
  saleFactor: number;
  tradeInValueFactor: number;
  pointsFactor: number;
  sortOrder: number;
}

export interface ScarcityConfig {
  key: ScarcityLevel;
  label: string;
  factor: number;
  sortOrder: number;
}

export interface PointsConfig {
  pointsPerYuan: number;
  yuanPerPoints: number;
  tradeInBaseRate: number;
}

export interface SystemConfig {
  conditions: ConditionConfig[];
  scarcities: ScarcityConfig[];
  points: PointsConfig;
  updatedAt: string;
}

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
  doubanRating?: number;
  doubanWantToRead?: number;
  kongfzPrice?: number;
  premiumInfo?: PremiumInfo;
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

export type BookRequestStatus = 'pending' | 'matched' | 'notified' | 'completed' | 'cancelled';

export interface BookRequest {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  customerName: string;
  customerPhone: string;
  maxPrice?: number;
  notes: string;
  status: BookRequestStatus;
  matchedBookId?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read';

export interface SmsNotification {
  id: string;
  bookRequestId: string;
  customerName: string;
  customerPhone: string;
  bookTitle: string;
  bookIsbn: string;
  bookId: string;
  message: string;
  status: NotificationStatus;
  sentAt?: string;
  createdAt: string;
}

export interface PointsTransaction {
  id: string;
  type: PointsTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface CustomerPointsAccount {
  id: string;
  customerName: string;
  customerPhone: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: PointsTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface TradeInWithPoints {
  id: string;
  tradeDate: string;
  mode: TradeInMode;
  oldBook: {
    id: string;
    title: string;
    isbn: string;
    coverImage: string;
    condition: BookCondition;
  };
  oldBookValue: number;
  pointsEarned?: number;
  newBook?: {
    id: string;
    title: string;
    isbn: string;
    coverImage: string;
    salePrice: number;
  };
  pointsUsed?: number;
  priceDifference?: number;
  direction?: 'refund' | 'additional';
  customerName?: string;
  customerPhone?: string;
  notes: string;
}
