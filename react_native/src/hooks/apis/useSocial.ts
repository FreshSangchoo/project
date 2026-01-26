import { NAVER_CONSUMER_KEY, NAVER_CONSUMER_SECRET, NAVER_SERVICE_URL_SCHEME_IOS } from '@/config';
import appleAuth from '@invertase/react-native-apple-authentication';
import { getProfile, login, logout } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';
import { useState } from 'react';
import useAuthNavigation from '../navigation/useAuthNavigation';
import { AppleAuthProvider, getAuth, signInWithCredential } from '@react-native-firebase/auth';
import { useAuthSignupStore } from '@/stores/authSignupStore';
import UUID from 'react-native-uuid';
import { sha256 } from 'js-sha256';

const useSocial = () => {
  const consumerKey = NAVER_CONSUMER_KEY!;
  const consumerSecret = NAVER_CONSUMER_SECRET!;
  const serviceUrlSchemeIOS = NAVER_SERVICE_URL_SCHEME_IOS;
  const appName = '아키파이';
  const [inProgress, setInProgress] = useState(false);
  const setEmail = useAuthSignupStore(s => s.setEmail);

  const navigation = useAuthNavigation();

  const signInWithNaver = async () => {
    NaverLogin.initialize({
      appName,
      consumerKey,
      consumerSecret,
      serviceUrlSchemeIOS,
      disableNaverAppAuthIOS: false,
    });

    await NaverLogin.logout();
    if (__DEV__) {
      console.log('[NaverLogin] logout');
    }

    const { failureResponse, successResponse } = await NaverLogin.login();
    if (successResponse?.accessToken) {
      const profile = await NaverLogin.getProfile(successResponse.accessToken);
      if (__DEV__) {
        console.log('[Naver][Profile] ', profile.response);
      }
      const email = profile?.response?.email ?? (profile as any)?.email ?? null;

      if (email) setEmail(email);

      navigation.navigate('Welcome', { token: String(successResponse.accessToken), provider: 'NAVER' });
    } else {
      if (__DEV__) {
        console.log('[Naver failure]', JSON.stringify(failureResponse, null, 2));
      }
    }
  };

  const signInWithApple = async () => {
    if (inProgress) return;
    setInProgress(true);
    try {
      const rawNonce = (UUID.v4() as string).replace(/-/g, '');
      const hashed = sha256(rawNonce);
      if (__DEV__) {
        console.log('[APPLE] rawNonce:', rawNonce);
        console.log('[APPLE] sha256(rawNonce):', hashed);
      }

      const resp = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
        nonce: rawNonce,
      });
      if (!resp.identityToken) {
        if (__DEV__) {
          console.log('🔴 identityToken 없음');
        }
        return;
      }
      const credential = AppleAuthProvider.credential(resp.identityToken, resp.nonce);
      const { user } = await signInWithCredential(getAuth(), credential);
      const idToken = await user.getIdToken(true);
      if (__DEV__) {
        console.log('[signInWithApple] idToken: ', idToken);
      }
      const email = user?.email ?? (resp as any)?.email ?? null;
      console.log('[useSocial][signInWithApple] email: ', email);
      if (email) setEmail(email);

      navigation.navigate('Welcome', { token: idToken, provider: 'FIREBASE' });
    } catch (error) {
      if (__DEV__) {
        console.log('[useSocial][signInWithApple] 🔴 Apple sign-in error:', error);
      }
    } finally {
      setInProgress(false);
    }
  };

  const signInWithKakao = async () => {
    try {
      const token = await login();
      const profile = await getProfile();

      const email = profile.email;

      if (email) setEmail(email);
      else {
        if (__DEV__) {
          console.log('[Kakao] 이메일이 제공되지 않았습니다. 동의 항목을 확인하세요.');
        }
      }
      navigation.navigate('Welcome', { token: JSON.stringify(token.accessToken), provider: 'KAKAO' });
    } catch (err) {
      if (__DEV__) console.log('[Kakao login error]', err);
    }
  };
  return { signInWithNaver, signInWithApple, signInWithKakao };
};

export default useSocial;
