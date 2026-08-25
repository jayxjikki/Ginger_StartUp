import { create } from 'zustand';

type ModalType = 'alert' | 'confirm';

interface ModalConfig {
  type: ModalType;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface GlobalModalState {
  modalConfig: ModalConfig | null;
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
  closeModal: () => void;
}

export const useGlobalModalStore = create<GlobalModalState>((set) => ({
  modalConfig: null,
  
  showAlert: (message, title = 'Alert') => {
    return new Promise((resolve) => {
      set({
        modalConfig: {
          type: 'alert',
          title,
          message,
          confirmText: 'OK',
          onConfirm: () => {
            set({ modalConfig: null });
            resolve();
          },
          onCancel: () => {
            set({ modalConfig: null });
            resolve();
          }
        }
      });
    });
  },

  showConfirm: (message, title = 'Confirm Action') => {
    return new Promise((resolve) => {
      set({
        modalConfig: {
          type: 'confirm',
          title,
          message,
          confirmText: 'Yes, Proceed',
          cancelText: 'Cancel',
          onConfirm: () => {
            set({ modalConfig: null });
            resolve(true);
          },
          onCancel: () => {
            set({ modalConfig: null });
            resolve(false);
          }
        }
      });
    });
  },

  closeModal: () => set({ modalConfig: null }),
}));
