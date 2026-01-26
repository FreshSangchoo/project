import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import Overlay from '@/components/common/overlay/Overlay';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import IconCheck from '@/assets/icons/IconCheck.svg';

export type SortValue = 'latest' | 'price_low' | 'price_high' | 'view_count' | 'like_count';

type SortBottomSheetProps = {
  visible: boolean;
  selected: SortValue;
  onSelect: (value: SortValue, label: string) => void;
  onClose: () => void;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;
const HEADER_OFFSET = semanticNumber.spacing[44];
const TITLE_OFFSET = semanticNumber.spacing[44] + semanticNumber.spacing[16];
const TOOLBAR_HEIGHT = semanticNumber.spacing[10] + semanticNumber.spacing[36];
const CONTENT_MAX_HEIGHT = SCREEN_HEIGHT - HEADER_OFFSET - TITLE_OFFSET - TOOLBAR_HEIGHT;
const ANIMATION_DURATION = 300;

const ITEMS: { label: string; value: SortValue }[] = [
  {
    label: '최신순',
    value: 'latest',
  },
  {
    label: '낮은 가격순',
    value: 'price_low',
  },
  {
    label: '높은 가격순',
    value: 'price_high',
  },
  {
    label: '조회수순',
    value: 'view_count',
  },
  {
    label: '좋아요순',
    value: 'like_count',
  },
] as const;

function SortBottomSheet({ visible, selected, onSelect, onClose }: SortBottomSheetProps) {
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
            <ScrollView style={{ maxHeight: CONTENT_MAX_HEIGHT }} showsVerticalScrollIndicator={false}>
              {ITEMS.map((item, idx) => {
                const isSelected = item.value === selected;
                return (
                  <Pressable
                    key={idx}
                    style={styles.item}
                    onPress={() => {
                      onSelect(item.value, item.label);
                      handleClose();
                    }}>
                    <View style={styles.textWrapper}>
                      <Text style={isSelected ? styles.selectedText : styles.text}>{item.label}</Text>
                    </View>
                    {isSelected && (
                      <IconCheck
                        width={24}
                        height={24}
                        stroke={semanticColor.icon.primary}
                        strokeWidth={semanticNumber.stroke.bold}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
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
    backgroundColor: semanticColor.surface.white,
    borderTopLeftRadius: semanticNumber.borderRadius.xl2,
    borderTopRightRadius: semanticNumber.borderRadius.xl2,
  },
  totalContainer: {
    paddingTop: semanticNumber.spacing[8],
    paddingBottom: semanticNumber.spacing[36],
    paddingHorizontal: semanticNumber.spacing[16],
  },
  item: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: semanticNumber.spacing[12],
  },
  textWrapper: {
    flex: 1,
  },
  selectedText: {
    ...semanticFont.label.medium,
    color: semanticColor.text.primary,
  },
  text: {
    ...semanticFont.body.large,
    color: semanticColor.text.primary,
  },
});

export default SortBottomSheet;
