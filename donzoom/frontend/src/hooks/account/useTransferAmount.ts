import {useState, useCallback} from 'react';

const useTransferAmount = (initialAmount: string = '0') => {
  const [amount, setAmount] = useState<string>(initialAmount);

  const handleAmountChange = useCallback((newAmount: string) => {
    const cleanedAmount = newAmount.replace(/\D/g, '');
    setAmount(cleanedAmount);
  }, []);

  const formattedAmount = useCallback(() => {
    const numAmount = parseInt(amount);
    return numAmount === 0 ? '' : numAmount.toLocaleString() + '원';
  }, [amount]);

  return {
    amount,
    setAmount: handleAmountChange,
    formattedAmount: formattedAmount(),
  };
};

export default useTransferAmount;
