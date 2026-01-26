import React, { useState } from 'react';
import { getTimeAgo } from './util/getTimeAgo';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import IconTicket from '@/assets/icons/IconTicket.svg';
import IconConfetti from '@/assets/icons/IconConfetti.svg';
import IconSpeakerphone from '@/assets/icons/IconSpeakerphone.svg';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import { semanticColor } from '@/styles/semantic-color';
import type { NotificationContentProps } from '@/hooks/apis/useNotificationsApi';
import { CategoryKey } from '@/pages/notification/constant/notification';

interface NotificationContentPropsWithPress extends NotificationContentProps {
  onPress?: () => void;
}

const NotificationContent = ({ category, title, body, sentAt, read, onPress }: NotificationContentPropsWithPress) => {
  const [isRead, setIsRead] = useState(read);
  const handlePress = () => {
    setIsRead(true);
    onPress?.();
  };
  const renderImage = ({ category }: { category: CategoryKey }) => {
    switch (category) {
      case 'WELCOME':
        return <IconConfetti width={20} height={20} stroke={semanticColor.icon.secondary} strokeWidth={2} />;
      case 'MARKETING':
        return <IconTicket width={20} height={20} stroke={semanticColor.icon.secondary} strokeWidth={2} />;
      case 'ANNOUNCEMENT':
        return <IconSpeakerphone width={20} height={20} stroke={semanticColor.icon.secondary} strokeWidth={2} />;
      default:
        return null;
    }
  };

  const categoryToKorean = (engCategory: CategoryKey) => {
    switch (engCategory) {
      case 'WELCOME':
        return '가입 축하';
      case 'ANNOUNCEMENT':
        return '공지사항';
      case 'MARKETING':
        return '이벤트·광고';
      default:
        return '알림';
    }
  };

  return (
    <TouchableOpacity style={isRead ? styles.container : styles.isReadContainer} onPress={handlePress}>
      <View style={styles.topContainer}>
        <View style={styles.iconContainer}>
          {renderImage({ category })}
          <Text style={styles.typeText}>{categoryToKorean(category)}</Text>
        </View>
        <View style={styles.readContainer}>
          {!isRead && <View style={styles.readIndicator} />}
          <Text style={styles.timeText}>{getTimeAgo(sentAt)}</Text>
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.messageText}>{body}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: semanticNumber.spacing[12],
    paddingHorizontal: semanticNumber.spacing[16],
    alignItems: 'flex-start',
    rowGap: semanticNumber.spacing[8],
  },
  isReadContainer: {
    paddingVertical: semanticNumber.spacing[12],
    paddingHorizontal: semanticNumber.spacing[16],
    alignItems: 'flex-start',
    rowGap: semanticNumber.spacing[8],
    backgroundColor: semanticColor.surface.lightGray,
  },
  topContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: semanticNumber.spacing[12],
  },
  readContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: semanticNumber.spacing[4],
  },
  readIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: semanticColor.icon.readIndicator,
  },
  bottomContainer: {
    paddingLeft: semanticNumber.spacing[32],
    alignItems: 'flex-start',
    rowGap: semanticNumber.spacing[4],
  },
  typeText: {
    ...semanticFont.label.xxsmall,
    color: semanticColor.notification.neutral600,
  },
  timeText: {
    ...semanticFont.label.xxsmall,
    color: semanticColor.notification.neutral400,
  },
  titleText: {
    ...semanticFont.title.small,
    color: semanticColor.notification.neutral900,
  },
  messageText: {
    ...semanticFont.body.medium,
    color: semanticColor.notification.neutral700,
  },
});
export default NotificationContent;
