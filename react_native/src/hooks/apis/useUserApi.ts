import { ENDPOINTS } from '@/config';
import useApi from '@/hooks/apis/useApi';

interface UpdateProfileRequest {
  nickname?: string;
  sigunguIds?: number[];
}

interface ProfileImage {
  uri: string;
  name: string;
  type: string;
}

const useUserApi = () => {
  const { userApi } = useApi();

  // 사용자 프로필 조회
  const getProfile = async () => {
    try {
      const response = await userApi.get(ENDPOINTS.PROFILE.PROFILE, { suppressGlobalErrorToast: true });
      if (__DEV__) {
        console.log('[getProfile]: ', response.data.data);
      }
      return response.data.data;
    } catch (error) {
      if (__DEV__) {
        console.log('[getProfile] error: ', error);
      }
      throw error;
    }
  };

  // 사용자 프로필 수정
  const updateProfile = async (body: UpdateProfileRequest, file?: ProfileImage | null) => {
    const formData = new FormData();

    formData.append('request', JSON.stringify(body));

    if (file) formData.append('file', { uri: file.uri, name: file.name, type: file.type } as any);

    try {
      const response = await userApi.patch(ENDPOINTS.PROFILE.PROFILE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: v => v,
      });
      if (__DEV__) {
        console.log('[patchProfile]: ', response.data.data);
      }
      return response.data.data;
    } catch (error) {
      if (__DEV__) {
        console.log('[patchProfile] error: ', error);
      }
      throw error;
    }
  };

  // 닉네임 변경 중복 확인
  const validateNickname = async (nickname: string) => {
    try {
      await userApi.patch(ENDPOINTS.PROFILE.NICKNAME, { nickname });
      return { ok: true };
    } catch (error: any) {
      const reason =
        error?.response?.data?.resultMsg || error?.response?.data?.reason || '사용할 수 없는 닉네임입니다.';
      return { ok: false, reason };
    }
  };

  // 사용자 차단
  const postBlockUser = async (targetUserId: number) => {
    try {
      await userApi.post(ENDPOINTS.BLOCK.BLOCKS(targetUserId));
      return { ok: true };
    } catch (error: any) {
      if (__DEV__) {
        console.log('[postBlockUser] error: ', error);
        console.log('[postBlockUser] error code: ', error.response.data.code);
        console.log('[postBlockUser] error msg: ', error.response.data.msg);
        console.log('[postBlockUser] error detailMsg: ', error.response.data.detailMsg);
        console.log('[postBlockUser] error data: ', error.response.data.data);
      }
    }
  };

  // 사용자 차단 해제
  const deleteBlockedUser = async (targetUserId: number) => {
    try {
      await userApi.delete(ENDPOINTS.BLOCK.BLOCKS(targetUserId));
      return { ok: true };
    } catch (error: any) {
      if (__DEV__) {
        console.log('[deleteBlockedUser] error: ', error);
        console.log('[deleteBlockedUser] error code: ', error.response.data.code);
        console.log('[deleteBlockedUser] error msg: ', error.response.data.msg);
        console.log('[deleteBlockedUser] error detailMsg: ', error.response.data.detailMsg);
        console.log('[deleteBlockedUser] error data: ', error.response.data.data);
      }
    }
  };

  // 차단한 사용자 목록 조회
  const getBlockedUser = async () => {
    try {
      const response = await userApi.get(ENDPOINTS.BLOCK.BLOCK);
      // console.log('[getBlockedUser][SUCCESS]: ', response.data.data);
      return response.data.data;
    } catch (error) {
      if (__DEV__) {
        console.log('[getBlockedUser] error: ', error);
      }
    }
  };

  // 특정(상대) 사용자 프로필 조회
  const getSellerProfile = async (userId: number) => {
    try {
      const response = await userApi.get(ENDPOINTS.PROFILE.SELLER_PROFILE(userId));
      // console.log('[getSellerProfile]: ', response.data.data);
      return response.data.data;
    } catch (error) {
      if (__DEV__) {
        console.log('[getSellerProfile] error: ', error);
      }
      throw error;
    }
  };

  return {
    getProfile,
    updateProfile,
    validateNickname,
    postBlockUser,
    deleteBlockedUser,
    getBlockedUser,
    getSellerProfile,
  };
};

export default useUserApi;
