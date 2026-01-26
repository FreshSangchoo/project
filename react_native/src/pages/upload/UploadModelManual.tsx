import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticFont } from '@/styles/semantic-font';
import CenterHeader from '@/components/common/header/CenterHeader';
import TextSection from '@/components/common/TextSection';
import IconCheck from '@/assets/icons/IconCheck.svg';
import IconX from '@/assets/icons/IconX.svg';
import { useEffect, useMemo, useState, useCallback } from 'react';
import DropDown from '@/components/common/dropdown/DropDown';
import TextField from '@/components/common/text-field/TextField';
import IconBallpenOff from '@/assets/icons/IconBallpenOff.svg';
import BottomSheet from '@/components/common/bottom-sheet/BottomSheet';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ToolBar from '@/components/common/button/ToolBar';
import { useModelStore } from '@/stores/useModelStore';
import { useSemanticStore } from '@/stores/useSementicStore';
import { useShallow } from 'zustand/react/shallow';
import useProductApi from '@/hooks/apis/useProductApi';
import { useUploadDataStore } from '@/stores/useUploadDataStore';
import { HomeStackParamList } from '@/navigation/types/home-stack';
import { AvoidSoftInput } from 'react-native-avoid-softinput';
import useRootNavigation from '@/hooks/navigation/useRootNavigation';

const isAndroid = Platform.OS === 'android';

function UploadModelManual() {
  const navigation = useNavigation();
  const rootNavigation = useRootNavigation();
  const [checked, setChecked] = useState(false);
  const [modelName, setModelName] = useState('');
  const [brandSheet, setBrandSheet] = useState(false);
  const [effectSheet, setEffectSheet] = useState(false);
  const insets = useSafeAreaInsets();

  const [brand, setBrand] = useState<string | undefined>(undefined);
  const [brandIdLocal, setBrandIdLocal] = useState<number | null>(null);
  const [effects, setEffects] = useState<string[]>([]);
  const setAll = useModelStore(s => s.setAll);
  const { postProduct } = useProductApi();
  const [submitting, setSubmitting] = useState(false);
  const resetModelStore = useModelStore(s => s.reset);
  const route = useRoute<RouteProp<HomeStackParamList, 'UploadModelManual'>>();
  const origin = route.params?.origin ?? 'Home';
  const [height, setHeight] = useState(0);
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    const sub = AvoidSoftInput.onSoftInputHeightChange((e: any) => {
      setHeight(e.softInputHeight);
      setSticky(true);
      if (e.softInputHeight === 0) setSticky(false);
    });
    return () => sub.remove();
  }, []);

  const formatEffectValue = (arr: string[]) => {
    if (!arr || arr.length === 0) return undefined;
    if (arr.length === 1) return arr[0];
    return `${arr[0]} 외 ${arr.length - 1}개`;
  };

  const category = useMemo(() => {
    const v = formatEffectValue(effects);
    return v ? `이펙터>${v}` : '';
  }, [effects]);

  const canProceed = useMemo(() => {
    const hasModelName = modelName.trim().length > 0;
    const hasEffects = effects.length > 0;
    const hasBrand = checked ? true : !!brand?.trim?.();
    return hasModelName && hasEffects && hasBrand;
  }, [checked, brand, modelName, effects]);

  const setBrandName = useSemanticStore(s => s.setBrandByName);
  const setEffectNames = useSemanticStore(s => s.setEffectsByNames);
  const { effectIds, brandId } = useSemanticStore(useShallow(s => ({ effectIds: s.effectIds, brandId: s.brandId })));
  const resetSemanticStore = useSemanticStore(s => s.reset);

  const { setCustomProductId } = useUploadDataStore(
    useShallow(s => ({
      customProductId: s.customProductId,
      setCustomProductId: s.setCustomProductId,
    })),
  );

  const handleSubmit = async () => {
    if (!canProceed || submitting) return;

    if (!checked && typeof brandIdLocal !== 'number') {
      Alert.alert('브랜드 확인', '선택한 브랜드를 인식하지 못했어요. 다른 이름으로 선택해 주세요.');
      return;
    }

    resetModelStore();

    setAll({
      brand: checked ? undefined : brand,
      modelName,
      category,
    });

    try {
      setSubmitting(true);

      const payload = {
        name: modelName.trim(),
        ...(checked ? {} : typeof brandIdLocal === 'number' ? { brandId: brandIdLocal } : {}),
        ...(checked && brand?.trim() ? { customBrand: brand.trim() } : {}),
        effectTypeId: effectIds[0],
        isUnbrandedOrCustom: checked,
      } as Parameters<typeof postProduct>[0];

      const res = await postProduct(payload);
      const newId = res?.data?.customProductId;
      if (typeof newId === 'number') {
        setCustomProductId(newId);
      }

      (navigation as any).navigate('UploadIndexPage', { origin });
    } catch (e) {
      if (__DEV__) {
        console.warn('postProduct error:', e);
      }
      Alert.alert('등록 실패', '커스텀 매물 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.uploadModelManual}>
      <CenterHeader
        title="매물 등록"
        rightChilds={[
          {
            icon: (
              <IconX
                width={28}
                height={28}
                stroke={semanticColor.icon.primary}
                strokeWidth={semanticNumber.stroke.bold}
              />
            ),
            onPress: () => navigation.goBack(),
          },
        ]}
      />
      <ScrollView style={[{ flex: 1 }, isAndroid && height > 0 ? { marginBottom: -height } : null]}>
        {isAndroid && height > 0 ? (
          <></>
        ) : (
          <TextSection
            mainText="악기 정보를 직접 입력해 주세요."
            subText={`브랜드 / 소분류(타입) / 모델명을 정확히 입력해 주세요.`}
          />
        )}
        {isAndroid && height > 0 ? (
          <></>
        ) : (
          <TouchableOpacity style={styles.checkboxWrapper} onPress={() => setChecked(!checked)}>
            {checked ? (
              <View style={styles.checkedbox}>
                <IconCheck
                  width={16}
                  height={16}
                  stroke={semanticColor.checkbox.check}
                  strokeWidth={semanticNumber.stroke.bold}
                />
              </View>
            ) : (
              <View style={styles.checkbox} />
            )}
            <Text style={styles.checkboxText}>DIY · 커스텀 제작 등 브랜드가 없거나 몰라요.</Text>
          </TouchableOpacity>
        )}
        <View style={styles.modelInfoContainer}>
          {isAndroid && height > 0 ? (
            <></>
          ) : (
            <>
              {checked ? (
                <View style={styles.disabledBrand}>
                  <DropDown title="브랜드" placeholder="선택" isPlused isSelected disabled={true} />
                  <View style={styles.captionWrapper}>
                    <IconBallpenOff
                      width={16}
                      height={16}
                      stroke={semanticColor.icon.tertiary}
                      strokeWidth={semanticNumber.stroke.light}
                    />
                    <Text style={styles.captionText}>선택 미필요</Text>
                  </View>
                </View>
              ) : (
                <DropDown
                  title="브랜드"
                  placeholder="선택"
                  isPlused
                  isSelected
                  value={brand}
                  onClick={() => {
                    if (isAndroid) {
                      rootNavigation.navigate('CommonStack', {
                        screen: 'AosBottomSheet',
                        params: {
                          title: '브랜드 선택',
                          onSelectBrand: (b: any) => {
                            setBrand(b.name);
                            setBrandIdLocal(b.id);
                            setBrandName(b.name);
                          },
                          onSkip: () => {
                            setChecked(true);
                          }
                        },
                      });
                    } else {
                      setBrandSheet(true);
                    }
                  }}
                />
              )}
            </>
          )}
          <DropDown
            title="이펙터 타입"
            placeholder="선택"
            isPlused
            isSelected
            value={formatEffectValue(effects)}
            onClick={() => {
              if (isAndroid) {
                rootNavigation.navigate('CommonStack', {
                  screen: 'AosBottomSheet',
                  params: {
                    title: '이펙터 타입',
                    onSelectEffects: (names: string[]) => {
                      setEffects(names);
                      setEffectNames(names);
                    }
                  },
                });
              } else {
                setEffectSheet(true);
              }
            }}
          />
          <TextField label="모델명" placeholder="모델명 입력" inputText={modelName} setInputText={setModelName} />
        </View>
      </ScrollView>
      <View
        style={{
          backgroundColor: semanticColor.surface.white,
          paddingBottom: isAndroid ? height! : height! - insets.bottom,
        }}>
        <ToolBar children="다음" onPress={handleSubmit} disabled={!canProceed || submitting} isSticky={sticky} />
      </View>

      {!isAndroid && brandSheet && (
        <BottomSheet
          title="브랜드 선택"
          onClose={() => setBrandSheet(false)}
          onSelectBrand={b => {
            setBrand(b.name);
            setBrandIdLocal(b.id);
            setBrandName(b.name);
          }}
          onSkip={() => {
            setChecked(true);
            setBrandSheet(false);
          }}
          visible
        />
      )}

      {!isAndroid && effectSheet && (
        <BottomSheet
          title="이펙터 타입"
          onClose={() => setEffectSheet(false)}
          visible
          onSelectEffects={names => {
            setEffects(names);
            setEffectNames(names);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  uploadModelManual: {
    backgroundColor: semanticColor.surface.white,
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[20],
    alignItems: 'center',
    gap: semanticNumber.spacing[6],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: semanticNumber.borderRadius.sm,
    borderWidth: semanticNumber.stroke.xlight,
    borderColor: semanticColor.checkbox.deselected,
  },
  checkedbox: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: semanticNumber.borderRadius.sm,
    backgroundColor: semanticColor.checkbox.selected,
  },
  checkboxText: {
    ...semanticFont.label.xsmall,
    color: semanticColor.text.secondary,
  },
  modelInfoContainer: {
    paddingHorizontal: semanticNumber.spacing[16],
    gap: semanticNumber.spacing[24],
  },
  disabledBrand: {
    gap: semanticNumber.spacing[8],
  },
  captionWrapper: {
    flexDirection: 'row',
    gap: semanticNumber.spacing[4],
  },
  captionText: {
    ...semanticFont.caption.large,
    color: semanticColor.text.tertiary,
  },
  buttonWrapper: {
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[10],
  },
});

export default UploadModelManual;
