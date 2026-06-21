import { useState } from 'react';
import {
  Plus,
  Phone,
  User,
  Calendar,
  Edit,
  Trash2,
  BookOpen,
  Tag,
  Bell,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  MessageSquare,
  Eye,
  X,
  Send,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { SearchBar } from '@/components/SearchBar';
import { Modal } from '@/components/Modal';
import { useBookRequestStore, type BookRequestFormData } from '@/store/useBookRequestStore';
import { useBookStore } from '@/store/useBookStore';
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/format';
import type { BookRequest, BookRequestStatus, SmsNotification } from '@/types';

type TabType = 'requests' | 'notifications';
type FilterStatus = 'all' | BookRequestStatus;

const statusLabels: Record<BookRequestStatus, string> = {
  pending: '待到货',
  matched: '已匹配',
  notified: '已通知',
  completed: '已完成',
  cancelled: '已取消',
};

const statusColors: Record<BookRequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  matched: 'bg-blue-100 text-blue-700',
  notified: 'bg-olive-100 text-olive-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function WishlistPage() {
  const {
    bookRequests,
    smsNotifications,
    addBookRequest,
    updateBookRequest,
    updateRequestStatus,
    deleteBookRequest,
    createSmsNotification,
    markNotificationSent,
    markNotificationRead,
    matchBookToRequests,
  } = useBookRequestStore();

  const { books } = useBookStore();

  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BookRequest | null>(null);
  const [formData, setFormData] = useState<BookRequestFormData>({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    customerName: '',
    customerPhone: '',
    maxPrice: undefined,
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      isbn: '',
      title: '',
      author: '',
      publisher: '',
      customerName: '',
      customerPhone: '',
      maxPrice: undefined,
      notes: '',
    });
  };

  const handleAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleEdit = (request: BookRequest) => {
    setSelectedRequest(request);
    setFormData({
      isbn: request.isbn,
      title: request.title,
      author: request.author,
      publisher: request.publisher,
      customerName: request.customerName,
      customerPhone: request.customerPhone,
      maxPrice: request.maxPrice,
      notes: request.notes,
    });
    setIsEditModalOpen(true);
  };

  const handleViewDetail = (request: BookRequest) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  const handleNotify = (request: BookRequest) => {
    setSelectedRequest(request);
    setIsNotifyModalOpen(true);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.customerName || !formData.customerPhone) return;

    const newRequest = addBookRequest(formData);
    const matchedBooks = books.filter((b) => matchBookToRequests(b).some((r) => r.id === newRequest.id));
    if (matchedBooks.length > 0) {
      alert('该书籍已有库存！');
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleSubmitEdit = () => {
    if (!selectedRequest) return;
    updateBookRequest(selectedRequest.id, formData);
    setIsEditModalOpen(false);
    setSelectedRequest(null);
    resetForm();
  };

  const handleDelete = (request: BookRequest) => {
    if (confirm(`确定要删除《${request.title}》的缺书登记吗？`)) {
      deleteBookRequest(request.id);
      setIsDetailModalOpen(false);
    }
  };

  const handleSendNotification = () => {
    if (!selectedRequest) return;

    const matchedBook = books.find(
      (b) =>
        (selectedRequest.isbn && b.isbn === selectedRequest.isbn) ||
        b.title === selectedRequest.title
    );

    const bookForNotification = matchedBook || {
      id: 'virtual',
      isbn: selectedRequest.isbn,
      title: selectedRequest.title,
      author: selectedRequest.author,
      publisher: selectedRequest.publisher,
      publishDate: '',
      coverImage: '',
      description: '',
      condition: 'good' as const,
      purchasePrice: 0,
      salePrice: selectedRequest.maxPrice || 0,
      scarcityFactor: 1,
      scarcityLevel: 'common' as const,
      status: 'on_sale' as const,
      location: '',
      notes: '',
      conditionPhotos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const notification = createSmsNotification(selectedRequest, bookForNotification);
    markNotificationSent(notification.id);

    alert(
      `已向 ${selectedRequest.customerName} (${selectedRequest.customerPhone}) 发送短信通知！\n\n短信内容：\n${notification.message}`
    );

    setIsNotifyModalOpen(false);
    setSelectedRequest(null);
  };

  const filteredRequests = bookRequests
    .filter((req) => {
      const matchesSearch =
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.isbn.includes(searchQuery) ||
        req.customerName.includes(searchQuery) ||
        req.customerPhone.includes(searchQuery);
      const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const sortedNotifications = [...smsNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const stats = {
    total: bookRequests.length,
    pending: bookRequests.filter((r) => r.status === 'pending').length,
    notified: bookRequests.filter((r) => r.status === 'notified').length,
    completed: bookRequests.filter((r) => r.status === 'completed').length,
    unreadNotifications: smsNotifications.filter((n) => n.status !== 'read').length,
  };

  const getNotificationStatusIcon = (status: SmsNotification['status']) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-olive-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'read':
        return <CheckCircle className="w-4 h-4 text-brown-400" />;
    }
  };

  const getNotificationStatusLabel = (status: SmsNotification['status']) => {
    switch (status) {
      case 'sent':
        return '已发送';
      case 'pending':
        return '待发送';
      case 'failed':
        return '发送失败';
      case 'read':
        return '已读';
    }
  };

  return (
    <div>
      <PageHeader
        title="缺书登记与到货提醒"
        description="登记顾客需要的书籍，入库时自动匹配并通知顾客"
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-brown-500 mb-1">登记总数</p>
          <p className="text-2xl font-bold text-brown-800">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-amber-600 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> 待到货
          </p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-olive-600 mb-1 flex items-center gap-1">
            <Bell className="w-3.5 h-3.5" /> 已通知
          </p>
          <p className="text-2xl font-bold text-olive-600">{stats.notified}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> 已完成
          </p>
          <p className="text-2xl font-bold text-gray-500">{stats.completed}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-brown-500 mb-1 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> 未读通知
          </p>
          <p className="text-2xl font-bold text-amber-600">{stats.unreadNotifications}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-brown-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 font-medium transition-colors relative ${
            activeTab === 'requests' ? 'text-brown-800' : 'text-brown-500 hover:text-brown-700'
          }`}
        >
          <BookOpen className="w-4 h-4 inline-block mr-2" />
          缺书登记
          {activeTab === 'requests' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brown-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 font-medium transition-colors relative ${
            activeTab === 'notifications' ? 'text-brown-800' : 'text-brown-500 hover:text-brown-700'
          }`}
        >
          <Bell className="w-4 h-4 inline-block mr-2" />
          短信通知记录
          {stats.unreadNotifications > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full">
              {stats.unreadNotifications}
            </span>
          )}
          {activeTab === 'notifications' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brown-600" />
          )}
        </button>
      </div>

      {activeTab === 'requests' && (
        <>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="搜索书名、作者、ISBN、顾客姓名、电话..."
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="input w-auto"
              >
                <option value="all">全部状态</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button onClick={handleAdd} className="btn btn-primary px-4">
                <Plus className="w-4 h-4 mr-2" />
                新增登记
              </button>
            </div>
          </div>

          {filteredRequests.length > 0 ? (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brown-50 border-b border-brown-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">书籍信息</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">顾客信息</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">最高价格</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">状态</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">登记时间</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brown-100">
                    {filteredRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="hover:bg-brown-50/50 transition-colors cursor-pointer"
                        onClick={() => handleViewDetail(req)}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-brown-800">{req.title}</p>
                            <p className="text-sm text-brown-500">{req.author}</p>
                            {req.isbn && <p className="text-xs text-brown-400 font-mono">{req.isbn}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-brown-700">
                            <User className="w-3.5 h-3.5 text-brown-400" />
                            <span>{req.customerName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-brown-500 mt-1">
                            <Phone className="w-3.5 h-3.5 text-brown-400" />
                            <span>{req.customerPhone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {req.maxPrice !== undefined ? (
                            <span className="text-amber-600 font-medium">{formatCurrency(req.maxPrice)}</span>
                          ) : (
                            <span className="text-brown-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[req.status]}`}
                          >
                            {statusLabels[req.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-brown-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatRelativeTime(req.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleViewDetail(req)}
                              className="p-1.5 text-brown-500 hover:text-brown-700 hover:bg-brown-100 rounded transition-colors"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(req)}
                              className="p-1.5 text-brown-500 hover:text-brown-700 hover:bg-brown-100 rounded transition-colors"
                              title="编辑"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {req.status === 'pending' || req.status === 'matched' ? (
                              <button
                                onClick={() => handleNotify(req)}
                                className="p-1.5 text-olive-600 hover:text-olive-700 hover:bg-olive-100 rounded transition-colors"
                                title="发送通知"
                              >
                                <Bell className="w-4 h-4" />
                              </button>
                            ) : null}
                            {req.status === 'notified' && (
                              <button
                                onClick={() => updateRequestStatus(req.id, 'completed')}
                                className="p-1.5 text-olive-600 hover:text-olive-700 hover:bg-olive-100 rounded transition-colors"
                                title="标记完成"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(req)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card p-16 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-brown-300" />
              <p className="text-brown-500 mb-2">暂无缺书登记记录</p>
              <p className="text-sm text-brown-400">点击"新增登记"按钮开始登记</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'notifications' && (
        <>
          {sortedNotifications.length > 0 ? (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brown-50 border-b border-brown-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">书籍</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">收件人</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">短信内容</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">状态</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">发送时间</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brown-100">
                    {sortedNotifications.map((notif) => (
                      <tr
                        key={notif.id}
                        className={`transition-colors ${notif.status !== 'read' ? 'bg-amber-50/30' : 'hover:bg-brown-50/50'}`}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-brown-800">{notif.bookTitle}</p>
                            <p className="text-xs text-brown-400 font-mono">{notif.bookIsbn}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-brown-700">
                            <User className="w-3.5 h-3.5 text-brown-400" />
                            <span>{notif.customerName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-brown-500 mt-1">
                            <Phone className="w-3.5 h-3.5 text-brown-400" />
                            <span>{notif.customerPhone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-md">
                          <p className="text-sm text-brown-600 line-clamp-2">{notif.message}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {getNotificationStatusIcon(notif.status)}
                            <span className="text-sm text-brown-600">
                              {getNotificationStatusLabel(notif.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-brown-500">
                          {notif.sentAt ? formatDate(notif.sentAt) : formatDate(notif.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          {notif.status !== 'read' && (
                            <button
                              onClick={() => markNotificationRead(notif.id)}
                              className="p-1.5 text-brown-500 hover:text-brown-700 hover:bg-brown-100 rounded transition-colors"
                              title="标记已读"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card p-16 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-brown-300" />
              <p className="text-brown-500 mb-2">暂无短信通知记录</p>
              <p className="text-sm text-brown-400">入库时会自动匹配并发送通知</p>
            </div>
          )}
        </>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="新增缺书登记" size="lg">
        <form onSubmit={handleSubmitAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">ISBN</label>
              <input
                type="text"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                className="input"
                placeholder="可选，精确定位书籍"
              />
            </div>
            <div>
              <label className="input-label">书名 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="input"
                placeholder="请输入作者"
              />
            </div>
            <div>
              <label className="input-label">出版社</label>
              <input
                type="text"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                className="input"
                placeholder="请输入出版社"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">顾客姓名 *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="input pl-10"
                  placeholder="请输入顾客姓名"
                  required
                />
              </div>
            </div>
            <div>
              <label className="input-label">联系电话 *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="input pl-10"
                  placeholder="请输入手机号码"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="input-label">最高接受价格（元）</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.maxPrice ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="input pl-10"
                placeholder="可选，不填则无价格限制"
              />
            </div>
          </div>

          <div>
            <label className="input-label">备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input resize-none min-h-20"
              placeholder="其他要求或说明..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 btn btn-secondary"
            >
              取消
            </button>
            <button type="submit" className="flex-1 btn btn-primary">
              确认登记
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="编辑缺书登记" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">ISBN</label>
              <input
                type="text"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="input-label">书名 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="input-label">作者</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="input-label">出版社</label>
              <input
                type="text"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">顾客姓名 *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="input pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="input-label">联系电话 *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="input pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="input-label">最高接受价格（元）</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.maxPrice ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className="input"
            />
          </div>

          <div>
            <label className="input-label">状态</label>
            <select
              value={selectedRequest?.status || 'pending'}
              onChange={(e) =>
                selectedRequest && updateRequestStatus(selectedRequest.id, e.target.value as BookRequestStatus)
              }
              className="input"
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input resize-none min-h-20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedRequest(null);
              }}
              className="flex-1 btn btn-secondary"
            >
              取消
            </button>
            <button onClick={handleSubmitEdit} className="flex-1 btn btn-primary">
              保存修改
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="缺书登记详情"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-5">
            <div className="p-4 bg-brown-50 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-brown-800 mb-1">
                    {selectedRequest.title}
                  </h3>
                  <p className="text-brown-600">{selectedRequest.author}</p>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedRequest.status]}`}
                >
                  {statusLabels[selectedRequest.status]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-brown-500 mb-1">ISBN</p>
                <p className="text-brown-700 font-mono">{selectedRequest.isbn || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-brown-500 mb-1">出版社</p>
                <p className="text-brown-700">{selectedRequest.publisher || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-brown-500 mb-1">顾客姓名</p>
                <p className="text-brown-700 flex items-center gap-1">
                  <User className="w-4 h-4 text-brown-400" />
                  {selectedRequest.customerName}
                </p>
              </div>
              <div>
                <p className="text-sm text-brown-500 mb-1">联系电话</p>
                <p className="text-brown-700 flex items-center gap-1">
                  <Phone className="w-4 h-4 text-brown-400" />
                  {selectedRequest.customerPhone}
                </p>
              </div>
              <div>
                <p className="text-sm text-brown-500 mb-1">最高接受价格</p>
                <p className="text-amber-600 font-medium">
                  {selectedRequest.maxPrice !== undefined
                    ? formatCurrency(selectedRequest.maxPrice)
                    : '无限制'}
                </p>
              </div>
              <div>
                <p className="text-sm text-brown-500 mb-1">登记时间</p>
                <p className="text-brown-700 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-brown-400" />
                  {formatDate(selectedRequest.createdAt)}
                </p>
              </div>
            </div>

            {selectedRequest.notes && (
              <div>
                <p className="text-sm text-brown-500 mb-1 flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  备注
                </p>
                <p className="text-sm text-brown-600 bg-brown-50 p-3 rounded-lg">
                  {selectedRequest.notes}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleEdit(selectedRequest);
                }}
                className="flex-1 btn btn-primary"
              >
                <Edit className="w-4 h-4 mr-2" />
                编辑
              </button>
              {(selectedRequest.status === 'pending' || selectedRequest.status === 'matched') && (
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleNotify(selectedRequest);
                  }}
                  className="flex-1 btn btn-success"
                >
                  <Send className="w-4 h-4 mr-2" />
                  发送通知
                </button>
              )}
              {selectedRequest.status === 'notified' && (
                <button
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, 'completed');
                    setIsDetailModalOpen(false);
                  }}
                  className="flex-1 btn btn-success"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  标记完成
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedRequest)}
                className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isNotifyModalOpen}
        onClose={() => setIsNotifyModalOpen(false)}
        title="发送到货通知"
        size="md"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-2 text-amber-700 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">确认发送短信通知</span>
              </div>
              <p className="text-sm text-amber-600">
                将向 {selectedRequest.customerName} ({selectedRequest.customerPhone}) 发送《{selectedRequest.title}》到货通知。
              </p>
            </div>

            <div className="p-4 bg-brown-50 rounded-xl">
              <p className="text-sm text-brown-500 mb-2">短信预览：</p>
              <p className="text-sm text-brown-700 leading-relaxed">
                【旧书店通知】尊敬的{selectedRequest.customerName}，您登记的《{selectedRequest.title}》已到货！请尽快到店选购。
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setIsNotifyModalOpen(false);
                  setSelectedRequest(null);
                }}
                className="flex-1 btn btn-secondary"
              >
                <X className="w-4 h-4 mr-2" />
                取消
              </button>
              <button onClick={handleSendNotification} className="flex-1 btn btn-primary">
                <Send className="w-4 h-4 mr-2" />
                确认发送
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
