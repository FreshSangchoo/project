import CenterHeader from '@/components/common/header/CenterHeader';
import { semanticColor } from '@/styles/semantic-color';
import { Alert, StyleSheet, Text, View } from 'react-native';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import IconX from '@/assets/icons/IconX.svg';
import { RouteProp, useFocusEffect, useNavigation, usePreventRemove, useRoute } from '@react-navigation/native';
import TextSection from '@/components/common/TextSection';
import UploadImage from '@/components/upload/UploadImage';
import SectionSeparator from '@/components/common/SectionSeparator';
import UploadPriceAndState from '@/components/upload/UploadPriceAndState';
import UploadTradeOption from '@/components/upload/UploadTradeOption';
import UploadDescription from '@/components/upload/UploadDescription';
import UploadModelInfo from '@/components/upload/UploadModelInfo';
import { semanticNumber } from '@/styles/semantic-number';
import { useCallback, useEffect, useRef, useState } from 'react';
import Modal from '@/components/common/modal/Modal';
import EmojiIndexPointingUp from '@/assets/icons/EmojiIndexPointingUp.svg';
import EmojiNoEntry from '@/assets/icons/EmojiNoEntry.svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeStackParamList } from '@/navigation/types/home-stack';
import ToolBar from '@/components/common/button/ToolBar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useModelStore } from '@/stores/useModelStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types/root';
import { useUploadFormStore, UploadFormStore } from '@/stores/useUploadFormStore';
import { useShallow } from 'zustand/react/shallow';
import usePostApi, { postData } from '@/hooks/apis/usePostApi';
import { useUploadDataStore } from '@/stores/useUploadDataStore';
import axios from 'axios';
import { AvoidSoftInput } from 'react-native-avoid-softinput';
import { semanticFont } from '@/styles/semantic-font';
import { mapToNotionPostsEnvelope, notifyNotionPosts, NotionWebhookPayload } from '@/hooks/apis/useWebhookApi';
import useSearchApi from '@/hooks/apis/useSearchApi';
import { enCondition } from '@/utils/merchandiseToCard';

type UploadModelPageRouteProps = RouteProp<HomeStackParamList, 'UploadModelPage'>;

function UploadModelPage() {
  const route = useRoute<UploadModelPageRouteProps>();
  const homeNav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isUploadModal, setIsUploadModal] = useState<boolean>(false);
  const [isCloseModal, setIsCloseModal] = useState<boolean>(false);
  const scrollRef = useRef<KeyboardAwareScrollView>(null);
  const { origin, mode = 'create', postId } = route.params || {};
  const { brand, category, modelName, reset: resetModelStore } = useModelStore();
  const [submitting, setSubmitting] = useState(false);

  const allowLeaveRef = useRef(false);
  const pendingActionRef = useRef<null | (() => void)>(null);
  const skipGuardRef = useRef(false);

  const OFFSET = 100;

  useEffect(() => {
    homeNav.setOptions?.({
      headerBackButtonMenuEnabled: false,
    } as any);
  }, [homeNav]);

  const {
    setShowValidation,
    reportLayoutY,
    reset: formReset,
  } = useUploadFormStore(
    useShallow((state: UploadFormStore) => ({
      setShowValidation: state.setShowValidation,
      reportLayoutY: state.reportLayoutY,
      reset: state.reset,
    })),
  );
  const { reset: dataReset } = useUploadDataStore(
    useShallow(s => ({
      reset: s.reset,
    })),
  );

  const doUpload = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);

      const s = useUploadDataStore.getState();

      if (!(typeof s.productId === 'number' || typeof s.customProductId === 'number')) {
        Alert.alert('확인', '모델 정보가 누락되었습니다. 모델을 다시 선택해 주세요.');
        return;
      }

      const base = {
        deliveryInfo: s.deliveryInfo,
        partChange: s.partChange,
        exchangeAvailable: s.exchangeAvailable,
        price: s.price,
        deliveryAvailable: s.deliveryAvailable,
        validTradeOptions: s.validTradeOptions,
        condition: enCondition(s.condition!),
        description: s.description,
      };

      const idField =
        typeof s.productId === 'number' && s.productId > 0
          ? { productId: s.productId }
          : { customProductId: s.customProductId! };

      let payload: postData;

      if (s.directAvailable) {
        if (!s.directInfo.locations?.length) {
          Alert.alert('확인', '직거래 지역을 선택해 주세요.');
          return;
        }
        payload = {
          ...idField,
          directAvailable: true,
          directInfo: { locations: s.directInfo.locations },
          ...base,
        };
      } else {
        payload = {
          ...idField,
          directAvailable: false,
          ...base,
        };
      }

      const { postPost, updatePost, getPostDetail } = usePostApi();

      let newPostId: number;
      let eventType: NotionWebhookPayload['eventType'];

      if (mode === 'create') {
        const response = await postPost(payload, s.images || []);
        newPostId = response.data.data.postId;
        eventType = 'create';
      } else {
        await updatePost(postId!, payload, s.images || []);
        newPostId = Number(postId);
        eventType = 'update';
      }

      (async () => {
        try {
          const d = await getPostDetail(newPostId);
          const firstImage = Array.isArray(d?.postImages) && d.postImages.length > 0 ? String(d.postImages[0]) : null;
          const firstEffect =
            Array.isArray(d?.modelResponse?.effectTypes) && d.modelResponse.effectTypes.length
              ? String(d.modelResponse.effectTypes[0])
              : category?.split('·')[0]?.trim() ?? null;

          const body: NotionWebhookPayload = {
            eventType,
            idempotencyKey: `${eventType}-${newPostId}`,
            modelName: d?.modelResponse?.modelName ?? modelName ?? '',
            createdAt: new Date().toISOString(),
            noId: newPostId,
            price: Number(d?.price ?? payload.price ?? 0) || null,
            exchangeAvailable: !!d?.exchangeAvailable,
            localDealAvailable: !!d?.localDealAvailable,
            deliveryAvailable: !!d?.deliveryAvailable,
            deliveryFee: d?.deliveryInfoResponse?.deliveryFee ?? null,
            deliveryFeeIncluded: !!d?.deliveryInfoResponse?.deliveryFeeIncluded,
            viewCount: Number(d?.viewCount ?? 0),
            brandName: d?.modelResponse?.brandName ?? brand ?? '',
            thumbnailUrl: firstImage,
            effectType: firstEffect,
            authorUserId: d?.author?.id ?? null,
            authorNickname: d?.author?.nickname ?? null,
            authorVerified: !!d?.author?.verified,
            likesCount: Number(d?.likeCount ?? 0),
            condition: d?.condition ?? payload.condition,
            saleStatus: d?.saleStatus ?? 'ON_SALE',
          };

          const envelope = mapToNotionPostsEnvelope(body, d);
          await notifyNotionPosts(envelope);
        } catch (e) {
          console.log('[Webhook] build/send failed:', e);
        }
      })();

      allowLeaveRef.current = true;
      skipGuardRef.current = true;
      setIsUploadModal(false);
      setIsCloseModal(false);
      pendingActionRef.current = null;

      if (origin === 'Detail') {
        rootNav.goBack();
      } else {
        rootNav.replace('ExploreStack', {
          screen: 'MerchandiseDetailPage',
          params: { id: newPostId },
        });
      }

      // 입력값 초기화
      resetModelStore();
      dataReset();
    } catch (e: any) {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        const data = e.response?.data;
        Alert.alert('업로드 실패', `status=${status}\n${typeof data === 'string' ? data : JSON.stringify(data)}`);
      } else {
        Alert.alert('업로드 실패', String(e));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const collectInvalidsExcludingModel = () => {
    const { sections } = useUploadFormStore.getState();
    const keys: Array<'images' | 'price' | 'trade' | 'region'> = ['images', 'price', 'trade', 'region'];
    const invalids = keys
      .filter(k => !sections[k].valid)
      .map(k => ({ key: k, y: sections[k].y, error: sections[k].error }));
    const firstWithY = invalids.find(s => typeof s.y === 'number');
    return { invalids, firstWithY };
  };

  useFocusEffect(
    useCallback(() => {
      if (mode !== 'edit') formReset();
      return () => {
        if (mode !== 'edit') formReset();
      };
    }, [formReset, mode]),
  );

  useFocusEffect(
    useCallback(() => {
      AvoidSoftInput.setEnabled(false);
      AvoidSoftInput.setAdjustNothing();
      AvoidSoftInput.setAvoidOffset(0);
      AvoidSoftInput.setShouldMimicIOSBehavior(false);

      return () => {
        AvoidSoftInput.setEnabled(true);
        AvoidSoftInput.setAdjustResize();
      };
    }, []),
  );

  const handleUploadPress = () => {
    const { invalids, firstWithY } = collectInvalidsExcludingModel();
    if (invalids.length === 0) {
      setShowValidation(false);
      setIsUploadModal(true);
      return;
    }
    setShowValidation(true);
    if (firstWithY && typeof firstWithY.y === 'number') {
      const targetY = Math.max(firstWithY.y - OFFSET, 0);
      scrollRef.current?.scrollToPosition(0, targetY, true);
    }
  };

  const handleAbort = () => {
    resetModelStore();
    dataReset();

    allowLeaveRef.current = true;
    setIsCloseModal(false);

    if (pendingActionRef.current) {
      const run = pendingActionRef.current;
      pendingActionRef.current = null;
      run();
      return;
    }
    if (mode === 'create') {
      rootNav.reset({
        index: 0,
        routes: [{ name: 'NavBar', params: { screen: origin } }],
      });
    } else {
      rootNav.goBack();
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (mode !== 'edit' || !postId) return;
      try {
        const d = await usePostApi().getPostDetail(postId);
        if (!mounted) return;

        useModelStore.getState().setAll({
          brand: d?.modelResponse?.brandName ?? '',
          category: (d?.modelResponse?.effectTypes ?? []).join(' · '),
          modelName: d?.modelResponse?.modelName ?? '',
        });

        const u = useUploadDataStore.getState();
        u.clearRemovedImages();
        u.setProductId(d?.modelResponse?.modelId ?? null);
        u.setCustomProductId(null);
        u.setPrice(Number(d?.price));
        u.setCondition(d?.condition);
        u.setDescription(d?.description ?? '');
        u.setPartChange(!!d?.partChange);
        u.setDeliveryAvailable(!!d?.deliveryAvailable);
        u.setExchangeAvailable(!!d?.exchangeAvailable);
        u.setDirectAvailable(!!d?.localDealAvailable);
        u.setDeliveryInfo({
          feeIncluded: !!d?.deliveryInfoResponse?.deliveryFeeIncluded,
          deliveryFee: d?.deliveryInfoResponse?.deliveryFee ?? 3000,
          validDeliveryFee: true,
        });

        // 지역 이름으로부터 ID 찾기
        const regionNames = Array.isArray(d?.regions) ? d.regions : [];
        u.setDirectRegionNames(regionNames);

        if (regionNames.length > 0) {
          const { getRegionSearch } = useSearchApi();
          const regionIds: number[] = [];

          for (const regionName of regionNames) {
            try {
              const results = await getRegionSearch(regionName);
              if (results.length > 0) {
                // 정확히 일치하는 결과 찾기
                const exactMatch = results.find((r: { suggestion: string }) => r.suggestion === regionName);
                if (exactMatch) {
                  regionIds.push(exactMatch.id);
                } else {
                  // 정확히 일치하는 게 없으면 첫 번째 결과 사용
                  regionIds.push(results[0].id);
                }
              }
            } catch (error) {
              if (__DEV__) {
                console.error(`지역 ID 찾기 실패: ${regionName}`, error);
              }
            }
          }

          if (regionIds.length > 0) {
            u.setDirectLocations(regionIds);
          }
        }

        u.setImages(
          Array.isArray(d?.postImages) ? d.postImages.map((url: string) => ({ uri: url, isRemote: true })) : [],
        );
      } catch (e) {
        Alert.alert('확인', '게시글 정보를 불러오지 못했습니다.');
      }
    })();
    return () => {
      mounted = false;
    };
  }, [mode, postId]);

  usePreventRemove(Boolean(origin) && !allowLeaveRef.current, (e: any) => {
    if (skipGuardRef.current) {
      skipGuardRef.current = false;
      homeNav.dispatch(e.data.action);
      return;
    }

    pendingActionRef.current = () => {
      homeNav.dispatch(e.data.action);
    };
    setIsCloseModal(true);
  });

  return (
    <SafeAreaView style={[styles.uploadModelPage]}>
      <CenterHeader
        title={mode === 'create' ? '매물 등록' : '매물 수정'}
        leftChilds={{
          icon: (
            <IconChevronLeft
              width={28}
              height={28}
              stroke={semanticColor.icon.primary}
              strokeWidth={semanticNumber.stroke.bold}
            />
          ),
          onPress: () => {
            if (origin) {
              setIsCloseModal(true);
            } else homeNav.goBack();
          },
        }}
        rightChilds={[
          {
            icon: (
              <IconX
                width={28}
                height={28}
                stroke={semanticColor.icon.primary}
                strokeWidth={semanticNumber.stroke.bold}
              />
            ),
            onPress: () => setIsCloseModal(true),
          },
        ]}
      />
      <KeyboardAwareScrollView
        ref={scrollRef}
        enableOnAndroid
        enableAutomaticScroll={false}
        enableResetScrollToCoords={false}
        keyboardShouldPersistTaps="handled">
        <TextSection
          mainText="매물 및 거래 정보를 추가해 주세요."
          subText="내용을 꼼꼼히 확인하고 올려주세요!"
          type="large"
        />
        <View onLayout={e => reportLayoutY('images', e.nativeEvent.layout.y)}>
          <UploadImage />
        </View>
        <SectionSeparator type="line-with-padding" />
        <UploadModelInfo brand={brand} category={category} modelName={modelName} onPress={() => {}} />
        <SectionSeparator type="line-with-padding" />
        <UploadPriceAndState />
        <SectionSeparator type="line-with-padding" />
        <View onLayout={e => reportLayoutY('trade', e.nativeEvent.layout.y)}>
          <UploadTradeOption />
        </View>
        <SectionSeparator type="line-with-padding" />
        <UploadDescription />
        <View style={styles.uploadCautionContainer}>
          <Text style={styles.uploadCautionText}>
            매물 등록 시, 판매 정보와 실제 매물이 일치하지 않을 경우 모든 책임은 판매자에게 있습니다. 또한 악기 거래 시
            전파법·전기용품 및 생활용품 안전관리법·관세법 등 관련 법령 위반에 각별히 유의하시기 바랍니다.
          </Text>
        </View>
      </KeyboardAwareScrollView>
      <View style={{ backgroundColor: semanticColor.surface.white }}>
        <ToolBar
          children={mode === 'create' ? '매물 등록하기' : '수정하기'}
          onPress={handleUploadPress}
          isHairLine
          disabled={submitting}
        />
      </View>
      {isUploadModal && (
        <Modal
          mainButtonText={mode === 'create' ? '매물 등록하기' : '수정하기'}
          titleText={mode === 'create' ? '매물을 등록할까요?' : '매물을 수정할까요?'}
          titleIcon={<EmojiIndexPointingUp width={24} height={24} />}
          noDescription
          onClose={() => setIsUploadModal(false)}
          visible
          onMainPress={doUpload}
        />
      )}
      {isCloseModal && (
        <Modal
          mainButtonText={origin ? '매물 수정 중단하기' : '매물 올리기 중단하기'}
          onClose={() => setIsCloseModal(false)}
          onMainPress={handleAbort}
          titleText={origin ? '매물 수정을 중단하시겠어요?' : '매물을 올리기를 중단하시겠어요?'}
          titleIcon={<EmojiNoEntry width={24} height={24} />}
          visible
          buttonTheme="critical"
          descriptionText="지금 중단하시면 입력 정보가 모두 삭제돼요."
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  uploadModelPage: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  uploadCautionContainer: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[32],
    backgroundColor: semanticColor.surface.lightGray,
  },
  uploadCautionText: {
    ...semanticFont.caption.small,
    color: semanticColor.text.tertiary,
  },
});

export default UploadModelPage;
