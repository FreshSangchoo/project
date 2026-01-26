import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import IconCheck from '@/assets/icons/IconCheck.svg';

type Props = {
  title: string;
  selected: boolean;
  critical?: boolean; // 선택 안됨 + 경고 강조(붉은 테두리)
  onToggle: () => void;
  caption?: React.ReactNode; // 선택 안됐을 때 보일 경고문 등
  children?: React.ReactNode; // 선택됐을 때 확장 콘텐츠
};

const UploadTradeOptionCard: React.FC<Props> = ({ title, selected, critical, onToggle, caption, children }) => {
  return (
    <View style={selected ? styles.checkedOptionBox : styles.captionContainer}>
      <TouchableOpacity
        style={[
          selected ? styles.checkedOptionWrapper : styles.optionBox,
          !selected && critical && styles.optionCritical,
        ]}
        onPress={onToggle}
        activeOpacity={0.8}>
        <Text style={styles.optionTitleText}>{title}</Text>
        {selected ? (
          <View style={styles.checkedCircle}>
            <IconCheck
              width={16}
              height={16}
              stroke={semanticColor.checkbox.check}
              strokeWidth={semanticNumber.stroke.bold}
            />
          </View>
        ) : (
          <View style={styles.checkCircle} />
        )}
      </TouchableOpacity>
      {selected && children}
      {!selected && caption}
    </View>
  );
};

const styles = StyleSheet.create({
  captionContainer: {
    gap: semanticNumber.spacing[8],
  },
  optionBox: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[4],
    backgroundColor: semanticColor.surface.lightGray,
    borderRadius: semanticNumber.borderRadius.lg,
  },
  optionCritical: {
    borderWidth: semanticNumber.stroke.medium,
    borderColor: semanticColor.border.critical,
  },
  checkedOptionBox: {
    minHeight: 108,
    alignItems: 'center',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingTop: semanticNumber.spacing[4],
    paddingBottom: semanticNumber.spacing[16],
    backgroundColor: semanticColor.surface.lightGray,
    borderRadius: semanticNumber.borderRadius.lg,
  },
  checkedOptionWrapper: {
    width: '100%',
    height: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: semanticNumber.spacing[8],
  },
  checkCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 20,
    borderRadius: semanticNumber.borderRadius.full,
    borderWidth: semanticNumber.stroke.xlight,
    borderColor: semanticColor.checkbox.deselected,
  },
  checkedCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 20,
    borderRadius: semanticNumber.borderRadius.full,
    backgroundColor: semanticColor.checkbox.selected,
  },
  optionTitleText: {
    ...semanticFont.label.large,
    color: semanticColor.text.primary,
  },
});

export default UploadTradeOptionCard;
