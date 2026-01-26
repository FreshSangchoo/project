import CenterHeader from '@/components/common/header/CenterHeader';
import React from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions } from 'react-native';
import IconX from '@/assets/icons/IconX.svg';
import { semanticNumber } from '@/styles/semantic-number';
import { ARTICLE_TITLE } from '@/components/article/constant/ArticleTitle';
import { ARTICLE_CONTENT } from '@/components/article/constant/ArticleContent';
import ArticleTitle from '@/components/article/ArticleTitle';
import ArticleContents from '@/components/article/ArticleContents';
import { RouteProp, useRoute } from '@react-navigation/native';
import Logo from '@/assets/logos/Logo.svg';
import VariantButton from '@/components/common/button/VariantButton';
import { semanticFont } from '@/styles/semantic-font';
import { semanticColor } from '@/styles/semantic-color';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeStackParamList } from '@/navigation/types/home-stack';
import useHomeNavigation from '@/hooks/navigation/useHomeNavigation';

type ArticleRoot = RouteProp<HomeStackParamList, 'Article'>;

const Article = () => {
  const rightChilds = [
    {
      icon: (
        <IconX width={28} height={28} stroke={semanticColor.home.neutral900} strokeWidth={semanticNumber.stroke.bold} />
      ),
      onPress: () => navigation.goBack(),
    },
  ];
  const route = useRoute<ArticleRoot>();
  const { id } = route.params;
  const navigation = useHomeNavigation();
  const title = ARTICLE_TITLE.find(article => article.id === id);
  const content = ARTICLE_CONTENT.find(article => article.id === id);
  return (
    <SafeAreaView style={styles.safeArea}>
      <CenterHeader title="아키파이 아티클" rightChilds={rightChilds} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.article}>
          {title ? <ArticleTitle title={title} /> : <Text>해당 ID에 대한 콘텐츠가 없습니다.</Text>}
          {content ? <ArticleContents contents={content} /> : <Text>해당 ID에 대한 콘텐츠가 없습니다.</Text>}
          <Text style={styles.footerText}>{`악기 라이프,\n아키파이와 함께하세요`}</Text>
          <View style={styles.footerContentContainer}>
            <Logo style={styles.logo} width={94} height={20} />
            <View style={styles.buttonContainer}>
              <VariantButton theme="sub" isLarge={false} onPress={() => navigation.goBack()}>
                홈으로 돌아가기
              </VariantButton>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: semanticColor.surface.white,
  },
  container: {
    alignItems: 'flex-start',
    width: Dimensions.get('window').width,
    backgroundColor: semanticColor.surface.white,
  },
  article: {
    rowGap: semanticNumber.spacing[48],
  },
  footerText: {
    ...semanticFont.title.large,
    textAlign: 'center',
    color: semanticColor.article.neutral900,
    flexDirection: 'row',
    padding: semanticNumber.spacing[16],
    alignItems: 'center',
    columnGap: semanticNumber.spacing[4],
  },
  footerContentContainer: {
    paddingBottom: semanticNumber.spacing[64],
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: semanticNumber.spacing[24],
  },
  logo: {
    alignSelf: 'center',
    flexDirection: 'row',
  },
  buttonContainer: {
    paddingVertical: semanticNumber.spacing[8],
    paddingHorizontal: semanticNumber.spacing.none,
    alignItems: 'center',
  },
});
export default Article;
