import ButtonTitleHeader from '@/components/common/header/ButtonTitleHeader';
import { StyleSheet, Text, View, Linking, Platform } from 'react-native';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import MyPageSection from '@/components/my-page/MyPageSection';
import { marketingAlarmItems, chattingAlarmItems, pushAlarmItems } from '@/constants/MyPageSectionItems';
import SectionSeparator from '@/components/common/SectionSeparator';
import { useNavigation } from '@react-navigation/native';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import EmojiBell from '@/assets/icons/EmojiBell.svg';
import Toggle from '@/components/my-page/Toggle';
import MainButton from '@/components/common/button/MainButton';
import { semanticFont } from '@/styles/semantic-font';
import { useEffect, useState } from 'react';
import Modal from '@/components/common/modal/Modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationApi, getNotificationSettingProps } from '@/hooks/apis/useNotificationApi';
import CheckAlarmsetting from '@/components/permission-check/util/CheckAlarmsetting';
import { useToastStore } from '@/stores/toastStore';

function PushSettingPage() {
  const date = new Date();
  const today = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
  const navigation = useNavigation();

  const [allPushToggle, setAllPushToggle] = useState(true);
  const [chattingAlarmToggle, setChattingAlarmToggle] = useState(true);
  const [ismarketingAlarmOn, setIsmarketingAlarmOn] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [turnOnAlarm, setTurnOnAlarm] = useState(false);

  const { putNotificationMarketing, getNotificationSetting, putNotificationChat, putNotificationPush } =
    useNotificationApi();

  const showToast = useToastStore(s => s.show);

  useEffect(() => {
    fetchData();
    fetchAlarm();
  }, []);

  const fetchData = async () => {
    const data = await getMarketingAlarmStatus();
    if (data) {
      setChattingAlarmToggle(data.chatEnabled);
      setIsmarketingAlarmOn(data.marketingEnabled);
      setAllPushToggle(data.pushEnabled);
    }
  };

  const fetchAlarm = async () => {
    const { androidAlarm, iosAlarmToken } = CheckAlarmsetting();
    if (Platform.OS === 'ios') {
      const { enabled } = await iosAlarmToken();
      setTurnOnAlarm(enabled);
    } else {
      const has = await androidAlarm();
      setTurnOnAlarm(has);
    }
  };

  const handleIOSToggle = () => {
    showToast({ message: '여기가 아니에요!', image: 'EmojiWavingHand', duration: 2000 });
  };

  const handleMarketingAlarmModal = () => {
    if (ismarketingAlarmOn) {
      setIsModalVisible(true);
      //여기에 켜지는 거 넣어야함
    } else {
      handleMarketingAlarm();
    }
  };

  const handleMarketingToggle = () => {
    const changeState = !ismarketingAlarmOn;
    setIsmarketingAlarmOn(changeState);

    const message = changeState
      ? `아키파이 광고성 정보 수신 동의 (${today})`
      : `아키파이 광고성 정보 수신 해제 (${today})`;

    showToast({ message, image: 'EmojiDove', duration: 2000 });
  };

  // 상태 조회
  const getMarketingAlarmStatus = async (): Promise<getNotificationSettingProps | undefined> => {
    try {
      const data = await getNotificationSetting();
      if (data) return data.data;
    } catch (error) {
      if (__DEV__) {
        console.error('마케팅 알림 상태 조회 중 오류 발생:', error);
      }
    }
  };

  // 전체 알림 설정
  const handleEntireAlarm = async () => {
    const changeState = !allPushToggle;
    try {
      const data = await putNotificationPush({ pushEnabled: changeState });
      if (data) setAllPushToggle(changeState);
    } catch (error) {
      showToast({ message: '알림 설정에 실패했습니다. 다시 시도해주세요.' });
      if (__DEV__) {
        console.error('전체 알림 설정 중 오류 발생:', error);
      }
    }
  };

  // 마케팅 알림 설정
  const handleMarketingAlarm = async () => {
    try {
      const data = await putNotificationMarketing({ marketingEnabled: !ismarketingAlarmOn });
      if (data) {
        handleMarketingToggle();
        setIsModalVisible(false);
      } else {
        showToast({ message: '마케팅 알림 설정에 실패했습니다.' });
      }
    } catch (error) {
      showToast({ message: '마케팅 알림 설정에 실패했습니다. 다시 시도해주세요.' });
      if (__DEV__) {
        console.error('마케팅 알림 설정 중 오류 발생:', error);
      }
    }
  };

  // 채팅 알림 설정
  const handleChatAlarm = async () => {
    const changeState = !chattingAlarmToggle;
    try {
      const data = await putNotificationChat({ chatEnabled: changeState });
      if (data) {
        setChattingAlarmToggle(changeState);
      } else {
        showToast({ message: '채팅 알림 설정에 실패했습니다.' });
      }
    } catch (error) {
      showToast({ message: '채팅 알림 설정에 실패했습니다. 다시 시도해주세요.' });
      if (__DEV__) {
        console.error('채팅 알림 설정 중 오류 발생:', error);
      }
    }
  };

  const handleClickSetting = () => {
    Linking.openSettings();
  };

  return (
    <SafeAreaView style={styles.pushSettingPage}>
      <ButtonTitleHeader
        title="알림 설정"
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
      />
      <View style={styles.deviceAlarmStateContainer}>
        {!turnOnAlarm && (
          <View style={styles.deviceAlarmStateContents}>
            <View style={styles.textWrapper}>
              <View style={styles.mainTextWrapper}>
                <Text style={styles.mainText}>기기 알림이 꺼져 있어요</Text>
                <EmojiBell width={24} height={24} />
              </View>
              <Text style={styles.subText}>거래 진행을 위해 알림 기능을 먼저 켜주세요.</Text>
            </View>
            <View style={styles.exampleWrapper}>
              <Text style={styles.exampleText}>알림 허용</Text>
              <Toggle isOn onToggle={handleIOSToggle} isIOS />
            </View>
            <MainButton children="기기 알림 켜기" onPress={handleClickSetting} />
          </View>
        )}
      </View>

      <MyPageSection
        sectionTitle="전체 알림"
        sectionItems={pushAlarmItems(allPushToggle, handleEntireAlarm, !turnOnAlarm)}
      />
      <SectionSeparator type="line-with-padding" />

      <MyPageSection
        sectionTitle="채팅 알림"
        sectionItems={chattingAlarmItems(chattingAlarmToggle, handleChatAlarm, !allPushToggle || !turnOnAlarm)}
      />
      <SectionSeparator type="line-with-padding" />

      <MyPageSection
        sectionTitle="마케팅 알림"
        sectionItems={marketingAlarmItems(
          ismarketingAlarmOn,
          handleMarketingAlarmModal,
          !allPushToggle || !turnOnAlarm,
        )}
      />

      {isModalVisible && (
        <Modal
          isRow
          titleText="알림을 끄시겠어요?"
          descriptionText="아키파이에서 제공하는 다양한 혜택과 중요한 이벤트 정보를 못 받게 돼요."
          mainButtonText="알림 끄기"
          buttonTheme="critical"
          subButtonText="취소"
          visible
          onClose={() => setIsModalVisible(false)}
          onMainPress={handleMarketingAlarm}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pushSettingPage: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  deviceAlarmStateContainer: {
    paddingVertical: semanticNumber.spacing[8],
    paddingHorizontal: semanticNumber.spacing[16],
  },
  deviceAlarmStateContents: {
    alignItems: 'center',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingTop: semanticNumber.spacing[24],
    paddingBottom: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[24],
    backgroundColor: semanticColor.surface.lightGray,
    borderRadius: semanticNumber.borderRadius.xl2,
  },
  textWrapper: {
    alignItems: 'center',
    gap: semanticNumber.spacing[10],
  },
  mainTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: semanticNumber.spacing[4],
  },
  mainText: {
    ...semanticFont.title.large,
    color: semanticColor.text.primary,
  },
  subText: {
    ...semanticFont.body.medium,
    color: semanticColor.text.secondary,
  },
  exampleWrapper: {
    flexDirection: 'row',
    paddingHorizontal: semanticNumber.spacing[8],
    paddingVertical: semanticNumber.spacing[4],
    width: 232,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: semanticColor.surface.white,
    borderRadius: semanticNumber.borderRadius.md,
  },
  exampleText: {
    ...semanticFont.body.small,
  },
});

export default PushSettingPage;
