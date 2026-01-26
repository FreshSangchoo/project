import { useEffect, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, View, ScrollView } from 'react-native';
import Overlay from '@/components/common/overlay/Overlay';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import ToolBar from '@/components/common/button/ToolBar';

type AuthErrorBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;
const HEADER_OFFSET = semanticNumber.spacing[44];
const TITLE_OFFSET = semanticNumber.spacing[44] + semanticNumber.spacing[16];
const TOOLBAR_HEIGHT = semanticNumber.spacing[10] + semanticNumber.spacing[36];
const CONTENT_MAX_HEIGHT = SCREEN_HEIGHT - HEADER_OFFSET - TITLE_OFFSET - TOOLBAR_HEIGHT;
const ANIMATION_DURATION = 300;

const CHECKLIST_ITEMS = [
  {
    text: '1. 스팸 메일함 확인',
    description: '인증 메일이 스팸함이나 광고메일함으로 분류될 수 있습니다. 해당 폴더를 확인해 주세요.',
  },
  {
    text: '2. 메일 수신 환경 확인',
    description:
      '메일 차단 설정, 수신 허용 목록, 메일 서버 용량 등을 확인해 주세요. 필요한 경우 발신 이메일 주소를 수신 허용 목록에 추가해 주세요.',
  },
  {
    text: '3. 앱 문제 확인',
    description:
      '앱 자체에서 오류가 발생했을 수 있으므로, 잠시 후 다시 시도하거나, 다른 방법으로 인증을 시도해 보세요.',
  },
] as const;

function AuthErrorBottomSheet({ visible, onClose }: AuthErrorBottomSheetProps) {
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const translateY = panY.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0, 0, 1],
  });

  const resetPositionAnim = Animated.timing(panY, {
    toValue: 0,
    duration: ANIMATION_DURATION,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(panY, {
    toValue: SCREEN_HEIGHT,
    duration: ANIMATION_DURATION,
    useNativeDriver: true,
  });

  const handleClose = () => {
    closeAnim.start(() => {
      panY.setValue(SCREEN_HEIGHT);
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderMove: (_evt, gestureState) => {
        panY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const shouldClose = gestureState.dy > SCREEN_HEIGHT * 0.25 || gestureState.vy > 1.5;
        if (shouldClose) handleClose();
        else resetPositionAnim.start();
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => {
        panY.setValue(SCREEN_HEIGHT);
        resetPositionAnim.start();
      });
    }
  }, [visible]);

  return (
    <Overlay visible={visible} onClose={handleClose} isBottomSheet>
      {visible && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.container, { transform: [{ translateY }, { translateX: new Animated.Value(0) }] }]}>
          <View style={styles.totalContainer}>
            <View style={styles.title} {...panResponder.panHandlers}>
              <Text style={styles.titleText}>인증 코드가 오지 않나요?</Text>
            </View>
            <View style={styles.contentWrapper}>
              <ScrollView
                style={{ maxHeight: CONTENT_MAX_HEIGHT }}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}>
                {CHECKLIST_ITEMS.map((item, idx) => (
                  <View key={idx} style={styles.item}>
                    <Text style={styles.text}>{item.text}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.customerTextWrapper}>
                <Text
                  style={
                    styles.customerText
                  }>{`문제가 계속 발생한다면\n고객센터에 문의하여 도움을 요청해주세요.`}</Text>
              </View>
            </View>
          </View>
          <ToolBar children="확인" onPress={onClose} />
        </Animated.View>
      )}
    </Overlay>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: semanticColor.surface.white,
    borderTopLeftRadius: semanticNumber.borderRadius.xl2,
    borderTopRightRadius: semanticNumber.borderRadius.xl2,
  },
  totalContainer: {
    paddingTop: semanticNumber.spacing[24],
    paddingBottom: semanticNumber.spacing[32],
  },
  title: {
    width: '100%',
    height: 56,
    paddingHorizontal: semanticNumber.spacing[24],
    justifyContent: 'center',
  },
  titleText: {
    ...semanticFont.title.large,
    color: semanticColor.text.primary,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: semanticNumber.spacing[24],
  },
  content: {},
  item: {
    paddingVertical: semanticNumber.spacing[12],
    gap: semanticNumber.spacing[4],
  },
  text: {
    ...semanticFont.body.smallStrong,
    color: semanticColor.text.primary,
  },
  description: {
    ...semanticFont.body.medium,
    color: semanticColor.text.secondary,
  },
  customerTextWrapper: {
    paddingTop: semanticNumber.spacing[12],
  },
  customerText: {
    ...semanticFont.body.smallStrong,
    color: semanticColor.text.tertiary,
  },
});

export default AuthErrorBottomSheet;
