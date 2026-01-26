import { useState, useEffect } from 'react';
import { Platform, StyleSheet, View, Text, ScrollView, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useExploreNavigation from '@/hooks/navigation/useExploreNavigation';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import ProductListBar from '@/components/common/array-bar/ProductListBar';
import { SortValue } from '@/components/common/bottom-sheet/SortBottomSheet';
import ModelCard from '@/components/common/model-card/ModelCard';
import ModelCardSkeleton from '@/components/common/model-card/ModelCardSkeleton';
import useBrandApi from '@/hooks/apis/useBrandApi';
import { showErrorToast } from '@/utils/errorHandler';

const isAndroid = Platform.OS === 'android';

interface BrandModelProps {
  brandId: number;
  isLoading?: boolean;
}
interface ModelCardItem {
  modelId: number;
  modelName: string;
  brandId: number;
  brandName: string;
  brandKorName: string;
  effectTypes: string[];
}

function BrandModel({ brandId, isLoading }: BrandModelProps) {
  const insets = useSafeAreaInsets();
  const navigation = useExploreNavigation();
  const [models, setModels] = useState<ModelCardItem[]>([]);
  const [sort, setSort] = useState<SortValue | 'recent'>('recent');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNext, setHasNext] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getBrandModelList } = useBrandApi();

  const fetchModels = async (nextPage: number, reset = false) => {
    if (loadingMore || refreshing || (!hasNext && !reset)) return;

    if (reset) {
      setRefreshing(true);
    } else if (nextPage === 0) {
      setInitialLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await getBrandModelList(brandId, { page: nextPage, size: 20, sort });
      const newModels = res.models ?? [];
      setModels(prev => (reset || nextPage === 0 ? newModels : [...prev, ...newModels]));
      setTotalCount(res.totalCount);
      setPage(res.currentPage + 1);
      setHasNext(res.currentPage < res.pageCount - 1);
    } catch (err) {
      showErrorToast(err, '모델 목록을 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
      setInitialLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchModels(0, true);
  };

  useEffect(() => {
    fetchModels(0);
  }, []);

  const renderItem = ({ item }: { item: ModelCardItem }) => (
    <ModelCard
      modelName={item.modelName}
      category={item.effectTypes?.[0] ?? ''}
      onPress={() =>
        navigation.navigate('ModelPage', {
          id: item.modelId,
          modelName: item.modelName,
          brandId: item.brandId,
          brandName: item.brandName,
          brandKorName: item.brandKorName,
          category: item.effectTypes?.[0] ?? '',
        })
      }
    />
  );

  return (
    <ScrollView style={styles.container}>
      <ProductListBar count={totalCount} loading={isLoading} onlyCount onChangeSort={value => setSort(value)} />
      <FlatList
        data={models}
        keyExtractor={(item, index) => `${item.modelId}-${index}`}
        renderItem={renderItem}
        scrollEnabled={false}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.cardSection, !isAndroid && { paddingBottom: insets.bottom }]}
        onEndReached={() => {
          if (!loadingMore && hasNext) {
            fetchModels(page);
          }
        }}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          initialLoading ? (
            <>
              <ModelCardSkeleton isBrand />
              <ModelCardSkeleton isBrand />
              <ModelCardSkeleton isBrand />
            </>
          ) : null
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  cardSection: {
    paddingHorizontal: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[12],
  },
});

export default BrandModel;
