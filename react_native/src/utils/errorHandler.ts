import { useToastStore } from '@/stores/toastStore';

interface ApiError {
  response?: {
    status?: number;
    data?: {
      resultMsg?: string;
      reason?: string;
      message?: string;
      errors?: string;
    };
  };
  message?: string;
}

/**
 * API 에러에서 사용자에게 보여줄 메시지를 추출합니다.
 */
export const getErrorMessage = (error: ApiError, fallbackMessage: string): string => {
  // 서버에서 보낸 사용자 친화적 메시지 우선 사용
  const serverMessage =
    error?.response?.data?.resultMsg ||
    error?.response?.data?.reason ||
    error?.response?.data?.message ||
    error?.response?.data?.errors;

  if (serverMessage && typeof serverMessage === 'string') {
    return serverMessage;
  }

  // 서버 메시지가 없으면 fallback 메시지 사용
  return fallbackMessage;
};

/**
 * 에러를 토스트로 표시합니다.
 * 서버 응답이 있으면 서버 메시지를, 없으면 fallback 메시지를 표시합니다.
 */
export const showErrorToast = (error: ApiError, fallbackMessage: string) => {
  const message = getErrorMessage(error, fallbackMessage);

  useToastStore.getState().show({
    variant: 'alert',
    message,
    duration: 3000
  });
};

/**
 * 네트워크 에러인지 확인합니다.
 */
export const isNetworkError = (error: ApiError): boolean => {
  return !error?.response;
};

/**
 * 서버 에러인지 확인합니다 (5xx).
 */
export const isServerError = (error: ApiError): boolean => {
  const status = error?.response?.status;
  return status ? status >= 500 && status < 600 : false;
};

/**
 * 클라이언트 에러인지 확인합니다 (4xx).
 */
export const isClientError = (error: ApiError): boolean => {
  const status = error?.response?.status;
  return status ? status >= 400 && status < 500 : false;
};