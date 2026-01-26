import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import IconChevronRight from '@/assets/icons/IconChevronRight.svg';

type SellerUserCardProps = {
  profileImage: string | null;
  nickname: string;
  onPress: () => void;
  chip?: React.ReactNode;
};

// 기능 추가 시 수정 필요
function SellerUserCard({ profileImage, nickname, onPress, chip }: SellerUserCardProps) {
  return (
    <TouchableOpacity style={styles.sellerUserCard} onPress={onPress}>
      <View style={styles.profileImageWrapper}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.defaultProfile} />
        )}
      </View>
      <View style={styles.nicknameWrapper}>
        <Text style={styles.nicknameText}>{nickname}</Text>
      </View>
      <View style={styles.rightItemWrapper}>
        {chip && <View>{chip}</View>}
        <IconChevronRight
          width={24}
          height={24}
          stroke={semanticColor.icon.lightest}
          strokeWidth={semanticNumber.stroke.bold}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sellerUserCard: {
    flexDirection: 'row',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[12],
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: semanticNumber.borderRadius.lg,
    backgroundColor: semanticColor.surface.lightGray,
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
  nicknameWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    marginLeft: semanticNumber.spacing[10],
  },
  nicknameText: {
    color: semanticColor.text.primary,
    ...semanticFont.title.small,
  },
  rightItemWrapper: {
    flexDirection: 'row',
    gap: semanticNumber.spacing[4],
    alignItems: 'center',
  },
});

export default SellerUserCard;
