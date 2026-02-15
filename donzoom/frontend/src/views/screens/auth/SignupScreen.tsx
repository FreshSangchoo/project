import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import useForm from '@/hooks/useForm';
import useSignupForm from '@/hooks/useSignupForm';
import {useSignupStore} from '@/stores/useAuthStore';
import {validateSignup} from '@/utils';
import CustomButton from '@/views/components/CustomButton';
import InputField from '@/views/components/InputField';
import React, {useRef, useState} from 'react';
import {
  TextInput,
  Alert,
  Keyboard,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {Image, StyleSheet, Text, View} from 'react-native';

function SignupScreen({navigation}: any) {
  const passwordRef = useRef<TextInput | null>(null);
  const passwordConfirmRef = useRef<TextInput | null>(null);
  const [selected, setSelected] = useState('');
  const {values, errors, touched, getTextInputProps} = useSignupForm();

  const handleNext = () => {
    if (!errors.email && !errors.password && !errors.passwordConfirm) {
      navigation.navigate('부모/아이 설정');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 200}>
      <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled">
        <TouchableOpacity activeOpacity={1} onPress={Keyboard.dismiss}>
          <View style={styles.imgContainer}>
            <Image
              source={require('@/assets/image/pig.png')}
              style={styles.pig}
            />
          </View>
          <View style={styles.signupText}>
            <Text style={styles.text}>돈 줌(Zoom) 회원가입</Text>
          </View>
          <View style={styles.inputContainer}>
            <InputField
              autoFocus
              placeholder="이메일"
              error={errors.email}
              touched={touched.email}
              inputMode="email"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current?.focus()}
              {...getTextInputProps('email')}
              style={[
                styles.input,
                touched.email && errors.email
                  ? styles.errorInput
                  : selected === '아이디' && styles.selectedInput,
              ]}
              onFocus={() => setSelected('아이디')}
            />
            <InputField
              ref={passwordRef}
              placeholder="비밀번호 (영문, 숫자, 특수문자)"
              textContentType="oneTimeCode"
              error={errors.password}
              touched={touched.password}
              secureTextEntry
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordConfirmRef.current?.focus()}
              {...getTextInputProps('password')}
              style={[
                styles.input,
                touched.password && errors.password
                  ? styles.errorInput
                  : selected === '비밀번호' && styles.selectedInput,
              ]}
              onFocus={() => setSelected('비밀번호')}
            />
            <InputField
              ref={passwordConfirmRef}
              placeholder="비밀번호 확인"
              error={errors.passwordConfirm}
              touched={touched.passwordConfirm}
              secureTextEntry
              {...getTextInputProps('passwordConfirm')}
              style={[
                styles.input,
                touched.passwordConfirm && errors.passwordConfirm
                  ? styles.errorInput
                  : selected === '비밀번호 확인' && styles.selectedInput,
              ]}
              onFocus={() => setSelected('비밀번호 확인')}
            />
          </View>
          <TouchableOpacity>
            <View style={styles.nextButtonContainer}>
              <CustomButton
                label="다음으로"
                variant="auth"
                onPress={handleNext}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 0,
    margin: 0,
    flexGrow: 1,
  },
  imgContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pig: {
    width: 152,
    height: 152,
    marginTop: 34,
    justifyContent: 'center',
  },
  signupText: {
    fontFamily: fonts.LIGHT,
    marginTop: 13,
    justifyContent: 'center',
    fontSize: 18,
  },
  text: {
    fontSize: 18,
    fontFamily: 'GmarketSansTTFBold',
    color: colors.BLACK,
    textAlign: 'center',
  },
  input: {
    width: 215,
    fontSize: 14,
    fontFamily: fonts.LIGHT,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_100,
    // backgroundColor: 'green',
  },
  inputContainer: {
    marginTop: 20,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonContainer: {
    marginTop: 33,
  },
  selectedInput: {
    borderColor: colors.BLUE_100,
  },
  errorInput: {
    borderBottomWidth: 1,
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default SignupScreen;
