import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthTextSection from '@/components/auth/AuthTextSection';
import TextField from '@/components/common/text-field/TextField';
import { semanticNumber } from '@/styles/semantic-number';
import useAuthNavigation, { AuthStackParamList } from '@/hooks/navigation/useAuthNavigation';
import useAuthApi from '@/hooks/apis/useAuthApi';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import CheckAlarmsetting from '@/components/permission-check/util/CheckAlarmsetting';
import { AvoidSoftInput } from 'react-native-avoid-softinput';
import { useToastStore } from '@/stores/toastStore';
import { useAuthSignupStore } from '@/stores/authSignupStore';

type SetPasswordProps = NativeStackScreenProps<AuthStackParamList, 'SetPassword'>;

const SetPassword = ({ route }: SetPasswordProps) => {
  const navigation = useAuthNavigation();
  const { code, isReset } = route.params;
  const { postResetPassword } = useAuthApi();
  const { email, setPassword: setStorePassword } = useAuthSignupStore();
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);
  const [isSamePassword, setIsSamePassword] = useState(true);
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,32}$/;
  const { androidToken, iosAlarmToken } = CheckAlarmsetting();
  const deviceToken = Platform.OS === 'android' ? androidToken() : iosAlarmToken();
  const showToast = useToastStore(s => s.show);

  const onPress = async () => {
    if (password === confirmPassword) {
      setIsSamePassword(true);

      if (isReset) {
        if (!code) return;
        try {
          await postResetPassword({ email, code, newPassword: password });
          console.log('[SetPassword][postResetPassword] success');
          showToast({ message: '비밀번호 재설정 완료', image: 'EmojiCheckMarkButton', duration: 1000 });
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        } catch (error: any) {
          showToast({ message: '다른 비밀번호로 설정해 주세요.', image: 'EmojiRedExclamationMark', duration: 1000 });
          console.log('[SetPassword][postResetPassword] failed ', error);
          console.log('[SetPassword][postResetPassword] failed ', error.response);
        }
      } else {
        setStorePassword(password);
        navigation.navigate('SetNickname');
      }
    } else {
      setIsSamePassword(false);
      showToast({ message: '비밀번호가 맞지 않아요', image: 'EmojiRedExclamationMark', duration: 1000 });
    }
  };

  useEffect(() => {
    const sub = AvoidSoftInput.onSoftInputHeightChange(() => {});
    return () => sub.remove();
  }, []);

  return (
    <AuthLayout headerTitle="비밀번호 설정" buttonText="다음" onPress={onPress} buttonDisabled={!isPasswordValid}>
      <View style={{ flex: 1 }}>
        <AuthTextSection title="비밀번호를 설정해 주세요." desc="영문+숫자+특수문자 조합, 8~32자" />
        <View style={styles.textFieldContainer}>
          <TextField
            placeholder="비밀번호 입력"
            inputText={password}
            setInputText={setPassword}
            isPassword
            onBlur={() => {
              setIsPasswordTouched(true);
              setIsPasswordValid(passwordRegex.test(password));
            }}
            validation={{
              isValid: isPasswordTouched && !isPasswordValid,
              validState: isPasswordValid,
              validText: '비밀번호 조건을 다시 확인해 주세요.',
            }}
          />
          <TextField
            placeholder="비밀번호 확인"
            inputText={confirmPassword}
            setInputText={setConfirmPassword}
            isPassword
            validation={{
              isValid: !isSamePassword,
              validState: isSamePassword,
              validText: '다시 입력해 주세요.',
            }}
          />
        </View>
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

export default SetPassword;
