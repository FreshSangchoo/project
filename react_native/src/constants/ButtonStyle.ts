import { semanticColor } from '@/styles/semantic-color';

export type ButtonTheme = 'brand' | 'main' | 'sub' | 'critical';
export type ButtonState = 'enabled' | 'pressed' | 'disabled';

export type ButtonStyle = Record<ButtonTheme, Record<ButtonState, { backgroundColor: string; textColor: string }>>;

export const BUTTON_STYLE: ButtonStyle = {
  brand: {
    enabled: {
      backgroundColor: semanticColor.button.mainEnabled,
      textColor: semanticColor.text.buttonMainBrand,
    },
    pressed: {
      backgroundColor: semanticColor.button.mainPressed,
      textColor: semanticColor.text.buttonMainBrandPressed,
    },
    disabled: {
      backgroundColor: semanticColor.button.mainDisabled,
      textColor: semanticColor.text.buttonMainBrandDisabled,
    },
  },
  main: {
    enabled: {
      backgroundColor: semanticColor.button.mainEnabled,
      textColor: semanticColor.text.buttonMain,
    },
    pressed: {
      backgroundColor: semanticColor.button.mainPressed,
      textColor: semanticColor.text.buttonMainPressed,
    },
    disabled: {
      backgroundColor: semanticColor.button.mainDisabled,
      textColor: semanticColor.text.buttonMainDisabled,
    },
  },
  sub: {
    enabled: {
      backgroundColor: semanticColor.button.subEnabled,
      textColor: semanticColor.text.buttonSub,
    },
    pressed: {
      backgroundColor: semanticColor.button.subPressed,
      textColor: semanticColor.text.buttonSubPressed,
    },
    disabled: {
      backgroundColor: semanticColor.button.subDisabled,
      textColor: semanticColor.text.buttonSubDisabled,
    },
  },
  critical: {
    enabled: {
      backgroundColor: semanticColor.button.mainEnabled,
      textColor: semanticColor.text.critical,
    },
    pressed: {
      backgroundColor: semanticColor.button.mainPressed,
      textColor: semanticColor.text.critical,
    },
    disabled: {
      backgroundColor: semanticColor.button.mainDisabled,
      textColor: semanticColor.text.buttonMainDisabled,
    },
  },
};
