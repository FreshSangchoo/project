import { ImageSourcePropType } from 'react-native';

export interface ArticleType {
  id: number;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  onPress?: (id: number) => void;
}

export const HOMEARTICLE: ArticleType[] = [
  {
    id: 1,
    title: '악기 거래를  더 쉽게',
    subtitle: '아키파이의 현재와 미래',
    image: require('@/assets/logos/Article1.png'),
  },
  {
    id: 2,
    title: '매물 업로드 가이드',
    subtitle: '내 악기를 더 잘 팔기 위해서는?',
    image: require('@/assets/logos/Article2.png'),
  },
  {
    id: 3,
    title: '거래 유의사항 & 팁',
    subtitle: '안전하고 신뢰할 수 있는 거래를 위해서는?',
    image: require('@/assets/logos/Article3.png'),
  },
  {
    id: 1,
    title: '악기 거래를  더 쉽게',
    subtitle: '아키파이의 현재와 미래',
    image: require('@/assets/logos/Article1.png'),
  },
  {
    id: 2,
    title: '매물 업로드 가이드',
    subtitle: '내 악기를 더 잘 팔기 위해서는?',
    image: require('@/assets/logos/Article2.png'),
  },
  {
    id: 3,
    title: '거래 유의사항 & 팁',
    subtitle: '안전하고 신뢰할 수 있는 거래를 위해서는?',
    image: require('@/assets/logos/Article3.png'),
  },
];
