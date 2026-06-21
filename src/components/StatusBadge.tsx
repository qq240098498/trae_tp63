import type { BookStatus } from '@/types';

interface StatusBadgeProps {
  status: BookStatus;
  size?: 'sm' | 'md';
}

const statusLabels: Record<BookStatus, string> = {
  pending: '待定价',
  on_sale: '在售',
  sold: '已售出',
  off_shelf: '已下架',
};

const statusStyles: Record<BookStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  on_sale: 'bg-olive-100 text-olive-700 border-olive-200',
  sold: 'bg-gray-100 text-gray-600 border-gray-200',
  off_shelf: 'bg-brown-100 text-brown-600 border-brown-200',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`badge border ${statusStyles[status]} ${sizeClasses}`}>
      {statusLabels[status]}
    </span>
  );
}
