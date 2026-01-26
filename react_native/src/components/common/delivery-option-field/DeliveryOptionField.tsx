import { View, TextInput, StyleSheet, Text, Platform } from 'react-native';
import IconAlertCircle from '@/assets/icons/IconAlertCircle.svg';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import formatNumberWithComma from '@/utils/formatNumberWithComma';
import { fonts } from '@/styles/fonts';

interface DeliveryOptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

const DeliveryOptionField: React.FC<DeliveryOptionFieldProps> = ({
  value,
  onChange,
  placeholder = '100~50,000',
  label = '배송비',
}) => {
  const maxLength = 5;
  const minValue = 100;
  const maxValue = 50000;
  const handleChange = (text: string) => {
    const onlyNumbers = text.replace(/[^0-9]/g, '').slice(0, maxLength);
    onChange(onlyNumbers);
  };
  const isError = (Number(value) < minValue || Number(value) > maxValue) && value !== '';
  const errorText = () => {
    return Number(value) < minValue
      ? '100원보다 높은 금액으로 설정해 주세요'
      : '50,000원보다 낮은 금액으로 설정해 주세요';
  };
  return (
    <View style={styles.column}>
      <View style={[styles.container, isError ? borderStyle.error : borderStyle.default]}>
        <Text style={[styles.label, isError ? textStyle.error : textStyle.default]}>{label}</Text>
        <View style={styles.deliveryOptionGroup}>
          <TextInput
            style={[styles.value, isError ? textStyle.error : textStyle.default]}
            value={formatNumberWithComma(value)}
            onChangeText={handleChange}
            placeholder={placeholder}
            keyboardType="numeric"
          />
          <Text style={[styles.currency, isError ? textStyle.error : textStyle.default]}>원</Text>
        </View>
      </View>
      {isError && (
        <View style={styles.caption}>
          <IconAlertCircle
            width={16}
            height={16}
            stroke={semanticColor.icon.critical}
            strokeWidth={semanticNumber.stroke.bold}
          />
          <Text style={styles.captionText}>{errorText()}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    width: '100%',
    rowGap: semanticNumber.spacing[4],
  },
  container: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: semanticNumber.spacing[12],
    paddingHorizontal: semanticNumber.spacing[16],
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: semanticNumber.borderRadius.lg,
    backgroundColor: semanticColor.surface.gray,
  },
  label: {
    ...semanticFont.label.xsmall,
  },
  deliveryOptionGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    columnGap: semanticNumber.spacing[4],
  },
  value: {
    flex: 1,
    textAlign: 'right',
    ...semanticFont.title.small,
    ...Platform.select({
      ios: {
        paddingTop: semanticNumber.spacing.none,
        paddingBottom: semanticNumber.spacing.none,
        lineHeight: fonts.lineHeight.XS,
        textAlignVertical: 'center',
      },
      android: {
        textAlignVertical: 'center',
        paddingVertical: semanticNumber.spacing.none,
        includesFontPadding: false,
      },
    }),
  },
  currency: {
    ...semanticFont.body.small,
  },
  caption: {
    flexDirection: 'row',
    columnGap: semanticNumber.spacing[4],
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: 18,
  },
  captionText: {
    color: semanticColor.text.critical,
    ...semanticFont.caption.large,
  },
});
const borderStyle = StyleSheet.create({
  default: {
    borderWidth: semanticNumber.stroke.medium,
    borderColor: semanticColor.surface.lightGray,
  },
  error: {
    borderWidth: semanticNumber.stroke.medium,
    borderColor: semanticColor.text.critical,
  },
});

const textStyle = StyleSheet.create({
  default: {
    color: semanticColor.text.secondary,
  },
  error: {
    color: semanticColor.text.critical,
  },
});
export default DeliveryOptionField;
