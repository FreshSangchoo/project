import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

const NotificationSkeleton = () => {
  return (
    <SkeletonPlaceholder speed={1400} backgroundColor={semanticColor.surface.lightGray}>
      <View style={styles.container}>
        <SkeletonPlaceholder.Item width={20} height={20} borderRadius={semanticNumber.borderRadius.sm} />
        <View style={styles.textWrapper}>
          <SkeletonPlaceholder.Item width={326} height={20} borderRadius={semanticNumber.borderRadius.sm} />
          <SkeletonPlaceholder.Item width={158} height={20} borderRadius={semanticNumber.borderRadius.sm} />
        </View>
      </View>
    </SkeletonPlaceholder>
  );
};

export default NotificationSkeleton;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[12],
    gap: semanticNumber.spacing[12],
  },
  textWrapper: {
    flex: 1,
    gap: semanticNumber.spacing[8],
  },
});
