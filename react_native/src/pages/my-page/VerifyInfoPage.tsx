import CenterHeader from '@/components/common/header/CenterHeader';
import { StyleSheet, View } from 'react-native';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import SettingItemRow from '@/components/my-page/SettingItemRow';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextButton from '@/components/common/button/TextButton';
import useMyNavigation from '@/hooks/navigation/useMyNavigation';
import { useUserStore } from '@/stores/userStore';

function VerifyInfoPage() {
  const navigation = useMyNavigation();

  const profile = useUserStore(p => p.profile);

  const hidePhoneNumber = (phoneNumber: string) => {
    return phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3');
  };

  return (
    <SafeAreaView style={styles.verifyInfoPageContainer}>
      <View style={styles.verifyInfoPageContainer}>
        <CenterHeader
          title="본인 인증 정보"
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
        />
        <SettingItemRow itemName="이름" subItem={profile?.name!} />
        {/* <SettingItemRow itemName="인증 날짜" subItem={profile?.verifiedAt!} /> */}
        <SettingItemRow itemName="휴대폰 번호" subItem={hidePhoneNumber(profile?.phone!)} />
      </View>
      <View style={styles.buttonContainer}>
        <TextButton
          align="center"
          alignSelf="center"
          children="본인인증 정보 수정하기"
          onPress={() => navigation.navigate('VerifyPage')}
          underline
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  verifyInfoPageContainer: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  buttonContainer: {
    paddingVertical: semanticNumber.spacing[32],
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VerifyInfoPage;
