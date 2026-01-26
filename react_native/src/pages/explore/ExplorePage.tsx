import { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import type { TabParamList } from '@/navigation/types/tabs';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticString } from '@/styles/semantic-string';
import TitleMainHeader from '@/components/common/header/TitleMainHeader';
import BottomSheet from '@/components/common/bottom-sheet/BottomSheet';
import SearchField from '@/components/common/search-field/SearchField';
import ProductListBar from '@/components/common/array-bar/ProductListBar';
import { SortValue } from '@/components/common/bottom-sheet/SortBottomSheet';
import MerchandiseCard from '@/components/common/merchandise-card/MerchandiseCard';
import MerchandiseCardSkeleton from '@/components/common/merchandise-card/MerchandiseCardSkeleton';
import SectionSeparator from '@/components/common/SectionSeparator';
import Floatingbutton from '@/components/common/button/Floatingbutton';
import VariantButton from '@/components/common/button/VariantButton';
import Toast from '@/components/common/toast/Toast';
import ModelCard from '@/components/common/model-card/ModelCard';
import BrandContainerCard from '@/components/common/brand-card/BrandContainerCard';
import NoResultSection from '@/components/common/NoResultSection';
import IconAdjust from '@/assets/icons/IconAdjustmentsHorizontal.svg';
import IconX from '@/assets/icons/IconX.svg';
import IconReload from '@/assets/icons/IconReload.svg';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import { useFilterStore } from '@/stores/useFilterStore';
import usePostsApi from '@/hooks/apis/usePostApi';
import useSearchApi from '@/hooks/apis/useSearchApi';
import { PostList, ChipData, conditionMap } from '@/types/postlist.type';
import { useLikeHandler } from '@/hooks/useLikeHandler';
import EmojiPackage from '@/assets/icons/EmojiPackage.svg';
import IconExchange from '@/assets/icons/EmojiCounterclockwiseArrowsButton.svg';
import IconCustom from '@/assets/icons/EmojiWrench.svg';
import IconParts from '@/assets/icons/EmojiNutAndBolt.svg';
import { useUserStore } from '@/stores/userStore';
import Modal from '@/components/common/modal/Modal';
import EmojiGrinningface from '@/assets/icons/EmojiGrinningface.svg';
import EmojiSadface from '@/assets/icons/EmojiSadface.svg';
import useCertificationNavigation from '@/hooks/navigation/useCertificationNavigation';
import { FilterParams } from '@/hooks/apis/useSearchApi';

const isAndroid = Platform.OS === 'android';

// selectedEffects를 API 파라미터로 변환하는 함수
const convertToFilterParams = (
  selectedEffects: Record<string, string[]>,
  selectedBrandIds: Record<string, string>,
  selectedRegionIds: Record<string, string>,
  baseParams: any,
): FilterParams => {
  const filterParams: FilterParams = { ...baseParams };

  // 브랜드 ID 매핑
  if (selectedEffects['브랜드']?.length > 0) {
    filterParams.brandIds = selectedEffects['브랜드'].map(brandName => selectedBrandIds[brandName]).filter(Boolean);
  }

  // 이펙트 타입 매핑
  const effectTypes = Object.keys(selectedEffects).filter(
    key =>
      key !== '브랜드' &&
      key !== '가격' &&
      key !== '거래방식' &&
      key !== '지역' &&
      key !== '악기 상태' &&
      key !== '판매 상태',
  );
  const allEffectTypeIds: string[] = [];
  effectTypes.forEach(type => {
    if (selectedEffects[type]?.length > 0) {
      selectedEffects[type].forEach(effectName => {
        const effectId = semanticString.EffectMap[effectName as keyof typeof semanticString.EffectMap];
        if (effectId) {
          allEffectTypeIds.push(effectId.toString());
        }
      });
    }
  });
  if (allEffectTypeIds.length > 0) {
    filterParams.effectTypeIds = allEffectTypeIds;
  }

  // 가격 매핑
  if (selectedEffects['가격']?.length > 0) {
    const priceRange = selectedEffects['가격'][0];

    // 직접 입력 여부 확인: "10,000원" 같이 콤마와 "원"이 함께 있으면 직접 입력
    const isDirectInput = priceRange.includes(',') && priceRange.includes('원');
    const multiplier = isDirectInput ? 1 : 10000;

    if (priceRange.includes('이하')) {
      // "10만원 이하" 또는 "100,000원 이하"
      const maxValue = parseInt(priceRange.replace(/[^0-9]/g, ''));
      if (!isNaN(maxValue)) {
        filterParams.maxPrice = maxValue * multiplier;
      }
    } else if (priceRange.includes('이상')) {
      // "100만원 이상" 또는 "50,000원 이상"
      const minValue = parseInt(priceRange.replace(/[^0-9]/g, ''));
      if (!isNaN(minValue)) {
        filterParams.minPrice = minValue * multiplier;
      }
    } else if (priceRange.includes('~')) {
      // "30~50만원" 또는 "50,000~70,000원"
      const [min, max] = priceRange.split('~').map(p => parseInt(p.replace(/[^0-9]/g, '')));
      if (!isNaN(min)) filterParams.minPrice = min * multiplier;
      if (!isNaN(max)) filterParams.maxPrice = max * multiplier;
    }
    console.log(filterParams.minPrice, filterParams.maxPrice);
  }

  // 거래방식 매핑
  if (selectedEffects['거래방식']?.length > 0) {
    const tradeTypes = selectedEffects['거래방식'];
    filterParams.deliveryAvailable = tradeTypes.includes('택배거래');
    filterParams.directAvailable = tradeTypes.includes('직거래');
  }

  // 지역 매핑
  if (selectedEffects['지역']?.length > 0) {
    const regionIds: string[] = [];
    selectedEffects['지역'].forEach(region => {
      if (region === '전체') {
        // 전체는 특별 처리 필요 시 추가
        return;
      }

      // 새로운 형태: "시도명|시군구명|sidoId-sigunguId"
      if (region.includes('|')) {
        const parts = region.split('|');
        if (parts.length === 3) {
          const regionId = parts[2]; // sidoId-sigunguId 부분
          const sigunguId = regionId.split('-')[1]; // 시군구 ID만 추출
          regionIds.push(sigunguId);
          return;
        }
      }

      // 기존 방식으로 저장된 ID가 있는지 확인
      const displayName = region.includes('|')
        ? region.split('|')[1] // 시군구명 부분
        : region;

      if (selectedRegionIds[displayName]) {
        regionIds.push(selectedRegionIds[displayName]);
      }
    });

    // 중복 제거
    const uniqueRegionIds = [...new Set(regionIds)];
    if (uniqueRegionIds.length > 0) {
      filterParams.directRegions = uniqueRegionIds;
    }
  }

  // 악기 상태 매핑
  if (selectedEffects['악기 상태']?.length > 0) {
    const conditionMap: Record<string, string> = {
      신품: 'NEW',
      '매우 양호': 'VERY_GOOD',
      양호: 'GOOD',
      보통: 'NORMAL',
      '하자/고장': 'DEFECTIVE',
    };
    filterParams.conditions = selectedEffects['악기 상태'].map(condition => conditionMap[condition] || condition) as (
      | 'NEW'
      | 'VERY_GOOD'
      | 'GOOD'
      | 'NORMAL'
      | 'DEFECTIVE'
    )[];
  }

  // 판매 상태 매핑
  if (selectedEffects['판매 상태']?.length > 0) {
    const statusMap: Record<string, string> = {
      '판매 중': 'ON_SALE',
      '판매 완료': 'SOLD_OUT',
      '예약 중': 'RESERVED',
    };
    filterParams.saleStatus = selectedEffects['판매 상태'].map(status => statusMap[status] || status) as (
      | 'ON_SALE'
      | 'SOLD_OUT'
      | 'RESERVED'
    )[];
  }

  return filterParams;
};

function ExplorePage() {
  const navigation = useRootNavigation();
  const route = useRoute<RouteProp<TabParamList, 'Explore'>>();
  const [isContent, setIsContent] = useState(true);
  const [sort, setSort] = useState<SortValue>('latest');

  const flatListRef = useRef<FlatList>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [shouldPreserveScroll, setShouldPreserveScroll] = useState(false);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [headerMode, setHeaderMode] = useState<'none' | 'brand' | 'model'>('none');

  const [headerBrandName, setHeaderBrandName] = useState<string | undefined>(undefined);
  const [headerKorBrandName, setHeaderKorBrandName] = useState<string | undefined>(undefined);
  const [headerBrandId, setHeaderBrandId] = useState<number | undefined>(undefined);

  const [headerModelName, setHeaderModelName] = useState<string | undefined>(undefined);
  const [headerModelId, setHeaderModelId] = useState<number | undefined>(undefined);

  const { getPostList } = usePostsApi();
  const { getKeywordProductList, getModelProductList, getBrandProductList, getFilterProductList } = useSearchApi();
  const { toggleLike, toastMessage, toastImage, toastVisible, toastKey, setToastVisible } = useLikeHandler();

  const [posts, setPosts] = useState<PostList[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNext, setHasNext] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isLoading = initialLoading || refreshing || loadingMore;
  const profile = useUserStore(s => s.profile);
  const goLogin = useUserStore(c => c.clearProfile);
  const [loginModal, setLoginModal] = useState<boolean>(false);
  const [verifyModal, setVerifyModal] = useState<boolean>(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setIsContent(offsetY <= 10);
  };

  const openSheet = () => {
    setSheetVisible(true);
  };

  const closeSheet = () => {
    setSheetVisible(false);
  };

  const fetchPosts = async (nextPage: number, reset = false, sortParam?: SortValue) => {
    if (refreshing || loadingMore || (!hasNext && !reset)) return;

    if (reset) {
      setRefreshing(true);
      setPosts([]);
      setPage(0);
      setHasNext(true);
    } else if (nextPage === 0) {
      setInitialLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = { page: nextPage, size: 10, sort: sortParam ?? sort, _t: Date.now() };
      let res;

      const p = route.params;
      const { selectedEffects, selectedBrandIds, selectedRegionIds } = useFilterStore.getState();

      if (__DEV__) {
        console.log('[Filter Select]', JSON.stringify(useFilterStore.getState(), null, 2));
      }

      const hasActiveFilters = Object.keys(selectedEffects).some(key => selectedEffects[key].length > 0);

      if (hasActiveFilters) {
        // 필터가 적용된 경우
        const filterParams = convertToFilterParams(selectedEffects, selectedBrandIds, selectedRegionIds, params);
        res = await getFilterProductList(filterParams);
      } else if (p?.searchType === 'brand' && p.brandId) {
        res = await getBrandProductList(p.brandId, params);
      } else if (p?.searchType === 'model' && p.modelId) {
        res = await getModelProductList(p.modelId, params);
      } else if (p?.searchType === 'keyword') {
        res = await getKeywordProductList(p.keyword!, params);
      } else {
        // 기본: 전체 목록
        res = await getPostList(params);
      }

      setPosts(prev => {
        if (reset || nextPage === 0) {
          return res.posts;
        }

        // 중복 제거: 새로 받은 posts 중에서 기존에 없는 것만 추가
        const existingIds = new Set(prev.map(post => post.id));
        const newPosts = res.posts.filter(post => !existingIds.has(post.id));

        return [...prev, ...newPosts];
      });
      setTotalCount(res.totalCount);

      setPage(res.currentPage + 1);
      setHasNext(res.currentPage < res.pageCount - 1);

      // 스크롤 위치 복원
      if (shouldPreserveScroll && flatListRef.current && scrollPosition > 0 && nextPage === 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: scrollPosition, animated: false });
          setShouldPreserveScroll(false);
        }, 100);
      }
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
      setInitialLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPosts(0, true);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts(0);
  }, []);

  const {
    getFilteredEffects,
    setSelectedEffect,
    resetSelectedEffects,
    filterVersion,
    selectedEffects,
    selectedBrandIds,
    selectedRegionIds,
  } = useFilterStore();
  const filtered = getFilteredEffects();

  const lastRouteParamsRef = useRef(route.params);
  const lastSortRef = useRef(sort);

  useFocusEffect(
    useCallback(() => {
      const currentParams = route.params;
      const currentSort = sort;

      // 매개변수나 정렬이 변경된 경우에만 새로고침
      const paramsChanged = JSON.stringify(lastRouteParamsRef.current) !== JSON.stringify(currentParams);
      const sortChanged = lastSortRef.current !== currentSort;

      if (paramsChanged || sortChanged) {
        setPosts([]);
        setTotalCount(0);
        fetchPosts(0, true);
        setShouldPreserveScroll(false);
      } else {
        // 매물 상세에서 돌아온 경우 스크롤 위치 보존
        setShouldPreserveScroll(true);
        if (posts.length === 0) {
          fetchPosts(0, true);
        }
      }

      lastRouteParamsRef.current = currentParams;
      lastSortRef.current = currentSort;
    }, [sort, route.params, posts.length]),
  );

  // 필터 적용 상태 변화 감지
  useEffect(() => {
    if (filterVersion > 0) {
      setPosts([]);
      setTotalCount(0);
      setShouldPreserveScroll(false);
      fetchPosts(0, true);
    }
  }, [filterVersion]);

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

    const updatePosts = (id: number, newIsLiked: boolean) => {
      setPosts(prev =>
        prev.map(item =>
          item.id === id
            ? { ...item, isLiked: newIsLiked, likeCount: Math.max(0, item.likeCount + (newIsLiked ? 1 : -1)) }
            : item,
        ),
      );
    };

    return (
      <View style={[styles.cardSectionGap, { paddingBottom: semanticNumber.spacing[12] }]}>
        <MerchandiseCard
          onPressCard={() => {
            setShouldPreserveScroll(true);
            navigation.navigate('ExploreStack', {
              screen: 'MerchandiseDetailPage',
              params: { id: item.id },
            });
          }}
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

  const cameFromSearch = Boolean(route.params?.searchType);

  useEffect(() => {
    const p = route.params;
    if (!p?.searchType) return;

    // 검색으로 넘어온 경우 필터 초기화
    resetSelectedEffects();

    if (p.searchType === 'keyword') {
      setSearchText(p.keyword ?? '');
      setHeaderMode('none');
      setHeaderBrandName(undefined);
      setHeaderKorBrandName(undefined);
      setHeaderModelName(undefined);
      setHeaderBrandId(undefined);
      setHeaderModelId(undefined);

      // GET /api/v1/search/posts?keyword
    }
    if (p.searchType === 'brand') {
      setSearchText(p.brandName ?? '');
      setHeaderMode('brand');
      setHeaderBrandName(p.brandName);
      setHeaderKorBrandName(p.brandKorName);
      setHeaderBrandId(p.brandId);
      setHeaderModelName(undefined);
      setHeaderModelId(undefined);

      // GET /api/v1/search/posts/brand/${p.brandId}
    }
    if (p.searchType === 'model') {
      setSearchText(p.modelName ?? '');
      setHeaderMode('model');
      setHeaderModelName(p.modelName);
      setHeaderModelId(p.modelId);
      setHeaderBrandName(p.brandName);
      setHeaderKorBrandName(p.brandKorName);
      setHeaderBrandId(p.brandId);

      // GET /api/v1/search/posts/model/${p.modelId}
    }
  }, [route.params]);

  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => {
        setToastVisible(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [toastKey]);

  const handleRemoveFilter = (category: string, value: string) => {
    if (category === '지역') {
      // 지역의 경우 실제 store에 저장된 원본 값을 찾아서 제거
      const regionValues = selectedEffects['지역'] || [];
      const originalValue = regionValues.find(regionValue => {
        if (regionValue === '전체') return value === '전체';

        // 새로운 형태: "시도명|시군구명|sidoId-sigunguId"
        if (regionValue.includes('|')) {
          const parts = regionValue.split('|');
          if (parts.length === 3) {
            const [sidoName, sigunguName] = parts;
            const displayValue = sigunguName.startsWith(sidoName) ? sigunguName : `${sidoName} ${sigunguName}`;
            return displayValue === value;
          }
        }

        return regionValue === value;
      });

      if (originalValue) {
        setSelectedEffect(category, originalValue);
      }
    } else if (category === '브랜드') {
      // 브랜드의 경우 setSelectedBrand로 제거
      const { setSelectedBrand } = useFilterStore.getState();
      setSelectedBrand(value, null);
    } else if (category === '가격') {
      // 가격은 단일 선택이므로 null로 초기화
      setSelectedEffect(category, null);
    } else {
      setSelectedEffect(category, value);
    }

    // 필터 제거 후 상태 확인하여 목록 새로고침
    setTimeout(() => {
      const { selectedEffects: updatedEffects } = useFilterStore.getState();
      const hasFilters = Object.keys(updatedEffects).some(key => updatedEffects[key].length > 0);

      setPosts([]);
      setTotalCount(0);
      setShouldPreserveScroll(false);

      // 필터가 모두 제거된 경우 기본 목록 조회, 아니면 필터 적용 조회
      fetchPosts(0, true);
    }, 0);
  };

  const handleResetFilter = () => {
    resetSelectedEffects();
  };

  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
  }, [insets.top, insets.bottom, insets.left, insets.right]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <TitleMainHeader
        title="둘러보기"
        rightChilds={
          cameFromSearch
            ? undefined
            : [
                {
                  icon: (
                    <IconAdjust
                      width={28}
                      height={28}
                      stroke={semanticColor.icon.primary}
                      strokeWidth={semanticNumber.stroke.bold}
                    />
                  ),
                  onPress: isAndroid
                    ? () => navigation.navigate('CommonStack', { screen: 'AosBottomSheet', params: { title: '필터' } })
                    : openSheet,
                },
              ]
        }
      />
      {cameFromSearch ? (
        <View style={styles.searchBarWrapper}>
          <TouchableOpacity style={styles.touchField} onPress={() => navigation.goBack()}>
            <IconChevronLeft
              width={28}
              height={28}
              stroke={semanticColor.icon.primary}
              strokeWidth={semanticNumber.stroke.bold}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: semanticColor.surface.white }}
            onPress={() => navigation.goBack()}>
            <SearchField
              size="small"
              placeholder="어떤 악기를 찾고 있나요?"
              inputText={searchText}
              setInputText={setSearchText}
              onPress={() => navigation.goBack()}
              isNavigate
            />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.searchContainer}
          activeOpacity={1}
          onPress={() => {
            navigation.navigate('ExploreStack', { screen: 'ExploreSearchPage' });
          }}>
          <SearchField
            size="small"
            placeholder="어떤 악기를 찾고 있나요?"
            inputText={searchText}
            setInputText={setSearchText}
            onPress={() => {
              navigation.navigate('ExploreStack', { screen: 'ExploreSearchPage' });
            }}
            isNavigate
          />
        </TouchableOpacity>
      )}
      {filtered.length > 0 && (
        <View style={styles.selectedSection}>
          <ScrollView
            onScroll={handleScroll}
            scrollEventThrottle={16}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.buttonGroup}>
            {filtered.map(({ category, value }, idx) => (
              <VariantButton
                key={`${category}-${value}-${idx}`}
                theme="sub"
                onPress={() => handleRemoveFilter(category, value)}>
                <View style={styles.filterButton}>
                  <Text>{value}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFilter(category, value)} hitSlop={8}>
                    <IconX
                      width={16}
                      height={16}
                      stroke={semanticColor.icon.buttonSub}
                      strokeWidth={semanticNumber.stroke.bold}
                    />
                  </TouchableOpacity>
                </View>
              </VariantButton>
            ))}
          </ScrollView>

          <View style={styles.rightGroup}>
            <TouchableOpacity style={styles.button} onPress={handleResetFilter}>
              <IconReload
                width={20}
                height={20}
                stroke={semanticColor.icon.tertiary}
                strokeWidth={semanticNumber.stroke.medium}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={posts}
        extraData={posts}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContainer}
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
            <ProductListBar
              count={totalCount}
              loading={initialLoading || refreshing}
              onChangeSort={value => {
                setSort(value);
                fetchPosts(0, true, value);
              }}
              isHidden
            />
            {headerMode === 'brand' && (
              <View style={{ paddingBottom: semanticNumber.spacing[20] }}>
                <BrandContainerCard
                  brand={headerBrandName ?? ''}
                  korBrandName={headerKorBrandName ?? undefined}
                  onPress={() =>
                    navigation.navigate('ExploreStack', {
                      screen: 'BrandPage',
                      params: {
                        id: headerBrandId!,
                        brandName: headerBrandName,
                        brandKorName: headerKorBrandName ?? undefined,
                      },
                    })
                  }
                />
              </View>
            )}
            {headerMode === 'model' && (
              <>
                <View
                  style={{ paddingHorizontal: semanticNumber.spacing[16], paddingBottom: semanticNumber.spacing[20] }}>
                  <ModelCard
                    brand={headerBrandName ?? ''}
                    modelName={headerModelName ?? ''}
                    category="이펙터"
                    onPress={() =>
                      navigation.navigate('ExploreStack', {
                        screen: 'ModelPage',
                        params: {
                          id: headerModelId!,
                          modelName: headerModelName,
                          brandId: headerBrandId,
                          brandName: headerBrandName,
                          brandKorName: headerKorBrandName ?? undefined,
                          category: '이펙터',
                        },
                      })
                    }
                  />
                </View>
              </>
            )}
          </>
        }
        ListEmptyComponent={
          isLoading ? (
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
      {!cameFromSearch && (
        <Floatingbutton
          isContent={isContent}
          onPress={() =>
            profile?.userId
              ? profile.verified
                ? navigation.navigate('HomeStack', { screen: 'UploadIndexPage', params: { origin: 'Explore' } })
                : setVerifyModal(true)
              : setLoginModal(true)
          }
        />
      )}

      <BottomSheet visible={sheetVisible} title="필터" onClose={closeSheet} />
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
          navigation.reset({ index: 0, routes: [{ name: 'AuthStack', params: { screen: 'Welcome' } }] });
        }}
        titleText="로그인/회원가입이 필요해요."
        visible={loginModal}
        buttonTheme="brand"
        noDescription
        titleIcon={<EmojiGrinningface width={24} height={24} />}
      />
      <Modal
        mainButtonText="본인인증 하러 가기"
        onClose={() => setVerifyModal(false)}
        onMainPress={() => {
          setVerifyModal(false);
          navigation.navigate('CertificationStack', { screen: 'Certification', params: { origin: 'common' } });
        }}
        titleText="본인인증하고 거래를 즐겨보세요!"
        visible={verifyModal}
        buttonTheme="brand"
        descriptionText={`본인인증하시면 거래 기능이 모두 활성화되고,\n신뢰를 높이는 인증 배지도 받을 수 있어요.`}
        titleIcon={<EmojiGrinningface width={24} height={24} />}
      />
      {!ready && (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: semanticColor.surface.white }]}
          pointerEvents="none"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  searchBarWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: semanticNumber.spacing[2],
    paddingRight: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[8],
  },
  touchField: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  searchContainer: {
    backgroundColor: semanticColor.surface.white,
    paddingVertical: semanticNumber.spacing[4],
    paddingHorizontal: semanticNumber.spacing[16],
  },
  scrollContainer: {
    paddingBottom: 60,
  },
  cardSectionGap: {
    gap: semanticNumber.spacing[12],
  },
  selectedSection: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: semanticNumber.spacing[16],
    paddingRight: semanticNumber.spacing[8],
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: semanticNumber.spacing[6],
    alignItems: 'center',
  },
  filterButton: {
    height: 24,
    flexDirection: 'row',
    gap: semanticNumber.spacing[4],
    alignItems: 'center',
  },
  rightGroup: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: semanticNumber.spacing[4],
    borderRadius: semanticNumber.borderRadius.md,
    backgroundColor: semanticColor.button.subEnabled,
  },
});

export default ExplorePage;
