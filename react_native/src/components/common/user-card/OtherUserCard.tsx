import { fonts } from '@/styles/fonts';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';

type OtherUserCardProps = {
  profileImage: string | null;
  nickname: string;
  userId: number | string;
};

function OtherUserCard({ profileImage, nickname, userId }: OtherUserCardProps) {
  return (
    <View style={styles.otherUserCard}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  otherUserCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 24,
    width: Dimensions.get('window').width - 32,
    borderRadius: semanticNumber.borderRadius.lg,
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
    fontFamily: fonts.family.bold,
    fontSize: fonts.size['2XL'],
    lineHeight: fonts.lineHeight['2XL'],
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
});

export default OtherUserCard;
