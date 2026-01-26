import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AuthTextSection from '@/components/auth/AuthTextSection';
import TextField from '@/components/common/text-field/TextField';
import { semanticNumber } from '@/styles/semantic-number';
import AuthLayout from '@/components/auth/AuthLayout';
import useAuthNavigation from '@/hooks/navigation/useAuthNavigation';
import { useEmailStore } from '@/stores/authEmail';

const ForgotPasswordViaEmail = () => {
  const navigation = useAuthNavigation();
  const email = useEmailStore(s => s.email);
  const setEmail = useEmailStore(s => s.setEmail);
  const emailRegex = useEmailStore(s => s.validate);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const onPress = () => {
    if (emailRegex(email)) {
      setIsEmailValid(true);
      navigation.navigate('AuthCode', { type: 'PASSWORD_RESET' });
    } else setIsEmailValid(false);
  };

  return (
    <AuthLayout headerTitle="비밀번호 찾기" buttonText="인증 코드 받기" onPress={onPress} buttonDisabled={!email}>
      <AuthTextSection title="이메일을 입력해 주세요." desc="인증 코드를 메일 주소로 보내드릴게요." />
      <View style={styles.textFieldContainer}>
        <TextField
          label="이메일"
          placeholder="your@email.com"
          inputText={email}
          setInputText={setEmail}
          validation={{
            isValid: email.length > 0 && !isEmailValid,
            validState: isEmailValid,
            validText: '올바른 이메일 형식으로 작성해 주세요.',
          }}
        />
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  textFieldContainer: {
    padding: semanticNumber.spacing[16],
  },
});

export default ForgotPasswordViaEmail;
