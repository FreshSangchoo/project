import { Pressable, View, Text, StyleSheet } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';

interface ToggleChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function ToggleChip({ label, selected, onPress }: ToggleChipProps) {
  return (
    <Pressable style={styles.chipEachBox} onPress={onPress}>
      <View
        style={[
          styles.chipEachTextBox,
          selected ? textStyles.selectedChipEachTextBox : textStyles.unselectedChipEachTextBox,
        ]}>
        <Text
          style={[styles.chipEachText, selected ? textStyles.selectedChipEachText : textStyles.unselectedChipEachText]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chipEachBox: {
    flexDirection: 'column',
    paddingVertical: semanticNumber.spacing[8],
    paddingHorizontal: semanticNumber.spacing.none,
    alignItems: 'flex-start',
  },
  chipEachTextBox: {
    flexDirection: 'row',
    height: 28,
    paddingVertical: semanticNumber.spacing[2],
    paddingHorizontal: semanticNumber.spacing[10],
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: semanticNumber.spacing[4],
    alignSelf: 'stretch',
    borderRadius: semanticNumber.borderRadius.md,
    borderWidth: semanticNumber.stroke.xlight,
  },
  chipEachText: {
    ...semanticFont.body.medium,
  },
});

const textStyles = StyleSheet.create({
  selectedChipEachText: {
    color: semanticColor.text.primaryOnDark,
  },
  unselectedChipEachText: {
    color: semanticColor.text.tertiaryOnDark,
  },
  selectedChipEachTextBox: {
    backgroundColor: semanticColor.surface.dark,
    borderWidth: semanticNumber.stroke.xlight,
    borderColor: semanticColor.border.dark,
  },
  unselectedChipEachTextBox: {
    backgroundColor: semanticColor.surface.white,
    borderWidth: semanticNumber.stroke.xlight,
    borderColor: semanticColor.border.light,
  },
});
