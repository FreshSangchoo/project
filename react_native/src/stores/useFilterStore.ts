import { create } from 'zustand';
import { effectCategories } from '@/constants/bottom-sheet/EffectCategories';

interface FilterStore {
  selectedEffects: Record<string, string[]>;
  selectedBrandIds: Record<string, string>; // brandName -> brandId 매핑
  selectedRegionIds: Record<string, string>; // regionName -> regionId 매핑
  setSelectedEffect: (category: string, effect: string | null) => void;
  setSelectedBrand: (brandName: string, brandId: string | null) => void;
  setSelectedRegion: (regionName: string, regionId: string | null) => void;
  resetSelectedEffects: () => void;
  getFilteredEffects: () => { category: string; value: string }[];
  filterVersion: number;
  applyFilters: () => void;
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  selectedEffects: {},
  selectedBrandIds: {},
  selectedRegionIds: {},
  filterVersion: 0,

  setSelectedEffect: (category, effect) => {
    set(state => {
      if (effect === null) {
        return {
          selectedEffects: {
            ...state.selectedEffects,
            [category]: [],
          },
        };
      }

      // 단일 선택만 가능한 카테고리
      const singleSelectCategories = ['가격'];

      if (singleSelectCategories.includes(category)) {
        return {
          selectedEffects: {
            ...state.selectedEffects,
            [category]: [effect],
          },
        };
      }

      // 복수 선택 가능한 경우
      const prev = state.selectedEffects[category] || [];
      const alreadySelected = prev.includes(effect);
      const newSelection = alreadySelected ? prev.filter(e => e !== effect) : [...prev, effect];

      return {
        selectedEffects: {
          ...state.selectedEffects,
          [category]: newSelection,
        },
      };
    });
  },

  setSelectedBrand: (brandName, brandId) => {
    set(state => {
      if (brandId === null) {
        // 브랜드 제거
        const { [brandName]: removed, ...restBrandIds } = state.selectedBrandIds;
        const prevBrands = state.selectedEffects['브랜드'] || [];
        const newBrands = prevBrands.filter(name => name !== brandName);
        return {
          selectedBrandIds: restBrandIds,
          selectedEffects: {
            ...state.selectedEffects,
            브랜드: newBrands,
          },
        };
      } else {
        // 브랜드 추가
        const prevBrands = state.selectedEffects['브랜드'] || [];
        const alreadySelected = prevBrands.includes(brandName);
        if (alreadySelected) return state;

        return {
          selectedBrandIds: {
            ...state.selectedBrandIds,
            [brandName]: brandId,
          },
          selectedEffects: {
            ...state.selectedEffects,
            브랜드: [...prevBrands, brandName],
          },
        };
      }
    });
  },

  setSelectedRegion: (regionName, regionId) => {
    set(state => {
      if (regionId === null) {
        // 지역 제거
        const { [regionName]: removed, ...restRegionIds } = state.selectedRegionIds;
        return {
          selectedRegionIds: restRegionIds,
        };
      } else {
        // 지역 추가 - ID만 저장하고 selectedEffects는 건드리지 않음
        return {
          selectedRegionIds: {
            ...state.selectedRegionIds,
            [regionName]: regionId,
          },
        };
      }
    });
  },

  resetSelectedEffects: () =>
    set(state => ({
      selectedEffects: {},
      selectedBrandIds: {},
      selectedRegionIds: {},
      filterVersion: state.filterVersion + 1,
    })),

  applyFilters: () => set(state => ({ filterVersion: state.filterVersion + 1 })),

  getFilteredEffects: () => {
    const selectedEffects = get().selectedEffects;

    const effectTypeCategories = effectCategories.map(c => c.category);

    const restOrder = ['브랜드', '가격', '거래방식', '지역', '악기 상태', '판매 상태'];

    const fullOrder = [...effectTypeCategories, ...restOrder];

    const ordered = fullOrder.flatMap(category => {
      const values = selectedEffects[category] || [];

      if (effectTypeCategories.includes(category)) {
        const orderedEffects = effectCategories.find(c => c.category === category)?.effects || [];
        const sortedValues = orderedEffects.filter(effect => values.includes(effect));
        return sortedValues.map(value => ({ category, value }));
      }

      return values.map(value => {
        if (category === '가격') {
          return { category, value };
        }

        if (category === '지역') {
          // 새로운 형태: "시도명|시군구명|sidoId-sigunguId"
          if (value.includes('|')) {
            const parts = value.split('|');
            if (parts.length === 3) {
              const [sidoName, sigunguName] = parts;
              // 서버에서 이미 "제주 제주시" 형태로 주므로 그대로 사용
              // 만약 시군구명에 이미 시도명이 포함되어 있지 않다면 추가
              if (sigunguName.startsWith(sidoName)) {
                return { category, value: sigunguName };
              } else {
                return { category, value: `${sidoName} ${sigunguName}` };
              }
            }
          }

          // ID 형태인지 확인 (sido-sigungu 형태) - 기존 호환성
          if (value.includes('-') && /^\d+-\d+$/.test(value)) {
            return { category, value };
          }

          // 서버에서 온 지역 이름을 그대로 사용
          return { category, value };
        }

        return { category, value };
      });
    });

    const others = Object.entries(selectedEffects)
      .filter(([category]) => !fullOrder.includes(category))
      .flatMap(([category, values]) => values.map(value => ({ category, value })));

    return [...ordered, ...others];
  },
}));
