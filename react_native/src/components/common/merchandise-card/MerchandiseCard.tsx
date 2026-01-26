import { useState } from 'react';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import { Dimensions, StyleSheet, TouchableOpacity, View, Image, Text, Platform } from 'react-native';
import Chip, { ChipVariant } from '@/components/common/Chip';
import IconHeart from '@/assets/icons/IconHeart.svg';
import IconHeartFilled from '@/assets/icons/IconHeartFilled.svg';
import IconEye from '@/assets/icons/IconEye.svg';
import IconClock from '@/assets/icons/IconClock.svg';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from '@react-native-community/blur';

/**
 * 상품 정보를 카드 형태로 표시하는 컴포넌트입니다.
 * 이미지, 브랜드명, 모델명, 가격, 태그(Chip), 좋아요 수, 조회 수, 시간 정보 등을 표시하며,
 * 사용자의 상호작용(좋아요 클릭, 카드 클릭 등)을 지원합니다.
 *
 * @component
 * @param {CardType} [type='default'] - 카드의 상태 타입 (기본, 눌림, 스켈레톤)
 * @param {() => void} onPressCard - 카드 전체를 눌렀을 때의 콜백 함수
 * @param {boolean} [noShowLiked] - 좋아요 버튼 표시 여부 (true면 숨김)
 * @param {string} [saleStatus] - 판매 상태 여부
 * @param {boolean} [isLiked] - 좋아요 여부
 * @param {() => void} [onPressHeart] - 좋아요(하트) 버튼 클릭 시 호출될 함수
 * @param {string} imageUrl - 카드에 표시할 상품 이미지 URL
 * @param {string} brandName - 상품 브랜드명
 * @param {string} modelName - 상품 모델명
 * @param {number} modelPrice - 가격 정보
 * @param {number} likeNum - 좋아요 수
 * @param {number} eyeNum - 조회 수
 * @param {string} createdAt - 작성 시간
 * @param {ChipData[]} chips - Chip 컴포넌트로 표시할 태그 정보 배열
 *
 * @example
 * <MerchandiseCard
 *   type="default"
 *   onPressCard={() => console.log('clicked')}
 *   isLiked={true}
 *   onPressHeart={() => console.log('heart')}
 *   imageUrl="https://..."
 *   brandName="Ibanez"
 *   modelName="TS808"
 *   modelPrice={120000}
 *   likeNum={12}
 *   eyeNum={100}
 *   createdAt="2025-08-10T10:05:32.741Z"
 *   chips={[{ text: '오버드라이브' }, { text: '서울 성북' }]}
 * />
 *
 * @author 김서윤
 */

type CardType = 'default' | 'pressed';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ChipData {
  text: string;
  variant?: ChipVariant;
  icon?: React.ReactNode;
}

export interface MerchandiseCardProps {
  id?: number;
  type?: CardType;
  onPressCard: () => void;
  noShowLiked?: boolean;
  saleStatus?: 'RESERVED' | 'SOLD_OUT' | 'ON_SALE';
  isLiked?: boolean;
  onPressHeart?: () => void;
  imageUrl: string;
  brandName: string;
  modelName: string;
  modelPrice: number;
  likeNum: number;
  eyeNum: number;
  createdAt: string | Date;
  chips: ChipData[];
}

const MerchandiseCard = ({
  type = 'default',
  onPressCard,
  noShowLiked,
  saleStatus,
  isLiked,
  onPressHeart,
  imageUrl,
  brandName,
  modelName,
  modelPrice,
  likeNum,
  eyeNum,
  createdAt,
  chips,
}: MerchandiseCardProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const createdAgo = formatTimeAgo(createdAt);
  const productStateText = saleStatus === 'RESERVED' ? '예약 중' : saleStatus === 'SOLD_OUT' ? '판매 완료' : null;

  return (
    <TouchableOpacity
      style={[styles.container, isPressed && styles.pressedContainer]}
      onPress={onPressCard}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={1}>
      <View style={styles.imageWrapper}>
        <Image style={styles.imageContainer} source={{ uri: imageUrl }} resizeMode="cover" />
        {!noShowLiked && (
          <View style={styles.saveButton}>
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation();
                onPressHeart?.();
              }}
              activeOpacity={1}>
              {isLiked ? (
                <IconHeartFilled width={24} height={24} fill={semanticColor.saveButton.selected} />
              ) : Platform.OS === 'ios' ? (
                <View style={styles.heartIOSContainer}>
                  <MaskedView
                    style={styles.heartMaskBox}
                    maskElement={<IconHeartFilled width={24} height={24} fill={semanticColor.saveButton.deselected} />}>
                    <BlurView
                      style={styles.heartMaskBox}
                      blurAmount={6}
                      reducedTransparencyFallbackColor={semanticColor.saveButton.deselected}
                    />
                  </MaskedView>
                  <IconHeart
                    width={24}
                    height={24}
                    fill={semanticColor.saveButton.deselected}
                    stroke={semanticColor.icon.primaryOnDark}
                    strokeWidth={semanticNumber.stroke.light}
                    style={styles.heartStrokeOverlay}
                  />
                </View>
              ) : (
                <IconHeart
                  width={24}
                  height={24}
                  fill={semanticColor.surface.gray}
                  stroke={semanticColor.icon.secondaryOnDark}
                  strokeOpacity={0.3}
                  strokeWidth={semanticNumber.stroke.light}
                />
              )}
            </TouchableOpacity>
          </View>
        )}
        {productStateText && (
          <View style={styles.reserveContainer}>
            <Text style={styles.reserveText}>{productStateText}</Text>
          </View>
        )}
      </View>
      <View style={styles.informationContainer}>
        <View style={styles.textGroup}>
          {brandName && <Text style={styles.brandText}>{brandName}</Text>}
          <Text style={styles.modelText}>{modelName}</Text>
          <View style={styles.priceGroup}>
            <Text style={styles.priceText}>{modelPrice.toLocaleString()}</Text>
            <Text style={styles.priceText}>원</Text>
          </View>
        </View>
        <View style={styles.chipGroup}>
          {chips.map(({ text, variant, icon }) => (
            <Chip key={text} text={text} variant={variant} icon={icon} />
          ))}
        </View>
        <View style={styles.countGroup}>
          <View style={styles.countItem}>
            <IconHeart
              width={16}
              height={16}
              stroke={semanticColor.icon.lightest}
              strokeWidth={semanticNumber.stroke.bold}
            />
            <Text style={styles.countText}>{likeNum}</Text>
          </View>
          <View style={styles.countItem}>
            <IconEye
              width={16}
              height={16}
              stroke={semanticColor.icon.lightest}
              strokeWidth={semanticNumber.stroke.bold}
            />
            <Text style={styles.countText}>{eyeNum}</Text>
          </View>
          <View style={styles.countItem}>
            <IconClock
              width={16}
              height={16}
              stroke={semanticColor.icon.lightest}
              strokeWidth={semanticNumber.stroke.bold}
            />
            <View style={styles.timeGroup}>
              <Text style={styles.countText}>{createdAgo}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    gap: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[12],
    paddingHorizontal: semanticNumber.spacing[16],
  },
  pressedContainer: {
    backgroundColor: semanticColor.surface.whitePressed,
  },
  imageWrapper: {
    position: 'relative',
  },
  imageContainer: {
    width: 108,
    height: 144,
    borderRadius: semanticNumber.borderRadius.md,
  },
  saveButton: {
    position: 'absolute',
    padding: semanticNumber.spacing[8],
    top: 0,
    right: 0,
    zIndex: 5,
    width: 44,
    height: 44,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  heartIOSContainer: {
    width: 24,
    height: 24,
  },
  heartMaskBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  heartStrokeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  reserveContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 144,
    backgroundColor: semanticColor.surface.alphaBlackMedium,
    borderRadius: semanticNumber.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  reserveText: {
    ...semanticFont.body.smallStrong,
    color: semanticColor.surface.white,
  },
  informationContainer: {
    gap: semanticNumber.spacing[8],
    flex: 1,
  },
  textGroup: {
    gap: semanticNumber.spacing[4],
  },
  brandText: {
    ...semanticFont.body.largeStrong,
    color: semanticColor.text.primary,
  },
  modelText: {
    ...semanticFont.body.large,
    color: semanticColor.text.secondary,
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[2],
  },
  priceText: {
    ...semanticFont.title.large,
    color: semanticColor.text.primary,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: semanticNumber.spacing[4],
  },
  countGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[12],
  },
  countItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[2],
  },
  countText: {
    ...semanticFont.caption.medium,
    color: semanticColor.text.lightest,
  },
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default MerchandiseCard;
