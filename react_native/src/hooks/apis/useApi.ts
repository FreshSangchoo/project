import { BASE_URL } from '@/config';
import axios, { AxiosInstance } from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useToastStore } from '@/stores/toastStore';

interface ExtraConfig {
  suppressGlobalErrorToast?: boolean;
  _retry?: boolean;
}

// AxiosRequestConfig 확장
declare module 'axios' {
  interface AxiosRequestConfig {
    suppressGlobalErrorToast?: boolean;
    _retry?: boolean;
  }
}

// 토큰 재발급 중 상태 추적 (전역)
let isReissuing = false;
let reissuePromise: Promise<boolean> | null = null;

const attachAuthInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.request.use(async config => {
    const token = await EncryptedStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      // 토큰이 없으면 Authorization 헤더 제거
      delete config.headers['Authorization'];
    }

    return config;
  });

  instance.interceptors.response.use(
    res => res,
    async error => {
      const cfg = (error?.config || {}) as ExtraConfig;
      const status = error?.response?.status;
      const isNetwork = !error?.response;
      const isServer = status >= 500 && status < 600;

      // 401 Unauthorized: 토큰 재발급 시도
      if (status === 401 && !cfg._retry) {
        cfg._retry = true;

        try {
          const refreshToken = await EncryptedStorage.getItem('refreshToken');
          if (!refreshToken) {
            // refreshToken이 없으면 재발급 불가 → 로그아웃 상태
            if (__DEV__) {
              console.log('[attachAuthInterceptor] No refreshToken, cannot reissue');
            }
            return Promise.reject(error);
          }

          // 이미 재발급 중이면 그 프로미스 기다림
          if (isReissuing && reissuePromise) {
            const success = await reissuePromise;
            if (success) {
              // 토큰이 갱신되었으므로 원래 요청 재시도
              const newToken = await EncryptedStorage.getItem('accessToken');
              if (newToken) {
                (cfg as any).headers['Authorization'] = `Bearer ${newToken}`;
                return instance(cfg);
              }
            }
            // 재발급 실패 → 원래 에러 반환
            return Promise.reject(error);
          }

          // 재발급 시작
          isReissuing = true;
          reissuePromise = (async () => {
            try {
              // authApi를 사용하여 토큰 재발급
              const response = await axios.post(
                `${BASE_URL}/auth/reissue`,
                { refreshToken },
                {
                  headers: {
                    'Authorization': `Bearer ${refreshToken}`,
                  },
                  suppressGlobalErrorToast: true,
                },
              );

              const newAccessToken = response.data?.data?.accessToken;
              const newRefreshToken = response.data?.data?.refreshToken;

              if (newAccessToken) {
                await EncryptedStorage.setItem('accessToken', String(newAccessToken));
              }
              if (newRefreshToken) {
                await EncryptedStorage.setItem('refreshToken', String(newRefreshToken));
              }

              if (__DEV__) {
                console.log('[attachAuthInterceptor] Token reissued successfully');
              }
              return true;
            } catch (reissueError) {
              // 재발급 실패 = refreshToken도 만료됨 → 토큰 삭제
              if (__DEV__) {
                console.log('[attachAuthInterceptor] Token reissue failed:', reissueError);
              }
              await EncryptedStorage.removeItem('accessToken');
              await EncryptedStorage.removeItem('refreshToken');
              return false;
            } finally {
              isReissuing = false;
              reissuePromise = null;
            }
          })();

          const success = await reissuePromise;
          if (success) {
            // 토큰이 갱신되었으므로 원래 요청 재시도
            const newToken = await EncryptedStorage.getItem('accessToken');
            if (newToken) {
              (cfg as any).headers['Authorization'] = `Bearer ${newToken}`;
              return instance(cfg);
            }
          }
          // 재발급 실패 → 원래 에러 반환
          return Promise.reject(error);
        } catch (e) {
          if (__DEV__) {
            console.log('[attachAuthInterceptor] Unexpected error during reissue:', e);
          }
          return Promise.reject(error);
        }
      }

      if (!cfg?.suppressGlobalErrorToast && (isNetwork || isServer)) {
        useToastStore.getState().show({ variant: 'alert', duration: 2000, message: '' });
      }
      return Promise.reject(error);
    },
  );
};

const useApi = () => {
  const api = axios.create({
    baseURL: BASE_URL,
  });
  const authApi = axios.create({
    baseURL: BASE_URL + '/auth',
  });
  const danalApi = axios.create({
    baseURL: BASE_URL + '/danal',
  });
  const userApi = axios.create({
    baseURL: BASE_URL + '/user',
  });
  const myPostsApi = axios.create({
    baseURL: BASE_URL + '/my-posts',
  });
  const recentSearchApi = axios.create({
    baseURL: BASE_URL + '/recent-searches',
  });
  const regionApi = axios.create({
    baseURL: BASE_URL + '/regions',
  });
  const postApi = axios.create({
    baseURL: BASE_URL + '/posts',
  });
  const brandApi = axios.create({
    baseURL: BASE_URL + '/brands',
  });
  const searchApi = axios.create({
    baseURL: BASE_URL + '/search',
  });
  const notificationApi = axios.create({
    baseURL: BASE_URL + '/user/notifications',
  });
  const notificationsApi = axios.create({
    baseURL: BASE_URL + '/notifications',
  });
  const withdrawalApi = axios.create({
    baseURL: BASE_URL + '/user/withdrawal',
  });
  const postLikeApi = axios.create({
    baseURL: BASE_URL + '/postLike',
  });
  const productApi = axios.create({
    baseURL: BASE_URL + '/products',
  });
  const chatApi = axios.create({
    baseURL: BASE_URL + '/chat/channels',
  });
  const userChatApi = axios.create({
    baseURL: BASE_URL + '/chat/user',
  });
  // postSignup용 Interceptor 없는 API (임시 토큰 사용)
  const authApiNoInterceptor = axios.create({
    baseURL: BASE_URL + '/auth',
  });

  attachAuthInterceptor(api);
  attachAuthInterceptor(userApi);
  attachAuthInterceptor(danalApi);
  attachAuthInterceptor(myPostsApi);
  attachAuthInterceptor(recentSearchApi);
  attachAuthInterceptor(regionApi);
  attachAuthInterceptor(postApi);
  attachAuthInterceptor(brandApi);
  attachAuthInterceptor(searchApi);
  attachAuthInterceptor(notificationApi);
  attachAuthInterceptor(withdrawalApi);
  attachAuthInterceptor(postLikeApi);
  attachAuthInterceptor(authApi);
  attachAuthInterceptor(productApi);
  attachAuthInterceptor(chatApi);
  attachAuthInterceptor(userChatApi);
  attachAuthInterceptor(notificationsApi);

  return {
    api,
    authApi,
    authApiNoInterceptor,
    danalApi,
    userApi,
    myPostsApi,
    recentSearchApi,
    regionApi,
    postApi,
    brandApi,
    searchApi,
    notificationApi,
    withdrawalApi,
    postLikeApi,
    productApi,
    chatApi,
    userChatApi,
    notificationsApi,
  };
};

export default useApi;
