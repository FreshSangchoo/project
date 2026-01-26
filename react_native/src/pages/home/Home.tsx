import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import HomeHeader from '@/components/common/header/HomeHeader';
import HomeSection from '@/components/home/HomeSection';
import CardContainer from '@/components/home/card-container/CardContainer';
import ArticleContainer from '@/components/home/article-container/ArticleContainer';
import SupportContainer from '@/components/home/support-container/SupportContainer';
import LegalNoticeContainer from '@/components/common/legal-notice-container/LegalNoticeContainer';
import Floatingbutton from '@/components/common/button/Floatingbutton';
import { semanticColor } from '@/styles/semantic-color';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';
import { useUserStore } from '@/stores/userStore';
import SettingItem from '@/components/my-page/SettingItemRow';
import IconLogin2 from '@/assets/icons/IconLogin2.svg';
import { semanticNumber } from '@/styles/semantic-number';
import Modal from '@/components/common/modal/Modal';
import EmojiGrinningface from '@/assets/icons/EmojiGrinningface.svg';
import { permissionCheck } from '@/components/permission-check/PermissionCheck';

const Home = () => {
  const navigation = useRootNavigation();
  const [isContent, setIsContent] = useState(true);
  const profile = useUserStore(s => s.profile);
  const goLogin = useUserStore(c => c.clearProfile);
  const [loginModal, setLoginModal] = useState<boolean>(false);
  const [verifyModal, setVerifyModal] = useState<boolean>(false);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    permissionCheck();
  }, []);

  const handlerPressNotification = () => {
    navigation.navigate('HomeStack', { screen: 'Notification' });
  };
  const handlerPressSearch = () => {
    navigation.navigate('ExploreStack', { screen: 'ExploreSearchPage' });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setIsContent(offsetY <= 10);
  };

  const handleGoLogin = () => {
    profile?.userId
      ? profile.verified
        ? navigation.navigate('HomeStack', {
            screen: 'UploadIndexPage',
            params: { origin: 'Home', startFresh: true },
          })
        : setVerifyModal(true)
      : setLoginModal(true);
  };
  const handleWishList = () => {
    profile?.userId ? navigation.navigate('MyStack', { screen: 'FavoriteLogPage' }) : setLoginModal(true);
  };

  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
  }, [insets.top, insets.bottom, insets.left, insets.right]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: semanticColor.surface.white }} edges={['top', 'left', 'right']}>
      <View style={styles.home}>
        <HomeHeader onPressNotification={handlerPressNotification} onPressSearch={handlerPressSearch} />

        <ScrollView onScroll={handleScroll} scrollEventThrottle={16}>
          {profile?.userId ? (
            <HomeSection title={profile?.nickname ?? ''} welcome />
          ) : (
            <View style={{ paddingVertical: semanticNumber.spacing[8] }}>
              <SettingItem
                itemImage={
                  <IconLogin2
                    width={24}
                    height={24}
                    stroke={semanticColor.icon.secondary}
                    strokeWidth={semanticNumber.stroke.bold}
                  />
                }
                itemName="로그인/회원가입 하기"
                showNextButton
                onPress={() => {
                  goLogin();
                  navigation.reset({ index: 0, routes: [{ name: 'AuthStack', params: { screen: 'Welcome' } }] });
                }}
              />
            </View>
          )}
          <CardContainer onPress={handleWishList} />

          <HomeSection title="아키파이 아티클" />
          <ArticleContainer />

          <HomeSection title="고객 지원" />
          <SupportContainer />

          <LegalNoticeContainer />
        </ScrollView>
        <Floatingbutton isContent={isContent} onPress={handleGoLogin} />
      </View>
      <Modal
        mainButtonText="로그인/회원가입 하기"
        onClose={() => setLoginModal(false)}
        onMainPress={() => {
          setLoginModal(false);
          goLogin();
          navigation.reset({ index: 0, routes: [{ name: 'AuthStack', params: { screen: 'Welcome' } }] });
        }}
        titleText="로그인/회원가입이 필요해요."
        visible={loginModal}
        buttonTheme="brand"
        noDescription
        titleIcon={<EmojiGrinningface width={24} height={24} />}
      />
      <Modal
        mainButtonText="본인인증 하러 가기"
        onClose={() => setVerifyModal(false)}
        onMainPress={() => {
          setVerifyModal(false);
          navigation.navigate('CertificationStack', { screen: 'Certification', params: { origin: 'common' } });
        }}
        titleText="본인인증하고 거래를 즐겨보세요!"
        visible={verifyModal}
        buttonTheme="brand"
        descriptionText={`본인인증하시면 거래 기능이 모두 활성화되고,\n신뢰를 높이는 인증 배지도 받을 수 있어요.`}
        titleIcon={<EmojiGrinningface width={24} height={24} />}
      />
      {!ready && (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: semanticColor.surface.white }]}
          pointerEvents="none"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  home: {
    flex: 1,
    width: Dimensions.get('window').width,
    backgroundColor: semanticColor.surface.white,
  },
});

export default Home;
