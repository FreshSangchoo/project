import Config from 'react-native-config';
import * as TalkPlus from 'talkplus-sdk';

type TPClient = InstanceType<typeof TalkPlus.Client>;
let client: TPClient | null = null;
let loggedUserId: string | null = null;

export interface TPMessage {
  id: string;
  channelId: string;
  userId: string;
  username?: string;
  profileImageUrl?: string;
  type: 'text' | 'hidden' | 'custom';
  text?: string;
  data?: Record<string, string>;
  reactions?: Record<string, string[]>;
  createdAt: number;
}

export interface PostCardPayload {
  id: number;
  brandName?: string;
  modelName?: string;
  price?: number | string;
  thumbnail?: string;
}

export interface TPImageItem {
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  name?: string;
  size?: number;
}

export interface TPImageGroupPayload {
  items: TPImageItem[];
}

export type RNFile = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

type Extra = Record<string, string>;

export function getTalkClient(): TPClient {
  if (!client) {
    const APP_ID = Config.TALKPLUS_APP_ID;
    client = new TalkPlus.Client({ appId: APP_ID! });
  }
  return client!;
}

// 익명 로그인
export async function loginAnonymous(params: { userId: string; username?: string; profileImageUrl?: string }) {
  const c = getTalkClient();

  if (loggedUserId === params.userId) return c;

  if (loggedUserId && loggedUserId !== params.userId) {
    try {
      await c.logout();
    } catch {}
  }

  await c.loginAnonymous({
    userId: String(params.userId),
    username: params.username ?? String(params.userId),
    profileImageUrl: params.profileImageUrl ?? '',
  });

  loggedUserId = String(params.userId);
  if (__DEV__) {
    console.log('[loginAnonymous] success: ', loggedUserId);
  }

  return c;
}

// 토큰으로 로그인
export async function loginWithToken(userId: string, token: string): Promise<TPClient> {
  const c = getTalkClient();

  if (loggedUserId && String(loggedUserId) === String(userId)) return c;

  await c.loginWithToken({ userId: userId, loginToken: token });

  loggedUserId = userId;
  if (__DEV__) {
    console.log('[loginWithToken] success: ', loggedUserId);
  }
  return c;
}

// 로그아웃
export function clearTalkSession() {
  client?.logout();
  loggedUserId = null;
}

// 메시지 전송(텍스트)
export async function sendTextMessage(params: { channelId: string; text: string; data?: Record<string, string> }) {
  const c = getTalkClient();
  const text = params.text?.trim();
  if (!text) {
    throw new Error('empty-text');
  }

  const response = await (c as any).sendMessage({
    channelId: params.channelId,
    type: 'text',
    text,
    data: params.data,
  });

  return response as { message: TPMessage };
}

// 매물 카드 전송
export async function sendMerchandiseCard(params: {
  channelId: string;
  post: PostCardPayload;
  data?: Extra;
}): Promise<{ message: TPMessage }> {
  const { channelId, post, data } = params;
  if (!channelId) throw new Error('channelId is required');
  if (!post?.id) throw new Error('post.id is required');

  const c = getTalkClient();

  const payload: Record<string, string> = {
    ...(data ?? {}),
    kind: 'postCard',
    postId: String(post.id),
    brandName: post.brandName ?? '',
    modelName: post.modelName ?? '',
    price: post.price !== undefined ? String(post.price) : '',
    thumbnail: post.thumbnail ?? '',
  };

  const resp = await (c as any).sendMessage({
    channelId,
    type: 'custom',
    data: payload,
  });

  return resp as { message: TPMessage };
}

// 단일 파일(사진/동영상/문서) 전송
export async function sendFileMessage(params: {
  channelId: string;
  file: RNFile;
  text?: string;
  data?: Record<string, string>;
}): Promise<{ message: TPMessage }> {
  const { channelId, file, text, data } = params;
  if (!channelId) throw new Error('channelId is required');
  if (!file?.uri) throw new Error('file is required');

  const c = getTalkClient();

  const mime = file.type || 'application/octet-stream';
  const safeData: Record<string, string> = {
    fileKind: inferFileKind(mime),
    fileName: file.name ?? '',
    fileMime: mime,
    fileSize: String(file.size),
    ...(data ?? {}),
  };

  const resp = await (c as any).sendMessage({
    channelId,
    type: 'text',
    text: text ?? '',
    data: safeData,
    file,
  });

  return resp as { message: TPMessage };
}

function inferFileKind(mime?: string) {
  if (!mime) return 'other';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'other';
}

// 다중 사진 전송
export async function sendImageGroupMessage(params: {
  channelId: string;
  items: TPImageItem[];
}): Promise<{ message: TPMessage }> {
  const { channelId, items } = params;
  if (!channelId) throw new Error('channelId is required');
  if (!Array.isArray(items) || items.length === 0) throw new Error('items is empty');

  const payloadStr = JSON.stringify({ items } as TPImageGroupPayload);

  const c = getTalkClient();
  const resp = await (c as any).sendMessage({
    channelId,
    type: 'custom',
    data: {
      kind: 'imageGroup',
      payload: payloadStr,
    },
  });

  return resp as { message: TPMessage };
}

export const isImageGroupMessage = (m: TPMessage) => m?.type === 'custom' && m?.data?.kind === 'imageGroup';

export const parseImageGroupPayload = (m: TPMessage): TPImageGroupPayload | null => {
  try {
    if (!isImageGroupMessage(m)) return null;
    return JSON.parse(m?.data?.payload || '{}') as TPImageGroupPayload;
  } catch {
    return null;
  }
};

// 메시지 조회
export async function getMessages(params: {
  channelId: string;
  limit?: number;
  order?: 'latest' | 'oldest';
  lastMessageId?: string;
}) {
  const c = getTalkClient();
  const response = await (c as any).getMessages(params);
  return response as { messages: TPMessage[]; hasNext: boolean };
}

// 읽음 처리
export async function markChannelRead(channelId: string) {
  const c = getTalkClient();
  await (c as any).markAsRead({ channelId });
}

// 채널에 멤버 추가
export async function addChannelMembers(params: { channelId: string; members: (string | number)[] }) {
  const c = getTalkClient();

  await (c as any).addChannelMembers({
    channelId: params.channelId,
    members: params.members.map(String),
  });
}

// 채팅 토큰 발급 전역 세션
type LoginResp = { loginToken: string; expiresIn?: number };
type GetToken = () => Promise<LoginResp>;

let inFlight: Promise<void> | null = null;
let expiresAt = -1; // ms (-1 = 초기 상태, 즉시 발급 필요)
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10분
const SAFETY_MARGIN_MS = 30 * 1000; // 만료 30초 전에 미리 재발급

export async function ensureChatToken(getToken: GetToken, userId: string, force = false) {
  const now = Date.now();

  // force=true 또는 토큰이 만료되었으면 재발급
  // 안전 마진을 두어 만료 30초 전에 미리 재발급
  const shouldReissue = force || now >= expiresAt - SAFETY_MARGIN_MS;
  if (!shouldReissue) return;

  // 이미 재발급 중이면 그것을 기다림 (중복 요청 방지)
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const { loginToken, expiresIn } = await getToken();
      await loginWithToken(String(userId), loginToken);

      // expiresIn이 없으면 DEFAULT_TTL_MS 사용, 있으면 초 단위를 ms로 변환
      const ttl = typeof expiresIn === 'number' && expiresIn > 0 ? expiresIn * 1000 : DEFAULT_TTL_MS;
      expiresAt = Date.now() + ttl;

      if (__DEV__) {
        console.log(`[ensureChatToken] Token refreshed for user ${userId}, expires in ${ttl}ms`);
      }
    } catch (e) {
      // 재발급 실패 시 30초 후 재시도하도록 설정
      expiresAt = Date.now() + 30 * 1000;
      if (__DEV__) {
        console.log('[ensureChatToken] Token refresh failed, will retry in 30s:', e);
      }
      throw e;
    }
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
