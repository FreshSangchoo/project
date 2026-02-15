import {create} from 'zustand';

interface AccountState {
  password: string;
  setPassword: (password: string) => void;
  reset: () => void;
}

const initialState = {
  password: '',
};

const usePasswordStore = create<AccountState>(set => ({
  ...initialState,
  setPassword: password => set({password}),
  reset: () => set(initialState),
}));

export default usePasswordStore;
