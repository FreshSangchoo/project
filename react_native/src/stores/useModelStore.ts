import { create } from 'zustand';

type ModelInfo = {
  brand: string;
  modelName: string;
  category: string;
};

type ModelStore = ModelInfo & {
  setBrand: (brand: string) => void;
  setModelName: (name: string) => void;
  setCategory: (category: string) => void;
  setAll: (info: Partial<ModelInfo>) => void;
  reset: () => void;
};

export const useModelStore = create<ModelStore>(set => ({
  brand: '',
  modelName: '',
  category: '',

  setBrand: brand => set({ brand }),
  setModelName: modelName => set({ modelName }),
  setCategory: category => set({ category }),
  setAll: info =>
    set(prev => ({
      brand: info.brand ?? prev.brand ?? '',
      modelName: info.modelName ?? prev.modelName ?? '',
      category: info.category ?? prev.category ?? '',
    })),
  reset: () => set({ brand: '', modelName: '', category: '' }),
}));
