import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import CenterHeader from '@/components/common/header/CenterHeader';
import ModelCard from '@/components/common/model-card/ModelCard';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import { semanticColor } from '@/styles/semantic-color';
import IconX from '@/assets/icons/IconX.svg';
import SearchField from '@/components/common/search-field/SearchField';
import { SafeAreaView } from 'react-native-safe-area-context';
import useHomeNavigation, { HomeStackParamList } from '@/hooks/navigation/useHomeNavigation';
import ToolBar from '@/components/common/button/ToolBar';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { useModelStore } from '@/stores/useModelStore';
import { useUploadDataStore } from '@/stores/useUploadDataStore';
import { useShallow } from 'zustand/react/shallow';
import Modal from '@/components/common/modal/Modal';
import EmojiNoEntry from '@/assets/icons/EmojiNoEntry.svg';

type Rt = RouteProp<HomeStackParamList, 'UploadIndexPage'>;

function UploadIndexPage() {
  const navigation = useHomeNavigation();
  const [searchText, setSearchText] = useState<string>('');
  const [closeModal, setCloseModal] = useState<boolean>(false);

  const route = useRoute<Rt>();
  const { origin } = route.params || {};
  const startFresh = route.params?.startFresh ?? false;

  const { brandForCard, modelNameForCard, categoryForCard } = useModelStore(
    useShallow(s => ({
      brandForCard: s.brand,
      modelNameForCard: s.modelName,
      categoryForCard: s.category,
    })),
  );
  const resetModelStore = useModelStore(s => s.reset);

  const hasModel = useMemo(
    () => modelNameForCard.trim().length > 0 && categoryForCard.trim().length > 0,
    [modelNameForCard, categoryForCard],
  );

  const { productId } = useUploadDataStore(
    useShallow(s => ({
      productId: s.productId,
    })),
  );
  const dataReset = useUploadDataStore(s => s.reset);

  useFocusEffect(() => {
    console.log.bind(console, 'UploadIndexPage focus, productId=', productId);
  });

  const startFreshHandledRef = useRef(false);
  useEffect(() => {
    if (startFresh && !startFreshHandledRef.current) {
      startFreshHandledRef.current = true;
      resetModelStore();
      dataReset();
      requestAnimationFrame(() => {
        navigation.setParams({ startFresh: undefined });
      });
    }
    console.log('productId = ', productId);
  }, [startFresh, resetModelStore, dataReset, navigation, productId]);

  const handleCloseInHeader = () => {
    if (modelNameForCard) {
      setCloseModal(true);
    } else {
      resetModelStore();
      dataReset();
      navigation.goBack();
    }
  };

  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', () => {
      resetModelStore();
      dataReset();
    });
    return sub;
  }, [navigation, resetModelStore, dataReset]);

  return (
    <SafeAreaView style={styles.uploadIndexPageContainer}>
      <CenterHeader
        title="매물 등록"
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
            onPress: handleCloseInHeader,
          },
        ]}
      />
      <View style={styles.contentsWrapper}>
        <View style={styles.textSection}>
          <Text style={styles.mainText}>내 악기를 선택해 주세요.</Text>
          <View>
            <Text
              style={
                styles.subText
              }>{`본인이 판매할 악기 모델을 검색하고 선택하면,\n기본 정보가 자동 입력됩니다!`}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.searchSection}
          onPress={() => navigation.navigate('ModelSearchPage', { origin })}>
          <SearchField
            inputText={searchText}
            onPress={() => {}}
            placeholder="브랜드 또는 모델명 입력"
            setInputText={setSearchText}
            isNavigate
          />
        </TouchableOpacity>
        {hasModel && (
          <View style={styles.modelCardWrapper}>
            <ModelCard
              brand={brandForCard}
              modelName={modelNameForCard}
              category={categoryForCard}
              onPress={() => {}}
            />
          </View>
        )}
      </View>
      <ToolBar children="다음" onPress={() => navigation.navigate('UploadModelPage')} disabled={!hasModel} />
      <Modal
        mainButtonText="매물 올리기 중단하기"
        onClose={() => setCloseModal(false)}
        onMainPress={() => {
          resetModelStore();
          dataReset();
          navigation.goBack();
          setCloseModal(false);
        }}
        titleText="매물 올리기를 중단하시겠어요?"
        titleIcon={<EmojiNoEntry width={24} height={24} />}
        visible={closeModal}
        buttonTheme="critical"
        descriptionText="지금 중단하시면 입력 정보가 모두 삭제돼요."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  uploadIndexPageContainer: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  contentsWrapper: {
    flex: 1,
  },
  textSection: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingTop: semanticNumber.spacing[40],
    paddingBottom: semanticNumber.spacing[12],
    gap: semanticNumber.spacing[4],
  },
  mainText: {
    ...semanticFont.headline.medium,
    color: semanticColor.text.primary,
  },
  subText: {
    ...semanticFont.body.large,
    color: semanticColor.text.tertiary,
  },
  searchSection: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingTop: semanticNumber.spacing[36],
    marginBottom: semanticNumber.spacing[16],
  },
  modelCardWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
  },
  searchPlaceholder: {
    ...semanticFont.body.large,
    color: semanticColor.text.lightest,
  },
  modelText: {
    ...semanticFont.body.large,
    color: semanticColor.text.primary,
  },
});

export default UploadIndexPage;
