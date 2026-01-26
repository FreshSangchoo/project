import { create } from 'zustand';
import { type EmojiName } from '@/components/common/toast/SvgMap';

interface FilterToastState {
  filterVisible: boolean;
  message: string;
  image: EmojiName;
  duration: number;
  toastKey: number;
  showToast: (message: string, image: EmojiName, duration?: number) => void;
}

export const useFilterToastStore = create<FilterToastState>(set => ({
  filterVisible: false,
  message: '',
  image: 'EmojiRedExclamationMark',
  duration: 1000,
  toastKey: 0,

  showToast: (message, image, duration = 1000) => {
    const newKey = Date.now();

    set({
      filterVisible: true,
      message,
      image,
      duration,
      toastKey: newKey,
    });

    setTimeout(() => {
      set({ filterVisible: false });
    }, duration + 300);
  },
}));
