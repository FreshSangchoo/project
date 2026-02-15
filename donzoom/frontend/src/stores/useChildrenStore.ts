import {create} from 'zustand';
import {Child} from '@/types/domain';

interface ChildInfo {
  id: number;
  name: string;
  email: string;
  nickname: string;
  profileImage: string;
  accountNumber: string;
  balance: number;
  ongoingMissions?: string;
  completeMissions?: string;
}

interface ChildrenStore {
  myChildren: Child[];
  selectedChild: ChildInfo | null;
  setMyChildren: (myChildren: Child[]) => void;
  setSelectedChild: (selectedChild: ChildInfo | null) => void;
  resetChildren: () => void;
}

export const useChildrenStore = create<ChildrenStore>(set => ({
  myChildren: [],
  selectedChild: null,
  setMyChildren: (myChildren: Child[]) => set({myChildren}),
  setSelectedChild: (selectedChild: ChildInfo | null) => set({selectedChild}),
  resetChildren: () =>
    set({
      myChildren: [],
      selectedChild: null,
    }),
}));
