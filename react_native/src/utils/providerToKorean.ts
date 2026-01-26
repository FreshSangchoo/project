import { Provider } from '@/types/user';

export const normalizeProvider = (raw: string): Provider | null => {
  const key = (raw || '').trim().toUpperCase();
  if (!key) return null;
  const allowed: Provider[] = ['LOCAL', 'KAKAO', 'NAVER', 'FIREBASE', 'GOOGLE'];
  return (allowed as string[]).includes(key) ? (key as Provider) : null;
};

export const providerToKorean = (provider: Provider | null) => {
  switch (provider) {
    case 'LOCAL':
      return '이메일';
    case 'KAKAO':
      return '카카오';
    case 'NAVER':
      return '네이버';
    case 'FIREBASE':
      return 'Apple';
    case 'GOOGLE':
      return '구글';
    default:
      return '이메일';
  }
};
