import { StyleSheet, View } from 'react-native';
import CenterHeader from '@/components/common/header/CenterHeader';
import AuthTextSection from '@/components/auth/AuthTextSection';
import SettingItem from '@/components/my-page/SettingItemRow';
import Chip from '@/components/common/Chip';
import IconX from '@/assets/icons/IconX.svg';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import IconMail from '@/assets/icons/IconMail.svg';
import IconPhone from '@/assets/icons/IconPhone.svg';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import useAuthNavigation from '@/hooks/navigation/useAuthNavigation';
import useMyNavigation from '@/hooks/navigation/useMyNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';

const ForgotPassword = () => {
  const navigation = useAuthNavigation();
  const rootNavigation = useRootNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: semanticColor.surface.white }}>
      <CenterHeader
        title="비밀번호 찾기"
        leftChilds={{
          icon: (
            <IconChevronLeft
              width={28}
              height={28}
              stroke={semanticColor.icon.primary}
              strokeWidth={semanticNumber.stroke.bold}
            />
          ),
          onPress: () => navigation.goBack(),
        }}
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
            onPress: () => navigation.reset({ routes: [{ name: 'Welcome' }] }),
          },
        ]}
      />
      <AuthTextSection title="비밀번호를 잊으셨나요?" desc="인증 방식을 선택해 주세요." />
      <View style={styles.settingItemContainer}>
        <SettingItem
          itemImage={
            <IconMail
              width={20}
              height={20}
              stroke={semanticColor.icon.secondary}
              strokeWidth={semanticNumber.stroke.medium}
            />
          }
          itemName="이메일로 인증하기"
          showNextButton
          onPress={() => navigation.navigate('ForgotPasswordViaEmail')}
        />
        <SettingItem
          itemImage={
            <IconPhone
              width={20}
              height={20}
              stroke={semanticColor.icon.secondary}
              strokeWidth={semanticNumber.stroke.medium}
            />
          }
          itemName="휴대폰 번호로 인증하기"
          subItem={<Chip text="본인인증 회원 전용" variant="condition" />}
          showNextButton
          onPress={() => rootNavigation.navigate('CertificationStack', { screen: 'Certification', params: { origin: 'setPassword' } })}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  settingItemContainer: {
    paddingVertical: semanticNumber.spacing[24],
    gap: semanticNumber.spacing[12],
  },
});

export default ForgotPassword;
