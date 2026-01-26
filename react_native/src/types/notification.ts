export type NotificationCategory = 'MARKETING' | 'NOTICE' | 'WELCOME' | 'SYSTEM' | 'TRANSACTION' | 'CHAT';

export type NotificationItem = {
  notificationId: number;
  title: string;
  body: string;
  category: NotificationCategory;
  readAt: string | null;
  sentAt: string;
  extraData: string | null;
  read: boolean;
};

export type NotificationsResponse = {
  notifications: NotificationItem[];
  totalCount: number;
  unreadCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
};
