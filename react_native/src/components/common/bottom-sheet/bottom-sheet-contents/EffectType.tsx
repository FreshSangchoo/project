import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { effectCategories } from '@/constants/bottom-sheet/EffectCategories';
import { useFilterStore } from '@/stores/useFilterStore';
import Toast from '@/components/common/toast/Toast';
import ToggleChip from '@/components/common/chip/ToggleChip';

interface EffectTypeProps {
  onPress: () => void;
  isFilter?: boolean;
  onChangeSelected?: (orderedNames: string[]) => void;
}

const MAX_SELECT = 4;

const EffectType = ({ onPress, isFilter, onChangeSelected }: EffectTypeProps) => {
  const { selectedEffects: storeSelected, setSelectedEffect: storeSetSelected, getFilteredEffects } = useFilterStore();

  const [localSelectedEffects, setLocalSelectedEffects] = useState<Record<string, string[]>>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [ordered, setOrdered] = useState<string[]>([]);

  const countSelected = (map: Record<string, string[]>) =>
    Object.values(map).reduce((sum, arr) => sum + (arr?.length ?? 0), 0);

  const reportOrder = (nextMap: Record<string, string[]>) => {
    const flat = Object.values(nextMap).flat();
    const kept = ordered.filter(n => flat.includes(n));
    const appended = flat.filter(n => !kept.includes(n));
    const nextOrder = [...kept, ...appended];
    setOrdered(nextOrder);
    onChangeSelected?.(nextOrder);
  };

  const handleSelectEffect = (category: string, effect: string) => {
    if (isFilter) {
      const already = !!storeSelected[category]?.includes(effect);
      storeSetSelected(category, effect);

      const next = { ...storeSelected };
      const set = new Set(next[category] ?? []);
      already ? set.delete(effect) : set.add(effect);
      next[category] = Array.from(set);
      reportOrder(next);
      return;
    }

    setLocalSelectedEffects(prev => {
      const already = !!prev[category]?.includes(effect);
      const currentCount = countSelected(prev);

      if (!already && currentCount >= MAX_SELECT) {
        setToastVisible(v => !v);
        return prev;
      }

      const nextCategory = already
        ? (prev[category] ?? []).filter(e => e !== effect)
        : [...(prev[category] ?? []), effect];

      const next = { ...prev, [category]: nextCategory };
      reportOrder(next);
      return next;
    });
  };

  const selected = isFilter ? storeSelected : localSelectedEffects;

  return (
    <>
      <ScrollView
        nestedScrollEnabled={true}
        style={styles.scrollContainer}
        contentContainerStyle={
          isFilter
            ? undefined
            : {
                paddingBottom: semanticNumber.spacing[36] + semanticNumber.spacing[32] + 52,
              }
        }>
        <View style={styles.typeContainer}>
          {effectCategories.map((category, index) => (
            <View key={index} style={styles.chipGroup}>
              <Text style={styles.typeTitleText}>{category.category}</Text>
              <View style={styles.typeBox}>
                {category.effects.map((effect, effectIndex) => {
                  const isSelected = selected[category.category]?.includes(effect);

                  return (
                    <ToggleChip
                      key={effectIndex}
                      label={effect}
                      selected={isSelected}
                      onPress={() => handleSelectEffect(category.category, effect)}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <Toast
        message="최대 4개까지만 선택가능합니다"
        visible={toastVisible}
        image="EmojiRedExclamationMark"
        duration={1000}
      />
    </>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    width: '100%',
    paddingBottom: semanticNumber.spacing[16],
  },
  typeContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    rowGap: semanticNumber.spacing[32],
    alignSelf: 'stretch',
  },
  chipGroup: {
    width: '100%',
    gap: semanticNumber.spacing[4],
  },
  typeTitleText: {
    color: semanticColor.text.secondary,
    ...semanticFont.title.xxsmall,
  },
  typeBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    alignSelf: 'stretch',
    rowGap: semanticNumber.spacing.none,
    columnGap: semanticNumber.spacing[6],
  },
});

export default EffectType;
