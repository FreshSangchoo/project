import { Dimensions, StyleSheet, View } from 'react-native';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import ModelCardSkeleton from '@/components/common/model-card/ModelCardSkeleton';

const SCREEN_WIDTH = Dimensions.get('window').width;

const MerchandiseDetailSkeleton = () => {
  return (
    <>
      <SkeletonPlaceholder speed={1400} backgroundColor={semanticColor.surface.lightGray}>
        <SkeletonPlaceholder.Item width={SCREEN_WIDTH} height={SCREEN_WIDTH} />
      </SkeletonPlaceholder>

      <View style={styles.container}>
        <ModelCardSkeleton />
        <SkeletonPlaceholder speed={1400} backgroundColor={semanticColor.surface.lightGray}>
          <View style={{ gap: semanticNumber.spacing[16] }}>
            <SkeletonPlaceholder.Item
              width={SCREEN_WIDTH - 16 - 16}
              height={28}
              borderRadius={semanticNumber.borderRadius.sm}
            />
            <SkeletonPlaceholder.Item width={164} height={18} borderRadius={semanticNumber.borderRadius.sm} />
          </View>
        </SkeletonPlaceholder>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingTop: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[32],
    gap: semanticNumber.spacing[16],
  },
});

export default MerchandiseDetailSkeleton;
