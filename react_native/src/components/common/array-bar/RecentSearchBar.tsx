import { StyleSheet, Text, View } from 'react-native';
import VariantButton from '@/components/common/button/VariantButton';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';

interface RecentSearchBarProps {
  isSearching: boolean;
  onClear?: () => void;
}

const RecentSearchBar = ({ isSearching, onClear }: RecentSearchBarProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{isSearching ? '추천 검색어' : '최근 검색어'}</Text>
      {!isSearching && onClear && (
        <VariantButton theme="sub" onPress={onClear}>
          전체 삭제
        </VariantButton>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: semanticNumber.spacing[16],
    height: 44,
  },
  text: {
    color: semanticColor.text.tertiary,
    ...semanticFont.label.small,
  },
});

export default RecentSearchBar;
