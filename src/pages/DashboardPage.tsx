import { useEffect, useState } from 'react';
import {
  BookOpen,
  ShoppingCart,
  TrendingUp,
  PackagePlus,
  RefreshCw,
  Tag,
  Receipt,
  Clock,
  ArrowRight,
  BookMarked,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useBookStore } from '@/store/useBookStore';
import { useSaleStore } from '@/store/useSaleStore';
import { formatCurrency, formatRelativeTime } from '@/utils/format';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const navigate = useNavigate();
  const { books, getOnSaleBooks, getPendingBooks } = useBookStore();
  const { sales, getTodayRevenue, getMonthRevenue, tradeIns } = useSaleStore();

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const stats = {
    totalBooks: books.length,
    onSaleBooks: getOnSaleBooks().length,
    pendingBooks: getPendingBooks().length,
    todayRevenue: getTodayRevenue(),
    monthRevenue: getMonthRevenue(),
    totalSales: sales.length,
  };

  const recentBooks = [...books]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentSales = [...sales]
    .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
    .slice(0, 5);

  const quickActions = [
    {
      label: '旧书入库',
      icon: PackagePlus,
      path: '/stock-in',
      color: 'from-olive-500 to-olive-600',
      bgLight: 'bg-olive-50',
      textColor: 'text-olive-600',
    },
    {
      label: '定价上架',
      icon: Tag,
      path: '/pricing',
      color: 'from-amber-500 to-amber-600',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      badge: stats.pendingBooks > 0 ? `${stats.pendingBooks} 本待定价` : null,
    },
    {
      label: '销售出库',
      icon: ShoppingCart,
      path: '/sales',
      color: 'from-brown-500 to-brown-600',
      bgLight: 'bg-brown-50',
      textColor: 'text-brown-600',
    },
    {
      label: '以旧换新',
      icon: RefreshCw,
      path: '/trade-in',
      color: 'from-olive-600 to-olive-700',
      bgLight: 'bg-olive-50',
      textColor: 'text-olive-700',
    },
  ];

  const statCards = [
    {
      label: '库存总量',
      value: stats.totalBooks,
      unit: '本',
      icon: BookOpen,
      color: 'text-brown-600',
      bgColor: 'bg-brown-50',
    },
    {
      label: '在售书籍',
      value: stats.onSaleBooks,
      unit: '本',
      icon: BookMarked,
      color: 'text-olive-600',
      bgColor: 'bg-olive-50',
    },
    {
      label: '今日营收',
      value: formatCurrency(stats.todayRevenue),
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: '本月营收',
      value: formatCurrency(stats.monthRevenue),
      icon: Receipt,
      color: 'text-olive-700',
      bgColor: 'bg-olive-50',
    },
  ];

  return (
    <div>
      <PageHeader
        title="仪表盘"
        description="欢迎使用旧书店管理系统，查看今日经营概览"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`card p-5 transition-all duration-500 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-brown-500 mb-2">{card.label}</p>
                  <p className={`text-3xl font-bold ${card.color}`}>
                    {card.value}
                    {card.unit && (
                      <span className="text-base font-normal text-brown-400 ml-1">
                        {card.unit}
                      </span>
                    )}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-8">
        <h2 className="font-serif text-xl font-bold text-brown-800 mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`card card-hover p-6 text-left group transition-all duration-500 ${
                  isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${(index + 4) * 100}ms` }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-soft`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-serif font-semibold text-lg text-brown-800 mb-1">
                  {action.label}
                </h3>
                {action.badge ? (
                  <span className={`text-sm ${action.textColor}`}>{action.badge}</span>
                ) : (
                  <span className="text-sm text-brown-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    点击进入 <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className={`card p-6 transition-all duration-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '800ms' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-brown-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brown-500" />
              最近入库
            </h2>
            <button
              onClick={() => navigate('/inventory')}
              className="text-sm text-brown-500 hover:text-brown-700 flex items-center gap-1"
            >
              查看全部 <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {recentBooks.map((book, index) => (
              <div
                key={book.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-brown-50 transition-colors cursor-pointer"
                onClick={() => navigate('/inventory')}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-10 h-14 object-cover rounded shadow-soft"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brown-800 text-sm truncate">
                    {book.title}
                  </p>
                  <p className="text-xs text-brown-500 truncate">{book.author}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-600">
                    {formatCurrency(book.salePrice)}
                  </p>
                  <p className="text-xs text-brown-400">
                    {formatRelativeTime(book.createdAt)}
                  </p>
                </div>
              </div>
            ))}

            {recentBooks.length === 0 && (
              <div className="py-8 text-center text-brown-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无入库记录</p>
              </div>
            )}
          </div>
        </div>

        <div
          className={`card p-6 transition-all duration-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '900ms' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-brown-800 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-olive-500" />
              最近销售
            </h2>
            <button
              onClick={() => navigate('/sales')}
              className="text-sm text-brown-500 hover:text-brown-700 flex items-center gap-1"
            >
              查看全部 <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {recentSales.map((sale, index) => (
              <div
                key={sale.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-brown-50 transition-colors cursor-pointer"
                onClick={() => navigate('/sales')}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-olive-100 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-olive-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brown-800 text-sm">
                    {sale.items.length} 本书籍
                  </p>
                  <p className="text-xs text-brown-500 truncate">
                    {sale.items.map((i) => i.bookTitle).join('、')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-olive-600">
                    +{formatCurrency(sale.actualAmount)}
                  </p>
                  <p className="text-xs text-brown-400">
                    {formatRelativeTime(sale.saleDate)}
                  </p>
                </div>
              </div>
            ))}

            {recentSales.length === 0 && (
              <div className="py-8 text-center text-brown-400">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无销售记录</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`mt-6 transition-all duration-500 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ transitionDelay: '1000ms' }}
      >
        <div className="card p-6">
          <h2 className="font-serif text-lg font-bold text-brown-800 mb-4">待办事项</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-4 rounded-xl border-2 border-dashed ${
                stats.pendingBooks > 0
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-brown-200 bg-brown-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Tag
                  className={`w-6 h-6 ${
                    stats.pendingBooks > 0 ? 'text-amber-500' : 'text-brown-400'
                  }`}
                />
                <div>
                  <p className="font-medium text-brown-800">待定价书籍</p>
                  <p
                    className={`text-2xl font-bold ${
                      stats.pendingBooks > 0 ? 'text-amber-600' : 'text-brown-400'
                    }`}
                  >
                    {stats.pendingBooks} 本
                  </p>
                </div>
              </div>
              {stats.pendingBooks > 0 && (
                <button
                  onClick={() => navigate('/pricing')}
                  className="mt-3 w-full btn btn-warning text-sm py-1.5"
                >
                  去定价
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl border-2 border-dashed border-olive-200 bg-olive-50">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 text-olive-500" />
                <div>
                  <p className="font-medium text-brown-800">换购记录</p>
                  <p className="text-2xl font-bold text-olive-600">{tradeIns.length} 笔</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/trade-in')}
                className="mt-3 w-full btn btn-success text-sm py-1.5"
              >
                查看记录
              </button>
            </div>

            <div className="p-4 rounded-xl border-2 border-dashed border-brown-200 bg-brown-50">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-brown-500" />
                <div>
                  <p className="font-medium text-brown-800">总销售订单</p>
                  <p className="text-2xl font-bold text-brown-600">{sales.length} 单</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/sales')}
                className="mt-3 w-full btn btn-secondary text-sm py-1.5"
              >
                销售记录
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
