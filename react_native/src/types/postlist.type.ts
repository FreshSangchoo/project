import { ReactNode } from 'react';
import { ChipVariant } from '@/components/common/Chip';

export interface Writer {
  userId: number;
  nickname: string;
  profileImage: string;
  verified: boolean;
  withdrawn: boolean;
}

export type SaleStatus = 'ON_SALE' | 'SOLD_OUT' | 'RESERVED';

export interface DeliveryInfoResponse {
  deliveryFeeIncluded: boolean;
  deliveryFee: number;
}

export interface PostList {
  id: number;
  writer: Writer;
  price: string;
  saleStatus: SaleStatus;
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
  thumbnail: string;
  deliveryInfoResponse: DeliveryInfoResponse;
  effectTypes: string[];
  isUnbrandedOrCustom: boolean;
}

export interface PostListResponse {
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
  posts: PostList[];
}

export interface PageParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface ChipData {
  text: string;
  variant?: ChipVariant;
  icon?: ReactNode;
}

export const conditionMap: Record<string, string> = {
  NEW: '신품',
  VERY_GOOD: '매우 양호',
  GOOD: '양호',
  NORMAL: '보통',
  DEFECTIVE: '하자/고장',
};
