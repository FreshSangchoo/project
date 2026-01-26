import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent, Text } from 'react-native';
import { HOMEARTICLE } from '@/components/home/article-container/constant/HomeArticle';
import HomeArticle from '@/components/home/article-container/content/HomeArticle';
import { semanticNumber } from '@/styles/semantic-number';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';
import { semanticColor } from '@/styles/semantic-color';

const ITEM_WIDTH = 358;
const GAP = semanticNumber.spacing['8'];
const SNAP_INTERVAL = ITEM_WIDTH + GAP;
const INITIAL_INDEX = 3;

const ArticleContainer = () => {
  const navigation = useRootNavigation();
  const [articles, setArticles] = useState(HOMEARTICLE);
  const [index, setIndex] = useState(INITIAL_INDEX);
  const flatListRef = useRef<FlatList>(null);
  const snappingRef = useRef(false); // 중복 스냅 방지

  useEffect(() => {
    flatListRef.current?.scrollToOffset({
      offset: index * SNAP_INTERVAL,
      animated: false,
    });
    setIndex(INITIAL_INDEX);
  }, []);

  // index 변경 시 스크롤 이동
  useEffect(() => {
    if (snappingRef.current) return;
    flatListRef.current?.scrollToOffset({
      offset: index * SNAP_INTERVAL,
      animated: true,
    });
  }, [index]);

  const loadMoreData = () => setArticles(prev => [...prev, ...HOMEARTICLE]);

  const preMoreData = () => {
    setArticles(prev => [...HOMEARTICLE, ...prev]);
    // 앞에 붙였으니, 동일 아이템 보이도록 오프셋 보정
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({
        offset: HOMEARTICLE.length * SNAP_INTERVAL,
        animated: false,
      });
      setIndex(HOMEARTICLE.length);
    });
  };

  const handlePressArticle = (id: number) => {
    navigation.navigate('HomeStack', { screen: 'Article', params: { id } });
  };

  const handleMomentumEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const next = Math.round(offsetX / SNAP_INTERVAL);

    // 양끝 확장 로직
    if (next >= articles.length - 2) loadMoreData();
    if (next <= 1) preMoreData();

    setIndex(next);
  };

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={articles}
        renderItem={({ item }) => <HomeArticle {...item} onPress={handlePressArticle} />}
        keyExtractor={(item, i) => `${item.title}-${i}`}
        contentContainerStyle={styles.container}
        showsHorizontalScrollIndicator={false}
        horizontal
        disableIntervalMomentum
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        getItemLayout={(_, i) => ({ length: SNAP_INTERVAL, offset: SNAP_INTERVAL * i, index: i })}
        onMomentumScrollEnd={handleMomentumEnd}
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
      />

      <View style={styles.dotsContainer}>
        <View style={styles.dots}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={`dot-${i}`} style={[styles.dot, { opacity: i === index % 3 ? 1 : 0.5 }]} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: (Dimensions.get('window').width - ITEM_WIDTH) / 2,
  },
  dotsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'stretch',
    padding: 10,
  },
  dots: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    columnGap: 8,
  },
  dot: {
    backgroundColor: semanticColor.icon.secondary,
    width: 8,
    height: 8,
    borderRadius: semanticNumber.borderRadius.full,
  },
});

export default ArticleContainer;
