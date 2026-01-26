import { useEffect, useRef } from 'react';
import { Animated, Dimensions, PanResponder, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Overlay from '@/components/common/overlay/Overlay';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import SettingItem, { SettingItemProps } from '@/components/my-page/SettingItemRow';
import ToolBar from '@/components/common/button/ToolBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const CONTENT_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;
const isAndroid = Platform.OS === 'android';

export type ActionItem = Omit<SettingItemProps, 'subItem'> & {
  selected?: boolean;
  rightNode?: React.ReactNode;
};

interface ActionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  items: ActionItem[];
  isSafeArea?: boolean;
}

export default function ActionBottomSheet({ visible, onClose, items, isSafeArea }: ActionBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const translateY = panY.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0, 0, 1],
  });

  const openAnim = Animated.timing(panY, { toValue: 0, duration: 260, useNativeDriver: true });
  const closeAnim = Animated.timing(panY, { toValue: SCREEN_HEIGHT, duration: 240, useNativeDriver: true });

  const handleClose = () => {
    closeAnim.start(() => {
      panY.setValue(SCREEN_HEIGHT);
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => panY.setValue(g.dy),
      onPanResponderRelease: (_, g) => {
        const shouldClose = g.dy > SCREEN_HEIGHT * 0.25 || g.vy > 1.5;
        shouldClose ? handleClose() : openAnim.start();
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => {
        panY.setValue(SCREEN_HEIGHT);
        openAnim.start();
      });
    }
  }, [visible]);

  return (
    <Overlay visible={visible} onClose={handleClose} isBottomSheet>
      {visible && (
        <Animated.View
          style={[styles.container, { transform: [{ translateY }, { translateX: new Animated.Value(0) }] }]}>
          <View style={styles.header} {...panResponder.panHandlers} />
          <View style={[styles.contentWrapper, isSafeArea && !isAndroid && { paddingBottom: insets.bottom }]}>
            <ScrollView
              style={{ maxHeight: CONTENT_MAX_HEIGHT }}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}>
              {items.map(item => (
                <SettingItem
                  key={item.itemName}
                  itemImage={item.itemImage}
                  itemName={item.itemName}
                  itemNameStyle={item.itemNameStyle}
                  onPress={item.onPress}
                  isBottomSheet
                  showNextButton={item.showNextButton}
                />
              ))}
            </ScrollView>
            <ToolBar children="취소" theme="sub" onPress={handleClose} isHairLine />
          </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: semanticNumber.spacing[16],
    backgroundColor: semanticColor.surface.white,
    borderTopLeftRadius: semanticNumber.borderRadius.xl2,
    borderTopRightRadius: semanticNumber.borderRadius.xl2,
  },
  contentWrapper: {
    backgroundColor: semanticColor.surface.white,
  },
  listContainer: {
    paddingBottom: semanticNumber.spacing[16],
  },
});
