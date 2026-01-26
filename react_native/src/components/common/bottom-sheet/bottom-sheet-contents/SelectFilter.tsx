import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import BottomSheetTabBar from './BottomSheetTabBar';
import ScrollWrapper from '@/components/common/bottom-sheet/bottom-sheet-contents/ScrollWrapper';
import FilterCategories from '@/components/common/bottom-sheet/bottom-sheet-contents/filter-types/FilterCategories';
import FilterBrands from '@/components/common/bottom-sheet/bottom-sheet-contents/filter-types/FilterBrands';
import FilterPrices from '@/components/common/bottom-sheet/bottom-sheet-contents/filter-types/FilterPrices';
import FilterWays from '@/components/common/bottom-sheet/bottom-sheet-contents/filter-types/FilterWays';
import FilterStates from '@/components/common/bottom-sheet/bottom-sheet-contents/filter-types/FilterStates';

interface SelectFilterProps {
  onPress?: () => void;
  resetSignal: number;
}

const Tab = createMaterialTopTabNavigator();

const SelectFilter = ({ onPress, resetSignal }: SelectFilterProps) => {
  const [swipeEnabled, setSwipeEnabled] = useState(true);

  return (
    <View style={styles.container}>
      <Tab.Navigator tabBar={(props: MaterialTopTabBarProps) => <BottomSheetTabBar {...props} />}>
        <Tab.Screen
          name="카테고리"
          children={() => (
            <ScrollWrapper>
              <FilterCategories resetSignal={resetSignal} />
            </ScrollWrapper>
          )}
        />
        <Tab.Screen
          name="브랜드"
          children={() => (
            <ScrollWrapper>
              <FilterBrands />
            </ScrollWrapper>
          )}
        />
        <Tab.Screen
          name="가격"
          children={() => (
            <ScrollWrapper>
              <FilterPrices setSwipeEnabled={setSwipeEnabled} resetSignal={resetSignal} />
            </ScrollWrapper>
          )}
          options={{ swipeEnabled }}
        />
        <Tab.Screen
          name="거래방식"
          children={() => (
            <ScrollWrapper>
              <FilterWays resetSignal={resetSignal} />
            </ScrollWrapper>
          )}
        />
        <Tab.Screen
          name="상태"
          children={() => (
            <ScrollWrapper>
              <FilterStates resetSignal={resetSignal} />
            </ScrollWrapper>
          )}
        />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});

export default SelectFilter;
