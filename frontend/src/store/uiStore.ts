// ═══════════════════════════════════════════════════════════
// GINGER — UI Store (Zustand)
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';

interface UIState {
  activeTab: 'clipping' | 'advertise';
  isModalOpen: boolean;
  modalContent: string | null;
  toastQueue: Toast[];

  // Actions
  setActiveTab: (tab: 'clipping' | 'advertise') => void;
  openModal: (content: string) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'clipping',
  isModalOpen: false,
  modalContent: null,
  toastQueue: [],

  setActiveTab: (tab) => set({ activeTab: tab }),

  openModal: (content) => set({ isModalOpen: true, modalContent: content }),

  closeModal: () => set({ isModalOpen: false, modalContent: null }),

  addToast: (toast) =>
    set((state) => ({
      toastQueue: [
        ...state.toastQueue,
        { ...toast, id: `toast-${Date.now()}-${Math.random().toString(36).slice(2)}` },
      ],
    })),

  removeToast: (id) =>
    set((state) => ({
      toastQueue: state.toastQueue.filter((t) => t.id !== id),
    })),
}));
