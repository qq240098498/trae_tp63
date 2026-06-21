import { create } from 'zustand';

interface UiStore {
  sidebarCollapsed: boolean;
  currentPage: string;
  isLoading: boolean;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentPage: (page: string) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarCollapsed: false,
  currentPage: 'dashboard',
  isLoading: false,

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
  },

  setCurrentPage: (page: string) => {
    set({ currentPage: page });
  },

  setIsLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));
