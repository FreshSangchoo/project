import notifee, { AndroidImportance } from '@notifee/react-native';

export default async function createNotificationChannel() {
  await notifee.createChannel({
    id: 'default',
    name: '기본 알림',
    importance: AndroidImportance.HIGH,
  });
}
