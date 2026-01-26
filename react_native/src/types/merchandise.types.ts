export type MerchandiseData = {
  id: number;
  writer: { userId: number; nickname: string; profileImage: string; verified: boolean; withdrawn: boolean };
  price: string;
  saleStatus: 'ON_SALE' | 'RESERVED' | 'SOLD_OUT';
  condition: 'NEW' | 'VERY_GOOD' | 'GOOD' | 'NORMAL' | 'DEFECTIVE';
  exchangeAvailable: boolean; // 교환 가능 칩
  deliveryAvailable: boolean; // 택배가능 칩
  localDealAvailable: boolean; // 직거래 칩
  regions: string[]; // 지역 칩
  partChange: boolean; // 부품 교체 칩
  custom: boolean; // 커스텀 칩
  createdAt: string; // 몇분 전
  likeCount: number; // 좋아요 수
  viewCount: number; /// 조회수
  isLiked: boolean; // 좋아요 여부
  modelResponse: {
    modelId: number;
    modelName: string;
    brandId: number;
    brandName: string;
    brandKorName?: string;
    effectTypes: string[];
    isUnbrandedOrCustom?: boolean;
  };
  postImages: string[];
  description: string;
  deliveryInfoResponse?: { deliveryFeeIncluded?: boolean; deliveryFee?: number };
};
