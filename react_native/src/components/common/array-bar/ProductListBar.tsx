import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import IconMenuDeep from '@/assets/icons/IconMenuDeep.svg';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useState } from 'react';
import SortBottomSheet, { SortValue } from '@/components/common/bottom-sheet/SortBottomSheet';

interface ProductListBarProps {
  count: number;
  loading?: boolean;
  onlyCount?: boolean;
  onChangeSort?: (value: SortValue) => void;
  isHidden?: boolean;
}

const SORT_LABEL = {
  latest: '최신순',
  price_low: '낮은 가격순',
  price_high: '높은 가격순',
  view_count: '조회수순',
  like_count: '좋아요순',
};

const ProductListBar = ({ count, loading, onlyCount, onChangeSort, isHidden }: ProductListBarProps) => {
  const unitLabel = onlyCount ? '모델' : '매물';
  const [sortValue, setSortValue] = useState<SortValue>('latest');
  const [sortLabel, setSortLabel] = useState<string>(SORT_LABEL['latest']);
  const [sortSheet, setSortSheet] = useState<boolean>(false);

  return (
    <View style={styles.container}>
      {loading ? (
        <SkeletonPlaceholder speed={1400} backgroundColor={semanticColor.surface.lightGray}>
          <SkeletonPlaceholder.Item width={64} height={18} borderRadius={semanticNumber.borderRadius.sm} />
        </SkeletonPlaceholder>
      ) : (
        <Text style={styles.text}>{!isHidden && `${count.toLocaleString()}개의 ${unitLabel}`}</Text>
      )}
      {!onlyCount && (
        <TouchableOpacity style={styles.filterContainer} onPress={() => setSortSheet(true)}>
          <Text style={styles.filterText}>{sortLabel}</Text>
          <IconMenuDeep
            width={16}
            height={16}
            stroke={semanticColor.icon.secondary}
            strokeWidth={semanticNumber.stroke.bold}
          />
        </TouchableOpacity>
      )}
      <SortBottomSheet
        visible={sortSheet}
        onClose={() => setSortSheet(false)}
        selected={sortValue}
        onSelect={(value, label) => {
          setSortValue(value);
          setSortLabel(label);
          setSortSheet(false);
          onChangeSort?.(value);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: semanticNumber.spacing[4],
    paddingLeft: semanticNumber.spacing[16],
    minHeight: 52,
  },
  text: {
    color: semanticColor.text.tertiary,
    ...semanticFont.caption.large,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: semanticNumber.spacing[12],
    paddingRight: semanticNumber.spacing[12],
  },
  filterText: {
    color: semanticColor.text.secondary,
    ...semanticFont.label.xsmall,
  },
});

export default ProductListBar;
