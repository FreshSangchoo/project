import type { Asset } from 'react-native-image-picker';
import { TPMessage } from '@/libs/talkplus';

export type AttachmentKind = 'image' | 'video' | 'other';
export type PhotoItem = { url?: string; thumb?: string };

// 시간/포맷
export const toMs = (t: number) => {
  if (!Number.isFinite(t)) return 0;
  if (t < 1e11) return Math.floor(t * 1000);
  if (t < 1e14) return Math.floor(t);
  if (t < 1e17) return Math.floor(t / 1000);
  return Math.floor(t / 1e6);
};

export const isSameDay = (a: number, b: number) => {
  const da = new Date(a),
    db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

export const isSameMinute = (a: number, b: number) => {
  const da = new Date(a),
    db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate() &&
    da.getHours() === db.getHours() &&
    da.getMinutes() === db.getMinutes()
  );
};

export const formatChatTime = (sec: number) => {
  const d = new Date(sec);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 || 12;
  return `${ampm} ${h12}:${m}`;
};

// 유저 id 추출
export const getUid = (m: any) => m?.userId ?? m?.id ?? m?.user?.userId ?? m?.user?.id;

// 이미지 그룹 파싱
export function parseImageGroupItems(m: TPMessage): PhotoItem[] | undefined {
  if (m?.type !== 'custom' || m?.data?.kind !== 'imageGroup') return;
  const raw = (m as any)?.data?.payload;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const items = parsed?.items ?? [];
    return items.map((it: any) => ({
      url: it.url,
      thumb: it.thumbnail || it.thumb,
    }));
  } catch {
    return;
  }
}

// 단일 첨부 파싱
export function extractAttachment(m: TPMessage): {
  url?: string;
  name?: string;
  sizeRaw?: number | string;
  kind: AttachmentKind;
  thumb?: string;
  mime?: string;
} {
  const any = m as any;
  const file = any.file ?? {};
  const url = any.fileUrl || file.url;
  const name = any.data?.fileName;
  const sizeRaw = any.data?.fileSize;
  const mime = any.data?.fileMime || '';

  const kind: AttachmentKind = mime.startsWith('image/')
    ? 'image'
    : mime.startsWith('video/')
    ? 'video'
    : any.data?.fileKind === 'image'
    ? 'image'
    : any.data?.fileKind === 'video'
    ? 'video'
    : 'other';

  const thumb = any.data?.thumbnail || any.data?.thumb;
  return { url, name, sizeRaw, kind, thumb };
}

// 파일 크기 라벨
export function formatFileSize(v?: number | string) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  const KB = 1024,
    MB = KB * 1024;
  if (n < KB) return `${n}B`;
  if (n < MB) return `${Math.round((n / KB) * 10) / 10}KB`;
  return `${Math.round((n / MB) * 10) / 10}MB`;
}

// 파일/이미지그룹 여부
export function isFileMessage(m: TPMessage) {
  const any = m as any;

  return Boolean(any.file || any.fileUrl || m?.data?.uiType === 'file');
}

export function isImageGroupMessage(m: TPMessage) {
  return m?.type === 'custom' && m?.data?.kind === 'imageGroup';
}

// 텍스트/파일/이미지그룹은 읽음 대상, 포스트 카드/백카드는 제외
export function willRenderAsReadEligibleBubble(m: TPMessage) {
  const isPostCard = m.type === 'custom' && m?.data?.kind === 'postCard';
  const isBackPostCard = m.type === 'text' && m?.data?.messageType === 'postInfo';
  const isPlainText = m.type === 'text' && typeof m.text === 'string' && m.text.length > 0;

  // 파일/이미지그룹이면 true
  if (isFileMessage(m) || isImageGroupMessage(m)) return !isPostCard && !isBackPostCard;

  // 일반 텍스트도 대상
  if (isPlainText) return !isPostCard && !isBackPostCard;

  return false;
}

// 마지막 읽음 기준 내 메시지 id
export function computeLastReadMyMsgId(
  messages: TPMessage[],
  otherLastReadAt: number | null,
  myUserId: string | number | undefined,
): string | undefined {
  if (typeof otherLastReadAt !== 'number') return;
  const cutoff = toMs(otherLastReadAt);

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];

    if (String(m.userId) !== String(myUserId)) continue;
    if (!willRenderAsReadEligibleBubble(m)) continue;

    const created = toMs(m.createdAt);

    if (created <= cutoff) return m.id;
  }
}

// 파일 업로드
export function assetToUploadFile(a: Asset) {
  return {
    uri: a.uri!,
    name: a.fileName ?? 'upload',
    type: a.type ?? (a.duration ? 'video/mp4' : 'image/jpeg'),
    size: a.fileSize,
  };
}

export const guessExtFromName = (s?: string) => {
  if (!s) return;
  const base = s.split('?')[0];
  const dot = base.lastIndexOf('.');
  if (dot < 0) return;
  return base.substring(dot + 1).toUpperCase();
};

export const MIME_TO_EXT: Record<string, string> = {
  'audio/mpeg': 'MP3',
  'audio/mp3': 'MP3',
  'audio/mp4': 'M4A',
  'audio/x-m4a': 'M4A',
  'audio/aac': 'AAC',
  'audio/wav': 'WAV',
  'audio/x-wav': 'WAV',
  'audio/flac': 'FLAC',
  'audio/ogg': 'OGG',
  'audio/opus': 'OPUS',
  'video/mp4': 'MP4',
  'video/quicktime': 'MOV',
  'video/x-matroska': 'MKV',
  'application/pdf': 'PDF',
  'application/zip': 'ZIP',
  'application/x-zip-compressed': 'ZIP',
  'text/plain': 'TXT',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/json': 'JSON',
};

export const getFileTypeLabel = (mime?: string, name?: string, url?: string) => {
  const byName = guessExtFromName(name) ?? guessExtFromName(url);
  if (byName) return byName;
  if (mime && MIME_TO_EXT[mime]) return MIME_TO_EXT[mime];
  if (mime) {
    const top = mime.split('/')[0];
    if (top) return top.toUpperCase();
  }
  return 'FILE';
};

export const getFileCategory = (
  mime?: string,
  name?: string,
  url?: string,
  declaredKind?: 'image' | 'video' | 'other',
) => {
  console.log('[chatHelpers] mime: ', mime);
  if (declaredKind === 'video') return 'video' as const;

  if (mime?.startsWith('video/')) return 'video' as const;
  if (mime?.startsWith('audio/')) return 'audio' as const;

  const ext = (guessExtFromName(name) ?? guessExtFromName(url))?.toUpperCase();
  if (ext) {
    const VIDEO_EXT = new Set(['MP4', 'MOV', 'MKV', 'WEBM', 'AVI', 'M4V', '3GP', '3GPP']);
    const AUDIO_EXT = new Set(['MP3', 'M4A', 'AAC', 'WAV', 'FLAC', 'OGG', 'OPUS']);
    if (VIDEO_EXT.has(ext)) return 'video' as const;
    if (AUDIO_EXT.has(ext)) return 'audio' as const;
  }

  return 'other' as const;
};

// 채널 목록에서 특절 channelId 찾기
export async function findChannelByIdPaged(
  getChannelsFn: (lastChannelId?: string) => Promise<any>,
  channelId: string,
  safetyLimit = 20,
): Promise<any | null> {
  let last: string | undefined = undefined;

  for (let i = 0; i < safetyLimit; i++) {
    const payload = await getChannelsFn(last);
    const list = payload?.channels ?? [];

    const found = list.find((c: any) => String(c?.id) === String(channelId));
    if (found) return found;

    if (!payload?.hasNext || list.length === 0) break;
    const tail = list[list.length - 1];
    last = tail?.id ? String(tail.id) : undefined;
    if (!last) break;
  }

  return null;
}

// originMembers에서 상대방 userId 찾기
export function pickOriginMemberId(channel: any, myId?: string | number): string | number | null {
  const my = String(myId);
  const list: any[] = channel?.originMembers ?? [];
  const preferred = list.find(m => String(m?.userId) !== my && !m?.withdrawn);
  if (preferred) return preferred.userId ?? null;

  const anyOther = list.find(m => String(m?.userId) !== my);
  return anyOther?.userId ?? null;
}

// 채널에서 멤버 정보 추출
export function extractMemberSnapshot(
  channel: any,
  targetUserId?: string | number,
): { count: number; ids: Set<string>; otherAvatar?: string; otherLastReadAt?: number } {
  const mems: any[] = channel?.members ?? [];
  const count = mems.length;

  const ids = new Set<string>();
  for (const m of mems) {
    const uid = String(getUid(m));
    ids.add(uid);
  }

  let otherAvatar: string | undefined;
  let otherLastReadAt: number | undefined;

  if (targetUserId != null) {
    const other = mems.find(m => String(getUid(m)) === String(targetUserId));
    if (other) {
      otherLastReadAt = other?.lastReadAt;
      otherAvatar =
        other?.profileImageUrl || other?.profile?.imageUrl || other?.profileUrl || other?.imageUrl || undefined;
    }
  }

  return { count, ids, otherAvatar, otherLastReadAt };
}

// 멤버가 나 혼자인지 판단(상대방이 나갔는지 판단)
export function isOnlyMe(membersCount: number, memberIds: Set<string>, myUserId: string | number | undefined): boolean {
  if (myUserId == null) return false;
  return membersCount === 1 && memberIds.has(String(myUserId));
}

// 채팅 이벤트 관리
import { EventEmitter } from 'events';

class ChatEventEmitter extends EventEmitter {}

export const chatEventEmitter = new ChatEventEmitter();

// 채팅방 나가기 이벤트 타입
export const CHAT_EVENTS = {
  CHANNEL_LEFT: 'channelLeft',
} as const;
