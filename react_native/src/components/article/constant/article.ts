import { ImageSourcePropType } from 'react-native';

export interface ArticleType {
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  description: string[];
}

export interface ArticleTitleType extends ArticleType {
  id?: number;
}

export interface ArticleContentType {
  id: number;
  content: ArticleType[];
}
