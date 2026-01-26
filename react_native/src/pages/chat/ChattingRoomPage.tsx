import ButtonTitleHeader from '@/components/common/header/ButtonTitleHeader';
import {
  Animated,
  Easing,
  FlatList,
  Keyboard,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import IconChevronDown from '@/assets/icons/IconChevronDown.svg';
import IconDotsVertical from '@/assets/icons/IconDotsVertical.svg';
import IconSend from '@/assets/icons/IconSend.svg';
import { semanticNumber } from '@/styles/semantic-number';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import IconPlus from '@/assets/icons/IconPlus.svg';
import { semanticFont } from '@/styles/semantic-font';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import useChatNavigation, { ChatStackParamList } from '@/hooks/navigation/useChatNavigation';
import ChatModelBubble from '@/components/chat/ChatModelBubble';
import ChatTextBubble from '@/components/chat/ChatTextBubble';
import ActionBottomSheet from '@/components/common/bottom-sheet/ActionBottomSheet';
import { chatRoomChatErrorItems, chatRoomSheetItems } from '@/constants/bottom-sheet/ActionBottomSheetItems';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';
import useChatApi from '@/hooks/apis/useChatApi';
import Modal from '@/components/common/modal/Modal';
import EmojiNoEntry from '@/assets/icons/EmojiNoEntry.svg';
import useUserApi from '@/hooks/apis/useUserApi';
import type { EmojiName } from '@/components/common/toast/SvgMap';
import { ensureChannelBoot, openReport } from '@/libs/channel';
import {
  TPMessage,
  getMessages,
  getTalkClient,
  markChannelRead,
  sendFileMessage,
  sendTextMessage,
  addChannelMembers,
} from '@/libs/talkplus';
import { useUserStore } from '@/stores/userStore';
import { formatDateLabel } from '@/utils/formatDate';
import useUserChatApi from '@/hooks/apis/useUserChat';
import { AvoidSoftInput } from 'react-native-avoid-softinput';
import { fonts } from '@/styles/fonts';
import ChatFileMenu from '@/components/chat/ChatFileMenu';
import { CameraOptions, ImageLibraryOptions, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, isErrorWithCode, errorCodes, types as DocTypes } from '@react-native-documents/picker';
import ChatFileBubble from '@/components/chat/ChatFileBubble';
import {
  extractAttachment,
  formatFileSize,
  isFileMessage,
  parseImageGroupItems,
  toMs,
  isSameDay,
  isSameMinute,
  formatChatTime,
  getUid,
  computeLastReadMyMsgId,
  extractMemberSnapshot,
  isOnlyMe,
  findChannelByIdPaged,
  pickOriginMemberId,
  chatEventEmitter,
  CHAT_EVENTS,
} from '@/utils/chatHelpers';
import ChatImageViewer from '@/components/chat/ChatImageViewer';
import { compressPickedAsset } from '@/utils/compressMedia';
import VideoViewer from '@/components/chat/ChatVideoViewer';
import usePostsApi from '@/hooks/apis/usePostApi';
import { getBlockedAt, setBlockedAt, clearBlockedAt } from '@/stores/blockedStore';
import { useToastStore } from '@/stores/toastStore';

type ChattingRoomPageRouteProps = RouteProp<ChatStackParamList, 'ChattingRoomPage'>;

function ChattingRoomPage() {
  const route = useRoute<ChattingRoomPageRouteProps>();
  const { channelId, nickname, post, targetUserId, withdrawn } = route.params;
  const navigation = useChatNavigation();
  const rootNavigation = useRootNavigation();
  const profile = useUserStore(p => p.profile);

  const [message, setMessage] = useState('');
  const [messagesList, setMessagesList] = useState<TPMessage[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [canSend, setCanSend] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isAlarmOn, setIsAlarmOn] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [blockModal, setBlockModal] = useState(false);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const [fileMenuVisible, setFileMenuVisible] = useState(false);
  const [isWithdrawn, setIsWithdrawn] = useState(withdrawn);
  const [withdrawnModal, setWithdrawnModal] = useState(false);
  const [notFoundModal, setNotFoundModal] = useState(false);
  const [otherLastReadAt, setOtherLastReadAt] = useState<number | null>(null);
  const [otherAvatar, setOtherAvatar] = useState<string | undefined>(undefined);
  const [videoViewer, setVideoViewer] = useState<{ visible: boolean; uri?: string; thumb?: string }>({
    visible: false,
  });

  const { postBlockUser, deleteBlockedUser, getBlockedUser } = useUserApi();
  const { getChannelNotifications, putChannelNotifications, postLeaveChannel, getChannels } = useChatApi();
  const { postChatUserLogin } = useUserChatApi();
  const { getPostDetail } = usePostsApi();
  const membersCountRef = useRef(2);
  const memberUidsRef = useRef<Set<string>>(new Set());
  const originMemberRef = useRef<string | number | null>(null);
  const listRef = useRef<FlatList<TPMessage>>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isWithdrawnRef = useRef(isWithdrawn);
  const isBlockedRef = useRef(isBlocked);
  const prevAlarmRef = useRef<boolean | null>(null);
  const otherAvatarRef = useRef<string | undefined>(undefined);

  const [isFrozen, setIsFrozen] = useState(false);
  const isFrozenRef = useRef(isFrozen);

  const insets = useSafeAreaInsets();
  const [imeH, setImeH] = useState(0);
  const myUserId = String(profile?.userId);

  // 전역 토스트
  const showGlobalToast = useToastStore(s => s.show);
  const showToast = (msg: string, img: EmojiName) => {
    showGlobalToast({ message: msg, image: img, duration: 1500 });
  };

  const refreshFrozen = useCallback(async () => {
    if (!channelId) return;
    try {
      const chSnap = await (getTalkClient() as any).getChannel({ channelId });
      const ch = chSnap?.channel ?? chSnap;
      const next = Boolean(ch?.isFrozen ?? ch?.frozen);
      setIsFrozen(next);
      isFrozenRef.current = next;
    } catch (e) {
      console.log('[refreshFrozen] error:', e);
    }
  }, [channelId]);

  useEffect(() => {
    isBlockedRef.current = isBlocked;
    if (isBlocked) {
      setMessage('');
      setCanSend(false);
    }
  }, [isBlocked]);

  useEffect(() => {
    isWithdrawnRef.current = isWithdrawn;
  }, [isWithdrawn]);

  useEffect(() => {
    isFrozenRef.current = isFrozen;
  }, [isFrozen]);

  const syncMembersFromChannel = useCallback(
    (ch: any) => {
      try {
        const snap = extractMemberSnapshot(ch, targetUserId);
        membersCountRef.current = snap.count;
        memberUidsRef.current = snap.ids;

        if (typeof snap.otherLastReadAt === 'number') {
          setOtherLastReadAt(prev => {
            const x = toMs(snap.otherLastReadAt!);
            return prev ? Math.max(prev, x) : x;
          });
        }

        if (snap.otherAvatar && snap.otherAvatar !== otherAvatarRef.current) {
          setOtherAvatar(snap.otherAvatar);
        }
      } catch (e) {
        console.log('[syncMembersFromChannel] error:', e);
      }
    },
    [targetUserId],
  );

  const refreshChannelMembers = useCallback(async () => {
    if (!channelId) return;
    try {
      const chSnap = await (getTalkClient() as any).getChannel({ channelId });
      const ch = chSnap?.channel ?? chSnap;
      syncMembersFromChannel(ch);
    } catch (e) {
      console.log('[refreshChannelMembers] error:', e);
    }
  }, [channelId, syncMembersFromChannel]);

  const isOnlyMeInChannel = useCallback(() => {
    return isOnlyMe(membersCountRef.current, memberUidsRef.current, profile?.userId!);
  }, [profile?.userId]);

  const refreshOriginMember = useCallback(async () => {
    if (!channelId) return;
    try {
      const ch = await findChannelByIdPaged(getChannels, String(channelId));
      if (!ch) return;

      const origin = pickOriginMemberId(ch, profile?.userId!);
      originMemberRef.current = origin ?? null;
      console.log('[origin] origin', origin);
    } catch (e) {
      console.log('[refreshOriginMember] error:', e);
    }
  }, [channelId, getChannels, profile?.userId]);

  const ensureOtherMemberInChannel = useCallback(async () => {
    if (!channelId) return;

    await refreshChannelMembers();

    if (!isOnlyMeInChannel()) return;

    if (originMemberRef.current == null) {
      await refreshOriginMember();
    }
    const originUserId = originMemberRef.current;
    if (originUserId == null) {
      console.log('[ensureOtherMemberInChannel] originMember missing');
      return;
    }

    try {
      await addChannelMembers({ channelId, members: [originUserId] });
      await refreshChannelMembers();
    } catch (e) {
      console.log('[ensureOtherMemberInChannel] addChannelMembers error:', e);
    }
  }, [channelId, isOnlyMeInChannel, refreshChannelMembers, refreshOriginMember]);

  useEffect(() => {
    otherAvatarRef.current = otherAvatar;
  }, [otherAvatar]);

  const isLatestPostInfoForCurrentPost = (m: TPMessage | undefined, pid?: number | string) =>
    !!m && m.type === 'text' && m?.data?.messageType === 'postInfo' && String(m?.data?.postId) === String(pid);

  const greetSentRef = useRef(false);
  const trySendGreetingOnce = async () => {
    if (greetSentRef.current || !channelId) return;
    greetSentRef.current = true;
    try {
      const resp = await sendTextMessage({ channelId, text: '안녕하세요. 해당 매물 문의 드립니다.' });
      if (resp?.message) appendSent(resp.message);
    } catch {
      greetSentRef.current = false;
    }
  };

  useFocusEffect(
    useCallback(() => {
      AvoidSoftInput.setEnabled(false);
      AvoidSoftInput.setAdjustNothing();
      AvoidSoftInput.setAvoidOffset(0);
      AvoidSoftInput.setShouldMimicIOSBehavior(false);
      return () => {
        AvoidSoftInput.setEnabled(true);
        AvoidSoftInput.setAdjustResize();
      };
    }, []),
  );

  useEffect(() => {
    const subShow = AvoidSoftInput.onSoftInputShown((e: any) => {
      const h = e?.softInputHeight ?? 0;
      const a = Platform.OS === 'ios' ? Math.max(0, h - insets.bottom) : h;
      setImeH(prev => Math.max(prev, a));
    });
    const subHide = AvoidSoftInput.onSoftInputHidden(() => setImeH(0));

    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const kShow = Keyboard.addListener(showEvt, (e: any) => {
      const h = e?.endCoordinates?.height ?? 0;
      const b = Platform.OS === 'ios' ? Math.max(0, h - insets.bottom) : h;
      setImeH(prev => Math.max(prev, b));
    });
    const kHide = Keyboard.addListener(hideEvt, () => setImeH(0));

    return () => {
      subShow.remove();
      subHide.remove();
      kShow.remove();
      kHide.remove();
    };
  }, [insets.bottom]);

  const showNewButton = () => setShowNewMessageButton(true);
  const hideNewButton = () => setShowNewMessageButton(false);

  const scrollToBottom = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    hideNewButton();
    setAtBottom(true);
    setScrollButtonVisible(false);
  };

  const appendSent = (msg: TPMessage) => {
    seenIdsRef.current.add(msg.id);
    setMessagesList(prev => [msg, ...prev]);
    requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
    setScrollButtonVisible(false);
    setAtBottom(true);
  };

  // 초기 메시지 불러오기 (20개)
  const loadInitial = async () => {
    if (!channelId) return;
    setLoading(true);
    try {
      const { loginToken } = await postChatUserLogin();
      await (async () => {
        // talkplus 로그인은 ensureChatToken 등을 쓰지 않고 토큰으로 직접 로그인
        // (필요시 프로젝트 정책에 맞게 조정)
        await (getTalkClient() as any).login?.({ userId: String(profile!.userId), token: loginToken });
      })();

      const { messages, hasNext } = await getMessages({ channelId, limit: 20, order: 'latest' });

      // [ADD] 차단 시점 이후 '상대가 보낸' 메시지 숨김
      const blockTs = getBlockedAt(targetUserId);
      const filtered = blockTs
        ? messages.filter(m => !(String(m.userId) === String(targetUserId) && m.createdAt >= blockTs))
        : messages;

      setMessagesList(filtered);
      setHasNext(hasNext);

      seenIdsRef.current = new Set(filtered.map(m => m.id));

      await markChannelRead(channelId);

      const chSnap = await (getTalkClient() as any).getChannel({ channelId });
      const ch = chSnap?.channel ?? chSnap;

      setIsFrozen(Boolean(ch?.isFrozen ?? ch?.frozen));

      syncMembersFromChannel(ch);
      await refreshOriginMember();

      const mems: any[] = ch?.members ?? [];
      const other = mems.find((m: any) => String(getUid(m)) === String(targetUserId));

      const avatarFromChannel =
        other?.profileImageUrl || other?.profile?.imageUrl || other?.profileUrl || other?.imageUrl || undefined;

      if (avatarFromChannel) setOtherAvatar(avatarFromChannel);
      if (other?.lastReadAt) {
        const raw = other.lastReadAt;
        setOtherLastReadAt(prev => {
          const x = toMs(raw);
          return prev ? Math.max(prev, x) : x;
        });
      }

      try {
        const appCh = await findChannelByIdPaged(getChannels, String(channelId));
        if (appCh?.originMembers?.length) {
          const myId = String(profile?.userId);
          const otherOrigin = appCh.originMembers.find((m: any) => String(m.userId) !== myId);
          if (typeof otherOrigin?.withdrawn === 'boolean') {
            setIsWithdrawn(otherOrigin.withdrawn);
          }
        }
      } catch (e) {
        console.log('[ChattingRoomPage][loadInitial] withdrawn sync error: ', e);
      }

      if (post && isLatestPostInfoForCurrentPost(filtered[0], post.id)) {
        await trySendGreetingOnce();
      }

      setAtBottom(true);
      setScrollButtonVisible(false);
    } catch (error) {
      console.log('[ChattingRoomPage][loadInitial] error: ', error);
    } finally {
      setLoading(false);
    }
  };

  // (과거) 메시지 더 불러오기
  const loadMore = async () => {
    if (!channelId || !hasNext || loading || messagesList.length === 0) return;
    setLoading(true);
    try {
      const lastId = messagesList[messagesList.length - 1].id;
      const { messages: more, hasNext: moreNext } = await getMessages({
        channelId,
        lastMessageId: lastId,
        limit: 20,
      });

      const blockTs = getBlockedAt(targetUserId);
      const moreFiltered = blockTs
        ? more.filter(m => !(String(m.userId) === String(targetUserId) && m.createdAt >= blockTs))
        : more;

      setMessagesList(prev => [...prev, ...moreFiltered]);
      setHasNext(moreNext);
    } catch (error) {
      console.log('[ChattingRoomPage][loadMore] error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!channelId || !profile?.userId) return;
    setMessagesList([]);
    setHasNext(true);
    setLoading(false);
    void loadInitial();
  }, [channelId]);

  // 실시간 이벤트 수신
  useEffect(() => {
    const client = getTalkClient();

    const onEvent = (event: any) => {
      try {
        // 메시지 수신
        if (event?.type === 'message') {
          const m: TPMessage | undefined = event?.message;
          if (!m || m.channelId !== channelId) return;

          const fromOther = String(m.userId) === String(targetUserId);
          const blockTs = getBlockedAt(targetUserId);

          // [ADD] 차단 '시점' 이후의 상대 메시지 무시 + 서버 읽음 포인터만 처리
          if (fromOther && blockTs && m.createdAt >= blockTs) {
            try {
              markChannelRead(channelId);
            } catch {}
            return;
          }

          // 기존 차단 플래그도 유지
          if (isBlockedRef.current && fromOther) return;

          if (!seenIdsRef.current.has(m.id)) {
            seenIdsRef.current.add(m.id);
            setMessagesList(prev => [m, ...prev]);
          }

          if (!atBottomRef.current) showNewButton();
          markChannelRead(channelId);
          return;
        }

        // 메시지 삭제
        if (event?.type === 'message_deleted') {
          if (event?.channelId !== channelId) return;
          setMessagesList(prev => prev.filter(m => m.id !== event?.messageId));
          return;
        }

        // 읽음 포인터 갱신 및 채널 상태 변경
        if (event?.type === 'channel_changed') {
          const sameChannel = String(event?.channel?.id ?? event?.channelId) === String(channelId);
          if (!sameChannel) return;

          const ch = event?.channel;

          setIsFrozen(prev => {
            const next = Boolean(ch?.isFrozen ?? ch?.frozen);
            if (prev !== next) {
              if (next) {
                setCanSend(false);
                if (message.trim()) setMessage(message);
                showToast('상대방이 차단하여 메시지를 보낼 수 없어요.', 'EmojiNoEntry');
              } else {
                showToast('채팅이 다시 가능해졌어요.', 'EmojiCheckMarkButton');
              }
            }
            return next;
          });

          // 멤버/아바타/읽음포인터 동기화
          (async () => {
            try {
              const mems: any[] = ch?.members ?? [];
              const other = mems.find((m: any) => String(getUid(m)) === String(targetUserId));
              if (other?.lastReadAt) {
                setOtherLastReadAt(prev => {
                  const x = toMs(other.lastReadAt);
                  return prev ? Math.max(prev, x) : x;
                });
              }
              const avatarFromEvent =
                other?.profileImageUrl || other?.profile?.imageUrl || other?.profileUrl || other?.imageUrl || undefined;
              if (avatarFromEvent && avatarFromEvent !== otherAvatarRef.current) {
                setOtherAvatar(avatarFromEvent);
              }
            } catch {}
          })();

          (async () => {
            try {
              const appCh = await findChannelByIdPaged(getChannels, String(channelId));
              if (appCh?.originMembers?.length) {
                const myId = String(profile?.userId);
                const otherOrigin = appCh.originMembers.find((m: any) => String(m.userId) !== myId);
                if (typeof otherOrigin?.withdrawn === 'boolean') {
                  setIsWithdrawn(otherOrigin.withdrawn);
                }
              }
            } catch {}
          })();

          return;
        }

        if (event?.type === 'member_left' || event?.type === 'channel_changed') {
          const sameChannel = String(event?.channel?.id ?? event?.channelId) === String(channelId);
          if (!sameChannel) return;
          void refreshChannelMembers();
          void refreshOriginMember();
          (async () => {
            try {
              const appCh = await findChannelByIdPaged(getChannels, String(channelId));
              if (appCh?.originMembers?.length) {
                const myId = String(profile?.userId);
                const otherOrigin = appCh.originMembers.find((m: any) => String(m.userId) !== myId);
                if (typeof otherOrigin?.withdrawn === 'boolean') {
                  setIsWithdrawn(otherOrigin.withdrawn);
                }
              }
            } catch {}
          })();
          return;
        }
      } catch (error) {
        console.log('[ChattingRoomPage] onEvent error:', error);
      }
    };

    client.on('event', onEvent);
    return () => {
      client.off('event', onEvent);
    };
  }, [channelId, targetUserId, getChannels, profile?.userId]);

  // 알림 상태 초기화
  useEffect(() => {
    if (!channelId) return;
    (async () => {
      try {
        const { enabled } = await getChannelNotifications(channelId);
        setIsAlarmOn(!!enabled);
      } catch (error) {
        console.log('[ChattingRoomPage] useEffect error:', error);
      }
    })();
  }, [channelId]);

  // 차단 상태 초기화
  useEffect(() => {
    if (!targetUserId) return;
    (async () => {
      try {
        const list = await getBlockedUser();
        const blocked =
          Array.isArray(list) &&
          list.some((it: any) => {
            const id = it?.userInfo?.userId ?? it?.userId;
            return Number(id) === Number(targetUserId);
          });
        setIsBlocked(!!blocked);
      } catch (e) {
        console.log('[ChattingRoomPage] getBlockedUser error:', e);
      }
    })();
  }, [targetUserId, getBlockedUser]);

  // 프로필 보기
  const handleShowProfile = async () => {
    setShowBottomSheet(false);
    if (isWithdrawn) {
      setWithdrawnModal(true);
      return;
    }
    if (!targetUserId) {
      showToast('상대방 정보를 찾을 수 없어요.', 'EmojiNoEntry');
      return;
    }
    rootNavigation.navigate('ExploreStack', {
      screen: 'SellerPage',
      params: { id: Number(targetUserId) },
    });
  };

  // 알림 설정
  const handleToggleAlarm = async () => {
    if (!channelId) return;
    const next = !isAlarmOn;
    try {
      await putChannelNotifications(channelId, next);
      const c = getTalkClient() as any;
      if (next) await c.enableChannelPushNotification?.({ channelId });
      else await c.disableChannelPushNotification?.({ channelId });
      setIsAlarmOn(next);
      showToast(next ? '채팅방 알림을 켰어요.' : '채팅방 알림을 껐어요.', 'EmojiBell');
    } catch {
      showToast('알림 설정 변경에 실패했어요.', 'EmojiBell');
    } finally {
      setShowBottomSheet(false);
    }
  };

  const openBlockModal = () => {
    setShowBottomSheet(false);
    setBlockModal(true);
  };

  const waitUnfreeze = useCallback(
    async (retries = 6, delayMs = 400) => {
      for (let i = 0; i < retries; i++) {
        await refreshFrozen();
        if (!isFrozenRef.current) return;
        await new Promise(res => setTimeout(res, delayMs));
      }
    },
    [refreshFrozen],
  );

  // 차단하기
  const handleBlock = async () => {
    if (blockBusy) return;
    setBlockBusy(true);
    setBlockModal(false);
    showToast('차단 처리 중...', 'EmojiBell');
    try {
      await postBlockUser(Number(targetUserId));

      if (targetUserId != null) setBlockedAt(String(targetUserId), Date.now());

      setIsBlocked(true);
      prevAlarmRef.current = isAlarmOn;

      try {
        await putChannelNotifications(channelId, false);
        const c = getTalkClient() as any;
        await c.disableChannelPushNotification?.({ channelId });
        setIsAlarmOn(false);
      } catch {}

      showToast('상대방을 차단했어요.', 'EmojiNoEntry');

      await refreshFrozen();
    } catch {
      setShowBottomSheet(false);
      showToast('사용자 차단에 실패했어요. ', 'EmojiNoEntry');
    } finally {
      setBlockBusy(false);
    }
  };

  // 차단 해제 하기
  const handleUnblock = async () => {
    if (blockBusy) return;
    setBlockBusy(true);
    showToast('차단 해제 중...', 'EmojiBell');
    try {
      if (!targetUserId) {
        showToast('상대방 정보를 찾을 수 없어요.', 'EmojiNoEntry');
        return;
      }
      await deleteBlockedUser(Number(targetUserId));

      clearBlockedAt(String(targetUserId));

      setIsBlocked(false);
      setShowBottomSheet(false);
      showToast('차단을 해제했어요.', 'EmojiCheckMarkButton');

      await waitUnfreeze();

      await loadInitial();

      const restore = prevAlarmRef.current ?? false;
      try {
        await putChannelNotifications(channelId, restore);
        const c = getTalkClient() as any;
        restore
          ? await c.enableChannelPushNotification?.({ channelId })
          : await c.disableChannelPushNotification?.({ channelId });
        setIsAlarmOn(restore);
      } catch {}
    } catch {
      setShowBottomSheet(false);
      showToast('차단 해제에 실패했어요.', 'EmojiNoEntry');
    } finally {
      setBlockBusy(false);
    }
  };

  const openLeaveModal = () => {
    setShowBottomSheet(false);
    setLeaveModal(true);
  };

  // 채팅방 나가기
  const handleLeave = async () => {
    if (!channelId) {
      setLeaveModal(false);
      showToast('채팅방 정보가 없어요.', 'EmojiDoor');
      return;
    }
    try {
      await postLeaveChannel(channelId);
      // 채팅방 나가기 이벤트 발생
      chatEventEmitter.emit(CHAT_EVENTS.CHANNEL_LEFT, channelId);
      setShowBottomSheet(false);
      showToast('채팅방을 나갔어요.', 'EmojiDoor');
      setTimeout(() => navigation.goBack(), 500);
    } catch {
      setShowBottomSheet(false);
      showToast('채팅방 나가기에 실패했어요.', 'EmojiDoor');
    }
  };

  const [failedSheetVisible, setFailedSheetVisible] = useState(false);
  const failedTargetRef = useRef<TPMessage | null>(null);

  // 다시 전송 하기
  const handleRetrySend = async () => {
    const m = failedTargetRef.current;
    setFailedSheetVisible(false);
    if (!m) return;
    const text = m.text || '';
    setMessagesList(prev => prev.map(x => (x.id === m.id ? { ...x, data: { ...(x.data || {}), failed: '0' } } : x)));
    try {
      await ensureOtherMemberInChannel();
      const resp = await sendTextMessage({ channelId, text });
      if (resp?.message) {
        setMessagesList(prev => prev.map(x => (x.id === m.id ? resp.message : x)));
        seenIdsRef.current.add(resp.message.id);
        markChannelRead(channelId);
      } else {
        setMessagesList(prev =>
          prev.map(x => (x.id === m.id ? { ...x, data: { ...(x.data || {}), failed: '1' } } : x)),
        );
        showToast('메시지 전송에 실패했어요.', 'EmojiNoEntry');
      }
    } catch (e) {
      setMessagesList(prev => prev.map(x => (x.id === m.id ? { ...x, data: { ...(x.data || {}), failed: '1' } } : x)));
      showToast('메시지 전송에 실패했어요.', 'EmojiNoEntry');
    } finally {
      failedTargetRef.current = null;
    }
  };

  // 보내기 취소
  const handleCancelSend = () => {
    const m = failedTargetRef.current;
    setFailedSheetVisible(false);
    if (!m) return;
    setMessagesList(prev => prev.filter(x => x.id !== m.id));
    failedTargetRef.current = null;
    showToast('메시지 보내기가 취소됐어요.', 'EmojiCrossmark');
  };

  const sheetItems = useMemo(
    () =>
      chatRoomSheetItems({
        alarmOn: isAlarmOn,
        blocked: isBlocked,
        actions: {
          showProfile: handleShowProfile,
          toggleAlarm: handleToggleAlarm,
          taggedMerchandiseList: () => {
            setShowBottomSheet(false);
            navigation.navigate('ChattingTaggedMerchandiseList', { channelId });
          },
          onBlock: () => {
            if (blockBusy) return;
            openBlockModal();
          },
          onUnblock: () => {
            if (blockBusy) return;
            handleUnblock();
          },
          onReport: async () => {
            setShowBottomSheet(false);
            await ensureChannelBoot({ name: profile?.name, mobileNumber: profile?.phone });
            openReport();
          },
          onLeave: openLeaveModal,
        },
      }),
    [isAlarmOn, isBlocked, channelId, targetUserId, blockBusy],
  );

  // + 버튼
  const handleOpenFile = async (url?: string) => {
    if (!url) {
      showToast('파일 URL이 없어요.', 'EmojiNoEntry');
      return;
    }
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else showToast('열 수 있는 앱이 없어요.', 'EmojiNoEntry');
    } catch (e) {
      console.log('[handleOpenFile] error', e);
      showToast('파일을 열 수 없어요.', 'EmojiNoEntry');
    }
  };

  // 파일 선택하기
  const handlePickFile = async () => {
    closeFileMenu();
    try {
      await ensureOtherMemberInChannel();
      const results = await pick({
        allowMultiSelection: true,
        presentationStyle: 'fullScreen',
        type: [DocTypes.allFiles],
        copyTo: 'cachesDirectory',
      });

      for (const it of results) {
        const uri = (it as any).fileCopyUri || it.uri;
        const name = it.name || 'file';
        const type = it.type || 'application/octet-stream';
        const size = (it as any).size;

        if (typeof size === 'number' && size > 15 * 1024 * 1024) {
          showToast('첨부파일 용량 초과 (15MB 이하)', 'EmojiSadface');
          continue;
        }

        const file = { uri, name, type, size };
        try {
          const { message } = await sendFileMessage({ channelId, file, data: { uiType: 'file' } });
          appendSent(message);
        } catch (e) {
          console.log('[handlePickFile] sendFileMessage error', e);
          showToast('파일 전송에 실패했어요.', 'EmojiNoEntry');
        }
      }
    } catch (e: any) {
      if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED) return;
      console.log('[handlePickFile] error', e);
      showToast('파일 선택 중 오류가 발생했어요.', 'EmojiNoEntry');
    }
  };

  // 사진/동영상 촬영하기(카메라 실행)
  const handlePickCamera = async () => {
    closeFileMenu();
    const options: CameraOptions = {
      mediaType: 'mixed',
      includeExtra: true,
      saveToPhotos: false,
      quality: 0.7,
      videoQuality: 'medium',
      durationLimit: 30,
    };

    try {
      await ensureOtherMemberInChannel();
      const res = await launchCamera(options);
      if (res.didCancel) return;

      const asset = res.assets?.[0];
      if (!asset) return;

      const file = await compressPickedAsset(asset);
      const { message } = await sendFileMessage({ channelId, file, data: { uiType: 'file' } });
      appendSent(message);
    } catch (e) {
      showToast('촬영 파일 전송에 실패했어요.', 'EmojiNoEntry');
      console.log('[handlePickCamera] error', e);
    }
  };

  // 앨범 선택하기
  const handlePickGallery = async () => {
    closeFileMenu();
    const options: ImageLibraryOptions = { mediaType: 'mixed', selectionLimit: 10, includeExtra: true };
    const res = await launchImageLibrary(options);
    if (res.didCancel) return;
    const assets = res.assets ?? [];
    if (assets.length === 0) return;

    await ensureOtherMemberInChannel();

    if (assets.length === 1) {
      try {
        const a = assets[0];
        const file = await compressPickedAsset(a);
        const { message } = await sendFileMessage({ channelId, file, data: { uiType: 'file' } });
        appendSent(message);
      } catch (e) {
        showToast('파일 전송에 실패했어요.', 'EmojiNoEntry');
        console.log('[handlePickGallery] sendFileMessage error', e);
      }
      return;
    }

    try {
      for (const a of assets) {
        const file = await compressPickedAsset(a);
        const { message } = await sendFileMessage({ channelId, file, data: { uiType: 'file' } });
        appendSent(message);
      }
    } catch (e) {
      showToast('파일 전송에 실패했어요.', 'EmojiNoEntry');
      console.log('[handlePickGallery multi] error', e);
    }
  };

  const handleChangeText = (text: string) => {
    setMessage(text);
    setCanSend(!!text.trim());
  };

  const makeLocalText = (text: string, opts?: { failed?: boolean }): TPMessage => ({
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    channelId: String(channelId),
    userId: String(profile?.userId ?? ''),
    type: 'text',
    text,
    createdAt: Date.now(),
    data: {
      uiType: 'text',
      local: '1',
      failed: opts?.failed ? '1' : '0',
    },
  });

  const sendingRef = useRef(false);
  const ensureInFlightRef = useRef<Promise<void> | null>(null);
  const lastEnsureAtRef = useRef<number>(0);

  const ensureOtherMemberInChannelSlim = useCallback(async () => {
    if (!channelId) return;
    if (!isOnlyMeInChannel()) return;
    const now = Date.now();
    if (now - lastEnsureAtRef.current < 10_000 && !isOnlyMeInChannel()) return;
    if (ensureInFlightRef.current) return ensureInFlightRef.current;

    ensureInFlightRef.current = (async () => {
      try {
        await refreshChannelMembers();
        if (!isOnlyMeInChannel()) return;
        if (originMemberRef.current == null) await refreshOriginMember();
        const originUserId = originMemberRef.current;
        if (originUserId == null) return;
        await addChannelMembers({ channelId, members: [originUserId] });
        await refreshChannelMembers();
        lastEnsureAtRef.current = Date.now();
      } finally {
        ensureInFlightRef.current = null;
      }
    })();

    return ensureInFlightRef.current;
  }, [channelId, isOnlyMeInChannel, refreshChannelMembers, refreshOriginMember]);

  // 메시지 보내기
  const handleSend = async () => {
    const raw = message;
    const textToSend = raw.trim();
    if (!channelId || !textToSend || sendingRef.current) return;

    if (isBlockedRef.current || isWithdrawnRef.current || isFrozenRef.current) {
      setMessage('');
      setCanSend(false);
      showToast('메시지를 보낼 수 없어요.', 'EmojiNoEntry');
      return;
    }

    sendingRef.current = true;
    setMessage('');
    setCanSend(false);

    const localMsg = makeLocalText(textToSend, { failed: false });
    setMessagesList(prev => [localMsg, ...prev]);
    requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));

    try {
      if (isOnlyMeInChannel()) await ensureOtherMemberInChannelSlim();
      const resp = await sendTextMessage({ channelId, text: textToSend });

      if (resp?.message) {
        setMessagesList(prev => prev.map(x => (x.id === localMsg.id ? resp.message : x)));
        seenIdsRef.current.add(resp.message.id);
        markChannelRead(channelId);
        // --- ADD: read probe start ---
        kickReadProbe();
        // --- ADD END ---
      } else {
        setMessagesList(prev =>
          prev.map(x => (x.id === localMsg.id ? { ...x, data: { ...(x.data || {}), failed: '1' } } : x)),
        );
        showToast('메시지 전송에 실패했어요.', 'EmojiNoEntry');
      }
    } catch (e) {
      setMessagesList(prev =>
        prev.map(x => (x.id === localMsg.id ? { ...x, data: { ...(x.data || {}), failed: '1' } } : x)),
      );
      showToast('메시지 전송에 실패했어요.', 'EmojiNoEntry');
      console.log('[handleSend] error', e);
    } finally {
      sendingRef.current = false;
    }
  };

  const lastReadMyMsgId = useMemo(
    () => computeLastReadMyMsgId(messagesList, otherLastReadAt, profile?.userId!),
    [messagesList, otherLastReadAt, profile?.userId],
  );

  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);

  const openImageViewer = (startIndex: number, images: string[]) => {
    if (!images || images.length === 0) return;
    setImageViewerImages(images);
    setImageViewerIndex(startIndex);
    setImageViewerVisible(true);
  };

  const openPost = useCallback(
    async (postId: number) => {
      try {
        await getPostDetail(postId);
        rootNavigation.navigate('ExploreStack', {
          screen: 'MerchandiseDetailPage',
          params: { id: postId },
        });
      } catch (error) {
        setNotFoundModal(true);
      }
    },
    [getPostDetail, rootNavigation],
  );

  const renderItem = ({ item, index }: { item: TPMessage; index: number }) => {
    const next = messagesList[index + 1];
    const showDateHeader = !next || !isSameDay(item.createdAt, next.createdAt);
    const isMe = String(item.userId) === myUserId;
    const prev = messagesList[index - 1];
    const shouldShowTime =
      !prev || String(prev?.userId) !== String(item.userId) || !isSameMinute(prev.createdAt, item.createdAt);

    const isPostCard = item.type === 'custom' &&
      item?.data?.kind === 'postCard' && {
        id: Number(item?.data?.postId),
        brandName: String(item?.data?.brandName),
        modelName: String(item?.data?.modelName),
        price: Number(item?.data?.price),
        thumbnail: String(item?.data?.thumbnail),
      };

    const isBackPostCard = item.type === 'text' &&
      item?.data?.messageType === 'postInfo' && {
        id: Number(item?.data?.postId),
        brandName: String(item?.data?.brandName),
        modelName: String(item?.data?.modelName),
        price: Number(item?.data?.price),
        thumbnail: String(item?.data?.imageUrl),
      };

    const imageGroupItems = parseImageGroupItems(item);
    const hasFile = isFileMessage(item);

    const read = isMe && !!lastReadMyMsgId && String(item.id) === String(lastReadMyMsgId);

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={{ ...semanticFont.label.xxxsmall, color: semanticColor.text.tertiary }}>
              {formatDateLabel(item.createdAt)}
            </Text>
          </View>
        )}
        {isPostCard ? null : isBackPostCard ? (
          <ChatModelBubble post={isBackPostCard} onPress={() => openPost(isBackPostCard.id)} />
        ) : imageGroupItems ? (
          <ChatFileBubble
            user={isMe ? 'me' : 'you'}
            profile={otherAvatar ?? item.profileImageUrl}
            file="image"
            time={shouldShowTime ? formatChatTime(item.createdAt) : undefined}
            photoItems={imageGroupItems}
            onOpenImage={openImageViewer}
            read={read}
          />
        ) : hasFile ? (
          (() => {
            const { url, name, sizeRaw, kind, thumb, mime } = extractAttachment(item);
            const sizeLabel = formatFileSize(sizeRaw);

            if (kind === 'image') {
              return (
                <ChatFileBubble
                  user={isMe ? 'me' : 'you'}
                  profile={otherAvatar ?? item.profileImageUrl}
                  file="image"
                  time={shouldShowTime ? formatChatTime(item.createdAt) : undefined}
                  thumbnail={url}
                  onOpenImage={openImageViewer}
                  read={read}
                />
              );
            }
            if (kind === 'video') {
              return (
                <ChatFileBubble
                  user={isMe ? 'me' : 'you'}
                  profile={otherAvatar ?? item.profileImageUrl}
                  file="video"
                  time={shouldShowTime ? formatChatTime(item.createdAt) : undefined}
                  thumbnail={thumb || url}
                  videoUrl={url}
                  fileUrl={url}
                  name={name}
                  sizeLabel={sizeLabel}
                  mime={mime}
                  onOpenVideo={(uri, t) => setVideoViewer({ visible: true, uri, thumb: t })}
                  read={read}
                />
              );
            }
            return (
              <ChatFileBubble
                user={isMe ? 'me' : 'you'}
                profile={otherAvatar ?? item.profileImageUrl}
                file="other"
                time={shouldShowTime ? formatChatTime(item.createdAt) : undefined}
                name={name}
                sizeLabel={sizeLabel}
                fileUrl={url}
                mime={mime}
                onOpenFile={u => handleOpenFile(u)}
                read={read}
              />
            );
          })()
        ) : (
          (() => {
            const isFailed = String((item.data || {}).failed) === '1';
            const bubble = (
              <ChatTextBubble
                user={isMe ? 'me' : 'you'}
                profile={otherAvatar ?? item.profileImageUrl}
                text={item.text!}
                time={shouldShowTime ? formatChatTime(item.createdAt) : undefined}
                read={read}
                isFailed={isMe && isFailed}
              />
            );

            if (isMe && isFailed) {
              return (
                <Pressable
                  onPress={() => {
                    failedTargetRef.current = item;
                    setFailedSheetVisible(true);
                  }}
                  hitSlop={8}>
                  {bubble}
                </Pressable>
              );
            }
            return bubble;
          })()
        )}
      </View>
    );
  };

  const [atBottom, setAtBottom] = useState(true);
  const atBottomRef = useRef(true);
  useEffect(() => {
    atBottomRef.current = atBottom;
  }, [atBottom]);

  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollBtnAnim = useRef(new Animated.Value(0)).current;

  const setScrollButtonVisible = (visible: boolean) => {
    if (visible === showScrollButton) return;
    setShowScrollButton(visible);
    Animated.timing(scrollBtnAnim, { toValue: visible ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  };

  const SCROLL_BOTTOM_THRESHOLD = 16;
  const handleScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const nearBottom = y <= SCROLL_BOTTOM_THRESHOLD;
    if (nearBottom !== atBottom) {
      setAtBottom(nearBottom);
      if (nearBottom) {
        setScrollButtonVisible(false);
        if (showNewMessageButton) hideNewButton();
      }
    }
  };

  const plusRotate = useRef(new Animated.Value(0)).current;

  const openFileMenu = () => {
    if (fileMenuVisible) return;
    if (blockBusy) return;
    if (isBlockedRef.current || isWithdrawnRef.current || isFrozenRef.current) return;
    setFileMenuVisible(true);
    Animated.timing(plusRotate, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const closeFileMenu = () => {
    if (!fileMenuVisible) return;
    setFileMenuVisible(false);
    Animated.timing(plusRotate, {
      toValue: 0,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const rotateDeg = plusRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  const inputPlaceholder = isWithdrawn
    ? '탈퇴한 유저'
    : isBlocked
    ? '내가 차단한 사용자'
    : isFrozen
    ? '메시지를 보낼 수 없습니다.'
    : '메시지 보내기';

  // --- ADD: refs & helpers for read probe ---
  const otherLastReadAtRef = useRef<number | null>(null);
  useEffect(() => {
    otherLastReadAtRef.current = otherLastReadAt;
  }, [otherLastReadAt]);

  const latestMyMsgAt = useMemo(() => {
    const m = messagesList.find(m => String(m.userId) === myUserId);
    return m ? toMs(m.createdAt) : 0;
  }, [messagesList, myUserId]);

  const readProbeRef = useRef<{ stop: () => void } | null>(null);
  const kickReadProbe = useCallback(
    (durationMs = 10_000, intervalMs = 1200) => {
      readProbeRef.current?.stop?.();
      let active = true;
      const stop = () => {
        active = false;
      };
      readProbeRef.current = { stop };

      const target = latestMyMsgAt;

      const tick = async () => {
        if (!active) return;
        try {
          if (atBottomRef.current) {
            await refreshChannelMembers();
            if ((otherLastReadAtRef.current ?? 0) >= target) {
              stop();
              return;
            }
          }
        } catch {}
        setTimeout(tick, intervalMs);
      };

      setTimeout(() => stop(), durationMs);
      tick();
    },
    [latestMyMsgAt, refreshChannelMembers],
  );

  useFocusEffect(
    useCallback(() => {
      let stopped = false;
      const loop = async () => {
        if (stopped) return;
        try {
          if (atBottomRef.current) await refreshChannelMembers();
        } finally {
          if (!stopped) setTimeout(loop, 5000);
        }
      };
      loop();
      return () => {
        stopped = true;
      };
    }, [refreshChannelMembers]),
  );
  // --- ADD END ---

  return (
    <SafeAreaView style={styles.chattingRoomPage}>
      <ButtonTitleHeader
        title={isWithdrawn ? '(탈퇴한 유저)' : nickname}
        leftChilds={{
          icon: (
            <IconChevronLeft
              width={28}
              height={28}
              stroke={semanticColor.icon.primary}
              strokeWidth={semanticNumber.stroke.bold}
            />
          ),
          onPress: () => navigation.goBack(),
        }}
        rightChilds={[
          {
            icon: (
              <IconDotsVertical
                width={28}
                height={28}
                stroke={semanticColor.icon.primary}
                strokeWidth={semanticNumber.stroke.bold}
              />
            ),
            onPress: () => setShowBottomSheet(true),
          },
        ]}
      />
      <View style={{ flex: 1, paddingBottom: imeH + semanticNumber.spacing[2] }}>
        <FlatList
          ref={listRef}
          style={styles.contentsContainer}
          data={messagesList}
          extraData={{ otherAvatar, lastReadMyMsgId }}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          inverted
          onEndReachedThreshold={0.2}
          onEndReached={loadMore}
          ListFooterComponent={loading && hasNext ? <View style={{ height: 36 }} /> : null}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          maintainVisibleContentPosition={{ minIndexForVisible: 1, autoscrollToTopThreshold: 0 }}
        />

        {showNewMessageButton && (
          <TouchableOpacity style={styles.newMessageField} onPress={scrollToBottom}>
            <Text style={styles.newMessageText}>새로운 메시지</Text>
            <IconChevronDown
              width={20}
              height={20}
              stroke={semanticColor.icon.brandOnDark}
              strokeWidth={semanticNumber.stroke.medium}
            />
          </TouchableOpacity>
        )}

        <View style={styles.sendMessageField}>
          <TouchableOpacity
            style={styles.chatItemButtonWrapper}
            onPress={fileMenuVisible ? closeFileMenu : openFileMenu}
            activeOpacity={1}>
            <Animated.View style={{ transform: [{ rotate: rotateDeg }] }}>
              <IconPlus
                width={28}
                height={28}
                stroke={semanticColor.icon.primary}
                strokeWidth={semanticNumber.stroke.bold}
              />
            </Animated.View>
          </TouchableOpacity>

          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.textInputStyle}
              placeholder={inputPlaceholder}
              placeholderTextColor={semanticColor.text.lightest}
              value={message}
              onChangeText={handleChangeText}
              multiline
              editable={!(isWithdrawn || isBlocked || isFrozen)}
              showSoftInputOnFocus={!(isWithdrawn || isBlocked || isFrozen)}
              selectTextOnFocus={!(isWithdrawn || isBlocked || isFrozen)}
              textContentType="none"
              {...(Platform.OS === 'android' && {
                autoCorrect: false,
                autoComplete: 'off',
              })}
            />
          </View>

          <Pressable
            style={[styles.sendButtonTouchField]}
            disabled={!canSend || isFrozen || blockBusy || sendingRef.current}
            onPress={handleSend}>
            <View
              style={[
                styles.sendButtonWrapper,
                !isBlockedRef.current && !isWithdrawnRef.current && !isFrozenRef.current && !blockBusy && canSend
                  ? { backgroundColor: semanticColor.button.mainEnabled }
                  : { backgroundColor: semanticColor.button.mainDisabled },
              ]}>
              <IconSend
                width={24}
                height={24}
                stroke={semanticColor.icon.primaryOnDark}
                strokeWidth={semanticNumber.stroke.bold}
              />
            </View>
          </Pressable>
        </View>
      </View>

      <ChatFileMenu
        visible={fileMenuVisible}
        onClose={closeFileMenu}
        onPickFile={handlePickFile}
        onPickCamera={handlePickCamera}
        onPickGallery={handlePickGallery}
        bottom={imeH + 64 + insets.bottom}
        overlayBottom={imeH + 55 + insets.bottom}
      />

      <ChatImageViewer
        visible={imageViewerVisible}
        images={imageViewerImages}
        index={imageViewerIndex}
        onClose={() => setImageViewerVisible(false)}
        onIndexChange={setImageViewerIndex}
      />

      <VideoViewer
        visible={videoViewer.visible}
        uri={videoViewer.uri}
        thumb={videoViewer.thumb}
        onClose={() => setVideoViewer({ visible: false })}
      />

      <ActionBottomSheet
        items={sheetItems}
        onClose={() => setShowBottomSheet(false)}
        visible={showBottomSheet}
        isSafeArea
      />

      <ActionBottomSheet
        items={chatRoomChatErrorItems({ retry: handleRetrySend, cancel: handleCancelSend })}
        onClose={() => {
          setFailedSheetVisible(false);
          failedTargetRef.current = null;
        }}
        visible={failedSheetVisible}
        isSafeArea
      />

      {/* 로컬 Toast 제거: GlobalToast(App.tsx)에서 전역 렌더링됨 */}

      <Modal
        mainButtonText="나가기"
        onClose={() => setLeaveModal(false)}
        onMainPress={handleLeave}
        titleText="채팅방에서 나가시겠어요?"
        visible={leaveModal}
        buttonTheme="critical"
        descriptionText="채팅방을 나가면 채팅 목록 및 대화 내용이 삭제되고 복구할 수 없어요."
        isRow
        titleIcon={<EmojiNoEntry width={24} height={24} />}
      />
      <Modal
        mainButtonText="차단하기"
        onClose={() => setBlockModal(false)}
        onMainPress={handleBlock}
        titleText="상대방을 차단하시겠어요?"
        visible={blockModal}
        buttonTheme="critical"
        descriptionText="차단하면 상대방과 예약 중이던 거래가 종료되고, 서로의 게시글을 확인하거나 채팅을 할 수 없어요."
        isRow
        titleIcon={<EmojiNoEntry width={24} height={24} />}
      />
      <Modal
        mainButtonText="확인"
        onClose={() => setWithdrawnModal(false)}
        onMainPress={() => setWithdrawnModal(false)}
        titleText="탈퇴한 유저입니다."
        visible={withdrawnModal}
        isSingle
        noDescription
        titleIcon={<EmojiNoEntry width={24} height={24} />}
      />
      <Modal
        mainButtonText="확인"
        onClose={() => setNotFoundModal(false)}
        onMainPress={() => setNotFoundModal(false)}
        titleText="삭제/숨김 처리된 게시글입니다."
        visible={notFoundModal}
        isSingle
        noDescription
        titleIcon={<EmojiNoEntry width={24} height={24} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  chattingRoomPage: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  contentsContainer: {
    flex: 1,
  },
  chatItemButtonWrapper: {
    width: 44,
    height: 52,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  dateHeader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: semanticNumber.spacing[8],
    paddingBottom: semanticNumber.spacing[12],
  },
  newMessageField: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: semanticNumber.spacing[10],
    backgroundColor: semanticColor.surface.alphaBlackStrong,
    borderTopLeftRadius: semanticNumber.borderRadius.lg,
    borderTopRightRadius: semanticNumber.borderRadius.lg,
  },
  sendMessageField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: semanticNumber.spacing[4],
    borderTopColor: semanticColor.border.medium,
    borderTopWidth: semanticNumber.stroke.hairline,
  },
  textInputWrapper: {
    flex: 1,
    paddingVertical: semanticNumber.spacing[7],
  },
  textInputStyle: {
    minHeight: 38,
    maxHeight: 148,
    paddingHorizontal: semanticNumber.spacing[12],
    paddingVertical: semanticNumber.spacing[10],
    borderRadius: semanticNumber.borderRadius.lg,
    backgroundColor: semanticColor.surface.lightGray,
    fontFamily: fonts.family.regular,
    fontSize: fonts.size.MD,
  },
  sendButtonTouchField: {
    width: 58,
    paddingVertical: semanticNumber.spacing[5],
  },
  sendButtonWrapper: {
    minHeight: 42,
    maxHeight: 162,
    width: 42,
    borderRadius: semanticNumber.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: semanticNumber.spacing[16],
  },
  newMessageText: {
    ...semanticFont.body.small,
    color: semanticColor.text.brandOnDark,
  },
});

export default ChattingRoomPage;
