import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useRoute, RouteProp } from '@react-navigation/native';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';

const ScrollWrapper = ({ children }: { children: React.ReactNode }) => {
  const route = useRoute<RouteProp<any>>();

  const isView = route?.name === '브랜드' || route?.name === '가격' || route?.name === '거래방식';

  const Container = isView ? View : ScrollView;
  const containerProps = isView
    ? { style: styles.scrollContainer }
    : {
        horizontal: false,
        showsHorizontalScrollIndicator: false,
        style: styles.scrollContainer,
        contentContainerStyle: styles.contentContainer,
        nestedScrollEnabled: true,
      };

  return (
    <View style={{ flex: 1 }}>
      <Container {...containerProps}>{children}</Container>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    width: '100%',
    flex: 1,
    backgroundColor: semanticColor.surface.white,
    paddingBottom: semanticNumber.spacing[16],
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'stretch',
    paddingBottom: semanticNumber.spacing[36] + semanticNumber.spacing[32] + 52,
  },
});

export default ScrollWrapper;
