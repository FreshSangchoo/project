import { fonts } from '@/styles/fonts';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CustomerServiceProps {
  infoIcon: React.ReactNode;
  title: string;
  subTitle: string;
  buttonIcon?: React.ReactNode;
  isGray?: boolean;
  activeOpacity?: number;
  onPress: () => void;
}

function CustomerService({
  infoIcon,
  title,
  subTitle,
  buttonIcon,
  isGray = true,
  activeOpacity,
  onPress,
}: CustomerServiceProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      {...(activeOpacity !== undefined && { activeOpacity })}
      style={isGray ? styles.customerServiceGray : styles.customerService}>
      <View style={styles.infoIconWrapper}>{infoIcon}</View>
      <View style={styles.infoTextWrapper}>
        <Text style={isGray ? styles.titleTextOnGray : styles.titleText}>{title}</Text>
        <Text style={styles.subTitleText}>{subTitle}</Text>
      </View>
      <View style={styles.buttonIconWrapper}>{buttonIcon}</View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  customerService: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: semanticColor.surface.white,
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[12],
    borderRadius: semanticNumber.borderRadius.lg,
    width: Dimensions.get('window').width - 32,
  },
  customerServiceGray: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: semanticColor.surface.lightGray,
    padding: semanticNumber.spacing[16],
    borderRadius: semanticNumber.borderRadius.lg,
    width: Dimensions.get('window').width - 32,
  },
  infoIconWrapper: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextWrapper: {
    flex: 1,
    marginLeft: semanticNumber.spacing[12],
  },
  titleText: {
    fontFamily: fonts.family.semibold,
    fontSize: fonts.size.MD,
    lineHeight: fonts.lineHeight.MD,
    letterSpacing: fonts.letterSpacing.none,
    color: semanticColor.text.primary,
  },
  titleTextOnGray: {
    fontFamily: fonts.family.semibold,
    fontSize: fonts.size.MD,
    lineHeight: fonts.lineHeight.MD,
    letterSpacing: fonts.letterSpacing.none,
    color: semanticColor.home.neutral700,
  },
  subTitleText: {
    fontFamily: fonts.family.regular,
    fontSize: fonts.size['3XS'],
    lineHeight: fonts.lineHeight['3XS'],
    letterSpacing: fonts.letterSpacing.none,
    color: semanticColor.text.tertiary,
  },
  buttonIconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    color: semanticColor.icon.lightest,
  },
});

export default CustomerService;
