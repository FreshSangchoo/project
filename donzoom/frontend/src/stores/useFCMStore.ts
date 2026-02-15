import {create} from 'zustand';

interface FCMToken {
  token: string;
  setToken: (token: string) => void;
  reset: () => void;
}

const initialState = {
  token: '',
};

const useFCMStore = create<FCMToken>(set => ({
  ...initialState,
  setToken: token => set({token}),
  reset: () => set(initialState),
}));

export default useFCMStore;
