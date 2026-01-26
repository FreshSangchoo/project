import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import Overlay from '@/components/common/overlay/Overlay';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { semanticNumber } from '@/styles/semantic-number';
import ToolBar from '@/components/common/button/ToolBar';
import IconCheck from '@/assets/icons/IconCheck.svg';
import IconChevronRight from '@/assets/icons/IconChevronRight.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationApi } from '@/hooks/apis/useNotificationApi';
import { showErrorToast } from '@/utils/errorHandler';
import IconX from '@/assets/icons/IconX.svg';
import WebView from 'react-native-webview';
import ButtonTitleHeader from '@/components/common/header/ButtonTitleHeader';

type PolicyBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPress: () => void;
  isSafeArea?: boolean;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;
const HEADER_OFFSET = semanticNumber.spacing[44];
const TITLE_OFFSET = semanticNumber.spacing[44] + semanticNumber.spacing[16];
const TOOLBAR_HEIGHT = semanticNumber.spacing[10] + semanticNumber.spacing[36];
const CONTENT_MAX_HEIGHT = SCREEN_HEIGHT - HEADER_OFFSET - TITLE_OFFSET - TOOLBAR_HEIGHT;
const ANIMATION_DURATION = 300;
const TERMS_URL = 'https://jammering-support.notion.site/info-terms-of-use';
const PRIVACY_URL = 'https://jammering-support.notion.site/info-privacy-consent';
const MARKETING_URL = 'https://jammering-support.notion.site/info-marketing-communication-consent-policy';

const CHECKLIST_ITEMS = [
  {
    text: '(필수) 서비스 이용약관 동의',
    link: TERMS_URL,
  },
  {
    text: '(필수) 개인정보 수집 및 이용 동의',
    link: PRIVACY_URL,
  },
  {
    text: '(선택) 마케팅 수신 동의',
    link: MARKETING_URL,
  },
] as const;

const isAndroid = Platform.OS === 'android';

function PolicyBottomSheet({ visible, onClose, onPress, isSafeArea }: PolicyBottomSheetProps) {
  const { putNotificationMarketing, getNotificationSetting, putNotificationPush } = useNotificationApi();
  const [submitting, setSubmitting] = useState(false);

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

  const [checked, setChecked] = useState<boolean[]>(Array(CHECKLIST_ITEMS.length).fill(true));

  const checkItem = (idx: number) => {
    setChecked(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const allRequiredChecked = CHECKLIST_ITEMS.every((it, i) => (it.text.startsWith('(필수)') ? checked[i] : true));
  const insets = useSafeAreaInsets();

  const [webVisible, setWebVisible] = useState<boolean>(false);
  const [webUrl, setWebUrl] = useState<string>('');

  const openURL = (url: string) => {
    setWebUrl(url);
    setWebVisible(true);
  };

  const closeURL = () => {
    setWebVisible(false);
    setWebUrl('');
  };

  const marketingIndex = CHECKLIST_ITEMS.findIndex(it => it.text.includes('마케팅 수신 동의'));
  const marketingEnabled = marketingIndex >= 0 ? !!checked[marketingIndex] : false;

  const handleConfirm = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);

      if (marketingEnabled) {
        const current = await getNotificationSetting();
        if (current && current.pushEnabled === false) {
          await putNotificationPush({ pushEnabled: true });
        }
      }

      await putNotificationMarketing({ marketingEnabled });

      onPress();
    } catch (error: any) {
      showErrorToast(error, '설정 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay visible={visible} onClose={handleClose} isBottomSheet>
      {visible && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.container, { transform: [{ translateY }, { translateX: new Animated.Value(0) }] }]}>
          <View style={[styles.totalContainer, !isAndroid && { paddingBottom: insets.bottom }]}>
            <View style={styles.title} {...panResponder.panHandlers}>
              <Text style={styles.titleText}>{`아키파이 이용을 위해\n동의가 필요해요.`}</Text>
            </View>
            <ScrollView
              style={{ maxHeight: CONTENT_MAX_HEIGHT }}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}>
              {CHECKLIST_ITEMS.map((item, idx) => (
                <View key={idx} style={styles.item}>
                  <Pressable style={styles.checkTouchField} onPress={() => checkItem(idx)}>
                    <IconCheck
                      width={20}
                      height={20}
                      stroke={checked[idx] ? semanticColor.checkbox.selected : semanticColor.checkbox.deselected}
                      strokeWidth={semanticNumber.stroke.bold}
                    />
                    <View style={styles.textWrapper}>
                      <Text style={styles.text}>{item.text}</Text>
                    </View>
                  </Pressable>
                  <Pressable style={styles.linkButtonWrapper} onPress={() => openURL(item.link)}>
                    <IconChevronRight
                      width={20}
                      height={20}
                      stroke={semanticColor.icon.lightest}
                      strokeWidth={semanticNumber.stroke.medium}
                    />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
            <ToolBar children="동의하고 계속하기" onPress={handleConfirm} disabled={!allRequiredChecked} isHairLine />
          </View>
        </Animated.View>
      )}
      {webVisible && (
        <View style={[styles.webViewWrapper, isSafeArea && { paddingTop: insets.top }]}>
          <ButtonTitleHeader
            title=""
            leftChilds={{
              icon: (
                <IconX
                  width={28}
                  height={28}
                  stroke={semanticColor.icon.primary}
                  strokeWidth={semanticNumber.stroke.bold}
                />
              ),
              onPress: () => closeURL(),
            }}
          />
          <WebView source={{ uri: webUrl }} startInLoadingState style={{ flex: 1 }} />
        </View>
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
    paddingTop: semanticNumber.spacing[32],
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
  content: {
    paddingHorizontal: semanticNumber.spacing[24],
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: semanticNumber.spacing[2],
  },
  checkTouchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textWrapper: {
    flex: 1,
    marginLeft: semanticNumber.spacing[24],
  },
  text: {
    ...semanticFont.body.medium,
    color: semanticColor.text.secondary,
  },
  linkButtonWrapper: {
    width: 44,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  webViewWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: Dimensions.get('screen').height,
    backgroundColor: semanticColor.surface.white,
    overflow: 'hidden',
  },
});

export default PolicyBottomSheet;
