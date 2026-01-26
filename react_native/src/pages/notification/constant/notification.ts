export const NOTIFICATION_PAGE_SIZE = 7;

export const CATEGORY = {
  ANNOUNCEMENT: '공지사항',
  MARKETING: '이벤트·광고',
  WELCOME: '가입 축하',
} as const;

export type CategoryKey = keyof typeof CATEGORY;

export type CategoryValue = (typeof CATEGORY)[CategoryKey];
