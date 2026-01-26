import { Platform, NativeModules } from 'react-native';
import { useNotificationApi } from '@/hooks/apis/useNotificationApi';
import CheckAlarmsetting from './util/CheckAlarmsetting';

export async function permissionCheck() {
  if (Platform.OS === 'android') {
    await androidRequestPermission();
  } else {
    await iosRequestPermission();
  }
}

async function pushAlarmPermission({ deviceToken }: { deviceToken: string }) {
  const { postNotificationPermission } = useNotificationApi();

  try {
    const response = await postNotificationPermission({ deviceToken, permissionEnabled: true });
    if (__DEV__) {
      console.log('Push alarm permission response:', response);
    }
  } catch (error) {
    if (__DEV__) {
      console.log('Push alarm permission error:', error);
    }
  }
}

async function iosRequestPermission() {
  const { iosAlarmToken } = CheckAlarmsetting();
  try {
    const { fcmToken } = await iosAlarmToken();
    if (fcmToken) {
      if (NativeModules.DotReactBridge?.setPushToken) {
        NativeModules.DotReactBridge.setPushToken(fcmToken);
      } else {
        if (__DEV__) {
          console.log('DotReactBridge is not available');
        }
      }
      pushAlarmPermission({ deviceToken: fcmToken });
      if (__DEV__) {
        console.log('get ios FCM Token:', fcmToken);
      }
    } else {
      if (__DEV__) {
        console.log('알람권한 없음');
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.log('ios error::', error);
    }
  }
}

async function androidRequestPermission() {
  const { androidToken } = CheckAlarmsetting();

  try {
    const fcmToken = await androidToken(); // 객체 구조분해 할당
    if (fcmToken) {
      if (NativeModules.DotReactBridge?.setPushToken) {
        NativeModules.DotReactBridge.setPushToken(fcmToken);
      } else {
        if (__DEV__) {
          console.log('DotReactBridge is not available');
        }
      }
      pushAlarmPermission({ deviceToken: fcmToken });
      if (__DEV__) {
        console.log('get android FCM Token:', fcmToken);
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.log('Android error:', error);
    }
  }
}
