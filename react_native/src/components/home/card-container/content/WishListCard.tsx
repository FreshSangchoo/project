import React from 'react';
import { StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';

interface WishListCardProps {
  onPress: () => void;
}

const WishListCard = ({ onPress }: WishListCardProps) => {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.container} onPress={onPress}>
      <Text style={styles.text}>내가 찜한 악기</Text>
      <Image source={require('@/assets/images/Heart.png')} style={styles.image} />
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 100,
    paddingTop: semanticNumber.spacing.none,
    paddingRight: semanticNumber.spacing[24],
    paddingBottom: semanticNumber.spacing.none,
    paddingLeft: semanticNumber.spacing[16],
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: semanticNumber.borderRadius.xl,
    backgroundColor: semanticColor.home.neutral900,
  },
  text: {
    ...semanticFont.title.medium,
    color: semanticColor.home.white,
  },
  image: {
    width: 64,
    height: 64,
  },
});
export default WishListCard;
