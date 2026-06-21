import { useState } from 'react';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Search,
  User,
  Phone,
  History,
  Plus,
  Minus,
  X,
  Eye,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { SearchBar } from '@/components/SearchBar';
import { Modal } from '@/components/Modal';
import { usePointsStore } from '@/store/usePointsStore';
import { useSystemConfigStore } from '@/store/useSystemConfigStore';
import { formatDateTime, formatCurrency } from '@/utils/format';
import { convertPointsToYuan, getPointsToYuanRate } from '@/utils/pricing';
import type { CustomerPointsAccount, PointsTransactionType } from '@/types';

const transactionTypeLabels: Record<PointsTransactionType, string> = {
  earn_trade_in: '旧书回收',
  spend_purchase: '消费抵扣',
  bonus: '奖励赠送',
  adjust: '手动调整',
  expire: '积分过期',
};

const transactionTypeColors: Record<PointsTransactionType, string> = {
  earn_trade_in: 'text-olive-600 bg-olive-100',
  spend_purchase: 'text-amber-600 bg-amber-100',
  bonus: 'text-blue-600 bg-blue-100',
  adjust: 'text-brown-600 bg-brown-100',
  expire: 'text-red-600 bg-red-100',
};

export function PointsPage() {
  const { accounts, getOrCreateAccount, adjustPoints, setSelectedAccount, selectedAccount } =
    usePointsStore();

  const pointsToYuanRate = useSystemConfigStore((s) => s.getPointsToYuanRate());
  const yuanToPointsRate = useSystemConfigStore((s) => s.getYuanToPointsRate());
  const conditionLabels = useSystemConfigStore((s) => s.getConditionLabels());
  const conditionPointsFactors = useSystemConfigStore((s) => s.getConditionPointsFactors());
  const conditionPointsList = useSystemConfigStore((s) =>
    s.config.conditions.map((c) => ({ label: c.label, factor: c.pointsFactor }))
  );

  const pointsRuleText = conditionPointsList
    .map((c) => `${c.label}×${c.factor}`)
    .join(' / ');

  const [searchQuery, setSearchQuery] = useState('');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const filteredAccounts = accounts.filter(
    (a) =>
      a.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.customerPhone.includes(searchQuery)
  );

  const totalPointsBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalPointsEarned = accounts.reduce((sum, a) => sum + a.totalEarned, 0);
  const totalPointsSpent = accounts.reduce((sum, a) => sum + a.totalSpent, 0);
  const totalAccounts = accounts.length;

  const handleViewAccount = (account: CustomerPointsAccount) => {
    setSelectedAccount(account);
    setIsAccountModalOpen(true);
  };

  const handleOpenAdjust = () => {
    setAdjustAmount(0);
    setAdjustReason('');
    setIsAdjustModalOpen(true);
  };

  const handleConfirmAdjust = () => {
    if (!selectedAccount || adjustAmount === 0) return;
    adjustPoints(selectedAccount.id, adjustAmount, adjustReason || '手动调整');
    setIsAdjustModalOpen(false);
    setSelectedAccount(
      accounts.find((a) => a.id === selectedAccount.id) || null
    );
  };

  const handleCreateAccount = () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) return;
    const account = getOrCreateAccount(newCustomerName.trim(), newCustomerPhone.trim());
    setNewCustomerName('');
    setNewCustomerPhone('');
    setIsNewAccountModalOpen(false);
    setSelectedAccount(account);
    setIsAccountModalOpen(true);
  };

  const getTransactionIcon = (type: PointsTransactionType) => {
    if (type === 'earn_trade_in' || type === 'bonus') {
      return <ArrowUpRight className="w-4 h-4" />;
    }
    return <ArrowDownRight className="w-4 h-4" />;
  };

  return (
    <div>
      <PageHeader
        title="积分中心"
        description="旧书回收累积积分，积分抵扣购书款，鼓励书籍循环流转"
        actions={
          <button
            onClick={() => setIsNewAccountModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增会员
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Coins className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm text-brown-500">总积分余额</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{totalPointsBalance.toLocaleString()}</p>
          <p className="text-xs text-brown-400 mt-1">
            约合 {formatCurrency(convertPointsToYuan(totalPointsBalance))}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-olive-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-olive-600" />
            </div>
            <p className="text-sm text-brown-500">累计获得</p>
          </div>
          <p className="text-2xl font-bold text-olive-600">{totalPointsEarned.toLocaleString()}</p>
          <p className="text-xs text-brown-400 mt-1">全部会员累计</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm text-brown-500">累计使用</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{totalPointsSpent.toLocaleString()}</p>
          <p className="text-xs text-brown-400 mt-1">
            抵扣 {formatCurrency(convertPointsToYuan(totalPointsSpent))}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-brown-100 rounded-lg">
              <User className="w-5 h-5 text-brown-600" />
            </div>
            <p className="text-sm text-brown-500">会员总数</p>
          </div>
          <p className="text-2xl font-bold text-brown-700">{totalAccounts}</p>
          <p className="text-xs text-brown-400 mt-1">注册会员人数</p>
        </div>
      </div>

      <div className="card p-4 mb-6 bg-gradient-to-r from-amber-50 to-olive-50 border-amber-200">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-serif font-semibold text-brown-800 mb-1">积分规则说明</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-brown-600">
              <p>• 旧书回收按品相累积积分：{pointsRuleText}</p>
              <p>• 每 {yuanToPointsRate} 积分可抵扣 1 元购书款</p>
              <p>• 积分可在任意书籍消费时使用，不限于旧书回收价</p>
              <p>• 鼓励书籍流转，让每本旧书都焕发新价值</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-brown-100">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="搜索会员姓名、手机号..."
          />
        </div>

        {filteredAccounts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brown-50 border-b border-brown-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">会员信息</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">积分余额</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">累计获得</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">累计使用</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">注册时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-brown-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown-100">
                {filteredAccounts.map((account) => (
                  <tr
                    key={account.id}
                    className="hover:bg-brown-50/50 transition-colors cursor-pointer"
                    onClick={() => handleViewAccount(account)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-brown-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-brown-500" />
                        </div>
                        <div>
                          <p className="font-medium text-brown-800">{account.customerName}</p>
                          <p className="text-xs text-brown-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {account.customerPhone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-lg font-bold text-amber-600">
                        {account.balance.toLocaleString()}
                      </span>
                      <span className="text-xs text-brown-400 ml-1">分</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-olive-600 font-medium">
                        +{account.totalEarned.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-amber-600 font-medium">
                        -{account.totalSpent.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-brown-500">
                      {formatDateTime(account.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewAccount(account);
                        }}
                        className="p-1.5 text-brown-500 hover:text-brown-700 hover:bg-brown-100 rounded transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-brown-300" />
            <p className="text-brown-500 mb-2">暂无会员记录</p>
            <p className="text-sm text-brown-400">点击"新增会员"注册会员，或通过旧书回收自动建档</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setSelectedAccount(null);
        }}
        title="会员积分详情"
        size="lg"
      >
        {selectedAccount && (
          <div className="space-y-5">
            <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-xl text-brown-800">
                      {selectedAccount.customerName}
                    </h3>
                    <p className="text-sm text-brown-600 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedAccount.customerPhone}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-amber-700 mb-1">当前积分</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {selectedAccount.balance.toLocaleString()}
                  </p>
                  <p className="text-xs text-amber-600">
                    ≈ {formatCurrency(convertPointsToYuan(selectedAccount.balance))}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-olive-50 rounded-xl">
                <p className="text-sm text-olive-700 mb-1 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  累计获得
                </p>
                <p className="text-2xl font-bold text-olive-600">
                  +{selectedAccount.totalEarned.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl">
                <p className="text-sm text-amber-700 mb-1 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  累计使用
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  -{selectedAccount.totalSpent.toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-serif font-semibold text-brown-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-brown-500" />
                  积分明细
                </h4>
                <button onClick={handleOpenAdjust} className="btn btn-secondary text-sm">
                  <Plus className="w-4 h-4 mr-1" />
                  调整积分
                </button>
              </div>

              {selectedAccount.transactions.length > 0 ? (
                <div className="max-h-80 overflow-y-auto scrollbar-thin space-y-2">
                  {selectedAccount.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-brown-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${transactionTypeColors[tx.type]}`}
                        >
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-brown-800">{tx.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${transactionTypeColors[tx.type]}`}
                            >
                              {transactionTypeLabels[tx.type]}
                            </span>
                            <span className="text-xs text-brown-400">
                              {formatDateTime(tx.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-lg font-bold ${tx.amount >= 0 ? 'text-olive-600' : 'text-amber-600'}`}
                      >
                        {tx.amount >= 0 ? '+' : ''}
                        {tx.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-brown-400">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>暂无积分变动记录</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="调整积分"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
            当前会员：<span className="font-medium">{selectedAccount?.customerName}</span>
            ，余额：
            <span className="font-bold">{selectedAccount?.balance.toLocaleString()}</span> 积分
          </div>
          <div>
            <label className="input-label">调整数量（正数增加，负数扣除）</label>
            <div className="flex gap-2">
              <button
                onClick={() => setAdjustAmount((v) => v - 10)}
                className="btn btn-secondary px-3"
              >
                <Minus className="w-4 h-4" />
                10
              </button>
              <input
                type="number"
                value={adjustAmount || ''}
                onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                className="input text-center text-lg font-bold"
                placeholder="0"
              />
              <button
                onClick={() => setAdjustAmount((v) => v + 10)}
                className="btn btn-secondary px-3"
              >
                <Plus className="w-4 h-4" />
                10
              </button>
            </div>
            {adjustAmount !== 0 && (
              <p
                className={`text-sm mt-2 ${adjustAmount > 0 ? 'text-olive-600' : 'text-amber-600'}`}
              >
                {adjustAmount > 0 ? '增加' : '扣除'} {Math.abs(adjustAmount)} 积分，调整后余额：
                <span className="font-bold">
                  {((selectedAccount?.balance || 0) + adjustAmount).toLocaleString()}
                </span>
              </p>
            )}
          </div>
          <div>
            <label className="input-label">调整原因</label>
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="input"
              placeholder="请输入调整原因"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsAdjustModalOpen(false)}
              className="flex-1 btn btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleConfirmAdjust}
              disabled={adjustAmount === 0}
              className="flex-1 btn btn-primary"
            >
              确认调整
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isNewAccountModalOpen}
        onClose={() => {
          setIsNewAccountModalOpen(false);
          setNewCustomerName('');
          setNewCustomerPhone('');
        }}
        title="新增会员"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="input-label">会员姓名 *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="input pl-10"
                placeholder="请输入会员姓名"
                required
              />
            </div>
          </div>
          <div>
            <label className="input-label">手机号码 *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400" />
              <input
                type="tel"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                className="input pl-10"
                placeholder="请输入手机号码"
                required
              />
            </div>
          </div>
          <div className="p-3 bg-brown-50 rounded-lg text-sm text-brown-600">
            <p>新会员初始积分：<span className="font-bold text-amber-600">0</span></p>
            <p className="text-xs text-brown-500 mt-1">可通过旧书回收获取积分</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setIsNewAccountModalOpen(false);
                setNewCustomerName('');
                setNewCustomerPhone('');
              }}
              className="flex-1 btn btn-secondary"
            >
              <X className="w-4 h-4 mr-2" />
              取消
            </button>
            <button
              onClick={handleCreateAccount}
              disabled={!newCustomerName.trim() || !newCustomerPhone.trim()}
              className="flex-1 btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              创建会员
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
