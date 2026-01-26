import { useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';
import useExploreNavigation, { ExploreStackParamList } from '@/hooks/navigation/useExploreNavigation';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import 'react-native-gesture-handler';
import { BlurView } from '@react-native-community/blur';
import ButtonTitleHeader from '@/components/common/header/ButtonTitleHeader';
import MerchandiseDetailSkeleton from '@/components/explore/MerchandiseDetailSkeleton';
import VariantButton from '@/components/common/button/VariantButton';
import ModelCard from '@/components/common/model-card/ModelCard';
import Chip from '@/components/common/Chip';
import SellerUserCard from '@/components/common/user-card/SellerUserCard';
import NotUserCard from '@/components/common/user-card/NotUserCard';
import CustomerService from '@/components/common/CustomerService';
import SectionSeparator from '@/components/common/SectionSeparator';
import LegalNoticeContainer from '@/components/common/legal-notice-container/LegalNoticeContainer';
import Toast from '@/components/common/toast/Toast';
import Modal from '@/components/common/modal/Modal';
import MerchandiseImageViewer from '@/components/explore/MerchandiseImageViewer';
import ActionBottomSheet, { ActionItem } from '@/components/common/bottom-sheet/ActionBottomSheet';
import {
  merchandiseDetailReportOnlyItems,
  merchandiseDetailReservedItems,
  merchandiseDetailSellingItems,
  merchandiseDetailCompletedItems,
} from '@/constants/bottom-sheet/ActionBottomSheetItems';
import { PressAction, ReportAction } from '@/constants/bottom-sheet/ActionBottomSheetItems';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import IconUpload from '@/assets/icons/IconUpload.svg';
import IconDotsVertical from '@/assets/icons/IconDotsVertical.svg';
import IconHeart from '@/assets/icons/IconHeart.svg';
import IconHeartFilled from '@/assets/icons/IconHeartFilled.svg';
import IconEye from '@/assets/icons/IconEye.svg';
import IconClock from '@/assets/icons/IconClock.svg';
import IconUrgentFilled from '@/assets/icons/IconUrgentFilled.svg';
import IconMessageCircle from '@/assets/icons/IconMessageCircle.svg';
import EmojiPackage from '@/assets/icons/EmojiPackage.svg';
import IconExchange from '@/assets/icons/EmojiCounterclockwiseArrowsButton.svg';
import IconCustom from '@/assets/icons/EmojiWrench.svg';
import IconParts from '@/assets/icons/EmojiNutAndBolt.svg';
import EmojiNoEntry from '@/assets/icons/EmojiNoEntry.svg';
import EmojiGrinningface from '@/assets/icons/EmojiGrinningface.svg';
import { MerchandiseData } from '@/types/merchandise.types';
import usePostsApi from '@/hooks/apis/usePostApi';
import { useUserStore } from '@/stores/userStore';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { ensureChannelBoot, openReport } from '@/libs/channel';
import useChatApi from '@/hooks/apis/useChatApi';
import { detaileToCard } from '@/utils/merchandiseToCard';
import AlertToast from '@/components/common/toast/AlertToast';
import { useLikeHandler } from '@/hooks/useLikeHandler';
import useChatPush from '@/hooks/useChatPush';
import { logViewContentEvent } from '@/utils/initializeFacebook';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isAndroid = Platform.OS === 'android';
type ModalKind =
  | 'none'
  | 'chatting'
  | 'related'
  | 'self'
  | 'selfReport'
  | 'withdrawn'
  | 'guest'
  | 'verify'
  | 'notFound';

const MerchandiseDetailPage = () => {
  const navigation = useExploreNavigation();
  const rootNavigation = useRootNavigation();
  const route = useRoute<RouteProp<ExploreStackParamList, 'MerchandiseDetailPage'>>();
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const { getPostDetail, changePostStatus, visibilityPost, deletePost } = usePostsApi();
  const { profile } = useUserStore();
  const { toggleLike, toastMessage, toastImage, toastVisible, toastKey, setToastVisible } = useLikeHandler();
  const { postChannelFromPost } = useChatApi();
  const { registerChannelPush } = useChatPush(undefined, { auto: false });

  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [modalKind, setModalKind] = useState<ModalKind>('none');
  const [actionBottomSheet, setActionBottomSheet] = useState(false);
  const [sheetItems, setSheetItems] = useState<any[]>([]);
  const [isDirectTradeWrapped, setIsDirectTradeWrapped] = useState(false);
  const goLogin = useUserStore(c => c.clearProfile);

  const openModal = (kind: ModalKind) => setModalKind(kind);
  const closeModal = () => setModalKind('none');
  const closeModalGuest = () => {
    setModalKind('none');
    goLogin();
    rootNavigation.reset({ index: 0, routes: [{ name: 'AuthStack', params: { screen: 'Welcome' } }] });
  };

  const updateMerch = (id: number, newIsLiked: boolean) => {
    setMerch(prev => {
      if (!prev) return prev;
      const nextLikeCount = Math.max(0, prev.likeCount + (newIsLiked ? 1 : -1));
      return { ...prev, isLiked: newIsLiked, likeCount: nextLikeCount };
    });
  };

  // 1) 데이터
  const [merch, setMerch] = useState<MerchandiseData | null>(null);

  const fetchDetail = async () => {
    try {
      const data = await getPostDetail(id); // id로 상세 조회
      setMerch(data); // 받아온 데이터 저장

      // Facebook 상품 조회 이벤트 추적
      if (data) {
        logViewContentEvent(
          String(data.id),
          data.title,
          data.price,
          'KRW'
        );
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[MerchandiseDetailPage] getPostDetail error: ', error);
      }
      if (error?.response?.status === 404) {
        openModal('notFound');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2) 예시 응답을 useFocusEffect로 주입
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchDetail();
    }, [id]),
  );

  // 3) 상단 배지 문구
  const productStateText =
    merch?.saleStatus === 'RESERVED'
      ? '예약 중인 상품이에요'
      : merch?.saleStatus === 'SOLD_OUT'
      ? '판매 완료된 상품이에요'
      : null;

  // 4) 칩 생성 로직
  const chipItems = (() => {
    if (!merch) return [];
    const arr: Array<{ text: string; variant?: 'condition' | 'brand'; icon?: ReactNode }> = [];

    // 상태
    if (merch.condition === 'NEW') arr.push({ text: '신품', variant: 'condition' });

    // 지역 (직거래 가능일 때만)
    if (merch.localDealAvailable && merch.regions?.length) {
      merch.regions.forEach(r => arr.push({ text: r }));
    }

    // 택배 가능
    if (merch.deliveryAvailable) {
      arr.push({ text: '택배가능', variant: 'brand', icon: <EmojiPackage width={16} height={16} /> });
    }

    // 교환 가능
    if (merch.exchangeAvailable) {
      arr.push({ text: '교환가능', icon: <IconExchange width={16} height={16} /> });
    }

    // 커스텀
    if (merch.custom) {
      arr.push({ text: '커스텀', icon: <IconCustom width={16} height={16} /> });
    }

    // 부품교체
    if (merch.partChange) {
      arr.push({ text: '부품교체', icon: <IconParts width={16} height={16} /> });
    }

    return arr;
  })();

  // 5) 이미지/뷰어
  const images = merch?.postImages?.length ? merch.postImages : [''];

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const priceText = merch ? Number(merch.price).toLocaleString() + '원' : '-';
  const createdAgo = merch ? formatTimeAgo(merch.createdAt) : '';

  // 작성자가 본인인지
  const isWriterSelf = merch ? merch.writer.userId === profile?.userId : false;

  // 탈퇴한 유저인지
  const isWriterWithdrawn = merch?.writer?.withdrawn ?? false;

  // 바텀시트
  const runAndRefresh = async (run: () => Promise<any>) => {
    try {
      await run();
      await fetchDetail(); // 상세 다시 불러오기
    } catch (e) {
      if (__DEV__) {
        console.error('[action] error', e);
      }
    } finally {
      setActionBottomSheet(false);
    }
  };

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
      setActionBottomSheet(false);
      rootNavigation.navigate('MyStack', {
        screen: 'UploadModelPage',
        params: {
          origin: 'Detail',
          mode: 'edit',
          postId,
        },
      });
    },
    bump: () => {
      setActionBottomSheet(false);
      const card = detaileToCard(merch!);
      rootNavigation.navigate('MyStack', {
        screen: 'PullUpPage',
        params: {
          postId,
          card,
          onDone: async () => {
            await fetchDetail();
          },
        },
      });
    },
    hide: () => {
      navigation.goBack();
      visibilityPost(postId);
    },
    remove: () => {
      navigation.goBack();
      deletePost(postId);
    },
  });

  const makeReportPress = (): ReportAction => ({
    report: () => {
      onPressInquiry();
    },
  });

  const bottomSheetItems: ActionItem[] = (() => {
    if (!merch) return merchandiseDetailReportOnlyItems(makeReportPress());

    if (isWriterSelf) {
      if (merch.saleStatus === 'ON_SALE') return merchandiseDetailSellingItems(makePress(merch.id));
      if (merch.saleStatus === 'RESERVED') return merchandiseDetailReservedItems(makePress(merch.id));
      if (merch.saleStatus === 'SOLD_OUT') return merchandiseDetailCompletedItems(makePress(merch.id));
    }

    return merchandiseDetailReportOnlyItems(makeReportPress());
  })();

  const handleChatPress = () => {
    if (isWriterWithdrawn) {
      openModal('withdrawn');
      return;
    }
    if (isWriterSelf) {
      openModal('self');
      return;
    }
    if (!profile?.userId) {
      openModal('guest');
      return;
    }
    if (!profile.verified) {
      openModal('verify');
      return;
    }
    openModal('chatting');
  };

  useEffect(() => {
    if (!toastVisible) return;
    const id = setTimeout(() => setToastVisible(false), 1000);
    return () => clearTimeout(id);
  }, [toastVisible, toastKey]);

  // 채널톡
  const onPressInquiry = async () => {
    try {
      await ensureChannelBoot({ name: profile?.name, mobileNumber: profile?.phone });
      openReport();
    } catch (error) {
      if (__DEV__) {
        console.log('[SupportContainer][onPressInquiry] error: ', error);
      }
    }
  };

  // 채팅하기
  const onPressChat = async () => {
    closeModal();
    try {
      const { channelId, reused, createdAt, updatedAt } = await postChannelFromPost(merch!.id);
      const isNew = reused === false || (reused === undefined && createdAt && updatedAt && createdAt === updatedAt);

      if (isNew) {
        try {
          await registerChannelPush(channelId);
        } catch (e) {
          if (__DEV__) {
            console.log('[onPressChat] registerChannelPush error', e);
          }
        }
      }
      rootNavigation.navigate('ChatStack', {
        screen: 'ChattingRoomPage',
        params: {
          channelId: channelId,
          nickname: merch!.writer.nickname,
          post: {
            id: merch!.id,
            brandName: merch!.modelResponse.brandName,
            modelName: merch!.modelResponse.modelName,
            price: Number(merch!.price),
            thumbnail: merch!.postImages?.[0] ?? '',
          },
          targetUserId: merch!.writer.userId,
        },
      });
    } catch (error) {
      if (__DEV__) {
        console.log('[MerchandiseDetailPage][onPressChat] error ', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ButtonTitleHeader
        title="매물 상세"
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
          // TO-DO: 공유하기 기능 추후 활성화
          // {
          //   icon: (
          //     <IconUpload
          //       width={28}
          //       height={28}
          //       stroke={semanticColor.icon.primary}
          //       strokeWidth={semanticNumber.stroke.bold}
          //     />
          //   ),
          //   onPress: () => {},
          // },
          {
            icon: (
              <IconDotsVertical
                width={28}
                height={28}
                stroke={semanticColor.icon.primary}
                strokeWidth={semanticNumber.stroke.bold}
              />
            ),
            onPress: () => {
              setActionBottomSheet(true);
            },
          },
        ]}
      />
      {isLoading || !merch ? (
        <MerchandiseDetailSkeleton />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.infoSectionGroup}>
            <View style={styles.imageWrap}>
              {productStateText && (
                <View style={styles.stateCard}>
                  <Text style={styles.stateText}>{productStateText}</Text>
                </View>
              )}

              <FlatList
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, idx) => String(idx)}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      setViewerIndex(index);
                      setViewerVisible(true);
                    }}>
                    <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
                  </TouchableOpacity>
                )}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              />

              {Platform.OS === 'ios' ? (
                <View style={styles.photoCountContainer} pointerEvents="none">
                  <View style={styles.photoCountItem} pointerEvents="none">
                    <BlurView
                      blurAmount={12}
                      reducedTransparencyFallbackColor={semanticColor.floating.photoCount}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.photoCountOverlay} />
                    <View style={styles.photoCountContent}>
                      <Text style={styles.photoCountActiveText}>{currentIndex + 1}</Text>
                      <Text style={styles.photoCountText}>/</Text>
                      <Text style={styles.photoCountText}>{images.length}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.photoAosCountItem} pointerEvents="none">
                  <Text style={styles.photoCountActiveText}>{currentIndex + 1}</Text>
                  <Text style={styles.photoCountText}>/</Text>
                  <Text style={styles.photoCountText}>{images.length}</Text>
                </View>
              )}
            </View>

            <View style={styles.headSection}>
              <ModelCard
                brand={merch.modelResponse.brandName}
                modelName={merch.modelResponse.modelName}
                category={merch.modelResponse.effectTypes?.join('>') || ''}
                onPress={() => openModal('related')}
                noNextButton={merch.modelResponse.isUnbrandedOrCustom}
              />

              <View style={styles.chipGroup}>
                {chipItems.map(({ text, variant, icon }) => (
                  <Chip key={text} text={text} variant={variant as any} icon={icon} size="medium" />
                ))}
              </View>

              <View style={styles.countGroup}>
                <View style={styles.countItem}>
                  <IconHeart
                    width={16}
                    height={16}
                    stroke={semanticColor.icon.lightest}
                    strokeWidth={semanticNumber.stroke.bold}
                  />
                  <Text style={styles.countText}>{merch.likeCount}</Text>
                </View>
                <View style={styles.countItem}>
                  <IconEye
                    width={16}
                    height={16}
                    stroke={semanticColor.icon.lightest}
                    strokeWidth={semanticNumber.stroke.bold}
                  />
                  <Text style={styles.countText}>{merch.viewCount}</Text>
                </View>
                <View style={styles.countItem}>
                  <IconClock
                    width={16}
                    height={16}
                    stroke={semanticColor.icon.lightest}
                    strokeWidth={semanticNumber.stroke.bold}
                  />
                  <View style={styles.timeGroup}>
                    <Text style={styles.countText}>{createdAgo}</Text>
                  </View>
                </View>
              </View>
            </View>

            <SectionSeparator type="line-with-padding" />

            <View style={styles.transactionSection}>
              <View style={styles.textSection}>
                <Text style={styles.titleText}>거래 정보</Text>
              </View>

              {/* 택배거래 */}
              <View style={styles.transactionRow}>
                <Text style={styles.transactionRowText}>택배거래</Text>
                <View style={styles.transactionRowSpace}>
                  {merch.deliveryAvailable ? (
                    <Chip text="택배가능" variant="brand" icon={<EmojiPackage width={16} height={16} />} />
                  ) : (
                    <Text style={styles.trailingText}>불가</Text>
                  )}
                </View>
              </View>

              {/* 배송비: 택배 가능일 때만 렌더링 */}
              {merch.deliveryAvailable && (
                <View style={styles.transactionRow}>
                  <Text style={styles.transactionRowText}>배송비</Text>
                  <View style={styles.transactionRowSpace}>
                    <Text style={styles.trailingText}>
                      {merch.deliveryInfoResponse?.deliveryFeeIncluded
                        ? '포함'
                        : `${Number(merch.deliveryInfoResponse?.deliveryFee || 0).toLocaleString()}원`}
                    </Text>
                  </View>
                </View>
              )}

              {/* 직거래 */}
              <View style={[styles.transactionRow, { alignItems: isDirectTradeWrapped ? 'flex-start' : 'center' }]}>
                <Text style={styles.transactionRowText}>직거래</Text>
                <View style={styles.transactionRowSpace}>
                  {merch.localDealAvailable && merch.regions.length > 0 ? (
                    <View
                      style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}
                      onLayout={event => {
                        const { height } = event.nativeEvent.layout;
                        // Chip의 기본 높이는 약 24px이므로, 높이가 32px 이상이면 줄바꿈된 것으로 판단
                        setIsDirectTradeWrapped(height > 32);
                      }}>
                      {merch.regions.map(r => (
                        <Chip key={r} text={r} />
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.trailingText}>불가</Text>
                  )}
                </View>
              </View>

              {/* 교환거래 */}
              <View style={styles.transactionRow}>
                <Text style={styles.transactionRowText}>교환거래</Text>
                <View style={styles.transactionRowSpace}>
                  <Text style={styles.trailingText}>{merch.exchangeAvailable ? '가능' : '불가'}</Text>
                </View>
              </View>
            </View>

            <SectionSeparator type="line-with-padding" />

            <View style={[styles.transactionSection, { gap: semanticNumber.spacing[12] }]}>
              <View style={styles.textSection}>
                <Text style={styles.titleText}>추가 정보</Text>
              </View>
              <View style={styles.descriptionGroup}>
                <Text style={styles.descriptionText}>{(merch.description ?? '').replace(/\\n/g, '\n')}</Text>
              </View>
            </View>

            <SectionSeparator type="line-with-padding" />

            <View style={styles.transactionSection}>
              <View style={styles.textSection}>
                <Text style={styles.titleText}>판매자 정보</Text>
              </View>
              <View style={styles.descriptionGroup}>
                {isWriterWithdrawn ? (
                  <NotUserCard />
                ) : (
                  <SellerUserCard
                    profileImage={merch.writer.profileImage}
                    nickname={merch.writer.nickname}
                    onPress={() => {
                      navigation.navigate('SellerPage', { id: merch!.writer.userId });
                    }}
                  />
                )}
              </View>
            </View>

            <View style={styles.supportSection}>
              <View style={styles.textSection}>
                <Text style={styles.titleText}>고객 지원</Text>
              </View>
              <View style={styles.descriptionGroup}>
                <CustomerService
                  infoIcon={<IconUrgentFilled width={20} height={20} fill={semanticColor.icon.secondary} />}
                  title="신고하기"
                  subTitle="사기 거래 등 부적절한 거래 및 행위"
                  isGray={false}
                  buttonIcon={
                    <IconMessageCircle
                      width={24}
                      height={24}
                      stroke={semanticColor.icon.lightest}
                      strokeWidth={semanticNumber.stroke.bold}
                    />
                  }
                  onPress={() => {
                    if (isWriterSelf) {
                      openModal('selfReport');
                    } else {
                      // 일반 신고
                      onPressInquiry();
                    }
                  }}
                />
              </View>
              <LegalNoticeContainer isExplore />
            </View>
          </ScrollView>

          <View style={[styles.toolBar, { paddingBottom: insets.bottom + semanticNumber.spacing[10] }]}>
            <View style={styles.functionGroup}>
              <TouchableOpacity
                style={[styles.touchField, { alignItems: 'center' }]}
                onPress={() => toggleLike(merch!.id, merch!.isLiked, updateMerch, profile, () => openModal('guest'))}>
                {merch?.isLiked ? (
                  <IconHeartFilled width={28} height={28} fill={semanticColor.saveButton.selected} />
                ) : (
                  <IconHeart
                    width={28}
                    height={28}
                    stroke={semanticColor.icon.primary}
                    strokeWidth={semanticNumber.stroke.bold}
                  />
                )}
              </TouchableOpacity>
              <View style={styles.divider} />
              <Text style={styles.toolPriceText}>{priceText}</Text>
            </View>
            <VariantButton isLarge disabled={merch?.saleStatus === 'SOLD_OUT'} onPress={handleChatPress}>
              채팅하기
            </VariantButton>
          </View>
        </>
      )}

      <Toast
        key={toastKey}
        visible={toastVisible}
        message={toastMessage}
        image={toastImage === 'EmojiCheckMarkButton' ? 'EmojiCheckMarkButton' : 'EmojiCrossmark'}
      />

      <MerchandiseImageViewer
        visible={viewerVisible}
        images={images}
        index={viewerIndex}
        onClose={() => setViewerVisible(false)}
        // onIndexChange={setViewerIndex}
      />

      <ActionBottomSheet
        items={bottomSheetItems}
        onClose={() => setActionBottomSheet(false)}
        visible={actionBottomSheet}
        isSafeArea
      />

      <Modal
        mainButtonText="본인인증 하러 가기"
        onClose={closeModal}
        onMainPress={() => {
          rootNavigation.navigate('CertificationStack', { screen: 'Certification', params: { origin: 'common' } });
          closeModal();
        }}
        titleText="본인인증하고 거래를 즐겨보세요!"
        visible={modalKind === 'verify'}
        buttonTheme="brand"
        descriptionText={`본인인증하시면 거래 기능이 모두 활성화되고,\n신뢰를 높이는 인증 배지도 받을 수 있어요.`}
        titleIcon={<EmojiGrinningface width={24} height={24} />}
      />
      <Modal
        visible={modalKind === 'chatting'}
        onClose={closeModal}
        titleText="채팅을 시작할까요?"
        titleIcon={<EmojiGrinningface width={24} height={24} />}
        descriptionText="자동으로 판매자와의 채팅이 시작돼요."
        mainButtonText="확인"
        subButtonText="취소"
        isRow
        onMainPress={onPressChat}
      />
      <Modal
        visible={modalKind === 'related'}
        onClose={closeModal}
        titleText="해당 모델의 다른 매물 확인하기"
        descriptionText={`${merch?.modelResponse.brandName} ${merch?.modelResponse.modelName}`}
        mainButtonText="지금 확인하기"
        subButtonText="취소"
        onMainPress={() => {
          closeModal();
          navigation.navigate('ModelPage', {
            id: merch!.modelResponse.modelId,
            modelName: merch!.modelResponse.modelName,
            brandId: merch!.modelResponse.brandId,
            brandName: merch!.modelResponse.brandName,
            brandKorName: merch!.modelResponse.brandKorName ?? undefined,
            category: merch!.modelResponse.effectTypes?.join('>') || '',
          });
        }}
      />
      <Modal
        visible={modalKind === 'self'}
        onClose={closeModal}
        titleText="본인에게는 채팅을 보낼 수 없어요."
        titleIcon={<EmojiNoEntry width={24} height={24} />}
        noDescription
        mainButtonText="확인"
        isSingle
        onMainPress={closeModal}
      />
      <Modal
        visible={modalKind === 'selfReport'}
        onClose={closeModal}
        titleText="본인을 신고할 수는 없어요."
        titleIcon={<EmojiNoEntry width={24} height={24} />}
        noDescription
        mainButtonText="확인"
        isSingle
        onMainPress={closeModal}
      />
      <Modal
        visible={modalKind === 'withdrawn'}
        onClose={closeModal}
        titleText="탈퇴한 유저입니다."
        titleIcon={<EmojiNoEntry width={24} height={24} />}
        noDescription
        mainButtonText="확인"
        isSingle
        onMainPress={closeModal}
      />
      <Modal
        visible={modalKind === 'guest'}
        onClose={closeModal}
        titleText="로그인/회원가입이 필요해요."
        titleIcon={<EmojiGrinningface width={24} height={24} />}
        noDescription
        mainButtonText="로그인/회원가입 하기"
        buttonTheme="brand"
        onMainPress={closeModalGuest}
      />
      <Modal
        visible={modalKind === 'notFound'}
        mainButtonText="확인"
        onClose={() => {
          closeModal();
          navigation.goBack();
        }}
        onMainPress={() => {
          closeModal();
          navigation.goBack();
        }}
        titleText="삭제/숨김 처리된 게시글입니다."
        isSingle
        noDescription
        titleIcon={<EmojiNoEntry width={24} height={24} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  infoSectionGroup: {
    paddingBottom: semanticNumber.spacing[10] + 52,
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    height: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  stateCard: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    zIndex: 1,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: semanticNumber.spacing[16],
    backgroundColor: semanticColor.surface.alphaBlackMedium,
  },
  stateText: {
    color: semanticColor.text.primaryOnDark,
    ...semanticFont.title.small,
  },
  photoAosCountItem: {
    position: 'absolute',
    right: semanticNumber.spacing[16],
    bottom: semanticNumber.spacing[16],
    zIndex: 1,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    paddingHorizontal: semanticNumber.spacing[8],
    gap: semanticNumber.spacing[2],
    backgroundColor: semanticColor.floating.photoCount,
    borderRadius: semanticNumber.borderRadius.full,
  },
  photoCountContainer: {
    position: 'absolute',
    right: semanticNumber.spacing[16],
    bottom: semanticNumber.spacing[16],
    zIndex: 1,
    elevation: 2,
  },
  photoCountItem: {
    position: 'relative',
    height: 24,
    paddingHorizontal: semanticNumber.spacing[8],
    borderRadius: semanticNumber.borderRadius.full,
    overflow: 'hidden',
  },
  photoCountOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  photoCountContent: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[2],
    height: 24,
  },
  photoCountActiveText: {
    color: semanticColor.text.primaryOnDark,
    ...semanticFont.caption.large,
  },
  photoCountText: {
    color: semanticColor.text.tertiaryOnDark,
    ...semanticFont.caption.large,
  },
  viewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  imageViewing: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: semanticNumber.spacing[6],
  },
  imageViewingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[2],
  },
  imageViewingText: {
    color: semanticColor.text.tertiary,
    ...semanticFont.caption.large,
  },
  touchField: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  toolBar: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    zIndex: 5,
    paddingTop: semanticNumber.spacing[10],
    // paddingBottom: isAndroid ? semanticNumber.spacing[10] : semanticNumber.spacing[36],
    paddingHorizontal: semanticNumber.spacing[16],
    borderTopColor: semanticColor.border.medium,
    borderTopWidth: semanticNumber.stroke.hairline,
    backgroundColor: semanticColor.surface.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  functionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[16],
  },
  divider: {
    width: semanticNumber.stroke.light,
    height: 20,
    backgroundColor: semanticColor.border.strong,
  },
  toolPriceText: {
    color: semanticColor.text.primary,
    ...semanticFont.title.large,
  },
  headSection: {
    paddingTop: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[32],
    paddingHorizontal: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[16],
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: semanticNumber.spacing[8],
  },
  countGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[12],
    height: 18,
  },
  countItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[2],
  },
  countText: {
    ...semanticFont.caption.medium,
    color: semanticColor.text.lightest,
  },
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionSection: {
    paddingTop: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[32],
  },
  textSection: {
    padding: semanticNumber.spacing[16],
  },
  titleText: {
    color: semanticColor.text.primary,
    ...semanticFont.title.large,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: semanticNumber.spacing[12],
    paddingHorizontal: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[12],
    minHeight: 52,
  },
  transactionRowSpace: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  transactionRowText: {
    minWidth: 56,
    color: semanticColor.text.primary,
    ...semanticFont.label.medium,
  },
  trailingText: {
    color: semanticColor.text.primary,
    ...semanticFont.body.medium,
  },
  descriptionGroup: {
    paddingHorizontal: semanticNumber.spacing[16],
  },
  descriptionText: {
    flex: 1,
    color: semanticColor.text.primary,
    ...semanticFont.body.large,
  },
  supportSection: {
    paddingTop: semanticNumber.spacing[16],
    backgroundColor: semanticColor.surface.lightGray,
  },
});

export default MerchandiseDetailPage;
