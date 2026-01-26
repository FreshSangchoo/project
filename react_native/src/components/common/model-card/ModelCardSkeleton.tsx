import { Dimensions, StyleSheet, View } from 'react-native';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

interface ModelCardSkeletonProps {
  isBrand?: boolean;
}

function ModelCardSkeleton({ isBrand }: ModelCardSkeletonProps) {
  return (
    <View style={[styles.modelCard, isBrand && { height: 78 }]}>
      <SkeletonPlaceholder speed={1400} backgroundColor={semanticColor.surface.gray}>
        <View style={styles.modelCardContainer}>
          {!isBrand && (
            <SkeletonPlaceholder.Item width={60} height={16} borderRadius={semanticNumber.borderRadius.sm} />
          )}
          <SkeletonPlaceholder.Item width={224} height={20} borderRadius={semanticNumber.borderRadius.sm} />
          <SkeletonPlaceholder.Item width={116} height={16} borderRadius={semanticNumber.borderRadius.sm} />
        </View>
      </SkeletonPlaceholder>
    </View>
  );
}

const styles = StyleSheet.create({
  modelCard: {
    width: '100%',
    height: 102,
    justifyContent: 'center',
    borderRadius: semanticNumber.borderRadius.lg,
    backgroundColor: semanticColor.surface.lightGray,
  },
  modelCardContainer: {
    paddingHorizontal: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[10],
  },
});

export default ModelCardSkeleton;
