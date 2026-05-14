import { create } from 'zustand';

interface UIState {
  activeCategoryId: string | null;
  setActiveCategoryId: (id: string | null) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  activeWallpaper: string | null;
  setActiveWallpaper: (path: string | null) => void;
}

export const useStore = create<UIState>((set) => ({
  activeCategoryId: null,
  setActiveCategoryId: (id) => set({ activeCategoryId: id }),
  isSidebarOpen: true,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  activeWallpaper: null,
  setActiveWallpaper: (path) => set({ activeWallpaper: path }),
}));
