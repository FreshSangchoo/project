import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import SelectRegion from '@/components/common/bottom-sheet/bottom-sheet-contents/SelectRegion';
import { useFilterStore } from '@/stores/useFilterStore';
import ToggleChip from '@/components/common/chip/ToggleChip';

const transactionWay = ['전체', '직거래', '택배거래'];

interface FilterStatesProps {
  resetSignal: number;
}

const FilterWays = ({ resetSignal }: FilterStatesProps) => {
  const { selectedEffects, setSelectedEffect } = useFilterStore();
  const selectedWay = selectedEffects['거래방식'] ?? [];

  const handleSelectWay = (way: string) => {
    const current = selectedEffects['거래방식'] || [];

    if (way === '전체') {
      setSelectedEffect('거래방식', null);
      return;
    }

    const next = current.includes(way) ? current.filter(w => w !== way) : [...current.filter(w => w !== '전체'), way];

    const allWaysExceptTotal = transactionWay.filter(w => w !== '전체');
    const isAllSelected = allWaysExceptTotal.every(w => next.includes(w));

    if (isAllSelected || next.length === 0) {
      setSelectedEffect('거래방식', null);
    } else {
      setSelectedEffect('거래방식', null);
      next.forEach(w => setSelectedEffect('거래방식', w));
    }
  };

  useEffect(() => {
    if (resetSignal) {
      setSelectedEffect('거래방식', null);
    }
  }, [resetSignal]);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.chipGroup}>
          <Text style={styles.wayTitleText}>거래방식</Text>
          <View style={styles.chipBox}>
            {transactionWay.map((way, index) => {
              const selected = way === '전체' ? selectedWay.length === 0 : selectedWay.includes(way);
              return <ToggleChip key={index} label={way} selected={selected} onPress={() => handleSelectWay(way)} />;
            })}
          </View>
        </View>
        <View style={styles.optionGroup}>
          <Text style={styles.wayTitleText}>지역</Text>
          <SelectRegion isFilter resetSignal={resetSignal} />
        </View>
      </View>
    </>
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
  optionGroup: {
    width: '100%',
    gap: semanticNumber.spacing[12],
  },
  wayTitleText: {
    color: semanticColor.text.secondary,
    ...semanticFont.title.xxsmall,
  },
});

export default FilterWays;
