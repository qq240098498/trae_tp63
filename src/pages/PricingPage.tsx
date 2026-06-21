import { useState } from 'react';
import { Tag, Check, RefreshCw, TrendingUp, Clock, Info } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { ConditionBadge } from '@/components/ConditionBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { SearchBar } from '@/components/SearchBar';
import { Modal } from '@/components/Modal';
import { useBookStore } from '@/store/useBookStore';
import { useSystemConfigStore } from '@/store/useSystemConfigStore';
import { calculateSalePrice } from '@/utils/pricing';
import { formatCurrency } from '@/utils/format';
import type { Book } from '@/types';

export function PricingPage() {
  const { books, updatePrice, updateStatus, autoPriceBook } = useBookStore();
  const scarcities = useSystemConfigStore((s) => s.config.scarcities);
  const scarcityLabels = Object.fromEntries(
    scarcities.map((sc) => [sc.key, sc.label])
  ) as Record<string, string>;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [newPrice, setNewPrice] = useState(0);
  const [priceReason, setPriceReason] = useState('');
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'on_sale'>('all');

  const pendingBooks = books.filter((b) => b.status === 'pending');
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.includes(searchQuery);

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && book.status === 'pending') ||
      (filterStatus === 'on_sale' && book.status === 'on_sale');

    return matchesSearch && matchesStatus;
  });

  const toggleSelectBook = (bookId: string) => {
    setSelectedBooks((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId]
    );
  };

  const toggleSelectAll = () => {
    const visibleBookIds = filteredBooks
      .filter((b) => b.status === 'pending' || b.status === 'on_sale')
      .map((b) => b.id);

    if (selectedBooks.length === visibleBookIds.length) {
      setSelectedBooks([]);
    } else {
      setSelectedBooks(visibleBookIds);
    }
  };

  const openPriceModal = (book: Book) => {
    setEditingBook(book);
    setNewPrice(book.salePrice);
    setPriceReason('');
    setIsPriceModalOpen(true);
  };

  const handlePriceUpdate = () => {
    if (editingBook && newPrice > 0) {
      updatePrice(editingBook.id, newPrice, priceReason || '手动调整价格');
      setIsPriceModalOpen(false);
      setEditingBook(null);
    }
  };

  const handleAutoPrice = (book: Book) => {
    autoPriceBook(book.id);
  };

  const handleListBook = (book: Book) => {
    updateStatus(book.id, 'on_sale');
  };

  const handleBatchList = () => {
    selectedBooks.forEach((id) => {
      updateStatus(id, 'on_sale');
    });
    setSelectedBooks([]);
  };

  const handleBatchPrice = (factor: number) => {
    selectedBooks.forEach((id) => {
      const book = books.find((b) => b.id === id);
      if (book) {
        const newPriceValue = Math.round(book.salePrice * factor * 100) / 100;
        updatePrice(id, newPriceValue, `批量调整价格 (${factor > 1 ? '+' : ''}${Math.round((factor - 1) * 100)}%)`);
      }
    });
    setSelectedBooks([]);
  };

  const getSuggestedPrice = (book: Book) => {
    return calculateSalePrice(book.purchasePrice, book.condition, book.scarcityLevel);
  };

  return (
    <div>
      <PageHeader
        title="定价上架"
        description="根据品相和稀缺度为书籍定价，确认后上架销售"
        actions={
          pendingBooks.length > 0 && (
            <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              待定价: {pendingBooks.length} 本
            </span>
          )
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="搜索书名、作者、ISBN..."
          />
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-brown-200 overflow-hidden">
            {[
              { value: 'all', label: '全部' },
              { value: 'pending', label: '待定价' },
              { value: 'on_sale', label: '在售' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setFilterStatus(item.value as typeof filterStatus)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  filterStatus === item.value
                    ? 'bg-brown-600 text-white'
                    : 'bg-white text-brown-600 hover:bg-brown-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedBooks.length > 0 && (
        <div className="mb-4 p-4 bg-olive-50 border border-olive-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-olive-600" />
            <span className="text-olive-700 font-medium">
              已选择 {selectedBooks.length} 本书籍
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleBatchPrice(0.9)}
              className="btn btn-secondary text-sm"
            >
              降价10%
            </button>
            <button
              onClick={() => handleBatchPrice(1.1)}
              className="btn btn-secondary text-sm"
            >
              涨价10%
            </button>
            <button
              onClick={handleBatchList}
              className="btn btn-success text-sm"
            >
              批量上架
            </button>
            <button
              onClick={() => setSelectedBooks([])}
              className="btn btn-secondary text-sm"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brown-50 border-b border-brown-100">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedBooks.length ===
                      filteredBooks.filter(
                        (b) => b.status === 'pending' || b.status === 'on_sale'
                      ).length && filteredBooks.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-brown-600 rounded border-brown-300 focus:ring-brown-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                  书籍信息
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                  品相
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                  稀缺度
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                  回收价
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                  当前售价
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                  建议售价
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-100">
              {filteredBooks.map((book) => {
                const suggestedPrice = getSuggestedPrice(book);
                const isSelected = selectedBooks.includes(book.id);
                const canSelect = book.status === 'pending' || book.status === 'on_sale';

                return (
                  <tr
                    key={book.id}
                    className={`hover:bg-brown-50/50 transition-colors ${
                      isSelected ? 'bg-amber-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => canSelect && toggleSelectBook(book.id)}
                        disabled={!canSelect}
                        className="w-4 h-4 text-brown-600 rounded border-brown-300 focus:ring-brown-500 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded shadow-soft"
                        />
                        <div>
                          <p className="font-medium text-brown-800 line-clamp-1">
                            {book.title}
                          </p>
                          <p className="text-xs text-brown-500">{book.author}</p>
                          <p className="text-xs text-brown-400">{book.isbn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ConditionBadge condition={book.condition} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium ${
                          book.scarcityLevel === 'rare'
                            ? 'text-amber-600'
                            : book.scarcityLevel === 'uncommon'
                            ? 'text-olive-600'
                            : 'text-brown-500'
                        }`}
                      >
                        {scarcityLabels[book.scarcityLevel]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-brown-600">
                      {formatCurrency(book.purchasePrice)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-lg font-bold text-brown-800">
                        {formatCurrency(book.salePrice)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-600 font-medium">
                          {formatCurrency(suggestedPrice)}
                        </span>
                        {Math.abs(suggestedPrice - book.salePrice) > 0.01 && (
                          <span
                            className={`text-xs ${
                              suggestedPrice > book.salePrice
                                ? 'text-olive-600'
                                : 'text-red-500'
                            }`}
                          >
                            {suggestedPrice > book.salePrice ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={book.status} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openPriceModal(book)}
                          className="p-1.5 text-brown-500 hover:text-brown-700 hover:bg-brown-100 rounded transition-colors"
                          title="调整价格"
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAutoPrice(book)}
                          className="p-1.5 text-brown-500 hover:text-olive-600 hover:bg-olive-50 rounded transition-colors"
                          title="智能定价"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        {book.status === 'pending' && (
                          <button
                            onClick={() => handleListBook(book)}
                            className="p-1.5 text-olive-500 hover:text-olive-700 hover:bg-olive-50 rounded transition-colors"
                            title="上架销售"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBooks.length === 0 && (
          <div className="py-16 text-center">
            <Tag className="w-12 h-12 mx-auto mb-4 text-brown-300" />
            <p className="text-brown-500">没有找到符合条件的书籍</p>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-serif font-semibold text-brown-800">定价公式</h3>
          </div>
          <p className="text-sm text-brown-600 mb-3">
            售价 = 回收价 × 品相系数 × 稀缺度系数
          </p>
          <div className="text-xs text-brown-500 space-y-1">
            <p>• 全新×2.5，近新×2.0，良好×1.6，一般×1.3，较差×1.0</p>
            <p>• 罕见×1.5，较少×1.3，普通×1.0，常见×0.8</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-olive-100 rounded-lg">
              <Info className="w-5 h-5 text-olive-600" />
            </div>
            <h3 className="font-serif font-semibold text-brown-800">品相说明</h3>
          </div>
          <div className="text-xs text-brown-500 space-y-1">
            <p><strong>全新：</strong>未拆封或几乎全新，无任何痕迹</p>
            <p><strong>近新：</strong>轻微使用痕迹，无破损无笔记</p>
            <p><strong>良好：</strong>正常使用痕迹，可能有少量笔记</p>
            <p><strong>一般：</strong>明显使用痕迹，书脊可能有磨损</p>
            <p><strong>较差：</strong>封面破损或内页有较多笔记</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brown-100 rounded-lg">
              <Clock className="w-5 h-5 text-brown-600" />
            </div>
            <h3 className="font-serif font-semibold text-brown-800">最近调价</h3>
          </div>
          <div className="text-xs text-brown-500 space-y-2">
            <p className="text-brown-400 text-center py-4">暂无调价记录</p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        title="调整价格"
        size="sm"
      >
        {editingBook && (
          <div>
            <div className="flex gap-4 mb-6">
              <img
                src={editingBook.coverImage}
                alt={editingBook.title}
                className="w-20 h-28 object-cover rounded-lg shadow-soft"
              />
              <div className="flex-1">
                <h3 className="font-serif font-semibold text-brown-800 mb-1">
                  {editingBook.title}
                </h3>
                <p className="text-sm text-brown-500 mb-2">{editingBook.author}</p>
                <div className="flex gap-2">
                  <ConditionBadge condition={editingBook.condition} size="sm" />
                  <StatusBadge status={editingBook.status} size="sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-brown-50 rounded-lg">
                <p className="text-xs text-brown-500 mb-1">当前售价</p>
                <p className="text-xl font-bold text-brown-700">
                  {formatCurrency(editingBook.salePrice)}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-600 mb-1">建议售价</p>
                <p className="text-xl font-bold text-amber-600">
                  {formatCurrency(getSuggestedPrice(editingBook))}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="input-label">新价格 (元)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newPrice || ''}
                onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                className="input text-lg font-bold text-amber-600"
                placeholder="0.00"
              />
            </div>

            <div className="mb-6">
              <label className="input-label">调整原因</label>
              <textarea
                value={priceReason}
                onChange={(e) => setPriceReason(e.target.value)}
                className="input resize-none min-h-20"
                placeholder="请输入价格调整原因..."
              />
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setNewPrice(getSuggestedPrice(editingBook))}
                className="flex-1 btn btn-secondary text-sm"
              >
                使用建议价
              </button>
              <button
                onClick={() => setNewPrice(Math.round(editingBook.salePrice * 0.9 * 100) / 100)}
                className="flex-1 btn btn-secondary text-sm"
              >
                降价10%
              </button>
              <button
                onClick={() => setNewPrice(Math.round(editingBook.salePrice * 1.1 * 100) / 100)}
                className="flex-1 btn btn-secondary text-sm"
              >
                涨价10%
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsPriceModalOpen(false)}
                className="flex-1 btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handlePriceUpdate}
                className="flex-1 btn btn-primary"
                disabled={newPrice <= 0}
              >
                确认调整
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
