import { useState, useEffect } from 'react';
import { Platform, StyleSheet, View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';
import useExploreNavigation, { ExploreStackParamList } from '@/hooks/navigation/useExploreNavigation';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import ButtonTitleHeader from '@/components/common/header/ButtonTitleHeader';
import ModelCard from '@/components/common/model-card/ModelCard';
import TextButton from '@/components/common/button/TextButton';
import ProductListBar from '@/components/common/array-bar/ProductListBar';
import { SortValue } from '@/components/common/bottom-sheet/SortBottomSheet';
import MerchandiseCard from '@/components/common/merchandise-card/MerchandiseCard';
import SectionSeparator from '@/components/common/SectionSeparator';
import NoResultSection from '@/components/common/NoResultSection';
import ModelCardSkeleton from '@/components/common/model-card/ModelCardSkeleton';
import MerchandiseCardSkeleton from '@/components/common/merchandise-card/MerchandiseCardSkeleton';
import Toast from '@/components/common/toast/Toast';
import Modal from '@/components/common/modal/Modal';
import useSearchApi from '@/hooks/apis/useSearchApi';
import { PostList, ChipData, conditionMap } from '@/types/postlist.type';
import { useLikeHandler } from '@/hooks/useLikeHandler';
import { useUserStore } from '@/stores/userStore';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import IconHome from '@/assets/icons/IconHome.svg';
import EmojiSadface from '@/assets/icons/EmojiSadface.svg';
import EmojiPackage from '@/assets/icons/EmojiPackage.svg';
import IconExchange from '@/assets/icons/EmojiCounterclockwiseArrowsButton.svg';
import IconCustom from '@/assets/icons/EmojiWrench.svg';
import IconParts from '@/assets/icons/EmojiNutAndBolt.svg';
import EmojiGrinningface from '@/assets/icons/EmojiGrinningface.svg';

const isAndroid = Platform.OS === 'android';

function ModelPage() {
  const insets = useSafeAreaInsets();
  const navigation = useExploreNavigation();
  const rootNavigation = useRootNavigation();
  const route = useRoute<RouteProp<ExploreStackParamList, 'ModelPage'>>();
  const { id, modelName, brandId, brandName, brandKorName, category } = route.params;
  const { getModelProductList } = useSearchApi();
  const { toggleLike, toastMessage, toastImage, toastVisible, toastKey, setToastVisible } = useLikeHandler();
  const profile = useUserStore(s => s.profile);
  const goLogin = useUserStore(c => c.clearProfile);
  const [loginModal, setLoginModal] = useState<boolean>(false);

  const [sort, setSort] = useState<SortValue>('latest');

  // 1) 데이터
  const [posts, setPosts] = useState<PostList[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNext, setHasNext] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 2) 매물 목록 조회
  const fetchPosts = async (nextPage: number, reset = false, sortParam?: SortValue) => {
    if (refreshing || loadingMore || (!hasNext && !reset)) return;

    if (reset) {
      setRefreshing(true);
    } else if (nextPage === 0) {
      setInitialLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = { page: nextPage, size: 20, sort: sortParam ?? sort };
      const res = await getModelProductList(id, params);

      setPosts(prev => (reset || nextPage === 0 ? res.posts : [...prev, ...res.posts]));
      console.log('[fetchPosts] totalCount from server:', res.totalCount);
      console.log('[state] totalCount state before:', totalCount);
      setTotalCount(res.totalCount);

      setPage(res.currentPage + 1);
      setHasNext(res.currentPage < res.pageCount - 1);
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
      setInitialLoading(false);
    }
  };

  const updatePosts = (id: number, newIsLiked: boolean) => {
    setPosts(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              isLiked: newIsLiked,
              likeCount: Math.max(0, item.likeCount + (newIsLiked ? 1 : -1)),
            }
          : item,
      ),
    );
  };

  // 3) 새로고침
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPosts(0, true);
    } finally {
      setRefreshing(false);
    }
  };

  // 4) 데이터 반영
  useEffect(() => {
    fetchPosts(0);
  }, []);

  // 5) 매물 카드 렌더링
  const renderItem = ({ item, index }: { item: PostList; index: number }) => {
    const chips: ChipData[] = [];

    if (item.effectTypes && item.effectTypes.length > 0) {
      chips.push(
        ...item.effectTypes.map(effect => ({
          text: effect,
        })),
      );
    }

    if (item.condition) {
      const conditionText = conditionMap[item.condition] ?? item.condition;
      chips.push({ text: conditionText, variant: 'condition' });
    }

    if (item.regions && item.regions.length > 0) {
      chips.push(
        ...item.regions.map(region => ({
          text: region,
        })),
      );
    }

    if (item.deliveryAvailable) {
      chips.push({
        text: '택배가능',
        variant: 'brand',
        icon: <EmojiPackage width={16} height={16} />,
      });
    }
    if (item.exchangeAvailable) {
      chips.push({
        text: '교환가능',
        icon: <IconExchange width={16} height={16} />,
      });
    }
    if (item.isUnbrandedOrCustom) {
      chips.push({
        text: '커스텀',
        icon: <IconCustom width={16} height={16} />,
      });
    }
    if (item.partChange) {
      chips.push({
        text: '부품교체',
        icon: <IconParts width={16} height={16} />,
      });
    }

    return (
      <View style={[styles.cardSectionGap, { paddingBottom: semanticNumber.spacing[12] }]}>
        <MerchandiseCard
          onPressCard={() => navigation.navigate('MerchandiseDetailPage', { id: item.id })}
          isLiked={item.isLiked}
          onPressHeart={() => toggleLike(item.id, item.isLiked, updatePosts, profile, setLoginModal)}
          saleStatus={item.saleStatus}
          imageUrl={item.thumbnail}
          brandName={item.brandName}
          modelName={item.modelName}
          modelPrice={Number(item.price)}
          likeNum={item.likeCount}
          eyeNum={item.viewCount}
          createdAt={item.createdAt}
          chips={chips}
        />
        {index < posts.length - 1 && <SectionSeparator type="line-with-padding" />}
      </View>
    );
  };

  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => {
        setToastVisible(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [toastKey]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <ButtonTitleHeader
        title="모델별 매물 보기"
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
        rightChilds={[
          {
            icon: (
              <IconHome
                width={28}
                height={28}
                stroke={semanticColor.icon.primary}
                strokeWidth={semanticNumber.stroke.bold}
              />
            ),
            onPress: () => {
              rootNavigation.reset({
                index: 0,
                routes: [{ name: 'NavBar', params: { screen: 'Home' } }],
              });
            },
          },
        ]}
      />
      <FlatList
        data={posts}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        scrollEventThrottle={16}
        contentContainerStyle={!isAndroid && { paddingBottom: insets.bottom }}
        onEndReached={() => {
          if (!loadingMore && hasNext) {
            fetchPosts(page);
          }
        }}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <>
            <View style={styles.modelContainer}>
              {initialLoading ? (
                <ModelCardSkeleton />
              ) : (
                <ModelCard
                  brand={brandName}
                  modelName={modelName!}
                  category={category!}
                  onPress={() => {}}
                  noNextButton
                />
              )}
              <View style={styles.textButtonWrapper}>
                <TextButton
                  onPress={() =>
                    navigation.navigate('BrandPage', {
                      id: brandId!,
                      brandName: brandName,
                      brandKorName: brandKorName ?? undefined,
                    })
                  }
                  align="center"
                  alignSelf="center">
                  브랜드 페이지 보기
                </TextButton>
              </View>
            </View>
            <ProductListBar
              count={totalCount}
              loading={initialLoading || refreshing}
              onChangeSort={value => {
                setSort(value);
                fetchPosts(0, true, value);
              }}
            />
          </>
        }
        ListEmptyComponent={
          initialLoading ? (
            <View style={styles.cardSectionGap}>
              <MerchandiseCardSkeleton />
              <SectionSeparator type="line-with-padding" />
              <MerchandiseCardSkeleton />
              <SectionSeparator type="line-with-padding" />
              <MerchandiseCardSkeleton />
            </View>
          ) : (
            <NoResultSection emoji={<EmojiSadface width={28} height={28} />} title="아직 매물이 없어요" />
          )
        }
      />
      <Toast
        key={toastKey}
        visible={toastVisible}
        message={toastMessage}
        image={toastImage === 'EmojiCheckMarkButton' ? 'EmojiCheckMarkButton' : 'EmojiCrossmark'}
      />
      <Modal
        mainButtonText="로그인/회원가입 하기"
        onClose={() => setLoginModal(false)}
        onMainPress={() => {
          setLoginModal(false);
          goLogin();
          rootNavigation.reset({ index: 0, routes: [{ name: 'AuthStack', params: { screen: 'Welcome' } }] });
        }}
        titleText="로그인/회원가입이 필요해요."
        visible={loginModal}
        buttonTheme="brand"
        noDescription
        titleIcon={<EmojiGrinningface width={24} height={24} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  modelContainer: {
    paddingVertical: semanticNumber.spacing[8],
    paddingHorizontal: semanticNumber.spacing[16],
  },
  textButtonWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSectionGap: {
    gap: semanticNumber.spacing[12],
  },
});

export default ModelPage;
