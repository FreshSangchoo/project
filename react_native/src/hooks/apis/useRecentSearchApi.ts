import { ENDPOINTS } from '@/config';
import useApi from '@/hooks/apis/useApi';

type BrandSuggestion = { text: string; type: 'brand'; id: string; brandNameKo: string };
type ModelSuggestion = {
  text: string;
  type: 'model';
  id: string;
  brandName: string;
  brandId?: string;
  brandNameKo?: string;
};

export const useRecentSearchApi = () => {
  const { recentSearchApi } = useApi();

  const getRecentSearch = () => {
    return recentSearchApi
      .get(ENDPOINTS.RECENT_SEARCHES.GET)
      .then(response => {
        if (response.status === 200) {
          return response.data?.data?.recentSearches ?? [];
        }
        return [];
      })
      .catch(error => {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 401 && data?.divisionCode === 'A401') {
          return [];
        }
        if (status === 400) return [];

        if (__DEV__) {
          console.error('최근 검색어 조회 오류:', error);
        }
        throw error;
      });
  };

  const postRecentSearch = (keyword: string) => {
    return recentSearchApi
      .post(ENDPOINTS.RECENT_SEARCHES.POST, null, { params: { keyword } })
      .then(response => {
        if (response.status === 200) return true;
        return false;
      })
      .catch(error => {
        if (__DEV__) {
          console.error('최근 검색어 저장 오류:', error);
        }
        return false;
      });
  };

  const getUnifiedSuggestions = (input: string) => {
    return recentSearchApi
      .get(ENDPOINTS.RECENT_SEARCHES.UNIFIED_SUGGESTIONS, {
        params: { input },
      })
      .then(response => {
        if (response.status === 200) {
          const data = response.data?.data ?? {};
          return {
            recent: (data.recentSearchSuggestions as string[]) ?? [],
            brands: (data.brandSuggestions as BrandSuggestion[]) ?? [],
            models: (data.modelSuggestions as ModelSuggestion[]) ?? [],
          };
        }
        return { recent: [], brands: [], models: [] };
      })
      .catch(error => {
        if (__DEV__) {
          console.error('통합 추천 조회 오류:', error);
        }
        if (error.response?.status === 400) {
          return { recent: [], brands: [], models: [] };
        }
        throw error;
      });
  };

  const deleteRecentSearch = (keyword: string) => {
    const url = ENDPOINTS.RECENT_SEARCHES.DELETE(keyword);
    return recentSearchApi
      .delete(url)
      .then(response => {
        if (response.status === 200) return true;
        return false;
      })
      .catch(error => {
        if (__DEV__) {
          console.error('최근 검색어 삭제 오류:', error);
        }
        return false;
      });
  };

  const deleteAllRecentSearches = () => {
    return recentSearchApi
      .delete(ENDPOINTS.RECENT_SEARCHES.DELETE_ALL)
      .then(response => response.status === 200)
      .catch(error => {
        if (__DEV__) {
          console.error('최근 검색어 전체 삭제 오류:', error);
        }
        return false;
      });
  };

  return { getRecentSearch, postRecentSearch, getUnifiedSuggestions, deleteRecentSearch, deleteAllRecentSearches };
};

export default useRecentSearchApi;
