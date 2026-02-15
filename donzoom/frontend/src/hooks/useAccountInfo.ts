import {useState, useEffect} from 'react';
import useAccount from './queries/useAccount';
import useAccountStore from '@/stores/useAccountStore';

interface AccountBalanceHook {
  account: string;
  balance: string;
  name: string;
  error: Error | null;
  refetch: () => void;
}

function useAccountBalance(): AccountBalanceHook {
  const {
    accountNo: account,
    balance,
    name: accountName,
    setAccountNo: setAccount,
    setBalance,
    setName: setAccountName,
  } = useAccountStore();
  const [error, setError] = useState<Error | null>(null);
  const {getAccount} = useAccount();

  const fetchAccount = async () => {
    const accountData = await getAccount.refetch();
    if (accountData.isSuccess) {
      setAccount(accountData.data ? accountData.data.rec[0].accountNo : '');
      setBalance(
        accountData.data ? accountData.data.rec[0].accountBalance : '',
      );
      setAccountName(accountData.data ? accountData.data.rec[0].userName : '');
    } else {
      setAccount('');
      setBalance('0');
      setAccountName('');
    }
  };

  const refetch = () => {
    fetchAccount();
  };

  return {account, balance, name: accountName, error, refetch};
}

export default useAccountBalance;
