import {create} from 'zustand';

interface AccountState {
  accountNo: string;
  amount: string;
  name: string;
  setAccountNo: (accountNo: string) => void;
  setAmount: (amount: string) => void;
  setName: (name: string) => void;
  reset: () => void;
}

const initialState = {
  accountNo: '',
  amount: '0',
  name: '',
};

const useTransferStore = create<AccountState>(set => ({
  ...initialState,
  setAccountNo: accountNo => set({accountNo}),
  setAmount: amount => set({amount}),
  setName: name => set({name}),
  reset: () => set(initialState),
}));

export default useTransferStore;
