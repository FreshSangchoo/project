import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { Image, StyleSheet, Text, View } from 'react-native';
import IconCheck from '@/assets/icons/IconCheck.svg';
import IconAlertCircle from '@/assets/icons/IconAlertCircle.svg';

type MessageUser = 'me' | 'you';

interface ChatTextBubbleProps {
  user: MessageUser;
  profile?: string;
  text: string;
  time?: string;
  read?: boolean;
  isFailed?: boolean;
}

function ChatTextBubble({ user, profile, text, time, read, isFailed }: ChatTextBubbleProps) {
  return (
    <View style={[styles.container, { flexDirection: user === 'me' ? 'row' : 'row-reverse' }]}>
      {isFailed ? (
        <View style={styles.failedWrapper}>
          <IconAlertCircle
            width={16}
            height={16}
            stroke={semanticColor.icon.critical}
            strokeWidth={semanticNumber.stroke.bold}
          />
          <Text style={styles.failedText}>전송 실패</Text>
        </View>
      ) : (
        <View style={styles.timeWrapper}>
          {user === 'me' && read && (
            <IconCheck
              width={16}
              height={16}
              stroke={semanticColor.icon.secondary}
              strokeWidth={semanticNumber.stroke.bold}
            />
          )}
          <Text style={styles.timeText}>{time}</Text>
        </View>
      )}
      <View
        style={[
          styles.messageWrapper,
          user === 'me'
            ? {
                backgroundColor: isFailed ? semanticColor.chat.bubbleYouDisabled : semanticColor.chat.bubbleYou,
                maxWidth: 280,
              }
            : {
                backgroundColor: semanticColor.chat.bubbleUser,
                maxWidth: 240,
              },
        ]}>
        <Text
          style={[
            styles.messageText,
            { color: user === 'me' ? semanticColor.text.primaryOnDark : semanticColor.text.primary },
          ]}>
          {text}
        </Text>
      </View>
      {user === 'you' && (
        <View style={styles.imageWrapper}>
          {time ? <Image source={{ uri: profile }} style={styles.image} /> : <View style={{ width: 32, height: 32 }} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[8],
    justifyContent: 'flex-end',
    gap: semanticNumber.spacing[8],
  },
  imageWrapper: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  image: {
    width: 32,
    height: 32,
    borderRadius: semanticNumber.borderRadius.full,
  },
  failedWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: semanticNumber.spacing[2],
  },
  failedText: {
    ...semanticFont.caption.small,
    color: semanticColor.text.critical,
  },
  timeWrapper: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  timeText: {
    ...semanticFont.caption.small,
    color: semanticColor.text.lightest,
  },
  messageWrapper: {
    paddingHorizontal: semanticNumber.spacing[12],
    paddingVertical: semanticNumber.spacing[8],
    borderRadius: semanticNumber.borderRadius.xl,
  },
  messageText: {
    ...semanticFont.body.large,
  },
});

export default ChatTextBubble;
