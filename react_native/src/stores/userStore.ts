import { Guest, Provider, UserProfile } from '@/types/user';
import { create } from 'zustand';

type SocialProvider = Exclude<Provider, 'ANONYMOUS'> | null;

interface UserState {
  profile: UserProfile | Guest | null;
  authProvider: SocialProvider;
  setProfile: (profile: UserProfile) => void;
  setGuest: () => void;
  clearProfile: () => void;
  setAuthProvider: (p: SocialProvider) => void;
  clearAuthProvider: () => void;
}

export const makeGuest = {
  userId: null,
  nickname: null,
  name: null,
  email: null,
  phone: null,
  profileImage: null,
  regions: null,
  joinDate: null,
  verified: null,
  provider: 'ANONYMOUS',
} as const;

export const useUserStore = create<UserState>(set => ({
  profile: null,
  authProvider: null,
  setProfile: profile => set({ profile: profile, authProvider: profile.provider ?? null }),
  setGuest: () => set({ profile: makeGuest }),
  clearProfile: () => set({ profile: null }),
  setAuthProvider: p => set({ authProvider: p }),
  clearAuthProvider: () => set({ authProvider: null }),
}));
