import React, {useCallback, useState, useMemo} from 'react';
import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import useStock from '@/hooks/queries/useStock';

const RealAssetPastNewsScreen = ({navigation}:any) => {
  const [sortedByCreatedAt, setSortedByCreatedAt] = useState(true);
  const {useGetNews} = useStock();
  const {data: pastNewsData = [] } = useGetNews(5);
// console.log(pastNewsData)

  const sortedNews = useMemo(() => {
    if (pastNewsData.length >= 1)
      return sortedByCreatedAt ? [...pastNewsData] : [...pastNewsData].reverse();
  }, [pastNewsData, sortedByCreatedAt]);

  const switchSortOrder = () => {
    setSortedByCreatedAt(prev => !prev);
  };

  // 날짜 형식 바꾸기
  // date를 YYYY.MM.DD로 포맷팅
  const formatDate = (dateStr: Date) => {
    return new Date(dateStr).toISOString().slice(0, 10).replaceAll('-', '.');
  };

  if (pastNewsData.length < 1) {
    return (
      <View style={styles.container}>
        <Text style={{marginTop: 30, textAlign: 'center'}}>
          {' '}
          뉴스가 없습니다
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={switchSortOrder}>
        {sortedByCreatedAt ? (
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.buttonText}>최신순 </Text>
            <Icon name="chevron-down" size={25} />
          </View>
        ) : (
          <View style={{flexDirection: 'row'}}>
            <Text style={styles.buttonText}>시간순 </Text>
            <Icon name="chevron-up" size={25} />
          </View>
        )}
      </TouchableOpacity>
      <ScrollView>
        {pastNewsData.length >= 1 &&
          sortedNews?.map(news => (
            <TouchableOpacity
              key={news.Id}
              style={styles.newsContainer}
              onPress={()=>navigation.navigate('NewsDetail',{
                news
              })}>
              <View style={{flex: 0.8, marginRight: 15}}>
                <Text style={styles.headText}>{news.title}</Text>
                <Text style={styles.sourceText}>
                  {formatDate(news.createdAt)} {news.source}
                </Text>
              </View>
              <Image
                style={styles.image}
                source={require('@/assets/gold.png')}></Image>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </View>
  );
};

export default RealAssetPastNewsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  buttonContainer: {
    marginTop: 20,
    marginLeft: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: fonts.BOLD,
  },
  newsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
    borderBottomWidth: 0.5,
  },
  headText: {
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    fontSize: 16,
  },
  sourceText: {
    fontFamily: fonts.LIGHT,
    fontSize: 12,
    marginTop: 10,
  },
  image: {
    width: 80,
    height: 80,
  },
});
