import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CertificationOrigin, CertificationStackParamList } from '@/navigation/types/certification-stack';
import { semanticFont } from '@/styles/semantic-font';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthTextSection from '@/components/auth/AuthTextSection';
import Chip from '@/components/common/Chip';
import useAuthApi from '@/hooks/apis/useAuthApi';
import { providerToKorean, normalizeProvider } from '@/utils/providerToKorean';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';

type ResultType = 'local' | 'social' | 'none';
type CertificationAuthProps = NativeStackScreenProps<CertificationStackParamList, 'CertificationAuth'>;

const TEXT_BY_TYPE = {
  local: {
    sectionTitle: '이메일 정보를 찾았어요!',
    sectionDesc: '',
  },
  social: {
    sectionTitle: '소셜 로그인 회원이에요!',
    sectionDesc: '아래 표시된 소셜 로그인 수단으로 로그인해 주세요.',
  },
  none: {
    sectionTitle: '가입자 정보를 확인할 수 없어요',
    sectionDesc: '문의 : info@jammering.com',
  },
} as const;

const CertificationAuth = ({ route }: CertificationAuthProps) => {
  const { getFindEmail } = useAuthApi();
  const rootNavigation = useRootNavigation();

  const origin = route.params.origin;
  const phone = (route.params as any)?.phone as string | undefined;

  const [loading, setLoading] = useState<boolean>(origin === 'foundEmail');
  const [resultType, setResultType] = useState<ResultType>('none');
  const [result, setResult] = useState<string>('');

  const headerTitle = useMemo(() => {
    const ori: CertificationOrigin = origin;
    if (ori === 'foundEmail') return '이메일 찾기';
    if (ori === 'setPassword') return '비밀번호 설정';
    return '';
  }, [origin]);

  const { sectionTitle, sectionDesc } = TEXT_BY_TYPE[resultType];

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (origin !== 'foundEmail') return;

      if (!phone) {
        setLoading(false);
        setResultType('none');
        return;
      }

      try {
        setLoading(true);

        const raw = await getFindEmail(phone);
        if (!mounted) return;

        const value = String(raw ?? '').trim();

        if (!value) {
          setResultType('none');
          setResult('');
          return;
        }

        if (value.includes('@')) {
          setResultType('local');
          setResult(value);
          return;
        }

        const provider = normalizeProvider(value);
        if (provider && provider !== 'LOCAL') {
          setResultType('social');
          setResult(providerToKorean(provider));
          return;
        }

        setResultType('none');
        setResult('');
      } catch (e: any) {
        if (__DEV__) console.log('[CertificationAuth:getFindEmail] error', e?.response || e);
        setResultType('none');
        setResult('');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [origin, phone, getFindEmail]);

  const handleOnPress = () => {
    if (resultType === 'local') {
      rootNavigation.goBack();
    } else {
      rootNavigation.reset({ index: 0, routes: [{ name: 'AuthStack', params: { screen: 'Welcome' } }] });
    }
  };

  return (
    <AuthLayout
      headerTitle={headerTitle}
      buttonText={resultType === 'local' ? '로그인 하기' : '처음 화면으로 가기'}
      onPress={handleOnPress}
      headerRightChildsOnPress={handleOnPress}>
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator />
        </View>
      ) : (
        <>
          <AuthTextSection title={sectionTitle} desc={sectionDesc} />
          {resultType !== 'none' && (
            <View style={styles.resultContainer}>
              <Chip text={resultType === 'local' ? '이메일' : '소셜 로그인 수단'} variant="condition" />
              <Text style={styles.resultText}>{result}</Text>
            </View>
          )}
        </>
      )}
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  loadingWrapper: {
    paddingVertical: semanticNumber.spacing[24],
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContainer: {
    paddingVertical: semanticNumber.spacing[24],
    paddingHorizontal: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[12],
  },
  resultText: {
    color: semanticColor.text.secondary,
    ...semanticFont.title.large,
  },
});

export default CertificationAuth;
