import {create} from 'zustand';

interface AccountState {
  accountNo: string;
  balance: string;
  name: string;
  setAccountNo: (accountNo: string) => void;
  setBalance: (balance: string) => void;
  setName: (name: string) => void;
  reset: () => void;
}

const initialState = {
  accountNo: '',
  balance: '0',
  name: '',
};

const useAccountStore = create<AccountState>(set => ({
  ...initialState,
  setAccountNo: accountNo => set({accountNo}),
  setBalance: balance => set({balance}),
  setName: name => set({name}),
  reset: () => set(initialState),
}));

export default useAccountStore;
