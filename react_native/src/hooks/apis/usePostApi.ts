import { ENDPOINTS } from '@/config';
import useApi from '@/hooks/apis/useApi';
import { PageParams, ProductListResponse } from '@/hooks/apis/useMyPostsApi';
import { UploadImageItem, useUploadDataStore } from '@/stores/useUploadDataStore';

type PostBase = {
  deliveryInfo: { feeIncluded: boolean; deliveryFee: number; validDeliveryFee: boolean };
  partChange: boolean;
  exchangeAvailable: boolean;
  price: number;
  deliveryAvailable: boolean;
  validTradeOptions: boolean;
  condition: 'NEW' | 'GOOD' | 'VERY_GOOD' | 'NORMAL' | 'DEFECTIVE';
  description: string;
};

type PostWithDirect = PostBase & {
  directAvailable: true;
  directInfo: { locations: number[] };
};

type PostWithoutDirect = PostBase & {
  directAvailable: false;
  directInfo?: never;
};

type PostCommon = PostWithDirect | PostWithoutDirect;

export type postData =
  | (PostCommon & { productId: number; customProductId?: never })
  | (PostCommon & { customProductId: number; productId?: never });

type SaleStatus = 'ON_SALE' | 'SOLD_OUT' | 'RESERVED';

type UploadImageInput = string | { uri: string; name?: string; type?: string };

const inferName = (uri: string, idx: number) => {
  const q = uri.split('?')[0];
  const base = q.split('/').pop() || `image_${idx}`;
  return /\.[a-zA-Z0-9]+$/.test(base) ? base : `${base}.jpg`;
};
const inferType = (uri: string) => {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
};

const usePostsApi = () => {
  const { postApi } = useApi();

  async function postPost(req: postData, images: UploadImageInput[] = []) {
    const form = new FormData();
    form.append('request', JSON.stringify(req));

    images.forEach((it, idx) => {
      const uri = typeof it === 'string' ? it : it.uri;
      const name = typeof it === 'string' ? inferName(uri, idx) : it.name ?? inferName(uri, idx);
      const type = typeof it === 'string' ? inferType(uri) : it.type ?? inferType(uri);
      form.append('images', { uri, name, type } as any);
    });


    return postApi
      .post(ENDPOINTS.POST.POST, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
        timeout: 20000,
      })
      .catch(error => {
        throw error;
      });
  }

  // 매물 목록 조회 [USER & verified=false/true 모두 가능]
  const getPostList = async (params?: PageParams): Promise<ProductListResponse> => {
    try {
      const response = await postApi.get(ENDPOINTS.POST.GET, { params });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  // 매물 끌어올리기 [USER & verified=true 필요]
  const postBumpPost = async (postId: number) => {
    try {
      await postApi.post(ENDPOINTS.POST.BUMP(postId));
      return { ok: true };
    } catch (error: any) {
      throw error;
    }
  };

  // 매물 상세 조회 [USER & verified=false/true 모두 가능]
  const getPostDetail = async (postId: number) => {
    try {
      const response = await postApi.get(ENDPOINTS.POST.POSTS(postId));
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  // 매물 삭제 [USER & verified=true 필요]
  const deletePost = async (postId: number) => {
    try {
      await postApi.delete(ENDPOINTS.POST.POSTS(postId));
      return { ok: true };
    } catch (error: any) {
      throw error;
    }
  };

  // 매물 수정 [USER & verified=true 필요]
  const updatePost = async (postId: number, req: postData, images: UploadImageItem[] = []) => {
    const form = new FormData();
    const { removedImageUrls } = useUploadDataStore.getState();
    const newFiles = images.filter(i => !i.isRemote);
    const safeReq: any = { ...req, imagesToDelete: removedImageUrls };

    form.append('request', JSON.stringify(safeReq));

    newFiles.forEach((it, idx) => {
      if (!it?.uri || /^https?:\/\//.test(it.uri)) return;
      const name = it.name ?? inferName(it.uri, idx);
      const type = it.type ?? inferType(it.uri);
      form.append('images', { uri: it.uri, name, type } as any);
    });


    try {
      await postApi.patch(ENDPOINTS.POST.POSTS(postId), form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
        timeout: 20000,
      });
      useUploadDataStore.getState().clearRemovedImages();
      return { ok: true };
    } catch (error: any) {
      throw error;
    }
  };

  // 매물 숨기기/표시하기 [USER & verified=true 필요]
  const visibilityPost = async (postId: number) => {
    try {
      await postApi.patch(ENDPOINTS.POST.VISIBLILTY(postId));
      return { ok: true };
    } catch (error: any) {
      throw error;
    }
  };

  // 매물 판매 상태 변경 [USER & verified=true 필요]
  const changePostStatus = async (postId: number, saleStatus: SaleStatus) => {
    try {
      await postApi.patch(ENDPOINTS.POST.STATUS(postId), null, { params: { saleStatus: saleStatus } });
    } catch (error: any) {
      throw error;
    }
  };

  return {
    postPost,
    getPostList,
    postBumpPost,
    getPostDetail,
    updatePost,
    deletePost,
    visibilityPost,
    changePostStatus,
  };
};

export default usePostsApi;
