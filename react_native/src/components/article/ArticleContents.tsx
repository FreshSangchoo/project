import { View, Image, StyleSheet } from 'react-native';
import { ArticleContentType } from '@/components/article/constant/article';
import ArticleContent from '@/components/article/ArticleContent';
import { getScaledImageSize } from '@/utils/getScaledImageSize';
import { semanticNumber } from '@/styles/semantic-number';
const ArticleContents = ({ contents }: { contents: ArticleContentType }) => {
  const id = contents.id;
  const { width, height } = getScaledImageSize(390, 240);

  return (
    <View style={styles.container}>
      {contents.content.map(content => (
        <View style={styles.contentContainer} key={content.title}>
          <View style={styles.imageContainer}>
            <Image style={{ width, height }} source={content.image} resizeMode="cover" resizeMethod="resize" />
          </View>
          <ArticleContent props={content} />
        </View>
      ))}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'flex-start',
    rowGap: semanticNumber.spacing[48],
  },
  contentContainer: {
    alignItems: 'flex-start',
    rowGap: semanticNumber.spacing[8],
    width: '100%',
    flex: 1,
  },
  imageContainer: {
    width: '100%',
  },
});
export default ArticleContents;
