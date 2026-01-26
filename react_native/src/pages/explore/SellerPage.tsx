import { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createMaterialTopTabNavigator, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import useExploreNavigation, { ExploreStackParamList } from '@/hooks/navigation/useExploreNavigation';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import CenterHeader from '@/components/common/header/CenterHeader';
import OtherUserCard from '@/components/common/user-card/OtherUserCard';
import TabBar from '@/components/common/tab-bar/TabBar';
import SellerTransaction from '@/components/explore/seller/SellerTransaction';
import SellerInformation from '@/components/explore/seller/SellerInformation';
import Toast from '@/components/common/toast/Toast';
import ActionBottomSheet from '@/components/common/bottom-sheet/ActionBottomSheet';
import { merchandiseDetailReportOnlyItems } from '@/constants/bottom-sheet/ActionBottomSheetItems';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import IconDotsVertical from '@/assets/icons/IconDotsVertical.svg';
import { useFilterToastStore } from '@/stores/useFilterToastStore';
import { UserProfile } from '@/types/user';
import useUserApi from '@/hooks/apis/useUserApi';
import { useUserStore } from '@/stores/userStore';
import { ReportAction } from '@/constants/bottom-sheet/ActionBottomSheetItems';
import { ensureChannelBoot, openReport } from '@/libs/channel';

const Tab = createMaterialTopTabNavigator();

function SellerPage() {
  const navigation = useExploreNavigation();
  const route = useRoute<RouteProp<ExploreStackParamList, 'SellerPage'>>();
  const { id } = route.params;
  const { filterVisible, message, image, toastKey } = useFilterToastStore();
  const [reportSheet, setReportSheet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { getSellerProfile } = useUserApi();
  const { profile } = useUserStore();

  // 1) 데이터
  const [userData, setUserData] = useState<UserProfile | null>(null);

  // 2) 판매자 정보 조회
  const fetchSellerProfile = async () => {
    try {
      const data = await getSellerProfile(id); // id로 상세 조회
      setUserData(data); // 받아온 데이터 저장
    } catch (error) {
      if (__DEV__) {
        console.error('[SellerPage] getSellerProfile error: ', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerProfile();
  }, []);

  // 작성자가 본인인지
  const isWriterSelf = userData ? userData.userId === profile?.userId : false;

  // const headerTitle = `${userData.nickname} 프로필`;

  const initialToastKeyRef = useRef<number | null>(toastKey);

  useFocusEffect(
    useCallback(() => {
      initialToastKeyRef.current = toastKey;
      return () => {};
    }, [toastKey]),
  );

  const shouldShowToast = filterVisible && toastKey !== initialToastKeyRef.current;

  const makeReportPress = (): ReportAction => ({
    report: () => {
      onPressInquiry();
    },
  });

  // 채널톡
  const onPressInquiry = async () => {
    try {
      await ensureChannelBoot({ name: profile?.name, mobileNumber: profile?.phone });
      openReport();
    } catch (error) {
      if (__DEV__) {
        console.log('[SupportContainer][onPressInquiry] error: ', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <CenterHeader
        title="프로필"
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
              <View style={{ width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
                {!isWriterSelf && (
                  <IconDotsVertical
                    width={28}
                    height={28}
                    stroke={semanticColor.icon.primary}
                    strokeWidth={semanticNumber.stroke.bold}
                  />
                )}
              </View>
            ),
            onPress: () => {
              {
                !isWriterSelf && setReportSheet(true);
              }
            },
          },
        ]}
      />
      {/* <ScrollView> */}
      <OtherUserCard
        profileImage={userData?.profileImage ?? ''}
        nickname={userData?.nickname ?? ''}
        userId={userData?.userId ?? ''}
      />
      <Tab.Navigator tabBar={(props: MaterialTopTabBarProps) => <TabBar {...props} />}>
        <Tab.Screen name="거래 내역">{() => <SellerTransaction userId={userData?.userId ?? 0} />}</Tab.Screen>
        <Tab.Screen name="정보">
          {() => <SellerInformation joinDate={userData?.joinDate ?? ''} verified={userData?.verified ?? false} />}
        </Tab.Screen>
      </Tab.Navigator>
      {/* </ScrollView> */}
      <ActionBottomSheet
        items={merchandiseDetailReportOnlyItems(makeReportPress())}
        onClose={() => setReportSheet(false)}
        visible={reportSheet}
        isSafeArea
      />
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

export default SellerPage;
