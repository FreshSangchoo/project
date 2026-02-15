import {
  Account,
  AccountResult,
  RequestAccountHistory,
  RequestAccountHolder,
  ResponseAccountHistory,
  ResponseBalance,
  getAccount,
  getAccountHistory,
  getAccountHolder,
  getBalance,
  patchAccountAuto,
  patchAccountLimit,
  postAccountAuto,
  postCard,
  postTransfer,
  postinitAccount,
  putDailyLimit,
  putPerTransactionLimit,
  getChildrenAccount,
  getChildrenBalance,
  getAccountHistoryEmail,
} from '@/api/account';
import {queryKeys} from '@/constants/keys';
import {UseMutationCustomOptions, UseQueryCustomOptions} from '@/types/common';
import {useMutation, useQuery} from '@tanstack/react-query';

function useInitAccount(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: postinitAccount,
    ...mutationOptions,
  });
}

function useGetAccount(queryOptions?: UseQueryCustomOptions<ResponseBalance>) {
  return useQuery({
    queryKey: [queryKeys.ACCOUNT],
    queryFn: getAccount,
    ...queryOptions,
  });
}

function usePostCard(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: postCard,
    ...mutationOptions,
  });
}

function usePostTransfer(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: postTransfer,
    ...mutationOptions,
  });
}

function useGetBalance(
  accountNo: string,
  queryOptions?: UseQueryCustomOptions<ResponseBalance>,
) {
  return useQuery({
    queryKey: [queryKeys.ACCOUNT, queryKeys.ACCOUNT.ACCOUNTNO, accountNo],
    queryFn: () => getBalance(accountNo),
    ...queryOptions,
  });
}

function useGetAccountHistory(
  accountNo: string,
  startDate: string,
  endDate: string,
  transactionType: string,
  orderByType: string,
  queryOptions?: UseQueryCustomOptions<ResponseAccountHistory>,
) {
  return useQuery({
    queryKey: [
      queryKeys.ACCOUNT,
      accountNo,
      startDate,
      endDate,
      transactionType,
      orderByType,
    ],
    queryFn: () =>
      getAccountHistory({
        accountNo,
        startDate,
        endDate,
        transactionType,
        orderByType,
      }),
    ...queryOptions,
  });
}

function useGetAccountHistoryEmail(
  accountNo: string,
  startDate: string,
  endDate: string,
  transactionType: string,
  orderByType: string,
  email: string,
  queryOptions?: UseQueryCustomOptions<ResponseAccountHistory>,
) {
  return useQuery({
    queryKey: [
      queryKeys.ACCOUNT,
      accountNo,
      startDate,
      endDate,
      transactionType,
      orderByType,
      email,
    ],
    queryFn: () =>
      getAccountHistoryEmail({
        accountNo,
        startDate,
        endDate,
        transactionType,
        orderByType,
        email,
      }),
    ...queryOptions,
  });
}

function usePatchAccountLimit(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: patchAccountLimit,
    ...mutationOptions,
  });
}

function usePutDailyLimit(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: putDailyLimit,
    ...mutationOptions,
  });
}

function usePutPerTransactionLimit(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: putPerTransactionLimit,
    ...mutationOptions,
  });
}

function usePostAccountAuto(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: postAccountAuto,
    ...mutationOptions,
  });
}

function usePatchAccountAuto(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: patchAccountAuto,
    ...mutationOptions,
  });
}

function useGetAccountHolder(
  accountNo: string,
  queryOptions?: UseQueryCustomOptions<RequestAccountHolder>,
) {
  return useQuery({
    queryKey: [queryKeys.ACCOUNT, queryKeys.ACCOUNT.ACCOUNTHOLDER, accountNo],
    queryFn: () => getAccountHolder(accountNo),
    ...queryOptions,
  });
}

function useGetChildrenAccount(
  email: string,
  queryOptions?: UseQueryCustomOptions<any>,
) {
  return useQuery({
    queryKey: ['getChildrenAccount', email],
    queryFn: () => getChildrenAccount(email),
    ...queryOptions,
  });
}
function useGetChildrenBalance(
  email: string,
  queryOptions?: UseQueryCustomOptions<any>,
) {
  return useQuery({
    queryKey: ['getChildrenBalance', email],
    queryFn: () => getChildrenBalance(email),
    ...queryOptions,
  });
}

function useAccount() {
  const initAccountMutation = useInitAccount();
  const getAccount = useGetAccount();
  const cardMutation = usePostCard();
  const transferMutation = usePostTransfer();
  const accountLimitMutation = usePatchAccountLimit();
  const dailyLimitMutation = usePutDailyLimit();
  const perTransactionLimitMutation = usePutPerTransactionLimit();
  const accountAutoMutation = usePostAccountAuto();
  const patchAccountAutoMutation = usePatchAccountAuto();
  const useGetChildrenAccountWithParams = (
    email: string,
    queryOptions?: UseQueryCustomOptions<any>,
  ) => {
    return useGetChildrenAccount(email, queryOptions);
  };
  const useGetChildrenBalanceWithParams = (
    email: string,
    queryOptions?: UseQueryCustomOptions<any>,
  ) => {
    return useGetChildrenBalance(email, queryOptions);
  };

  return {
    initAccountMutation,
    getAccount,
    cardMutation,
    transferMutation,
    useGetBalance,
    useGetAccountHistory,
    useGetAccountHistoryEmail,
    accountLimitMutation,
    dailyLimitMutation,
    perTransactionLimitMutation,
    accountAutoMutation,
    patchAccountAutoMutation,
    useGetAccountHolder,
    useGetChildrenAccountWithParams,
    useGetChildrenBalanceWithParams,
  };
}

export default useAccount;
