import { View, StyleSheet } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import SelectBrand from '@/components/common/bottom-sheet/bottom-sheet-contents/SelectBrand';

const FilterBrands = () => {
  return (
    <>
      <View style={styles.container}>
        <SelectBrand isFilter />
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
});

export default FilterBrands;
