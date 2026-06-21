import { useState } from 'react';
import { Scan, BookPlus, Check, Info, Camera, Bell, Users, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { ConditionBadge } from '@/components/ConditionBadge';
import { ConditionPhotoUploader } from '@/components/ConditionPhotoUploader';
import { Modal } from '@/components/Modal';
import { useBookStore } from '@/store/useBookStore';
import { useBookRequestStore } from '@/store/useBookRequestStore';
import { lookupIsbn, validateIsbn } from '@/utils/isbn';
import { calculateSalePrice, conditionLabels, scarcityLabels } from '@/utils/pricing';
import { formatCurrency } from '@/utils/format';
import type { BookCondition, ScarcityLevel, BookFormData, IsbnLookupResult, BookRequest } from '@/types';

type InputMode = 'scan' | 'manual';

export function StockInPage() {
  const [mode, setMode] = useState<InputMode>('scan');
  const [isbn, setIsbn] = useState('');
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<IsbnLookupResult | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [matchedRequests, setMatchedRequests] = useState<BookRequest[]>([]);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);

  const [formData, setFormData] = useState<BookFormData>({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    publishDate: '',
    coverImage: '',
    description: '',
    condition: 'good',
    purchasePrice: 0,
    scarcityLevel: 'common',
    location: '',
    notes: '',
    conditionPhotos: [],
  });

  const addBook = useBookStore((state) => state.addBook);
  const { matchBookToRequests, createSmsNotification, markNotificationSent } = useBookRequestStore();

  const handleIsbnSearch = async () => {
    if (!validateIsbn(isbn)) {
      setLookupError('请输入有效的ISBN号（10位或13位数字）');
      return;
    }

    setLookupError('');
    setIsLookupLoading(true);
    setLookupResult(null);

    try {
      const result = await lookupIsbn(isbn);
      if (result) {
        setLookupResult(result);
        setFormData((prev) => ({
          ...prev,
          isbn: result.isbn,
          title: result.title,
          author: result.author,
          publisher: result.publisher,
          publishDate: result.publishDate,
          coverImage: result.coverImage,
          description: result.description,
        }));
      } else {
        setLookupError('未找到该ISBN对应的书籍信息，请手动录入');
      }
    } catch {
      setLookupError('查询失败，请稍后重试');
    } finally {
      setIsLookupLoading(false);
    }
  };

  const handleInputChange = (field: keyof BookFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.isbn) {
      return;
    }

    const newBook = addBook(formData);
    const matched = matchBookToRequests(newBook);

    if (matched.length > 0) {
      setMatchedRequests(matched);
      setIsMatchModalOpen(true);
      setSuccessMessage(
        `"${newBook.title}" 入库成功！发现 ${matched.length} 条匹配的缺书登记，建议售价：${formatCurrency(newBook.salePrice)}`
      );

      matched.forEach((req) => {
        const notification = createSmsNotification(req, newBook);
        markNotificationSent(notification.id);
      });
    } else {
      setSuccessMessage(`"${newBook.title}" 入库成功！建议售价：${formatCurrency(newBook.salePrice)}`);
    }

    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);

    resetForm();
  };

  const resetForm = () => {
    setIsbn('');
    setLookupResult(null);
    setLookupError('');
    setFormData({
      isbn: '',
      title: '',
      author: '',
      publisher: '',
      publishDate: '',
      coverImage: '',
      description: '',
      condition: 'good',
      purchasePrice: 0,
      scarcityLevel: 'common',
      location: '',
      notes: '',
      conditionPhotos: [],
    });
  };

  const suggestedPrice = formData.purchasePrice > 0
    ? calculateSalePrice(formData.purchasePrice, formData.condition, formData.scarcityLevel)
    : 0;

  return (
    <div>
      <PageHeader
        title="旧书入库"
        description="录入新到的旧书，支持ISBN扫码快速录入和手动录入"
      />

      {successMessage && (
        <div className="mb-6 p-4 bg-olive-50 border border-olive-200 rounded-xl flex items-center gap-3 text-olive-700">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('scan')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
            mode === 'scan'
              ? 'bg-brown-600 text-white shadow-soft'
              : 'bg-white text-brown-600 border border-brown-200 hover:bg-brown-50'
          }`}
        >
          <Scan className="w-4 h-4" />
          ISBN扫码录入
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
            mode === 'manual'
              ? 'bg-brown-600 text-white shadow-soft'
              : 'bg-white text-brown-600 border border-brown-200 hover:bg-brown-50'
          }`}
        >
          <BookPlus className="w-4 h-4" />
          手动录入
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-6">
            {mode === 'scan' && (
              <div className="mb-6">
                <label className="input-label text-base">ISBN 扫码</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleIsbnSearch()}
                      placeholder="扫描或输入ISBN号，按回车查询..."
                      className="input text-lg py-3 pl-12"
                      autoFocus
                    />
                    <Scan className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-400" />
                  </div>
                  <button
                    onClick={handleIsbnSearch}
                    disabled={isLookupLoading}
                    className="btn btn-primary px-6"
                  >
                    {isLookupLoading ? '查询中...' : '查询'}
                  </button>
                </div>
                {lookupError && (
                  <p className="mt-2 text-sm text-red-500">{lookupError}</p>
                )}
                <p className="mt-2 text-xs text-brown-400">
                  提示：可测试ISBN：9787020002207、9787544270878、9787532754688
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="input-label">ISBN</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => handleInputChange('isbn', e.target.value)}
                    className="input"
                    placeholder="请输入ISBN"
                  />
                </div>
                <div>
                  <label className="input-label">书名 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="input"
                    placeholder="请输入书名"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">作者</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    className="input"
                    placeholder="请输入作者"
                  />
                </div>
                <div>
                  <label className="input-label">出版社</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => handleInputChange('publisher', e.target.value)}
                    className="input"
                    placeholder="请输入出版社"
                  />
                </div>
                <div>
                  <label className="input-label">出版日期</label>
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => handleInputChange('publishDate', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="input-label">封面图片URL</label>
                  <input
                    type="text"
                    value={formData.coverImage}
                    onChange={(e) => handleInputChange('coverImage', e.target.value)}
                    className="input"
                    placeholder="封面图片链接"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="input-label">品相分级 *</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => handleInputChange('condition', e.target.value as BookCondition)}
                    className="input"
                  >
                    {Object.entries(conditionLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">稀缺程度</label>
                  <select
                    value={formData.scarcityLevel}
                    onChange={(e) => handleInputChange('scarcityLevel', e.target.value as ScarcityLevel)}
                    className="input"
                  >
                    {Object.entries(scarcityLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">回收价 (元) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice || ''}
                    onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
                    className="input"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="input-label">货架位置</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="input"
                    placeholder="如：A区-03架"
                  />
                </div>
                <div>
                  <label className="input-label">备注</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="input"
                    placeholder="其他说明"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="input-label">书籍简介</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="input min-h-24 resize-none"
                  placeholder="书籍内容简介..."
                />
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-5 h-5 text-brown-600" />
                  <label className="input-label text-base mb-0">品相拍照留档</label>
                  <span className="text-xs text-brown-400">拍摄封面、书脊、内页及瑕疵照片，用于线上展示</span>
                </div>
                <ConditionPhotoUploader
                  photos={formData.conditionPhotos}
                  onChange={(photos) => setFormData((prev) => ({ ...prev, conditionPhotos: photos }))}
                />
              </div>

              {formData.purchasePrice > 0 && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-700 mb-2">
                    <Info className="w-5 h-5" />
                    <span className="font-medium">智能定价建议</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-sm text-amber-600">回收价</span>
                      <p className="text-lg font-bold text-amber-800">
                        {formatCurrency(formData.purchasePrice)}
                      </p>
                    </div>
                    <div className="text-2xl text-amber-400">×</div>
                    <div>
                      <span className="text-sm text-amber-600">品相系数</span>
                      <p className="text-lg font-bold text-amber-800">
                        {(() => {
                          const factors: Record<BookCondition, number> = {
                            new: 2.5,
                            like_new: 2.0,
                            good: 1.6,
                            fair: 1.3,
                            poor: 1.0,
                          };
                          return factors[formData.condition];
                        })()}
                      </p>
                    </div>
                    <div className="text-2xl text-amber-400">×</div>
                    <div>
                      <span className="text-sm text-amber-600">稀缺系数</span>
                      <p className="text-lg font-bold text-amber-800">
                        {(() => {
                          const factors: Record<ScarcityLevel, number> = {
                            rare: 1.5,
                            uncommon: 1.3,
                            common: 1.0,
                            abundant: 0.8,
                          };
                          return factors[formData.scarcityLevel];
                        })()}
                      </p>
                    </div>
                    <div className="text-2xl text-amber-400">=</div>
                    <div>
                      <span className="text-sm text-amber-600">建议售价</span>
                      <p className="text-2xl font-bold text-amber-600">
                        {formatCurrency(suggestedPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1 py-3 text-base">
                  确认入库
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary px-6 py-3"
                >
                  重置
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-6">
            <h3 className="font-serif font-semibold text-lg text-brown-800 mb-4">书籍预览</h3>

            {lookupResult || formData.title ? (
              <div>
                <div className="aspect-[3/4] bg-brown-50 rounded-lg overflow-hidden mb-4">
                  <img
                    src={formData.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop'}
                    alt={formData.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h4 className="font-serif font-semibold text-brown-800 text-lg mb-1">
                  {formData.title || '未知书名'}
                </h4>
                <p className="text-sm text-brown-500 mb-3">
                  {formData.author || '未知作者'}
                </p>

                <div className="flex items-center gap-2 mb-3">
                  <ConditionBadge condition={formData.condition} />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-brown-500">出版社</span>
                    <span className="text-brown-700">{formData.publisher || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brown-500">ISBN</span>
                    <span className="text-brown-700">{formData.isbn || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brown-500">稀缺度</span>
                    <span className="text-brown-700">{scarcityLabels[formData.scarcityLevel]}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-brown-100">
                  <div className="flex justify-between items-center">
                    <span className="text-brown-500">建议售价</span>
                    <span className="text-2xl font-bold text-amber-600">
                      {formatCurrency(suggestedPrice)}
                    </span>
                  </div>
                </div>

                {formData.conditionPhotos.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-brown-100">
                    <p className="text-sm font-medium text-brown-700 mb-2">
                      品相照片 ({formData.conditionPhotos.length})
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {formData.conditionPhotos.slice(0, 8).map((photo) => (
                        <div key={photo.id} className="aspect-square rounded overflow-hidden bg-brown-100">
                          <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-brown-400">
                <BookPlus className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>输入书籍信息后</p>
                <p>这里会显示预览</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        title="发现匹配的缺书登记"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-4 bg-olive-50 border border-olive-200 rounded-xl flex items-start gap-3">
            <Bell className="w-5 h-5 text-olive-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-olive-700">
                已自动匹配 {matchedRequests.length} 条缺书登记并发送短信通知
              </p>
              <p className="text-sm text-olive-600 mt-1">
                系统已向以下顾客发送到货提醒短信
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {matchedRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 bg-brown-50 rounded-xl border border-brown-100"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-brown-500" />
                      <span className="font-medium text-brown-800">{req.customerName}</span>
                    </div>
                    <p className="text-sm text-brown-600">
                      电话：{req.customerPhone}
                    </p>
                    <p className="text-sm text-brown-500 mt-1">
                      书籍：《{req.title}》{req.author ? ` - ${req.author}` : ''}
                    </p>
                    {req.maxPrice !== undefined && (
                      <p className="text-sm text-amber-600 mt-1">
                        最高接受价：{formatCurrency(req.maxPrice)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-olive-100 text-olive-700 rounded-full text-xs font-medium">
                    <Check className="w-3.5 h-3.5" />
                    已发送
                  </div>
                </div>
                {req.notes && (
                  <div className="mt-3 pt-3 border-t border-brown-200">
                    <p className="text-xs text-brown-500">顾客备注：{req.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setIsMatchModalOpen(false)}
              className="w-full btn btn-primary"
            >
              <X className="w-4 h-4 mr-2" />
              关闭
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
