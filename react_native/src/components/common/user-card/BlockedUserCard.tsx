import { fonts } from '@/styles/fonts';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { Image, StyleSheet, Text, View } from 'react-native';
import VariantButton from '@/components/common/button/VariantButton';

export interface BlockedUserCardProps {
  profileImage: string | null;
  nickname: string;
  userId: string;
  blockedUserDate: string;
  onPress?: () => void;
  isBlocked: boolean;
  isBlocking?: boolean;
}

function BlockedUserCard({
  profileImage,
  nickname,
  userId,
  blockedUserDate,
  onPress,
  isBlocked = true,
  isBlocking,
}: BlockedUserCardProps) {
  return (
    <View style={styles.blockedUserCard}>
      <View style={styles.userInfoWrapper}>
        <View style={styles.profileImageWrapper}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.defaultProfile} />
          )}
        </View>
        <View style={styles.textWrapper}>
          <Text style={styles.nicknameText}>{nickname}</Text>
          <Text style={styles.userIdText}>@{userId}</Text>
          <Text style={styles.blockedUserDateText}>차단한 날짜: {blockedUserDate}</Text>
        </View>
      </View>
      <View style={styles.buttonWrapper}>
        <VariantButton
          children={isBlocking ? '처리 중...' : isBlocked ? '차단 해제' : '차단하기'}
          theme={isBlocked ? 'main' : 'sub'}
          onPress={onPress!}
          disabled={isBlocking}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blockedUserCard: {
    flexDirection: 'row',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[12],
    justifyContent: 'space-between',
    borderRadius: semanticNumber.borderRadius.lg,
  },
  userInfoWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: semanticNumber.borderRadius.full,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  defaultProfile: {
    width: '100%',
    height: '100%',
    borderRadius: semanticNumber.borderRadius.full,
    backgroundColor: semanticColor.surface.gray,
  },
  textWrapper: {
    marginLeft: 8,
  },
  nicknameText: {
    fontFamily: fonts.family.semibold,
    fontSize: fonts.size.MD,
    lineHeight: fonts.lineHeight.MD,
    letterSpacing: fonts.letterSpacing.none,
    color: semanticColor.text.primary,
  },
  userIdText: {
    fontFamily: fonts.family.regular,
    fontSize: fonts.size['2XS'],
    lineHeight: fonts.lineHeight['2XS'],
    letterSpacing: fonts.letterSpacing.none,
    color: semanticColor.text.tertiary,
  },
  blockedUserDateText: {
    fontFamily: fonts.family.regular,
    fontSize: fonts.size['4XS'],
    lineHeight: fonts.lineHeight['4XS'],
    letterSpacing: fonts.letterSpacing.none,
    color: semanticColor.text.lightest,
  },
  buttonWrapper: {
    justifyContent: 'center',
  },
});

export default BlockedUserCard;
