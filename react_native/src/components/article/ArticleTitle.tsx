import { View, Image, StyleSheet } from 'react-native';
import { ArticleTitleType } from '@/components/article/constant/article';
import ArticleContent from '@/components/article/ArticleContent';
import { semanticColor } from '@/styles/semantic-color';
const ArticleTitle = ({ title }: { title: ArticleTitleType }) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleImage}>
        <Image source={title.image} style={styles.image} resizeMode="cover" />
      </View>
      <ArticleContent props={title} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  titleImage: {
    flexDirection: 'row',
    height: 390,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: semanticColor.article.neutral900,
  },
  image: {
    width: 120,
    height: 120,
  },
});

export default ArticleTitle;
