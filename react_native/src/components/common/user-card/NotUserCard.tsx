import { semanticFont } from '@/styles/semantic-font';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

function NotUserCard() {
  return (
    <View style={styles.notUserCard}>
      <Text style={styles.text}>(탈퇴한 유저)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notUserCard: {
    padding: semanticNumber.spacing[16],
    backgroundColor: semanticColor.surface.lightGray,
    borderRadius: semanticNumber.borderRadius.lg,
    width: Dimensions.get('window').width - 32,
  },
  text: {
    ...semanticFont.title.small,
    color: semanticColor.text.tertiary,
  },
});

export default NotUserCard;
