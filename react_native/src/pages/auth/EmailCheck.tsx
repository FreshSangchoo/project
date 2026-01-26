import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthTextSection from '@/components/auth/AuthTextSection';
import Chip from '@/components/common/Chip';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import useAuthNavigation from '@/hooks/navigation/useAuthNavigation';
import PolicyBottomSheet from '@/components/common/bottom-sheet/PolicyBottomSheet';
import useAuthApi from '@/hooks/apis/useAuthApi';
import { useEffect, useRef, useState } from 'react';
import { useAuthSignupStore } from '@/stores/authSignupStore';
import { useToastStore } from '@/stores/toastStore';

type Status = 'loading' | 'ok' | 'error';

const EmailCheck = () => {
  const navigation = useAuthNavigation();
  const email = useAuthSignupStore(s => s.email);
  const { postEmailCheck } = useAuthApi();

  const [status, setStatus] = useState<Status>('loading');
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [policySheet, setPolicySheet] = useState<boolean>(false);

  const showToast = useToastStore(s => s.show);
  const mountedRef = useRef(true);

  const title = isChecked ? '이미 가입한 이메일이에요.' : '새로 가입할 수 있는 이메일이에요!';
  const desc = isChecked ? '다시 오신 걸 환영합니다!' : '가입을 원하시면 계속해 주세요.';
  const buttonText = isChecked ? '로그인 하기' : '가입하기';

  const onPress = () => {
    if (status !== 'ok') return;
    if (isChecked) {
      navigation.navigate('EmailLogin');
    } else {
      setPolicySheet(true);
    }
  };

  const checkEmail = async () => {
    setStatus('loading');
    try {
      const exists = await postEmailCheck(email);
      if (!mountedRef.current) return;
      setIsChecked(!!exists);
      setStatus('ok');
    } catch (e) {
      if (!mountedRef.current) return;
      setStatus('error');
      showToast({
        message: '이메일 확인에 실패했어요. 잠시 후 다시 시도해 주세요.',
        image: 'EmojiRedExclamationMark',
        duration: 1500,
      });
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void checkEmail();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <AuthLayout
      headerTitle="이메일로 계속하기"
      buttonText={status === 'ok' ? buttonText : '확인 중...'}
      onPress={onPress}
      buttonDisabled={status !== 'ok'}>
      {status === 'loading' && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={semanticColor.icon.lightest} />
          <Text style={styles.loadingText}>이메일을 확인하고 있어요…</Text>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.errorContainer}>
          <AuthTextSection
            title="이메일 확인에 문제가 발생했어요."
            desc="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
          />
        </View>
      )}

      {status === 'ok' && (
        <>
          <AuthTextSection title={title} desc={desc} />
          <View style={styles.emailSection}>
            <Chip text="입력한 이메일" variant="condition" size="medium" />
            <Text style={styles.inputEmail}>{email}</Text>
            <PolicyBottomSheet
              visible={policySheet}
              onPress={() => {
                setPolicySheet(false);
                navigation.navigate('AuthCode', { type: 'EMAIL_VERIFICATION ' });
              }}
              isSafeArea
              onClose={() => setPolicySheet(false)}
            />
          </View>
        </>
      )}
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: semanticNumber.spacing[40],
    alignItems: 'center',
    gap: semanticNumber.spacing[10],
  },
  loadingText: {
    ...semanticFont.body.small,
    color: semanticColor.text.secondary,
  },
  errorContainer: {
    paddingBottom: semanticNumber.spacing[12],
  },
  emailSection: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[24],
    gap: semanticNumber.spacing[12],
  },
  inputEmail: {
    color: semanticColor.text.secondary,
    ...semanticFont.title.large,
  },
});

export default EmailCheck;
