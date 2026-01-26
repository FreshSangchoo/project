/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import messaging from '@react-native-firebase/messaging';
import { name as appName } from './app.json';
import notifee from '@notifee/react-native';
import { displayLocalNotification } from './src/utils/notifications';

// notifee 백그라운드 이벤트 핸들러 등록
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Notifee background event:', type, detail);
  // 필요시 추가 로직 작성
});

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);

  const messageType = remoteMessage.data?.type ?? remoteMessage.data?.category;

  // 채팅 알림: TalkPlus SDK가 자체 알림을 처리하므로 Firebase에서는 완전히 차단
  // 만약 Firebase도 알림을 표시하면 중복이 되므로 early return
  if (messageType === 'chat') {
    if (__DEV__) {
      console.log('[Background] Chat notification - TalkPlus SDK handles this');
    }
    // Firebase의 자동 시스템 알림 표시를 방지하기 위해 notification 필드 체크
    // 중요: 이 조건이 없으면 Firebase가 시스템 알림을 표시할 수 있음
    return;
  }

  // 비채팅 알림: Firebase 시스템 알림이 자동 표시되므로, 추가 로컬 알림 표시 불필요
  if (remoteMessage.notification) {
    if (__DEV__) {
      console.log('[Background] System notification will be shown by Firebase');
    }
    return;
  }

  // notification 필드 없이 data만 있는 경우만 로컬 알림으로 표시
  if (__DEV__) {
    console.log('[Background] Showing custom notification for data-only message');
  }
  await displayLocalNotification(remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
