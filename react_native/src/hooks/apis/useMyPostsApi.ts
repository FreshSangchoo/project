import useApi from '@/hooks/apis/useApi';
import { ENDPOINTS } from '@/config';
import { MerchandiseData } from '@/types/merchandise.types';
import { PostList } from '@/types/postlist.type';

export interface PostListResponse {
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
  posts: Array<MerchandiseData>;
}

export interface ProductListResponse {
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
  posts: Array<PostList>;
}

export interface PageParams {
  page?: number;
  size?: number;
  sort?: string;
}

const useMyPostsApi = () => {
  const { myPostsApi } = useApi();

  // 판매 완료 내역 조회
  const getSoldList = async (params?: PageParams): Promise<PostListResponse> => {
    try {
      const response = await myPostsApi.get(ENDPOINTS.MYPOST.SOLD, { params });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  // 판매 중인 내역 조회
  const getSellingList = async (params?: PageParams): Promise<PostListResponse> => {
    try {
      const response = await myPostsApi.get(ENDPOINTS.MYPOST.SELLING, { params });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  // 최근 본 매물 목록 조회
  const getRecentList = async (params?: PageParams): Promise<PostListResponse> => {
    try {
      const response = await myPostsApi.get(ENDPOINTS.MYPOST.RECENT, { params });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  // 나의 숨김 글 내역 조회
  const getHiddenList = async (params?: PageParams): Promise<PostListResponse> => {
    try {
      const response = await myPostsApi.get(ENDPOINTS.MYPOST.HIDDEN, { params });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  // 내가 찜한 악기 목록 조회
  const getLikedList = async (params?: PageParams): Promise<PostListResponse> => {
    try {
      const response = await myPostsApi.get(ENDPOINTS.MYPOST.LIKED, { params });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  // 특정 사용자 매물 목록 조회
  const getUserProductList = async (userId: number, params?: PageParams): Promise<ProductListResponse> => {
    try {
      const response = await myPostsApi.get(ENDPOINTS.MYPOST.USER_LIST(userId), { params });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  return { getSoldList, getSellingList, getRecentList, getHiddenList, getLikedList, getUserProductList };
};

export default useMyPostsApi;
