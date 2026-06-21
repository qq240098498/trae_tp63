import { useState } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Check,
  AlertTriangle,
  Tag,
  Coins,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useSystemConfigStore } from '@/store/useSystemConfigStore';
import { formatDateTime, formatCurrency } from '@/utils/format';
import { calculateTradeInPoints, convertPointsToYuan, calculateTradeInValue, calculateSalePrice } from '@/utils/pricing';
import type { BookCondition, ScarcityLevel } from '@/types';

export function SettingsPage() {
  const {
    config,
    isDirty,
    save,
    resetToDefaults,
    updateConditionLabel,
    updateConditionSaleFactor,
    updateConditionTradeInFactor,
    updateConditionPointsFactor,
    updateScarcityLabel,
    updateScarcityFactor,
    updatePointsPerYuan,
    updateTradeInBaseRate,
  } = useSystemConfigStore();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const sortedConditions = [...config.conditions].sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedScarcities = [...config.scarcities].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleSave = () => {
    save();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleReset = () => {
    resetToDefaults();
    setShowResetConfirm(false);
  };

  const demoOriginalPrice = 50;
  const demoPurchasePrice = 20;

  return (
    <div>
      <PageHeader
        title="系统设置"
        description="维护品相分级、稀缺度等级、积分规则等核心业务参数"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="btn btn-secondary"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              恢复默认
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              <Save className="w-4 h-4 mr-2" />
              保存配置
            </button>
          </div>
        }
      />

      {isDirty && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-700">您有未保存的修改</p>
            <p className="text-sm text-amber-600">请点击右上角"保存配置"按钮使修改生效</p>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="mb-6 p-4 bg-olive-50 border border-olive-200 rounded-xl flex items-center gap-3 text-olive-700">
          <Check className="w-5 h-5" />
          <span className="font-medium">配置已保存并生效</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-brown-100 rounded-lg">
              <Tag className="w-5 h-5 text-brown-600" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-lg text-brown-800">品相分级配置</h3>
              <p className="text-xs text-brown-500">控制旧书品相评定标准、定价系数及积分倍率</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-brown-100">
                  <th className="px-2 py-2 text-left text-xs font-medium text-brown-600 w-24">等级</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-brown-600">显示名称</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-brown-600 w-20">
                    售价系数
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-brown-600 w-20">
                    回收系数
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-brown-600 w-20">
                    积分倍率
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-brown-600 w-32">
                    示例(原价¥{demoOriginalPrice})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown-50">
                {sortedConditions.map((cond) => {
                  const demoValue = calculateTradeInValue(demoOriginalPrice, cond.key as BookCondition);
                  const demoPoints = calculateTradeInPoints(demoOriginalPrice, cond.key as BookCondition);
                  return (
                    <tr key={cond.key}>
                      <td className="px-2 py-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-brown-100 text-brown-700 text-xs font-mono">
                          {cond.key}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={cond.label}
                          onChange={(e) =>
                            updateConditionLabel(cond.key as BookCondition, e.target.value)
                          }
                          className="w-full px-2 py-1.5 text-sm border border-brown-200 rounded focus:outline-none focus:ring-1 focus:ring-brown-500 focus:border-brown-500"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={cond.saleFactor}
                          onChange={(e) =>
                            updateConditionSaleFactor(cond.key as BookCondition, parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1.5 text-sm text-center border border-brown-200 rounded focus:outline-none focus:ring-1 focus:ring-brown-500 focus:border-brown-500"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={cond.tradeInValueFactor}
                          onChange={(e) =>
                            updateConditionTradeInFactor(cond.key as BookCondition, parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1.5 text-sm text-center border border-brown-200 rounded focus:outline-none focus:ring-1 focus:ring-brown-500 focus:border-brown-500"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={cond.pointsFactor}
                          onChange={(e) =>
                            updateConditionPointsFactor(cond.key as BookCondition, parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1.5 text-sm text-center border border-amber-200 bg-amber-50 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-medium"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-xs space-y-0.5">
                          <p className="text-brown-600">回收: {formatCurrency(demoValue)}</p>
                          <p className="text-amber-600 flex items-center gap-0.5">
                            <Sparkles className="w-3 h-3" />
                            {demoPoints}分 ≈ {formatCurrency(convertPointsToYuan(demoPoints))}
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-brown-50 rounded-lg flex items-start gap-2">
            <Info className="w-4 h-4 text-brown-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-brown-600 space-y-1">
              <p>
                <span className="font-medium">售价系数</span>：定价上架时，售价 = 收购价 × 品相系数 × 稀缺度系数
              </p>
              <p>
                <span className="font-medium">回收系数</span>：旧书折价时，回收价 = 原价 × 品相系数 × 基础折价率
              </p>
              <p>
                <span className="font-medium">积分倍率</span>：旧书换积分时，积分 = 原价 × 积分倍率
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-olive-100 rounded-lg">
                <Layers className="w-5 h-5 text-olive-600" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-lg text-brown-800">稀缺度等级</h3>
                <p className="text-xs text-brown-500">控制书籍稀缺度评定及价格加成系数</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-brown-100">
                    <th className="px-2 py-2 text-left text-xs font-medium text-brown-600 w-24">等级</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-brown-600">显示名称</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-brown-600 w-28">
                      价格系数
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-brown-600 w-32">
                      示例(成本¥{demoPurchasePrice})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown-50">
                  {sortedScarcities.map((sc) => {
                    const demoPrice = calculateSalePrice(demoPurchasePrice, 'good', sc.key as ScarcityLevel);
                    return (
                      <tr key={sc.key}>
                        <td className="px-2 py-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-olive-100 text-olive-700 text-xs font-mono">
                            {sc.key}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={sc.label}
                            onChange={(e) =>
                              updateScarcityLabel(sc.key as ScarcityLevel, e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-sm border border-brown-200 rounded focus:outline-none focus:ring-1 focus:ring-brown-500 focus:border-brown-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={sc.factor}
                            onChange={(e) =>
                              updateScarcityFactor(sc.key as ScarcityLevel, parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1.5 text-sm text-center border border-olive-200 bg-olive-50 rounded focus:outline-none focus:ring-1 focus:ring-olive-500 focus:border-olive-500 font-medium"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <span className="text-sm font-medium text-amber-600">
                            售价 {formatCurrency(demoPrice)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-olive-50 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-olive-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-olive-600">
                <span className="font-medium">价格系数</span>：系数越高表示越稀缺，售价加成越大
              </p>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Coins className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-lg text-brown-800">积分规则</h3>
                <p className="text-xs text-brown-500">设置积分与人民币的兑换比例</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="input-label">积分兑换比例</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={config.points.pointsPerYuan}
                        onChange={(e) => updatePointsPerYuan(parseInt(e.target.value) || 1)}
                        className="input pl-10 text-lg font-bold text-amber-600"
                      />
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                    </div>
                  </div>
                  <span className="text-lg text-brown-500">积分</span>
                  <span className="text-lg text-brown-700 font-medium">=</span>
                  <span className="text-lg text-olive-600 font-bold">¥1.00</span>
                </div>
                <p className="text-xs text-brown-500 mt-2">
                  即：1 积分 = {formatCurrency(config.points.yuanPerPoints)}，当前设置下 ¥100 消费可用 {config.points.pointsPerYuan * 100} 积分全额抵扣
                </p>
              </div>

              <div>
                <label className="input-label">以旧换新基础折价率</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0.01"
                      step="0.05"
                      value={config.points.tradeInBaseRate}
                      onChange={(e) => updateTradeInBaseRate(parseFloat(e.target.value) || 0.01)}
                      className="input text-lg font-bold text-olive-600"
                    />
                  </div>
                  <span className="text-lg text-brown-500">（{Math.round(config.points.tradeInBaseRate * 100)}%）</span>
                </div>
                <p className="text-xs text-brown-500 mt-2">
                  旧书折价回收时的基础折扣率：回收价 = 原价 × 品相系数 × 基础折价率。默认为 0.5（即 50%）
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-amber-50 to-olive-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-brown-800">当前规则示例</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-white/70 rounded-lg">
                    <p className="text-xs text-brown-500 mb-1">旧书折价（良好品）</p>
                    <p className="font-bold text-olive-600">
                      原价 ¥{demoOriginalPrice} 可抵 {formatCurrency(calculateTradeInValue(demoOriginalPrice, 'good'))}
                    </p>
                  </div>
                  <div className="p-3 bg-white/70 rounded-lg">
                    <p className="text-xs text-brown-500 mb-1">旧书换积分（良好品）</p>
                    <p className="font-bold text-amber-600">
                      原价 ¥{demoOriginalPrice} 获 {calculateTradeInPoints(demoOriginalPrice, 'good')} 分
                    </p>
                    <p className="text-xs text-brown-500">
                      ≈ 抵扣 {formatCurrency(convertPointsToYuan(calculateTradeInPoints(demoOriginalPrice, 'good')))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-brown-50/50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-brown-700 mb-1">配置更新时间</h4>
                <p className="text-sm text-brown-500">{formatDateTime(config.updatedAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-brown-500">状态</p>
                <p className={`text-sm font-medium flex items-center gap-1 justify-end ${isDirty ? 'text-amber-600' : 'text-olive-600'}`}>
                  {isDirty ? (
                    <>
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                      有未保存修改
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      已同步
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <RotateCcw className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-lg text-brown-800">恢复默认配置</h3>
                <p className="text-sm text-brown-500">将重置品相分级、稀缺度和积分规则</p>
              </div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-5 text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4 inline mr-1.5" />
              此操作将覆盖您当前的所有自定义配置，确定要继续吗？
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 btn btn-secondary"
              >
                取消
              </button>
              <button onClick={handleReset} className="flex-1 btn btn-warning">
                确认恢复
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
