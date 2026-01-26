import { fonts } from '@/styles/fonts';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { Image, StyleSheet, Text, View } from 'react-native';
import VariantButton from '../button/VariantButton';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';

interface MyUserCardProps {
  profileImage: string | null;
  nickname: string;
  userId: string;
}

function MyUserCard({ profileImage, nickname, userId }: MyUserCardProps) {
  const navigation = useRootNavigation();

  return (
    <View style={styles.myUserCard}>
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
          <Text style={styles.userIdText}>{userId}</Text>
        </View>
      </View>
      <VariantButton
        theme="sub"
        children="내 정보 편집"
        onPress={() => navigation.navigate('MyStack', { screen: 'ProfileEditPage' })}
        isFull
      />
    </View>
  );
}

const styles = StyleSheet.create({
  myUserCard: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: semanticNumber.spacing[12],
    borderRadius: semanticNumber.borderRadius.lg,
  },
  userInfoWrapper: {
    flexDirection: 'row',
  },
  profileImageWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: semanticNumber.borderRadius.full,
    overflow: 'hidden',
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

export default MyUserCard;
