import create from 'zustand';
import { persist } from 'zustand/middleware';

// 상태 타입 정의
interface AuthState {
  accessToken: string | null;
  userTsid: string | null;
  userRole: string | null;
  setTokens: (accessToken: string, userTsid: string, userRole: string) => void;
  clearTokens: () => void;
}

// zustand 스토어 생성
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      userTsid: null,
      userRole: null,
      setTokens: (accessToken: string, userTsid: string, userRole: string) => set({ accessToken, userTsid, userRole }),
      clearTokens: () => {
        set({ accessToken: null, userTsid: null, userRole: null });
        localStorage.removeItem('auth-storage'); // 로컬 스토리지에서 해당 키 제거
      },
    }),
    {
      name: 'auth-storage', // 로컬 스토리지에 저장될 키 이름
      getStorage: () => localStorage, // 로컬 스토리지를 사용
    }
  )
);

export default useAuthStore;