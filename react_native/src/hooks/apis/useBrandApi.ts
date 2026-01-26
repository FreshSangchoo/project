import { ENDPOINTS } from '@/config';
import useApi from '@/hooks/apis/useApi';
import { PageParams } from '@/hooks/apis/useMyPostsApi';

export const useBrandApi = () => {
  const { brandApi } = useApi();

  const getBrandList = async (params?: PageParams) => {
    try {
      const response = await brandApi.get(ENDPOINTS.BRAND.GET, { params });
      return response.data.data;
    } catch (error) {
      if (__DEV__) {
        console.log('[getBrandList] error: ', error);
      }
      throw error;
    }
  };

  const getBrandModelList = async (brandId?: number, params?: PageParams) => {
    try {
      const response = await brandApi.get(ENDPOINTS.BRAND.MODELS, { params: { brandId, ...params } });
      return response.data.data;
    } catch (error) {
      if (__DEV__) {
        console.log('[getBrandModelList] error: ', error);
      }
      throw error;
    }
  };

  return { getBrandList, getBrandModelList };
};

export default useBrandApi;
