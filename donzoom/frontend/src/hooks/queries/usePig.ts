import {
  getAllPig,
  getMyPig,
  drawPig,
  getMyCoin,
  getMyTicket,
  changeCoinToTicket,
  MyCoin,
} from '@/api/pig';
import {UseMutationCustomOptions, UseQueryCustomOptions} from '@/types/common';
import {useMutation, useQuery} from '@tanstack/react-query';

function useGetAllPig(queryOptions?: UseQueryCustomOptions<any>) {
  return useQuery({
    queryKey: ['getAllPig'],
    queryFn: getAllPig,
    ...queryOptions,
  });
}

function useGetMyPig(queryOptions?: UseQueryCustomOptions<any>) {
  return useQuery({
    queryKey: ['getMyPig'],
    queryFn: getMyPig,
    ...queryOptions,
  });
}

function usePostDrawPig(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: drawPig,
    ...mutationOptions,
  });
}

function useGetMyCoin(queryOptions?: UseQueryCustomOptions<MyCoin>) {
  return useQuery({
    queryKey: ['getMyCoin'],
    queryFn: getMyCoin,
    ...queryOptions,
  });
}

function useGetMyTicket(queryOptions?: UseQueryCustomOptions<any>) {
  return useQuery({
    queryKey: ['getMyTicket'],
    queryFn: getMyTicket,
    ...queryOptions,
  });
}

function usePostChangeCoinToTicket(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: changeCoinToTicket,
    ...mutationOptions,
  });
}

function usePig() {
  const getAllPigMutation = useGetAllPig();
  const getMyPigMutation = useGetMyPig();
  const drawPigMutation = usePostDrawPig();
  const getMyCoinMutation = useGetMyCoin();
  const getMyTicketMutation = useGetMyTicket();
  const changeCoinToTicketMutation = usePostChangeCoinToTicket();

  return {
    getAllPigMutation,
    getMyPigMutation,
    drawPigMutation,
    getMyCoinMutation,
    getMyTicketMutation,
    changeCoinToTicketMutation,
  };
}

export default usePig;
