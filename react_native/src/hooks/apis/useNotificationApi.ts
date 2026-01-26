import { ENDPOINTS } from '@/config';
import useApi from '@/hooks/apis/useApi';

export interface putMarketingNotificationProps {
  marketingEnabled: boolean;
}
export interface putPushNotificationProps {
  pushEnabled: boolean;
}

export interface putChatNotificationProps {
  chatEnabled: boolean;
}

export interface permissionNotificationProps {
  deviceToken: string;
  permissionEnabled: boolean;
}
export interface getNotificationSettingProps {
  chatEnabled: boolean;
  hasDeviceToken: boolean;
  marketingEnabled: boolean;
  marketingSettingChangedAt: string | null;
  permissionEnabled: boolean;
  pushEnabled: boolean;
}

export const useNotificationApi = () => {
  const { notificationApi } = useApi();

  //전체 알림 동의 여부
  const putNotificationPush = ({ pushEnabled }: putPushNotificationProps) => {
    return notificationApi
      .put(ENDPOINTS.NOTIFICATION.PUSH, { pushEnabled })
      .then(response => {
        if (response.status === 200) return response.data;
      })
      .catch(error => {
        if (error.response?.status === 400) return true;
      });
  };

  //마케팅 수신 알람
  const putNotificationMarketing = ({ marketingEnabled }: putMarketingNotificationProps) => {
    return notificationApi
      .put(ENDPOINTS.NOTIFICATION.MARKETING, { marketingEnabled })
      .then(response => {
        if (response.status === 200) return response.data;
      })
      .catch(error => {
        if (error.response?.status === 400) return true;
      });
  };

  const putNotificationChat = ({ chatEnabled }: putChatNotificationProps) => {
    return notificationApi
      .put(ENDPOINTS.NOTIFICATION.CHAT, { chatEnabled })
      .then(response => {
        if (response.status === 200) return response.data;
      })
      .catch(error => {
        if (error.response?.status === 400) return true;
      });
  };

  const postNotificationPermission = ({ deviceToken, permissionEnabled }: permissionNotificationProps) => {
    return notificationApi
      .post(ENDPOINTS.NOTIFICATION.PERMISSION, { deviceToken, permissionEnabled })
      .then(response => {
        if (response.status === 200) return response.data;
      })
      .catch(error => {
        if (error.response?.status === 400) return true;
      });
  };

  //현재 사용자의 push 알람 설정 상태 조회
  const getNotificationSetting = () => {
    return notificationApi
      .get(ENDPOINTS.NOTIFICATION.SETTINGS)
      .then(response => {
        if (response.status === 200) return response.data;
      })
      .catch(error => {
        if (error.response?.status === 400) return true;
      });
  };

  return {
    putNotificationMarketing,
    putNotificationPush,
    putNotificationChat,
    getNotificationSetting,
    postNotificationPermission,
  };
};
