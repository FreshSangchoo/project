import { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useFocusEffect } from '@react-navigation/native';
import { createMaterialTopTabNavigator, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';
import { ExploreStackParamList } from '@/hooks/navigation/useExploreNavigation';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import ButtonTitleHeader from '@/components/common/header/ButtonTitleHeader';
import BrandCard from '@/components/common/brand-card/BrandCard';
import TabBar from '@/components/common/tab-bar/TabBar';
import BrandSelling from '@/components/explore/brand/BrandSelling';
import BrandModel from '@/components/explore/brand/BrandModel';
import Toast from '@/components/common/toast/Toast';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import IconHome from '@/assets/icons/IconHome.svg';
import { useFilterToastStore } from '@/stores/useFilterToastStore';

const Tab = createMaterialTopTabNavigator();

function BrandPage() {
  const navigation = useRootNavigation();
  const route = useRoute<RouteProp<ExploreStackParamList, 'BrandPage'>>();
  const { id, brandName, brandKorName } = route.params;
  const { filterVisible, message, image, toastKey } = useFilterToastStore();
  const [isLoading, setIsLoading] = useState(false);

  const initialToastKeyRef = useRef<number | null>(toastKey);

  useFocusEffect(
    useCallback(() => {
      initialToastKeyRef.current = toastKey;
      return () => {};
    }, [toastKey]),
  );

  const shouldShowToast = filterVisible && toastKey !== initialToastKeyRef.current;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <ButtonTitleHeader
        title=""
        leftChilds={{
          icon: (
            <IconChevronLeft
              width={28}
              height={28}
              stroke={semanticColor.icon.primary}
              strokeWidth={semanticNumber.stroke.bold}
            />
          ),
          onPress: () => navigation.goBack(),
        }}
        rightChilds={[
          {
            icon: (
              <IconHome
                width={28}
                height={28}
                stroke={semanticColor.icon.primary}
                strokeWidth={semanticNumber.stroke.bold}
              />
            ),
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'NavBar', params: { screen: 'Home' } }],
              });
            },
          },
        ]}
      />
      <BrandCard brand={brandName ?? ''} korBrandName={brandKorName ?? undefined} isLoading={isLoading} />
      <Tab.Navigator tabBar={(props: MaterialTopTabBarProps) => <TabBar {...props} />}>
        <Tab.Screen name="매물">{() => <BrandSelling brandId={id} isLoading={isLoading} />}</Tab.Screen>
        <Tab.Screen name="모델">{() => <BrandModel brandId={id} isLoading={isLoading} />}</Tab.Screen>
      </Tab.Navigator>
      <Toast key={toastKey} visible={shouldShowToast} message={message} image={image} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
});

export default BrandPage;
