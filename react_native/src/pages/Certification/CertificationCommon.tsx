import CenterHeader from '@/components/common/header/CenterHeader';
import { StyleSheet, Text, View } from 'react-native';
import IconX from '@/assets/icons/IconX.svg';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';
import Chip from '@/components/common/Chip';
import { semanticFont } from '@/styles/semantic-font';
import ToolBar from '@/components/common/button/ToolBar';
import useAuthApi from '@/hooks/apis/useAuthApi';
import { useUserStore } from '@/stores/userStore';
import { useEmailStore } from '@/stores/authEmail';
import { clearTalkSession } from '@/libs/talkplus';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CertificationStackParamList, CertificationResultType } from '@/navigation/types/certification-stack';
import useUserApi from '@/hooks/apis/useUserApi';
import { useEffect, useRef } from 'react';

type CertificationCommonProps = NativeStackScreenProps<CertificationStackParamList, 'CertificationCommon'>;

const CertificationCommon = ({ route }: CertificationCommonProps) => {
  const navigation = useNavigation();
  const rootNavigation = useRootNavigation();
  const { postLogout } = useAuthApi();
  const clearProfile = useUserStore(s => s.clearProfile);
  const clearEmail = useEmailStore(c => c.clearEmail);
  const result = route.params?.ok;
  const { getProfile } = useUserApi();
  const profile = useUserStore(p => p.profile);
  const setProfile = useUserStore(s => s.setProfile);
  const didSyncRef = useRef(false);

  useEffect(() => {
    if (result !== 'success') return;
    if (didSyncRef.current) return;
    didSyncRef.current = true;

    let isActive = true;
    (async () => {
      try {
        const latest = await getProfile();
        if (!isActive) return;
        setProfile({ ...latest });
      } catch (e) {
        if (!isActive) return;
        if (profile && 'verified' in profile) {
          setProfile({ ...(profile as any), verified: true });
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [result]);

  const getTextsByResult = (result: CertificationResultType) => {
    switch (result) {
      case 'success':
        return { title: '본인인증이 완료되었어요.' };
      case 'fail':
        return {
          title: '이미 본인인증된 계정이 있어요.',
          desc: '다른 계정에서 이미 본인인증을 완료하셨어요.\n해당 계정을 이용해 주세요.',
        };
      default:
        return {
          title: '본인인증 오류가 발생했어요.',
          desc: '잠시 후 다시 시도해 주세요.\n문의 : info@jammering.com',
        };
    }
  };

  const { title, desc } = getTextsByResult(result);

  const logout = async () => {
    try {
      await postLogout();
      await clearTalkSession();
      clearProfile();
      clearEmail();
      rootNavigation.reset({ index: 0, routes: [{ name: 'AuthStack', params: { screen: 'Welcome' } }] });
    } catch (error) {
      if (__DEV__) {
        console.log('[AcocountManagePage][logout] error: ', error);
      }
    }
  };

  const onClose = () => {
    if (result === 'fail') {
      rootNavigation.reset({
        index: 0,
        routes: [{ name: 'NavBar', params: { screen: 'Home' } }],
      });
    } else if (result === 'success') {
      rootNavigation.replace('MyStack', { screen: 'VerifyInfoPage' });
    } else {
      navigation.goBack();
      navigation.goBack();
    }
  };

  const onPress = () => {
    if (result === 'fail') logout();
    else if (result === 'success') {
      rootNavigation.replace('MyStack', { screen: 'VerifyInfoPage' });
    } else {
      navigation.goBack();
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.container}>
        <CenterHeader
          title=""
          rightChilds={[
            {
              icon: (
                <IconX
                  width={28}
                  height={28}
                  stroke={semanticColor.icon.primary}
                  strokeWidth={semanticNumber.stroke.bold}
                />
              ),
              onPress: onClose,
            },
          ]}
        />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {desc && <Text style={styles.desc}>{desc}</Text>}
        </View>
        {result === 'success' && (
          <View style={styles.chipContainer}>
            <Chip text="본인인증 완료" variant="condition" />
          </View>
        )}
      </View>

      <ToolBar onPress={onPress}>{result === 'fail' ? '로그아웃' : '확인'}</ToolBar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  container: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  textContainer: {
    paddingTop: semanticNumber.spacing[40],
    paddingBottom: semanticNumber.spacing[12],
    paddingHorizontal: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[4],
  },
  title: {
    color: semanticColor.text.primary,
    ...semanticFont.headline.medium,
  },
  desc: {
    color: semanticColor.text.tertiary,
    ...semanticFont.body.large,
  },
  chipContainer: {
    paddingTop: semanticNumber.spacing[24],
    paddingHorizontal: semanticNumber.spacing[16],
  },
});

export default CertificationCommon;
