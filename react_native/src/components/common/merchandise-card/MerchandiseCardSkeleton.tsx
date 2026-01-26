import { Dimensions, StyleSheet, View } from 'react-native';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

const SCREEN_WIDTH = Dimensions.get('window').width;

const MerchandiseCardSkeleton = () => {
  return (
    <SkeletonPlaceholder speed={1400} backgroundColor={semanticColor.surface.lightGray}>
      <View style={styles.container}>
        {/* 이미지 영역 */}
        <SkeletonPlaceholder.Item width={108} height={144} borderRadius={semanticNumber.borderRadius.md} />

        {/* 오른쪽 정보 영역 */}
        <View style={{ flex: 1, gap: semanticNumber.spacing[8] }}>
          <SkeletonPlaceholder.Item width={64} height={22} borderRadius={semanticNumber.borderRadius.sm} />
          <SkeletonPlaceholder.Item
            width={SCREEN_WIDTH - 108 - 32 - 16}
            height={24}
            borderRadius={semanticNumber.borderRadius.sm}
          />
          <SkeletonPlaceholder.Item width={120} height={18} borderRadius={semanticNumber.borderRadius.sm} />
        </View>
      </View>
    </SkeletonPlaceholder>
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
});

export default MerchandiseCardSkeleton;
