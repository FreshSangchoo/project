import { Platform, StyleSheet, View } from 'react-native';
import AuthLayout from '@/components/auth/AuthLayout';
import Logo from '@/assets/icons/Logo.svg';
import TextField from '@/components/common/text-field/TextField';
import { useEffect, useState } from 'react';
import TextButton from '@/components/common/button/TextButton';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import useAuthNavigation from '@/hooks/navigation/useAuthNavigation';
import useAuthApi from '@/hooks/apis/useAuthApi';
import useUserApi from '@/hooks/apis/useUserApi';
import { useUserStore } from '@/stores/userStore';
import { useAuthSignupStore } from '@/stores/authSignupStore';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';
import useUserChatApi from '@/hooks/apis/useUserChat';
import { loginWithToken } from '@/libs/talkplus';
import CheckAlarmsetting from '@/components/permission-check/util/CheckAlarmsetting';
import { AvoidSoftInput } from 'react-native-avoid-softinput';
import { useToastStore } from '@/stores/toastStore';

const EmailLogin = () => {
  const rootNavigation = useRootNavigation();
  const navigation = useAuthNavigation();
  const email = useAuthSignupStore(s => s.email);
  const { postSignin } = useAuthApi();
  const { clear: clearSignupStore } = useAuthSignupStore();
  const [password, setPassword] = useState('');
  const [isValid, setIsValid] = useState<boolean | undefined>(undefined);
  const [validCount, setValidCount] = useState<number>(5);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getProfile } = useUserApi();
  const setProfile = useUserStore(s => s.setProfile);
  const { postChatUserLogin } = useUserChatApi();
  const { androidToken, iosAlarmToken } = CheckAlarmsetting();
  const deviceToken = Platform.OS === 'android' ? androidToken() : iosAlarmToken();
  const showToast = useToastStore(s => s.show);

  const onPress = async () => {
    if (isLoading) return;

    if (!email?.trim() || !password?.trim()) {
      setIsValid(false);
      showToast({ message: '비밀번호를 입력해 주세요.', image: 'EmojiRedExclamationMark', duration: 1500 });
      return;
    }

    setIsLoading(true);

    try {
      const ok = await postSignin({ email, password, provider: 'LOCAL', deviceToken: String(deviceToken) });

      console.log('[EmailLogin] postSignin result', ok);

      setIsValid(!ok);

      if (ok) {
        try {
          const myProfile = await getProfile();
          setProfile({ ...myProfile, email: email, provider: 'LOCAL' });

          if (myProfile.verified) {
            const { loginToken } = await postChatUserLogin();
            await loginWithToken(String(myProfile.userId), loginToken);
          }

          clearSignupStore();
          rootNavigation.reset({ index: 0, routes: [{ name: 'NavBar', params: { screen: 'Home' } }] });
        } catch (error) {
          console.log('[EmailLogin][getProfile] error: ', error);
        }
      } else {
        const next = validCount - 1;
        setValidCount(next);

        if (next === 4) {
          showToast({ message: '비밀번호가 맞지 않아요.', image: 'EmojiRedExclamationMark', duration: 1000 });
        } else if (next === 3) {
          showToast({
            message: '비밀번호 오류 5회 시 5분동안 제한됩니다. (2/5)',
            image: 'EmojiRedExclamationMark',
            duration: 2000,
          });
        } else if (next === 2) {
          showToast({
            message: '비밀번호 오류 5회 시 5분동안 제한됩니다. (3/5)',
            image: 'EmojiRedExclamationMark',
            duration: 2000,
          });
        } else if (next === 1) {
          showToast({
            message: '비밀번호 오류 5회 시 5분동안 제한됩니다. (4/5)',
            image: 'EmojiRedExclamationMark',
            duration: 2000,
          });
        } else if (next === 0) {
          showToast({ message: '5분 뒤에 다시 시도해 주세요.', image: 'EmojiRedExclamationMark', duration: 2000 });
        }

        console.log('[EmailLogin] validCount(next): ', next);
      }
    } catch (error) {
      if (__DEV__) {
        console.log('[EmailLogin][postSignIn] error: ', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (validCount !== 0) return;
    const t = setTimeout(() => setValidCount(6), 5 * 60 * 1000);
    return () => clearTimeout(t);
  }, [validCount]);

  useEffect(() => {
    const sub = AvoidSoftInput.onSoftInputHeightChange(() => {
      setIsAnimating(true);
      const t = setTimeout(() => setIsAnimating(false), 180);
      return () => clearTimeout(t);
    });
    return () => sub.remove();
  }, []);

  return (
    <AuthLayout
      headerTitle="로그인"
      buttonText={isLoading ? '로그인 중...' : '로그인'}
      onPress={onPress}
      buttonDisabled={validCount === 0 || isLoading || !password?.trim()}>
      <View style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.logoSection}>
            <Logo width={113} height={24} fill={semanticColor.icon.secondary} />
          </View>
          <View style={styles.textFieldContainer}>
            <TextField label="이메일" inputText={email} placeholder="" />
            <TextField
              label="비밀번호"
              placeholder="비밀번호 입력"
              inputText={password}
              setInputText={setPassword}
              isPassword
              validation={{
                isValid: isValid,
                validState: !isValid,
                validText: '다시 입력해 주세요.',
              }}
            />
          </View>
          <View style={styles.loginOptionContainer}>
            <TextButton align="right" onPress={() => navigation.navigate('ForgotPassword')}>
              비밀번호가 기억나지 않아요
            </TextButton>
          </View>
        </View>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: semanticNumber.spacing[16],
    alignItems: 'center',
  },
  logoSection: {
    paddingTop: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[8],
  },
  textFieldContainer: {
    gap: semanticNumber.spacing[24],
    paddingTop: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[8],
  },
  loginOptionContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingBottom: semanticNumber.spacing[16],
  },
  autoOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[6],
  },
  autoOption: {
    width: 20,
    height: 20,
    borderRadius: semanticNumber.borderRadius.sm,
    borderWidth: semanticNumber.stroke.xlight,
    borderColor: semanticColor.checkbox.deselected,
  },
  autoOptionText: {
    color: semanticColor.text.secondary,
    ...semanticFont.label.xsmall,
  },
});

export default EmailLogin;
