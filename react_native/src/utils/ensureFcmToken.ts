import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid, Alert, AppState } from 'react-native';

// FCM 토큰 가져오기 (권한 요청은 여기서 하지 않음)
export async function ensureFcmToken(): Promise<string | null> {
  try {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      // console.log('FCM Token:', fcmToken);
      return fcmToken;
    }
    return null;
  } catch (error) {
    if (__DEV__) {
      console.error('FCM token fetch failed:', error);
    }
    return null;
  }
}

// 푸시 알림 권한 요청
export const requestUserPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        // console.log('iOS Push notification permission granted');
        await ensureFcmToken();
        return true;
      } else {
        // console.log('iOS Push notification permission denied');
        return false;
      }
    } else if (Platform.OS === 'android') {
      // Android 13 이상에서만 POST_NOTIFICATIONS 권한 필요
      if (Number(Platform.Version) >= 33) {
        // AppState가 active일 때만 요청
        if (AppState.currentState !== 'active') {
          if (__DEV__) {
            console.log('Push permission request skipped: Activity not attached yet');
          }
          return false;
        }

        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS, {
          title: '알림 권한 요청',
          message: '앱에서 중요한 알림을 받으려면 알림 권한을 허용해주세요.',
          buttonNeutral: '나중에',
          buttonNegative: '거부',
          buttonPositive: '허용',
        });

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          // console.log('Android Push notification permission granted');
          await ensureFcmToken();
          return true;
        } else {
          if (__DEV__) {
            console.log('Android Push notification permission denied');
          }
          return false;
        }
      } else {
        // Android 12 이하에서는 권한 요청 불필요
        await ensureFcmToken();
        return true;
      }
    }
    return false;
  } catch (error) {
    if (__DEV__) {
      console.error('Push notification permission request failed:', error);
    }
    return false;
  }
};

// 알림 리스너 설정
export const notificationListener = () => {
  // 포그라운드에서 메시지 수신
  const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
    // console.log('A new FCM message arrived! (Foreground)', JSON.stringify(remoteMessage));

    if (remoteMessage.notification) {
      Alert.alert(remoteMessage.notification.title || '알림', remoteMessage.notification.body || '', [
        { text: '확인', style: 'default' },
      ]);
    }
  });

  // 앱이 백그라운드에서 알림 탭으로 열렸을 때
  messaging().onNotificationOpenedApp(remoteMessage => {
    // console.log('Notification caused app to open from background state:', JSON.stringify(remoteMessage));
    handleNotificationNavigation(remoteMessage);
  });

  // 앱이 종료된 상태에서 알림 탭으로 열렸을 때
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        // console.log('Notification caused app to open from quit state:', JSON.stringify(remoteMessage));
        handleNotificationNavigation(remoteMessage);
      }
    });

  return unsubscribeOnMessage;
};

// 알림 탭 시 네비게이션 처리
const handleNotificationNavigation = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
  if (__DEV__) {
    console.log('Handle notification navigation:', remoteMessage.data);
  }

  if (remoteMessage.data?.type === 'chat') {
    // 채팅 화면으로 이동
  } else if (remoteMessage.data?.type === 'transaction') {
    // 거래 상세 화면으로 이동
  }
};

// 서버로 FCM 토큰 전송 (필요 시 구현)
export const sendTokenToServer = async (_token: string) => {
  try {
    // const response = await api.post('/notification/token', { token });
    // return response;
  } catch (error) {
    throw error;
  }
};
