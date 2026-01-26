import { Dimensions, StyleSheet, View } from 'react-native';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

const CheckboxItemSkeleton = () => {
  return (
    <SkeletonPlaceholder speed={1400} backgroundColor={semanticColor.surface.lightGray}>
      <View style={styles.container}>
        <SkeletonPlaceholder.Item width={160} height={24} borderRadius={semanticNumber.borderRadius.sm} />
        <SkeletonPlaceholder.Item width={140} height={24} borderRadius={semanticNumber.borderRadius.sm} />
        <SkeletonPlaceholder.Item width={120} height={24} borderRadius={semanticNumber.borderRadius.sm} />
      </View>
    </SkeletonPlaceholder>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[12],
  },
});

export default CheckboxItemSkeleton;
