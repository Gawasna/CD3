import { create } from 'zustand';

interface ChatStore {
  isOpen: boolean;
  targetUserId: string | null;
  
  openChat: (userId?: string) => void;
  closeChat: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  targetUserId: null,

  openChat: (userId) => set({ isOpen: true, targetUserId: userId || null }),
  closeChat: () => set({ isOpen: false, targetUserId: null }),
  setIsOpen: (isOpen) => set({ isOpen }),
}));
