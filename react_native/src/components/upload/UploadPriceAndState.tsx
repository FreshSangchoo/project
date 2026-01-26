import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TextSection from '@/components/common/TextSection';
import IconHelpCircle from '@/assets/icons/IconHelpCircle.svg';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import PriceField from '@/components/common/price-field/PriceField';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import DropDown from '@/components/common/dropdown/DropDown';
import { semanticFont } from '@/styles/semantic-font';
import Toggle from '@/components/my-page/Toggle';
import ActionBottomSheet, { ActionItem } from '@/components/common/bottom-sheet/ActionBottomSheet';
import { uploadConditionItems } from '@/constants/bottom-sheet/ActionBottomSheetItems';
import StateBottomSheet from '@/components/common/bottom-sheet/StateBottomSheet';
import Chip from '@/components/common/Chip';
import { useShallow } from 'zustand/shallow';
import { useUploadFormStore } from '@/stores/useUploadFormStore';
import IconAlertCircle from '@/assets/icons/IconAlertCircle.svg';
import { useUploadDataStore } from '@/stores/useUploadDataStore';
import { koCondition } from '@/utils/merchandiseToCard';

function UploadPriceAndState() {
  const { price, condition, partChange, setPrice, setCondition, setPartChange } = useUploadDataStore(
    useShallow(s => ({
      price: s.price,
      condition: s.condition,
      partChange: s.partChange,
      setPrice: s.setPrice,
      setCondition: s.setCondition,
      setPartChange: s.setPartChange,
    })),
  );
  const [stateBottomSheet, setStateBottomSheet] = useState<boolean>(false);
  const [stateInfoBottomSheet, setStateInfoBottomSheet] = useState<boolean>(false);

  const { showValidation, reportLayoutY, reportValidity } = useUploadFormStore(
    useShallow(state => ({
      showValidation: state.showValidation,
      reportLayoutY: state.reportLayoutY,
      reportValidity: state.reportValidity,
    })),
  );

  const digits = String(price).replace(/[^\d]/g, '');
  const priceNum = digits.length ? parseInt(digits, 10) : 0;
  const invalidPrice = priceNum <= 1000;
  const invalidCondition = !condition;
  const isValid = !(invalidPrice || invalidCondition);

  useEffect(() => {
    reportValidity('price', isValid, undefined);
  }, [isValid, reportValidity]);

  const conditionItems: ActionItem[] = useMemo(
    () =>
      uploadConditionItems.map(base => ({
        ...base,
        rightNode:
          condition === base.itemName ? (
            <Chip text={koCondition(base.itemName)} variant="condition" size="small" />
          ) : undefined,
        onPress: () => {
          setCondition(base.itemName);
          setStateBottomSheet(false);
          base.onPress?.();
        },
      })),
    [condition],
  );

  return (
    <View style={styles.uploadPriceAndState} onLayout={e => reportLayoutY('price', e.nativeEvent.layout.y)}>
      <TextSection
        mainText="매물 정보"
        subText="가격과 상태를 입력 및 선택해 주세요."
        icon={
          <IconHelpCircle
            width={28}
            height={28}
            stroke={semanticColor.icon.secondary}
            strokeWidth={semanticNumber.stroke.bold}
          />
        }
        onPress={() => setStateInfoBottomSheet(true)}
        type="small"
      />
      <View style={styles.infoSection}>
        <View style={styles.fieldBox}>
          <PriceField
            value={price === 0 ? '' : String(price)}
            onChange={price => setPrice(Number(price))}
            placeholder="0"
            isError={showValidation && invalidPrice}
          />
        </View>
        <View style={styles.statusSection}>
          <View style={styles.fieldBox}>
            <DropDown
              isSelected={stateBottomSheet}
              title="상태"
              placeholder="선택"
              backgroundColor={stateBottomSheet ? 'lightGray' : 'white'}
              value={condition ? koCondition(condition) : undefined}
              renderItem={item => <Chip text={item} variant="condition" size="small" />}
              onClick={() => setStateBottomSheet(true)}
              isError={showValidation && invalidCondition}
            />
          </View>
          {showValidation && invalidCondition && (
            <View style={styles.captionWrapper}>
              <IconAlertCircle
                width={16}
                height={16}
                stroke={semanticColor.icon.critical}
                strokeWidth={semanticNumber.stroke.bold}
              />
              <Text style={styles.captionText}>매물 상태를 선택해 주세요.</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.changeOptionBox} onPress={() => setPartChange(!partChange)}>
          <View style={styles.changeOptionTextWrapper}>
            <Text style={styles.optionTitleText}>부품 교체 여부</Text>
            <Text
              style={
                styles.optionDescriptionText
              }>{`부품을 교체한 이력이 있으면 선택해 주시고,\n추가 정보에서 관련한 상세 내용을 적어주세요.`}</Text>
          </View>
          <Toggle isOn={!!partChange} onToggle={() => setPartChange(!partChange)} />
        </TouchableOpacity>
      </View>
      <ActionBottomSheet
        visible={stateBottomSheet}
        items={conditionItems}
        onClose={() => setStateBottomSheet(false)}
        isSafeArea
      />
      <StateBottomSheet visible={stateInfoBottomSheet} onClose={() => setStateInfoBottomSheet(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  uploadPriceAndState: {
    paddingTop: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[32],
    gap: semanticNumber.spacing[16],
  },
  infoSection: {
    paddingHorizontal: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[16],
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
  captionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[4],
  },
  captionText: {
    ...semanticFont.caption.large,
    color: semanticColor.text.critical,
  },
  fieldBox: {
    borderRadius: semanticNumber.borderRadius.lg,
  },
  fieldCritical: {
    borderWidth: semanticNumber.stroke.medium,
    borderColor: semanticColor.border.critical,
  },
  statusSection: {
    gap: semanticNumber.spacing[8],
  },
});

export default UploadPriceAndState;
