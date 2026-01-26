import AuthTextSection from '@/components/auth/AuthTextSection';
import AuthLayout from '@/components/auth/AuthLayout';
import TextFieldWithButton from '@/components/common/text-field/TextFieldWithButton';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { semanticNumber } from '@/styles/semantic-number';
import useAuthNavigation, { AuthStackParamList } from '@/hooks/navigation/useAuthNavigation';
import AuthErrorBottomSheet from '@/components/common/bottom-sheet/AuthErrorBottomSheet';
import useAuthApi from '@/hooks/apis/useAuthApi';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useToastStore } from '@/stores/toastStore';
import { useAuthSignupStore } from '@/stores/authSignupStore';

type WelcomeProps = NativeStackScreenProps<AuthStackParamList, 'AuthCode'>;
const TIMER_SECOND = 300;

const AuthCode = ({ route }: WelcomeProps) => {
  const navigation = useAuthNavigation();
  const { postEmailSend, postVerifyCode } = useAuthApi();
  const [code, setCode] = useState('');
  const [authErrorSheet, setAuthErrorSheet] = useState<boolean>(false);
  const [timerCount, setTimerCount] = useState<number>(TIMER_SECOND);
  const { type } = route.params;
  const showToast = useToastStore(s => s.show);
  const { email, setAccessToken, setRefreshToken, setProvider, setCode: setStoreCode } = useAuthSignupStore();

  useEffect(() => {
    postEmailSend(email, type);
    setTimerCount(TIMER_SECOND);
  }, [email, type]);
  useEffect(() => {
    if (timerCount <= 0) return;
    const timeId = setTimeout(() => setTimerCount(count => Math.max(0, count - 1)), 1000);
    return () => clearTimeout(timeId);
  }, [timerCount]);
  const handleVerifyCode = async () => {
    if (code) {
      const result = await postVerifyCode({ email, code, type });
      if (result.isValid) {
        setAccessToken(result.accessToken);
        setRefreshToken(result.refreshToken);
        setProvider(result.provider);
        setStoreCode(code);
        navigation.replace('SetPassword', { code, isReset: type === 'PASSWORD_RESET' });
        showToast({ message: '인증 완료', image: 'EmojiCheckMarkButton', duration: 1000 });
      } else {
        showToast({ message: '코드 정보가 일치하지 않아요.', image: 'EmojiRedExclamationMark', duration: 1000 });
      }
    }
  };
  const handleResend = () => {
    postEmailSend(email, type);
    setTimerCount(TIMER_SECOND);
    showToast({ message: '인증 코드를 재발송했어요.', image: 'EmojiEnvelope', duration: 1000 });
  };
  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <AuthLayout
      headerTitle="인증 코드 입력하기"
      buttonText="다음"
      onPress={handleVerifyCode}
      buttonDisabled={code.length == 0}>
      <AuthTextSection title="인증 코드를 입력해 주세요." desc="메일의 경우 스팸함도 확인해 주세요." />
      <View style={styles.textFieldContainer}>
        <TextFieldWithButton
          label="인증 코드"
          placeholder="인증 코드 6자 입력"
          inputText={code}
          setInputText={setCode}
          buttonText="코드 재발송"
          onPress={handleResend}
          textButtonText="인증 코드가 오지 않아요"
          onTextButtonPress={() => setAuthErrorSheet(true)}
          validState="success"
          validText={`남은 시간 ${formatTime(timerCount)}`}
          align="right"
        />
      </View>
      <AuthErrorBottomSheet visible={authErrorSheet} onClose={() => setAuthErrorSheet(false)} />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  textFieldContainer: {
    padding: semanticNumber.spacing[16],
  },
});

export default AuthCode;
