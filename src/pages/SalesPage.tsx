import { useState } from 'react';
import {
  ShoppingCart,
  Scan,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Wallet,
  Smartphone,
  Receipt,
  Check,
  Search,
  Camera,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { BookCard } from '@/components/BookCard';
import { SearchBar } from '@/components/SearchBar';
import { Modal } from '@/components/Modal';
import { ConditionBadge } from '@/components/ConditionBadge';
import { ConditionPhotoGallery } from '@/components/ConditionPhotoGallery';
import { useBookStore } from '@/store/useBookStore';
import { useSaleStore } from '@/store/useSaleStore';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { PaymentMethod, Book } from '@/types';

type TabType = 'checkout' | 'history';

export function SalesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('checkout');
  const [searchQuery, setSearchQuery] = useState('');
  const [isbnInput, setIsbnInput] = useState('');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const { books, getBookByIsbn } = useBookStore();
  const { cart, addToCart, removeFromCart, updateCartQuantity, clearCart, getCartTotal, checkout, sales } =
    useSaleStore();

  const onSaleBooks = books.filter((b) => b.status === 'on_sale');
  const filteredBooks = onSaleBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.includes(searchQuery)
  );

  const cartTotal = getCartTotal();
  const actualAmount = Math.max(0, Math.round((cartTotal - discount) * 100) / 100);
  const change = Math.max(0, Math.round((receivedAmount - actualAmount) * 100) / 100);

  const handleIsbnScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isbnInput.trim()) {
      const book = getBookByIsbn(isbnInput.trim());
      if (book) {
        addToCart(book);
        setIsbnInput('');
      }
    }
  };

  const handleAddToCart = (book: Book) => {
    addToCart(book);
  };

  const handleViewDetail = (book: Book) => {
    setSelectedBook(book);
    setIsDetailModalOpen(true);
  };

  const handleCheckout = () => {
    setIsCheckoutModalOpen(true);
    setReceivedAmount(actualAmount);
  };

  const confirmCheckout = () => {
    const sale = checkout(paymentMethod, discount, '');
    setIsCheckoutModalOpen(false);
    setShowSuccess(true);
    setSuccessMessage(`销售成功！单号：${sale.id.slice(-8).toUpperCase()}，实收：${formatCurrency(sale.actualAmount)}`);
    setDiscount(0);
    setReceivedAmount(0);

    setTimeout(() => {
      setShowSuccess(false);
      setSuccessMessage('');
    }, 3000);
  };

  const paymentMethods: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
    { value: 'cash', label: '现金', icon: Banknote },
    { value: 'wechat', label: '微信', icon: Smartphone },
    { value: 'alipay', label: '支付宝', icon: Wallet },
    { value: 'card', label: '银行卡', icon: CreditCard },
  ];

  const recentSales = sales.slice(0, 10);

  return (
    <div>
      <PageHeader
        title="销售出库"
        description="扫码或搜索书籍，加入购物车后结算出库"
        actions={
          <div className="flex rounded-lg border border-brown-200 overflow-hidden">
            <button
              onClick={() => setActiveTab('checkout')}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'checkout'
                  ? 'bg-brown-600 text-white'
                  : 'bg-white text-brown-600 hover:bg-brown-50'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              收银台
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-brown-600 text-white'
                  : 'bg-white text-brown-600 hover:bg-brown-50'
              }`}
            >
              <Receipt className="w-4 h-4" />
              销售记录
            </button>
          </div>
        }
      />

      {showSuccess && (
        <div className="mb-6 p-4 bg-olive-50 border border-olive-200 rounded-xl flex items-center gap-3 text-olive-700 animate-pulse">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {activeTab === 'checkout' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card p-4 mb-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-400" />
                  <input
                    type="text"
                    value={isbnInput}
                    onChange={(e) => setIsbnInput(e.target.value)}
                    onKeyDown={handleIsbnScan}
                    placeholder="扫描ISBN条形码，按回车添加到购物车..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-brown-200 rounded-xl bg-brown-50 text-brown-800 placeholder-brown-400 focus:outline-none focus:ring-2 focus:ring-brown-500 focus:border-transparent text-lg"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="搜索在售书籍..."
              />
            </div>

            <div className="card p-4">
              <h3 className="font-serif font-semibold text-brown-800 mb-4">
                在售书籍 ({filteredBooks.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    showActions
                    onClick={() => handleViewDetail(book)}
                    onAddToCart={() => handleAddToCart(book)}
                  />
                ))}
              </div>
              {filteredBooks.length === 0 && (
                <div className="py-12 text-center text-brown-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>没有找到匹配的书籍</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card p-4 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-semibold text-lg text-brown-800 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  购物车
                </h3>
                <span className="text-sm text-brown-500">{cart.length} 件商品</span>
              </div>

              <div className="max-h-96 overflow-y-auto scrollbar-thin mb-4 space-y-2">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-brown-400">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">购物车为空</p>
                    <p className="text-xs">扫描或点击添加书籍</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 bg-brown-50 rounded-lg hover:bg-brown-100 transition-colors"
                    >
                      <img
                        src={item.coverImage}
                        alt={item.bookTitle}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brown-800 truncate">
                          {item.bookTitle}
                        </p>
                        <p className="text-xs text-brown-500">{item.bookIsbn}</p>
                        <p className="text-sm font-bold text-amber-600">
                          {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-brown-500 hover:text-brown-700 hover:bg-brown-200 rounded transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-brown-700">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-brown-500 hover:text-brown-700 hover:bg-brown-200 rounded transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-brown-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-brown-600">
                  <span>商品总计</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-brown-600">
                  <span>优惠</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={discount || ''}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-right text-sm border border-brown-200 rounded focus:outline-none focus:ring-1 focus:ring-brown-500"
                      placeholder="0"
                    />
                    <span>元</span>
                  </div>
                </div>
                <div className="flex justify-between text-lg font-bold text-brown-800 pt-2 border-t border-brown-100">
                  <span>应收金额</span>
                  <span className="text-amber-600">{formatCurrency(actualAmount)}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full btn btn-success py-3 text-base"
                >
                  结算收款
                </button>
                <button
                  onClick={() => clearCart()}
                  disabled={cart.length === 0}
                  className="w-full btn btn-secondary text-sm"
                >
                  清空购物车
                </button>
              </div>
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
                    单号
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    时间
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    商品
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    金额
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    付款方式
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    类型
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown-100">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-brown-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-brown-700">
                        {sale.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-brown-600">
                      {formatDateTime(sale.saleDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-brown-700">
                        {sale.items.length} 件
                        <span className="text-brown-400 ml-2">
                          {sale.items.map((i) => i.bookTitle).join('、')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-lg font-bold text-amber-600">
                        {formatCurrency(sale.actualAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-brown-600">
                        {paymentMethods.find((m) => m.value === sale.paymentMethod)?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          sale.type === 'normal'
                            ? 'bg-brown-100 text-brown-700'
                            : 'bg-olive-100 text-olive-700'
                        }`}
                      >
                        {sale.type === 'normal' ? '正常销售' : '以旧换新'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recentSales.length === 0 && (
            <div className="py-16 text-center">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-brown-300" />
              <p className="text-brown-500">暂无销售记录</p>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title="结算收款"
        size="sm"
      >
        <div className="space-y-6">
          <div className="p-4 bg-brown-50 rounded-xl">
            <div className="flex justify-between mb-2">
              <span className="text-brown-600">商品总计</span>
              <span className="text-brown-800">{formatCurrency(cartTotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between mb-2">
                <span className="text-brown-600">优惠</span>
                <span className="text-red-500">-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-brown-200">
              <span className="text-brown-800">应收</span>
              <span className="text-amber-600">{formatCurrency(actualAmount)}</span>
            </div>
          </div>

          <div>
            <label className="input-label">付款方式</label>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                      paymentMethod === method.value
                        ? 'border-brown-500 bg-brown-50 text-brown-700'
                        : 'border-brown-200 text-brown-500 hover:border-brown-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div>
              <label className="input-label">实收金额 (元)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={receivedAmount || ''}
                onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                className="input text-xl font-bold text-olive-600"
                placeholder="0.00"
              />
              {receivedAmount > 0 && (
                <div className="mt-2 p-3 bg-olive-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-olive-600">找零</span>
                    <span className="text-lg font-bold text-olive-600">
                      {formatCurrency(change)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsCheckoutModalOpen(false)}
              className="flex-1 btn btn-secondary"
            >
              取消
            </button>
            <button
              onClick={confirmCheckout}
              className="flex-1 btn btn-success"
              disabled={cart.length === 0}
            >
              确认收款
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="书籍详情"
        size="lg"
      >
        {selectedBook && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-48 flex-shrink-0">
              <img
                src={selectedBook.coverImage}
                alt={selectedBook.title}
                className="w-full shadow-card rounded-xl"
              />
              <div className="mt-4 space-y-2">
                <ConditionBadge condition={selectedBook.condition} />
              </div>
            </div>

            <div className="flex-1">
              <h2 className="font-serif text-2xl font-bold text-brown-800 mb-1">
                {selectedBook.title}
              </h2>
              <p className="text-brown-600 mb-4">{selectedBook.author}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-brown-500 mb-1">出版社</p>
                  <p className="text-brown-700">{selectedBook.publisher || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-brown-500 mb-1">ISBN</p>
                  <p className="text-brown-700 font-mono text-sm">
                    {selectedBook.isbn}
                  </p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-amber-50 rounded-xl">
                <p className="text-sm text-amber-600 mb-1">售价</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(selectedBook.salePrice)}
                </p>
              </div>

              {selectedBook.description && (
                <div className="mb-6">
                  <p className="text-sm text-brown-500 mb-2">书籍简介</p>
                  <p className="text-sm text-brown-600 leading-relaxed">
                    {selectedBook.description}
                  </p>
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm text-brown-500 mb-3 flex items-center gap-1">
                  <Camera className="w-4 h-4" />
                  品相实拍照片
                  {selectedBook.conditionPhotos?.length > 0 && (
                    <span className="ml-2 text-xs bg-olive-100 text-olive-700 px-2 py-0.5 rounded-full">
                      {selectedBook.conditionPhotos?.length} 张
                    </span>
                  )}
                </p>
                <ConditionPhotoGallery photos={selectedBook.conditionPhotos || []} />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="flex-1 btn btn-secondary"
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    handleAddToCart(selectedBook);
                    setIsDetailModalOpen(false);
                  }}
                  className="flex-1 btn btn-primary"
                >
                  加入购物车
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
