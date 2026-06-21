import { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Tag,
  Info,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { SearchBar } from '@/components/SearchBar';
import { ConditionBadge } from '@/components/ConditionBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { useBookStore } from '@/store/useBookStore';
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/format';
import { conditionLabels, scarcityLabels } from '@/utils/pricing';
import type { Book, BookCondition, BookStatus } from '@/types';

type ViewMode = 'grid' | 'list';

export function InventoryPage() {
  const { books, updateBook, deleteBook, updateStatus } = useBookStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Book>>({});

  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'title'>('date');

  const filteredBooks = books
    .filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.isbn.includes(searchQuery) ||
        book.publisher.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCondition = filterCondition === 'all' || book.condition === filterCondition;
      const matchesStatus = filterStatus === 'all' || book.status === filterStatus;

      return matchesSearch && matchesCondition && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'price') {
        return b.salePrice - a.salePrice;
      } else {
        return a.title.localeCompare(b.title, 'zh');
      }
    });

  const handleViewDetail = (book: Book) => {
    setSelectedBook(book);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setEditForm({ ...book });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (selectedBook && editForm) {
      updateBook(selectedBook.id, editForm);
      setIsEditModalOpen(false);
      setSelectedBook(null);
    }
  };

  const handleDelete = (book: Book) => {
    if (confirm(`确定要删除《${book.title}》吗？`)) {
      deleteBook(book.id);
      setIsDetailModalOpen(false);
    }
  };

  const stats = {
    total: books.length,
    onSale: books.filter((b) => b.status === 'on_sale').length,
    pending: books.filter((b) => b.status === 'pending').length,
    sold: books.filter((b) => b.status === 'sold').length,
    totalValue: books.reduce((sum, b) => sum + b.salePrice, 0),
  };

  return (
    <div>
      <PageHeader
        title="库存管理"
        description="管理所有库存书籍，支持筛选、搜索和详情查看"
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-brown-500 mb-1">全部书籍</p>
          <p className="text-2xl font-bold text-brown-800">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-olive-600 mb-1">在售</p>
          <p className="text-2xl font-bold text-olive-600">{stats.onSale}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-amber-600 mb-1">待定价</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 mb-1">已售出</p>
          <p className="text-2xl font-bold text-gray-500">{stats.sold}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-brown-500 mb-1">库存总价值</p>
          <p className="text-2xl font-bold text-amber-600">
            {formatCurrency(stats.totalValue)}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="搜索书名、作者、ISBN、出版社..."
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="input w-auto"
          >
            <option value="all">全部品相</option>
            {Object.entries(conditionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input w-auto"
          >
            <option value="all">全部状态</option>
            <option value="on_sale">在售</option>
            <option value="pending">待定价</option>
            <option value="sold">已售出</option>
            <option value="off_shelf">已下架</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="input w-auto"
          >
            <option value="date">按入库时间</option>
            <option value="price">按价格</option>
            <option value="title">按书名</option>
          </select>

          <div className="flex rounded-lg border border-brown-200 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${
                viewMode === 'grid'
                  ? 'bg-brown-600 text-white'
                  : 'bg-white text-brown-600 hover:bg-brown-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${
                viewMode === 'list'
                  ? 'bg-brown-600 text-white'
                  : 'bg-white text-brown-600 hover:bg-brown-50'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="card card-hover cursor-pointer overflow-hidden group"
              onClick={() => handleViewDetail(book)}
            >
              <div className="relative aspect-[3/4] bg-brown-50 overflow-hidden">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-2 left-2">
                  <StatusBadge status={book.status} size="sm" />
                </div>
                <div className="absolute bottom-2 right-2">
                  <ConditionBadge condition={book.condition} size="sm" />
                </div>
                <div className="absolute inset-0 bg-brown-900/0 group-hover:bg-brown-900/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button className="px-3 py-1.5 bg-white text-brown-700 rounded-lg text-sm font-medium hover:bg-brown-50 transition-colors">
                    查看详情
                  </button>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-brown-800 text-sm line-clamp-2 mb-1">
                  {book.title}
                </h3>
                <p className="text-xs text-brown-500 truncate mb-2">{book.author}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-amber-600">
                    {formatCurrency(book.salePrice)}
                  </span>
                  <span className="text-xs text-brown-400">
                    {formatRelativeTime(book.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brown-50 border-b border-brown-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    书籍
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    作者
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    ISBN
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    品相
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    售价
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    入库时间
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown-100">
                {filteredBooks.map((book) => (
                  <tr
                    key={book.id}
                    className="hover:bg-brown-50/50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetail(book)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded shadow-soft"
                        />
                        <span className="font-medium text-brown-800 line-clamp-1 max-w-48">
                          {book.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-brown-600">{book.author}</td>
                    <td className="px-4 py-3 text-sm font-mono text-brown-500">{book.isbn}</td>
                    <td className="px-4 py-3">
                      <ConditionBadge condition={book.condition} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-lg font-bold text-amber-600">
                        {formatCurrency(book.salePrice)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={book.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-sm text-brown-500">
                      {formatDate(book.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleViewDetail(book)}
                          className="p-1.5 text-brown-500 hover:text-brown-700 hover:bg-brown-100 rounded transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(book)}
                          className="p-1.5 text-brown-500 hover:text-brown-700 hover:bg-brown-100 rounded transition-colors"
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredBooks.length === 0 && (
        <div className="py-16 text-center">
          <Search className="w-16 h-16 mx-auto mb-4 text-brown-300" />
          <p className="text-brown-500 mb-2">没有找到符合条件的书籍</p>
          <p className="text-sm text-brown-400">尝试调整筛选条件或搜索关键词</p>
        </div>
      )}

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="书籍详情"
        size="lg"
      >
        {selectedBook && (
          <div className="flex gap-6">
            <div className="w-40 flex-shrink-0">
              <img
                src={selectedBook.coverImage}
                alt={selectedBook.title}
                className="w-full shadow-card rounded-xl"
              />
              <div className="mt-4 space-y-2">
                <ConditionBadge condition={selectedBook.condition} />
                <StatusBadge status={selectedBook.status} />
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
                  <p className="text-sm text-brown-500 mb-1">出版日期</p>
                  <p className="text-brown-700">
                    {selectedBook.publishDate || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-brown-500 mb-1">ISBN</p>
                  <p className="text-brown-700 font-mono text-sm">
                    {selectedBook.isbn}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-brown-500 mb-1">稀缺度</p>
                  <p className="text-brown-700">
                    {scarcityLabels[selectedBook.scarcityLevel]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-brown-500 mb-1">货架位置</p>
                  <p className="text-brown-700 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedBook.location || '未设置'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-brown-500 mb-1">入库时间</p>
                  <p className="text-brown-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedBook.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex gap-6 mb-6 p-4 bg-brown-50 rounded-xl">
                <div>
                  <p className="text-sm text-brown-500 mb-1">回收价</p>
                  <p className="text-xl font-bold text-brown-600">
                    {formatCurrency(selectedBook.purchasePrice)}
                  </p>
                </div>
                <div className="text-2xl text-brown-300 self-center">→</div>
                <div>
                  <p className="text-sm text-amber-600 mb-1">售价</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {formatCurrency(selectedBook.salePrice)}
                  </p>
                </div>
                <div className="text-2xl text-brown-300 self-center">=</div>
                <div>
                  <p className="text-sm text-olive-600 mb-1">毛利</p>
                  <p className="text-xl font-bold text-olive-600">
                    {formatCurrency(selectedBook.salePrice - selectedBook.purchasePrice)}
                  </p>
                </div>
              </div>

              {selectedBook.description && (
                <div className="mb-6">
                  <p className="text-sm text-brown-500 mb-2 flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    书籍简介
                  </p>
                  <p className="text-sm text-brown-600 leading-relaxed">
                    {selectedBook.description}
                  </p>
                </div>
              )}

              {selectedBook.notes && (
                <div className="mb-6">
                  <p className="text-sm text-brown-500 mb-2 flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    备注
                  </p>
                  <p className="text-sm text-brown-600">{selectedBook.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(selectedBook)}
                  className="flex-1 btn btn-primary"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  编辑
                </button>
                {selectedBook.status === 'on_sale' && (
                  <button
                    onClick={() => updateStatus(selectedBook.id, 'off_shelf')}
                    className="flex-1 btn btn-secondary"
                  >
                    下架
                  </button>
                )}
                {selectedBook.status === 'off_shelf' && (
                  <button
                    onClick={() => updateStatus(selectedBook.id, 'on_sale')}
                    className="flex-1 btn btn-success"
                  >
                    重新上架
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedBook)}
                  className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="编辑书籍信息"
        size="lg"
      >
        {selectedBook && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">书名</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="input-label">作者</label>
                <input
                  type="text"
                  value={editForm.author || ''}
                  onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="input-label">出版社</label>
                <input
                  type="text"
                  value={editForm.publisher || ''}
                  onChange={(e) => setEditForm({ ...editForm, publisher: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="input-label">ISBN</label>
                <input
                  type="text"
                  value={editForm.isbn || ''}
                  onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="input-label">品相</label>
                <select
                  value={editForm.condition || 'good'}
                  onChange={(e) =>
                    setEditForm({ ...editForm, condition: e.target.value as BookCondition })
                  }
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
                <label className="input-label">状态</label>
                <select
                  value={editForm.status || 'pending'}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value as BookStatus })
                  }
                  className="input"
                >
                  <option value="pending">待定价</option>
                  <option value="on_sale">在售</option>
                  <option value="off_shelf">已下架</option>
                  <option value="sold">已售出</option>
                </select>
              </div>
              <div>
                <label className="input-label">售价 (元)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.salePrice || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, salePrice: parseFloat(e.target.value) || 0 })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="input-label">货架位置</label>
                <input
                  type="text"
                  value={editForm.location || ''}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="input"
                  placeholder="如：A区-03架"
                />
              </div>
            </div>

            <div>
              <label className="input-label">封面图片URL</label>
              <input
                type="text"
                value={editForm.coverImage || ''}
                onChange={(e) => setEditForm({ ...editForm, coverImage: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="input-label">备注</label>
              <textarea
                value={editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="input resize-none min-h-20"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 btn btn-secondary"
              >
                取消
              </button>
              <button onClick={handleSaveEdit} className="flex-1 btn btn-primary">
                保存修改
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
