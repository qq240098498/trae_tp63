import { create } from 'zustand';
import type {
  SystemConfig,
  BookCondition,
  ScarcityLevel,
  ConditionConfig,
  ScarcityConfig,
} from '@/types';
import { loadSystemConfig, saveSystemConfig } from '@/utils/storage';

const DEFAULT_CONDITIONS: ConditionConfig[] = [
  { key: 'new', label: '全新', saleFactor: 2.5, tradeInValueFactor: 2.5, pointsFactor: 10, sortOrder: 1 },
  { key: 'like_new', label: '近新', saleFactor: 2.0, tradeInValueFactor: 2.0, pointsFactor: 8, sortOrder: 2 },
  { key: 'good', label: '良好', saleFactor: 1.6, tradeInValueFactor: 1.6, pointsFactor: 6, sortOrder: 3 },
  { key: 'fair', label: '一般', saleFactor: 1.3, tradeInValueFactor: 1.3, pointsFactor: 4, sortOrder: 4 },
  { key: 'poor', label: '较差', saleFactor: 1.0, tradeInValueFactor: 1.0, pointsFactor: 2, sortOrder: 5 },
];

const DEFAULT_SCARCITIES: ScarcityConfig[] = [
  { key: 'rare', label: '罕见', factor: 1.5, sortOrder: 1 },
  { key: 'uncommon', label: '较少', factor: 1.3, sortOrder: 2 },
  { key: 'common', label: '普通', factor: 1.0, sortOrder: 3 },
  { key: 'abundant', label: '常见', factor: 0.8, sortOrder: 4 },
];

const DEFAULT_CONFIG: SystemConfig = {
  conditions: DEFAULT_CONDITIONS,
  scarcities: DEFAULT_SCARCITIES,
  points: {
    pointsPerYuan: 10,
    yuanPerPoints: 0.1,
    tradeInBaseRate: 0.5,
  },
  updatedAt: new Date().toISOString(),
};

interface SystemConfigStore {
  config: SystemConfig;
  isDirty: boolean;

  init: () => void;
  resetToDefaults: () => void;
  save: () => boolean;

  updateConditionLabel: (key: BookCondition, label: string) => void;
  updateConditionSaleFactor: (key: BookCondition, factor: number) => void;
  updateConditionTradeInFactor: (key: BookCondition, factor: number) => void;
  updateConditionPointsFactor: (key: BookCondition, factor: number) => void;

  updateScarcityLabel: (key: ScarcityLevel, label: string) => void;
  updateScarcityFactor: (key: ScarcityLevel, factor: number) => void;

  updatePointsPerYuan: (value: number) => void;
  updateTradeInBaseRate: (value: number) => void;

  getConditionLabels: () => Record<BookCondition, string>;
  getConditionSaleFactors: () => Record<BookCondition, number>;
  getConditionTradeInFactors: () => Record<BookCondition, number>;
  getConditionPointsFactors: () => Record<BookCondition, number>;
  getScarcityLabels: () => Record<ScarcityLevel, string>;
  getScarcityFactors: () => Record<ScarcityLevel, number>;
  getPointsToYuanRate: () => number;
  getYuanToPointsRate: () => number;
  getTradeInBaseRate: () => number;
}

function buildRecords<T extends { key: string; label: string }, K extends string>(
  arr: T[],
  key: 'label'
): Record<K, string>;
function buildRecords<T extends { key: string }, K extends string, V extends number>(
  arr: T[],
  valueKey: keyof T
): Record<K, V>;
function buildRecords<T extends { key: string }, K extends string>(
  arr: T[],
  valueKey: keyof T
): Record<K, unknown> {
  return arr.reduce((acc, item) => {
    acc[item.key as K] = item[valueKey];
    return acc;
  }, {} as Record<K, unknown>);
}

export const useSystemConfigStore = create<SystemConfigStore>((set, get) => ({
  config: DEFAULT_CONFIG,
  isDirty: false,

  init: () => {
    const stored = loadSystemConfig();
    if (stored) {
      set({ config: stored, isDirty: false });
    } else {
      set({ config: DEFAULT_CONFIG, isDirty: false });
      saveSystemConfig(DEFAULT_CONFIG);
    }
  },

  resetToDefaults: () => {
    set({ config: { ...DEFAULT_CONFIG, updatedAt: new Date().toISOString() }, isDirty: true });
  },

  save: () => {
    const { config } = get();
    const toSave: SystemConfig = { ...config, updatedAt: new Date().toISOString() };
    saveSystemConfig(toSave);
    set({ config: toSave, isDirty: false });
    return true;
  },

  updateConditionLabel: (key, label) => {
    set((state) => ({
      config: {
        ...state.config,
        conditions: state.config.conditions.map((c) =>
          c.key === key ? { ...c, label } : c
        ),
      },
      isDirty: true,
    }));
  },

  updateConditionSaleFactor: (key, factor) => {
    set((state) => ({
      config: {
        ...state.config,
        conditions: state.config.conditions.map((c) =>
          c.key === key ? { ...c, saleFactor: factor } : c
        ),
      },
      isDirty: true,
    }));
  },

  updateConditionTradeInFactor: (key, factor) => {
    set((state) => ({
      config: {
        ...state.config,
        conditions: state.config.conditions.map((c) =>
          c.key === key ? { ...c, tradeInValueFactor: factor } : c
        ),
      },
      isDirty: true,
    }));
  },

  updateConditionPointsFactor: (key, factor) => {
    set((state) => ({
      config: {
        ...state.config,
        conditions: state.config.conditions.map((c) =>
          c.key === key ? { ...c, pointsFactor: factor } : c
        ),
      },
      isDirty: true,
    }));
  },

  updateScarcityLabel: (key, label) => {
    set((state) => ({
      config: {
        ...state.config,
        scarcities: state.config.scarcities.map((s) =>
          s.key === key ? { ...s, label } : s
        ),
      },
      isDirty: true,
    }));
  },

  updateScarcityFactor: (key, factor) => {
    set((state) => ({
      config: {
        ...state.config,
        scarcities: state.config.scarcities.map((s) =>
          s.key === key ? { ...s, factor } : s
        ),
      },
      isDirty: true,
    }));
  },

  updatePointsPerYuan: (value) => {
    set((state) => ({
      config: {
        ...state.config,
        points: {
          ...state.config.points,
          pointsPerYuan: value,
          yuanPerPoints: 1 / value,
        },
      },
      isDirty: true,
    }));
  },

  updateTradeInBaseRate: (value) => {
    set((state) => ({
      config: {
        ...state.config,
        points: {
          ...state.config.points,
          tradeInBaseRate: value,
        },
      },
      isDirty: true,
    }));
  },

  getConditionLabels: () =>
    buildRecords<ConditionConfig, BookCondition>(get().config.conditions, 'label'),

  getConditionSaleFactors: () =>
    buildRecords<ConditionConfig, BookCondition, number>(get().config.conditions, 'saleFactor'),

  getConditionTradeInFactors: () =>
    buildRecords<ConditionConfig, BookCondition, number>(get().config.conditions, 'tradeInValueFactor'),

  getConditionPointsFactors: () =>
    buildRecords<ConditionConfig, BookCondition, number>(get().config.conditions, 'pointsFactor'),

  getScarcityLabels: () =>
    buildRecords<ScarcityConfig, ScarcityLevel>(get().config.scarcities, 'label'),

  getScarcityFactors: () =>
    buildRecords<ScarcityConfig, ScarcityLevel, number>(get().config.scarcities, 'factor'),

  getPointsToYuanRate: () => get().config.points.yuanPerPoints,
  getYuanToPointsRate: () => get().config.points.pointsPerYuan,
  getTradeInBaseRate: () => get().config.points.tradeInBaseRate,
}));
