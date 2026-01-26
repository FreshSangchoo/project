import { fonts } from '@/styles/fonts';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import IconAlertCircle from '@/assets/icons/IconAlertCircle.svg';
import IconCheck from '@/assets/icons/IconCheck.svg';
import IconInfoCircle from '@/assets/icons/IconInfoCircle.svg';
import VariantButton from '@/components/common/button/VariantButton';
import TextButton, { TextButtonAlign } from '@/components/common/button/TextButton';
import { semanticFont } from '@/styles/semantic-font';

type ValidStates = 'normal' | 'success' | 'fail' | 'edit';

interface TextFieldProps {
  label: string;
  placeholder: string;
  inputText: string;
  setInputText?: React.Dispatch<React.SetStateAction<string>>;
  buttonText: string;
  onPress: () => void;
  validState?: ValidStates;
  validText?: string;
  textButtonText?: string;
  onTextButtonPress?: () => void;
  onFocus?: () => void;
  align?: TextButtonAlign;
  underline?: boolean;
  disabled?: boolean;
}

const TextFieldWithButton = ({
  label,
  placeholder,
  inputText,
  setInputText,
  buttonText,
  onPress,
  validState,
  validText,
  textButtonText,
  onTextButtonPress,
  onFocus,
  align,
  underline,
  disabled,
}: TextFieldProps) => {
  const labelColor = validState ? semanticColor.text.secondary : semanticColor.text.critical;
  const inputContainerStyle = [styles.inputContainer, !validState && { borderColor: semanticColor.border.critical }];
  const validationTextColor =
    validState === 'success'
      ? semanticColor.text.success
      : validState === 'fail'
      ? semanticColor.text.critical
      : semanticColor.text.secondary;
  const getValidIcon = (state: ValidStates) => {
    switch (state) {
      case 'normal':
        return (
          <IconInfoCircle
            width={16}
            height={16}
            stroke={semanticColor.icon.secondary}
            strokeWidth={semanticNumber.stroke.light}
          />
        );
      case 'success':
        return (
          <IconCheck
            width={16}
            height={16}
            stroke={semanticColor.icon.success}
            strokeWidth={semanticNumber.stroke.light}
          />
        );
      case 'fail':
        return (
          <IconAlertCircle
            width={16}
            height={16}
            stroke={semanticColor.icon.critical}
            strokeWidth={semanticNumber.stroke.bold}
          />
        );
      case 'edit':
        return (
          <IconCheck
            width={16}
            height={16}
            stroke={semanticColor.icon.secondary}
            strokeWidth={semanticNumber.stroke.light}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <View style={inputContainerStyle}>
        <TextInput
          value={inputText}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={semanticColor.text.tertiary}
          onChangeText={setInputText}
          onFocus={onFocus}
        />
        <VariantButton theme="main" onPress={onPress} disabled={disabled}>
          {buttonText}
        </VariantButton>
      </View>
      <View style={styles.textFieldBottomContainer}>
        {validState && (
          <View style={styles.validContainer}>
            {getValidIcon(validState)}
            <Text style={[styles.validText, { color: validationTextColor }]}>{validText}</Text>
          </View>
        )}
        {textButtonText && (
          <TextButton onPress={onTextButtonPress!} align={align!} underline={underline}>
            {textButtonText}
          </TextButton>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: semanticNumber.spacing[8],
  },
  label: {
    fontFamily: fonts.family.semibold,
    fontSize: fonts.size.MD,
    lineHeight: fonts.lineHeight.MD,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: semanticNumber.spacing[16],
    borderRadius: semanticNumber.borderRadius.lg,
    backgroundColor: semanticColor.surface.lightGray,
  },
  input: {
    flex: 1,
    height: '100%',
    color: semanticColor.text.primary,
    ...semanticFont.body.large,
  },
  textFieldBottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[4],
  },
  validText: {
    fontFamily: fonts.family.regular,
    fontSize: fonts.size['2XS'],
    lineHeight: fonts.lineHeight['2XS'],
  },
});

export default TextFieldWithButton;
