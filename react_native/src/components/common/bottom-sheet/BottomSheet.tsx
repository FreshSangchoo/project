import { useState, useRef, useEffect } from 'react';
import { Platform, Animated, Dimensions, PanResponder, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import Overlay from '@/components/common/overlay/Overlay';
import MainButton from '@/components/common/button/MainButton';
import EffectType from '@/components/common/bottom-sheet/bottom-sheet-contents/EffectType';
import SelectBrand, { Brand } from '@/components/common/bottom-sheet/bottom-sheet-contents/SelectBrand';
import SelectRegion from '@/components/common/bottom-sheet/bottom-sheet-contents/SelectRegion';
import SelectFilter from '@/components/common/bottom-sheet/bottom-sheet-contents/SelectFilter';
import VariantButton from '@/components/common/button/VariantButton';
import { useFilterStore } from '@/stores/useFilterStore';
import IconX from '@/assets/icons/IconX.svg';
import IconReload from '@/assets/icons/IconReload.svg';
import { useFilterToastStore } from '@/stores/useFilterToastStore';
import { useUploadDataStore } from '@/stores/useUploadDataStore';
import Toast from '@/components/common/toast/Toast';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const HEADER_OFFSET = semanticNumber.spacing[44];
const TITLE_OFFSET = semanticNumber.spacing[44] + semanticNumber.spacing[16];
const TOOLBAR_HEIGHT = semanticNumber.spacing[10] + semanticNumber.spacing[36];
const CONTENT_MAX_HEIGHT = SCREEN_HEIGHT - HEADER_OFFSET - TITLE_OFFSET - TOOLBAR_HEIGHT;
const isAndroid = Platform.OS === 'android';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: '이펙터 타입' | '브랜드 선택' | '지역 선택' | '필터';
  onSelectBrand?: (brand: Brand) => void;
  onSelectEffects?: (names: string[]) => void;
  onSkip?: () => void;
}

const BottomSheet = ({ visible, onClose, title, onSelectBrand, onSelectEffects, onSkip }: BottomSheetProps) => {
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const translateY = panY.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 0, 1] });
  const resetPositionAnim = Animated.timing(panY, { toValue: 0, duration: 300, useNativeDriver: true });
  const closeAnim = Animated.timing(panY, { toValue: SCREEN_HEIGHT, duration: 300, useNativeDriver: true });

  const ANIMATION_DURATION = 300;

  const latestEffectsRef = useRef<string[]>([]);
  const regionIdsRef = useRef<number[]>([]);
  const regionNamesRef = useRef<string[]>([]);

  const setDirectLocations = useUploadDataStore(s => s.setDirectLocations);
  const setDirectRegionNames = useUploadDataStore(s => s.setDirectRegionNames);

  const { filterVisible, message: filterMessage, image: filterImage, duration: filterDuration, toastKey: filterToastKey } = useFilterToastStore();

  const [sheetToast, setSheetToast] = useState<{
    visible: boolean;
    message: string;
    image: any;
    duration: number;
  }>({ visible: false, message: '', image: 'EmojiRedExclamationMark', duration: 1500 });
  const [toastKey, setToastKey] = useState(0);

  const mirrorToastOnSheet = (message: string, duration = 1500, image: any = 'EmojiRedExclamationMark') => {
    setToastKey(k => k + 1);
    setSheetToast({ visible: true, message, image, duration });
    setTimeout(() => setSheetToast(s => ({ ...s, visible: false })), duration);
  };

  const handleClose = () => {
    useFilterToastStore.getState().filterVisible && useFilterToastStore.setState({ filterVisible: false });
    closeAnim.start();
    setTimeout(() => {
      panY.setValue(SCREEN_HEIGHT);
      onClose();
    }, ANIMATION_DURATION);
  };

  const handleApply = () => {
    if (title === '이펙터 타입') {
      onSelectEffects?.(latestEffectsRef.current);
    } else if (title === '필터') {
      const { applyFilters } = useFilterStore.getState();
      applyFilters?.();
    } else if (title === '지역 선택') {
      setDirectLocations(regionIdsRef.current);
      setDirectRegionNames(regionNamesRef.current);
    }
    closeAnim.start();
    setTimeout(() => {
      panY.setValue(SCREEN_HEIGHT);
      onClose();
    }, ANIMATION_DURATION);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderMove: (_, gestureState) => panY.setValue(gestureState.dy),
      onPanResponderRelease: (_, gestureState) => {
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

  const [resetSignal, setResetSignal] = useState(0);
  const { getFilteredEffects, resetSelectedEffects, setSelectedEffect } = useFilterStore();
  const filtered = getFilteredEffects();

  const handleRemoveFilter = (category: string, value: string) => {
    if (category === '지역') {
      // 지역의 경우 실제 store에 저장된 원본 값을 찾아서 제거
      const { selectedEffects } = useFilterStore.getState();
      const regionValues = selectedEffects['지역'] || [];
      const originalValue = regionValues.find(regionValue => {
        if (regionValue === '전체') return value === '전체';

        // 새로운 형태: "시도명|시군구명|sidoId-sigunguId"
        if (regionValue.includes('|')) {
          const parts = regionValue.split('|');
          if (parts.length === 3) {
            const [sidoName, sigunguName] = parts;
            const displayValue = sigunguName.startsWith(sidoName) ? sigunguName : `${sidoName} ${sigunguName}`;
            return displayValue === value;
          }
        }

        return regionValue === value;
      });

      if (originalValue) {
        setSelectedEffect(category, originalValue);
      }
    } else if (category === '가격') {
      // 가격은 단일 선택이므로 null로 초기화
      setSelectedEffect(category, null);
    } else {
      // 복수 선택 카테고리는 토글 방식
      setSelectedEffect(category, value);
    }
  };

  const handleResetFilter = () => {
    resetSelectedEffects();
    setResetSignal(prev => prev + 1);
  };

  return (
    <Overlay visible={visible} onClose={handleClose} isBottomSheet>
      {visible && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.container, { transform: [{ translateY }, { translateX: new Animated.Value(0) }] }]}>
          <View style={styles.totalContainer}>
            <View style={styles.title} {...(panResponder ? panResponder.panHandlers : {})}>
              <Text style={styles.titleText}>{title}</Text>
              <View style={styles.touchField}>
                <IconX
                  width={24}
                  height={24}
                  stroke={semanticColor.icon.primary}
                  strokeWidth={semanticNumber.stroke.bold}
                  onPress={handleClose}
                />
              </View>
            </View>

            <View style={styles.contentWrapper}>
              <View
                style={[styles.content, title === '필터' && { paddingVertical: 0, paddingHorizontal: 0, rowGap: 0 }]}>
                {title === '이펙터 타입' && (
                  <EffectType
                    onPress={handleClose}
                    onChangeSelected={ordered => {
                      latestEffectsRef.current = ordered;
                    }}
                  />
                )}

                {title === '브랜드 선택' && (
                  <SelectBrand
                    onSelect={(brand: Brand) => {
                      onSelectBrand?.(brand);
                      handleApply();
                    }}
                    onSkip={onSkip}
                  />
                )}

                {title === '지역 선택' && (
                  <SelectRegion
                    isFilter={false}
                    maxSelections={2}
                    onSelectionChange={(ids, names) => {
                      regionIdsRef.current = ids;
                      regionNamesRef.current = names;
                    }}
                    onOverLimit={() => mirrorToastOnSheet('지역은 최대 2개까지 선택할 수 있어요.', 1500)}
                  />
                )}

                {title === '필터' && <SelectFilter onPress={handleClose} resetSignal={resetSignal} />}
              </View>
            </View>

            {(title === '이펙터 타입' || title === '필터' || title === '지역 선택') && (
              <View style={styles.toolBar}>
                {filtered.length > 0 && title !== '지역 선택' && (
                  <View style={styles.selectedSection}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.buttonGroup}>
                      {filtered.map(({ category, value }, idx) => (
                        <VariantButton key={idx} theme="sub" onPress={() => handleRemoveFilter(category, value)}>
                          <View style={styles.filterButton}>
                            <Text>{value}</Text>
                            <TouchableOpacity onPress={() => handleRemoveFilter(category, value)} hitSlop={8}>
                              <IconX
                                width={16}
                                height={16}
                                stroke={semanticColor.icon.buttonSub}
                                strokeWidth={semanticNumber.stroke.bold}
                              />
                            </TouchableOpacity>
                          </View>
                        </VariantButton>
                      ))}
                    </ScrollView>

                    <View style={styles.rightGroup}>
                      <TouchableOpacity style={styles.button} onPress={handleResetFilter}>
                        <IconReload
                          width={20}
                          height={20}
                          stroke={semanticColor.icon.tertiary}
                          strokeWidth={semanticNumber.stroke.medium}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                <MainButton onPress={handleApply}>{title === '필터' ? '필터 적용하기' : '선택 완료'}</MainButton>
              </View>
            )}
          </View>

          {!isAndroid && (
            <>
              {sheetToast.visible && (
                <Toast
                  key={toastKey}
                  visible={sheetToast.visible}
                  message={sheetToast.message}
                  image={sheetToast.image}
                  duration={sheetToast.duration}
                />
              )}
              {filterVisible && (
                <Toast
                  key={filterToastKey}
                  visible={filterVisible}
                  message={filterMessage}
                  image={filterImage}
                  duration={filterDuration}
                />
              )}
            </>
          )}
        </Animated.View>
      )}
    </Overlay>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', position: 'absolute', bottom: 0, left: 0, right: 0 },
  totalContainer: { paddingTop: semanticNumber.spacing[44], position: 'relative' },
  title: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: semanticNumber.spacing[8],
    paddingBottom: semanticNumber.spacing[8],
    paddingRight: semanticNumber.spacing.none,
    paddingLeft: semanticNumber.spacing[24],
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: semanticNumber.spacing[24],
    borderTopRightRadius: semanticNumber.spacing[24],
    borderBottomLeftRadius: semanticNumber.spacing.none,
    borderBottomRightRadius: semanticNumber.spacing.none,
    backgroundColor: semanticColor.surface.white,
  },
  titleText: { color: semanticColor.text.primary, ...semanticFont.title.medium },
  touchField: { width: 44, height: 44, justifyContent: 'center' },
  contentWrapper: { flex: 1, backgroundColor: semanticColor.surface.white },
  content: {
    height: CONTENT_MAX_HEIGHT,
    flexDirection: 'column',
    rowGap: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[16],
    paddingHorizontal: semanticNumber.spacing[24],
  },
  toolBar: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    zIndex: 5,
    paddingTop: semanticNumber.spacing[10],
    paddingBottom: isAndroid ? semanticNumber.spacing[10] : semanticNumber.spacing[36],
    paddingHorizontal: semanticNumber.spacing[16],
    borderTopColor: semanticColor.border.medium,
    borderTopWidth: semanticNumber.stroke.hairline,
    backgroundColor: semanticColor.surface.white,
    gap: semanticNumber.spacing[8],
  },
  selectedSection: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  buttonGroup: { flexDirection: 'row', gap: semanticNumber.spacing[6], alignItems: 'center' },
  filterButton: { height: 24, flexDirection: 'row', gap: semanticNumber.spacing[4], alignItems: 'center' },
  rightGroup: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  button: {
    padding: semanticNumber.spacing[4],
    borderRadius: semanticNumber.borderRadius.md,
    backgroundColor: semanticColor.button.subEnabled,
  },
});

export default BottomSheet;
