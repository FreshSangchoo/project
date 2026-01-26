import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import IconChevronRight from '@/assets/icons/IconChevronRight.svg';

export type TextButtonAlign = 'center' | 'right' | 'left';
export type TextButtonTheme = 'default' | 'brand' | 'red';
export type TextButtonAlignSelf = 'flex-start' | 'center';

interface TextButtonProps {
  children: string;
  onPress: () => void;
  theme?: TextButtonTheme;
  underline?: boolean;
  icon?: boolean;
  align: TextButtonAlign;
  alignSelf?: TextButtonAlignSelf;
}

const TextButton = ({
  children,
  onPress,
  theme = 'default',
  underline = true,
  icon,
  align,
  alignSelf = 'flex-start',
}: TextButtonProps) => {
  const textColor =
    theme === 'default'
      ? semanticColor.text.secondary
      : theme === 'brand'
      ? semanticColor.text.brand
      : semanticColor.text.critical;

  const iconColor =
    theme === 'default'
      ? semanticColor.icon.secondary
      : theme === 'brand'
      ? semanticColor.icon.brand
      : semanticColor.icon.critical;

  const alignStyle =
    align === 'center'
      ? { paddingHorizontal: semanticNumber.spacing[12] }
      : align === 'right'
      ? { paddingLeft: semanticNumber.spacing[12] }
      : { paddingRight: semanticNumber.spacing[12] };

  return (
    <TouchableOpacity onPress={onPress} style={[styles.touchField, alignStyle, { alignSelf }]}>
      <View style={styles.contentsWrapper}>
        <Text
          style={[
            styles.text,
            { color: textColor },
            underline && { textDecorationLine: 'underline', textDecorationStyle: 'solid' },
          ]}>
          {children}
        </Text>
        {icon && (
          <IconChevronRight width={16} height={16} stroke={iconColor} strokeWidth={semanticNumber.stroke.light} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchField: {
    paddingVertical: semanticNumber.spacing[12],
  },
  contentsWrapper: {
    flexDirection: 'row',
  },
  text: {
    ...semanticFont.label.xsmall,
  },
});

export default TextButton;
