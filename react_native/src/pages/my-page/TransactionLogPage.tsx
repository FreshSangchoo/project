import CenterHeader from '@/components/common/header/CenterHeader';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { useEffect, useState } from 'react';
import { semanticFont } from '@/styles/semantic-font';
import ProductListBar from '@/components/common/array-bar/ProductListBar';
import MerchandiseCard, { MerchandiseCardProps } from '@/components/common/merchandise-card/MerchandiseCard';
import NoResultSection from '@/components/common/NoResultSection';
import VariantButton from '@/components/common/button/VariantButton';
import EmojiGuitar from '@/assets/icons/EmojiGuitar.svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionBottomSheet, { ActionItem } from '@/components/common/bottom-sheet/ActionBottomSheet';
import {
  merchandiseDetailSellingItems,
  merchandiseDetailCompletedItems,
  merchandiseDetailReservedItems,
  myHiddenItems,
  PressAction,
} from '@/constants/bottom-sheet/ActionBottomSheetItems';
import { merchandiseToCard } from '@/utils/merchandiseToCard';
import MerchandiseCardSkeleton from '@/components/common/merchandise-card/MerchandiseCardSkeleton';
import useMyPostsApi from '@/hooks/apis/useMyPostsApi';
import { SortValue } from '@/components/common/bottom-sheet/SortBottomSheet';
import useMyNavigation from '@/hooks/navigation/useMyNavigation';
import usePostsApi from '@/hooks/apis/usePostApi';
import Modal from '@/components/common/modal/Modal';
import EmojiNoEntry from '@/assets/icons/EmojiNoEntry.svg';
import usePostLikeApi from '@/hooks/apis/usePostLikeApi';
import EmojiGrinningface from '@/assets/icons/EmojiGrinningface.svg';
import useCertificationNavigation from '@/hooks/navigation/useCertificationNavigation';
import { useUserStore } from '@/stores/userStore';

function TransactionLogPage() {
  const navigation = useMyNavigation();
  const certificationNavigation = useCertificationNavigation();
  const [currentTab, setCurrentTab] = useState('판매 중');
  const [transactionList, setTransactionList] = useState<MerchandiseCardProps[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [hasNext, setHasNext] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState<SortValue>('latest');
  const [sortLabel, setSortLabel] = useState('최신순');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { getSellingList, getSoldList, getHiddenList } = useMyPostsApi();

  const [stateChangeSheet, setStateChangeSheet] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);
  const [sheetItems, setSheetItems] = useState<ActionItem[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const { changePostStatus, visibilityPost, deletePost } = usePostsApi();

  const { postPostLike, deletePostLike } = usePostLikeApi();
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<number>>(new Set());
  const [verifyModal, setVerifyModal] = useState<boolean>(false);
  const profile = useUserStore(p => p.profile);

  const currentTitle =
    currentTab === '판매 중'
      ? '판매 중인 악기가 없어요.'
      : currentTab === '판매 완료'
      ? '아직 판매한 악기가 없어요.'
      : '숨긴 악기가 없어요.';

  // 좋아요 누르기
  const pressLike = async (id: number, nextLiked: boolean) => {
    if (pendingLikeIds.has(id)) return;
    setPendingLikeIds(prev => new Set(prev).add(id));

    const prevList = transactionList;
    setTransactionList(current =>
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
      setTransactionList(prevList);
    } finally {
      setPendingLikeIds(prev => {
        const set = new Set(prev);
        set.delete(id);
        return set;
      });
    }
  };

  // Tab 선택 시 매물 리스트 불러오기
  const loadPage = async (targetPage: number, mode: 'reset' | 'append') => {
    if (mode === 'append') setLoadingMore(true);
    if (mode === 'reset') setLoadingInitial(true);

    try {
      const selectAPI =
        currentTab === '판매 중' ? getSellingList : currentTab === '판매 완료' ? getSoldList : getHiddenList;

      const { posts, totalCount, currentPage, pageCount } = await selectAPI({
        page: targetPage,
        size,
        sort,
      });

      const mapped = posts.map(merchandiseToCard);

      if (mode === 'reset') {
        setTransactionList(mapped);
      } else {
        setTransactionList(prev => [...prev, ...mapped]);
      }

      setTotalCount(totalCount);
      setPage(currentPage);
      setHasNext(currentPage + 1 < pageCount);
    } catch (error) {
      console.error('[loadPage] error', error);
      if (mode === 'reset') {
        setTransactionList([]);
        setTotalCount(0);
        setHasNext(false);
      }
    } finally {
      if (mode === 'append') setLoadingMore(false);
      if (mode === 'reset') setLoadingInitial(false);
    }
  };

  const SkeletonList = () => (
    <View style={{ paddingBottom: 60 }}>
      <View>
        <MerchandiseCardSkeleton />
        <MerchandiseCardSkeleton />
        <MerchandiseCardSkeleton />
      </View>
    </View>
  );

  useEffect(() => {
    setTransactionList([]);
    setPage(0);
    setHasNext(true);
    setTotalCount(0);
    loadPage(0, 'reset');
  }, [currentTab, sort]);

  // 새로고침
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPage(0, 'reset');
    } finally {
      setRefreshing(false);
    }
  };

  // 내역 더불러오기
  const onEndReached = () => {
    if (!hasNext || loadingMore || loadingInitial || refreshing) return;
    loadPage(page + 1, 'append');
  };

  // 상태 변경 API 실행 후 새로고침
  const runAndRefresh = async (run: () => Promise<any>) => {
    try {
      await run();
    } catch (e) {
      console.error('[action] error', e);
    } finally {
      setStateChangeSheet(false);
      setCurrentPostId(null);
      await loadPage(0, 'reset');
    }
  };

  // 상태 변경 액션
  const makePress = (postId: number): PressAction => ({
    setSoldOut: () => {
      void runAndRefresh(() => changePostStatus(postId, 'SOLD_OUT'));
    },
    setOnSale: () => {
      void runAndRefresh(() => changePostStatus(postId, 'ON_SALE'));
    },
    setReserved: () => {
      void runAndRefresh(() => changePostStatus(postId, 'RESERVED'));
    },
    edit: () => {
      setStateChangeSheet(false);
      navigation.navigate('UploadModelPage', {
        origin: 'My',
        mode: 'edit',
        postId,
      });
    },
    bump: () => {
      setStateChangeSheet(false);
      const card = transactionList.find(p => p.id === postId);
      navigation.navigate('PullUpPage', {
        postId,
        card,
        onDone: async () => {
          await loadPage(0, 'reset');
        },
      });
    },
    hide: () => {
      void runAndRefresh(() => visibilityPost(postId));
    },
    remove: () => {
      setStateChangeSheet(false);
      setShowDeleteModal(true);
    },
  });

  const pressChangeState = (item: MerchandiseCardProps) => {
    const currentItem =
      currentTab === '판매 중'
        ? item.saleStatus === 'RESERVED'
          ? merchandiseDetailReservedItems
          : merchandiseDetailSellingItems
        : currentTab === '판매 완료'
        ? merchandiseDetailCompletedItems
        : myHiddenItems;

    setCurrentPostId(item.id!);
    setSheetItems(currentItem(makePress(item.id!)));
    setStateChangeSheet(true);
  };

  return (
    <SafeAreaView style={styles.transactionLogPage} edges={['top']}>
      <CenterHeader
        title="거래 내역"
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
      <View style={styles.segmentedTabBar}>
        <TouchableOpacity
          onPress={() => {
            setCurrentTab('판매 중'), setSort('latest'), setSortLabel('최신순');
          }}
          style={[styles.segmentedTabBarItem, currentTab === '판매 중' && styles.currentTab]}>
          <Text style={[styles.segmentedTabBarText, currentTab === '판매 중' && styles.currentTabText]}>판매 중</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setCurrentTab('판매 완료'), setSort('latest'), setSortLabel('최신순');
          }}
          style={[styles.segmentedTabBarItem, currentTab === '판매 완료' && styles.currentTab]}>
          <Text style={[styles.segmentedTabBarText, currentTab === '판매 완료' && styles.currentTabText]}>
            판매 완료
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setCurrentTab('숨김'), setSort('latest'), setSortLabel('최신순');
          }}
          style={[styles.segmentedTabBarItem, currentTab === '숨김' && styles.currentTab]}>
          <Text style={[styles.segmentedTabBarText, currentTab === '숨김' && styles.currentTabText]}>숨김</Text>
        </TouchableOpacity>
      </View>

      <ProductListBar key={currentTab} count={totalCount} onChangeSort={value => setSort(value)} />
      {loadingInitial && transactionList.length === 0 ? (
        <SkeletonList />
      ) : transactionList.length === 0 ? (
        <View>
          <NoResultSection
            emoji={<EmojiGuitar width={28} height={28} />}
            title={currentTitle}
            description="판매할 악기를 등록해 보실래요?"
            button={
              <VariantButton
                children="악기 등록하러 가기"
                onPress={() => {
                  if (profile?.verified) navigation.navigate('UploadIndexPage', { origin: 'My' });
                  else setVerifyModal(true);
                }}
                isLarge
                theme="sub"
              />
            }
          />
        </View>
      ) : (
        <FlatList
          data={transactionList}
          keyExtractor={(item, index) => `${item.brandName}-${item.modelName}-${item.createdAt}-${index}`}
          renderItem={({ item }) => (
            <View>
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
              <View style={styles.buttonWrapper}>
                <VariantButton children="상태 변경" onPress={() => pressChangeState(item)} isFull theme="sub" />
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 60 }}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListFooterComponent={
            loadingMore ? (
              <View>
                <MerchandiseCardSkeleton />
              </View>
            ) : null
          }
        />
      )}
      <ActionBottomSheet
        items={sheetItems}
        onClose={() => {
          setStateChangeSheet(false);
          setCurrentPostId(null);
        }}
        visible={stateChangeSheet}
        isSafeArea
      />
      <Modal
        mainButtonText="삭제하기"
        onClose={() => setShowDeleteModal(false)}
        onMainPress={() => {
          runAndRefresh(() => deletePost(currentPostId!));
          setShowDeleteModal(false);
        }}
        titleText="게시글을 삭제하시겠어요?"
        visible={showDeleteModal}
        buttonTheme="critical"
        descriptionText="삭제하시면 복구가 불가능해요."
        titleIcon={<EmojiNoEntry width={24} height={24} />}
      />
      <Modal
        mainButtonText="본인인증 하러 가기"
        onClose={() => setVerifyModal(false)}
        onMainPress={() => {
          setVerifyModal(false);
          certificationNavigation.navigate('Certification', { origin: 'common' });
        }}
        titleText="본인인증하고 거래를 즐겨보세요!"
        visible={verifyModal}
        buttonTheme="brand"
        descriptionText={`본인인증하시면 거래 기능이 모두 활성화되고,\n신뢰를 높이는 인증 배지도 받을 수 있어요.`}
        titleIcon={<EmojiGrinningface width={24} height={24} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  transactionLogPage: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  segmentedTabBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: semanticColor.border.medium,
    borderBottomWidth: semanticNumber.stroke.xlight,
  },
  segmentedTabBarItem: {
    width: '33%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentTab: {
    borderBottomColor: semanticColor.border.dark,
    borderBottomWidth: semanticNumber.stroke.bold,
  },
  segmentedTabBarText: {
    ...semanticFont.body.large,
    color: semanticColor.text.secondary,
  },
  currentTabText: {
    ...semanticFont.body.largeStrong,
    color: semanticColor.text.primary,
  },
  buttonWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[4],
  },
});

export default TransactionLogPage;
