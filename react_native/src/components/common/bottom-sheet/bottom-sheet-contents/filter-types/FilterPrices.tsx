import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Keyboard } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { useFilterStore } from '@/stores/useFilterStore';
import ToggleChip from '@/components/common/chip/ToggleChip';
import NarrowTextField from '@/components/common/text-field/NarrowTextField';
import VariantButton from '@/components/common/button/VariantButton';
import IconAlertCircle from '@/assets/icons/IconAlertCircle.svg';

interface FilterPricesProps {
  setSwipeEnabled: (enabled: boolean) => void;
  resetSignal: number;
}

type PriceRange = {
  label: string;
  min: number;
  max: number;
};

const priceOptions: PriceRange[] = [
  { label: '10만원 이하', min: 0, max: 1 },
  { label: '10만원대', min: 1, max: 2 },
  { label: '20만원대', min: 2, max: 3 },
  { label: '30만원대', min: 3, max: 4 },
  { label: '40만원대', min: 4, max: 5 },
  { label: '50~70만원', min: 5, max: 7 },
  { label: '70~100만원', min: 7, max: 10 },
  { label: '100만원 이상', min: 10, max: 10 },
];

const FilterPrices = ({ setSwipeEnabled, resetSignal }: FilterPricesProps) => {
  const { selectedEffects, setSelectedEffect } = useFilterStore();

  const [selectedPrices, setSelectedPrices] = useState<string[]>(['전체']);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  const isAllSelected = selectedPrices.length === 1 && selectedPrices[0] === '전체';

  const convertLabelToDisplay = (label: string): string | null => {
    if (label === '전체') return null;

    const option = priceOptions.find(p => p.label === label);
    if (!option) return label;

    const minValue = option.min * 10;
    const maxValue = option.max * 10;

    if (label === '10만원 이하') {
      return '10만원 이하';
    } else if (label === '100만원 이상') {
      return '100만원 이상';
    } else if (label === '10만원대') {
      return '10~20만원';
    } else if (label === '20만원대') {
      return '20~30만원';
    } else if (label === '30만원대') {
      return '30~40만원';
    } else if (label === '40만원대') {
      return '40~50만원';
    } else if (label === '50~70만원') {
      return '50~70만원';
    } else if (label === '70~100만원') {
      return '70~100만원';
    }

    return label;
  };

  const handleSelectPrice = (label: string) => {
    // 칩 선택 시 인풋 값 초기화
    setMinPrice('');
    setMaxPrice('');
    setHasError(false);

    if (label === '전체') {
      setSelectedPrices(['전체']);
      return;
    }

    setSelectedPrices([label]);
  };

  const handleInputChange = (value: string, type: 'min' | 'max') => {
    // 숫자만 추출, 8자리 제한
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 8);

    // 콤마 추가
    const formattedValue = numericValue ? Number(numericValue).toLocaleString() : '';

    if (type === 'min') {
      setMinPrice(formattedValue);
    } else {
      setMaxPrice(formattedValue);
    }

    // 입력 중에는 에러 초기화
    setHasError(false);

    // 인풋 입력 시 칩 미선택
    if (numericValue) {
      setSelectedPrices([]);
    }
  };

  const handleApply = () => {
    // 키보드 닫기
    Keyboard.dismiss();

    // 인풋 값이 있으면 인풋 값으로, 없으면 선택된 칩으로
    if (minPrice || maxPrice) {
      // 에러 검증: 둘 다 입력되었고, max가 min보다 작으면 에러
      if (minPrice && maxPrice) {
        const minNum = parseInt(minPrice.replace(/,/g, ''));
        const maxNum = parseInt(maxPrice.replace(/,/g, ''));
        if (maxNum < minNum) {
          setHasError(true);
          return;
        }
      }

      let displayValue = '';
      if (minPrice && maxPrice) {
        displayValue = `${minPrice}~${maxPrice}원`;
      } else if (minPrice) {
        displayValue = `${minPrice}원 이상`;
      } else if (maxPrice) {
        displayValue = `${maxPrice}원 이하`;
      }

      setSelectedEffect('가격', displayValue || null);
    } else {
      if (isAllSelected) {
        setSelectedEffect('가격', null);
      } else if (selectedPrices.length > 0) {
        const displayValue = convertLabelToDisplay(selectedPrices[0]);
        setSelectedEffect('가격', displayValue);
      }
    }
  };

  useEffect(() => {
    // 칩 선택 시 즉시 적용 (인풋 값이 없을 때만)
    if (!minPrice && !maxPrice) {
      if (isAllSelected) {
        setSelectedEffect('가격', null);
      } else if (selectedPrices.length > 0) {
        const displayValue = convertLabelToDisplay(selectedPrices[0]);
        setSelectedEffect('가격', displayValue);
      }
    }
  }, [selectedPrices, minPrice, maxPrice]);

  useEffect(() => {
    setSelectedPrices(['전체']);
    setMinPrice('');
    setMaxPrice('');
    setHasError(false);
    setIsInitialized(false);
  }, [resetSignal]);

  // 컴포넌트 마운트 시 store 값으로 복원
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      const priceEffects = selectedEffects['가격'] || [];

      if (priceEffects.length > 0) {
        // store에 가격이 있으면 로컬 state로 복원
        const storedPriceValue = priceEffects[0];

        // 직접 입력 형식: "10,000원 이하", "50,000원 이상", "50,000~70,000원"
        const isDirectInput = storedPriceValue.includes(',') && storedPriceValue.includes('원');

        if (isDirectInput) {
          // 직접 입력 값 복원
          if (storedPriceValue.includes('~')) {
            // "50,000~70,000원" -> minPrice: "50,000", maxPrice: "70,000"
            const [minStr, maxStr] = storedPriceValue.replace('원', '').split('~');
            setMinPrice(minStr.trim());
            setMaxPrice(maxStr.trim());
            setSelectedPrices([]);
          } else if (storedPriceValue.includes('이상')) {
            // "50,000원 이상" -> minPrice: "50,000"
            const minStr = storedPriceValue.replace('원 이상', '').trim();
            setMinPrice(minStr);
            setMaxPrice('');
            setSelectedPrices([]);
          } else if (storedPriceValue.includes('이하')) {
            // "100,000원 이하" -> maxPrice: "100,000"
            const maxStr = storedPriceValue.replace('원 이하', '').trim();
            setMinPrice('');
            setMaxPrice(maxStr);
            setSelectedPrices([]);
          }
        } else {
          // 칩 선택 형식: "10만원 이하", "10~20만원" 등
          // 저장된 display 값을 label로 역변환
          let matchedLabel = '';

          if (storedPriceValue === '10만원 이하') matchedLabel = '10만원 이하';
          else if (storedPriceValue === '100만원 이상') matchedLabel = '100만원 이상';
          else if (storedPriceValue === '10~20만원') matchedLabel = '10만원대';
          else if (storedPriceValue === '20~30만원') matchedLabel = '20만원대';
          else if (storedPriceValue === '30~40만원') matchedLabel = '30만원대';
          else if (storedPriceValue === '40~50만원') matchedLabel = '40만원대';
          else if (storedPriceValue === '50~70만원') matchedLabel = '50~70만원';
          else if (storedPriceValue === '70~100만원') matchedLabel = '70~100만원';

          if (matchedLabel) {
            setSelectedPrices([matchedLabel]);
            setMinPrice('');
            setMaxPrice('');
          }
        }
      }

      setIsInitialized(true);
    }
  }, [isInitialized, selectedEffects]);

  return (
    <View style={styles.container}>
      <View style={styles.innerGroup}>
        <Text style={styles.priceTitleText}>가격대</Text>
        <View style={styles.chipBox}>
          <ToggleChip label="전체" selected={isAllSelected} onPress={() => handleSelectPrice('전체')} />
          {priceOptions.map((option, index) => {
            const isSelected = selectedPrices.includes('전체') ? false : selectedPrices.includes(option.label);
            return (
              <ToggleChip
                key={index}
                label={option.label}
                selected={isSelected}
                onPress={() => handleSelectPrice(option.label)}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.innerGroup}>
        <View style={styles.inputGroup}>
          <NarrowTextField
            placeholder="최소"
            inputText={minPrice}
            setInputText={value => handleInputChange(value, 'min')}
            onPress={handleApply}
          />
          <Text style={styles.inputText}>~</Text>
          <NarrowTextField
            placeholder="최대"
            inputText={maxPrice}
            setInputText={value => handleInputChange(value, 'max')}
            onPress={handleApply}
          />
        </View>
        {hasError && (
          <View style={styles.errorGroup}>
            <IconAlertCircle
              width={16}
              height={16}
              stroke={semanticColor.icon.critical}
              strokeWidth={semanticNumber.stroke.bold}
            />
            <Text style={styles.errorText}>유효한 입력 범위로 입력해 주세요.</Text>
          </View>
        )}
        <VariantButton theme="sub" isFull disabled={!minPrice && !maxPrice} onPress={handleApply}>
          적용하기
        </VariantButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[16],
    paddingHorizontal: semanticNumber.spacing[24],
  },
  innerGroup: {
    width: '100%',
    gap: semanticNumber.spacing[4],
  },
  chipBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: semanticNumber.spacing[6],
    rowGap: semanticNumber.spacing.none,
  },
  priceTitleText: {
    color: semanticColor.text.secondary,
    ...semanticFont.title.xxsmall,
  },
  inputGroup: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[4],
    paddingBottom: semanticNumber.spacing[6],
  },
  inputText: {
    color: semanticColor.text.lightest,
    ...semanticFont.title.large,
  },
  errorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[4],
  },
  errorText: {
    color: semanticColor.text.critical,
    ...semanticFont.caption.large,
  },
});

export default FilterPrices;
