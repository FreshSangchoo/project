import { create } from 'zustand';

export type SectionKey = 'images' | 'price' | 'trade' | 'region';

export type SectionState = {
  valid: boolean;
  touched: boolean;
  y?: number;
  error?: string;
};

export type UploadFormStore = {
  showValidation: boolean;
  sections: Record<SectionKey, SectionState>;
  setShowValidation: (v: boolean) => void;
  reportValidity: (key: SectionKey, valid: boolean, error?: string) => void;
  reportLayoutY: (key: SectionKey, y: number) => void;
  firstInvalid: () => { key: SectionKey; y?: number; error?: string } | null;
  reset: () => void;
};

const initSection = (): SectionState => ({ valid: false, touched: false });
const initSectionTrue = (): SectionState => ({ valid: true, touched: false });
const initSections = (): Record<SectionKey, SectionState> => ({
  images: initSection(),
  price: initSection(),
  trade: initSection(),
  region: initSectionTrue(),
});

const order: SectionKey[] = ['images', 'price', 'trade', 'region'];

export const useUploadFormStore = create<UploadFormStore>((set, get) => ({
  showValidation: false,
  sections: initSections(),
  setShowValidation: valid => set({ showValidation: valid }),
  reportValidity: (key, valid, error) =>
    set(state => ({
      sections: {
        ...state.sections,
        [key]: { ...state.sections[key], valid, touched: true, error },
      },
    })),
  reportLayoutY: (key, y) =>
    set(state => ({
      sections: { ...state.sections, [key]: { ...state.sections[key], y } },
    })),
  firstInvalid: () => {
    const { sections } = get();
    for (const key of order) {
      if (!sections[key].valid) {
        const section = sections[key];
        return { key, y: section.y, error: section.error };
      }
    }
    return null;
  },
  reset: () => set({ showValidation: false, sections: initSections() }),
}));
