import { fonts } from '@/styles/fonts';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import {
  KeyboardTypeOptions,
  Platform,
  ReturnKeyType,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import IconAlertCircle from '@/assets/icons/IconAlertCircle.svg';
import IconCheck from '@/assets/icons/IconCheck.svg';
import IconEye from '@/assets/icons/IconEye.svg';
import IconEyeOff from '@/assets/icons/IconEyeOff.svg';
import { semanticFont } from '@/styles/semantic-font';
import { useState } from 'react';

interface TextFieldProps {
  label?: string;
  placeholder: string;
  inputText: string;
  setInputText?: (value: string) => void;
  isPassword?: boolean;
  keyboardType?: KeyboardTypeOptions;
  onBlur?: () => void;
  validation?: {
    isValid?: boolean;
    validState?: boolean;
    validText?: string;
  };
  returnKeyType?: ReturnKeyType;
  onSubmitEditing?: () => void;
}

const TextField = ({
  label,
  placeholder,
  inputText,
  setInputText,
  isPassword,
  keyboardType,
  onBlur,
  validation,
  returnKeyType,
  onSubmitEditing,
}: TextFieldProps) => {
  const isError = validation?.isValid && !validation?.validState;
  const labelColor =
    !validation?.isValid || validation.validState ? semanticColor.text.secondary : semanticColor.text.critical;
  const inputContainerStyle = [styles.inputContainer, isError && { borderColor: semanticColor.border.critical }];
  const validationTextColor = validation?.validState ? semanticColor.text.success : semanticColor.text.critical;
  const [isSecure, setIsSecure] = useState(isPassword);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: labelColor }]}>{label}</Text>}
      <View style={inputContainerStyle}>
        <TextInput
          value={inputText}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={semanticColor.text.tertiary}
          onChangeText={setInputText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          onBlur={onBlur}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          textContentType="none"
          {...(Platform.OS === 'android' && {
            autoCorrect: false,
            autoComplete: 'off',
          })}
        />
        {isPassword &&
          (isSecure ? (
            <TouchableOpacity style={styles.iconEyeContainer} onPress={() => setIsSecure(false)}>
              <IconEye
                width={20}
                height={20}
                stroke={semanticColor.text.secondary}
                strokeWidth={semanticNumber.stroke.medium}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.iconEyeContainer} onPress={() => setIsSecure(true)}>
              <IconEyeOff
                width={20}
                height={20}
                stroke={semanticColor.text.secondary}
                strokeWidth={semanticNumber.stroke.medium}
              />
            </TouchableOpacity>
          ))}
      </View>
      {validation?.isValid && (
        <View style={styles.validContainer}>
          {validation?.validState ? (
            <IconCheck
              width={16}
              height={16}
              stroke={semanticColor.icon.success}
              strokeWidth={semanticNumber.stroke.light}
            />
          ) : (
            <IconAlertCircle
              width={16}
              height={16}
              stroke={semanticColor.icon.critical}
              strokeWidth={semanticNumber.stroke.bold}
            />
          )}
          <Text style={[styles.validText, { color: validationTextColor }]}>{validation?.validText}</Text>
        </View>
      )}
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
    borderWidth: semanticNumber.stroke.medium,
    borderColor: semanticColor.border.light,
    backgroundColor: semanticColor.surface.lightGray,
  },
  input: {
    flex: 1,
    height: '100%',
    color: semanticColor.text.primary,
    fontFamily: fonts.family.regular,
    fontSize: fonts.size.MD,
    padding: 0,
    textAlignVertical: 'center',
  },
  validContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[4],
  },
  validText: {
    ...semanticFont.caption.large,
  },
  iconEyeContainer: {
    width: 44,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});

export default TextField;
