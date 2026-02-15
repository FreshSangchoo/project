import {create} from 'zustand';

interface ChildProfile {
  id: number;
  name: string;
  email: string;
  nickname: string;
  balance?: number;

}


type ChildIdState = {
  id: number | null; 
  name: string | null;
  setChildId: (id: number) => void; 
  getChildId: () => number | null; 
  setChildName: (name: string) => void; 
  getChildName: () => string | null; 
  children: ChildProfile[]; 
  setChildren: (children: ChildProfile[]) => void; 
  getChildren: () => ChildProfile[];

};

const useMissionStore = create<ChildIdState>((set, get) => ({
  id: null, // 초기 상태
  name:null,
  setChildId: (id: number) => set({id}), 
  getChildId: () => get().id, 
  setChildName: (name: string) => set({name}), 
  getChildName: () => get().name, 
  children: [], 
  setChildren: (children: ChildProfile[]) => set({children}), // 아이 프로필을 설정하는 함수
  getChildren: () => get().children, // 아이 프로필을 반환하는 함수

}));

export default useMissionStore;
