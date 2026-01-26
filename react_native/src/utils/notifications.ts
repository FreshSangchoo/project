import { Platform } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

function pickString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v : undefined;
}

function parseTalkplus(d?: Record<string, string | undefined>) {
  const raw = d?.talkplus ?? undefined;
  try {
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export async function ensureChannel() {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: 'default',
      name: '기본 알림',
      importance: AndroidImportance.HIGH,
    });
  }
}

/** 포그라운드/백그라운드 모두에서 띄울 로컬 알림 */
export async function displayLocalNotification(msg: FirebaseMessagingTypes.RemoteMessage) {
  const data = (msg.data ?? {}) as Record<string, string | undefined>;
  const tp = parseTalkplus(data);

  const title = msg.notification?.title ?? data.title ?? '알림';
  const body = msg.notification?.body ?? data.body ?? '';

  const payload: { [k: string]: string | number | object } = {};
  if (tp?.channelId) {
    payload.type = 'chat';
    payload.channelId = tp.channelId;
  }

  await notifee.displayNotification({
    title,
    body,
    data: payload,
    android: {
      channelId: 'default',
      pressAction: { id: 'OPEN', launchActivity: 'default' },
    },
    ios: {
      foregroundPresentationOptions: { alert: true, sound: true, badge: true },
    },
  });
}
