import {
  AllNewsResponse,
  AllReportResponse,
  LatestStock,
  MyStock,
  ResponseContents,
  ResponseMyHistory,
  ResponseMyHistoryList,
  ResponseMyStock,
  ResponseStock,
  ResponseStockList,
  TodayNewsResponse,
  TodayReportResponse,
  getLatestStock,
  getMyHistory,
  getMyHistoryList,
  getMyStock,
  getMyStockId,
  getNews,
  getReports,
  getStock,
  getStockList,
  getTodaysNews,
  getTodaysReports,
  postBuyStock,
  postSellStock,
} from '@/api/stock';
import {queryKeys} from '@/constants/keys';
import {UseMutationCustomOptions, UseQueryCustomOptions} from '@/types/common';
import {useMutation, useQuery} from '@tanstack/react-query';

function useGetStockList(
  queryOptions?: UseQueryCustomOptions<ResponseStockList>,
) {
  return useQuery({
    queryKey: [queryKeys.STOCK],
    queryFn: getStockList,
    ...queryOptions,
  });
}

function useGetStock(
  stockId: number,
  interval: string,
  queryOptions?: UseQueryCustomOptions<ResponseStock>,
) {
  return useQuery({
    queryKey: [queryKeys.STOCK, stockId, interval],
    queryFn: () => getStock(stockId, interval),
    ...queryOptions,
  });
}

function useGetMyStock(
  userId: number,
  queryOptions?: UseQueryCustomOptions<ResponseMyStock>,
) {
  return useQuery({
    queryKey: [queryKeys.STOCK, userId],
    queryFn: () => getMyStock(userId),
    ...queryOptions,
  });
}

function useGetMyStockId(
  userId: number,
  stockId: number,
  queryOptions?: UseQueryCustomOptions<ResponseMyStock>,
) {
  return useQuery({
    queryKey: [queryKeys.STOCK, userId, stockId],
    queryFn: () => getMyStockId(userId, stockId),
    ...queryOptions,
  });
}

function useGetMyHistoryList(
  queryOptions?: UseQueryCustomOptions<ResponseMyHistoryList>,
) {
  return useQuery({
    queryKey: [queryKeys.STOCK],
    queryFn: getMyHistoryList,
    ...queryOptions,
  });
}

function useGetMyHistory(
  stockId: number,
  queryOptions?: UseQueryCustomOptions<ResponseMyHistory>,
) {
  return useQuery({
    queryKey: [queryKeys.STOCK, stockId],
    queryFn: () => getMyHistory(stockId),
    ...queryOptions,
  });
}

function usePostBuyStock(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: postBuyStock,
    ...mutationOptions,
  });
}

function usePostSellStock(mutationOptions?: UseMutationCustomOptions) {
  return useMutation({
    mutationFn: postSellStock,
    ...mutationOptions,
  });
}

function useGetNews(
  stockId: number,
  queryOptions?: UseQueryCustomOptions<AllNewsResponse>,
) {
  return useQuery({
    queryKey: ['news', 'all', stockId],
    queryFn: () => getNews(stockId),
    ...queryOptions,
  });
}
//
function useGetTodaysNews(
  stockId: number,
  queryOptions?: UseQueryCustomOptions<TodayNewsResponse>,
) {
  return useQuery({
    queryKey: ['news', 'today', stockId],
    queryFn: () => getTodaysNews(stockId),
    ...queryOptions,
  });
}

function useGetReports(
  stockId: number,
  queryOptions?: UseQueryCustomOptions<AllReportResponse>,
) {
  return useQuery({
    queryKey: ['reports', 'all', stockId],
    queryFn: () => getReports(stockId),
    ...queryOptions,
  });
}
//
function useGetTodaysReports(
  stockId: number,
  queryOptions?: UseQueryCustomOptions<TodayReportResponse>,
) {
  return useQuery({
    queryKey: ['reports', 'today', stockId],
    queryFn: () => getTodaysReports(stockId),
    ...queryOptions,
  });
}

function useGetLatestStock(
  stockId: number,
  queryOptions?: UseQueryCustomOptions<LatestStock>,
) {
  return useQuery({
    queryKey: [stockId],
    queryFn: () => getLatestStock(stockId),
    ...queryOptions,
  });
}

function useStock() {
  const buyStockMutation = usePostBuyStock();
  const sellStockMutation = usePostSellStock();
  return {
    useGetStockList,
    useGetStock,
    useGetMyStock,
    useGetMyHistoryList,
    useGetMyHistory,
    buyStockMutation,
    sellStockMutation,
    useGetNews,
    useGetTodaysNews,
    useGetReports,
    useGetTodaysReports,
    useGetMyStockId,
    useGetLatestStock,
  };
}

export default useStock;
