import { TrendingUp, Check } from 'lucide-react';
import { premiumLabels, premiumColors } from '@/utils/pricing';
import type { PremiumInfo } from '@/types';

interface PremiumBadgeProps {
  premiumInfo?: PremiumInfo;
  size?: 'sm' | 'md';
}

export function PremiumBadge({ premiumInfo, size = 'sm' }: PremiumBadgeProps) {
  if (!premiumInfo || premiumInfo.level === 'none') {
    return null;
  }

  const colorClass = premiumColors[premiumInfo.level];
  const label = premiumLabels[premiumInfo.level];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full ${colorClass} ${sizeClasses[size]}`}
    >
      {premiumInfo.level === 'high' && <span>🔥</span>}
      {premiumInfo.level === 'medium' && <span>⚡</span>}
      {premiumInfo.level === 'low' && <TrendingUp className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}`} />}
      {label}
      {premiumInfo.isConfirmed && (
        <Check className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} text-olive-600`} />
      )}
    </span>
  );
}
