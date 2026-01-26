import { useEffect, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, View, ScrollView, Image, Platform } from 'react-native';
import Overlay from '@/components/common/overlay/Overlay';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import ToolBar from '@/components/common/button/ToolBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PhotoGuideBottmSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;
const HEADER_OFFSET = semanticNumber.spacing[44];
const TITLE_OFFSET = semanticNumber.spacing[44] + semanticNumber.spacing[16];
const TOOLBAR_HEIGHT = semanticNumber.spacing[10] + semanticNumber.spacing[36];
const CONTENT_MAX_HEIGHT = SCREEN_HEIGHT - HEADER_OFFSET - TITLE_OFFSET - TOOLBAR_HEIGHT;
const ANIMATION_DURATION = 300;

const DESCRIPTION_ITEMS = [
  {
    text: 'I. 다양한 각도',
    description: '다양한 각도에서의 매물 사진을 업로드 해 주세요.',
  },
  {
    text: 'II. 하자가 있는 부분',
    description: '하자, 기능 및 외관 결함이 있는 부분을 업로드 해 주세요.',
  },
  {
    text: 'III. 특별한 부분',
    description: '각 매물마다 특별한 부분(예: 회로 기판)의 사진도 좋습니다!',
  },
] as const;

const isAndroid = Platform.OS === 'android';

function PhotoGuideBottomSheet({ visible, onClose }: PhotoGuideBottmSheetProps) {
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
              <Text style={styles.titleText}>매물 사진 가이드</Text>
            </View>
            <View style={styles.photoImageGuide}>
              <View style={styles.photoImageGuideRow}>
                <Image source={require('@/assets/images/photo-guide/photo-guide-example-1.png')} style={styles.image} />
                <Image source={require('@/assets/images/photo-guide/photo-guide-example-2.png')} style={styles.image} />
                <Image source={require('@/assets/images/photo-guide/photo-guide-example-3.png')} style={styles.image} />
              </View>
              <View style={styles.photoImageGuideRow}>
                <Image source={require('@/assets/images/photo-guide/photo-guide-example-4.png')} style={styles.image} />
                <Image source={require('@/assets/images/photo-guide/photo-guide-example-5.png')} style={styles.image} />
                <Image source={require('@/assets/images/photo-guide/photo-guide-example-6.png')} style={styles.image} />
              </View>
            </View>
            <View style={styles.contentWrapper}>
              <ScrollView
                style={{ maxHeight: CONTENT_MAX_HEIGHT }}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}>
                {DESCRIPTION_ITEMS.map((item, idx) => (
                  <View key={idx} style={styles.item}>
                    <Text style={styles.text}>{item.text}</Text>
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
  photoImageGuide: {
    alignItems: 'center',
    gap: semanticNumber.spacing[12],
  },
  photoImageGuideRow: {
    flexDirection: 'row',
    gap: 9,
  },
  image: {
    width: 72,
    height: 72,
  },
  contentWrapper: {
    flex: 1,
  },
  content: {
    paddingHorizontal: semanticNumber.spacing[24],
    gap: semanticNumber.spacing[24],
  },
  item: {
    gap: semanticNumber.spacing[10],
  },
  text: {
    ...semanticFont.title.small,
    color: semanticColor.text.primary,
  },
  description: {
    ...semanticFont.body.small,
    color: semanticColor.text.secondary,
  },
});

export default PhotoGuideBottomSheet;
