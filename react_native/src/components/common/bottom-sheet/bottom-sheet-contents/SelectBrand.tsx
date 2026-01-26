import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { semanticNumber } from '@/styles/semantic-number';
import SearchField from '@/components/common/search-field/SearchField';
import NoResultSection from '@/components/common/NoResultSection';
import EmojiFaceWithMonocle from '@/assets/icons/EmojiFaceWithMonocle.svg';
import VariantButton from '@/components/common/button/VariantButton';
import CheckboxItem from '@/components/common/checkbox-item/CheckboxItem';
import { useFilterStore } from '@/stores/useFilterStore';
import useBrandApi from '@/hooks/apis/useBrandApi';
import useSearchApi from '@/hooks/apis/useSearchApi';
import { showErrorToast } from '@/utils/errorHandler';

export type Brand = {
  id: number;
  name: string;
  nameKo?: string | null;
};

interface SelectBrandProps {
  isFilter?: boolean;
  onSelect?: (brand: Brand) => void;
  onSkip?: () => void;
}

const SelectBrand = ({ isFilter, onSelect, onSkip }: SelectBrandProps) => {
  const { selectedEffects, setSelectedEffect, setSelectedBrand } = useFilterStore();
  const { getBrandList } = useBrandApi();
  const { getBrandSearch } = useSearchApi();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [searchText, setSearchText] = useState('');

  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchBrands = async (nextPage: number) => {
    if (loadingMore || (!hasNext && nextPage !== 0)) return;

    setLoadingMore(true);
    try {
      const res = await getBrandList({ page: nextPage, size: 20 });

      setBrands(prev => {
        const merged = [...(nextPage === 0 ? [] : prev), ...(res.brands || [])];
        const unique = Array.from(new Map(merged.map(b => [b.id, b])).values());
        return unique;
      });

      setPage(res.currentPage + 1);
      setHasNext(res.currentPage < res.pageCount - 1);
    } catch (e: any) {
      showErrorToast(e, '브랜드 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchSearch = async (keyword: string) => {
    try {
      const res = await getBrandSearch(keyword);
      const mapped: Brand[] = (res || []).map((s: any) => ({
        id: s.id,
        name: s.suggestion,
        nameKo: s.brandNameKo,
      }));
      setBrands(mapped);
      setPage(0);
      setHasNext(false);
    } catch (e: any) {
      setBrands([]);
    }
  };

  useEffect(() => {
    if (searchText.trim() !== '') {
      fetchSearch(searchText);
    } else {
      setBrands([]);
      setPage(0);
      setHasNext(true);
      fetchBrands(0);
    }
  }, [searchText]);

  const handleSelect = (brand: Brand) => {
    if (isFilter) {
      const isCurrentlySelected = selectedEffects['브랜드']?.includes(brand.name);
      if (isCurrentlySelected) {
        // 선택 해제
        setSelectedBrand(brand.name, null);
      } else {
        // 선택
        setSelectedBrand(brand.name, brand.id.toString());
      }
      onSelect?.(brand);
    } else {
      onSelect?.(brand);
    }
  };

  const renderItem = ({ item }: { item: Brand }) => {
    const isSelected = isFilter ? selectedEffects['브랜드']?.includes(item.name) : false;
    return <CheckboxItem label={item.name} selected={isSelected} onPress={() => handleSelect(item)} />;
  };

  return (
    <View style={styles.container}>
      <SearchField
        size="small"
        placeholder="브랜드를 입력해 주세요. (영문 권장)"
        inputText={searchText}
        setInputText={setSearchText}
        onPress={() => {}}
      />
      <FlatList
        data={brands}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        scrollEventThrottle={16}
        removeClippedSubviews={false}
        keyboardDismissMode="on-drag"
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        style={{ width: '100%' }}
        contentContainerStyle={[
          styles.scrollContainer,
          isFilter
            ? undefined
            : {
                paddingBottom: semanticNumber.spacing[36] + semanticNumber.spacing[32],
              },
        ]}
        onEndReached={() => {
          if (!loadingMore && hasNext) {
            fetchBrands(page);
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.noResultContainer}>
            <NoResultSection
              emoji={<EmojiFaceWithMonocle />}
              title="저희가 모르는 브랜드 같아요."
              description={`"${searchText}"`}
              button={
                !isFilter ? (
                  <VariantButton
                    isLarge
                    onPress={() => {
                      onSkip?.();
                    }}
                    theme="sub">
                    건너뛰기
                  </VariantButton>
                ) : undefined
              }
            />
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: semanticNumber.spacing[16],
  },
  noResultContainer: {
    width: '100%',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
    paddingBottom: semanticNumber.spacing[16],
  },
});

export default SelectBrand;
