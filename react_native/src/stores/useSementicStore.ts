import { create } from 'zustand';
import { semanticString } from '@/styles/semantic-string';

type SemanticState = {
  brandId: number | null;
  effectIds: number[];
  setBrandId: (id: number | null) => void;
  setEffectIds: (ids: number[]) => void;
  setBrandByName: (name: string | null | undefined) => void;
  setEffectsByNames: (names: (string | null | undefined)[]) => void;
  reset: () => void;
};

const mapBrandNameToId = (name: string | null | undefined): number | null => {
  if (!name) return null;
  const id = (semanticString.BrandMap as Record<string, number>)[name];
  return typeof id === 'number' ? id : null;
};

const mapEffectNamesToIds = (names: (string | null | undefined)[] | null | undefined): number[] => {
  if (!names || names.length === 0) return [];
  const map = semanticString.EffectMap as Record<string, number>;
  return names.map(n => (n ? map[n] : undefined)).filter((v): v is number => typeof v === 'number');
};

export const useSemanticStore = create<SemanticState>(set => ({
  brandId: null,
  effectIds: [],
  setBrandId: id => set({ brandId: id }),
  setEffectIds: ids => set({ effectIds: ids }),
  setBrandByName: name => set({ brandId: mapBrandNameToId(name) }),
  setEffectsByNames: names => set({ effectIds: mapEffectNamesToIds(names) }),
  reset: () => set({ brandId: null, effectIds: [] }),
}));
