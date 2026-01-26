import DeliveryOptionField from '@/components/common/delivery-option-field/DeliveryOptionField';
import TextSection from '@/components/common/TextSection';
import Toggle from '@/components/my-page/Toggle';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import IconPlus from '@/assets/icons/IconPlus.svg';
import IconTrash from '@/assets/icons/IconTrash.svg';
import IconAlertCircle from '@/assets/icons/IconAlertCircle.svg';
import OptionCard from '@/components/upload/UploadTradeOptionCard';
import Modal from '@/components/common/modal/Modal';
import BottomSheet from '@/components/common/bottom-sheet/BottomSheet';
import { useUploadFormStore, UploadFormStore } from '@/stores/useUploadFormStore';
import { useShallow } from 'zustand/react/shallow';
import { useUploadDataStore } from '@/stores/useUploadDataStore';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';

function UploadTradeOption() {
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState<boolean>(false);
  const [isRegionSheetOpen, setIsRegionSheetOpen] = useState<boolean>(false);
  const navigation = useRootNavigation();
  const isAndroid = Platform.OS === 'android';

  const parseFee = (s: string) => {
    const n = parseInt(String(s).replace(/[^\d]/g, ''), 10);
    return Number.isNaN(n) ? 0 : n;
  };

  const {
    deliveryAvailable,
    directAvailable,
    exchangeAvailable,
    deliveryInfo,
    directInfo,
    directRegionNames,
    setDeliveryAvailable,
    setDirectAvailable,
    setDeliveryInfo,
    setValidTradeOptions,
    setExchangeAvailable,
    setDirectLocations,
    setDirectRegionNames,
  } = useUploadDataStore(
    useShallow(s => ({
      deliveryAvailable: s.deliveryAvailable,
      directAvailable: s.directAvailable,
      exchangeAvailable: s.exchangeAvailable,
      deliveryInfo: s.deliveryInfo,
      directInfo: s.directInfo,
      directRegionNames: s.directRegionNames,
      setDeliveryAvailable: s.setDeliveryAvailable,
      setDirectAvailable: s.setDirectAvailable,
      setDeliveryInfo: s.setDeliveryInfo,
      setValidTradeOptions: s.setValidTradeOptions,
      setExchangeAvailable: s.setExchangeAvailable,
      setDirectLocations: s.setDirectLocations,
      setDirectRegionNames: s.setDirectRegionNames,
    })),
  );

  const { showValidation, reportValidity } = useUploadFormStore(
    useShallow((state: UploadFormStore) => ({
      showValidation: state.showValidation,
      reportValidity: state.reportValidity,
    })),
  );

  const isDelivery = !!deliveryAvailable;
  const isLocal = !!directAvailable;
  const isTradeOn = !!exchangeAvailable;
  const isIncludeFee = !!deliveryInfo?.feeIncluded;
  const feeNumber = Number(deliveryInfo?.deliveryFee ?? 0);
  const deliveryFeeStr = String(deliveryInfo?.deliveryFee ?? '');

  const baseInvalid = !isDelivery && !isLocal;
  const deliveryFeeInvalid = isDelivery && !isIncludeFee && feeNumber <= 100;
  const localRegionInvalid = isLocal && (directRegionNames?.length ?? 0) === 0;
  const overallValid = !baseInvalid && !deliveryFeeInvalid && !localRegionInvalid;
  const shouldShowInvalidBase = showValidation && baseInvalid;

  const prevValid = useRef<boolean | null>(null);
  const prevError = useRef<string | undefined>(undefined);

  useEffect(() => {
    const error = baseInvalid
      ? '택배거래와 직거래 둘 중 하나 이상 반드시 선택해 주세요.'
      : localRegionInvalid
      ? '직거래 지역을 추가해 주세요.'
      : deliveryFeeInvalid
      ? '배송비를 입력해 주세요.'
      : undefined;

    if (prevValid.current !== overallValid || prevError.current !== error) {
      reportValidity('trade', overallValid, error);
      reportValidity(
        'region',
        !isLocal || !localRegionInvalid,
        !isLocal || !localRegionInvalid ? undefined : '직거래 지역을 추가해 주세요.',
      );
      setValidTradeOptions(overallValid);
      prevValid.current = overallValid;
      prevError.current = error;
    }
  }, [
    overallValid,
    baseInvalid,
    localRegionInvalid,
    deliveryFeeInvalid,
    isLocal,
    reportValidity,
    setValidTradeOptions,
  ]);

  const toggleDelivery = () => setDeliveryAvailable(!isDelivery);
  const toggleLocal = () => setDirectAvailable(!isLocal);
  const toggleTrade = () => setExchangeAvailable(!isTradeOn);

  const setIncludeFee = (v: boolean) => {
    setDeliveryInfo({
      feeIncluded: v,
      deliveryFee: feeNumber,
      validDeliveryFee: v ? true : feeNumber > 100,
    });
  };

  const changeFee = (s: string) => {
    const fee = parseFee(s);
    setDeliveryInfo({
      feeIncluded: isIncludeFee,
      deliveryFee: fee,
      validDeliveryFee: isIncludeFee ? true : fee > 100,
    });
  };

  const removeRegion = (idx: number) => {
    const nextNames = (directRegionNames ?? []).filter((_, i) => i !== idx);
    setDirectRegionNames(nextNames);

    const nextIds = (directInfo?.locations ?? []).filter((_, i) => i !== idx);
    setDirectLocations(nextIds);
  };

  const handlePressAddRegion = () => {
    if ((directRegionNames?.length ?? 0) >= 2) {
      setIsReplaceModalOpen(true);
    } else {
      if (isAndroid) {
        navigation.navigate('CommonStack', { screen: 'AosBottomSheet', params: { title: '지역 선택' } });
      } else {
        setIsRegionSheetOpen(true);
      }
    }
  };

  const handleConfirmReplace = () => {
    setIsReplaceModalOpen(false);
    if (isAndroid) {
      navigation.navigate('CommonStack', { screen: 'AosBottomSheet', params: { title: '지역 선택' } });
    } else {
      setIsRegionSheetOpen(true);
    }
  };

  const handleRegionSheetClose = () => {
    setIsRegionSheetOpen(false);
  };

  return (
    <View style={styles.uploadTradeOption}>
      <TextSection mainText="거래 정보" subText="직거래 및 택배거래 여부와 정보를 입력해 주세요." type="small" />
      <View style={styles.optionWrapper}>
        {/* 택배거래 */}
        <OptionCard
          title="택배거래"
          selected={isDelivery}
          critical={shouldShowInvalidBase}
          onToggle={toggleDelivery}
          caption={
            shouldShowInvalidBase && (
              <View style={styles.captionWrapper}>
                <IconAlertCircle
                  width={16}
                  height={16}
                  stroke={semanticColor.icon.critical}
                  strokeWidth={semanticNumber.stroke.bold}
                />
                <Text style={styles.captionText}>택배거래와 직거래 둘 중 하나 이상 반드시 선택해 주세요.</Text>
              </View>
            )
          }>
          <View style={styles.selectDeliveryFeeWrapper}>
            <TouchableOpacity
              onPress={() => setIncludeFee(true)}
              style={isIncludeFee ? styles.selectedFeeMethod : styles.feeMethod}
              activeOpacity={0.8}>
              <Text style={isIncludeFee ? styles.selectedFeeMethodText : styles.feeMethodText}>배송비 포함</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIncludeFee(false)}
              style={!isIncludeFee ? styles.selectedFeeMethod : styles.feeMethod}
              activeOpacity={0.8}>
              <Text style={!isIncludeFee ? styles.selectedFeeMethodText : styles.feeMethodText}>배송비 별도</Text>
            </TouchableOpacity>
          </View>
          {!isIncludeFee && (
            <View style={styles.deliverFeeTextFieldWrapper}>
              <DeliveryOptionField value={deliveryFeeStr} onChange={changeFee} />
            </View>
          )}
        </OptionCard>
        {/* 직거래 */}
        <OptionCard
          title="직거래"
          selected={isLocal}
          critical={shouldShowInvalidBase}
          onToggle={toggleLocal}
          caption={
            shouldShowInvalidBase && (
              <View style={styles.captionWrapper}>
                <IconAlertCircle
                  width={16}
                  height={16}
                  stroke={semanticColor.icon.critical}
                  strokeWidth={semanticNumber.stroke.bold}
                />
                <Text style={styles.captionText}>택배거래와 직거래 둘 중 하나 이상 반드시 선택해 주세요.</Text>
              </View>
            )
          }>
          <View style={styles.localList}>
            {(directRegionNames ?? []).map((item, idx) => (
              <View key={item} style={styles.regionWrapper}>
                <Text style={styles.regionText}>{item}</Text>
                <TouchableOpacity style={styles.deleteRegionWrapper} onPress={() => removeRegion(idx)}>
                  <IconTrash
                    width={16}
                    height={16}
                    stroke={semanticColor.icon.secondary}
                    strokeWidth={semanticNumber.stroke.light}
                  />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[
                styles.addRegionButton,
                showValidation && localRegionInvalid && { borderColor: semanticColor.border.critical },
              ]}
              onPress={handlePressAddRegion}
              activeOpacity={0.8}>
              <IconPlus
                width={16}
                height={16}
                stroke={semanticColor.icon.secondary}
                strokeWidth={semanticNumber.stroke.light}
              />
              <Text style={styles.addRegionText}>직거래 지역 추가하기</Text>
            </TouchableOpacity>
            {showValidation && localRegionInvalid && (
              <View style={styles.captionWrapper}>
                <IconAlertCircle
                  width={16}
                  height={16}
                  stroke={semanticColor.icon.critical}
                  strokeWidth={semanticNumber.stroke.bold}
                />
                <Text style={styles.captionText}>직거래 지역을 추가해 주세요.</Text>
              </View>
            )}
          </View>
        </OptionCard>
        {/* 교환 거래 */}
        <TouchableOpacity style={styles.changeOptionBox} onPress={toggleTrade} activeOpacity={0.8}>
          <View style={styles.changeOptionTextWrapper}>
            <Text style={styles.optionTitleText}>교환 거래</Text>
            <Text style={styles.optionDescriptionText}>다른 악기와 교환을 희망한다면 선택해 주세요.</Text>
          </View>
          <Toggle isOn={isTradeOn} onToggle={toggleTrade} />
        </TouchableOpacity>
      </View>
      {/* 지역 교체 안내 모달 */}
      <Modal
        visible={isReplaceModalOpen}
        onClose={() => setIsReplaceModalOpen(false)}
        titleText="직거래 지역을 변경하실 건가요?"
        descriptionText="기존 설정한 지역은 삭제되고 새로운 지역으로 대체돼요."
        isRow
        mainButtonText="확인"
        subButtonText="취소"
        onMainPress={handleConfirmReplace}
        onSubPress={() => setIsReplaceModalOpen(false)}
      />
      {!isAndroid && <BottomSheet visible={isRegionSheetOpen} onClose={handleRegionSheetClose} title="지역 선택" />}
    </View>
  );
}

const styles = StyleSheet.create({
  uploadTradeOption: {
    paddingTop: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[16],
    gap: 13,
  },
  optionWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    gap: 13,
  },
  selectDeliveryFeeWrapper: {
    width: '100%',
    flexDirection: 'row',
    padding: semanticNumber.spacing[2],
    backgroundColor: semanticColor.surface.gray,
    justifyContent: 'space-around',
    borderRadius: semanticNumber.borderRadius.lg,
  },
  selectedFeeMethod: {
    flex: 1,
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[6],
    backgroundColor: semanticColor.surface.white,
    borderRadius: 10,
    alignItems: 'center',
  },
  feeMethod: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[6],
  },
  selectedFeeMethodText: {
    ...semanticFont.label.xsmall,
    color: semanticColor.text.primary,
  },
  feeMethodText: {
    ...semanticFont.label.xsmall,
    color: semanticColor.text.tertiary,
  },
  deliverFeeTextFieldWrapper: {
    marginTop: semanticNumber.spacing[12],
  },
  addRegionButton: {
    width: '100%',
    paddingVertical: semanticNumber.spacing[8],
    borderRadius: semanticNumber.borderRadius.lg,
    borderStyle: 'dashed',
    borderWidth: semanticNumber.stroke.xlight,
    borderColor: semanticColor.border.strong,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: semanticNumber.spacing[4],
  },
  addRegionText: {
    ...semanticFont.label.xsmall,
    color: semanticColor.text.secondary,
  },
  localList: {
    width: '100%',
    gap: semanticNumber.spacing[10],
  },
  regionWrapper: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: semanticNumber.spacing[16],
    justifyContent: 'space-between',
    borderRadius: semanticNumber.borderRadius.lg,
    backgroundColor: semanticColor.surface.gray,
    alignItems: 'center',
  },
  regionText: {
    ...semanticFont.label.xsmall,
    color: semanticColor.text.secondary,
  },
  deleteRegionWrapper: {
    width: 44,
    height: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  captionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[4],
  },
  captionText: {
    ...semanticFont.caption.large,
    color: semanticColor.text.critical,
  },
  optionTitleText: {
    ...semanticFont.label.large,
    color: semanticColor.text.primary,
  },
  optionDescriptionText: {
    ...semanticFont.caption.medium,
    color: semanticColor.text.tertiary,
  },
  changeOptionBox: {
    height: 68,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[12],
    backgroundColor: semanticColor.surface.lightGray,
    borderRadius: semanticNumber.borderRadius.lg,
  },
  changeOptionTextWrapper: {
    gap: semanticNumber.spacing[2],
  },
});

export default UploadTradeOption;
