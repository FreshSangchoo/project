import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthTextSection from '@/components/auth/AuthTextSection';
import TextFieldWithButton from '@/components/common/text-field/TextFieldWithButton';
import { semanticNumber } from '@/styles/semantic-number';
import useAuthApi from '@/hooks/apis/useAuthApi';
import { useUserStore } from '@/stores/userStore';
import useUserApi from '@/hooks/apis/useUserApi';
import { containsBadWord, sanitizeNicknameInput } from '@/utils/nicknameFilter';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';
import { useAuthSignupStore } from '@/stores/authSignupStore';

const SetNickname = () => {
  const rootNavigation = useRootNavigation();
  const [nickName, setNickname] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [isCheckNickname, setIsCheckNickname] = useState<boolean | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const lengthValid = nickName.length >= 2 && nickName.length <= 12;
  const patternValid = /^[가-힣ㄱ-ㅎa-zA-Z0-9]+$/.test(nickName);
  const provider = useUserStore(p => p.authProvider);
  const setProfile = useUserStore(s => s.setProfile);
  const clearProvider = useUserStore(c => c.clearAuthProvider);
  const { getProfile } = useUserApi();
  const { password, accessToken, clear: clearSignupStore } = useAuthSignupStore();

  const { getCheckNickname, postSignup } = useAuthApi();

  const getValidNicknameText = (): string => {
    if (isBlocked) {
      return '금칙어가 포함되어 있어 사용할 수 없어요.';
    }
    if (!lengthValid) {
      return '닉네임은 2~12자로 입력해 주세요.';
    }
    if (!patternValid) {
      return '닉네임은 한글 또는 영문으로 입력해 주세요.';
    }
    if (!isCheckNickname && isCheckNickname !== null) {
      return '다른 닉네임으로 다시 시도해 주세요.';
    }
    if (isCheckNickname) return '사용할 수 있는 닉네임이에요!';
    return '2~12자 이내 영문 또는 한글로 입력. 특수문자 불가';
  };

  const getValidState = (): 'normal' | 'success' | 'fail' => {
    if (nickName.length > 0) {
      if (lengthValid && patternValid) {
        if (isCheckNickname) return 'success';
        else return 'normal';
      } else return 'fail';
    } else return 'normal';
  };

  const handleVerifyNickname = async () => {
    if (containsBadWord(nickName)) {
      setIsBlocked(true);
      setIsCheckNickname(false);
      return;
    }
    setIsBlocked(false);
    if (lengthValid && patternValid) {
      const isCheckNickname = await getCheckNickname(nickName);
      setIsCheckNickname(isCheckNickname);
    }
  };

  const handleSignup = async () => {
    if (containsBadWord(nickName)) {
      setIsBlocked(true);
      setIsCheckNickname(false);
      return;
    }

    if (isSigningUp) return; // 중복 호출 방지

    setIsSigningUp(true);
    try {
      await postSignup(nickName, password, accessToken);

      // 프로필 조회
      const profile = await getProfile();
      setProfile({ ...profile, provider: 'LOCAL' });

      // Store 정리
      clearSignupStore();
      clearProvider();

      rootNavigation.reset({ index: 0, routes: [{ name: 'NavBar', params: { screen: 'Home' } }] });
    } catch (error) {
      console.log('[SetNickname][handleSignup] error:', error);
      setIsSigningUp(false);
    }
  };

  const handleSetInput: React.Dispatch<React.SetStateAction<string>> = next => {
    setIsCheckNickname(null);
    setIsBlocked(false);

    if (typeof next === 'function') {
      setNickname(prev => {
        const computed = (next as (p: string) => string)(prev);
        return sanitizeNicknameInput(computed);
      });
    } else {
      setNickname(sanitizeNicknameInput(next));
    }
  };

  return (
    <AuthLayout
      headerTitle="회원가입"
      buttonText={isSigningUp ? '가입 중...' : '다음'}
      onPress={handleSignup}
      buttonDisabled={!(lengthValid && patternValid && isCheckNickname) || isSigningUp}>
      <AuthTextSection title="닉네임을 설정해 주세요." desc="닉네임은 30일에 1번씩 바꿀 수 있어요." />
      <View style={styles.textFieldContainer}>
        <TextFieldWithButton
          label="닉네임"
          placeholder="닉네임 입력"
          buttonText="중복 확인"
          inputText={nickName}
          setInputText={handleSetInput}
          onPress={handleVerifyNickname}
          validState={getValidState()}
          validText={getValidNicknameText()}
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

export default SetNickname;
