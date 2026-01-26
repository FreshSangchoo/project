import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { useFilterStore } from '@/stores/useFilterStore';
import ToggleChip from '@/components/common/chip/ToggleChip';

const instrumentState = ['전체', '신품', '매우 양호', '양호', '보통', '하자/고장'];
const sellingState = ['전체', '판매 중', '예약 중', '판매 완료'];

interface FilterStatesProps {
  resetSignal: number;
}

const FilterStates = ({ resetSignal }: FilterStatesProps) => {
  const { selectedEffects, setSelectedEffect } = useFilterStore();

  const selectedInstrumentStates = selectedEffects['악기 상태'] || [];
  const selectedSellingStates = selectedEffects['판매 상태'] || [];

  const handleSelect = (
    state: string,
    category: '악기 상태' | '판매 상태',
    allOptions: string[],
  ) => {
    const current = selectedEffects[category] || [];

    if (state === '전체') {
      setSelectedEffect(category, null);
      return;
    }

    const withoutTotal = current.filter(s => s !== '전체');
    const isAlreadySelected = withoutTotal.includes(state);
    const nextSelected = isAlreadySelected ? withoutTotal.filter(s => s !== state) : [...withoutTotal, state];

    const allOptionsExceptTotal = allOptions.filter(s => s !== '전체');
    const isAllSelected = allOptionsExceptTotal.every(s => nextSelected.includes(s));

    if (isAllSelected || nextSelected.length === 0) {
      setSelectedEffect(category, null);
    } else {
      setSelectedEffect(category, null);
      nextSelected.forEach(s => setSelectedEffect(category, s));
    }
  };

  useEffect(() => {
    if (resetSignal) {
      setSelectedEffect('악기 상태', null);
      setSelectedEffect('판매 상태', null);
    }
  }, [resetSignal, setSelectedEffect]);

  const renderChips = (options: string[], selected: string[], category: '악기 상태' | '판매 상태') =>
    options.map((state, index) => {
      const isSelected = state === '전체' ? selected.length === 0 : selected.includes(state);
      return <ToggleChip key={index} label={state} selected={isSelected} onPress={() => handleSelect(state, category, options)} />;
    });

  return (
    <View style={styles.container}>
      <View style={styles.chipGroup}>
        <Text style={styles.stateTitleText}>악기 상태</Text>
        <View style={styles.chipBox}>
          {renderChips(instrumentState, selectedInstrumentStates, '악기 상태')}
        </View>
      </View>
      <View style={styles.chipGroup}>
        <Text style={styles.stateTitleText}>판매 상태</Text>
        <View style={styles.chipBox}>
          {renderChips(sellingState, selectedSellingStates, '판매 상태')}
        </View>
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
  chipGroup: {
    width: '100%',
    gap: semanticNumber.spacing[4],
  },
  chipBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: semanticNumber.spacing[6],
    rowGap: semanticNumber.spacing.none,
  },
  stateTitleText: {
    color: semanticColor.text.secondary,
    ...semanticFont.title.xxsmall,
  },
});

export default FilterStates;
