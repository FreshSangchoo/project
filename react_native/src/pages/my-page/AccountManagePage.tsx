import ButtonTitleHeader from '@/components/common/header/ButtonTitleHeader';
import MyPageSection from '@/components/my-page/MyPageSection';
import { dangerSectionItems, myEmailInfoItems, mySocialInfoItems } from '@/constants/MyPageSectionItems';
import { StyleSheet } from 'react-native';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import SectionSeparator from '@/components/common/SectionSeparator';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from '@/components/common/modal/Modal';
import useAuthApi from '@/hooks/apis/useAuthApi';
import { useUserStore } from '@/stores/userStore';
import { useState } from 'react';
import useMyNavigation from '@/hooks/navigation/useMyNavigation';
import { clearTalkSession } from '@/libs/talkplus';
import { useEmailStore } from '@/stores/authEmail';
import { useToastStore } from '@/stores/toastStore';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';

function AccountManagePage() {
  const navigation = useMyNavigation();
  const rootNavigation = useRootNavigation();
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const [logoutModal, setLogoutModal] = useState<boolean>(false);
  const { postLogout } = useAuthApi();
  const profile = useUserStore(p => p.profile);
  const clearProfile = useUserStore(s => s.clearProfile);
  const clearEmail = useEmailStore(c => c.clearEmail);
  const showToast = useToastStore(s => s.show);

  // 로그아웃
  const logout = async () => {
    try {
      setLoggingOut(true);
      setLogoutModal(false);
      await postLogout();
      await clearTalkSession();
      clearProfile();
      clearEmail();
      rootNavigation.reset({ index: 0, routes: [{ name: 'AuthStack', params: { screen: 'Welcome' } }] });
    } catch (error) {
      showToast({
        variant: 'alert',
        message: '로그아웃 중 문제가 발생했습니다. 다시 시도해주세요.',
        duration: 1000,
      });
      setLogoutModal(false);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.accountManagePage}>
      <ButtonTitleHeader
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
        title="계정 관리"
      />
      {profile?.provider === 'LOCAL' ? (
        <>
          <MyPageSection
            sectionTitle="개인 정보"
            sectionItems={myEmailInfoItems(navigation, profile, rootNavigation)}
          />
          <SectionSeparator type="line-with-padding" />
          <MyPageSection
            sectionTitle="위험 구역"
            sectionItems={dangerSectionItems(navigation, () => setLogoutModal(true))}
          />
        </>
      ) : (
        <>
          <MyPageSection
            sectionTitle="개인 정보"
            sectionItems={mySocialInfoItems(navigation, profile, rootNavigation)}
          />
          <SectionSeparator type="line-with-padding" />
          <MyPageSection
            sectionTitle="위험 구역"
            sectionItems={dangerSectionItems(navigation, () => setLogoutModal(true))}
          />
        </>
      )}
      <Modal
        mainButtonText={loggingOut ? '로그아웃 중...' : '네, 로그아웃 할래요.'}
        mainButtonDisabled={loggingOut}
        onMainPress={logout}
        onClose={() => setLogoutModal(false)}
        titleText="정말 로그아웃 하실건가요?"
        visible={logoutModal}
        noDescription
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  accountManagePage: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
});

export default AccountManagePage;
