import {create} from 'zustand';

interface Pig {
  pigId: number;
  pigName: string;
  owned: boolean;
  description: string;
  imageUrl: string;
  silhouetteImageUrl: string;
  createdAt: string | null;
}

interface PigHistory {
  id: number;
  name: string;
  date: string;
}

interface PigStore {
  pigs: Pig[];
  setPigs: (pigs: Pig[]) => void;
  addOwnedPig: (pig: Pig) => void;
  pigHistory: PigHistory[];
  addPigHistory: (pig: Pig) => void;
  selectedCard: Pig | null;
  setSelectedCard: (pig: Pig | null) => void;
  selectedManyCards: Pig[] | null;
  setSelectedManyCards: (pigs: Pig[] | null) => void;
  isNewCard: boolean;
  setIsNewCard: (isNew: boolean) => void;
  isNewCards: boolean[];
  setIsNewCards: (newCards: boolean[]) => void;
  isManyDraws: boolean;
  setIsManyDraws: (isMany: boolean) => void;
}

export const usePigStore = create<PigStore>(set => ({
  pigs: [],

  setPigs: pigs => set({pigs}),

  addOwnedPig: pig =>
    set(state => ({
      pigs: state.pigs.map(p =>
        p.pigId === pig.pigId ? {...p, owned: true} : p,
      ),
    })),

  pigHistory: [],

  addPigHistory: pig =>
    set(state => ({
      pigHistory: [
        ...state.pigHistory,
        {
          id: pig.pigId,
          name: pig.pigName,
          date: new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'}),
        },
      ],
    })),

  selectedCard: null,
  setSelectedCard: pig => set({selectedCard: pig}),

  selectedManyCards: null,
  setSelectedManyCards: pigs => set({selectedManyCards: pigs}),

  isNewCard: false,
  setIsNewCard: isNew => set({isNewCard: isNew}),

  isNewCards: [],
  setIsNewCards: newCards => set({isNewCards: newCards}),

  isManyDraws: false,
  setIsManyDraws: isMany => set({isManyDraws: isMany}),
}));
