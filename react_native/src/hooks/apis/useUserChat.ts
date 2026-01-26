import { ENDPOINTS } from '@/config';
import useApi from '@/hooks/apis/useApi';
import { ChatUserResponse } from '@/types/chat';

const useUserChatApi = () => {
  const { userChatApi } = useApi();

  // 사용자 채팅 토큰 발급
  const postChatUserLogin = async () => {
    try {
      const response = await userChatApi.post(ENDPOINTS.USER_CHAT.LOGIN, {}, { suppressGlobalErrorToast: true });
      if (__DEV__) {
        console.log('[postChatUserLogin] login: 성공: ', response.data);
      }
      return response.data;
    } catch (error: any) {
      //console.log('[postChatUserLogin] error: ', error);
      throw error;
    }
  };

  // 채팅 사용자 정보 조회
  const getChatUser = async (): Promise<ChatUserResponse> => {
    try {
      const response = await userChatApi.get<{ data: ChatUserResponse }>(ENDPOINTS.USER_CHAT.GET);
      if (__DEV__) {
        console.log('[getChatUser] get: ', response.data);
      }
      return response.data.data;
    } catch (error) {
      if (__DEV__) {
        console.log('[getChatUser] error: ', error);
      }
      throw error;
    }
  };

  return { postChatUserLogin, getChatUser };
};

export default useUserChatApi;
