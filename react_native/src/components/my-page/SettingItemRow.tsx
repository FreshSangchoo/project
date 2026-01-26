import { Pressable, StyleSheet, Text, View } from 'react-native';
import IconChevronRight from '@/assets/icons/IconChevronRight.svg';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import { semanticColor } from '@/styles/semantic-color';

export interface SettingItemProps {
  itemImage?: React.ReactNode;
  itemName: string;
  itemNameStyle?: 'primary' | 'tertiary' | 'critical';
  subItem?: string | React.ReactNode;
  onPress?: () => void;
  showNextButton?: boolean;
  isBottomSheet?: boolean;
}

function SettingItem({
  itemImage,
  itemName,
  itemNameStyle = 'primary',
  subItem,
  onPress,
  showNextButton,
  isBottomSheet = false,
}: SettingItemProps) {
  return (
    <Pressable style={styles.settingItem} onPress={onPress}>
      {itemImage}
      <View style={styles.itemNameWrapper}>
        <Text
          style={[
            !isBottomSheet ? styles.itemNameText : styles.itemNameBottomSheetText,
            itemNameStyles[itemNameStyle],
          ]}>
          {itemName}
        </Text>
      </View>
      <View style={styles.rightItemWrapper}>
        <View>{typeof subItem === 'string' ? <Text style={styles.subItemText}>{subItem}</Text> : subItem}</View>
        {showNextButton && (
          <IconChevronRight width={24} height={24} stroke={semanticColor.icon.lightest} strokeWidth={2} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  settingItem: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[12],
    flexDirection: 'row',
    gap: semanticNumber.spacing[12],
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 52,
  },
  itemNameWrapper: {
    flex: 1,
  },
  itemNameText: {
    ...semanticFont.label.medium,
  },
  itemNameBottomSheetText: {
    ...semanticFont.body.large,
  },
  rightItemWrapper: {
    flexDirection: 'row',
    gap: semanticNumber.spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  subItemText: {
    ...semanticFont.body.medium,
  },
});

const itemNameStyles = StyleSheet.create({
  primary: {
    color: semanticColor.text.primary,
  },
  tertiary: {
    color: semanticColor.text.tertiary,
  },
  critical: {
    color: semanticColor.text.critical,
  },
});

export default SettingItem;
