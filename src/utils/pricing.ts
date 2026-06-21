import type { BookCondition, ScarcityLevel } from '@/types';

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

export const POINTS_TO_YUAN_RATE = 0.1;
export const YUAN_TO_POINTS_RATE = 10;

export function calculateSalePrice(
  purchasePrice: number,
  condition: BookCondition,
  scarcityLevel: ScarcityLevel
): number {
  const conditionFactor = conditionFactors[condition];
  const scarcityFactor = scarcityFactors[scarcityLevel];
  const price = purchasePrice * conditionFactor * scarcityFactor;
  return Math.round(price * 100) / 100;
}

export function calculateTradeInValue(
  originalPrice: number,
  condition: BookCondition
): number {
  const conditionFactor = conditionFactors[condition];
  const value = originalPrice * conditionFactor * 0.5;
  return Math.round(value * 100) / 100;
}

export function calculateTradeInPoints(
  originalPrice: number,
  condition: BookCondition
): number {
  const factor = conditionPointsFactors[condition];
  const points = Math.round(originalPrice * factor);
  return points;
}

export function convertPointsToYuan(points: number): number {
  return Math.round(points * POINTS_TO_YUAN_RATE * 100) / 100;
}

export function convertYuanToPoints(yuan: number): number {
  return Math.round(yuan * YUAN_TO_POINTS_RATE);
}
