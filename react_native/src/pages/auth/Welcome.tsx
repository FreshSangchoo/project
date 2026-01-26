import { Alert, Platform, StatusBar, StyleSheet, View } from 'react-native';
import LogoVertical from '@/assets/icons/LogoVertical.svg';
import SignupOption from '@/components/auth/SignupOption';
import TextButton from '@/components/common/button/TextButton';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { useUserStore } from '@/stores/userStore';
import useAuthNavigation, { AuthStackParamList } from '@/hooks/navigation/useAuthNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import PolicyBottomSheet from '@/components/common/bottom-sheet/PolicyBottomSheet';
import { AppleButton } from '@invertase/react-native-apple-authentication';
import useSocial from '@/hooks/apis/useSocial';
import useAuthApi from '@/hooks/apis/useAuthApi';
import AlertToast from '@/components/common/toast/AlertToast';
import useUserApi from '@/hooks/apis/useUserApi';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import CheckAlarmsetting from '@/components/permission-check/util/CheckAlarmsetting';
import { Provider } from '@/types/user';
import EncryptedStorage from 'react-native-encrypted-storage';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';
import { useAuthSignupStore } from '@/stores/authSignupStore';

const isAndroid = Platform.OS === 'android';
type WelcomeProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const Welcome = ({ route }: WelcomeProps) => {
  const navigation = useAuthNavigation();
  const rootNavigation = useRootNavigation();
  const setProvider = useUserStore(s => s.setAuthProvider);
  const cameFromSocialRef = useRef(false);
  const [showAlertToast, setShowAlertToast] = useState<boolean>(false);
  const [isPolicyBottomSheet, setIsPolicyBottomSheet] = useState<boolean>(false);
  const guestProfile = useUserStore(s => s.setGuest);
  const setProfile = useUserStore(s => s.setProfile);
  const setAccessToken = useAuthSignupStore(s => s.setAccessToken);
  const { postAnonymous, postSignin } = useAuthApi();
  const { getProfile } = useUserApi();
  const { signInWithNaver, signInWithApple, signInWithKakao } = useSocial();
  const { androidToken, iosAlarmToken } = CheckAlarmsetting();
  const deviceToken = isAndroid ? androidToken() : iosAlarmToken();
  const { token, provider } = (route?.params ?? {}) as {
    token?: string;
    provider?: Provider;
  };

  const toProvider = (p: string | null | undefined) =>
    (p === 'NAVER' || p === 'KAKAO' || p === 'GOOGLE' || p === 'LOCAL' || p === 'FIREBASE' ? p : null) as Exclude<
      Provider,
      'ANONYMOUS'
    > | null;

  const enterGuest = async () => {
    const response = await postAnonymous();
    if (response.ok) {
      guestProfile();
      rootNavigation.reset({ index: 0, routes: [{ name: 'NavBar', params: { screen: 'Home' } }] });
    } else {
      setShowAlertToast(true);
    }
  };

  useEffect(() => {
    if (!token || !provider) return;
    cameFromSocialRef.current = true;
    let canceled = false;
    (async () => {
      try {
        console.log('deviceToken: ', String(deviceToken));

        const ok = await postSignin({
          token,
          provider,
          deviceToken: String(deviceToken ?? ''),
        });
        if (!ok || canceled) return;

        const savedProvider = await EncryptedStorage.getItem('provider');
        if (__DEV__) {
          console.log('[Welcome] provider: ', savedProvider);
        }

        try {
          const profile = await getProfile();
          if (canceled) return;

          if (cameFromSocialRef.current) {
            setProfile({ ...profile, provider: savedProvider });
            rootNavigation.reset({ index: 0, routes: [{ name: 'NavBar', params: { screen: 'Home' } }] });
          }
        } catch (error: any) {
          const status = error?.response?.status ?? error?.status;
          if (status === 403 && cameFromSocialRef.current) {
            if (canceled) return;

            const savedProvider = await EncryptedStorage.getItem('provider');
            const savedAccessToken = await EncryptedStorage.getItem('accessToken');

            console.log('[Welcome 403] savedProvider:', savedProvider);
            console.log('[Welcome 403] savedAccessToken (JWT):', savedAccessToken);

            setProvider(toProvider(savedProvider));

            // 소셜로그인 신규 유저: postSignin 403 응답에서 저장된 JWT 토큰을 authSignupStore에 저장
            if (savedAccessToken) {
              setAccessToken(savedAccessToken);
            }

            setIsPolicyBottomSheet(true);

            cameFromSocialRef.current = false;
            return;
          } else if (status === 409) {
            const until =
              error?.response?.data?.data?.reactivationAvailableDate || error?.response?.data?.reactivationAvailableAt;
            Alert.alert('재가입 대기 중', until ? `재가입 가능: ${until}` : '탈퇴 후 7일 이내에는 재가입할 수 없어요.');
            return;
          }
          throw error;
        }
      } catch (e: any) {
        if (__DEV__) {
          const res = e?.response;
          console.log('[signin/profile effect] error:', res ? { status: res.status, data: res.data.data } : e);
        }
        setShowAlertToast(true);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [token, provider]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={semanticColor.surface.dark} />
      <View style={styles.logoContainer}>
        <LogoVertical color={semanticColor.icon.brandOnDark} />
      </View>
      <View style={styles.sighupOptionSection}>
        {!isAndroid && (
          <AppleButton
            buttonStyle={AppleButton.Style.WHITE}
            buttonType={AppleButton.Type.CONTINUE}
            style={styles.appleButton}
            onPress={() => signInWithApple()}
          />
        )}
        <SignupOption option="naver" onPress={() => signInWithNaver()} />
        <SignupOption option="kakao" onPress={() => signInWithKakao()} />
        <SignupOption option="email" onPress={() => navigation.navigate('EmailEnter')} />
        <View style={styles.textButtonContainer}>
          <TextButton align="center" onPress={enterGuest}>
            일단 둘러보기
          </TextButton>
        </View>
      </View>
      <AlertToast key={`AlertToast - ${showAlertToast}`} visible={showAlertToast} />
      <PolicyBottomSheet
        visible={isPolicyBottomSheet}
        onPress={() => {
          setIsPolicyBottomSheet(false);
          navigation.navigate('SetNickname');
        }}
        onClose={() => {
          setIsPolicyBottomSheet(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColor.surface.dark,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sighupOptionSection: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingBottom: isAndroid ? semanticNumber.spacing[20] : semanticNumber.spacing[40],
    gap: semanticNumber.spacing[12],
  },
  textButtonContainer: {
    paddingHorizontal: semanticNumber.spacing[12],
  },
  appleButton: {
    width: '100%',
    height: 44,
    borderRadius: semanticNumber.borderRadius.md,
  },
});

export default Welcome;
