import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import SearchField from '@/components/common/search-field/SearchField';
import { useFilterStore } from '@/stores/useFilterStore';
import NoResultSection from '@/components/common/NoResultSection';
import EmojiSadface from '@/assets/icons/EmojiSadface.svg';
import CheckboxItem from '@/components/common/checkbox-item/CheckboxItem';
import CheckboxItemSkeleton from '@/components/common/checkbox-item/CheckboxItemSkeleton';
import useRegionApi from '@/hooks/apis/useRegionApi';
import useSearchApi from '@/hooks/apis/useSearchApi';
import type { Sido, Sigungu } from '@/types/region';
import { useToastStore } from '@/stores/toastStore';

const isAndroid = Platform.OS === 'android';

interface SelectRegionProps {
  isFilter?: boolean;
  resetSignal?: number;
  onSelectionChange?: (ids: number[], names: string[]) => void;
  maxSelections?: number;
  onOverLimit?: () => void;
}

const GLOBAL_ALL_KEY = 'GLOBAL-ALL';

const SelectRegion = ({
  isFilter,
  resetSignal,
  onSelectionChange,
  maxSelections = 2,
  onOverLimit,
}: SelectRegionProps) => {
  const { selectedEffects, setSelectedEffect, setSelectedRegion } = useFilterStore();
  const getFilteredEffects = useFilterStore(state => state.getFilteredEffects);

  const { getSidos, getSigungus } = useRegionApi();
  const { getRegionSearch } = useSearchApi();

  const [sidos, setSidos] = useState<Sido[]>([]);
  const [sigungus, setSigungus] = useState<Record<number, Sigungu[]>>({});
  const [selectedParent, setSelectedParent] = useState<number | null>(null);
  const [selectedChildren, setSelectedChildren] = useState<Record<string, boolean>>({});
  const [searchText, setSearchText] = useState('');
  const [regionSuggestions, setRegionSuggestions] = useState<{ id: number; suggestion: string }[]>([]);
  const [isUpdatingFromStore, setIsUpdatingFromStore] = useState(false);
  const [loadingSidoId, setLoadingSidoId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const showToast = useToastStore(s => s.show);

  // 시도 불러오기 및 첫 번째 시도 자동 선택
  useEffect(() => {
    (async () => {
      const data = await getSidos();
      setSidos(data);

      // 첫 번째 시도 자동 선택
      if (data.length > 0) {
        const firstSido = data[0];
        setSelectedParent(firstSido.siDoId);

        // 첫 번째 시도의 시군구 목록 불러오기
        const sigungusData = await getSigungus(firstSido.siDoId);
        setSigungus(prev => ({ ...prev, [firstSido.siDoId]: sigungusData }));
      }
    })();
  }, []);

  // 시군구 불러오기 (lazy load)
  const fetchSigungus = async (siDoId: number) => {
    if (!sigungus[siDoId]) {
      setLoadingSidoId(siDoId);
      try {
        const data = await getSigungus(siDoId);
        setSigungus(prev => ({ ...prev, [siDoId]: data }));
      } finally {
        setLoadingSidoId(null);
      }
    }
  };

  // 검색어 입력 시 서버에서 suggestion 가져오기
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchText.trim() === '') {
        setRegionSuggestions([]);
        return;
      }
      try {
        const suggestions = await getRegionSearch(searchText.trim());
        setRegionSuggestions(suggestions);

        // 검색 결과의 sigungu를 찾기 위해 모든 sido의 시군구 데이터 로드
        if (suggestions.length > 0) {
          for (const sido of sidos) {
            if (!sigungus[sido.siDoId]) {
              await fetchSigungus(sido.siDoId);
            }
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.log('[getRegionSearch] error: ', error);
        }
        setRegionSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [searchText]);

  // store의 지역 상태를 selectedChildren로 변환하는 함수
  const convertStoreRegionsToKeys = (regions: string[]): Record<string, boolean> => {
    if (!regions || regions.length === 0) {
      return {};
    }

    const keys: Record<string, boolean> = {};

    regions.forEach(region => {
      // '전체'인 경우 글로벌 전체로 처리
      if (region === '전체') {
        keys[GLOBAL_ALL_KEY] = true;
        return;
      }

      // 새로운 형태: "시도명|시군구명|sidoId-sigunguId"
      if (region.includes('|')) {
        const parts = region.split('|');
        if (parts.length === 3) {
          const keyPart = parts[2]; // sidoId-sigunguId
          keys[keyPart] = true;
          return;
        }
      }

      // ID 형태로 저장된 경우 (sido-sigungu 형태) - 기존 호환성
      if (region.includes('-') && /^\d+-\d+$/.test(region)) {
        keys[region] = true;
        return;
      }

      // 서버에서 온 지역 이름과 정확히 매칭 (기존 방식 유지)
      sidos.forEach(sido => {
        const sigunguList = sigungus[sido.siDoId] || [];
        sigunguList.forEach(sigungu => {
          if (sigungu.name === region) {
            keys[`${sido.siDoId}-${sigungu.siGunGuId}`] = true;
          }
        });
      });
    });

    return keys;
  };

  // store의 지역 상태 변경을 selectedChildren에 반영 (컴포넌트 마운트 시 store 값으로 복원)
  useEffect(() => {
    if (isFilter && !isInitialized && sidos.length > 0) {
      setIsUpdatingFromStore(true);
      // store에서 직접 가져오기
      const fullState = useFilterStore.getState();
      const storeRegions = fullState.selectedEffects['지역'] || [];

      if (__DEV__) {
        console.log('[SelectRegion 복원] fullState:', JSON.stringify(fullState, null, 2));
        console.log('[SelectRegion 복원] storeRegions:', storeRegions);
        console.log('[SelectRegion 복원] sidos.length:', sidos.length);
        console.log('[SelectRegion 복원] sigungus keys:', Object.keys(sigungus));
      }

      if (storeRegions.length > 0) {
        // 필요한 시군구 데이터를 먼저 로드
        const loadRequiredSigungus = async () => {
          const sidoIds = new Set<number>();

          storeRegions.forEach(region => {
            if (region.includes('|')) {
              const parts = region.split('|');
              if (parts.length === 3) {
                const [sidoId] = parts[2].split('-');
                sidoIds.add(Number(sidoId));
              }
            }
          });

          if (__DEV__) {
            console.log('[SelectRegion 복원] sidoIds to load:', Array.from(sidoIds));
          }

          // 필요한 시군구 데이터 로드
          for (const sidoId of sidoIds) {
            if (!sigungus[sidoId]) {
              if (__DEV__) {
                console.log('[SelectRegion 복원] Loading sigungus for sidoId:', sidoId);
              }
              await fetchSigungus(sidoId);
            }
          }

          // 데이터 로드 후 복원
          const newSelectedChildren = convertStoreRegionsToKeys(storeRegions);
          if (__DEV__) {
            console.log('[SelectRegion 복원] After load, sigungus keys:', Object.keys(sigungus));
            console.log('[SelectRegion 복원] newSelectedChildren:', newSelectedChildren);
          }
          setSelectedChildren(newSelectedChildren);
        };

        loadRequiredSigungus();
      }

      setIsInitialized(true);
      // 다음 렌더링에서 플래그 해제
      setTimeout(() => setIsUpdatingFromStore(false), 0);
    }
  }, [isFilter, isInitialized, sidos]);

  // resetSignal 오면 선택 초기화
  useEffect(() => {
    if (isFilter) {
      setSelectedChildren({});
      setIsInitialized(false);
    }
  }, [resetSignal]);

  // 모든 시도의 "전체"가 선택되었는지 확인하고 글로벌 전체로 통합
  useEffect(() => {
    if (!isFilter || isUpdatingFromStore) return;

    const firstSido = sidos[0];
    if (firstSido && firstSido.name === '전체') {
      const otherSidos = sidos.slice(1);

      // 이미 글로벌 전체가 선택되어 있으면 체크하지 않음
      if (selectedChildren[GLOBAL_ALL_KEY]) return;

      // 모든 시도의 시군구가 로드되었는지 확인
      const allSidosLoaded = otherSidos.every(s => sigungus[s.siDoId] && sigungus[s.siDoId].length > 0);

      if (allSidosLoaded && otherSidos.length > 0) {
        // 모든 시도의 "전체" 시군구가 선택되었는지 확인
        const allOtherSidosHaveAllSelected = otherSidos.every(s => {
          const sidoChildren = sigungus[s.siDoId] || [];
          const sidoAllSigungu = sidoChildren.find(c => c.name.endsWith(' 전체'));
          return sidoAllSigungu && selectedChildren[`${s.siDoId}-${sidoAllSigungu.siGunGuId}`];
        });

        if (__DEV__) {
          console.log(`모든 시도 전체 선택됨: ${allOtherSidosHaveAllSelected}, 체크할 시도 수: ${otherSidos.length}`);
        }

        if (allOtherSidosHaveAllSelected) {
          if (__DEV__) {
            console.log('글로벌 전체로 통합');
          }
          setSelectedChildren({ [GLOBAL_ALL_KEY]: true });
        }
      }
    }
  }, [selectedChildren, sidos, sigungus, isFilter, isUpdatingFromStore]);

  // 선택된 값 store에 반영 (store 업데이트 중이 아닐 때만, 그리고 초기화 완료 후에만)
  useEffect(() => {
    if (isFilter && !isUpdatingFromStore && isInitialized) {
      const hasSelectedChildren = Object.values(selectedChildren).some(Boolean);

      if (hasSelectedChildren) {
        let selected = Object.entries(selectedChildren)
          .filter(([_, isSelected]) => isSelected)
          .map(([key]) => {
            if (key === GLOBAL_ALL_KEY) return null; // 전체는 선택 해제를 의미하므로 null 반환

            const [sidoId, sigunguId] = key.split('-');
            const sido = sidos.find(s => s.siDoId === Number(sidoId));
            const sigungu = sigungus[Number(sidoId)]?.find(g => g.siGunGuId === Number(sigunguId));

            // 고유 식별을 위해 "시도명|시군구명|sidoId-sigunguId" 형태로 저장
            return sigungu ? `${sido?.name}|${sigungu.name}|${key}` : '';
          })
          .filter(region => region !== null && region !== ''); // null과 빈 문자열 제거

        setSelectedEffect('지역', null);
        selected.forEach(region => {
          if (region) {
            setSelectedEffect('지역', region);

            // ID 별도 저장 로직 - 시군구 ID만 추출
            const parts = region.split('|');
            if (parts.length === 3) {
              const [sidoName, sigunguName, regionId] = parts;
              const displayName = sigunguName.startsWith(sidoName) ? sigunguName : `${sidoName} ${sigunguName}`;
              // regionId는 "sidoId-sigunguId" 형태이므로 sigunguId만 추출
              const sigunguId = regionId.split('-')[1];
              setSelectedRegion(displayName, sigunguId);
            }
          }
        });
      } else {
        // 선택된 항목이 없으면 store도 초기화
        setSelectedEffect('지역', null);
      }
    }
  }, [selectedChildren, isFilter, sidos, sigungus, isUpdatingFromStore, isInitialized]);

  // 필터가 아닐 때
  useEffect(() => {
    if (!isFilter && onSelectionChange && !isUpdatingFromStore) {
      const entries = Object.entries(selectedChildren).filter(([, v]) => v);

      // 숫자 ID 배열
      const ids = entries
        .map(([key]) => {
          if (key === GLOBAL_ALL_KEY) return null;
          const parts = key.split('-');
          const sigunguId = Number(parts[1] ?? Number(key));
          return Number.isFinite(sigunguId) ? sigunguId : null;
        })
        .filter((n): n is number => n !== null);

      // 표시용 이름 배열
      const names = entries
        .map(([key]) => {
          if (key === GLOBAL_ALL_KEY) return '전체';
          const [sidoId, sigunguId] = key.split('-');
          const sido = sidos.find(s => s.siDoId === Number(sidoId));
          const sigungu = sigungus[Number(sidoId)]?.find(g => g.siGunGuId === Number(sigunguId));
          return sigungu ? `${sido?.name} ${sigungu.name}` : null;
        })
        .filter((s): s is string => !!s);

      onSelectionChange(ids, names);
    }
  }, [selectedChildren, isFilter, onSelectionChange, sidos, sigungus, isUpdatingFromStore]);

  // 검색된 suggestion을 sigungu로 변환
  const getSigunguFromSuggestion = (suggestionId: number): { sido: Sido; child: Sigungu } | null => {
    for (const sido of sidos) {
      const sigunguList = sigungus[sido.siDoId] || [];
      const found = sigunguList.find(sg => sg.siGunGuId === suggestionId);
      if (found) {
        return { sido, child: found };
      }
    }
    return null;
  };

  const filteredChildren = searchText.trim()
    ? regionSuggestions
        .map(s => getSigunguFromSuggestion(s.id))
        .filter((item): item is { sido: Sido; child: Sigungu } => item !== null)
    : selectedParent
    ? [
        ...(sigungus[selectedParent] ?? []).map(c => ({
          sido: sidos.find(s => s.siDoId === selectedParent)!,
          child: c,
        })),
      ]
    : [];

  const handleChildToggle = (sido: Sido, child: Sigungu) => {
    // 첫 번째 시도가 "전체"이고, 그 안의 "전체" 시군구인지 확인
    const firstSido = sidos[0];
    const isGlobalAll = sido.siDoId === firstSido?.siDoId && firstSido?.name === '전체' && child.name === '전체';

    const key = isGlobalAll ? GLOBAL_ALL_KEY : `${sido.siDoId}-${child.siGunGuId}`;

    if (!isFilter && !selectedChildren[key]) {
      const currentCount = Object.values(selectedChildren).filter(Boolean).length;
      if (currentCount >= maxSelections) {
        setTimeout(() => {
          onOverLimit?.();
          if (isAndroid) {
            showToast({
              message: `지역은 최대 ${maxSelections}개까지 선택할 수 있어요.`,
              image: 'EmojiRedExclamationMark',
              duration: 1500,
            });
          }
        }, 0);
        return;
      }
    }

    setSelectedChildren(prev => {
      let updated = { ...prev };

      // 1. 최상위 전체의 전체 (글로벌 전체)
      if (isGlobalAll) {
        // 전체 선택 시 항상 모든 지역 필터 해제
        return {};
      }

      // 글로벌 전체가 선택되어있으면 해제
      if (updated[GLOBAL_ALL_KEY]) {
        delete updated[GLOBAL_ALL_KEY];
      }

      // 2. 서버의 '시도 전체' 시군구
      const isServerAll = typeof child === 'object' && child.name.endsWith(' 전체');
      if (isServerAll) {
        const children = sigungus[sido.siDoId] ?? [];

        // 서버의 '시도 전체' 시군구 클릭 시: 전체를 제외한 모든 시군구 해제
        children.forEach(c => {
          if (!c.name.endsWith(' 전체')) {
            delete updated[`${sido.siDoId}-${c.siGunGuId}`];
          }
        });

        updated[key] = !prev[key];
        return updated;
      }

      // 3. 일반 시군구
      if (updated[key]) {
        delete updated[key];
      } else {
        updated[key] = true;
      }

      // 서버의 '시도 전체' 시군구 해제
      const children = sigungus[sido.siDoId] ?? [];
      const allSigungu = children.find(c => c.name.endsWith(' 전체'));
      if (allSigungu) {
        delete updated[`${sido.siDoId}-${allSigungu.siGunGuId}`];
      }

      // 전체를 제외한 나머지 시군구를 모두 선택했는지 확인
      const nonAllChildren = children.filter(c => !c.name.endsWith(' 전체'));
      const selectedCount = nonAllChildren.filter(c => updated[`${sido.siDoId}-${c.siGunGuId}`]).length;

      if (selectedCount === nonAllChildren.length && nonAllChildren.length > 0) {
        // 모든 개별 시군구 해제하고 서버의 '시도 전체' 시군구 선택
        nonAllChildren.forEach(c => delete updated[`${sido.siDoId}-${c.siGunGuId}`]);
        if (allSigungu) {
          updated[`${sido.siDoId}-${allSigungu.siGunGuId}`] = true;
        }
      }

      return updated;
    });
  };

  const getContentPaddingStyle = () => {
    const basePadding = semanticNumber.spacing[36] + semanticNumber.spacing[32] + 52;
    const hasAnyFiltered = getFilteredEffects().length > 0;
    let extra;
    if (isAndroid) {
      if (isFilter) {
        extra = 330;
      } else {
        extra = -20;
      }
    } else {
      if (isFilter) {
        extra = hasAnyFiltered ? 472 : 420;
      } else {
        extra = hasAnyFiltered ? 122 : 70;
      }
    }
    return { paddingBottom: basePadding + extra };
  };

  return (
    <View style={styles.container}>
      <SearchField
        size="small"
        placeholder="지역을 입력해 주세요."
        inputText={searchText}
        setInputText={setSearchText}
        onPress={() => {
          if (__DEV__) {
            console.log(searchText);
          }
        }}
      />

      <View style={styles.optionGroup}>
        {searchText.trim() === '' && (
          <ScrollView style={styles.parentOptionMenu} contentContainerStyle={getContentPaddingStyle()}>
            {sidos.map((sido, index) => (
              <Pressable
                key={sido.siDoId}
                style={[styles.parentOption, selectedParent === sido.siDoId && styles.parentOptionSelected]}
                onPress={() => {
                  setSelectedParent(sido.siDoId);
                  fetchSigungus(sido.siDoId);
                }}>
                <Text style={[styles.parentText, selectedParent === sido.siDoId && styles.parentTextSelected]}>
                  {sido.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <ScrollView style={styles.checkboxItemSlot} contentContainerStyle={getContentPaddingStyle()}>
          {loadingSidoId === selectedParent ? (
            <CheckboxItemSkeleton />
          ) : filteredChildren.length === 0 ? (
            <NoResultSection
              emoji={<EmojiSadface />}
              title="해당 지역을 찾을 수 없어요."
              description="광역 및 기초 행정구역까지만 가능해요."
            />
          ) : searchText.trim() ? (
            // 검색 결과 - suggestion 원본 텍스트 사용
            regionSuggestions.map(s => {
              const match = getSigunguFromSuggestion(s.id);
              if (!match) return null;

              const { sido, child } = match;
              const firstSido = sidos[0];
              const isGlobalAll =
                sido.siDoId === firstSido?.siDoId && firstSido?.name === '전체' && child.name === '전체';

              const key = isGlobalAll ? GLOBAL_ALL_KEY : `${sido.siDoId}-${child.siGunGuId}`;
              const isSelected = selectedChildren[key];

              return (
                <CheckboxItem
                  key={key}
                  label={s.suggestion}
                  selected={!!isSelected}
                  onPress={() => handleChildToggle(sido, child)}
                />
              );
            })
          ) : (
            // 일반 리스트
            filteredChildren.map(({ sido, child }) => {
              const firstSido = sidos[0];
              const isGlobalAll =
                sido.siDoId === firstSido?.siDoId && firstSido?.name === '전체' && child.name === '전체';

              const key = isGlobalAll ? GLOBAL_ALL_KEY : `${sido.siDoId}-${child.siGunGuId}`;
              const isSelected = selectedChildren[key];
              const label = child.name;

              return (
                <CheckboxItem
                  key={key}
                  label={label}
                  selected={!!isSelected}
                  onPress={() => handleChildToggle(sido, child)}
                />
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'flex-start',
    gap: semanticNumber.spacing[16],
  },
  optionGroup: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    gap: semanticNumber.spacing[12],
  },
  parentOptionMenu: {
    width: 140,
    flexGrow: 0,
    flexShrink: 0,
  },
  parentOption: {
    width: '100%',
    height: 52,
    paddingHorizontal: semanticNumber.spacing[16],
    justifyContent: 'center',
    borderRadius: semanticNumber.borderRadius.lg,
  },
  parentOptionSelected: {
    backgroundColor: semanticColor.surface.lightGray,
  },
  parentText: {
    color: semanticColor.text.primary,
    ...semanticFont.body.large,
  },
  parentTextSelected: {
    ...semanticFont.body.largeStrong,
  },
  checkboxItemSlot: {
    flexGrow: 1,
  },
});

export default SelectRegion;
