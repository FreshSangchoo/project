import { StyleSheet, View } from 'react-native';
import { useState } from 'react';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthTextSection from '@/components/auth/AuthTextSection';
import TextField from '@/components/common/text-field/TextField';
import { semanticNumber } from '@/styles/semantic-number';

const ForgotEmail = () => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const formatPhoneNumber = (value: string): string => {
    const onlyNumbers = value.replace(/\D/g, '');
    if (onlyNumbers.length <= 3) return onlyNumbers;
    if (onlyNumbers.length <= 7) return `${onlyNumbers.slice(0, 3)}-${onlyNumbers.slice(3)}`;
    return `${onlyNumbers.slice(0, 3)}-${onlyNumbers.slice(3, 7)}-${onlyNumbers.slice(7, 11)}`;
  };

  return (
    <AuthLayout
      headerTitle="이메일 찾기"
      buttonText="인증 코드 받기"
      buttonDisabled={!name || !phoneNumber}
      onPress={() => console.log()}>
      <AuthTextSection title="가입 정보를 입력해 주세요." desc="인증 코드를 문자를 보내드릴게요." />
      <View style={styles.textFieldContainer}>
        <TextField label="이름" placeholder="이름 입력" inputText={name} setInputText={setName} />
        <TextField
          label="휴대폰 번호"
          placeholder="숫자만 입력"
          inputText={phoneNumber}
          setInputText={text => setPhoneNumber(formatPhoneNumber(text))}
          keyboardType="phone-pad"
        />
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  textFieldContainer: {
    padding: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[24],
  },
});

export default ForgotEmail;
