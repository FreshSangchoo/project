import { use, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import ModelCard from '@/components/common/model-card/ModelCard';
import NoResultSection from '@/components/common/NoResultSection';
import VariantButton from '@/components/common/button/VariantButton';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import EmojiSadface from '@/assets/icons/EmojiSadface.svg';
import SearchField from '@/components/common/search-field/SearchField';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types/root';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useModelStore } from '@/stores/useModelStore';
import useSearchApi from '@/hooks/apis/useSearchApi';
import { useUploadDataStore } from '@/stores/useUploadDataStore';
import { useShallow } from 'zustand/react/shallow';
import { HomeStackParamList } from '@/navigation/types/home-stack';
import ModelCardSkeleton from '@/components/common/model-card/ModelCardSkeleton';

interface modelInfo {
  id: number;
  brand: string;
  suggestion: string;
  category: string;
  effect_type_1: string;
}

function ModelSearchPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchText, setSearchText] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const setAll = useModelStore(s => s.setAll);
  const [results, setResults] = useState<modelInfo[]>([]);
  const { getEffectModelSearch } = useSearchApi();
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const route = useRoute<RouteProp<HomeStackParamList, 'ModelSearchPage'>>();
  const { origin } = route.params || {};

  const { productId, setProductId } = useUploadDataStore(
    useShallow(s => ({
      setProductId: s.setProductId,
      productId: s.productId,
    })),
  );

  useEffect(() => {
    const query = searchText.trim();
    if (!query) {
      if (keyword !== '') setKeyword('');
      if (results.length !== 0) setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      if (keyword !== query) setKeyword(query);
      setIsLoading(true);
      getEffectModelSearch(query)
        .then((data: any[]) => {
          const mapped: modelInfo[] = (data ?? []).map((item, idx) => ({
            id: item.id,
            brand: item.brandNameEn ?? '',
            suggestion: item.suggestion ?? '',
            category: item.category ?? '',
            effect_type_1: item.effect_type_1 ?? '',
          }));
          setResults(mapped);
        })
        .catch(() => {
          setResults([]);
        })
        .finally(() => {
          setHasSearched(true);
          setIsLoading(false);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  return (
    <SafeAreaView style={styles.modelSearchPage} edges={['top', 'right', 'left']}>
      <View style={styles.searchBarWrapper}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <IconChevronLeft
            width={28}
            height={28}
            stroke={semanticColor.icon.primary}
            strokeWidth={semanticNumber.stroke.bold}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <SearchField
            inputText={searchText}
            onPress={() => {}}
            placeholder="어떤 악기를 찾고 있나요?"
            setInputText={setSearchText}
            size="small"
            autoFocus
          />
        </View>
      </View>
      <View style={styles.recommandWordWrapper}>
        <Text style={styles.recommandWordText}>추천 검색어</Text>
        <VariantButton
          children="내 악기의 모델이 없나요?"
          onPress={() => navigation.navigate('HomeStack', { screen: 'UploadModelManual', params: { origin } })}
          theme="sub"
        />
      </View>
      {isLoading ? (
        <View style={styles.skeletonWrapper}>
          <ModelCardSkeleton />
          <ModelCardSkeleton />
          <ModelCardSkeleton />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item, index) => (item.id ? String(item.id) : String(index))}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.modelCardWrapper}>
              <ModelCard
                brand={item.brand}
                modelName={item.suggestion}
                category={`${item.category}>${item.effect_type_1}`}
                onPress={() => {
                  setAll({
                    brand: item.brand,
                    modelName: item.suggestion,
                    category: `${item.category}>${item.effect_type_1}`,
                  });
                  setProductId(item.id);
                  console.log('[ModelSearchPage] set productId:', useUploadDataStore.getState().productId);
                  navigation.goBack();
                }}
              />
            </View>
          )}
        />
      ) : hasSearched && !isLoading ? (
        <NoResultSection
          emoji={<EmojiSadface />}
          title="저희가 모르는 모델 같아요."
          description="검색 결과가 없어요."
        />
      ) : (
        <View style={{ flex: 1 }} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modelSearchPage: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: semanticNumber.spacing[2],
    paddingRight: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[8],
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  recommandWordWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: semanticNumber.spacing[16],
    marginTop: semanticNumber.spacing[12],
    marginBottom: semanticNumber.spacing[6],
  },
  recommandWordText: {
    ...semanticFont.label.small,
    color: semanticColor.text.tertiary,
  },
  listContainer: {
    paddingBottom: 80,
  },
  modelCardWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[6],
  },
  skeletonWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[12],
  },
});

export default ModelSearchPage;
