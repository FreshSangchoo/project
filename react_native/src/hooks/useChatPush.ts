import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { CommonActions, NavigationContainerRef } from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';
import { getTalkClient, loginWithToken } from '@/libs/talkplus';
import { useUserStore } from '@/stores/userStore';
import useChatApi from '@/hooks/apis/useChatApi';
import useUserChatApi from '@/hooks/apis/useUserChat';
import EncryptedStorage from 'react-native-encrypted-storage';

type NavRef = RefObject<NavigationContainerRef<any> | null>;
type Options = { auto?: boolean };

async function waitForConnection(client: any, maxWaitMs = 1500) {
  if (typeof client?.once === 'function') {
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('connect-timeout')), maxWaitMs);
        client.once('connected', () => {
          clearTimeout(timer);
          resolve();
        });
      });
      return;
    } catch {}
  }
  const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < Math.ceil(maxWaitMs / 100); i++) {
    const rs = client?.ws?.readyState;
    if (rs === 1) return;
    await wait(100);
  }
}

function extractFromTalkplus(data?: Record<string, any>): {
  channelId?: string;
  otherUserId?: string;
  otherNickname?: string;
} {
  try {
    if (!data) return {};
    const raw = (data as any).talkplus;
    const tp = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!tp) return {};
    return {
      channelId: typeof tp.channelId === 'string' ? tp.channelId : undefined,
      otherUserId: tp.otherUserId ? String(tp.otherUserId) : undefined,
      otherNickname: tp.otherNickname || tp.username || undefined,
    };
  } catch {
    return {};
  }
}

async function fetchPeerFromChannel(channelId: string, myUserId?: string) {
  const c = getTalkClient() as any;
  const snap = await c.getChannel({ channelId });
  const ch = snap?.channel ?? snap;
  const mems: any[] = ch?.members ?? [];

  const other = mems.find(m => String(m?.id) !== String(myUserId));
  const targetUserId = String(other?.userId ?? other?.user?.id ?? '');
  const nickname =
    other?.username || other?.user?.username || other?.profile?.username || other?.name || other?.profile?.name;

  const withdrawn = Boolean(other?.withdrawn);
  return { nickname, targetUserId, withdrawn };
}

function extractChannelId(data?: Record<string, any>): string | undefined {
  const inRoot = data && typeof data.channelId === 'string' ? data.channelId : undefined;
  if (inRoot) return inRoot;
  return extractFromTalkplus(data).channelId;
}

export default function useChatPush(navRef?: NavRef, { auto = true }: Options = {}) {
  const profile = useUserStore(s => s.profile);
  const { postChannelFCMToken, putChannelNotifications } = useChatApi();
  const { postChatUserLogin } = useUserChatApi();

  const wiredRef = useRef(false);
  const onTokenRefreshUnsub = useRef<(() => void) | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // 채팅방으로 이동
  const goToChat = useCallback(
    async (cid?: string, data?: Record<string, any>) => {
      if (!cid) return;
      const nav = navRef?.current;
      if (!nav) return;

      const tp = extractFromTalkplus(data);
      let nickname = tp.otherNickname || '채팅';
      let targetUserId = tp.otherUserId;
      let withdrawn = false;

      if (!targetUserId || !nickname || nickname === '채팅') {
        try {
          const peer = await fetchPeerFromChannel(cid, profile?.userId ? String(profile.userId) : undefined);
          nickname = peer.nickname || nickname;
          targetUserId = peer.targetUserId || targetUserId;
          withdrawn = peer.withdrawn;
        } catch {}
      }

      nav.dispatch(
        CommonActions.navigate({
          name: 'ChatStack' as never,
          params: {
            screen: 'ChattingRoomPage',
            params: {
              channelId: cid,
              nickname,
              targetUserId,
              withdrawn,
            },
          } as never,
        }),
      );
    },
    [navRef, profile?.userId],
  );

  // 알림 탭 → 채팅방 이동
  useEffect(() => {
    // Notifee 포그라운드 알림 탭 처리
    // TalkPlus SDK가 자체 알림을 표시하고, 사용자가 탭하면 여기서 감지
    const unsubForeground = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const data = detail.notification?.data as any;
        const cid = extractChannelId(data);

        if (cid) {
          if (__DEV__) {
            console.log('[useChatPush] Foreground notification tapped, navigating to chat:', cid);
          }
          void goToChat(cid, data);
        }
      }
    });

    // 앱 시작 시 초기 알림 확인
    notifee.getInitialNotification().then(initial => {
      if (initial) {
        const data = initial?.notification?.data as any;
        const cid = extractChannelId(data);

        if (cid) {
          if (__DEV__) {
            console.log('[useChatPush] Initial notification, navigating to chat:', cid);
          }
          void goToChat(cid, data);
        }
      }
    });

    // Firebase 백그라운드 → 포그라운드 전환 시 알림 탭 처리
    // TalkPlus SDK의 웹소켓 알림이 여기서도 감지될 수 있음
    const unsubOpened = messaging().onNotificationOpenedApp(rm => {
      const data = rm.data as any;
      const cid = extractChannelId(data);

      if (cid) {
        if (__DEV__) {
          console.log('[useChatPush] Background notification opened, navigating to chat:', cid);
        }
        void goToChat(cid, data);
      }
    });

    return () => {
      unsubForeground();
      unsubOpened();
    };
  }, [goToChat]);

  // FCM/TalkPlus 등록
  const wire = useCallback(async () => {
    if (!profile?.userId) return;
    if (!profile?.verified) return;
    if (wiredRef.current) return;

    wiredRef.current = true;
    setReady(false);
    setError(null);

    try {
      // 액세스 토큰 확인
      const accessToken = await EncryptedStorage.getItem('accessToken');
      if (!accessToken) {
        if (__DEV__) {
          console.log('[useChatPush] No access token, skipping FCM registration');
        }
        wiredRef.current = false;
        return;
      }

      // TalkPlus 로그인
      const { loginToken } = await postChatUserLogin();
      await loginWithToken(String(profile.userId), loginToken);

      const client: any = getTalkClient();
      await waitForConnection(client);

      // FCM 토큰 등록
      await messaging().registerDeviceForRemoteMessages();
      const fcmToken = await messaging().getToken();
      const deviceId = await DeviceInfo.getUniqueId();

      try {
        await postChannelFCMToken(fcmToken, deviceId);
      } catch (error) {
        if (__DEV__) {
          console.log('[useChatPush] Backend FCM registration failed, using SDK fallback:', error);
        }
        // 백엔드 실패 시 SDK 직접 등록
        const c = getTalkClient();
        await (c as any).registerFcmToken?.({ fcmToken, deviceId });
      }

      // SDK 푸시 활성화
      try {
        await (getTalkClient() as any).enablePushNotification?.();
      } catch (e: any) {
        if (__DEV__) console.log('[useChatPush] enablePushNotification skip:', e?.message);
      }

      // 토큰 갱신
      onTokenRefreshUnsub.current?.();
      onTokenRefreshUnsub.current = messaging().onTokenRefresh(async newToken => {
        const devId = await DeviceInfo.getUniqueId();
        const accessToken = await EncryptedStorage.getItem('accessToken');
        if (!accessToken) {
          if (__DEV__) {
            console.log('[useChatPush] No access token for token refresh, using SDK fallback');
          }
          await (getTalkClient() as any).registerFcmToken?.({ fcmToken: newToken, deviceId: devId });
          return;
        }
        try {
          await postChannelFCMToken(newToken, devId);
        } catch (error) {
          if (__DEV__) {
            console.log('[useChatPush] Token refresh failed, using SDK fallback:', error);
          }
          await (getTalkClient() as any).registerFcmToken?.({ fcmToken: newToken, deviceId: devId });
        }
      });

      setReady(true);
    } catch (e) {
      wiredRef.current = false;
      setError(e);
    }
  }, [profile?.userId, profile?.verified, postChatUserLogin, postChannelFCMToken]);

  // 특정 채널 알림 ON (신규 채팅방 생성 직후 호출)
  const registerChannelPush = useCallback(
    async (channelId: string) => {
      if (!channelId) return;
      try {
        await putChannelNotifications(channelId, true);
      } finally {
        try {
          await (getTalkClient() as any).enableChannelPushNotification?.({ channelId });
        } catch {}
      }
    },
    [putChannelNotifications],
  );

  useEffect(() => {
    if (!auto) return;
    if (!profile?.userId) return;
    if (!profile?.verified) return;
    wire();
    return () => onTokenRefreshUnsub.current?.();
  }, [auto, profile?.userId, profile?.verified, wire]);

  return { wire, ready, error, registerChannelPush };
}
