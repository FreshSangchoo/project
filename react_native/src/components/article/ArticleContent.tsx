import { View, Text, StyleSheet } from 'react-native';
import { ArticleTitleType } from '@/components/article/constant/article';
import IconArticle from '@/assets/icons/IconArticle.svg';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';

const ArticleContent = ({ props }: { props: ArticleTitleType }) => {
  return (
    <View style={styles.container}>
      <View style={props.id ? styles.articleTitleContainer : styles.contentTitleContainer}>
        {props.id && (
          <View style={styles.captionContainer}>
            <IconArticle stroke={semanticColor.icon.secondary} strokeWidth={2} width={16} height={16} />
            <Text style={styles.captionText}>{`AKIFY Article No.${props.id}`}</Text>
          </View>
        )}
        <Text style={styles.title}>{props.title}</Text>
        <Text style={styles.subtitle}>{props.subtitle}</Text>
      </View>
      <View style={styles.desContainer}>
        {props.description.map((desc, index) => (
          <Text style={styles.description} key={index}>
            {desc}
          </Text>
        ))}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    rowGap: semanticNumber.spacing[16],
    alignSelf: 'stretch',
  },
  articleTitleContainer: {
    paddingTop: semanticNumber.spacing[40],
    paddingRight: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[12],
    paddingLeft: semanticNumber.spacing[16],
    columnGap: semanticNumber.spacing[4],
    alignSelf: 'stretch',
  },
  contentTitleContainer: {
    padding: semanticNumber.spacing[16],
    columnGap: semanticNumber.spacing[4],
    alignSelf: 'stretch',
  },
  captionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: semanticNumber.spacing[4],
  },
  captionText: {
    color: semanticColor.article.neutral700,
    ...semanticFont.caption.large,
  },
  title: {
    color: semanticColor.article.neutral900,
    ...semanticFont.headline.medium,
  },
  subtitle: {
    color: semanticColor.article.neutral600,
    ...semanticFont.body.large,
  },
  description: {
    color: semanticColor.article.neutral700,
    ...semanticFont.body.large,
  },
  desContainer: {
    alignItems: 'flex-start',
    rowGap: semanticNumber.spacing[16],
    alignSelf: 'stretch',
    paddingRight: semanticNumber.spacing[16],
    paddingLeft: semanticNumber.spacing[16],
  },
});
export default ArticleContent;
