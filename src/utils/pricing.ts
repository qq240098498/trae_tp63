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
