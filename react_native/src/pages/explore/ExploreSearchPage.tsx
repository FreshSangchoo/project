import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';
import useExploreNavigation from '@/hooks/navigation/useExploreNavigation';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import SearchField from '@/components/common/search-field/SearchField';
import RecentSearchBar from '@/components/common/array-bar/RecentSearchBar';
import SearchResultItem from '@/components/explore/SearchResultItem';
import SearchRecentItem from '@/components/explore/SearchRecentItem';
import SearchSkeletonItem from '@/components/explore/SearchSkeletonItem';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import useRecentSearchApi from '@/hooks/apis/useRecentSearchApi';

function ExploreSearchPage() {
  const navigation = useExploreNavigation();
  const rootNavigation = useRootNavigation();
  const [searchText, setSearchText] = useState<string>('');
  const [submittedText, setSubmittedText] = useState<string>('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchFieldRef = useRef<TextInput>(null);

  const filteredRecentSearches = recentSearches.filter(item => item.trim() !== '');
  const hasRecent = filteredRecentSearches.length > 0;

  const { getRecentSearch, postRecentSearch, getUnifiedSuggestions, deleteRecentSearch, deleteAllRecentSearches } =
    useRecentSearchApi();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [suggestRecent, setSuggestRecent] = useState<string[]>([]);
  const [suggestBrands, setSuggestBrands] = useState<Array<{ text: string; id: string; brandNameKo: string }>>([]);
  const [suggestModels, setSuggestModels] = useState<
    Array<{ text: string; id: string; brandName: string; brandId?: string; brandNameKo?: string }>
  >([]);

  // 추천 검색어 표시 조건
  const showRecentBar = isLoading || hasRecent || submittedText.trim().length > 0;

  // 항목 클릭 → searchText 설정
  const handleSelectRecent = async (value: string) => {
    setSearchText(value);
    setSubmittedText(value);

    await postRecentSearch(value);
  };

  const handlePressResult = async (
    id: number,
    category: '브랜드' | '이펙터',
    label: string, // 브랜드명 또는 모델명
    extraLabel: string, // 한국 브랜드명 또는 브랜드명
    brandId?: number, // 이펙터일 때, brand id
    brandNameKo?: string, // 이펙터일 때, 한국 브랜드명
  ) => {
    await postRecentSearch(label);

    if (category === '브랜드') {
      navigation.navigate('ExplorePage', {
        searchType: 'brand',
        brandId: id,
        brandName: label,
        brandKorName: extraLabel,
      });
      return;
    }
    // category === '이펙터'
    navigation.navigate('ExplorePage', {
      searchType: 'model',
      modelId: id,
      modelName: label,
      brandName: extraLabel,
      brandId: brandId,
      brandKorName: brandNameKo,
    });
  };

  const handleSubmit = async () => {
    const keyword = searchText.trim();
    if (!keyword) return;

    setSubmittedText(keyword);
    await postRecentSearch(keyword);

    navigation.navigate('ExplorePage', { searchType: 'keyword', keyword });
  };

  useEffect(() => {
    setSubmittedText(searchText);
  }, [searchText]);

  // 항목 삭제
  const handleDeleteRecent = async (value: string) => {
    const success = await deleteRecentSearch(value);
    if (success) {
      setRecentSearches(prev => prev.filter(item => item.toLowerCase() !== value.toLowerCase()));
    }
  };

  const handleClearAllRecent = async () => {
    const success = await deleteAllRecentSearches();
    if (success) {
      setRecentSearches([]);
    }
  };

  const fetchRecentSearches = async () => {
    try {
      const recentList = await getRecentSearch();
      setRecentSearches(recentList);
    } catch (e) {
      setRecentSearches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentSearches();
  }, []);

  // 페이지 진입 시 SearchField 자동 포커스
  useEffect(() => {
    const timer = setTimeout(() => {
      searchFieldRef.current?.focus();
    }, 300); // 약간의 지연 후 포커스

    return () => clearTimeout(timer);
  }, []);

  const getUnifiedSuggestionsRef = useRef(getUnifiedSuggestions);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchText.trim()) {
      setSuggestRecent([]);
      setSuggestBrands([]);
      setSuggestModels([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const { recent, brands, models } = await getUnifiedSuggestionsRef.current(searchText.trim());
        setSuggestRecent(recent);
        setSuggestBrands(brands.map(b => ({ text: b.text, id: b.id, brandNameKo: b.brandNameKo })));
        setSuggestModels(
          models.map(m => ({
            text: m.text,
            id: m.id,
            brandName: m.brandName,
            brandId: m.brandId,
            brandNameKo: m.brandNameKo,
          })),
        );
      } catch {
        setSuggestRecent([]);
        setSuggestBrands([]);
        setSuggestModels([]);
      }
    }, 250);
  }, [searchText]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBarWrapper}>
        <TouchableOpacity style={styles.touchField} onPress={() => navigation.goBack()}>
          <IconChevronLeft
            width={28}
            height={28}
            stroke={semanticColor.icon.primary}
            strokeWidth={semanticNumber.stroke.bold}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <SearchField
            ref={searchFieldRef}
            size="small"
            placeholder="어떤 악기를 찾고 있나요?"
            inputText={searchText}
            setInputText={setSearchText}
            onPress={handleSubmit}
            isExplore={true}
          />
        </View>
      </View>

      <ScrollView style={styles.logGroup}>
        {/* 최근 or 추천 검색어 바 */}
        {showRecentBar && (
          <RecentSearchBar isSearching={!isLoading && submittedText.trim().length > 0} onClear={handleClearAllRecent} />
        )}

        {/* 로딩 중 스켈레톤 4개 */}
        {isLoading && Array.from({ length: 4 }).map((_, idx) => <SearchSkeletonItem key={idx} />)}

        {/* 최근 검색어가 있고 검색 중이 아닐 때 */}
        {!isLoading &&
          hasRecent &&
          submittedText.trim().length === 0 &&
          filteredRecentSearches.map((item, idx) => (
            <SearchRecentItem
              key={idx}
              searchText={item}
              currentSearchText={submittedText}
              onPress={() => handleSelectRecent(item)}
              onDelete={() => handleDeleteRecent(item)}
            />
          ))}

        {/* 검색 중일 때 */}
        {!isLoading && submittedText.trim().length > 0 && (
          <>
            {/* 결과 */}
            {suggestRecent.map((item, idx) => (
              <SearchRecentItem
                key={`sug-recent-${idx}-${item}`}
                searchText={item}
                currentSearchText={submittedText}
                onPress={() => handleSelectRecent(item)}
                onDelete={() => handleDeleteRecent(item)}
              />
            ))}
            {suggestBrands.map(s => (
              <SearchResultItem
                key={`sug-brand-${s.id}`}
                id={Number(s.id)}
                brandName={s.text}
                category="브랜드"
                onPress={id => handlePressResult(id, '브랜드', s.text, s.brandNameKo)}
              />
            ))}
            {suggestModels.map(s => (
              <SearchResultItem
                key={`sug-model-${s.id}`}
                id={Number(s.id)}
                brandName={s.brandName}
                modelName={s.text}
                category="이펙터"
                onPress={id => handlePressResult(id, '이펙터', s.text, s.brandName, Number(s.brandId), s.brandNameKo)}
              />
            ))}
          </>
        )}
      </ScrollView>
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
  logGroup: {
    width: '100%',
    paddingVertical: semanticNumber.spacing[12],
  },
});

export default ExploreSearchPage;
