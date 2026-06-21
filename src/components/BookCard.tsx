import { Book } from '@/types';
import { ConditionBadge } from './ConditionBadge';
import { StatusBadge } from './StatusBadge';
import { formatCurrency } from '@/utils/format';

interface BookCardProps {
  book: Book;
  onClick?: () => void;
  showActions?: boolean;
  onAddToCart?: () => void;
}

export function BookCard({ book, onClick, showActions = false, onAddToCart }: BookCardProps) {
  return (
    <div
      className="card card-hover cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <div className="relative aspect-[3/4] bg-brown-50 overflow-hidden">
        <img
          src={book.coverImage}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <StatusBadge status={book.status} size="sm" />
        </div>
        <div className="absolute bottom-2 right-2">
          <ConditionBadge condition={book.condition} size="sm" />
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-serif font-semibold text-brown-800 text-sm line-clamp-2 mb-1">
          {book.title}
        </h3>
        <p className="text-xs text-brown-500 mb-2 truncate">{book.author}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-amber-600">
            {formatCurrency(book.salePrice)}
          </span>
          <span className="text-xs text-brown-400">{book.publisher}</span>
        </div>

        {showActions && book.status === 'on_sale' && (
          <button
            className="w-full mt-3 btn btn-primary text-sm py-1.5"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.();
            }}
          >
            加入购物车
          </button>
        )}
      </div>
    </div>
  );
}
