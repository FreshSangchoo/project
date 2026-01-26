import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { ButtonTheme } from '@/constants/ButtonStyle';
import Overlay from '@/components/common/overlay/Overlay';
import VariantButton from '@/components/common/button/VariantButton';
import { useEffect, useRef, useState } from 'react';

/**
 * 사용자에게 확인이나 경고 등의 메시지를 보여주는 커스텀 모달 컴포넌트입니다.
 * 제목, 설명, 버튼을 유동적으로 구성할 수 있으며, 버튼 정렬 방향과 아이콘도 설정할 수 있습니다.
 *
 * @component Modal
 * @param {boolean} visible - 모달 표시 여부
 * @param {() => void} onClose - 모달 닫기 함수 (배경 클릭 또는 서브 버튼의 기본 동작)
 * @param {string} titleText - 모달 제목 텍스트
 * @param {React.ReactNode} [titleIcon] - 제목 옆에 표시할 아이콘 (예: SVG)
 * @param {boolean} [noDescription] - 설명 텍스트를 숨길지 여부 (`true`면 숨김)
 * @param {string} [descriptionText] - 설명 텍스트
 * @param {boolean} [isRow] - 버튼을 가로로 정렬할지 여부 (`row-reverse` 방향)
 * @param {ButtonTheme} [buttonTheme='main'] - 메인 버튼 테마 색상 (ex: main, brand, critical)
 * @param {string} mainButtonText - 메인 버튼에 표시할 텍스트
 * @param {boolean} [isSingle] - 메인 버튼만 표시할지 여부 (`true`면 서브 버튼 숨김)
 * @param {string} [subButtonText='취소'] - 서브 버튼에 표시할 텍스트
 * @param {() => void} onMainPress - 메인 버튼 클릭 시 실행할 함수
 * @param {() => void} [onSubPress=onClose] - 서브 버튼 클릭 시 실행할 함수 (기본값: `onClose`)
 *
 * @example
 * <Modal
 *   visible={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   titleText="탈퇴하시겠어요?"
 *   titleIcon={<SadFaceIcon />}
 *   descriptionText="탈퇴 후 7일 후 재가입 가능합니다."
 *   buttonTheme="critical"
 *   mainButtonText="탈퇴하기"
 *   subButtonText="취소"
 *   onMainPress={handleWithdraw}
 * />
 *
 * @author 김서윤
 */

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  titleText: string;
  titleIcon?: React.ReactNode;
  noDescription?: boolean;
  descriptionText?: string;
  isRow?: boolean;
  buttonTheme?: ButtonTheme;
  mainButtonText: string;
  mainButtonDisabled?: boolean;
  isSingle?: boolean;
  subButtonText?: string;
  subButtonDisabled?: boolean;
  onMainPress: () => void;
  onSubPress?: () => void;
}

const Modal = ({
  visible,
  onClose,
  titleText,
  titleIcon,
  noDescription,
  descriptionText,
  isRow,
  buttonTheme = 'main',
  mainButtonText,
  mainButtonDisabled,
  isSingle,
  subButtonText = '취소',
  subButtonDisabled,
  onMainPress,
  onSubPress = onClose,
}: ModalProps) => {
  const [render, setRender] = useState(visible);

  const scale = useRef(new Animated.Value(visible ? 1 : 0.92)).current;
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  const timing = (val: Animated.Value, toValue: number) =>
    Animated.timing(val, {
      toValue,
      duration: 180,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });

  useEffect(() => {
    let isMounted = true;

    if (visible) {
      setRender(true);
      Animated.parallel([timing(opacity, 1), timing(scale, 1)]).start();
    } else if (render) {
      Animated.parallel([timing(opacity, 0), timing(scale, 0.92)]).start(({ finished }) => {
        if (finished && isMounted) setRender(false);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [visible]);

  if (!render) return null;

  return (
    <Overlay visible={visible} onClose={onClose}>
      <View style={styles.wrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.container,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}>
          <View style={styles.textContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>{titleText}</Text>
              {titleIcon}
            </View>
            {!noDescription && <Text style={styles.text}>{descriptionText}</Text>}
          </View>

          <View style={[styles.buttonContainer, { flexDirection: isRow ? 'row-reverse' : 'column' }]}>
            <View style={[isRow && styles.buttonSpace]}>
              <VariantButton onPress={onMainPress} isFull isLarge theme={buttonTheme} disabled={mainButtonDisabled}>
                {mainButtonText}
              </VariantButton>
            </View>

            {!isSingle && (
              <View style={[isRow && styles.buttonSpace]}>
                <VariantButton onPress={onSubPress} isFull isLarge theme="sub" disabled={subButtonDisabled}>
                  {subButtonText}
                </VariantButton>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Overlay>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: 16,
  },
  container: {
    width: '100%',
    backgroundColor: semanticColor.surface.white,
    borderRadius: semanticNumber.borderRadius.xl2,
    paddingVertical: semanticNumber.spacing[32],
    paddingHorizontal: semanticNumber.spacing[24],
    gap: semanticNumber.spacing[32],
  },
  textContainer: {
    gap: semanticNumber.spacing[10],
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: semanticNumber.spacing[4],
  },
  titleText: {
    ...semanticFont.title.large,
    color: semanticColor.text.primary,
  },
  text: {
    ...semanticFont.body.medium,
    color: semanticColor.text.secondary,
  },
  buttonContainer: {
    width: '100%',
    gap: semanticNumber.spacing[12],
  },
  buttonSpace: {
    flex: 1,
  },
});

export default Modal;
