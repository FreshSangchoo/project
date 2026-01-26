import { Pressable, View, Text, StyleSheet } from 'react-native';
import IconCheck from '@/assets/icons/IconCheck.svg';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';

interface CheckboxItemProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const CheckboxItem = ({ label, selected, onPress }: CheckboxItemProps) => {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.touchField}>
        <IconCheck
          width={20}
          height={20}
          stroke={selected ? semanticColor.checkbox.selected : semanticColor.checkbox.deselected}
          strokeWidth={semanticNumber.stroke.bold}
        />
      </View>
      <Text
        style={[styles.label, selected && { ...semanticFont.body.mediumStrong, color: semanticColor.text.primary }]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    height: 44,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  touchField: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  label: {
    color: semanticColor.text.secondary,
    ...semanticFont.body.medium,
  },
});

export default CheckboxItem;
