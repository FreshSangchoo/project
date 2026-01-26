import { BUTTON_STYLE, ButtonState, ButtonTheme } from '@/constants/ButtonStyle';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface VariantButtonProps {
  children: React.ReactNode;
  theme?: ButtonTheme;
  isLarge?: boolean;
  disabled?: boolean;
  isFull?: boolean;
  onPress: () => void;
}

const VariantButton = ({ children, theme = 'main', isLarge, disabled, isFull, onPress }: VariantButtonProps) => {
  const [buttonState, setButtonState] = useState<ButtonState>('enabled');
  const isTextChild = typeof children === 'string' || typeof children === 'number';
  const currentColorStyle = useMemo(() => {
    return BUTTON_STYLE[theme][buttonState];
  }, [theme, buttonState]);
  useEffect(() => {
    if (disabled) {
      setButtonState('disabled');
    } else {
      setButtonState('enabled');
    }
  }, [disabled]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        if (__DEV__) {
          console.log('Pressed In');
        }
        setButtonState('pressed');
      }}
      onPressOut={() => setButtonState('enabled')}
      disabled={disabled}
      style={[
        isLarge
          ? [
              styles.largeButton,
              {
                backgroundColor: disabled
                  ? BUTTON_STYLE[theme].disabled.backgroundColor
                  : currentColorStyle.backgroundColor,
                alignItems: 'center',
              },
            ]
          : styles.smallButtonWrapper,
      ]}>
      <View
        style={[
          !isLarge && [
            styles.smallButton,
            {
              backgroundColor: disabled
                ? BUTTON_STYLE[theme].disabled.backgroundColor
                : currentColorStyle.backgroundColor,
              alignItems: 'center',
            },
          ],
        ]}>
        {isTextChild ? (
          <Text
            style={[
              isLarge ? styles.largeText : styles.smallText,
              {
                color: disabled ? BUTTON_STYLE[theme].disabled.textColor : currentColorStyle.textColor,
              },
            ]}>
            {children}
          </Text>
        ) : (
          <View>{children}</View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  largeButton: {
    paddingVertical: semanticNumber.spacing[14],
    paddingHorizontal: semanticNumber.spacing[16],
    borderRadius: semanticNumber.borderRadius.lg,
  },
  largeText: {
    ...semanticFont.label.large,
  },
  smallButtonWrapper: {
    paddingVertical: semanticNumber.spacing[8],
  },
  smallButton: {
    paddingVertical: semanticNumber.spacing[4],
    paddingHorizontal: semanticNumber.spacing[10],
    borderRadius: semanticNumber.borderRadius.md,
  },
  smallText: {
    ...semanticFont.label.xsmall,
  },
});

export default VariantButton;
