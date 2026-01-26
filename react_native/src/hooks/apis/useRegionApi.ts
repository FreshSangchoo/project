import { ENDPOINTS } from '@/config';
import useApi from '@/hooks/apis/useApi';
import type { Sido, Sigungu } from '@/types/region';

export const useRegionApi = () => {
  const { regionApi } = useApi();

  const getSidos = async (): Promise<Sido[]> => {
    try {
      const response = await regionApi.get(ENDPOINTS.REGION.SIDOS);
      if (response.status === 200) {
        return response.data?.data ?? [];
      }
      return [];
    } catch (error) {
      if (__DEV__) {
        console.error('시도 목록 조회 오류:', error);
      }
      return [];
    }
  };

  const getSigungus = async (siDoId: number): Promise<Sigungu[]> => {
    try {
      const response = await regionApi.get(ENDPOINTS.REGION.SIGUNGUS(siDoId));
      if (response.status === 200) {
        return response.data?.data?.siGunGus ?? [];
      }
      return [];
    } catch (error) {
      if (__DEV__) {
        console.error('시군구 목록 조회 오류:', error);
      }
      return [];
    }
  };

  return { getSidos, getSigungus };
};

export default useRegionApi;
