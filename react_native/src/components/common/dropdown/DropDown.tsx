import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import IconChevronDown from '@/assets/icons/IconChevronDown.svg';
import IconChevronUp from '@/assets/icons/IconChevronUp.svg';
import IconPlus from '@/assets/icons/IconPlus.svg';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';

/**
 * 드롭다운 컴포넌트
 *
 * 선택된 항목(`value`)이 있으면 `renderItem`으로 커스터마이징하여 렌더링합니다.
 * 선택 항목이 없다면 `placeholder`를 렌더링합니다.
 *
 * 이 컴포넌트는 `value`를 직접 변경하지 않고, 외부에서 상태로 관리된 값을 받아 렌더링만 담당합니다.
 * 드롭다운 클릭 시 `onClick`을 통해 외부에서 모달 등을 열어 항목을 선택하고,
 * 선택된 값을 상위 컴포넌트에서 `value`로 내려주는 방식입니다.
 *
 * @template T - 선택될 항목의 타입
 * @param {T} value - 선택된 항목 (외부 상태로 관리)
 * @param {() => void} onClick - 드롭다운을 눌렀을 때 호출되는 함수 (ex. 모달 열기)
 * @param {boolean} isSelected - 드롭다운이 열려 있는 상태인지 여부
 * @param {boolean} isPlused - 추가 아이콘을 사용할지 여부
 * @param {string} placeholder - 선택된 항목이 없을 때 보여줄 텍스트
 * @param {string} title - 드롭다운 제목
 * @param {'white' | 'lightGray'} backgroundColor - 드롭다운 배경색
 * @param {(item: T) => React.ReactNode} renderItem - 선택된 값을 커스터마이징해서 렌더링할 함수
 *
 * @example
 * isSelected === true && isPlused === true
 * 아이템이 선택되었고, 추가된 상태일 때
 * <Plus />
 * isSelected === true && isPlused === false
 * 선택은 되었지만 추가되지 않았을 때
 * <Arrow_up />
 * isSelected === false
 * 선택되지 않은 기본 상태
 * <Arrow_down />
 * // ✅ Chip 형태로 렌더링되는 드롭다운
 * <DropDown
 *   title="선호 음식"
 *   placeholder="선택해주세요"
 *   value={selectedFood} -> useState로 관리되는 거 넣으면 됨!
 *   onClick={() => setModalVisible(true)}
 *   isSelected={modalVisible}
 *   renderItem={(item) => <Chip label={item} />}
 * />
 *
 * @example
 * // ✅ 기본 텍스트로 렌더링되는 드롭다운
 * <DropDown
 *   title="선호 음식"
 *   placeholder="선택해주세요"
 *   value={selectedFood} -> useState로 관리되는 거 넣으면 됨!
 *   onClick={() => setModalVisible(true)}
 *   isSelected={modalVisible}
 * />
 */

type DropDownProps<T> = {
  value?: T;
  onClick?: () => void;
  isSelected?: boolean;
  isPlused?: boolean;
  placeholder: string;
  title: string;
  backgroundColor?: 'white' | 'lightGray';
  renderItem?: (item: T) => React.ReactNode;
  disabled?: boolean;
  isError?: boolean;
};

function DropDown<T>({
  isSelected = false,
  isPlused = false,
  title,
  placeholder = '',
  backgroundColor = 'white',
  value,
  renderItem,
  onClick,
  disabled = false,
  isError = false,
}: DropDownProps<T>) {
  function renderIcon(isSelected: boolean, isPlused: boolean) {
    if (isSelected && isPlused)
      return (
        <IconPlus
          width={24}
          height={24}
          stroke={!disabled ? semanticColor.icon.secondary : semanticColor.icon.lightest}
          strokeWidth={semanticNumber.stroke.bold}
        />
      );
    else if (isSelected && !isPlused)
      return (
        <IconChevronUp
          width={24}
          height={24}
          stroke={!disabled ? semanticColor.icon.secondary : semanticColor.icon.lightest}
          strokeWidth={semanticNumber.stroke.bold}
        />
      );
    return (
      <IconChevronDown
        width={24}
        height={24}
        stroke={!disabled ? semanticColor.icon.secondary : semanticColor.icon.lightest}
        strokeWidth={semanticNumber.stroke.bold}
      />
    );
  }
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onClick}
      style={[styles.container, backgroundStyle[backgroundColor], isError && styles.containerCritical]}>
      <Text style={[styles.title, disabled && { color: semanticColor.text.lightest }]}>{title}</Text>
      <Pressable style={styles.selector} onPress={onClick}>
        {value !== null && value !== undefined ? (
          renderItem?.(value) ?? <Text style={[styles.selectedText, textStyle.selected]}>{String(value)}</Text>
        ) : (
          <Text style={[styles.selectedText, textStyle.placeholder]}>{placeholder}</Text>
        )}
        {renderIcon(isSelected, isPlused)}
      </Pressable>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: semanticNumber.spacing[14],
    paddingHorizontal: semanticNumber.spacing[16],
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: semanticNumber.borderRadius.lg,
    borderWidth: semanticNumber.stroke.light,
    borderColor: semanticColor.border.light,
  },
  title: {
    color: semanticColor.text.primary,
    ...semanticFont.label.large,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: semanticNumber.spacing[4],
  },
  selectedText: {
    ...semanticFont.label.small,
  },
  containerCritical: {
    borderWidth: semanticNumber.stroke.medium,
    borderColor: semanticColor.border.critical,
  },
});
const backgroundStyle = StyleSheet.create({
  white: {
    backgroundColor: semanticColor.surface.white,
  },
  lightGray: {
    backgroundColor: semanticColor.surface.lightGray,
  },
});
const textStyle = StyleSheet.create({
  selected: {
    color: semanticColor.text.primary,
  },
  placeholder: {
    color: semanticColor.text.lightest,
  },
});

export default DropDown;
