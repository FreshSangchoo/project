import axios from 'axios';
import { NOTION_WEBHOOK_URL, NOTION_WEBHOOK_VALUE } from '@/config';

export type NotionPostItem = {
  id: number;
  writer: {
    userId: number | null;
    nickname: string | null;
    profileImage: string | null;
    verified: boolean;
    joinDate: string | null;
    withdrawn: boolean;
  };
  price: string | null;
  saleStatus: string;
  condition: string;
  exchangeAvailable: boolean;
  deliveryAvailable: boolean;
  localDealAvailable: boolean;
  regions: string[];
  partChange: boolean;
  createdAt: string;
  likeCount: number;
  viewCount: number;
  isLiked: boolean;
  modelName: string;
  brandName: string;
  thumbnail: string | null;
  deliveryInfoResponse: {
    deliveryFeeIncluded: boolean;
    deliveryFee: number | null;
  };
  effectTypes: string[];
  isUnbrandedOrCustom: boolean;
};

export type NotionPostsEnvelope = {
  posts: NotionPostItem[];
};

export type NotionWebhookPayload = {
  eventType: 'create' | 'update';
  idempotencyKey: string;
  modelName: string;
  createdAt: string;
  noId: number;
  price: number | null;
  exchangeAvailable: boolean;
  localDealAvailable: boolean;
  deliveryAvailable: boolean;
  deliveryFee: number | null;
  deliveryFeeIncluded: boolean;
  viewCount: number;
  brandName: string;
  thumbnailUrl?: string | null;
  effectType?: string | null;
  authorUserId?: number | null;
  authorNickname?: string | null;
  authorVerified?: boolean;
  likesCount: number;
  condition: string;
  saleStatus: string;
};

type PostDetailMinimal = {
  id?: number;
  price?: number | string | null;
  saleStatus?: string;
  condition?: string;
  exchangeAvailable?: boolean;
  deliveryAvailable?: boolean;
  localDealAvailable?: boolean;
  regions?: string[];
  partChange?: boolean;
  createdAt?: string;
  likeCount?: number;
  viewCount?: number;
  isLiked?: boolean;
  description?: string;
  postImages?: string[];
  author?: {
    id?: number | null;
    nickname?: string | null;
    profileImage?: string | null;
    verified?: boolean;
    joinDate?: string | null;
    withdrawn?: boolean;
  };
  deliveryInfoResponse?: {
    deliveryFeeIncluded?: boolean;
    deliveryFee?: number | null;
  };
  modelResponse?: {
    modelId?: number;
    modelName?: string;
    brandName?: string;
    effectTypes?: string[];
  };
};

export function mapToNotionPostsEnvelope(p: NotionWebhookPayload, d?: PostDetailMinimal): NotionPostsEnvelope {
  const priceNum = d?.price ?? p.price ?? null;
  const priceStr =
    priceNum === null || priceNum === undefined ? null : typeof priceNum === 'string' ? priceNum : String(priceNum);

  const thumbnail =
    Array.isArray(d?.postImages) && d!.postImages.length > 0 ? d!.postImages[0] : p.thumbnailUrl ?? null;

  const effectTypes =
    d?.modelResponse?.effectTypes && d!.modelResponse!.effectTypes.length > 0
      ? d!.modelResponse!.effectTypes
      : p.effectType
      ? [p.effectType]
      : [];

  const writer = {
    userId: d?.author?.id ?? p.authorUserId ?? null,
    nickname: d?.author?.nickname ?? p.authorNickname ?? null,
    profileImage: d?.author?.profileImage ?? null,
    verified: Boolean(d?.author?.verified ?? p.authorVerified ?? false),
    joinDate: d?.author?.joinDate ?? null,
    withdrawn: Boolean(d?.author?.withdrawn ?? false),
  };

  const item: NotionPostItem = {
    id: p.noId,
    writer,
    price: priceStr,
    saleStatus: d?.saleStatus ?? p.saleStatus,
    condition: d?.condition ?? p.condition,
    exchangeAvailable: Boolean(d?.exchangeAvailable ?? p.exchangeAvailable),
    deliveryAvailable: Boolean(d?.deliveryAvailable ?? p.deliveryAvailable),
    localDealAvailable: Boolean(d?.localDealAvailable ?? p.localDealAvailable),
    regions: Array.isArray(d?.regions) ? d!.regions : [],
    partChange: Boolean(d?.partChange ?? false),
    createdAt: d?.createdAt ?? p.createdAt,
    likeCount: Number(d?.likeCount ?? p.likesCount ?? 0),
    viewCount: Number(d?.viewCount ?? p.viewCount ?? 0),
    isLiked: Boolean(d?.isLiked ?? false),
    modelName: d?.modelResponse?.modelName ?? p.modelName,
    brandName: d?.modelResponse?.brandName ?? p.brandName,
    thumbnail,
    deliveryInfoResponse: {
      deliveryFeeIncluded: Boolean(d?.deliveryInfoResponse?.deliveryFeeIncluded ?? p.deliveryFeeIncluded),
      deliveryFee: d?.deliveryInfoResponse?.deliveryFee ?? p.deliveryFee ?? null,
    },
    effectTypes,
    isUnbrandedOrCustom: false,
  };

  return { posts: [item] };
}

export async function notifyNotionPosts(envelope: NotionPostsEnvelope) {
  try {
    await axios.post(NOTION_WEBHOOK_URL!, envelope, {
      headers: {
        'Content-Type': 'application/json',
        'x-make-apikey': NOTION_WEBHOOK_VALUE,
      },
    });
    if (__DEV__) {
      console.log('[Webhook] sent to Notion (posts envelope):', envelope);
    }
  } catch (error) {
    if (__DEV__) {
      console.log('[Webhook] error:', error);
    }
  }
}
