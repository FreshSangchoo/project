import { ENDPOINTS } from '@/config';
import useApi from '@/hooks/apis/useApi';
import { ChannelNotificationSettings, ChannelsPayload } from '@/types/chat';

export type FromPostResp = {
  channelId: string;
  name?: string;
  ownerId?: string;
  type?: string;
  memberCount?: number;
  maxMemberCount?: number;
  createdAt?: number;
  updatedAt?: number;
  reused: boolean;
  members?: Array<{
    id: string;
    username?: string;
    profileImageUrl?: string;
    lastReadAt?: number;
    lastSentAt?: number;
    updatedAt?: number;
    createdAt?: number;
    data?: Record<string, string>;
    memberInfo?: Record<string, string>;
  }>;
};

const useChatApi = () => {
  const { chatApi } = useApi();

  // 사용자 참여 채널 목록 조회
  const getChannels = async (lastChannelId?: string): Promise<ChannelsPayload> => {
    try {
      const response = await chatApi.get<{ data: ChannelsPayload }>(ENDPOINTS.CHAT.GET, {
        params: lastChannelId ? { lastChannelId } : undefined,
      });
      if (__DEV__) {
        console.log('[getChannels]: ', response.data.data);
      }
      return response.data.data;
    } catch (error) {
      if (__DEV__) {
        console.log('[getChannels] error: ', error);
      }
      throw error;
    }
  };

  // 채팅방별 문의 매물 리스트 조회
  const getPostsInChannel = async (channelId: string) => {
    try {
      const response = await chatApi.get(ENDPOINTS.CHAT.CHANNEL_POSTS(channelId));
      if (__DEV__) {
        console.log('[getPostsInChannel]: ', response.data.data);
      }
      return response.data.data;
    } catch (error) {
      if (__DEV__) {
        console.log('[getPostsInChannel] error: ', error);
      }
      throw error;
    }
  };

  // TalkPlus FCM 토큰 등록
  const postChannelFCMToken = async (fcmToken: string, deviceId: string) => {
    try {
      await chatApi.post(ENDPOINTS.CHAT.FCM_TOKEN, { fcmToken, deviceId }, { suppressGlobalErrorToast: true });
      return { ok: true };
    } catch (error) {
      if (__DEV__) {
        console.log('[postChannelFCMToken] error: ', error);
      }
      throw error;
    }
  };

  // 게시글 기반 1:1 채팅방 생성
  const postChannelFromPost = async (postId: number): Promise<FromPostResp> => {
    try {
      const response = await chatApi.post(ENDPOINTS.CHAT.FROM_POST, { postId });
      if (__DEV__) {
        console.log('[postChannelFromPost] response: ', response.data);
      }
      return response.data.data;
    } catch (error) {
      if (__DEV__) {
        console.log('[postChannelFromPost] error: ', error);
      }
      throw error;
    }
  };

  // 채팅방 나가기
  const postLeaveChannel = async (channelId: string) => {
    try {
      await chatApi.post(ENDPOINTS.CHAT.LEAVE, { channelId });
      return { ok: true };
    } catch (error) {
      if (__DEV__) {
        console.log('[postLeaveChannel] error: ', error);
      }
      throw error;
    }
  };

  // 채널별 푸시 알림 설정 조회
  const getChannelNotifications = async (channelId: string) => {
    try {
      const { data } = await chatApi.get<{
        data: ChannelNotificationSettings;
      }>(ENDPOINTS.CHAT.NOTIFICATIONS(channelId));
      // console.log('[getChannelNotifications]: ', data.data);
      return data.data;
    } catch (error) {
      if (__DEV__) {
        console.log('[getChannelNotifications] error: ', error);
      }
      throw error;
    }
  };

  // 채널별 푸시 알림 설정 변경
  const putChannelNotifications = async (channelId: string, enabled: boolean) => {
    try {
      await chatApi.put(ENDPOINTS.CHAT.NOTIFICATIONS(channelId), { enabled });
      return { ok: true };
    } catch (error) {
      if (__DEV__) {
        console.log('[putChannelNotifications] error: ', error);
      }
      throw error;
    }
  };

  return {
    getChannels,
    getPostsInChannel,
    postChannelFCMToken,
    postChannelFromPost,
    postLeaveChannel,
    getChannelNotifications,
    putChannelNotifications,
  };
};

export default useChatApi;
