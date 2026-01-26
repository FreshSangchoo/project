import TitleMainHeader from '@/components/common/header/TitleMainHeader';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import IconBell from '@/assets/icons/IconBell.svg';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { useCallback, useEffect, useRef, useState } from 'react';
import NoResultSection from '@/components/common/NoResultSection';
import EmojiEnvelope from '@/assets/icons/EmojiEnvelope.svg';
import ChatListItem, { ChatListItemProps } from '@/components/chat/ChatListItem';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';
import SettingItem from '@/components/my-page/SettingItemRow';
import IconLogin2 from '@/assets/icons/IconLogin2.svg';
import { useUserStore } from '@/stores/userStore';
import useChatApi from '@/hooks/apis/useChatApi';
import { ChatChannel } from '@/types/chat';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import ChatRoomSkeleton from '@/components/chat/ChatRoomSkeleton';
import useUserChatApi from '@/hooks/apis/useUserChat';
import { ensureChatToken, getTalkClient } from '@/libs/talkplus';
import { useFocusEffect } from '@react-navigation/native';
import { extractAttachment, isFileMessage, chatEventEmitter, CHAT_EVENTS } from '@/utils/chatHelpers';
import { getBlockedAt, syncBlockedMapFromApi } from '@/stores/blockedStore';
import useUserApi from '@/hooks/apis/useUserApi';
import { useToastStore } from '@/stores/toastStore';

function ChattingIndexPage() {
  const navigation = useRootNavigation();
  const profile = useUserStore(p => p.profile);
  const goLogin = useUserStore(c => c.clearProfile);
  const showGlobalToast = useToastStore(s => s.show);

  const openedSwipeRef = useRef<Swipeable | null>(null);
  const [chattingRoomList, setChattingRoomList] = useState<ChatListItemProps[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [hasNext, setHasNext] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const { getChannels, postLeaveChannel, getChannelNotifications, putChannelNotifications } = useChatApi();
  const { postChatUserLogin } = useUserChatApi();
  const { getBlockedUser } = useUserApi();
  const seenIndexIdsRef = useRef<Set<string>>(new Set());
  const insets = useSafeAreaInsets();

  const muteUntilRef = useRef(0);
  const loginInFlight = useRef<Promise<void> | null>(null);
  const lastLoginAtRef = useRef(0);

  const ensureLoggedIn = useCallback(async () => {
    if (!profile?.verified) return;

    const now = Date.now();
    // 30초 캐시
    if (now - lastLoginAtRef.current < 30_000) return;
    if (loginInFlight.current) return loginInFlight.current;

    loginInFlight.current = (async () => {
      await ensureChatToken(() => postChatUserLogin(), String(profile!.userId));
      lastLoginAtRef.current = Date.now();
    })().finally(() => {
      loginInFlight.current = null;
    });

    return loginInFlight.current;
  }, [postChatUserLogin, profile?.userId, profile?.verified]);

  const refreshBlocked = useCallback(async () => {
    try {
      const list = await getBlockedUser();
      if (Array.isArray(list)) {
        syncBlockedMapFromApi(list);
      }
    } catch {}
  }, [getBlockedUser]);

  useEffect(() => {
    void refreshBlocked();
  }, [refreshBlocked]);

  // 채팅방 나가기 이벤트 수신
  useEffect(() => {
    const handleChannelLeft = (channelId: string) => {
      setChattingRoomList(prev => prev.filter(room => room.channelId !== channelId));
    };

    chatEventEmitter.on(CHAT_EVENTS.CHANNEL_LEFT, handleChannelLeft);

    return () => {
      chatEventEmitter.off(CHAT_EVENTS.CHANNEL_LEFT, handleChannelLeft);
    };
  }, []);

  const previewFromMessage = (m: any) => {
    if (!m) return '';

    if (m?.type === 'custom') {
      if (m?.data?.kind === 'postCard') return '매물 카드';
      if (m?.data?.kind === 'imageGroup') {
        try {
          const raw = m?.data?.payload;
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          const n = Array.isArray(parsed?.items) ? parsed.items.length : 0;
          return n > 1 ? `사진 ${n}장을 보냈습니다.` : '사진을 보냈습니다.';
        } catch {
          return '사진을 보냈습니다.';
        }
      }
    }

    if (isFileMessage(m)) {
      const att = extractAttachment(m);
      if (att.kind === 'image') return '사진을 보냈습니다.';
      if (att.kind === 'video') return '동영상을 보냈습니다.';
      return '파일을 보냈습니다.';
    }

    return m?.text ?? '';
  };

  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResetAtRef = useRef(0);

  // 실시간 이벤트
  useEffect(() => {
    const client = getTalkClient();

    const onEvent = async (event: any) => {
      try {
        if (!event) return;

        if (Date.now() < muteUntilRef.current) {
          const pass = event.type === 'channel_added' || event.type === 'channel_left';
          if (!pass) return;
        }

        // 메시지 수신
        if (event.type === 'message') {
          const m = event.message;
          if (!m) return;
          if (seenIndexIdsRef.current.has(m.id)) return;

          const blockTs = getBlockedAt(m.userId);
          const isBlockedSideMsg = blockTs && m.createdAt >= blockTs;
          if (isBlockedSideMsg) {
            try {
              await (getTalkClient() as any).markAsRead?.({ channelId: m.channelId });
            } catch {}
            return;
          }

          seenIndexIdsRef.current.add(m.id);

          setChattingRoomList(prev => {
            const idx = prev.findIndex(x => x.channelId === m.channelId);
            const isMine = String(m.userId) === String(profile?.userId);

            if (idx !== -1) {
              const it = prev[idx];
              const updated: ChatListItemProps = {
                ...it,
                lastChat: previewFromMessage(m) || it.lastChat,
                lastMessageTime: formatTimeAgo(new Date(m.createdAt)),
                unreadCount: isMine ? it.unreadCount : (it.unreadCount ?? 0) + 1,
              };
              const next = [...prev];
              next.splice(idx, 1);
              return [updated, ...next];
            }

            const placeholder: ChatListItemProps = {
              channelId: m.channelId,
              profileImage: '',
              nickname: '',
              lastChat: previewFromMessage(m) || '',
              lastMessageTime: formatTimeAgo(new Date(m.createdAt)),
              unreadCount: isMine ? 0 : 1,
              isAlarmOn: true,
              onPress: () =>
                navigation.navigate('ChatStack', {
                  screen: 'ChattingRoomPage',
                  params: { channelId: m.channelId, nickname: '', targetUserId: undefined },
                }),
            };
            const filtered = prev.filter(x => x.channelId !== m.channelId);
            return [placeholder, ...filtered];
          });

          scheduleSoftReset();
          return;
        }
        if (event.type === 'message_deleted') {
          scheduleSoftReset();
          return;
        }
        if (event.type === 'channel_added') {
          const ch = event?.channel;
          if (ch?.id) {
            // 채널 정보가 불완전한 경우(멤버 정보 없음) 서버에서 다시 가져오기
            const hasMembers = ch.originMembers && Array.isArray(ch.originMembers) && ch.originMembers.length > 0;
            if (!hasMembers) {
              loadPageMuted('reset', { silent: true });
              return;
            }

            setChattingRoomList(prev => {
              const item = mapChannelToItem(ch);
              const next = prev.filter(x => x.channelId !== item.channelId);
              return [item, ...next];
            });
            try {
              const { enabled } = await getChannelNotifications(ch.id);
              const tp = getTalkClient() as any;
              if (enabled) await tp.enableChannelPushNotification?.({ channelId: ch.id });
              else await tp.disableChannelPushNotification?.({ channelId: ch.id });
              setChattingRoomList(prev => prev.map(r => (r.channelId === ch.id ? { ...r, isAlarmOn: !!enabled } : r)));
            } catch {}
          } else {
            loadPageMuted('reset', { silent: true });
          }
          return;
        }

        if (event.type === 'channel_left') {
          const cId = event?.channelId;
          if (cId) setChattingRoomList(prev => prev.filter(x => x.channelId !== cId));
          return;
        }
        if (event.type === 'member_left') {
          const cId = event?.channelId ?? event?.channel?.id;
          const leaverId = event?.userId;
          if (cId && String(leaverId) === String(profile?.userId)) {
            setChattingRoomList(prev => prev.filter(x => x.channelId !== cId));
          }
        }
        if (event.type === 'message_read') {
          const cId = event?.channelId;
          const readerId = event?.userId;
          if (cId && String(readerId) === String(profile?.userId)) {
            setChattingRoomList(prev => prev.map(x => (x.channelId === cId ? { ...x, unreadCount: 0 } : x)));
          }
          return;
        }
      } catch (e) {
        console.log('[ChattingIndexPage][event] error:', e);
      }
    };
    client.on('event', onEvent);
    return () => {
      client.off('event', onEvent);
    };
  }, [profile?.userId, navigation]);

  // 알림 설정 맞추기
  const syncNotifications = async (rows: ChatListItemProps[]) => {
    if (!rows.length) return;

    try {
      const LIMIT = 12;
      const targets = rows.slice(0, LIMIT);

      const results = await Promise.allSettled(targets.map(r => getChannelNotifications(r.channelId)));

      setChattingRoomList(prev =>
        prev.map(r => {
          const idx = targets.findIndex(t => t.channelId === r.channelId);
          if (idx === -1) return r;

          const res = results[idx];
          if (res.status === 'fulfilled') {
            const enabled = !!res.value.enabled;
            return { ...r, isAlarmOn: enabled };
          }
          return r;
        }),
      );

      const tp = getTalkClient() as any;
      await Promise.all(
        results.map(async (res, i) => {
          if (res.status !== 'fulfilled') return;
          const channelId = targets[i].channelId;
          const enabled = !!res.value.enabled;
          try {
            if (enabled) {
              await tp.enableChannelPushNotification?.({ channelId });
            } else {
              await tp.disableChannelPushNotification?.({ channelId });
            }
          } catch {}
        }),
      );
    } catch (e) {
      console.log('[syncNotifications] error:', e);
    }
  };

  const closeSwipe = () => {
    if (isSwipeOpen && openedSwipeRef.current) {
      openedSwipeRef.current.close();
      setIsSwipeOpen(false);
    }
  };

  const mapChannelToItem = (ch: ChatChannel): ChatListItemProps => {
    const myId = profile?.userId?.toString();
    const other = ch.originMembers?.find(m => m.userId !== Number(myId));
    const withdrawn = other?.withdrawn;
    const nickname = withdrawn ? '(탈퇴한 유저)' : other?.nickname || ch.name || '채팅방';
    const targetUserId = other?.userId ? Number(other.userId) : undefined;

    const blockTs = getBlockedAt(targetUserId);
    const last = ch.lastMessage;
    const lastFromOther = !!(last && String(last.userId) === String(targetUserId));
    const lastIsBlockedSide = lastFromOther && blockTs && last.createdAt >= blockTs;

    const safeLastChat = lastIsBlockedSide ? '내가 차단한 사용자입니다.' : previewFromMessage(last) || '';
    const safeLastMs = lastIsBlockedSide ? undefined : last?.createdAt ?? ch.updatedAt;

    const unreadCount = blockTs ? 0 : ch.unreadCount ?? 0;

    return {
      channelId: ch.id,
      profileImage: withdrawn ? '' : other?.profileImage || ch.imageUrl || '',
      nickname,
      lastChat: safeLastChat,
      lastMessageTime: safeLastMs ? formatTimeAgo(new Date(safeLastMs)) : '',
      unreadCount,
      isAlarmOn: true,
      onPress: () =>
        navigation.navigate('ChatStack', {
          screen: 'ChattingRoomPage',
          params: { channelId: ch.id, nickname, targetUserId, withdrawn },
        }),
    };
  };

  const getLastChannelId = () =>
    chattingRoomList.length ? chattingRoomList[chattingRoomList.length - 1].channelId : undefined;

  const loadPage = async (mode: 'reset' | 'append', opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;

    if (!profile?.verified) {
      if (mode === 'append') {
        setLoadingMore(false);
      } else {
        setLoadingInitial(false);
      }
      setChattingRoomList([]);
      setHasNext(false);
      return;
    }

    if (mode === 'append') {
      if (!hasNext || loadingMore || loadingInitial || refreshing) return;
      setLoadingMore(true);
    } else {
      if (!silent && chattingRoomList.length === 0) {
        setLoadingInitial(true);
      }
    }

    try {
      if (mode === 'reset') {
        await ensureLoggedIn();
      }

      const cursor = mode === 'append' ? getLastChannelId() : undefined;
      const { channels, hasNext: next } = await getChannels(cursor);

      const mapped = channels.map(mapChannelToItem);

      if (mode === 'reset') {
        setChattingRoomList(prev => {
          if (!prev.length) return mapped;
          const byId = new Map(prev.map(x => [x.channelId, x]));
          mapped.forEach(it => {
            const old = byId.get(it.channelId);
            if (!old) {
              byId.set(it.channelId, it);
              return;
            }
            byId.set(it.channelId, {
              ...it,
              ...old,
              lastChat: it.lastChat || old.lastChat,
              lastMessageTime: it.lastMessageTime || old.lastMessageTime,
              unreadCount: it.unreadCount, // 서버 데이터 우선
            });
          });
          return Array.from(byId.values());
        });
        syncNotifications(mapped);
      } else {
        setChattingRoomList(prev => {
          const existing = new Set(prev.map(x => x.channelId));
          const dedup = mapped.filter(x => !existing.has(x.channelId));
          if (dedup.length) syncNotifications(dedup);
          return [...prev, ...dedup];
        });
      }

      setHasNext(next);
    } catch (e) {
      const status = (e as any)?.response?.status;
      const errorMsg = (e as any)?.message || String(e);

      if (__DEV__) {
        console.log('[ChattingIndexPage][loadPage] error:', {
          status,
          message: errorMsg,
          mode,
        });
      }

      if (mode === 'reset' && !opts?.silent) {
        if (chattingRoomList.length === 0) {
          setHasNext(false);
        }
      }
    } finally {
      if (mode === 'append') setLoadingMore(false);
      if (mode === 'reset' && !opts?.silent) setLoadingInitial(false);
    }
  };

  const loadPageMuted = useCallback(async (mode: 'reset' | 'append', opts?: { silent?: boolean }) => {
    muteUntilRef.current = Date.now() + 800;
    try {
      await loadPage(mode, opts);
    } finally {
      muteUntilRef.current = Date.now() + 200;
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPageMuted('reset');
    } finally {
      setRefreshing(false);
    }
  };

  const onEndReached = () => {
    loadPage('append');
  };

  const handleToggleAlarm = async (channelId: string, next: boolean) => {
    await putChannelNotifications(channelId, next);
    setChattingRoomList(prev => prev.map(r => (r.channelId === channelId ? { ...r, isAlarmOn: next } : r)));
  };

  const handleLeave = async (channelId: string) => {
    try {
      await postLeaveChannel(channelId);
      setChattingRoomList(prev => prev.filter(r => r.channelId !== channelId));
      showGlobalToast({ message: '채팅방에서 나갔어요.', image: 'EmojiDoor', duration: 1500 });
    } catch (e) {
      showGlobalToast({ message: '채팅방 나가기에 실패했어요.', image: 'EmojiDoor', duration: 1500 });
    }
  };

  // 초기 진입
  useEffect(() => {
    setChattingRoomList([]);
    setHasNext(true);
    loadPageMuted('reset');
  }, [loadPageMuted]);

  const didMountRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (didMountRef.current) {
        // 항상 목록을 새로고침하여 채팅방 나가기 등의 변경사항을 반영
        loadPageMuted('reset', { silent: true });
      } else {
        didMountRef.current = true;
      }
    }, [loadPageMuted]),
  );

  const scheduleSoftReset = useCallback(() => {
    const now = Date.now();
    if (now - lastResetAtRef.current < 1500) return;

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    resetTimerRef.current = setTimeout(() => {
      lastResetAtRef.current = Date.now();
      loadPageMuted('reset', { silent: true });
    }, 250);
  }, [loadPageMuted]);

  const SkeletonList = () => (
    <View style={{ paddingBottom: 60 }}>
      <View>
        <ChatRoomSkeleton />
        <ChatRoomSkeleton />
        <ChatRoomSkeleton />
      </View>
    </View>
  );

  const [ready, setReady] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
  }, [insets.top, insets.bottom, insets.left, insets.right]);

  return (
    <SafeAreaView style={styles.chattingIndexPage}>
      <TitleMainHeader
        title="채팅"
        rightChilds={[
          {
            icon: (
              <IconBell
                width={28}
                height={28}
                stroke={semanticColor.icon.primary}
                strokeWidth={semanticNumber.stroke.bold}
              />
            ),
            onPress: () => navigation.navigate('HomeStack', { screen: 'Notification' }),
          },
        ]}
      />
      {profile?.userId ? (
        <Pressable style={styles.listContainer} onPress={closeSwipe}>
          {loadingInitial && chattingRoomList.length === 0 ? (
            <SkeletonList />
          ) : (
            <FlatList
              data={chattingRoomList}
              keyExtractor={item => item.channelId}
              renderItem={({ item }) => (
                <ChatListItem
                  {...item}
                  openedSwipeRef={openedSwipeRef}
                  isSwipeOpen={isSwipeOpen}
                  setIsSwipeOpen={setIsSwipeOpen}
                  onSwipeableWillOpen={ref => {
                    if (openedSwipeRef.current && openedSwipeRef.current !== ref) {
                      openedSwipeRef.current.close();
                      setIsSwipeOpen(false);
                    }
                    openedSwipeRef.current = ref;
                    setIsSwipeOpen(true);
                  }}
                  onToggleAlarm={handleToggleAlarm}
                  onLeave={handleLeave}
                  showToast={(message, image = 'EmojiBell') => showGlobalToast({ message, image, duration: 1500 })}
                />
              )}
              contentContainerStyle={{ paddingBottom: 60 }}
              ListEmptyComponent={<NoResultSection title="아직 채팅 내역이 없어요." emoji={<EmojiEnvelope />} />}
              refreshing={refreshing}
              onRefresh={onRefresh}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.6}
              ListFooterComponent={
                loadingMore ? (
                  <View style={{ paddingVertical: semanticNumber.spacing[12] }}>
                    <ChatRoomSkeleton />
                  </View>
                ) : null
              }
            />
          )}
        </Pressable>
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

      {!ready && (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: semanticColor.surface.white }]}
          pointerEvents="none"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  chattingIndexPage: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  listContainer: {
    flex: 1,
  },
});

export default ChattingIndexPage;
