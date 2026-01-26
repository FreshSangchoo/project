import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import TitleMainHeader from '@/components/common/header/TitleMainHeader';
import MyUserCard from '@/components/common/user-card/MyUserCard';
import MyPageMenuButton from '@/components/my-page/MyPageMenuButton';
import SectionSeparator from '@/components/common/SectionSeparator';
import MyPageSection from '@/components/my-page/MyPageSection';
import CustomerService from '@/components/common/CustomerService';
import SettingItem from '@/components/my-page/SettingItemRow';
import { accountSystemItems, accountSystemSocialItems, serviceInfoItems } from '@/constants/MyPageSectionItems';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import { semanticColor } from '@/styles/semantic-color';
import IconBell from '@/assets/icons/IconBell.svg';
import IconReceiptFilled from '@/assets/icons/IconReceiptFilled.svg';
import IconClockFilled from '@/assets/icons/IconClockFilled.svg';
import IconHeartFilled from '@/assets/icons/IconHeartFilled.svg';
import IconHelpCircleFilled from '@/assets/icons/IconHelpCircleFilled.svg';
import IconExternalLink from '@/assets/icons/IconExternalLink.svg';
import IconInfoCircleFilled from '@/assets/icons/IconInfoCircleFilled.svg';
import IconMessageCircle from '@/assets/icons/IconMessageCircle.svg';
import IconLogin2 from '@/assets/icons/IconLogin2.svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import useRootNavigation from '@/hooks/navigation/useRootNavigation';
import { useUserStore } from '@/stores/userStore';
import { ensureChannelBoot, openChannelTalk } from '@/libs/channel';

function MyPage() {
  const navigation = useRootNavigation();
  const profile = useUserStore(p => p.profile);
  const goLogin = useUserStore(c => c.clearProfile);

  const menuItems = [
    {
      id: 0,
      icon: <IconReceiptFilled />,
      text: '거래 내역',
      onPress: () => navigation.navigate('MyStack', { screen: 'TransactionLogPage' }),
    },
    {
      id: 1,
      icon: <IconClockFilled width={20} height={20} fill={semanticColor.icon.secondary} />,
      text: '최근 본 악기',
      onPress: () => navigation.navigate('MyStack', { screen: 'RecentSeenLogPage' }),
    },
    {
      id: 2,
      icon: <IconHeartFilled width={20} height={20} fill={semanticColor.icon.secondary} />,
      text: '내가 찜한 악기',
      onPress: () => navigation.navigate('MyStack', { screen: 'FavoriteLogPage' }),
    },
  ];

  const onPressInquiry = async () => {
    try {
      await ensureChannelBoot({ name: profile?.name, mobileNumber: profile?.phone });
      openChannelTalk();
    } catch (error) {
      console.log('[SupportContainer][onPressInquiry] error: ', error);
    }
  };

  const onPressFAQ = () => {
    Linking.openURL('https://jammering-support.notion.site/frequently-asked-questions');
  };

  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setReady(true));
  }, [insets.top, insets.bottom, insets.left, insets.right]);

  return (
    <SafeAreaView style={styles.mypageContainer} edges={['top', 'right', 'left']}>
      <TitleMainHeader
        title="마이"
        rightChilds={[
          {
            icon: (
              <IconBell
                width={28}
                height={28}
                stroke={semanticColor.icon.primary}
                strokeWidth={semanticNumber.stroke.bold}
              />
            ),
            onPress: () => navigation.navigate('MyStack', { screen: 'Notification' }),
          },
        ]}
      />
      <ScrollView>
        {profile?.userId ? (
          <>
            <MyUserCard
              profileImage={profile?.profileImage ?? null}
              nickname={profile?.nickname ?? '알 수 없음'}
              userId={'@' + String(profile?.userId)}
            />
            <View style={styles.userMenuWrapper}>
              {menuItems.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <View style={styles.menuItem}>
                    <MyPageMenuButton {...item} />
                  </View>
                  {idx !== menuItems.length - 1 && <SectionSeparator type="vertical" height={33} />}
                </React.Fragment>
              ))}
            </View>
            {profile.provider === 'LOCAL' ? (
              <MyPageSection sectionTitle="계정 및 시스템" sectionItems={accountSystemItems(navigation)} />
            ) : (
              <MyPageSection sectionTitle="계정 및 시스템" sectionItems={accountSystemSocialItems(navigation)} />
            )}
          </>
        ) : (
          <View style={{ marginBottom: semanticNumber.spacing[20], paddingVertical: semanticNumber.spacing[8] }}>
            <SettingItem
              itemImage={
                <IconLogin2
                  width={24}
                  height={24}
                  stroke={semanticColor.icon.secondary}
                  strokeWidth={semanticNumber.stroke.bold}
                />
              }
              itemName="로그인/회원가입 하기"
              showNextButton
              onPress={() => {
                goLogin();
                navigation.reset({ index: 0, routes: [{ name: 'AuthStack', params: { screen: 'Welcome' } }] });
              }}
            />
          </View>
        )}
        <SectionSeparator type="line-with-padding" />
        <MyPageSection sectionTitle="서비스 정보" sectionItems={serviceInfoItems(navigation)} />
        <SectionSeparator type="line-with-padding" />
        <View style={styles.supportSection}>
          <View style={styles.supportSectionTitleWrapper}>
            <Text style={styles.supportSectionTitleText}>고객 지원</Text>
          </View>
          <View style={styles.supportButtonWrapper}>
            <CustomerService
              infoIcon={<IconHelpCircleFilled width={20} height={20} fill={semanticColor.icon.secondary} />}
              title="자주 묻는 질문"
              subTitle="많은 분들이 궁금해 하시는 질문과 답변을 모았어요."
              buttonIcon={
                <IconExternalLink
                  width={24}
                  height={24}
                  stroke={semanticColor.icon.lightest}
                  strokeWidth={semanticNumber.stroke.bold}
                />
              }
              onPress={onPressFAQ}
            />
            <CustomerService
              infoIcon={<IconInfoCircleFilled width={20} height={20} fill={semanticColor.icon.secondary} />}
              title="문의하기"
              subTitle="궁금하거나 문의해야 할 내용이 있다면?"
              buttonIcon={
                <IconMessageCircle
                  width={24}
                  height={24}
                  stroke={semanticColor.icon.lightest}
                  strokeWidth={semanticNumber.stroke.bold}
                />
              }
              onPress={onPressInquiry}
            />
          </View>
        </View>
      </ScrollView>
      {!ready && (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: semanticColor.surface.white }]}
          pointerEvents="none"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mypageContainer: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  userMenuWrapper: {
    paddingHorizontal: semanticNumber.spacing[8],
    paddingVertical: semanticNumber.spacing[16],
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 76,
    marginBottom: semanticNumber.spacing[20],
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportSection: {
    paddingBottom: semanticNumber.spacing[40],
  },
  supportSectionTitleWrapper: {
    padding: semanticNumber.spacing[16],
  },
  supportSectionTitleText: {
    ...semanticFont.headline.medium,
    color: semanticColor.text.secondary,
  },
  supportButtonWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[12],
  },
});

export default MyPage;
