import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { StyleSheet, View } from 'react-native';

function LoadingUserCard() {
  return (
    <View style={styles.loadingUserCard}>
      <View style={styles.imageSection} />
      <View style={styles.textSection}>
        <View style={styles.nicknameSection} />
        <View style={styles.userIdSection} />
        <View style={styles.userDateSection} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingUserCard: {
    flexDirection: 'row',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[12],
    justifyContent: 'space-between',
    borderRadius: semanticNumber.borderRadius.lg,
  },
  imageSection: {
    width: 48,
    height: 48,
    backgroundColor: semanticColor.surface.lightGray,
    borderRadius: semanticNumber.borderRadius.full,
  },
  textSection: {
    flex: 1,
    gap: semanticNumber.spacing[2],
    marginLeft: semanticNumber.spacing[8],
  },
  nicknameSection: {
    width: 72,
    height: 22,
    borderRadius: semanticNumber.borderRadius.sm,
    backgroundColor: semanticColor.surface.lightGray,
  },
  userIdSection: {
    width: 120,
    height: 18,
    borderRadius: semanticNumber.borderRadius.sm,
    backgroundColor: semanticColor.surface.lightGray,
  },
  userDateSection: {
    width: 160,
    height: 16,
    borderRadius: semanticNumber.borderRadius.sm,
    backgroundColor: semanticColor.surface.lightGray,
  },
});

export default LoadingUserCard;
