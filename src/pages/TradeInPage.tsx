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
  Coins,
  Banknote,
  User,
  Phone,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { ConditionBadge } from '@/components/ConditionBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { SearchBar } from '@/components/SearchBar';
import { BookCard } from '@/components/BookCard';
import { Modal } from '@/components/Modal';
import { useBookStore } from '@/store/useBookStore';
import { useSaleStore } from '@/store/useSaleStore';
import { usePointsStore } from '@/store/usePointsStore';
import { useSystemConfigStore } from '@/store/useSystemConfigStore';
import {
  calculateTradeInValue,
  calculateTradeInPoints,
  convertPointsToYuan,
  getPointsToYuanRate,
} from '@/utils/pricing';
import { lookupIsbn } from '@/utils/isbn';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { Book, BookCondition, BookFormData, ScarcityLevel, TradeInMode } from '@/types';

type TabType = 'trade' | 'history';

export function TradeInPage() {
  const [activeTab, setActiveTab] = useState<TabType>('trade');
  const { books, addBook, updateStatus } = useBookStore();
  const { tradeIns, addTradeIn } = useSaleStore();
  const { addPoints, deductPoints, getAccountByPhone, getOrCreateAccount } = usePointsStore();

  const conditions = useSystemConfigStore((s) => s.config.conditions);
  const conditionLabels = Object.fromEntries(
    conditions.map((c) => [c.key, c.label])
  ) as Record<BookCondition, string>;
  const conditionPointsFactors = Object.fromEntries(
    conditions.map((c) => [c.key, c.pointsFactor])
  ) as Record<BookCondition, number>;
  const pointsToYuanRate = useSystemConfigStore((s) => s.config.points.yuanPerPoints);

  const [tradeMode, setTradeMode] = useState<TradeInMode>('value_only');
  const [valueRatio, setValueRatio] = useState<number>(50);

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

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [usePointsForNewBook, setUsePointsForNewBook] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const onSaleBooks = books.filter((b) => b.status === 'on_sale');
  const filteredBooks = onSaleBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
      book.isbn.includes(bookSearchQuery)
  );

  const tradeInValue =
    oldBookOriginalPrice > 0 ? calculateTradeInValue(oldBookOriginalPrice, oldBookCondition) : 0;

  const tradeInPoints =
    oldBookOriginalPrice > 0 ? calculateTradeInPoints(oldBookOriginalPrice, oldBookCondition) : 0;

  const actualValue =
    tradeMode === 'value_only'
      ? tradeInValue
      : tradeMode === 'mixed'
      ? Math.round((tradeInValue * valueRatio) / 100 * 100) / 100
      : 0;

  const actualPoints =
    tradeMode === 'points_only'
      ? tradeInPoints
      : tradeMode === 'mixed'
      ? Math.round((tradeInPoints * (100 - valueRatio)) / 100)
      : 0;

  const needCustomerInfo = tradeMode === 'points_only' || tradeMode === 'mixed';

  const customerAccount = customerPhone ? getAccountByPhone(customerPhone) : undefined;
  const customerPointsBalance = customerAccount?.balance || 0;

  const pointsDeductionValue = usePointsForNewBook ? convertPointsToYuan(pointsToUse) : 0;

  const totalDeduction = actualValue + pointsDeductionValue;

  const priceDifference = selectedNewBook
    ? Math.max(0, selectedNewBook.salePrice - totalDeduction)
    : 0;

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
    if (!oldBookInfo) return;

    if (needCustomerInfo && (!customerName.trim() || !customerPhone.trim())) {
      alert('请填写会员信息以便积分到账');
      return;
    }

    if (usePointsForNewBook && pointsToUse > customerPointsBalance) {
      alert('积分不足，当前余额：' + customerPointsBalance);
      return;
    }

    const modeLabelMap: Record<TradeInMode, string> = {
      value_only: '现金折价',
      points_only: '积分',
      mixed: '混合(现金+积分)',
    };

    const oldBookData: BookFormData = {
      isbn: oldBookInfo.isbn,
      title: oldBookInfo.title,
      author: oldBookInfo.author,
      publisher: oldBookInfo.publisher,
      publishDate: '',
      coverImage: oldBookInfo.coverImage,
      description: '',
      condition: oldBookCondition,
      purchasePrice: actualValue,
      scarcityLevel: 'common' as ScarcityLevel,
      location: '',
      notes: oldBookNotes + ` (以旧换新-${modeLabelMap[tradeMode]}模式)`,
      conditionPhotos: [],
    };

    const addedOldBook = addBook(oldBookData);
    updateStatus(addedOldBook.id, 'pending');

    let pointsMessage = '';

    if (actualPoints > 0 && needCustomerInfo) {
      const account = addPoints(
        customerPhone.trim(),
        customerName.trim(),
        actualPoints,
        `旧书回收：《${oldBookInfo.title}》(${conditionLabels[oldBookCondition]})`,
        addedOldBook.id
      );
      if (account) {
        pointsMessage = `\n会员 ${customerName} 获得 ${actualPoints} 积分，当前余额 ${account.balance} 积分`;
      }
    }

    if (selectedNewBook) {
      if (usePointsForNewBook && pointsToUse > 0) {
        const result = deductPoints(
          customerPhone.trim(),
          customerName.trim(),
          pointsToUse,
          `购书抵扣：《${selectedNewBook.title}》`,
          selectedNewBook.id
        );
        if (!result.success) {
          alert(result.message);
          return;
        }
      }

      updateStatus(selectedNewBook.id, 'sold');

      addTradeIn({
        mode: tradeMode,
        oldBook: {
          id: addedOldBook.id,
          title: oldBookInfo.title,
          isbn: oldBookInfo.isbn,
          coverImage: oldBookInfo.coverImage,
          condition: oldBookCondition,
        },
        oldBookValue: actualValue,
        pointsEarned: actualPoints,
        newBook: {
          id: selectedNewBook.id,
          title: selectedNewBook.title,
          isbn: selectedNewBook.isbn,
          coverImage: selectedNewBook.coverImage,
          salePrice: selectedNewBook.salePrice,
        },
        pointsUsed: pointsToUse,
        priceDifference,
        direction: 'additional',
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        notes: oldBookNotes,
      });
    } else {
      addTradeIn({
        mode: tradeMode,
        oldBook: {
          id: addedOldBook.id,
          title: oldBookInfo.title,
          isbn: oldBookInfo.isbn,
          coverImage: oldBookInfo.coverImage,
          condition: oldBookCondition,
        },
        oldBookValue: actualValue,
        pointsEarned: actualPoints,
        pointsUsed: 0,
        priceDifference: 0,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        notes: oldBookNotes + (actualValue > 0 ? ` [现金回收${formatCurrency(actualValue)}]` : ''),
      });
    }

    setShowSuccess(true);
    let message = '';
    if (selectedNewBook) {
      const paidAmount = Math.max(0, selectedNewBook.salePrice - actualValue - pointsDeductionValue);
      const parts: string[] = [];
      if (actualValue > 0) parts.push(`旧书折价 ${formatCurrency(actualValue)}`);
      if (actualPoints > 0) parts.push(`获 ${actualPoints} 积分`);
      if (pointsDeductionValue > 0) parts.push(`用 ${pointsToUse} 积分抵 ${formatCurrency(pointsDeductionValue)}`);
      parts.push(`实收 ${formatCurrency(paidAmount)}`);
      message = `换购成功！${parts.join('，')}`;
    } else {
      const parts: string[] = [];
      if (actualValue > 0) parts.push(`现金回收 ${formatCurrency(actualValue)}`);
      if (actualPoints > 0) parts.push(`获得 ${actualPoints} 积分`);
      message = `旧书回收成功！${parts.join('，')}`;
    }
    setSuccessMessage(message + pointsMessage);

    setTimeout(() => {
      setShowSuccess(false);
      setSuccessMessage('');
      resetForm();
    }, 4000);
  };

  const resetForm = () => {
    setSelectedNewBook(null);
    setOldBookIsbn('');
    setOldBookInfo(null);
    setOldBookCondition('good');
    setOldBookNotes('');
    setOldBookOriginalPrice(0);
    setCustomerName('');
    setCustomerPhone('');
    setUsePointsForNewBook(false);
    setPointsToUse(0);
  };

  return (
    <div>
      <PageHeader
        title="以旧换新"
        description="旧书折价抵扣新书款，或累积积分任意消费使用"
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
        <div className="mb-6 p-4 bg-olive-50 border border-olive-200 rounded-xl flex items-center gap-3 text-olive-700 whitespace-pre-line">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {activeTab === 'trade' ? (
        <>
          <div className="card p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-brown-700">回收方式：</span>
              <div className="flex rounded-lg border border-brown-200 overflow-hidden flex-wrap">
                <button
                  onClick={() => setTradeMode('value_only')}
                  className={`px-5 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                    tradeMode === 'value_only'
                      ? 'bg-olive-600 text-white'
                      : 'bg-white text-brown-600 hover:bg-brown-50'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  仅现金折价
                </button>
                <button
                  onClick={() => setTradeMode('points_only')}
                  className={`px-5 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                    tradeMode === 'points_only'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white text-brown-600 hover:bg-brown-50'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  仅积分
                </button>
                <button
                  onClick={() => setTradeMode('mixed')}
                  className={`px-5 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                    tradeMode === 'mixed'
                      ? 'bg-brown-600 text-white'
                      : 'bg-white text-brown-600 hover:bg-brown-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  现金+积分
                </button>
              </div>
              <div className="flex-1" />
              <div className="text-xs text-brown-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                积分可抵扣任意书籍消费，不限于旧书回收价
              </div>
            </div>

            {tradeMode === 'mixed' && oldBookOriginalPrice > 0 && (
              <div className="mt-4 pt-4 border-t border-brown-100">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-brown-600">现金折价比例</span>
                  <span className="font-bold text-brown-800">{valueRatio}% 现金 / {100 - valueRatio}% 积分</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={valueRatio}
                  onChange={(e) => setValueRatio(parseInt(e.target.value))}
                  className="w-full accent-brown-500"
                />
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div className="p-3 bg-olive-50 rounded-lg text-center">
                    <p className="text-olive-700 text-xs mb-1">现金折价</p>
                    <p className="text-xl font-bold text-olive-600">{formatCurrency(actualValue)}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg text-center">
                    <p className="text-amber-700 text-xs mb-1 flex items-center justify-center gap-1">
                      <Coins className="w-3 h-3" /> 获得积分
                    </p>
                    <p className="text-xl font-bold text-amber-600">{actualPoints.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

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
                    <p className="text-xs text-brown-400 mt-1">用于计算旧书折价或积分</p>
                  </div>

                  {oldBookOriginalPrice > 0 && (
                    <div
                      className={`p-4 border rounded-xl ${
                        tradeMode === 'value_only'
                          ? 'bg-amber-50 border-amber-200'
                          : tradeMode === 'points_only'
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-brown-50 border-brown-200'
                      }`}
                    >
                      {tradeMode === 'value_only' ? (
                        <>
                          <p className="text-sm text-amber-700 mb-1">旧书现金估价</p>
                          <p className="text-2xl font-bold text-amber-600">
                            {formatCurrency(tradeInValue)}
                          </p>
                          <p className="text-xs text-amber-600 mt-1">原价 × 品相系数 × 基础折价率</p>
                        </>
                      ) : tradeMode === 'points_only' ? (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <Coins className="w-4 h-4 text-amber-600" />
                            <p className="text-sm text-amber-700">可获得积分</p>
                          </div>
                          <p className="text-3xl font-bold text-amber-600">
                            {tradeInPoints.toLocaleString()}
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            原价 × {conditionPointsFactors[oldBookCondition]} (
                            {conditionLabels[oldBookCondition]}系数)
                          </p>
                          <p className="text-xs text-amber-500 mt-1">
                            约可抵扣 {formatCurrency(convertPointsToYuan(tradeInPoints))}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-brown-700 mb-3">混合分配结果（可调比例）</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-olive-50 rounded-lg">
                              <p className="text-xs text-olive-700 mb-1">现金折价</p>
                              <p className="text-xl font-bold text-olive-600">
                                {formatCurrency(actualValue)}
                              </p>
                              <p className="text-xs text-olive-600 mt-1">{valueRatio}%</p>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-lg">
                              <p className="text-xs text-amber-700 mb-1 flex items-center gap-1">
                                <Coins className="w-3 h-3" /> 积分
                              </p>
                              <p className="text-xl font-bold text-amber-600">
                                {actualPoints.toLocaleString()}
                              </p>
                              <p className="text-xs text-amber-600 mt-1">{100 - valueRatio}%</p>
                            </div>
                          </div>
                          <p className="text-xs text-brown-500 mt-3">
                            原价 × 系数 = 全额 {formatCurrency(tradeInValue)} 或 {tradeInPoints} 积分
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {needCustomerInfo && (
                    <div className="p-4 bg-brown-50 rounded-xl space-y-3">
                      <p className="text-sm font-medium text-brown-700 flex items-center gap-1">
                        <User className="w-4 h-4" />
                        会员信息（积分到账必填）
                      </p>
                      <div>
                        <label className="input-label text-xs">姓名 *</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="input"
                          placeholder="请输入姓名"
                        />
                      </div>
                      <div>
                        <label className="input-label text-xs">手机号 *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
                          <input
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => {
                              setCustomerPhone(e.target.value);
                            }}
                            className="input pl-10"
                            placeholder="用于积分到账"
                          />
                        </div>
                        {customerAccount && (
                          <p className="text-xs text-olive-600 mt-1">
                            已存在会员，当前积分：
                            <span className="font-bold">{customerPointsBalance.toLocaleString()}</span>
                          </p>
                        )}
                      </div>
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
                <div className="text-center space-y-2">
                  {(actualValue > 0 || tradeMode === 'value_only') && (
                    <>
                      <p className="text-sm text-brown-500">旧书现金抵价</p>
                      {actualValue > 0 && (
                        <p className="text-xl font-bold text-olive-600">
                          -{formatCurrency(actualValue)}
                        </p>
                      )}
                    </>
                  )}
                  {(actualPoints > 0 || tradeMode === 'points_only' || tradeMode === 'mixed') && (
                    <>
                      <p className="text-sm text-brown-500 mt-3">获得积分</p>
                      {actualPoints > 0 && (
                        <p className="text-xl font-bold text-amber-600 flex items-center gap-1 justify-center">
                          <Coins className="w-5 h-5" />
                          +{actualPoints.toLocaleString()}
                        </p>
                      )}
                    </>
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
                  <h3 className="font-serif font-semibold text-lg text-brown-800">
                    换购新书（可选）
                  </h3>
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

                    {customerAccount && customerPointsBalance > 0 && (
                      <div className="mb-4 p-3 bg-amber-50 rounded-xl">
                        <label className="flex items-center gap-2 mb-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={usePointsForNewBook}
                            onChange={(e) => {
                              setUsePointsForNewBook(e.target.checked);
                              if (e.target.checked) {
                                const maxPoints = Math.min(
                                  customerPointsBalance,
                                  Math.floor(selectedNewBook.salePrice / pointsToYuanRate)
                                );
                                setPointsToUse(maxPoints);
                              } else {
                                setPointsToUse(0);
                              }
                            }}
                            className="w-4 h-4 rounded border-brown-300 text-amber-500 focus:ring-amber-400"
                          />
                          <span className="text-sm font-medium text-brown-700">
                            使用会员积分抵扣
                          </span>
                        </label>
                        {usePointsForNewBook && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-brown-600">可用积分</span>
                              <span className="font-bold text-amber-600">
                                {customerPointsBalance.toLocaleString()}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max={Math.min(
                                customerPointsBalance,
                                Math.floor(selectedNewBook.salePrice / pointsToYuanRate)
                              )}
                              value={pointsToUse}
                              onChange={(e) => setPointsToUse(parseInt(e.target.value))}
                              className="w-full accent-amber-500"
                            />
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-brown-600">使用 {pointsToUse.toLocaleString()} 积分</span>
                              <span className="font-medium text-olive-600">
                                抵扣 {formatCurrency(convertPointsToYuan(pointsToUse))}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

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
                    <span className="text-sm font-medium">选择换购新书（可选）</span>
                  </button>
                )}

                {(selectedNewBook && (actualValue > 0 || pointsDeductionValue > 0 || actualPoints > 0)) && (
                  <div className="mt-6 p-4 border-2 border-brown-200 rounded-xl">
                    <h4 className="font-medium text-brown-800 mb-3">换购结算</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-brown-500">新书价格</span>
                        <span className="text-brown-700">{formatCurrency(selectedNewBook.salePrice)}</span>
                      </div>
                      {actualValue > 0 && (
                        <div className="flex justify-between">
                          <span className="text-brown-500">旧书现金抵扣</span>
                          <span className="text-olive-600">-{formatCurrency(actualValue)}</span>
                        </div>
                      )}
                      {actualPoints > 0 && (
                        <div className="flex justify-between">
                          <span className="text-brown-500 flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5" />
                            旧书获积分
                          </span>
                          <span className="text-amber-600">+{actualPoints.toLocaleString()}</span>
                        </div>
                      )}
                      {pointsDeductionValue > 0 && (
                        <div className="flex justify-between">
                          <span className="text-brown-500 flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5" />
                            积分抵扣 ({pointsToUse}分)
                          </span>
                          <span className="text-olive-600">-{formatCurrency(pointsDeductionValue)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-brown-200">
                        <span className="font-medium text-brown-700">顾客实付</span>
                        <span className="text-xl font-bold text-amber-600">
                          {formatCurrency(priceDifference)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedNewBook && (actualValue > 0 || actualPoints > 0) && (
                  <div className="mt-6 p-4 border-2 border-dashed rounded-xl text-center space-y-2 bg-brown-50/50 border-brown-300">
                    {(actualValue > 0 && tradeMode !== 'points_only') && (
                      <>
                        <Banknote className="w-10 h-10 mx-auto mb-1 text-olive-500" />
                        <p className="text-sm text-brown-700">
                          仅回收旧书，支付现金{' '}
                          <span className="font-bold text-olive-600">
                            {formatCurrency(actualValue)}
                          </span>
                        </p>
                      </>
                    )}
                    {actualPoints > 0 && tradeMode === 'points_only' && (
                      <>
                        <Coins className="w-10 h-10 mx-auto mb-2 text-amber-500" />
                        <p className="text-sm text-brown-700">
                          仅回收旧书，获得{' '}
                          <span className="font-bold text-amber-600">{actualPoints.toLocaleString()}</span> 积分
                        </p>
                        <p className="text-xs text-brown-500">积分可在以后任意消费时使用</p>
                      </>
                    )}
                    {tradeMode === 'mixed' && (
                      <div className="pt-2 border-t border-brown-200 mt-2">
                        <p className="text-xs text-brown-500">
                          现金回收 {formatCurrency(actualValue)} ＋ {actualPoints} 积分
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brown-50 border-b border-brown-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">方式</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">旧书</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">新书</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">现金折价</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">积分</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">实付差价</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown-100">
                {tradeIns.map((trade) => {
                  const modeLabel: Record<TradeInMode, { label: string; cls: string }> = {
                    value_only: { label: '现金折价', cls: 'bg-olive-100 text-olive-700' },
                    points_only: { label: '纯积分', cls: 'bg-amber-100 text-amber-700' },
                    mixed: { label: '混合', cls: 'bg-brown-100 text-brown-700' },
                  };
                  const m = modeLabel[trade.mode];
                  return (
                    <tr key={trade.id} className="hover:bg-brown-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-brown-600">
                        {formatDateTime(trade.tradeDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${m.cls}`}>
                          {m.label}
                        </span>
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
                        {trade.newBook ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={trade.newBook.coverImage}
                              alt={trade.newBook.title}
                              className="w-8 h-10 object-cover rounded"
                            />
                            <p className="text-sm text-brown-700">{trade.newBook.title}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-brown-400">仅回收</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-olive-600 font-medium">
                        {trade.oldBookValue > 0 ? formatCurrency(trade.oldBookValue) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-amber-600">
                          {trade.pointsEarned > 0 && (
                            <span className="font-medium">+{trade.pointsEarned.toLocaleString()}</span>
                          )}
                          {trade.pointsUsed > 0 && trade.pointsEarned > 0 && <span className="mx-1">/</span>}
                          {trade.pointsUsed > 0 && (
                            <span className="text-olive-600">-{trade.pointsUsed.toLocaleString()}</span>
                          )}
                          {trade.pointsEarned === 0 && trade.pointsUsed === 0 && <span className="text-brown-300">-</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {trade.newBook ? (
                          <span
                            className={`text-lg font-bold ${
                              trade.direction === 'additional' ? 'text-amber-600' : 'text-olive-600'
                            }`}
                          >
                            {formatCurrency(trade.priceDifference)}
                          </span>
                        ) : trade.oldBookValue > 0 ? (
                          <span className="text-sm text-olive-600">
                            回收{formatCurrency(trade.oldBookValue)}
                          </span>
                        ) : (
                          <span className="text-xs text-brown-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
          <button onClick={resetForm} className="btn btn-secondary px-8 py-3">
            重置
          </button>
          <button
            onClick={handleConfirmTrade}
            disabled={
              !oldBookInfo ||
              (tradeMode === 'value_only' && actualValue <= 0) ||
              (tradeMode === 'points_only' && actualPoints <= 0) ||
              (tradeMode === 'mixed' && actualValue <= 0 && actualPoints <= 0)
            }
            className="btn btn-success px-8 py-3 text-base"
          >
            {!selectedNewBook && tradeMode === 'value_only' && actualValue > 0
              ? '确认现金回收'
              : !selectedNewBook && tradeMode === 'points_only'
              ? '确认回收获积分'
              : !selectedNewBook && tradeMode === 'mixed'
              ? '确认混合回收'
              : selectedNewBook
              ? '确认换购'
              : '确认操作'}
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
