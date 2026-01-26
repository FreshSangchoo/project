import { useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';
import type { CommonStackParamList } from '@/navigation/types/common-stack';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import CenterHeader from '@/components/common/header/CenterHeader';
import EffectType from '@/components/common/bottom-sheet/bottom-sheet-contents/EffectType';
import SelectBrand, { Brand } from '@/components/common/bottom-sheet/bottom-sheet-contents/SelectBrand';
import SelectRegion from '@/components/common/bottom-sheet/bottom-sheet-contents/SelectRegion';
import SelectFilter from '@/components/common/bottom-sheet/bottom-sheet-contents/SelectFilter';
import MainButton from '@/components/common/button/MainButton';
import VariantButton from '@/components/common/button/VariantButton';
import Toast from '@/components/common/toast/Toast';
import IconX from '@/assets/icons/IconX.svg';
import IconReload from '@/assets/icons/IconReload.svg';
import { useFilterStore } from '@/stores/useFilterStore';
import { useFilterToastStore } from '@/stores/useFilterToastStore';
import { useSemanticStore } from '@/stores/useSementicStore';
import { useUploadDataStore } from '@/stores/useUploadDataStore';

interface AosBottomSheetProps {
  onSelectBrand?: (brand: Brand) => void;
  onSelectEffects?: (names: string[]) => void;
}

function AosBottomSheet({ onSelectBrand, onSelectEffects }: AosBottomSheetProps) {
  const navigation = useRootNavigation();
  const route = useRoute<RouteProp<CommonStackParamList, 'AosBottomSheet'>>();
  const title = route.params.title;
  const paramsOnSelectBrand = route.params.onSelectBrand;
  const paramsOnSelectEffects = route.params.onSelectEffects;
  const [resetSignal, setResetSignal] = useState(0);
  const { getFilteredEffects, resetSelectedEffects, setSelectedEffect } = useFilterStore();
  const filtered = getFilteredEffects();
  const { setBrandByName, setEffectsByNames } = useSemanticStore();

  const setDirectLocations = useUploadDataStore(s => s.setDirectLocations);
  const setDirectRegionNames = useUploadDataStore(s => s.setDirectRegionNames);

  // 선택 항목 개별 삭제
  const handleRemoveFilter = (category: string, value: string) => {
    if (category === '지역') {
      // 지역의 경우 실제 store에 저장된 원본 값을 찾아서 제거
      const { selectedEffects } = useFilterStore.getState();
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
    } else if (category === '가격') {
      // 가격은 단일 선택이므로 null로 초기화
      setSelectedEffect(category, null);
    } else {
      // 복수 선택 카테고리는 토글 방식
      setSelectedEffect(category, value);
    }
  };

  // 전체 초기화
  const handleResetFilter = () => {
    resetSelectedEffects();
    setResetSignal(prev => prev + 1);
  };

  const { filterVisible, message, image, duration, toastKey } = useFilterToastStore();
  const latestEffectsRef = useRef<string[]>([]);

  const handleApply = () => {
    if (title === '이펙터 타입') {
      setEffectsByNames(latestEffectsRef.current);
      paramsOnSelectEffects?.(latestEffectsRef.current);
      onSelectEffects?.(latestEffectsRef.current);
    } else if (title === '필터') {
      const { applyFilters } = useFilterStore.getState();
      applyFilters?.();
    } else if (title === '지역 선택') {
      // 지역 선택은 이미 onSelectionChange에서 처리됨
    }
    navigation.goBack();
  };

  const handleClose = () => {
    useFilterToastStore.getState().filterVisible && useFilterToastStore.setState({ filterVisible: false });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <CenterHeader
        title={title}
        rightChilds={[
          {
            icon: (
              <View style={{ width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
                <IconX
                  width={28}
                  height={28}
                  stroke={semanticColor.icon.primary}
                  strokeWidth={semanticNumber.stroke.bold}
                />
              </View>
            ),
            onPress: handleClose,
          },
        ]}
      />
      <View
        style={[
          styles.content,
          title === '필터' && {
            paddingVertical: 0,
            paddingHorizontal: 0,
            rowGap: 0,
          },
        ]}>
        {title === '이펙터 타입' && (
          <EffectType
            onPress={handleClose}
            onChangeSelected={ordered => {
              latestEffectsRef.current = ordered;
            }}
          />
        )}
        {title === '브랜드 선택' && (
          <SelectBrand
            onSelect={(brand: Brand) => {
              setBrandByName(brand.name);
              paramsOnSelectBrand?.(brand);
              onSelectBrand?.(brand);
              navigation.goBack();
            }}
            onSkip={() => {
              route.params.onSkip?.();
              navigation.goBack();
            }}
          />
        )}
        {title === '지역 선택' && (
          <SelectRegion
            isFilter={false}
            maxSelections={2}
            onSelectionChange={(ids, names) => {
              setDirectLocations(ids);
              setDirectRegionNames(names);
            }}
          />
        )}
        {title === '필터' && <SelectFilter resetSignal={resetSignal} />}
      </View>
      {(title === '이펙터 타입' || title === '필터') && (
        <View style={styles.toolBar}>
          {filtered.length > 0 && (
            <View style={styles.selectedSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.buttonGroup}>
                {filtered.map(({ category, value }, idx) => (
                  <VariantButton key={idx} theme="sub" onPress={() => handleRemoveFilter(category, value)}>
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
          <MainButton onPress={handleApply}>{title === '필터' ? '필터 적용하기' : '선택 완료'}</MainButton>
        </View>
      )}
      {title === '지역 선택' && (
        <View style={styles.toolBar}>
          <MainButton onPress={handleApply}>선택 완료</MainButton>
        </View>
      )}
      <Toast
        key={toastKey}
        visible={filterVisible}
        message={message}
        image="EmojiRedExclamationMark"
        duration={duration}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    rowGap: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[16],
    paddingHorizontal: semanticNumber.spacing[24],
  },
  toolBar: {
    width: '100%',
    zIndex: 5,
    paddingTop: semanticNumber.spacing[10],
    paddingBottom: semanticNumber.spacing[10],
    paddingHorizontal: semanticNumber.spacing[16],
    borderTopColor: semanticColor.border.medium,
    borderTopWidth: semanticNumber.stroke.hairline,
    backgroundColor: semanticColor.surface.white,
    gap: semanticNumber.spacing[8],
  },
  selectedSection: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

export default AosBottomSheet;
