import { StyleSheet, TouchableOpacity, View, Text, Animated } from 'react-native';
import CenterHeader from '@/components/common/header/CenterHeader';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import { semanticColor } from '@/styles/semantic-color';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import IconCheck from '@/assets/icons/IconCheck.svg';
import { reasonList } from '@/constants/DeleteAccount';
import { useNavigation } from '@react-navigation/native';
import MultiLineTextField from '@/components/common/text-field/MultiLineTextField';
import { useRef, useState } from 'react';
import Modal from '@/components/common/modal/Modal';
import EmojiSadface from '@/assets/icons/EmojiSadface.svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ToolBar from '@/components/common/button/ToolBar';
import { useKeyboardToolbar } from '@/hooks/useKeyboardToolbar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { postWithdrawalProps, useWithdrawalApi } from '@/hooks/apis/useWithdrawalApi';
import { useUserStore } from '@/stores/userStore';
import useAuthApi from '@/hooks/apis/useAuthApi';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';
import { useToastStore } from '@/stores/toastStore';
import { unlink as kakaoUnlink } from '@react-native-seoul/kakao-login';
import EncryptedStorage from 'react-native-encrypted-storage';

function DeleteAccountPage() {
  const navigation = useNavigation();
  const rootNavigation = useRootNavigation();
  const [detailReason, setDetailReason] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const { bottomAnim, spacer, onToolbarLayout } = useKeyboardToolbar(insets.bottom);
  const descriptionBoxRef = useRef<View>(null);
  const extraScrollHeight = insets.bottom + 80;
  const { postWithdrawal } = useWithdrawalApi();
  const clearProfile = useUserStore(c => c.clearProfile);
  const { clearAuthStorage } = useAuthApi();
  const showToast = useToastStore(s => s.show);

  const handlePostWithDrawal = async () => {
    if (selectedReason === null) {
      showToast?.({
        image: 'EmojiRedExclamationMark',
        message: '탈퇴 사유를 선택해주세요.',
      });
      return;
    }

    if (isWithdrawing) return; // 중복 호출 방지

    const withDrawInfo: postWithdrawalProps = {
      withdrawalReasonId: Number(selectedReason),
      customReason: detailReason,
    };

    setIsWithdrawing(true);
    try {
      const data = await postWithdrawal(withDrawInfo);
      if (__DEV__) console.log('탈퇴 처리 결과:', data?.data);

      try {
        const provider = await EncryptedStorage.getItem('provider');
        if (provider === 'KAKAO') {
          await kakaoUnlink();
          if (__DEV__) console.log('[DeleteAccount] Kakao unlink 성공');
        }
      } catch (e) {
        if (__DEV__) console.log('[DeleteAccount] Kakao unlink 실패: ', e);
      }

      await clearAuthStorage?.();
      clearProfile?.();

      rootNavigation.reset({ index: 0, routes: [{ name: 'AuthStack', params: { screen: 'Welcome' } }] });
    } catch (error) {
      console.error('탈퇴 처리 중 오류 발생:', error);
      showToast?.({
        image: 'EmojiRedExclamationMark',
        message: '탈퇴 처리 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
      });
      setIsWithdrawing(false);
    }
  };

  return (
    <SafeAreaView style={styles.deleteAccountPage}>
      <CenterHeader
        title="탈퇴하기"
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
      <KeyboardAwareScrollView
        style={styles.deleteAccountPage}
        contentContainerStyle={{ paddingBottom: spacer }}
        enableOnAndroid
        enableAutomaticScroll
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="handled"
        enableResetScrollToCoords={false}
        extraScrollHeight={extraScrollHeight}>
        <View style={styles.textWrapper}>
          <Text style={styles.mainText}>정말 탈퇴하시겠어요?</Text>
          <Text style={styles.subText}>탈퇴하시는 이유를 알려주세요.</Text>
        </View>

        <View style={styles.contentsWrapper}>
          {reasonList.map((text, idx) => (
            <TouchableOpacity
              key={text}
              style={styles.contentsRow}
              onPress={() => setSelectedReason(prev => (prev === idx ? null : idx))}>
              <View style={styles.checkBox}>
                <IconCheck
                  width={20}
                  height={20}
                  stroke={selectedReason === idx ? semanticColor.checkbox.selected : semanticColor.checkbox.deselected}
                  strokeWidth={semanticNumber.stroke.bold}
                />
              </View>
              <Text
                style={[
                  styles.contentsText,
                  { color: selectedReason === idx ? semanticColor.text.primary : semanticColor.text.secondary },
                ]}>
                {text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.textFieldWrapper} ref={descriptionBoxRef}>
          <MultiLineTextField
            inputText={detailReason}
            maxLength={1000}
            placeholder="(선택) 탈퇴 사유에 대해 작성해 주세요."
            setInputText={setDetailReason}
          />
        </View>
      </KeyboardAwareScrollView>

      <Animated.View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: bottomAnim,
          backgroundColor: semanticColor.surface.white,
        }}
        onLayout={e => onToolbarLayout(e.nativeEvent.layout.height)}>
        <ToolBar
          children="탈퇴하기"
          onPress={() => {
            if (selectedReason === null) {
              showToast?.({
                image: 'EmojiRedExclamationMark',
                message: '탈퇴 사유를 선택해주세요.',
              });
              return;
            }
            setIsModalOpen(true);
          }}
          theme="critical"
          isLarge
        />
      </Animated.View>

      {isModalOpen && (
        <Modal
          visible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          titleText="탈퇴하시게 되어 아쉬워요"
          titleIcon={<EmojiSadface width={24} height={24} />}
          descriptionText="재가입은 탈퇴 후 7일 후에 가능합니다."
          buttonTheme="critical"
          mainButtonText={isWithdrawing ? '탈퇴 중...' : '탈퇴하기'}
          mainButtonDisabled={isWithdrawing}
          subButtonText="취소"
          subButtonDisabled={isWithdrawing}
          onMainPress={handlePostWithDrawal}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  deleteAccountPage: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  textWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingTop: semanticNumber.spacing[40],
    paddingBottom: semanticNumber.spacing[12],
    gap: semanticNumber.spacing[4],
  },
  mainText: {
    ...semanticFont.headline.medium,
    color: semanticColor.text.primary,
  },
  subText: {
    ...semanticFont.body.large,
    color: semanticColor.text.tertiary,
  },
  contentsWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[24],
  },
  contentsRow: {
    flexDirection: 'row',
    paddingVertical: semanticNumber.spacing[10],
    alignItems: 'center',
  },
  checkBox: {
    width: 44,
    height: 24,
    justifyContent: 'center',
  },
  contentsText: {
    ...semanticFont.body.medium,
  },
  textFieldWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    marginBottom: semanticNumber.spacing[56],
  },
  buttonWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[10],
  },
});

export default DeleteAccountPage;
