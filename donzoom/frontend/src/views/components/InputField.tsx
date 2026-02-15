import React, {
  ForwardedRef,
  forwardRef,
  useRef,
  useEffect,
  useState,
} from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import {mergeRefs} from '@/utils/common';

// Android에서 LayoutAnimation 사용을 위한 설정
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const deviceHeight = Dimensions.get('screen').height;

interface InputFieldProps extends TextInputProps {
  disabled?: boolean;
  error?: string;
  touched?: boolean;
}

const InputField = forwardRef(
  (
    {disabled = false, error, touched, ...props}: InputFieldProps,
    ref?: ForwardedRef<TextInput>,
  ) => {
    const innerRef = useRef<TextInput | null>(null);
    const [errorHeight, setErrorHeight] = useState(0);

    useEffect(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setErrorHeight(touched && Boolean(error) ? 40 : 0); // 에러 메시지의 대략적인 높이
    }, [touched, error]);

    const handlePressInput = () => {
      innerRef.current?.focus();
    };

    return (
      <Pressable
        onPress={handlePressInput}
        style={[
          styles.container,
          {height: 40 + errorHeight}, // 기본 높이 + 에러 메시지 높이
          disabled && styles.disabled,
          touched && Boolean(error) && styles.inputError,
        ]}>
        <View>
          <TextInput
            ref={ref ? mergeRefs(innerRef, ref) : innerRef}
            placeholderTextColor={colors.GRAY_75}
            style={[styles.input, disabled && styles.disabled]}
            autoCapitalize="none"
            spellCheck={false}
            autoCorrect={false}
            {...props}
          />
          {touched && Boolean(error) && (
            <Text style={styles.error}>{error}</Text>
          )}
        </View>
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    // width: 200, // 인풋필드 너비 미정으로 바꿔둠
    overflow: 'hidden', // 에러 메시지가 컨테이너를 벗어나지 않도록 함
  },
  input: {
    height: 40, // 인풋의 기본 높이
    fontSize: 14,
    textAlign: 'center',
    color: colors.BLACK,
    fontFamily: fonts.LIGHT,
  },
  disabled: {
    backgroundColor: colors.GRAY_25,
    color: colors.GRAY_100,
  },
  inputError: {
    // borderBottomWidth: 1,
    borderColor: 'red',
  },
  error: {
    color: 'red',
    fontSize: 12,
    padding: 5,
    textAlign: 'center',
  },
});

export default InputField;
