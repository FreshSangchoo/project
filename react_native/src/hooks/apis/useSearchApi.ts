import { ENDPOINTS } from '@/config';
import useApi from '@/hooks/apis/useApi';
import { PageParams, ProductListResponse } from '@/hooks/apis/useMyPostsApi';

export interface FilterParams extends PageParams {
  brandIds?: string[];
  effectTypeIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  deliveryAvailable?: boolean;
  directAvailable?: boolean;
  directRegions?: string[];
  conditions?: ('NEW' | 'VERY_GOOD' | 'GOOD' | 'NORMAL' | 'DEFECTIVE')[];
  saleStatus?: ('ON_SALE' | 'SOLD_OUT' | 'RESERVED')[];
}

export const useSearchApi = () => {
  const { searchApi } = useApi();

  // 키워드 추천 브랜드
  const getRegionSearch = (input: string) => {
    return searchApi
      .get(ENDPOINTS.SEARCH.REGION, {
        params: { input },
      })
      .then(response => {
        if (response.status === 200) {
          return response.data?.suggestions ?? [];
        }
        return [];
      })
      .catch(error => {
        throw error;
      });
  };

  // 키워드 추천 모델
  const getEffectModelSearch = (input: string) => {
    const keyword = input?.trim();
    if (!keyword) return Promise.resolve([]);
    return searchApi
      .get(ENDPOINTS.SEARCH.EFFECT_MODEL, {
        params: { input: keyword },
      })
      .then(response => {
        if (response.status === 200) {
          return response.data?.suggestions ?? [];
        }
        return [];
      })
      .catch(error => {
        throw error;
      });
  };

  // 키워드 추천 브랜드
  const getBrandSearch = (input: string) => {
    return searchApi
      .get(ENDPOINTS.SEARCH.SUGGEST_BRAND, {
        params: { input },
        suppressGlobalErrorToast: true,
      })
      .then(response => {
        if (response.status === 200) {
          return response.data?.suggestions ?? [];
        }
        return [];
      })
      .catch(error => {
        throw error;
      });
  };

  // 키워드로 매물 조회
  const getKeywordProductList = async (keyword: string, params?: PageParams): Promise<ProductListResponse> => {
    try {
      const response = await searchApi.get(ENDPOINTS.SEARCH.KEYWORD, {
        params: {
          keyword,
          ...params,
        },
      });
      if (__DEV__) {
        console.log('[getModelProductList]: ', response.data.data);
      }
      return response.data.data;
    } catch (error) {
      if (__DEV__) {
        console.log('[getModelProductList] error: ', error);
      }
      throw error;
    }
  };

  // 모델 ID로 매물 조회
  const getModelProductList = async (modelId: number, params?: PageParams): Promise<ProductListResponse> => {
    try {
      const response = await searchApi.get(ENDPOINTS.SEARCH.MODEL(modelId), { params });
      if (__DEV__) {
        console.log('[getModelProductList]: ', response.data.data);
      }
      return response.data.data;
    } catch (error) {
      if (__DEV__) {
        console.log('[getModelProductList] error: ', error);
      }
      throw error;
    }
  };

  // 브랜드 ID로 매물 조회
  const getBrandProductList = async (brandId: number, params?: PageParams): Promise<ProductListResponse> => {
    try {
      const response = await searchApi.get(ENDPOINTS.SEARCH.BRAND(brandId), { params });
      if (__DEV__) {
        console.log('[getBrandProductList]: ', response.data.data);
      }
      return response.data.data;
    } catch (error) {
      if (__DEV__) {
        console.log('[getBrandProductList] error: ', error);
      }
      throw error;
    }
  };

  // 다중 필터 매물 검색
  const getFilterProductList = async (params?: FilterParams): Promise<ProductListResponse> => {
    try {
      const response = await searchApi.get(ENDPOINTS.SEARCH.FILTERS, {
        params,
        paramsSerializer: {
          indexes: null, // 배열을 key=value&key=value 형식으로 직렬화 (AOS 호환)
        },
      });
      if (__DEV__) {
        console.log('[getFilterProductList]: ', response.data.data);
      }
      return response.data.data;
    } catch (error) {
      if (__DEV__) {
        console.log('[getFilterProductList] error: ', error);
      }
      throw error;
    }
  };

  return {
    getRegionSearch,
    getEffectModelSearch,
    getBrandSearch,
    getKeywordProductList,
    getModelProductList,
    getBrandProductList,
    getFilterProductList,
  };
};

export default useSearchApi;
