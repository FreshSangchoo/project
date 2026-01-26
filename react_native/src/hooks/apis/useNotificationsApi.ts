import { ENDPOINTS } from '@/config';
import useApi from '@/hooks/apis/useApi';
import { CATEGORY } from '@/pages/notification/constant/notification';

export interface notificationProps {
  notificationId: number;
}

export interface notificationPageProps {
  page: number;
  size: number;
}

export interface NotificationContentProps {
  notificationId: number;
  category: keyof typeof CATEGORY;
  title: string;
  body: string;
  readAt: string | null;
  sentAt: string;
  read: boolean;
}

export interface NotificationsResponse {
  notifications: NotificationContentProps[];
  totalCount: number;
  unreadCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
}

export const useNotificationsApi = () => {
  const { notificationsApi } = useApi();

  const patchNotification = ({ notificationId }: notificationProps) => {
    return notificationsApi
      .patch(ENDPOINTS.NOTIFICATIONS.PATCH(notificationId))
      .then(response => {
        if (__DEV__) {
          console.log(response);
        }
        if (response.status === 200) return response.data;
      })
      .catch(error => {
        if (error.response?.status === 400) return true;
      });
  };

  const getNotifications = ({ page, size }: notificationPageProps) => {
    return notificationsApi
      .get('', {
        params: { page, size },
      })
      .then(response => {
        if (response.status === 200) return response.data;
      })
      .catch(error => {
        if (error.response?.status === 400) return true;
      });
  };

  return {
    patchNotification,
    getNotifications,
  };
};
