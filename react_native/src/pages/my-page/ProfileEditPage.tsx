import ButtonTitleHeader from '@/components/common/header/ButtonTitleHeader';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import IconChevronLeft from '@/assets/icons/IconChevronLeft.svg';
import IconBallPen from '@/assets/icons/IconBallpen.svg';
import VariantButton from '@/components/common/button/VariantButton';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import DropDown from '@/components/common/dropdown/DropDown';
import SectionSeparator from '@/components/common/SectionSeparator';
import SettingItemRow from '@/components/my-page/SettingItemRow';
import Chip from '@/components/common/Chip';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// import BottomSheet from '@/components/common/bottom-sheet/BottomSheet';
import ToolBar from '@/components/common/button/ToolBar';
import TextFieldWithButton from '@/components/common/text-field/TextFieldWithButton';
import { useUserStore } from '@/stores/userStore';
import { semanticFont } from '@/styles/semantic-font';
import useUserApi from '@/hooks/apis/useUserApi';
import { Asset, ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';
import Modal from '@/components/common/modal/Modal';
import EmojiFloppyDisk from '@/assets/icons/EmojiFloppyDisk.svg';
import useMyNavigation from '@/hooks/navigation/useMyNavigation';
import EmojiNoEntry from '@/assets/icons/EmojiNoEntry.svg';
import { containsBadWord, sanitizeNicknameInput } from '@/utils/nicknameFilter';
import { AvoidSoftInput } from 'react-native-avoid-softinput';
import useCertificationNavigation from '@/hooks/navigation/useCertificationNavigation';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';

type ProfileImage = { uri: string; name: string; type: string };

const isAndroid = Platform.OS === 'android';

function ProfileEditPage() {
  const myNavigation = useMyNavigation();
  const rootNavigation = useRootNavigation();
  const certificationNavigation = useCertificationNavigation();
  const navigation = useRootNavigation();
  // const [regionBottomSheet, setRegionBottomSheet] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const profile = useUserStore(p => p.profile);
  const setProfileStore = useUserStore(s => s.setProfile);
  const { validateNickname, updateProfile } = useUserApi();

  const originalNickname = profile?.nickname ?? '';
  const originalSigunguIds = useMemo<number[]>(
    () => (profile?.regions ?? []).flatMap(r => (r.siGunGus ?? []).map(g => g.siGunGuId)),
    [profile],
  );
  const originalProfileImageUrl = profile?.profileImage ?? '';
  // const originalRegionId = useMemo<number | null>(() => {
  //   const ids = (profile?.regions ?? []).flatMap(r => (r.siGunGus ?? []).map(g => g.siGunGuId));
  //   return ids.length ? ids[0] : null;
  // }, [profile]);

  const [nickname, setNickname] = useState<string>(originalNickname);
  const [sigunguIds, setSigunguIds] = useState<number[]>(originalSigunguIds);
  const [newProfileImage, setNewProfileImage] = useState<ProfileImage | null>(null);
  const [dupStatus, setDupStatus] = useState<'default' | 'checking' | 'ok' | 'fail'>('default');
  const [dupMessage, setDupMessage] = useState<string>('');
  // const [regionId, setRegionId] = useState<number | null>(originalRegionId);
  // const [regionLabel, setRegionLabel] = useState<string>((profile?.regions?.[0]?.siGunGus?.[0]?.name as string) ?? '');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [stopModalOpen, setStopModalOpen] = useState<boolean>(false);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [height, setHeight] = useState(0);
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    setNickname(originalNickname);
    setDupStatus('default');
    setDupMessage('');
  }, [originalNickname]);
  useEffect(() => {
    setSigunguIds(originalSigunguIds);
  }, [originalSigunguIds]);

  const lengthValid = nickname.length >= 2 && nickname.length <= 12;
  const patternValid = /^[가-힣ㄱ-ㅎa-zA-Z0-9]+$/.test(nickname);

  const nicknameChanged = nickname !== originalNickname;
  // const regionsChanged = (regionId ?? originalRegionId) !== originalRegionId;
  const imageChanged = !!newProfileImage;
  const hasChanges = nicknameChanged || imageChanged; // || regionsChanged

  const canSave =
    (nicknameChanged || imageChanged) && // || regionsChanged
    (!nicknameChanged || (lengthValid && patternValid && !isBlocked && dupStatus === 'ok'));

  const canCheckDuplicate = nicknameChanged && lengthValid && patternValid && !isBlocked && dupStatus !== 'checking';

  useEffect(() => {
    if (nicknameChanged) {
      setDupStatus('default');
      setDupMessage('');
    }
  }, [nicknameChanged]);

  // useEffect(() => {
  //   setRegionId(originalRegionId);
  //   setRegionLabel((profile?.regions?.[0]?.siGunGus?.[0]?.name as string) ?? '');
  // }, [originalRegionId, profile]);

  // 닉네임 유효성 caption
  const getValidNicknameText = (): string => {
    const defaultMsg = '닉네임은 30일에 1번씩 바꿀 수 있어요.';
    if (!nicknameChanged) return defaultMsg;
    if (isBlocked) return '금칙어가 포함되어 있어 사용할 수 없어요.';
    if (!lengthValid) return '2~12자 이내 영문 또는 한글로 입력. 특수문자 불가';
    if (!patternValid) return '닉네임은 한글 또는 영문으로 입력해 주세요.';
    if (dupStatus === 'fail') return '다른 닉네임으로 다시 시도해 주세요.';
    if (dupStatus === 'ok') return '사용 가능한 닉네임이에요.';
    return defaultMsg;
  };

  const getValidState = (): 'edit' | 'success' | 'fail' => {
    if (!nicknameChanged) return 'edit';
    if (isBlocked) return 'fail';
    if (!lengthValid || !patternValid) return 'fail';
    if (dupStatus === 'fail') return 'fail';
    if (dupStatus === 'ok') return 'success';
    return 'edit';
  };

  const onPressCheckDuplicate = async () => {
    if (!canCheckDuplicate) return;
    if (containsBadWord(nickname)) {
      setIsBlocked(true);
      setDupStatus('fail');
      setDupMessage('금칙어가 포함되어 있어 사용할 수 없어요.');
      return;
    }
    setIsBlocked(false);
    setDupStatus('checking');
    const res = await validateNickname(nickname);
    if ('ok' in res && res.ok) {
      setDupStatus('ok');
      setDupMessage('');
    } else {
      setDupStatus('fail');
      setDupMessage((res as any)?.reason || '사용할 수 없는 닉네임입니다.');
    }
  };

  const currentProfileImageUri = newProfileImage?.uri || (originalProfileImageUrl ?? null);

  const assetToFile = (asset: Asset): ProfileImage => {
    const uri = String(asset.uri);
    const extFromUri = uri.split('?')[0].split('.').pop() || 'jpg';
    const name = asset.fileName || `profileImage_${Date.now()}.${extFromUri}`;
    const type = asset.type || 'image/jpeg';
    return { uri, name, type };
  };

  const onPressChangeProfileImage = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.1,
      maxWidth: 400,
      maxHeight: 400,
    };
    try {
      const response = await launchImageLibrary(options);
      if (response.didCancel) return;
      if (response.errorCode) {
        if (__DEV__) {
          console.log('[image-picker] error: ', response.errorMessage);
        }
        return;
      }
      const asset = response.assets?.[0];
      if (!asset?.uri) return;
      setNewProfileImage(assetToFile(asset));
    } catch (error) {
      if (__DEV__) {
        console.log('[onPressChangeProfileImage] error: ', error);
      }
    }
  };
  // const onConfirmRegions = (newIds: number[]) => {
  //   setSigunguIds(newIds);
  //   setRegionId(newIds.length ? newIds[0] : null);
  //   setRegionBottomSheet(false);
  // };

  const onPressSave = async () => {
    if (!canSave) return;

    try {
      setSaving(true);
      if (nicknameChanged && containsBadWord(nickname)) {
        setIsBlocked(true);
        setDupStatus('fail');
        setDupMessage('금칙어가 포함되어 있어 사용할 수 없어요.');
        return;
      }
      if (nicknameChanged) {
        const check = await validateNickname(nickname);
        if (!check.ok) {
          setDupStatus('fail');
          setDupMessage(check.reason || '사용할 수 없는 닉네임입니다.');
          return;
        }
        setDupStatus('ok');
      }
      const body: { nickname?: string; sigunguIds?: number[] } = {};
      if (nicknameChanged) body.nickname = nickname;
      // if (regionsChanged && regionId != null) body.sigunguIds = [regionId];

      myNavigation.goBack();
      const updated = await updateProfile(body, imageChanged ? newProfileImage : null);
      setProfileStore(updated);
      setNewProfileImage(null);
      setDupStatus('default');
      setDupMessage('');
    } catch (error) {
      if (__DEV__) {
        console.log('[onPressSave] error: ', error);
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const sub = AvoidSoftInput.onSoftInputHeightChange((e: any) => {
      setHeight(e.softInputHeight);
      setSticky(true);
      if (e.softInputHeight === 0) setSticky(false);
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={styles.profileEditPageContainer}>
      <ButtonTitleHeader
        title="내 정보"
        leftChilds={{
          icon: (
            <IconChevronLeft
              width={28}
              height={28}
              stroke={semanticColor.icon.primary}
              strokeWidth={semanticNumber.stroke.bold}
            />
          ),
          onPress: () => {
            if (hasChanges) setStopModalOpen(true);
            else myNavigation.goBack();
          },
        }}
      />
      <ScrollView
        style={[{ flex: 1 }, isAndroid && height > 0 ? { marginBottom: -height } : null]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={false}>
        <View style={styles.profileImageSection}>
          {currentProfileImageUri ? (
            <Image source={{ uri: currentProfileImageUri }} style={styles.profileImage} resizeMode="cover" />
          ) : (
            <View style={styles.profileImage} />
          )}
          <VariantButton theme="sub" onPress={onPressChangeProfileImage}>
            <View style={styles.editProfileImageButton}>
              <IconBallPen
                width={16}
                height={16}
                stroke={semanticColor.icon.buttonSub}
                strokeWidth={semanticNumber.stroke.light}
              />
              <Text style={styles.editProfileImageText}>프로필 사진 변경</Text>
            </View>
          </VariantButton>
        </View>

        <View style={styles.textFieldSection}>
          <TextFieldWithButton
            label="닉네임"
            inputText={nickname}
            placeholder={originalNickname}
            setInputText={v => {
              const cleaned = sanitizeNicknameInput(typeof v === 'string' ? v : String(v));
              setNickname(cleaned);
              setIsBlocked(false);
            }}
            buttonText={dupStatus === 'checking' ? '확인 중...' : '중복확인'}
            onPress={onPressCheckDuplicate}
            validState={getValidState()}
            validText={getValidNicknameText()}
            disabled={!canCheckDuplicate}
          />

          {/* <DropDown
            title="지역"
            placeholder={regionId ? regionLabel : '선택'}
            isPlused
            isSelected={!!regionId}
            onClick={() => {
              if (isAndroid) {
                navigation.navigate('CommonStack', { screen: 'AosBottomSheet', params: { title: '지역 선택' } });
              } else {
                setRegionBottomSheet(true);
              }
            }}
            backgroundColor={regionBottomSheet ? 'lightGray' : 'white'}
          /> */}
        </View>

        <SectionSeparator type="line-with-padding" />

        <SettingItemRow
          itemName="본인인증"
          subItem={
            <Chip text={profile?.verified ? '완료' : '미인증'} variant={profile?.verified ? 'condition' : 'default'} />
          }
          showNextButton
          onPress={() => {
            if (profile?.verified) myNavigation.navigate('VerifyInfoPage');
            else
              rootNavigation.navigate('CertificationStack', { screen: 'Certification', params: { origin: 'common' } });
          }}
        />
      </ScrollView>

      <View
        style={{
          backgroundColor: semanticColor.surface.white,
          paddingBottom: isAndroid ? height! : height! - insets.bottom,
        }}>
        <ToolBar children="저장하기" onPress={() => setSaveModalOpen(true)} disabled={!canSave} isHairLine isSticky />
      </View>

      {/* {!isAndroid && (
        <BottomSheet visible={regionBottomSheet} title="지역 선택" onClose={() => setRegionBottomSheet(false)} />
      )} */}
      <Modal
        mainButtonText="저장하기"
        onClose={() => setSaveModalOpen(false)}
        onMainPress={onPressSave}
        titleText="저장하시겠어요?"
        visible={saveModalOpen}
        descriptionText={`닉네임은 30일 후에 변경 가능합니다!\n프로필 사진은 항상 변경할 수 있어요.`}
        titleIcon={<EmojiFloppyDisk width={24} height={24} />}
      />
      <Modal
        mainButtonText="내 정보 수정 중단하기"
        onClose={() => setStopModalOpen(false)}
        onMainPress={() => myNavigation.goBack()}
        titleText="저장하지 않고 나가시겠어요??"
        visible={stopModalOpen}
        descriptionText={`저장하지 않으면 변경한 내용이 사라져요!`}
        titleIcon={<EmojiNoEntry width={24} height={24} />}
        buttonTheme="critical"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileEditPageContainer: {
    flex: 1,
    backgroundColor: semanticColor.surface.white,
  },
  profileImageSection: {
    paddingTop: semanticNumber.spacing[36],
    paddingBottom: semanticNumber.spacing[12],
    justifyContent: 'center',
    alignItems: 'center',
    gap: semanticNumber.spacing[8],
  },
  profileImage: {
    width: 96,
    height: 96,
    backgroundColor: semanticColor.surface.gray,
    borderRadius: 9999,
  },
  editProfileImageButton: {
    flexDirection: 'row',
    gap: semanticNumber.spacing[4],
    alignItems: 'center',
  },
  editProfileImageText: {
    ...semanticFont.label.xsmall,
    color: semanticColor.text.buttonSub,
  },
  textFieldSection: {
    padding: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[20],
  },
});

export default ProfileEditPage;
