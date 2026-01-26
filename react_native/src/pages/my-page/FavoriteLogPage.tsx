import CenterHeader from '@/components/common/header/CenterHeader';
import { FlatList, StyleSheet, View } from 'react-native';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import { semanticColor } from '@/styles/semantic-color';
import ProductListBar from '@/components/common/array-bar/ProductListBar';
import MerchandiseCard, { MerchandiseCardProps } from '@/components/common/merchandise-card/MerchandiseCard';
import { useEffect, useState } from 'react';
import NoResultSection from '@/components/common/NoResultSection';
import VariantButton from '@/components/common/button/VariantButton';
import EmojiGuitar from '@/assets/icons/EmojiGuitar.svg';
import { semanticNumber } from '@/styles/semantic-number';
import { SafeAreaView } from 'react-native-safe-area-context';
import useMyNavigation from '@/hooks/navigation/useMyNavigation';
import MerchandiseCardSkeleton from '@/components/common/merchandise-card/MerchandiseCardSkeleton';
import useMyPostsApi from '@/hooks/apis/useMyPostsApi';
import { SortValue } from '@/components/common/bottom-sheet/SortBottomSheet';
import { merchandiseToCard } from '@/utils/merchandiseToCard';
import usePostLikeApi from '@/hooks/apis/usePostLikeApi';

function FavoriteLogPage() {
  const navigation = useMyNavigation();
  const { getLikedList } = useMyPostsApi();
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState<SortValue>('latest');
  const [list, setList] = useState<MerchandiseCardProps[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [hasNext, setHasNext] = useState(true);
  const { postPostLike, deletePostLike } = usePostLikeApi();
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<number>>(new Set());

  const SkeletonList = () => (
    <View style={{ paddingBottom: 60 }}>
      <MerchandiseCardSkeleton />
      <MerchandiseCardSkeleton />
      <MerchandiseCardSkeleton />
    </View>
  );

  const pressLike = async (id: number, nextLiked: boolean) => {
    if (pendingLikeIds.has(id)) return;
    setPendingLikeIds(prev => new Set(prev).add(id));

    const prevList = list;
    setList(current =>
      current.map(it =>
        it.id === id ? { ...it, isLiked: nextLiked, likeNum: Math.max(0, it.likeNum + (nextLiked ? 1 : -1)) } : it,
      ),
    );

    try {
      if (nextLiked) {
        await postPostLike(String(id));
      } else {
        await deletePostLike(String(id));
      }
    } catch (error) {
      setList(prevList);
    } finally {
      setPendingLikeIds(prev => {
        const set = new Set(prev);
        set.delete(id);
        return set;
      });
    }
  };

  const load = async (targetPage: number, mode: 'reset' | 'append') => {
    if (mode === 'append') setLoadingMore(true);
    if (mode === 'reset') setLoadingInitial(true);

    try {
      const { posts, totalCount, currentPage, pageCount } = await getLikedList({ page: targetPage, size, sort });
      const mapped = (posts ?? []).map(merchandiseToCard);

      if (mode === 'reset') {
        setList(mapped);
      } else {
        setList(prev => [...prev, ...mapped]);
      }

      setTotalCount(totalCount ?? mapped.length);
      setPage(currentPage);
      setHasNext(currentPage + 1 < pageCount);
    } catch (error) {
      if (__DEV__) {
        console.log('[FavoriteLogPage][getLikedList] error:', error);
      }
      if (mode === 'reset') {
        setList([]);
        setTotalCount(0);
        setHasNext(false);
      }
    } finally {
      if (mode === 'append') setLoadingMore(false);
      if (mode === 'reset') setLoadingInitial(false);
    }
  };

  useEffect(() => {
    setList([]);
    setPage(0);
    setHasNext(true);
    setTotalCount(0);
    load(0, 'reset');
  }, [sort]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load(0, 'reset');
    } finally {
      setRefreshing(false);
    }
  };

  const onEndReached = () => {
    if (!hasNext || loadingMore || loadingInitial || refreshing) return;
    load(page + 1, 'append');
  };

  return (
    <SafeAreaView style={styles.favoriteLogPage} edges={['top', 'right', 'left']}>
      <CenterHeader
        title="내가 찜한 악기"
        leftChilds={{
          icon: (
            <IconChevronLeft
              width={28}
              height={28}
              stroke={semanticColor.icon.primary}
              strokeWidth={semanticNumber.stroke.bold}
            />
          ),
          onPress: () => navigation.goBack(),
        }}
      />
      <ProductListBar count={totalCount} loading={loadingInitial} onChangeSort={value => setSort(value)} />
      {loadingInitial && list.length === 0 ? (
        <SkeletonList />
      ) : list.length === 0 ? (
        <View>
          <NoResultSection
            emoji={<EmojiGuitar width={28} height={28} />}
            title="아직 찜한 악기가 없어요."
            description="악기들을 먼저 둘러보실래요?"
            button={
              <VariantButton
                children="둘러보러 가기"
                onPress={() => {
                  const rootNav = navigation.getParent();
                  rootNav?.navigate('NavBar', { screen: 'Explore' });
                }}
                isLarge
                theme="sub"
              />
            }
          />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item, index) => `${item.brandName}-${item.modelName}-${item.createdAt}-${index}`}
          renderItem={({ item }) => (
            <MerchandiseCard
              {...item}
              onPressCard={() => {
                const rootNav = navigation.getParent();
                rootNav!.navigate('ExploreStack', {
                  screen: 'MerchandiseDetailPage',
                  params: { id: item.id },
                });
              }}
              onPressHeart={() => {
                if (!item.id) return;
                pressLike(item.id, !item.isLiked);
              }}
            />
          )}
          contentContainerStyle={{ paddingBottom: 60 }}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListFooterComponent={loadingMore ? <MerchandiseCardSkeleton /> : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  favoriteLogPage: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
});

export default FavoriteLogPage;
