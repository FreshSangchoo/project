import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { Pressable, StyleSheet, Text, TouchableOpacity, Animated, View, Image } from 'react-native';
import IconBell from '@/assets/icons/IconBell.svg';
import IconBellOff from '@/assets/icons/IconBellOff.svg';
import IconTrash from '@/assets/icons/IconTrash.svg';
import { useEffect, useRef, useState } from 'react';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Modal from '@/components/common/modal/Modal';
import EmojiNoEntry from '@/assets/icons/EmojiNoEntry.svg';
import { TapGestureHandler } from 'react-native-gesture-handler';

export interface ChatListItemProps {
  channelId: string;
  profileImage: string;
  nickname: string;
  lastChat: string;
  lastMessageTime: string;
  unreadCount: number;
  isAlarmOn: boolean;
  onPress: () => void;
  onToggleAlarm?: (channelId: string, next: boolean) => Promise<void> | void;
  onLeave?: (channelId: string) => Promise<void> | void;
  openedSwipeRef?: React.RefObject<Swipeable | null>;
  isSwipeOpen?: boolean;
  setIsSwipeOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  onSwipeableWillOpen?: (ref: Swipeable) => void;
  showToast?: (message: string, image?: 'EmojiBell' | 'EmojiDoor') => void;
}

function ChatListItem({
  channelId,
  profileImage,
  nickname,
  lastChat,
  lastMessageTime,
  unreadCount,
  isAlarmOn,
  onPress,
  onToggleAlarm,
  onLeave,
  openedSwipeRef,
  isSwipeOpen,
  setIsSwipeOpen,
  onSwipeableWillOpen,
  showToast,
}: ChatListItemProps) {
  const swipeRef = useRef<Swipeable>(null);
  const tapRef = useRef<TapGestureHandler>(null);
  const [isDeleteModalOn, setIsDeleteModalOn] = useState(false);
  const [alarm, setAlarm] = useState(isAlarmOn);

  useEffect(() => setAlarm(isAlarmOn), [isAlarmOn]);

  const handleTap = () => {
    handleOnPress();
  };

  const handleChatRoomAlarm = async () => {
    const next = !alarm;
    setAlarm(next);

    try {
      await onToggleAlarm?.(channelId, next);
      showToast?.(next ? '채팅방 알림을 켰어요.' : '채팅방 알림을 껐어요.', 'EmojiBell');
    } catch {
      setAlarm(!next);
      showToast?.('알림 설정 변경에 실패했어요.', 'EmojiBell');
    } finally {
      setIsSwipeOpen?.(false);
      swipeRef.current?.close();
    }
  };

  const handleLeave = async () => {
    try {
      await onLeave?.(channelId);
    } finally {
      setIsDeleteModalOn(false);
      setIsSwipeOpen?.(false);
      swipeRef.current?.close();
    }
  };

  const rightActions = (
    _progress: Animated.AnimatedInterpolation<string | number>,
    _dragAnimatedValue: Animated.AnimatedInterpolation<string | number>,
  ) => {
    return (
      <View style={styles.rightActionContainer}>
        <View style={styles.rightButtonsWrapper}>
          <TouchableOpacity style={styles.setAlarmButton} onPress={handleChatRoomAlarm}>
            {alarm ? (
              <IconBell
                width={28}
                height={28}
                stroke={semanticColor.icon.tertiary}
                strokeWidth={semanticNumber.stroke.bold}
              />
            ) : (
              <IconBellOff
                width={28}
                height={28}
                stroke={semanticColor.icon.tertiary}
                strokeWidth={semanticNumber.stroke.bold}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteChatButton}
            onPress={() => {
              setIsDeleteModalOn(true);
            }}>
            <IconTrash
              width={28}
              height={28}
              stroke={semanticColor.icon.primaryOnDark}
              strokeWidth={semanticNumber.stroke.bold}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleOnPress = () => {
    const opened = openedSwipeRef?.current;
    const mine = swipeRef.current;

    if (opened && mine && opened !== mine && isSwipeOpen) {
      opened.close();
      setIsSwipeOpen!(false);
      return;
    }

    onPress();
  };

  return (
    <Swipeable
      ref={swipeRef}
      onSwipeableWillOpen={() => {
        if (onSwipeableWillOpen && swipeRef.current) {
          onSwipeableWillOpen(swipeRef.current);
        }
      }}
      friction={1}
      renderRightActions={rightActions}>
      <TapGestureHandler ref={tapRef} waitFor={swipeRef} onEnded={handleTap}>
        <View>
          <Pressable style={styles.chatListItem} onPress={handleOnPress}>
            <View style={styles.profileImageWrapper}>
              <Image
                source={{ uri: profileImage }}
                width={48}
                height={48}
                style={{ borderRadius: semanticNumber.borderRadius.full }}
              />
            </View>
            <View style={styles.textWrapper}>
              <View style={styles.chatTitle}>
                <Text style={styles.nicknameText}>{nickname}</Text>
                {!isAlarmOn && (
                  <IconBellOff
                    width={16}
                    height={16}
                    stroke={semanticColor.icon.tertiary}
                    strokeWidth={semanticNumber.stroke.light}
                  />
                )}
              </View>
              <Text style={styles.lastChatText} lineBreakMode="tail" ellipsizeMode="tail" numberOfLines={1}>
                {lastChat}
              </Text>
            </View>
            <View style={styles.chattingRoomStateWrapper}>
              <Text style={styles.lastMessageTime}>{lastMessageTime}</Text>
              {Number(unreadCount) === 0 ? (
                <View />
              ) : Number(unreadCount) < 10 ? (
                <View style={styles.unreadCountUnderTen}>
                  <Text style={styles.unreadMessageCountText}>{unreadCount}</Text>
                </View>
              ) : (
                <View style={styles.unreadCountOverTen}>
                  <Text style={styles.unreadMessageCountText}>10+</Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>
      </TapGestureHandler>
      {isDeleteModalOn && (
        <Modal
          titleIcon={<EmojiNoEntry width={24} height={24} />}
          titleText="채팅방에서 나가시겠어요?"
          descriptionText="채팅방을 나가면 채팅 목록 및 대화 내용이 삭제되고 복구할 수 없어요."
          mainButtonText="나가기"
          subButtonText="취소"
          buttonTheme="critical"
          onClose={() => setIsDeleteModalOn(false)}
          onMainPress={() => handleLeave()}
          visible
          isRow
        />
      )}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  chatListItem: {
    flexDirection: 'row',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[12],
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: semanticColor.surface.white,
  },
  profileImageWrapper: {
    width: 48,
    height: 48,
    marginRight: semanticNumber.spacing[12],
  },
  mockProfileImage: {
    width: 48,
    height: 48,
    backgroundColor: semanticColor.surface.lightGray,
    borderRadius: semanticNumber.borderRadius.full,
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: semanticNumber.spacing[4],
  },
  chatTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[2],
  },
  nicknameText: {
    ...semanticFont.label.medium,
    color: semanticColor.text.primary,
  },
  lastChatText: {
    ...semanticFont.body.small,
    color: semanticColor.text.tertiary,
  },
  chattingRoomStateWrapper: {
    alignItems: 'flex-end',
    gap: semanticNumber.spacing[4],
  },
  lastMessageTime: {
    ...semanticFont.caption.small,
    color: semanticColor.text.lightest,
  },
  unreadCountUnderTen: {
    width: 16,
    height: 16,
    borderRadius: semanticNumber.borderRadius.full,
    backgroundColor: semanticColor.surface.critical,
    paddingHorizontal: semanticNumber.spacing[4],
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCountOverTen: {
    width: 27,
    height: 16,
    borderRadius: semanticNumber.borderRadius.full,
    backgroundColor: semanticColor.surface.critical,
    paddingHorizontal: semanticNumber.spacing[4],
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadMessageCountText: {
    ...semanticFont.caption.smallStrong,
    color: semanticColor.text.primaryOnDark,
  },
  rightActionContainer: {
    alignItems: 'flex-end',
  },
  rightButtonsWrapper: {
    flexDirection: 'row',
  },
  setAlarmButton: {
    width: 72,
    height: 72,
    paddingHorizontal: semanticNumber.spacing[18],
    paddingVertical: 17,
    backgroundColor: semanticColor.surface.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteChatButton: {
    width: 72,
    height: 72,
    paddingHorizontal: semanticNumber.spacing[18],
    paddingVertical: 17,
    backgroundColor: semanticColor.surface.critical,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatListItem;
