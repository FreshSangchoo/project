import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import IconHistory from '@/assets/icons/IconHistory.svg';
import IconX from '@/assets/icons/IconX.svg';

interface SearchRecentItemProps {
  searchText: string;
  currentSearchText?: string;
  onPress?: () => void;
  onDelete?: () => void;
}

const SearchRecentItem = ({ searchText, currentSearchText, onPress, onDelete }: SearchRecentItemProps) => {
  const keyword = currentSearchText?.trim().toLowerCase() ?? '';
  const lowerText = searchText.toLowerCase();

  const matchIndex = keyword ? lowerText.indexOf(keyword) : -1;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <IconHistory
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.bold}
      />
      <View style={styles.textGroup}>
        {matchIndex !== -1 ? (
          <Text style={styles.searchText}>
            {searchText.substring(0, matchIndex)}
            <Text style={{ color: semanticColor.text.primary }}>
              {searchText.substring(matchIndex, matchIndex + keyword.length)}
            </Text>
            {searchText.substring(matchIndex + keyword.length)}
          </Text>
        ) : (
          <Text style={styles.searchText}>{searchText}</Text>
        )}
      </View>
      <TouchableOpacity style={styles.touchField} onPress={onDelete}>
        <IconX width={16} height={16} stroke={semanticColor.icon.primary} strokeWidth={semanticNumber.stroke.bold} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: semanticNumber.spacing[4],
    paddingLeft: semanticNumber.spacing[16],
    paddingRight: semanticNumber.spacing[2],
    gap: semanticNumber.spacing[12],
    minHeight: 52,
  },
  textGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[8],
    flex: 1,
  },
  subTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchText: {
    color: semanticColor.text.tertiary,
    ...semanticFont.body.largeStrong,
  },
  touchField: {
    width: 44,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchRecentItem;
