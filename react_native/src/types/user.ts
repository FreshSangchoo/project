export type SiDo = {
  siDoId: number;
  name: string;
};

export type SiGunGu = {
  siGunGuId: number;
  name: string;
};

export type Region = {
  siDo: SiDo;
  siGunGus: SiGunGu[];
};

export type Provider = 'LOCAL' | 'GOOGLE' | 'KAKAO' | 'NAVER' | 'FIREBASE' | 'ANONYMOUS';

export type UserProfile = {
  userId: number;
  nickname: string | null;
  name: string | null;
  email?: string;
  phone: string | null;
  profileImage: string | null;
  regions: Region[];
  joinDate: string;
  verified: boolean;
  withdrawn: boolean;
  provider: Exclude<Provider, 'ANONYMOUS'> | null;
};

export type Guest = {
  userId: null;
  nickname: null;
  name: null;
  email: null;
  phone: null;
  profileImage: null;
  regions: null;
  joinDate: null;
  verified: null;
  provider: 'ANONYMOUS';
};
