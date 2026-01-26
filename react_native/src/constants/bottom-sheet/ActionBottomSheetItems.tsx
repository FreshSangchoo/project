import IconCircleCheck from '@/assets/icons/IconCircleCheck.svg';
import IconActivity from '@/assets/icons/IconActivity.svg';
import IconBallPen from '@/assets/icons/IconBallpen.svg';
import IconArrowBigUp from '@/assets/icons/IconArrowBigUp.svg';
import IconEyeOff from '@/assets/icons/IconEyeOff.svg';
import IconTrash from '@/assets/icons/IconTrash.svg';
import IconBook from '@/assets/icons/IconBook.svg';
import IconEye from '@/assets/icons/IconEye.svg';
import IconUrgent from '@/assets/icons/IconUrgent.svg';
import IconUser from '@/assets/icons/IconUser.svg';
import IconBell from '@/assets/icons/IconBell.svg';
import IconBellOff from '@/assets/icons/IconBellOff.svg';
import IconArticle from '@/assets/icons/IconArticle.svg';
import IconCircleMinus from '@/assets/icons/IconCircleMinus.svg';
import IconReload from '@/assets/icons/IconReload.svg';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { ActionItem } from '@/components/common/bottom-sheet/ActionBottomSheet';

export interface PressAction {
  setSoldOut: () => void;
  setOnSale: () => void;
  setReserved: () => void;
  edit: () => void;
  bump: () => void;
  hide: () => void;
  remove: () => void;
}

export interface ChatRoomActions {
  showProfile: () => void;
  toggleAlarm: () => void;
  taggedMerchandiseList: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onReport: () => void;
  onLeave: () => void;
}

export interface ChatErrorActions {
  retry: () => void;
  cancel: () => void;
}

export interface ReportAction {
  report: () => void;
}

export const merchandiseDetailReservedItems = (press: PressAction): ActionItem[] => [
  {
    itemImage: (
      <IconCircleCheck
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '판매 완료로 변경',
    onPress: press.setSoldOut,
  },
  {
    itemImage: (
      <IconActivity
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '판매 중으로 변경',
    onPress: press.setOnSale,
  },
  {
    itemImage: (
      <IconBallPen
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '게시글 수정',
    onPress: press.edit,
  },
  {
    itemImage: (
      <IconArrowBigUp
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '끌어올리기',
    onPress: press.bump,
  },
  {
    itemImage: (
      <IconEyeOff
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '숨기기',
    onPress: press.hide,
  },
  {
    itemImage: (
      <IconTrash
        width={20}
        height={20}
        stroke={semanticColor.icon.critical}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '게시글 삭제',
    itemNameStyle: 'critical',
    onPress: press.remove,
  },
];

export const merchandiseDetailSellingItems = (press: PressAction): ActionItem[] => [
  {
    itemImage: (
      <IconCircleCheck
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '판매 완료로 변경',
    onPress: press.setSoldOut,
  },
  {
    itemImage: (
      <IconBook
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '예약 중으로 변경',
    onPress: press.setReserved,
  },
  {
    itemImage: (
      <IconBallPen
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '게시글 수정',
    onPress: press.edit,
  },
  {
    itemImage: (
      <IconArrowBigUp
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '끌어올리기',
    onPress: press.bump,
  },
  {
    itemImage: (
      <IconEyeOff
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '숨기기',
    onPress: press.hide,
  },
  {
    itemImage: (
      <IconTrash
        width={20}
        height={20}
        stroke={semanticColor.icon.critical}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '게시글 삭제',
    itemNameStyle: 'critical',
    onPress: press.remove,
  },
];

export const merchandiseDetailCompletedItems = (press: PressAction): ActionItem[] => [
  {
    itemImage: (
      <IconActivity
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '판매 중으로 변경',
    onPress: press.setOnSale,
  },
  {
    itemImage: (
      <IconBook
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '예약 중으로 변경',
    onPress: press.setReserved,
  },
  {
    itemImage: (
      <IconBallPen
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '게시글 수정',
    onPress: press.edit,
  },
  {
    itemImage: (
      <IconArrowBigUp
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '끌어올리기',
    onPress: press.bump,
  },
  {
    itemImage: (
      <IconEyeOff
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '숨기기',
    onPress: press.hide,
  },
  {
    itemImage: (
      <IconTrash
        width={20}
        height={20}
        stroke={semanticColor.icon.critical}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '게시글 삭제',
    itemNameStyle: 'critical',
    onPress: press.remove,
  },
];

export const myHiddenItems = (press: PressAction): ActionItem[] => [
  {
    itemImage: (
      <IconEye
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '숨기기 해제',
    onPress: press.hide,
  },
  {
    itemImage: (
      <IconBallPen
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '게시글 수정',
    onPress: press.edit,
  },
  {
    itemImage: (
      <IconTrash
        width={20}
        height={20}
        stroke={semanticColor.icon.critical}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '게시글 삭제',
    itemNameStyle: 'critical',
    onPress: press.remove,
  },
];

export const merchandiseDetailReportOnlyItems = (press: ReportAction): ActionItem[] => [
  {
    itemImage: (
      <IconUrgent
        width={20}
        height={20}
        stroke={semanticColor.icon.critical}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '신고하기',
    itemNameStyle: 'critical',
    onPress: press.report,
  },
];

export const chatRoomSheetItems = (options: {
  alarmOn: boolean;
  blocked: boolean;
  actions: ChatRoomActions;
}): ActionItem[] => {
  const { alarmOn, blocked, actions } = options;

  const items: ActionItem[] = [
    {
      itemImage: (
        <IconUser
          width={20}
          height={20}
          stroke={semanticColor.icon.secondary}
          strokeWidth={semanticNumber.stroke.medium}
        />
      ),
      itemName: '프로필 보기',
      onPress: actions.showProfile,
    },
    {
      itemImage: alarmOn ? (
        <IconBellOff
          width={20}
          height={20}
          stroke={semanticColor.icon.secondary}
          strokeWidth={semanticNumber.stroke.medium}
        />
      ) : (
        <IconBell
          width={20}
          height={20}
          stroke={semanticColor.icon.secondary}
          strokeWidth={semanticNumber.stroke.medium}
        />
      ),
      itemName: alarmOn ? '알림 끄기' : '알림 켜기',
      onPress: actions.toggleAlarm,
    },
    {
      itemImage: (
        <IconArticle
          width={20}
          height={20}
          stroke={semanticColor.icon.secondary}
          strokeWidth={semanticNumber.stroke.medium}
        />
      ),
      itemName: '문의 매물 내역',
      onPress: actions.taggedMerchandiseList,
    },
    blocked
      ? {
          itemImage: (
            <IconCircleMinus
              width={20}
              height={20}
              stroke={semanticColor.icon.critical}
              strokeWidth={semanticNumber.stroke.medium}
            />
          ),
          itemName: '차단 해제 하기',
          itemNameStyle: 'critical',
          onPress: actions.onUnblock,
        }
      : {
          itemImage: (
            <IconCircleMinus
              width={20}
              height={20}
              stroke={semanticColor.icon.critical}
              strokeWidth={semanticNumber.stroke.medium}
            />
          ),
          itemName: '차단하기',
          itemNameStyle: 'critical',
          onPress: actions.onBlock,
        },
    {
      itemImage: (
        <IconUrgent
          width={20}
          height={20}
          stroke={semanticColor.icon.critical}
          strokeWidth={semanticNumber.stroke.medium}
        />
      ),
      itemName: '신고하기',
      itemNameStyle: 'critical',
      onPress: actions.onReport,
    },
    {
      itemImage: (
        <IconTrash
          width={20}
          height={20}
          stroke={semanticColor.icon.critical}
          strokeWidth={semanticNumber.stroke.medium}
        />
      ),
      itemName: '채팅방 나가기',
      itemNameStyle: 'critical',
      onPress: actions.onLeave,
    },
  ];

  return items;
};

export const chatRoomChatErrorItems = (actions: ChatErrorActions): ActionItem[] => [
  {
    itemImage: (
      <IconReload
        width={20}
        height={20}
        stroke={semanticColor.icon.secondary}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '다시 전송 하기',
    onPress: actions.retry,
  },
  {
    itemImage: (
      <IconTrash
        width={20}
        height={20}
        stroke={semanticColor.icon.critical}
        strokeWidth={semanticNumber.stroke.medium}
      />
    ),
    itemName: '보내기 취소',
    itemNameStyle: 'critical',
    onPress: actions.cancel,
  },
];

export const uploadConditionItems: ActionItem[] = [
  {
    itemName: '신품',
    onPress: () => {},
    isBottomSheet: true,
  },
  {
    itemName: '매우 양호',
    onPress: () => {},
    isBottomSheet: true,
  },
  {
    itemName: '양호',
    onPress: () => {},
    isBottomSheet: true,
  },
  {
    itemName: '보통',
    onPress: () => {},
    isBottomSheet: true,
  },
  {
    itemName: '하자/고장',
    onPress: () => {},
    isBottomSheet: true,
  },
];
