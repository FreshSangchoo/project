import { semanticNumber } from '@/styles/semantic-number';
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { fonts } from '@/styles/fonts';

interface HomeSectionProps {
  title: string;
  welcome?: boolean;
}

const HomeSection = ({ title, welcome = false }: HomeSectionProps) => {
  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row' }}>
        <Text style={[styles.text, textStyle.bold]}>{title}</Text>
        {welcome && <Text style={[styles.text, textStyle.regular]}>님,</Text>}
      </View>
      {welcome && <Text style={[styles.text, textStyle.regular]}>오신 것을 환영합니다</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: semanticNumber.spacing[16],
    alignItems: 'flex-start',
    rowGap: semanticNumber.spacing[4],
  },
  text: {
    fontSize: fonts.size['3XL'],
    lineHeight: fonts.lineHeight['3XL'],
    letterSpacing: fonts.letterSpacing.none,
  },
});
const textStyle = StyleSheet.create({
  bold: {
    fontFamily: fonts.family.bold,
  },
  regular: {
    fontFamily: fonts.family.regular,
  },
});
export default HomeSection;
