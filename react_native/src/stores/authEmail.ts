import { create } from 'zustand';

interface EmailStore {
  email: string;
  setEmail: (v: string) => void;
  clearEmail: () => void;
  validate: (v?: string) => boolean;
}

export const useEmailStore = create<EmailStore>((set, get) => ({
  email: '',
  setEmail: v => set({ email: v.trim().toLocaleLowerCase() }),
  clearEmail: () => set({ email: '' }),
  validate: v => /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(v ?? get().email),
}));
