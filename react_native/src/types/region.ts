// 시·도
export type Sido = {
  siDoId: number;
  name: string;
};

// 시·군·구
export type Sigungu = {
  siGunGuId: number;
  name: string;
  parentId?: number;
};
