import { UseQueryCustomOptions } from '@/types/common';
import {useMutation, useQuery} from '@tanstack/react-query';
import axios from 'axios';
import { ResponseSavings, ResponseSavingsDetail } from '@/api/saving';
import { getMySavings, getSavingsDetail } from '@/api/saving';

// 적금 상태 확인 API 호출 훅
function useGetMySaving(
  queryOptions?: UseQueryCustomOptions<ResponseSavings>,
) {
  return useQuery({
    queryKey: ['getMySaving'],
    queryFn: getMySavings,
    ...queryOptions,
  });
}

// 적금 상세 정보 API 호출 훅
function useGetSavingsDetail(
  userId: number,
  queryOptions?: UseQueryCustomOptions<ResponseSavingsDetail>,
) {
  return useQuery({
    queryKey: ['getMySavingDetail', userId],
    queryFn: () => getSavingsDetail(userId),
    ...queryOptions,
  });
}


function useSaving() {
  return {
  useGetMySaving,
  useGetSavingsDetail
  };
}

export default useSaving;
