import { useEffect, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, View, ScrollView, Platform } from 'react-native';
import Overlay from '@/components/common/overlay/Overlay';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import Chip from '@/components/common/Chip';
import ToolBar from '@/components/common/button/ToolBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type StateBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;
const HEADER_OFFSET = semanticNumber.spacing[44];
const TITLE_OFFSET = semanticNumber.spacing[44] + semanticNumber.spacing[16];
const TOOLBAR_HEIGHT = semanticNumber.spacing[10] + semanticNumber.spacing[36];
const CONTENT_MAX_HEIGHT = SCREEN_HEIGHT - HEADER_OFFSET - TITLE_OFFSET - TOOLBAR_HEIGHT;
const ANIMATION_DURATION = 300;

const STATE_ITEMS = [
  {
    text: '신품',
    description: '완전한 새 제품의 상태',
  },
  {
    text: '매우 양호',
    description: '새 제품과 견줄만한 매우 좋은 상태',
  },
  {
    text: '양호',
    description: '기능에 이상은 없으나 외관에 일부 흠집 등 사용감이 다소 있는 상태',
  },
  {
    text: '보통',
    description: '아주 미세한 기능 하자가 있거나 외관에 흠집 등 사용감이 많은 상태',
  },
  {
    text: '하자/고장',
    description: '작동은 하지만 일부 기능의 수리가 필요한 상태',
  },
] as const;

const isAndroid = Platform.OS === 'android';

function StateBottomSheet({ visible, onClose }: StateBottomSheetProps) {
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

  const insets = useSafeAreaInsets();

  return (
    <Overlay visible={visible} onClose={handleClose} isBottomSheet>
      {visible && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.container,
            { transform: [{ translateY }, { translateX: new Animated.Value(0) }] },
            !isAndroid && { paddingBottom: insets.bottom },
          ]}>
          <View style={styles.totalContainer}>
            <View style={styles.title} {...panResponder.panHandlers}>
              <Text style={styles.titleText}>매물 상태에 대한 기준이 무엇인가요?</Text>
            </View>
            <View style={styles.contentWrapper}>
              <ScrollView
                style={{ maxHeight: CONTENT_MAX_HEIGHT }}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}>
                {STATE_ITEMS.map((item, idx) => (
                  <View key={idx} style={styles.item}>
                    <Chip text={item.text} variant="condition" />
                    <Text style={styles.description}>{item.description}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
          <ToolBar children="확인" onPress={handleClose} />
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
    gap: semanticNumber.spacing[24],
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
  },
  content: {
    paddingHorizontal: semanticNumber.spacing[24],
    gap: semanticNumber.spacing[24],
  },
  item: {
    gap: semanticNumber.spacing[6],
  },
  description: {
    ...semanticFont.body.medium,
    color: semanticColor.text.secondary,
  },
});

export default StateBottomSheet;
