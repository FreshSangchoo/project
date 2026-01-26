import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import React from 'react';
import { StyleSheet, View, Image, Text, Platform, TouchableOpacity } from 'react-native';
import IconChevronRight from '@/assets/icons/IconChevronRight.svg';
import { BlurView } from '@react-native-community/blur';
import { semanticFont } from '@/styles/semantic-font';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';

const FeatureProductCard = () => {
  const navigation = useRootNavigation();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.container}
      onPress={() => {
        navigation.navigate('NavBar', { screen: 'Explore' });
      }}>
      <View style={styles.title}>
        <Text style={styles.titleText}>Effects</Text>
        <Text style={styles.subtitleText}>이펙터 · 페달 · 스톰프박스</Text>
      </View>
      {Platform.OS === 'ios' ? (
        <BlurView blurType="light" blurAmount={3}>
          <View style={styles.blurContainer}>
            <Text style={styles.blurText}>지금 둘러보기</Text>
            <IconChevronRight width={24} height={24} stroke={semanticColor.icon.buttonMain} strokeWidth={2} />
          </View>
        </BlurView>
      ) : (
        <View style={[styles.blurContainer, { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
          <Text style={styles.blurText}>지금 둘러보기</Text>
          <IconChevronRight width={24} height={24} stroke={semanticColor.icon.buttonMain} strokeWidth={2} />
        </View>
      )}
      <Image
        source={require('@/assets/backgrounds/Effects.png')}
        resizeMode="contain"
        style={{ ...styles.imageStyle, width: 328, height: 304 }}
      />
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  container: {
    minWidth: 328,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    rowGap: semanticNumber.spacing[156],
    backgroundColor: semanticColor.surface.dark,
    borderRadius: semanticNumber.borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  title: {
    flexDirection: 'column',
    paddingTop: semanticNumber.spacing[24],
    paddingRight: semanticNumber.spacing.none,
    paddingBottom: semanticNumber.spacing.none,
    paddingLeft: semanticNumber.spacing[16],
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  imageStyle: {
    position: 'absolute',
    right: 0,
    zIndex: -1,
    overflow: 'hidden',
  },
  titleText: {
    color: semanticColor.home.primary300,
    ...semanticFont.headline.xlargeEnglish,
  },
  subtitleText: {
    color: semanticColor.home.white,
    ...semanticFont.body.small,
  },
  blurContainer: {
    width: '100%',
    flexDirection: 'row',
    paddingTop: semanticNumber.spacing[16],
    paddingHorizontal: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[20],
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF1A',
  },
  blurText: {
    color: semanticColor.home.white,
    ...semanticFont.label.medium,
  },
});

export default FeatureProductCard;
