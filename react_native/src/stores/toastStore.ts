import { create } from 'zustand';
import type { EmojiName } from '@/components/common/toast/SvgMap';

type ToastVariant = 'alert';

interface ToastState {
  visible: boolean;
  message: string;
  image: EmojiName | undefined;
  duration: number;
  pulse: number;
  variant?: ToastVariant;

  show: (opts: { message: string; image?: EmojiName; duration?: number; variant?: ToastVariant }) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>(set => ({
  visible: false,
  message: '',
  image: undefined,
  duration: 1000,
  pulse: 0,
  variant: undefined,

  show: ({ message, image, duration = 1000, variant }) =>
    set(s => ({
      visible: true,
      message,
      image,
      duration,
      variant,
      pulse: s.pulse + 1,
    })),

  hide: () => set(s => ({ visible: false, pulse: s.pulse + 1 })),
}));
