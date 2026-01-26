import { useEffect, useState, useRef } from 'react';
import BootSplash from 'react-native-bootsplash';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from '@/navigation/RootNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppState, AppStateStatus, Image, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { useUserStore } from '@/stores/userStore';
import { AvoidSoftInput } from 'react-native-avoid-softinput';
import EncryptedStorage from 'react-native-encrypted-storage';
import useAuthApi from '@/hooks/apis/useAuthApi';
import useUserApi from '@/hooks/apis/useUserApi';
import messaging from '@react-native-firebase/messaging';
import { requestUserPermission } from '@/utils/ensureFcmToken';
import { displayLocalNotification, ensureChannel } from '@/utils/notifications';
import GlobalToast from '@/components/common/toast/GlobalToast';
import useChatPush from '@/hooks/useChatPush';
import { initializeFacebook } from '@/utils/initializeFacebook';

const navRef = createNavigationContainerRef<any>();
const isAndroid = Platform.OS === 'android';

function App() {
  const setProfile = useUserStore(s => s.setProfile);

  const [booting, setBooting] = useState(true);
  const [initialRoute, setInitialRoute] = useState<null | 'AuthStack' | 'NavBar'>(null);

  const { postReissue } = useAuthApi();
  const { getProfile } = useUserApi();

  useChatPush(navRef);

  const appState = useRef<AppStateStatus>(AppState.currentState);

  // 백그라운드에서 포그라운드로 복귀 시 토큰 갱신
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      // 백그라운드 -> 포그라운드로 전환될 때
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (__DEV__) {
          console.log('[App] Returning to foreground, checking token validity');
        }

        try {
          const accessToken = await EncryptedStorage.getItem('accessToken');
          const refreshToken = await EncryptedStorage.getItem('refreshToken');

          // 토큰이 있는 경우에만 갱신 시도
          if (accessToken || refreshToken) {
            // getProfile을 호출하여 토큰 유효성 검증
            // 401 에러가 발생하면 useApi 인터셉터가 자동으로 토큰 재발급
            const p = await getProfile();
            const provider = await EncryptedStorage.getItem('provider');
            setProfile({ ...p, provider });

            if (__DEV__) {
              console.log('[App] Token refreshed successfully on foreground');
            }
          }
        } catch (error) {
          if (__DEV__) {
            console.log('[App] Token refresh failed on foreground:', error);
          }
          // 토큰 갱신 실패 시 로그아웃 처리는 useApi 인터셉터에서 이미 처리됨
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [getProfile, setProfile]);

  useEffect(() => {
    if (isAndroid) {
      AvoidSoftInput.setAdjustNothing();
      AvoidSoftInput.setShouldMimicIOSBehavior(true);
    }
    AvoidSoftInput.setEnabled(true);

    // Facebook SDK 초기화
    initializeFacebook();

    let unsubOnMessage: undefined | (() => void);

    (async () => {
      try {
        if (!isAndroid) {
          await messaging().registerDeviceForRemoteMessages();
        }
        await requestUserPermission();
        await ensureChannel();

        unsubOnMessage = messaging().onMessage(async msg => {
          const messageType = msg.data?.type ?? msg.data?.category;

          // 채팅 알림: TalkPlus SDK와 Notifee 핸들러(useChatPush)에서 처리
          // Firebase onMessage에서는 스킵하여 중복 표시 방지
          if (messageType === 'chat') {
            if (__DEV__) {
              console.log('[App.onMessage] Chat notification - delegated to TalkPlus/useChatPush');
            }
            return;
          }

          // 비채팅 알림: 포그라운드에서도 사용자에게 보이도록 로컬 알림 표시
          if (__DEV__) {
            console.log('[App.onMessage] Showing foreground notification for type:', messageType);
          }
          await displayLocalNotification(msg);
        });

        const accessToken = await EncryptedStorage.getItem('accessToken');
        const refreshToken = await EncryptedStorage.getItem('refreshToken');
        const provider = await EncryptedStorage.getItem('provider');

        // 토큰 정보 확인
        if (!accessToken && !refreshToken) {
          // 토큰이 없으면 로그인 필요
          setInitialRoute('AuthStack');
          return;
        }

        try {
          // accessToken이 없으면 refreshToken으로 재발급 시도
          // (accessToken이 있으면 getProfile에서 401이 나면 useApi 인터셉터가 자동 재발급)
          if (!accessToken && refreshToken) {
            await postReissue(refreshToken);
          }

          // 프로필 조회 (useApi 인터셉터가 401 에러 자동 처리)
          const p = await getProfile();
          setProfile({ ...p, provider });
          setInitialRoute('NavBar');
        } catch (error) {
          console.log('[App bootstrap] profile fetch failed:', error);
          // 토큰이 완전히 만료되었거나 무효함 → 로그인 필요
          setInitialRoute('AuthStack');
        }
      } catch (e) {
        console.log('[App bootstrap] error:', e);
        setInitialRoute('AuthStack');
      } finally {
        setBooting(false);
        BootSplash.hide({ fade: true });
      }
    })();

    return () => {
      AvoidSoftInput.setEnabled(false);
      unsubOnMessage?.();
    };
  }, []);

  if (booting || !initialRoute) {
    if (isAndroid) {
      return null;
    } else {
      return (
        <View style={styles.splashContainer}>
          <Image source={require('@/assets/logos/SplashLogo.png')} style={styles.splashLogo} resizeMode="contain" />
        </View>
      );
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <NavigationContainer ref={navRef}>
          <StatusBar barStyle={'dark-content'} backgroundColor={semanticColor.surface.white} />
          <RootNavigator initialRoute={initialRoute} />
        </NavigationContainer>
        <GlobalToast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: semanticColor.surface.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 96,
    height: 96,
    marginBottom: 36,
  },
});

export default App;
