import { Platform, View, TextInput, StyleSheet, Text } from 'react-native';
import IconAlertCircle from '@/assets/icons/IconAlertCircle.svg';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import formatNumberWithComma from '@/utils/formatNumberWithComma';

interface PriceFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  isError?: boolean;
}

const PriceField: React.FC<PriceFieldProps> = ({ value, onChange, placeholder = '0', label = '가격', isError }) => {
  const maxValue = 50000000;
  const maxLength = 8;
  const overflowError = Number(value) > maxValue;
  const showError = isError ?? overflowError;
  const handleChange = (text: string) => {
    const onlyNumber = text.replace(/\D/g, '').slice(0, maxLength);
    onChange(onlyNumber);
  };
  return (
    <View style={styles.column}>
      <View style={[styles.container, showError ? borderStyle.error : borderStyle.default]}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.priceGroup}>
          <TextInput
            multiline
            scrollEnabled={false}
            style={[styles.value, showError && styles.valueError]}
            value={formatNumberWithComma(value)}
            onChangeText={handleChange}
            placeholder={placeholder}
            keyboardType="numeric"
          />
          <Text style={[styles.currency, showError ? textStyle.error : textStyle.default]}>원</Text>
        </View>
      </View>
      {showError && (
        <View style={styles.caption}>
          <IconAlertCircle
            width={16}
            height={16}
            stroke={semanticColor.icon.critical}
            strokeWidth={semanticNumber.stroke.bold}
          />
          <Text style={styles.captionText}>1,000원보다 높은 금액으로 설정해 주세요.</Text>
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
    backgroundColor: semanticColor.surface.lightGray,
  },
  label: {
    color: semanticColor.text.primary,
    ...semanticFont.label.large,
  },
  priceGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    columnGap: semanticNumber.spacing[4],
    height: 28,
  },
  value: {
    flex: 1,
    color: semanticColor.text.secondary,
    alignItems: 'center',
    textAlign: 'right',
    ...semanticFont.title.large,
    ...Platform.select({
      ios: {
        paddingTop: 0,
        paddingBottom: 0,
        lineHeight: 25,
      },
      android: {
        textAlignVertical: 'center',
        paddingVertical: 0,
        includesFontPadding: false,
      },
    }),
  },
  currency: {
    color: semanticColor.text.secondary,
    ...semanticFont.body.large,
  },
  caption: {
    flexDirection: 'row',
    columnGap: semanticNumber.spacing[4],
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: 18,
    marginTop: semanticNumber.spacing[4],
  },
  captionText: {
    color: semanticColor.text.critical,
    ...semanticFont.caption.large,
  },
  valueError: {
    color: semanticColor.text.critical,
  },
});
const borderStyle = StyleSheet.create({
  default: {
    borderWidth: semanticNumber.stroke.medium,
    borderColor: semanticColor.border.light,
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

export default PriceField;
