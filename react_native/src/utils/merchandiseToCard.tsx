import { MerchandiseCardProps } from '@/components/common/merchandise-card/MerchandiseCard';
import { ChipVariant } from '@/components/common/Chip';
import EmojiPackage from '@/assets/icons/EmojiPackage.svg';
import EmojiCounterclockwiseArrowsButton from '@/assets/icons/EmojiCounterclockwiseArrowsButton.svg';
import EmojiWrench from '@/assets/icons/EmojiWrench.svg';
import EmojiNutAndBolt from '@/assets/icons/EmojiNutAndBolt.svg';

interface DetailItem {
  id: number;
  modelResponse: ModelResponse;
  price?: string | number;
  postImages: string[];
  likeCount?: number;
  viewCount?: number;
  createdAt: string;
  isLiked?: boolean;
  saleStatus?: 'ON_SALE' | 'RESERVED' | 'SOLD_OUT';
  condition?: 'NEW' | 'VERY_GOOD' | 'GOOD' | 'NORMAL' | 'DEFECTIVE' | string;
  exchangeAvailable?: boolean;
  deliveryAvailable?: boolean;
  localDealAvailable?: boolean;
  partChange?: boolean;
  regions?: string[];
  isUnbrandedOrCustom?: boolean;
}

interface ModelResponse {
  modelId: number;
  modelName: string;
  brandId: number;
  brandName: string;
  brandKorName?: string;
  effectTypes: string[];
}

interface PostItem {
  id: number;
  brandName?: string;
  modelName?: string;
  price?: string | number;
  thumbnail?: string | null;
  likeCount?: number;
  viewCount?: number;
  createdAt: string;
  isLiked?: boolean;
  saleStatus?: 'ON_SALE' | 'RESERVED' | 'SOLD_OUT';
  condition?: 'NEW' | 'VERY_GOOD' | 'GOOD' | 'NORMAL' | 'DEFECTIVE' | string;
  exchangeAvailable?: boolean;
  deliveryAvailable?: boolean;
  localDealAvailable?: boolean;
  partChange?: boolean;
  regions?: string[];
  isUnbrandedOrCustom?: boolean;
  effectTypes?: string[];
}

interface ChipData {
  text: string;
  variant?: ChipVariant;
  icon?: React.ReactNode;
}

export const koCondition = (condition: PostItem['condition']): string => {
  switch (condition) {
    case 'NEW':
      return '신품';
    case 'VERY_GOOD':
      return '매우 양호';
    case 'GOOD':
      return '양호';
    case 'NORMAL':
      return '보통';
    case 'DEFECTIVE':
      return '하자/고장';
    default:
      return String(condition ?? '');
  }
};

export const enCondition = (condition: string): 'NEW' | 'VERY_GOOD' | 'GOOD' | 'NORMAL' | 'DEFECTIVE' => {
  switch (condition) {
    case '신품':
      return 'NEW';
    case '매우 양호':
      return 'VERY_GOOD';
    case '양호':
      return 'GOOD';
    case '보통':
      return 'NORMAL';
    case '하자/고장':
      return 'DEFECTIVE';
    default:
      return 'NORMAL';
  }
};

export function buildMerchandiseChips(post: PostItem): ChipData[] {
  const chips: ChipData[] = [];

  // 1. 이펙터 타입
  post.effectTypes?.map(item => {
    chips.push({ text: item });
  });

  // 2. 상태
  chips.push({ text: koCondition(post.condition), variant: 'condition' });

  // 3. 직거래 주소지
  if (post.regions?.length) chips.push({ text: post.regions[0] });

  // 4. 택배 가능
  if (post.deliveryAvailable) {
    chips.push({
      text: '택배가능',
      variant: 'brand',
      icon: <EmojiPackage width={16} height={16} />,
    });
  }

  // 5. 교환 가능
  if (post.exchangeAvailable)
    chips.push({
      text: '교환가능',
      icon: <EmojiCounterclockwiseArrowsButton width={16} height={16} />,
    });

  // 6. 커스텀
  if (post.isUnbrandedOrCustom)
    chips.push({
      text: '커스텀',
      icon: <EmojiWrench width={16} height={16} />,
    });

  // 7. 부품 교체
  if (post.partChange)
    chips.push({
      text: '부품교체',
      icon: <EmojiNutAndBolt width={16} height={16} />,
    });

  return chips;
}

export function merchandiseToCard(post: PostItem): MerchandiseCardProps {
  return {
    id: post.id,
    brandName: post.brandName ?? '브랜드 미상',
    modelName: post.modelName ?? '모델 미상',
    modelPrice: Number(post.price),
    imageUrl: post.thumbnail ?? '',
    likeNum: post.likeCount ?? 0,
    eyeNum: post.viewCount ?? 0,
    createdAt: post.createdAt,
    isLiked: !!post.isLiked,
    saleStatus: post.saleStatus,
    chips: buildMerchandiseChips(post),
    onPressCard: () => {},
  };
}

export function detaileToCard(post: DetailItem): MerchandiseCardProps {
  return {
    id: post.id,
    brandName: post.modelResponse.brandName ?? '브랜드 미상',
    modelName: post.modelResponse.modelName ?? '모델 미상',
    modelPrice: Number(post.price),
    imageUrl: post.postImages?.[0] ?? '',
    likeNum: post.likeCount ?? 0,
    eyeNum: post.viewCount ?? 0,
    createdAt: post.createdAt,
    isLiked: !!post.isLiked,
    saleStatus: post.saleStatus,
    chips: buildMerchandiseChips(post),
    onPressCard: () => {},
  };
}
