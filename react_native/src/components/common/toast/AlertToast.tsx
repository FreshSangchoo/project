import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import EmojiSadface from '@/assets/icons/EmojiSadface.svg';

interface AlertToastProps {
  visible: boolean;
  duration?: number;
}
const ANIMATION_DURATION = 250;
const isAndroid = Platform.OS === 'android';

const AlertToast = ({ visible, duration = 1000 }: AlertToastProps) => {
  const translateY = useRef(new Animated.Value(-10)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);
  useEffect(() => {
    if (visible) {
      setShouldRender(true);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 56,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShouldRender(false);
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, translateY, opacity]);
  if (!shouldRender) return null;
  return (
    <View style={styles.fakecontainer}>
      <Animated.View style={{ transform: [{ translateY }], opacity }}>
        <View style={styles.container}>
          <EmojiSadface width={14} height={14} />
          <Text style={styles.text}>{`알 수 없는 오류가 발생했습니다.\n재시도 하거나 앱을 재실행해 주세요.`}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  fakecontainer: {
    position: 'absolute',
    top: isAndroid ? '4%' : '6%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    flexDirection: 'row',
    minHeight: semanticNumber.spacing[44],
    paddingVertical: semanticNumber.spacing[10],
    paddingHorizontal: semanticNumber.spacing[12],
    columnGap: semanticNumber.spacing[4],
    borderRadius: semanticNumber.borderRadius.xl,
    backgroundColor: semanticColor.surface.critical,
    shadowColor: semanticColor.toast.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: semanticNumber.borderRadius.md,
    elevation: 4,
  },
  text: {
    color: semanticColor.toast.text,
    ...semanticFont.label.small,
  },
});

export default AlertToast;
