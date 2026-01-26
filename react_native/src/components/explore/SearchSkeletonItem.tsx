import { Dimensions, StyleSheet, View } from 'react-native';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SearchSkeletonItem = () => {
  return (
    <SkeletonPlaceholder speed={1400} backgroundColor={semanticColor.surface.lightGray}>
      <View style={styles.container}>
        <SkeletonPlaceholder.Item width={20} height={20} borderRadius={semanticNumber.borderRadius.sm} />
        <SkeletonPlaceholder.Item
          width={SCREEN_WIDTH - 16 - 64 - 12}
          height={22}
          borderRadius={semanticNumber.borderRadius.sm}
        />
      </View>
    </SkeletonPlaceholder>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: semanticNumber.spacing[4],
    paddingLeft: semanticNumber.spacing[16],
    paddingRight: semanticNumber.spacing[64],
    gap: semanticNumber.spacing[12],
    minHeight: 52,
  },
});

export default SearchSkeletonItem;
