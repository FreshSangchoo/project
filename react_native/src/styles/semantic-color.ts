import { colors } from './color';

const semanticColor = {
  text: {
    primary: colors.neutral[900],
    secondary: colors.neutral[700],
    tertiary: colors.neutral[600],
    lightest: colors.neutral[400],

    primaryOnDark: colors.neutral.white,
    secondaryOnDark: colors.neutral[200],
    tertiaryOnDark: colors.neutral[600],
    lightestOnDark: colors.neutral[800],

    critical: colors.scale.red[400],
    danger: colors.scale.orange[500],
    success: colors.brand.primary[700],
    brand: colors.brand.primary[500],
    brandOnDark: colors.brand.primary[300],

    chipDefault: colors.neutral[600],
    chipCondition: colors.scale.blue[400],
    chipDelivery: colors.brand.primary[700],
    chipDark: colors.brand.primary[400],
    chipRed: colors.scale.red[400],

    buttonMain: colors.neutral.white,
    buttonMainPressed: colors.neutral[100],
    buttonMainDisabled: colors.neutral.white,
    buttonMainBrand: colors.brand.primary[400],
    buttonMainBrandPressed: colors.brand.primary[200],
    buttonMainBrandDisabled: colors.brand.primary[50],
    buttonSub: colors.neutral[800],
    buttonSubPressed: colors.neutral[700],
    buttonSubDisabled: colors.neutral[400],
  },

  icon: {
    primary: colors.neutral[900],
    secondary: colors.neutral[700],
    tertiary: colors.neutral[600],
    lightest: colors.neutral[400],

    primaryOnDark: colors.neutral.white,
    secondaryOnDark: colors.neutral[200],
    tertiaryOnDark: colors.neutral[600],
    lightestOnDark: colors.neutral[800],

    critical: colors.scale.red[400],
    warning: colors.scale.orange[500],
    success: colors.brand.primary[700],
    brand: colors.brand.primary[500],
    brandOnDark: colors.brand.primary[300],

    buttonMain: colors.neutral.white,
    buttonMainPressed: colors.neutral[100],
    buttonMainDisabled: colors.neutral[400],
    buttonMainBrand: colors.brand.primary[400],
    buttonMainBrandPressed: colors.brand.primary[200],
    buttonMainBrandDisabled: colors.brand.primary[50],
    buttonSub: colors.neutral[800],
    buttonSubPressed: colors.neutral[700],
    buttonSubDisabled: colors.neutral[400],

    homeOrange: colors.scale.orange[500],
    homeLightest: colors.neutral[400],

    readIndicator: colors.scale.red[400],
  },

  surface: {
    white: colors.neutral.white,
    whitePressed: colors.neutral[100],
    lightGray: colors.neutral[100],
    lightGrayPressed: colors.neutral[200],
    gray: colors.neutral[200],
    grayPressed: colors.neutral[400],
    dark: colors.neutral[900],
    darkPressed: colors.neutral[800],

    alphaWhiteLight: colors.alpha.white10,
    alphaBlackLight: colors.alpha.black25,
    alphaBlackMedium: colors.alpha.black50,
    alphaBlackStrong: colors.alpha.black75,

    critical: colors.scale.red[400],
  },

  button: {
    mainEnabled: colors.neutral[900],
    mainPressed: colors.neutral[800],
    mainDisabled: colors.neutral[400],
    subEnabled: colors.neutral[100],
    subPressed: colors.neutral[200],
    subDisabled: colors.neutral[100],
  },

  floating: {
    uploadEnabled: colors.alpha.black75,
    uploadPressed: colors.alpha.black50,
    uploadBorder: colors.alpha.white20,
    photoCount: colors.alpha.black50,
  },

  saveButton: {
    deselected: colors.alpha.white75,
    selected: colors.scale.red[400],
    selectedBorder: colors.alpha.white50,
  },

  toggle: {
    on: colors.neutral[900],
    off: colors.neutral[200],
    knob: colors.neutral.white,
  },

  checkbox: {
    deselected: colors.neutral[400],
    selected: colors.neutral[900],
    check: colors.neutral.white,
  },

  segmentedControl: {
    selected: colors.neutral.white,
    background: colors.neutral[200],
  },

  textField: {
    default: colors.neutral[100],
  },

  chip: {
    default: colors.neutral[100],
    condition: colors.scale.blue[50],
    delivery: colors.brand.primary[100],
    dark: colors.neutral[900],
    red: colors.scale.red[50],
  },

  border: {
    light: colors.neutral[100],
    medium: colors.neutral[200],
    strong: colors.neutral[400],
    dark: colors.neutral[900],
    critical: colors.scale.red[400],
    warning: colors.scale.orange[500],
    success: colors.brand.primary[700],
  },

  toast: {
    default: colors.alpha.black90,
    surface: colors.neutral[800],
    shadow: colors.alpha.black8,
    text: colors.neutral.white,
  },
  overlay: {
    black25: colors.alpha.black25,
  },

  reference: {
    kakaoYellow: colors.brand.reference['kakao-yellow'],
    naverGreen: colors.brand.reference['naver-green'],
  },

  chat: {
    bubbleYou: colors.neutral[900],
    bubbleYouDisabled: colors.neutral[400],
    bubbleUser: colors.neutral[100],
  },

  logo: {
    gradientColor300: colors.brand.primary[300],
    gradientColor600: colors.brand.primary[600],
    gradientColor700: colors.brand.primary[700],
    gradientNeutral600: colors.neutral[600],
    gradientNeutral900: colors.neutral[900],
    gradientNeutralBlack: colors.neutral.black,
  },

  home: {
    primary300: colors.brand.primary[300],
    white: colors.neutral.white,
    neutral900: colors.neutral[900],
    neutral600: colors.neutral[600],
    neutral700: colors.neutral[700],
    dark: colors.neutral[900],
  },
  article: {
    neutral600: colors.neutral[600],
    neutral700: colors.neutral[700],
    neutral900: colors.neutral[900],
  },
  notification: {
    neutral400: colors.neutral[400],
    neutral600: colors.neutral[600],
    neutral700: colors.neutral[700],
    neutral900: colors.neutral[900],
  },
};

export { semanticColor };
