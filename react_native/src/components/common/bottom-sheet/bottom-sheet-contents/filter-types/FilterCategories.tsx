import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Pressable } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import EffectType from '@/components/common/bottom-sheet/bottom-sheet-contents/EffectType';
import IconCheck from '@/assets/icons/IconCheck.svg';
import IconChevronDown from '@/assets/icons/IconChevronDown.svg';
import IconChevronUp from '@/assets/icons/IconChevronUp.svg';
import { useFilterToastStore } from '@/stores/useFilterToastStore';

type Instrument = {
  name: string;
  isSelected: boolean;
};

interface FilterCategoriesProps {
  resetSignal?: number;
}

const FilterCategories = ({ resetSignal }: FilterCategoriesProps) => {
  const [instrumentList, setInstrumentList] = useState<Instrument[]>([{ name: '이펙터', isSelected: true }]);
  const [isInstrumentOpen, setIsInstrumentOpen] = useState(false);
  const [isEffectOpen, setIsEffectOpen] = useState(false);
  const { showToast } = useFilterToastStore();

  const handleClick = (index: number) => {
    setInstrumentList(prev => {
      const next = [...prev];
      const target = next[index];
      const isLastSelected = target.isSelected && prev.filter(i => i.isSelected).length === 1;

      if (isLastSelected) {
        showToast('악기 종류는 1개 이상 선택해야 해요.', 'EmojiRedExclamationMark');
        return prev;
      }

      next[index] = { ...target, isSelected: !target.isSelected };
      return next;
    });
  };


  return (
    <>
      <View style={styles.container}>
        <View style={styles.accordian}>
          <TouchableOpacity
            style={styles.contentGroup}
            activeOpacity={1}
            onPress={() => setIsInstrumentOpen(prev => !prev)}>
            <Text style={styles.accordianText}>악기 종류</Text>
            {isInstrumentOpen ? (
              <IconChevronUp
                width={24}
                height={24}
                stroke={semanticColor.icon.lightest}
                strokeWidth={semanticNumber.stroke.bold}
              />
            ) : (
              <IconChevronDown
                width={24}
                height={24}
                stroke={semanticColor.icon.lightest}
                strokeWidth={semanticNumber.stroke.bold}
              />
            )}
          </TouchableOpacity>
          {isInstrumentOpen &&
            instrumentList.map((instrument, index) => (
              <Pressable key={index} style={styles.instrumentItem} onPress={() => handleClick(index)}>
                <View style={styles.touchField}>
                  <IconCheck
                    width={20}
                    height={20}
                    stroke={instrument.isSelected ? semanticColor.checkbox.selected : semanticColor.checkbox.deselected}
                    strokeWidth={semanticNumber.stroke.bold}
                  />
                </View>
                <Text
                  style={[styles.instrumentItemText, instrument.isSelected && { color: semanticColor.text.primary }]}>
                  {instrument.name}
                </Text>
              </Pressable>
            ))}
          <View style={styles.line} />
        </View>
        <View style={styles.accordian}>
          <TouchableOpacity
            style={styles.contentGroup}
            activeOpacity={1}
            onPress={() => setIsEffectOpen(prev => !prev)}>
            <Text style={styles.accordianText}>이펙터 타입</Text>
            {isEffectOpen ? (
              <IconChevronUp
                width={24}
                height={24}
                stroke={semanticColor.icon.lightest}
                strokeWidth={semanticNumber.stroke.bold}
              />
            ) : (
              <IconChevronDown
                width={24}
                height={24}
                stroke={semanticColor.icon.lightest}
                strokeWidth={semanticNumber.stroke.bold}
              />
            )}
          </TouchableOpacity>
          {isEffectOpen && <EffectType onPress={() => {
            if (__DEV__) {
              console.log('눌림');
            }
          }} isFilter />}
          <View style={styles.line} />
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    rowGap: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[16],
    paddingHorizontal: semanticNumber.spacing[24],
  },
  accordian: {
    width: '100%',
    gap: semanticNumber.spacing[16],
  },
  contentGroup: {
    paddingTop: semanticNumber.spacing[16],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordianText: {
    color: semanticColor.text.primary,
    ...semanticFont.title.medium,
  },
  line: {
    width: '100%',
    height: 1,
    backgroundColor: semanticColor.border.light,
  },
  instrumentItem: {
    flexDirection: 'row',
    width: '100%',
    height: 44,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  instrumentItemText: {
    color: semanticColor.text.secondary,
    ...semanticFont.body.medium,
  },
  touchField: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
});

export default FilterCategories;
