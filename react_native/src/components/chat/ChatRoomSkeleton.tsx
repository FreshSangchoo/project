import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { StyleSheet, View } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

function ChatRoomSkeleton() {
  return (
    <SkeletonPlaceholder speed={1400} backgroundColor={semanticColor.surface.lightGray}>
      <View style={styles.container}>
        <SkeletonPlaceholder.Item width={48} height={48} borderRadius={semanticNumber.borderRadius.full} />

        <View style={{ flex: 1, gap: semanticNumber.spacing[4] }}>
          <SkeletonPlaceholder.Item width={120} height={22} borderRadius={semanticNumber.borderRadius.sm} />
          <SkeletonPlaceholder.Item width={200} height={22} borderRadius={semanticNumber.borderRadius.sm} />
        </View>
      </View>
    </SkeletonPlaceholder>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    gap: semanticNumber.spacing[12],
    paddingVertical: semanticNumber.spacing[12],
    paddingHorizontal: semanticNumber.spacing[16],
  },
});

export default ChatRoomSkeleton;
