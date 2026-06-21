import type { BookCondition, ScarcityLevel, PremiumInfo, PremiumLevel } from '@/types';
import { useSystemConfigStore } from '@/store/useSystemConfigStore';

function readLabels(): Record<BookCondition, string> {
  return useSystemConfigStore.getState().getConditionLabels();
}

function readSaleFactors(): Record<BookCondition, number> {
  return useSystemConfigStore.getState().getConditionSaleFactors();
}

function readTradeInFactors(): Record<BookCondition, number> {
  return useSystemConfigStore.getState().getConditionTradeInFactors();
}

function readPointsFactors(): Record<BookCondition, number> {
  return useSystemConfigStore.getState().getConditionPointsFactors();
}

function readScarcityLabels(): Record<ScarcityLevel, string> {
  return useSystemConfigStore.getState().getScarcityLabels();
}

function readScarcityFactors(): Record<ScarcityLevel, number> {
  return useSystemConfigStore.getState().getScarcityFactors();
}

export const getConditionLabels = (): Record<BookCondition, string> => readLabels();
export const getConditionFactors = (): Record<BookCondition, number> => readSaleFactors();
export const getConditionPointsFactors = (): Record<BookCondition, number> => readPointsFactors();
export const getScarcityLabels = (): Record<ScarcityLevel, string> => readScarcityLabels();
export const getScarcityFactors = (): Record<ScarcityLevel, number> => readScarcityFactors();

export const POINTS_TO_YUAN_RATE = 0.1;
export const YUAN_TO_POINTS_RATE = 10;

export function getPointsToYuanRate(): number {
  return useSystemConfigStore.getState().getPointsToYuanRate();
}

export function getYuanToPointsRate(): number {
  return useSystemConfigStore.getState().getYuanToPointsRate();
}

export function getTradeInBaseRate(): number {
  return useSystemConfigStore.getState().getTradeInBaseRate();
}

export const conditionLabels: Record<BookCondition, string> = {
  new: '全新',
  like_new: '近新',
  good: '良好',
  fair: '一般',
  poor: '较差',
};

export const conditionFactors: Record<BookCondition, number> = {
  new: 2.5,
  like_new: 2.0,
  good: 1.6,
  fair: 1.3,
  poor: 1.0,
};

export const conditionPointsFactors: Record<BookCondition, number> = {
  new: 10,
  like_new: 8,
  good: 6,
  fair: 4,
  poor: 2,
};

export const scarcityLabels: Record<ScarcityLevel, string> = {
  rare: '罕见',
  uncommon: '较少',
  common: '普通',
  abundant: '常见',
};

export const scarcityFactors: Record<ScarcityLevel, number> = {
  rare: 1.5,
  uncommon: 1.3,
  common: 1.0,
  abundant: 0.8,
};

export function calculateSalePrice(
  purchasePrice: number,
  condition: BookCondition,
  scarcityLevel: ScarcityLevel
): number {
  const factors = readSaleFactors();
  const scarcityFactorsVal = readScarcityFactors();
  const conditionFactor = factors[condition];
  const scarcityFactor = scarcityFactorsVal[scarcityLevel];
  const price = purchasePrice * conditionFactor * scarcityFactor;
  return Math.round(price * 100) / 100;
}

export function calculateTradeInValue(
  originalPrice: number,
  condition: BookCondition
): number {
  const factors = readTradeInFactors();
  const baseRate = getTradeInBaseRate();
  const conditionFactor = factors[condition];
  const value = originalPrice * conditionFactor * baseRate;
  return Math.round(value * 100) / 100;
}

export function calculateTradeInPoints(
  originalPrice: number,
  condition: BookCondition
): number {
  const factors = readPointsFactors();
  const factor = factors[condition];
  const points = Math.round(originalPrice * factor);
  return points;
}

export function convertPointsToYuan(points: number): number {
  const rate = getPointsToYuanRate();
  return Math.round(points * rate * 100) / 100;
}

export function convertYuanToPoints(yuan: number): number {
  const rate = getYuanToPointsRate();
  return Math.round(yuan * rate);
}

export const premiumLabels: Record<PremiumLevel, string> = {
  high: '高溢价',
  medium: '中溢价',
  low: '潜在溢价',
  none: '无溢价',
};

export const premiumColors: Record<PremiumLevel, string> = {
  high: 'text-red-600 bg-red-50',
  medium: 'text-orange-600 bg-orange-50',
  low: 'text-amber-600 bg-amber-50',
  none: 'text-brown-400 bg-brown-50',
};

export const premiumIcons: Record<PremiumLevel, string> = {
  high: '🔥',
  medium: '⚡',
  low: '📈',
  none: '',
};

export function calculatePremiumInfo(
  currentPrice: number,
  doubanRating?: number,
  doubanWantToRead?: number,
  kongfzPrice?: number
): PremiumInfo {
  const reasons: string[] = [];
  let score = 0;

  if (doubanRating !== undefined && doubanRating >= 8.5) {
    reasons.push(`豆瓣评分 ${doubanRating} 分`);
    score += 0.4;
  }

  if (doubanWantToRead !== undefined && doubanWantToRead >= 1000) {
    reasons.push(`豆瓣想读 ${doubanWantToRead.toLocaleString()} 人`);
    score += 0.3;
  }

  let priceRatio = 0;
  if (kongfzPrice !== undefined && kongfzPrice > 0 && currentPrice > 0) {
    priceRatio = kongfzPrice / currentPrice;
    if (priceRatio >= 1.5) {
      reasons.push(`孔夫子售价 ¥${kongfzPrice}（高出当前 ${Math.round((priceRatio - 1) * 100)}%）`);
      if (priceRatio >= 2.0) {
        score += 0.5;
      } else {
        score += 0.3;
      }
    }
  }

  let level: PremiumLevel = 'none';
  if (score >= 0.7 || priceRatio >= 2.0) {
    level = 'high';
  } else if (score >= 0.4 || priceRatio >= 1.5) {
    level = 'medium';
  } else if (reasons.length > 0) {
    level = 'low';
  }

  const suggestedPrice = kongfzPrice ? Math.round(kongfzPrice * 0.85 * 100) / 100 : currentPrice;

  return {
    level,
    score: Math.round(score * 100) / 100,
    suggestedPrice,
    priceRatio: Math.round(priceRatio * 100) / 100,
    reasons,
    isConfirmed: false,
  };
}

export function updateBookPremiumInfo(book: {
  salePrice: number;
  doubanRating?: number;
  doubanWantToRead?: number;
  kongfzPrice?: number;
  premiumInfo?: PremiumInfo;
}): PremiumInfo | undefined {
  const hasPremiumData =
    book.doubanRating !== undefined ||
    book.doubanWantToRead !== undefined ||
    book.kongfzPrice !== undefined;

  if (!hasPremiumData) {
    return undefined;
  }

  const newPremiumInfo = calculatePremiumInfo(
    book.salePrice,
    book.doubanRating,
    book.doubanWantToRead,
    book.kongfzPrice
  );

  if (book.premiumInfo?.isConfirmed) {
    return {
      ...newPremiumInfo,
      isConfirmed: true,
      confirmedAt: book.premiumInfo.confirmedAt,
      confirmedBy: book.premiumInfo.confirmedBy,
    };
  }

  return newPremiumInfo;
}
