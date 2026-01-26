import { create } from 'zustand';

interface AuthSignupStore {
  email: string;
  accessToken: string;
  refreshToken: string;
  provider: string;
  password: string;
  code: string;
  setEmail: (email: string) => void;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setProvider: (provider: string) => void;
  setPassword: (pwd: string) => void;
  setCode: (code: string) => void;
  clear: () => void;
}

export const useAuthSignupStore = create<AuthSignupStore>((set) => ({
  email: '',
  accessToken: '',
  refreshToken: '',
  provider: '',
  password: '',
  code: '',
  setEmail: (email: string) => set({ email: email.trim().toLocaleLowerCase() }),
  setAccessToken: (token: string) => set({ accessToken: token }),
  setRefreshToken: (token: string) => set({ refreshToken: token }),
  setProvider: (provider: string) => set({ provider: provider }),
  setPassword: (pwd: string) => set({ password: pwd }),
  setCode: (code: string) => set({ code: code }),
  clear: () => set({ email: '', accessToken: '', refreshToken: '', provider: '', password: '', code: '' }),
}));
