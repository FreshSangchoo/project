import { BlockedUserCardProps } from '@/components/common/user-card/BlockedUserCard';

export interface UserInfo {
  userId: number;
  nickname: string;
  profileImage: string | null;
  verified: boolean;
  withdrawn: boolean;
}

export interface BlockedUser {
  userInfo: UserInfo;
  blockedAt: string;
}

const formatYMDWithDots = (input: string): string => {
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return input;
  return `${m[1]}.${m[2]}.${m[3]}.`;
};

export function blockedUserToCard(userInfo: UserInfo, blockedAt: string): BlockedUserCardProps {
  return {
    profileImage: userInfo.profileImage || null,
    nickname: userInfo.nickname,
    userId: String(userInfo.userId),
    blockedUserDate: formatYMDWithDots(blockedAt),
    isBlocked: true,
  };
}
