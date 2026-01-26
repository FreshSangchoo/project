import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import IconSearch from '@/assets/icons/IconSearch.svg';

interface SearchResultItemProps {
  id: number;
  brandName: string;
  modelName?: string;
  category: '브랜드' | '이펙터';
  onPress: (id: number) => void;
}

const SearchResultItem = ({ id, brandName, modelName, category, onPress }: SearchResultItemProps) => {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(id)}>
      <IconSearch
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.bold}
      />
      <View style={styles.textGroup}>
        <Text style={styles.brandText}>{brandName}</Text>
        {category !== '브랜드' && modelName && (
          <Text style={styles.modelText} numberOfLines={1} ellipsizeMode="tail">
            {` ${modelName}`}
          </Text>
        )}
        <Text style={styles.categoryText}>{category}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: semanticNumber.spacing[4],
    paddingHorizontal: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[12],
    minHeight: 52,
  },
  textGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandText: {
    color: semanticColor.text.primary,
    ...semanticFont.body.largeStrong,
  },
  modelText: {
    color: semanticColor.text.tertiary,
    ...semanticFont.body.largeStrong,
    flexShrink: 1,
  },
  categoryText: {
    color: semanticColor.text.tertiary,
    ...semanticFont.caption.large,
    paddingLeft: semanticNumber.spacing[8],
  },
});

export default SearchResultItem;
