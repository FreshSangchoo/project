import {useState, useEffect} from 'react';
import useAccount from '../queries/useAccount';

interface AccountInfoHook {
  account: string;
  balance: string;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useAccountInfo(): AccountInfoHook {
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const {getAccount, getBalance} = useAccount();

  const fetchAccount = () => {
    setIsLoading(true);
    getAccount.mutate(null, {
      onSuccess: data => {
        setAccount(data.rec[0].accountNo);
        fetchBalance(data.rec[0].accountNo);
      },
      onError: err => {
        setError(err as Error);
        setIsLoading(false);
      },
    });
  };

  const fetchBalance = (accountNo: string) => {
    getBalance.mutate(
      {accountNo},
      {
        onSuccess: data => {
          setBalance(data.rec[0].accountBalance);
          setIsLoading(false);
        },
        onError: err => {
          setError(err as Error);
          setIsLoading(false);
        },
      },
    );
  };

  const refetch = () => {
    fetchAccount();
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  return {account, balance, isLoading, error, refetch};
}

export default useAccountInfo;
