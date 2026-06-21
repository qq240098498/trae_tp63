import type { BookCondition } from '@/types';
import { useSystemConfigStore } from '@/store/useSystemConfigStore';

interface ConditionBadgeProps {
  condition: BookCondition;
  size?: 'sm' | 'md';
}

const conditionStyles: Record<BookCondition, string> = {
  new: 'bg-olive-100 text-olive-700 border-olive-200',
  like_new: 'bg-olive-50 text-olive-600 border-olive-200',
  good: 'bg-amber-100 text-amber-700 border-amber-200',
  fair: 'bg-brown-100 text-brown-700 border-brown-200',
  poor: 'bg-red-100 text-red-700 border-red-200',
};

const defaultLabels: Record<BookCondition, string> = {
  new: '全新',
  like_new: '近新',
  good: '良好',
  fair: '一般',
  poor: '较差',
};

export function ConditionBadge({ condition, size = 'md' }: ConditionBadgeProps) {
  const label = useSystemConfigStore(
    (s) => s.config.conditions.find((c) => c.key === condition)?.label
  );
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`badge border ${conditionStyles[condition]} ${sizeClasses}`}>
      {label || defaultLabels[condition]}
    </span>
  );
}
