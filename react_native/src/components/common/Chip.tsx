import { StyleSheet, Text, View } from 'react-native';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { fonts } from '@/styles/fonts';

export type ChipVariant = 'condition' | 'default' | 'darkBrand' | 'red' | 'brand' | 'dark';

type ChipSize = 'small' | 'medium';

interface ChipProps {
  icon?: React.ReactNode;
  text: string;
  variant?: ChipVariant;
  size?: ChipSize;
}

function Chip({ icon, text, variant = 'default', size = 'small' }: ChipProps) {
  return (
    <View style={[styles.chipBase, variantStyles[variant], sizeStyles[size]]}>
      {icon}
      <Text style={[styles.textBase, variantStyles[variant], textSizeStyles[size]]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chipBase: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: semanticNumber.borderRadius.sm,
    gap: 2,
  },
  textBase: {
    fontFamily: fonts.family.medium,
  },
});

const variantStyles = StyleSheet.create({
  condition: {
    backgroundColor: semanticColor.chip.condition,
    color: semanticColor.text.chipCondition,
  },
  default: {
    backgroundColor: semanticColor.chip.default,
    color: semanticColor.text.chipDefault,
  },
  darkBrand: {
    backgroundColor: semanticColor.chip.dark,
    color: semanticColor.text.chipDark,
  },
  red: {
    backgroundColor: semanticColor.chip.red,
    color: semanticColor.text.chipRed,
  },
  brand: {
    backgroundColor: semanticColor.chip.delivery,
    color: semanticColor.text.chipDelivery,
  },
  dark: {
    backgroundColor: semanticColor.chip.dark,
    color: semanticColor.text.primaryOnDark,
  },
});

const sizeStyles = StyleSheet.create({
  small: {
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  medium: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
});

const textSizeStyles = StyleSheet.create({
  small: {
    fontSize: fonts.size['2XS'],
    lineHeight: fonts.lineHeight['2XS'],
    letterSpacing: fonts.letterSpacing.none,
  },
  medium: {
    fontSize: fonts.size.SM,
    lineHeight: fonts.lineHeight.MD,
    letterSpacing: fonts.letterSpacing.none,
  },
});

export default Chip;
