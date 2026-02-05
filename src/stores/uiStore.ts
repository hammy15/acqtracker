import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  taskDetailOpen: boolean;
  taskDetailId: string | null;
  mobileNavOpen: boolean;
  toggleSidebar: () => void;
  toggleSidebarCollapsed: () => void;
  openTaskDetail: (taskId: string) => void;
  closeTaskDetail: () => void;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  taskDetailOpen: false,
  taskDetailId: null,
  mobileNavOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleSidebarCollapsed: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openTaskDetail: (taskId) =>
    set({ taskDetailOpen: true, taskDetailId: taskId }),
  closeTaskDetail: () => set({ taskDetailOpen: false, taskDetailId: null }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));
