import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  getToken,
  registerDeviceForRemoteMessages,
  requestPermission,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import { AUTHORIZED, PROVISIONAL } from '../constant/AlarmStatus';

export default function CheckAlarmsetting() {
  async function androidAlarm() {
    let has = true;
    if (Number(Platform.Version) >= 33) {
      const perm = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
      has = await PermissionsAndroid.check(perm);
      const res = await PermissionsAndroid.request(perm);
      if (res !== PermissionsAndroid.RESULTS.GRANTED) {
        if (__DEV__) {
          console.log('[Push] POST_NOTIFICATIONS denied');
        }
      }
    }
    return has;
  }
  async function androidToken() {
    const messaging = await getMessaging();
    await registerDeviceForRemoteMessages(messaging);
    const fcmToken = await getToken(messaging);
    return fcmToken;
  }
  async function iosAlarmToken() {
    const app = getApp();
    const messaging = getMessaging(app);
    const authorizationStatus = await requestPermission(messaging);
    if (__DEV__) {
      console.log('authorizationStatus', authorizationStatus);
    }
    const enabled = authorizationStatus === AUTHORIZED || authorizationStatus === PROVISIONAL;
    const fcmToken = await getToken(messaging);
    // console.log('fcmToken', fcmToken);
    return { enabled, fcmToken };
  }
  return { androidAlarm, androidToken, iosAlarmToken };
}
