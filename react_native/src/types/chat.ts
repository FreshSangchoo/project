export interface ChannelNotificationSettings {
  enabled: boolean;
  pushNotificationSoundAos: string;
  pushNotificationSoundIos: string;
}

export type ChatUserExtraData = Record<string, string>;

export interface ChatUser {
  id: string;
  username: string;
  profileImageUrl: string;
  disablePushNotification: boolean;
  data: ChatUserExtraData;
  updatedAt: number;
  createdAt: number;
}

export interface ChatUserResponse {
  user: ChatUser;
  loginToken: string;
}

export interface ChatMember {
  id: string;
  username: string;
  profileImageUrl: string;
  data: Record<string, any>;
  memberInfo: Record<string, any>;
  lastReadAt: number;
  lastSentAt: number;
  updatedAt: number;
  createdAt: number;
}

export interface OriginChatMember {
  userId: number;
  nickname: string;
  profileImage: string;
  verfied: boolean;
  joinDate: string;
  withdrawn: boolean;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  profileImageUrl: string;
  type: string;
  text: string;
  data: Record<string, any>;
  parentMessage: Record<string, any>;
  translations: Record<string, any>;
  reactions: Record<string, number>;
  ownReactions: string[];
  createdAt: number;
}

export interface ChatChannel {
  id: string;
  name: string;
  ownerId: string;
  type: string;
  imageUrl: string;
  invitationCode: string;
  hideMessagesBeforeJoin: boolean;
  category: string;
  subcategory: string;
  privateTag: string;
  privateData: Record<string, any>;
  memberCount: number;
  maxMemberCount: number;
  data: Record<string, string>;
  members: ChatMember[];
  originMembers: OriginChatMember[];
  mutedUsers: string[];
  bannedUsers: string[];
  bots: Record<string, any>[];
  updatedAt: number;
  createdAt: number;
  unreadCount: number;
  lastReadAt: number;
  lastMessage: ChatMessage;
  frozen: boolean;
}

export interface ChannelsPayload {
  channels: ChatChannel[];
  hasNext: boolean;
}
