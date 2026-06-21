import { useState } from 'react';
import {
  RefreshCw,
  ArrowRight,
  Scan,
  Check,
  BookOpen,
  History,
  Plus,
  Receipt,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { ConditionBadge } from '@/components/ConditionBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { SearchBar } from '@/components/SearchBar';
import { BookCard } from '@/components/BookCard';
import { Modal } from '@/components/Modal';
import { useBookStore } from '@/store/useBookStore';
import { useSaleStore } from '@/store/useSaleStore';
import { calculateTradeInValue, conditionLabels } from '@/utils/pricing';
import { lookupIsbn } from '@/utils/isbn';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { Book, BookCondition, BookFormData, ScarcityLevel } from '@/types';

type TabType = 'trade' | 'history';

export function TradeInPage() {
  const [activeTab, setActiveTab] = useState<TabType>('trade');
  const { books, addBook, updateStatus } = useBookStore();
  const { tradeIns, addTradeIn } = useSaleStore();

  const [selectedNewBook, setSelectedNewBook] = useState<Book | null>(null);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [bookSearchQuery, setBookSearchQuery] = useState('');

  const [oldBookIsbn, setOldBookIsbn] = useState('');
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [oldBookInfo, setOldBookInfo] = useState<{
    title: string;
    author: string;
    publisher: string;
    coverImage: string;
    isbn: string;
  } | null>(null);
  const [oldBookCondition, setOldBookCondition] = useState<BookCondition>('good');
  const [oldBookNotes, setOldBookNotes] = useState('');
  const [oldBookOriginalPrice, setOldBookOriginalPrice] = useState(0);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const onSaleBooks = books.filter((b) => b.status === 'on_sale');
  const filteredBooks = onSaleBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
      book.isbn.includes(bookSearchQuery)
  );

  const tradeInValue = oldBookOriginalPrice > 0
    ? calculateTradeInValue(oldBookOriginalPrice, oldBookCondition)
    : 0;

  const priceDifference = selectedNewBook
    ? Math.abs(selectedNewBook.salePrice - tradeInValue)
    : 0;

  const direction = selectedNewBook
    ? selectedNewBook.salePrice > tradeInValue
      ? 'additional'
      : 'refund'
    : null;

  const handleOldBookLookup = async () => {
    if (!oldBookIsbn.trim()) return;

    setIsLookupLoading(true);
    setOldBookInfo(null);

    try {
      const result = await lookupIsbn(oldBookIsbn);
      if (result) {
        setOldBookInfo({
          title: result.title,
          author: result.author,
          publisher: result.publisher,
          coverImage: result.coverImage,
          isbn: result.isbn,
        });
        setOldBookOriginalPrice(30);
      }
    } finally {
      setIsLookupLoading(false);
    }
  };

  const handleSelectNewBook = (book: Book) => {
    setSelectedNewBook(book);
    setShowBookSelector(false);
  };

  const handleConfirmTrade = () => {
    if (!selectedNewBook || !oldBookInfo || tradeInValue <= 0) return;

    const oldBookData: BookFormData = {
      isbn: oldBookInfo.isbn,
      title: oldBookInfo.title,
      author: oldBookInfo.author,
      publisher: oldBookInfo.publisher,
      publishDate: '',
      coverImage: oldBookInfo.coverImage,
      description: '',
      condition: oldBookCondition,
      purchasePrice: tradeInValue,
      scarcityLevel: 'common' as ScarcityLevel,
      location: '',
      notes: oldBookNotes + ' (以旧换新旧书)',
      conditionPhotos: [],
    };

    const addedOldBook = addBook(oldBookData);
    updateStatus(addedOldBook.id, 'pending');

    updateStatus(selectedNewBook.id, 'sold');

    addTradeIn({
      oldBook: {
        id: addedOldBook.id,
        title: oldBookInfo.title,
        isbn: oldBookInfo.isbn,
        coverImage: oldBookInfo.coverImage,
        condition: oldBookCondition,
      },
      oldBookValue: tradeInValue,
      newBook: {
        id: selectedNewBook.id,
        title: selectedNewBook.title,
        isbn: selectedNewBook.isbn,
        coverImage: selectedNewBook.coverImage,
        salePrice: selectedNewBook.salePrice,
      },
      priceDifference,
      direction: direction || 'additional',
      notes: oldBookNotes,
    });

    setShowSuccess(true);
    setSuccessMessage(
      `换购成功！${direction === 'additional' ? '顾客补差价' : '退还顾客'} ${formatCurrency(priceDifference)}`
    );

    setTimeout(() => {
      setShowSuccess(false);
      setSuccessMessage('');
      resetForm();
    }, 3000);
  };

  const resetForm = () => {
    setSelectedNewBook(null);
    setOldBookIsbn('');
    setOldBookInfo(null);
    setOldBookCondition('good');
    setOldBookNotes('');
    setOldBookOriginalPrice(0);
  };

  return (
    <div>
      <PageHeader
        title="以旧换新"
        description="旧书折价抵扣新书款，支持差价多退少补"
        actions={
          <div className="flex rounded-lg border border-brown-200 overflow-hidden">
            <button
              onClick={() => setActiveTab('trade')}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'trade'
                  ? 'bg-brown-600 text-white'
                  : 'bg-white text-brown-600 hover:bg-brown-50'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              换购
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-brown-600 text-white'
                  : 'bg-white text-brown-600 hover:bg-brown-50'
              }`}
            >
              <History className="w-4 h-4" />
              记录
            </button>
          </div>
        }
      />

      {showSuccess && (
        <div className="mb-6 p-4 bg-olive-50 border border-olive-200 rounded-xl flex items-center gap-3 text-olive-700">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {activeTab === 'trade' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-olive-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-olive-600" />
                </div>
                <h3 className="font-serif font-semibold text-lg text-brown-800">旧书估价</h3>
              </div>

              <div className="mb-4">
                <label className="input-label">旧书ISBN</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={oldBookIsbn}
                      onChange={(e) => setOldBookIsbn(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleOldBookLookup()}
                      placeholder="扫描或输入ISBN..."
                      className="input pl-10"
                    />
                    <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
                  </div>
                  <button
                    onClick={handleOldBookLookup}
                    disabled={isLookupLoading}
                    className="btn btn-secondary"
                  >
                    {isLookupLoading ? '查询中...' : '查询'}
                  </button>
                </div>
              </div>

              {oldBookInfo && (
                <div className="mb-4 p-4 bg-brown-50 rounded-xl">
                  <div className="flex gap-3 mb-3">
                    <img
                      src={oldBookInfo.coverImage}
                      alt={oldBookInfo.title}
                      className="w-16 h-22 object-cover rounded shadow-soft"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-brown-800 text-sm line-clamp-2">
                        {oldBookInfo.title}
                      </p>
                      <p className="text-xs text-brown-500 mt-1">{oldBookInfo.author}</p>
                      <p className="text-xs text-brown-400">{oldBookInfo.isbn}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="input-label">品相分级</label>
                  <div className="grid grid-cols-5 gap-1">
                    {(Object.keys(conditionLabels) as BookCondition[]).map((cond) => (
                      <button
                        key={cond}
                        onClick={() => setOldBookCondition(cond)}
                        className={`px-2 py-2 text-xs rounded-lg border transition-all ${
                          oldBookCondition === cond
                            ? 'bg-olive-500 text-white border-olive-500'
                            : 'bg-white text-brown-600 border-brown-200 hover:border-brown-300'
                        }`}
                      >
                        {conditionLabels[cond]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="input-label">原价估计 (元)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={oldBookOriginalPrice || ''}
                    onChange={(e) => setOldBookOriginalPrice(parseFloat(e.target.value) || 0)}
                    className="input"
                    placeholder="书籍原定价"
                  />
                  <p className="text-xs text-brown-400 mt-1">
                    用于计算旧书折价，通常为书籍定价
                  </p>
                </div>

                {oldBookOriginalPrice > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-700 mb-1">旧书估价</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {formatCurrency(tradeInValue)}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      原价 × 品相系数 × 0.5
                    </p>
                  </div>
                )}

                <div>
                  <label className="input-label">备注</label>
                  <textarea
                    value={oldBookNotes}
                    onChange={(e) => setOldBookNotes(e.target.value)}
                    className="input resize-none min-h-16"
                    placeholder="旧书情况说明..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-amber-100 rounded-full">
                <ArrowRight className="w-8 h-8 text-amber-600 rotate-90 lg:rotate-0" />
              </div>
              <div className="text-center">
                <p className="text-sm text-brown-500">旧书抵价</p>
                {tradeInValue > 0 && (
                  <p className="text-xl font-bold text-olive-600">
                    -{formatCurrency(tradeInValue)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-serif font-semibold text-lg text-brown-800">换购新书</h3>
              </div>

              {selectedNewBook ? (
                <div>
                  <div className="mb-4">
                    <div className="aspect-[3/4] bg-brown-50 rounded-xl overflow-hidden mb-3">
                      <img
                        src={selectedNewBook.coverImage}
                        alt={selectedNewBook.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="font-serif font-semibold text-brown-800 text-lg mb-1">
                      {selectedNewBook.title}
                    </h4>
                    <p className="text-sm text-brown-500 mb-2">{selectedNewBook.author}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <ConditionBadge condition={selectedNewBook.condition} size="sm" />
                      <StatusBadge status={selectedNewBook.status} size="sm" />
                    </div>
                    <p className="text-2xl font-bold text-amber-600">
                      {formatCurrency(selectedNewBook.salePrice)}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedNewBook(null)}
                    className="w-full btn btn-secondary text-sm"
                  >
                    重新选择
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowBookSelector(true)}
                  className="w-full aspect-[3/4] border-2 border-dashed border-brown-200 rounded-xl flex flex-col items-center justify-center text-brown-400 hover:border-brown-400 hover:text-brown-600 transition-colors"
                >
                  <Plus className="w-10 h-10 mb-2" />
                  <span className="text-sm font-medium">选择换购新书</span>
                </button>
              )}

              {selectedNewBook && tradeInValue > 0 && (
                <div className="mt-6 p-4 border-2 border-brown-200 rounded-xl">
                  <h4 className="font-medium text-brown-800 mb-3">换购结算</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-brown-500">新书价格</span>
                      <span className="text-brown-700">{formatCurrency(selectedNewBook.salePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brown-500">旧书抵扣</span>
                      <span className="text-olive-600">-{formatCurrency(tradeInValue)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-brown-200">
                      <span className="font-medium text-brown-700">
                        {direction === 'additional' ? '顾客补差价' : '退还顾客'}
                      </span>
                      <span className={`text-xl font-bold ${
                        direction === 'additional' ? 'text-amber-600' : 'text-olive-600'
                      }`}>
                        {formatCurrency(priceDifference)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brown-50 border-b border-brown-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    时间
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    旧书
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    新书
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    旧书估价
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    差价
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    方向
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown-100">
                {tradeIns.map((trade) => (
                  <tr key={trade.id} className="hover:bg-brown-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-brown-600">
                      {formatDateTime(trade.tradeDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={trade.oldBook.coverImage}
                          alt={trade.oldBook.title}
                          className="w-8 h-10 object-cover rounded"
                        />
                        <div>
                          <p className="text-sm text-brown-700">{trade.oldBook.title}</p>
                          <ConditionBadge condition={trade.oldBook.condition} size="sm" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={trade.newBook.coverImage}
                          alt={trade.newBook.title}
                          className="w-8 h-10 object-cover rounded"
                        />
                        <p className="text-sm text-brown-700">{trade.newBook.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-olive-600 font-medium">
                      {formatCurrency(trade.oldBookValue)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-lg font-bold ${
                        trade.direction === 'additional' ? 'text-amber-600' : 'text-olive-600'
                      }`}>
                        {formatCurrency(trade.priceDifference)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          trade.direction === 'additional'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-olive-100 text-olive-700'
                        }`}
                      >
                        {trade.direction === 'additional' ? '补差价' : '退余款'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tradeIns.length === 0 && (
            <div className="py-16 text-center">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-brown-300" />
              <p className="text-brown-500">暂无换购记录</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'trade' && (
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={resetForm}
            className="btn btn-secondary px-8 py-3"
          >
            重置
          </button>
          <button
            onClick={handleConfirmTrade}
            disabled={!selectedNewBook || !oldBookInfo || tradeInValue <= 0}
            className="btn btn-success px-8 py-3 text-base"
          >
            确认换购
          </button>
        </div>
      )}

      <Modal
        isOpen={showBookSelector}
        onClose={() => setShowBookSelector(false)}
        title="选择换购新书"
        size="xl"
      >
        <div className="mb-4">
          <SearchBar
            value={bookSearchQuery}
            onChange={setBookSearchQuery}
            placeholder="搜索在售书籍..."
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto scrollbar-thin">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onClick={() => handleSelectNewBook(book)}
            />
          ))}
        </div>
        {filteredBooks.length === 0 && (
          <div className="py-8 text-center text-brown-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>没有找到匹配的书籍</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
