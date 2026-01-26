import React from 'react';
import { StyleSheet, View, Text, Image, Pressable } from 'react-native';
import type { ArticleType } from '../constant/HomeArticle';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';

const HomeArticle = ({ title, subtitle, image, id, onPress }: ArticleType) => {
  return (
    <Pressable style={styles.container} onPress={() => onPress?.(id)}>
      <Image source={image} resizeMode="cover" style={{ width: 100, height: 100 }} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
};
const styles = StyleSheet.create({
  container: {
    height: 280,
    paddingTop: semanticNumber.spacing['56'],
    paddingRight: semanticNumber.spacing.none,
    paddingBottom: semanticNumber.spacing['24'],
    paddingLeft: semanticNumber.spacing.none,
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 179 / 140,
    backgroundColor: semanticColor.home.dark,
    borderRadius: semanticNumber.borderRadius['xl'],
    gap: semanticNumber.spacing['34'],
  },
  textContainer: {
    width: 358,
    paddingRight: semanticNumber.spacing['16'],
    paddingLeft: semanticNumber.spacing['16'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: semanticColor.home.white,
    ...semanticFont.headline.large,
  },
  subtitle: {
    color: semanticColor.home.neutral600,
    ...semanticFont.body.medium,
  },
});
export default HomeArticle;
