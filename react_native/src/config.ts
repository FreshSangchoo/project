import Config from 'react-native-config';

export const BASE_URL = Config.API_URL;
export const NAVER_CONSUMER_KEY = Config.NAVER_CONSUMER_KEY;
export const NAVER_CONSUMER_SECRET = Config.NAVER_CONSUMER_SECRET;
export const NAVER_SERVICE_URL_SCHEME_IOS = Config.NAVER_SERVICE_URL_SCHEME_IOS;
export const NOTION_WEBHOOK_URL = Config.NOTION_WEBHOOK_URL;
export const NOTION_WEBHOOK_VALUE = Config.NOTION_WEBHOOK_VALUE;
export const DANAL_CPID = Config.DANAL_CPID;

export const ENDPOINTS = {
  AUTH: {
    SIGNUP: '/signup',
    SIGNIN: (provider: string) => `/signin/${provider}`,
    REISSUE: '/reissue',
    CODE_VERIFY: '/verify-code',
    CODE_SEND: '/send-code',
    PASSWORD_VERIFY: '/password/verify',
    PASSWORD_RESET: '/password/reset',
    PASSWORD_CHANGE: '/password/change',
    LOGOUT: '/logout',
    EMAIL_VERIFY: '/verify-code',
    EMAIL_CHECK: '/email/check',
    NICKNAME: '/nickname',
    ANONYMOUS: '/anonymous',
    CREATE_ACCOUNT: '/email/create-account',
    SETTING_PHONE: '/setting-phone',
    FIND_EMAIL: '/find-email',
  },
  DANAL: {
    VERIFY: '/verify',
    TARGET: '/target',
  },
  PROFILE: {
    PROFILE: '/profile',
    NICKNAME: '/nickname',
    SELLER_PROFILE: (id: number) => `/profile/${id}`,
  },
  MYPOST: {
    SOLD: '/sold',
    SELLING: '/selling',
    RECENT: '/recent',
    LIKED: '/liked',
    HIDDEN: '/hidden',
    USER_LIST: (id: number) => `/user/${id}`,
  },
  BLOCK: {
    BLOCK: '/blocks',
    BLOCKS: (id: number) => `/blocks/${id}`,
  },
  RECENT_SEARCHES: {
    GET: '',
    POST: '',
    UNIFIED_SUGGESTIONS: '/unified-suggestions',
    DELETE: (keyword: string) => `/${keyword}`,
    DELETE_ALL: '/all',
  },
  REGION: {
    SIDOS: '/sidos',
    SIGUNGUS: (id: number) => `/sidos/${id}/sigungus`,
  },
  POST: {
    GET: '',
    POST: '', // 등록
    BUMP: (postId: number) => `${postId}/bump`,
    POSTS: (postId: number) => `/${postId}`, // 상세조회, 수정, 삭제
    VISIBLILTY: (postId: number) => `/${postId}/visibility`,
    STATUS: (postId: number) => `/${postId}/status`,
  },
  BRAND: {
    GET: '',
    MODELS: '/models',
  },
  SEARCH: {
    KEYWORD: '/posts',
    MODEL: (modelId: number) => `/posts/model/${modelId}`,
    FILTERS: '/posts/filters',
    BRAND: (brandId: number) => `/posts/brand/${brandId}`,
    REGION: '/region/suggest',
    EFFECT_MODEL: '/effect_model/suggest',
    SUGGEST_BRAND: '/brand/suggest',
  },
  NOTIFICATION: {
    PUSH: '/push',
    MARKETING: '/marketing',
    CHAT: '/chat',
    SETTINGS: '/settings',
    PERMISSION: '/permission',
  },
  WITHDRAWAL: {
    POST: '',
    GET: '/reasons',
  },
  POST_LIKE: {
    GET: (postId: string) => `/${postId}/like`,
    POST: (postId: string) => `/${postId}/like`,
    DELETE: (postId: string) => `/${postId}/like`,
  },
  PRODUCT: {
    POST: '/custom',
  },
  CHAT: {
    NOTIFICATIONS: (channelId: string) => `/${channelId}/notifications`, // 조회(GET), 변경(PUT)
    LEAVE: '/leave', // 채팅방 나가기
    FROM_POST: '/from-post', // 1:1 채팅방 생성 (게시글에서 채팅하기 버튼)
    FCM_TOKEN: '/fcm-token',
    GET: '', // 사용자 참여 채널 목록 조회
    CHANNEL_POSTS: (channelId: string) => `/${channelId}/posts`, // 채팅방별 매물 리스트
  },
  USER_CHAT: {
    LOGIN: '/login', // 채팅 토큰 발급
    GET: '', // 채팅 사용자 정보 조회
  },
  NOTIFICATIONS: {
    GET: '',
    PATCH: (notificationId: number) => `/${notificationId}/read`,
  },
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;
export type EndpointValue =
  (typeof ENDPOINTS)[keyof typeof ENDPOINTS][keyof (typeof ENDPOINTS)[keyof typeof ENDPOINTS]];
