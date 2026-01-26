import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Platform } from 'react-native';

type Return = {
  bottomAnim: Animated.Value;
  spacer: number;
  kbVisible: boolean;
  kbHeight: number;
  onToolbarLayout: (h: number) => void;
};

export function useKeyboardToolbar(insetsBottom: number): Return {
  const bottomAnim = useRef(new Animated.Value(insetsBottom)).current;
  const [kbVisible, setKbVisible] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const [toolbarH, setToolbarH] = useState(0);

  useEffect(() => {
    const animateTo = (to: number, duration?: number) => {
      bottomAnim.stopAnimation();
      Animated.timing(bottomAnim, {
        toValue: to,
        duration: duration ?? 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    };

    if (Platform.OS === 'ios') {
      const willShow = Keyboard.addListener('keyboardWillShow', e => {
        const h = e.endCoordinates?.height ?? 0;
        setKbVisible(true);
        setKbHeight(h);
        animateTo(h, e.duration ?? 250);
      });
      const willHide = Keyboard.addListener('keyboardWillHide', e => {
        animateTo(insetsBottom, e.duration ?? 200);
        setKbVisible(false);
        setKbHeight(0);
      });
      return () => {
        willShow.remove();
        willHide.remove();
      };
    } else {
      const didShow = Keyboard.addListener('keyboardDidShow', e => {
        const h = e.endCoordinates?.height ?? 0;
        setKbVisible(true);
        setKbHeight(h);
        animateTo(h + insetsBottom, 290);
      });
      const didHide = Keyboard.addListener('keyboardDidHide', () => {
        animateTo(insetsBottom, 200);
        setKbVisible(false);
        setKbHeight(0);
      });
      return () => {
        didShow.remove();
        didHide.remove();
      };
    }
  }, [bottomAnim, insetsBottom]);

  const onToolbarLayout = (h: number) => setToolbarH(h);

  const spacer = useMemo(
    () => toolbarH + (kbVisible ? kbHeight : insetsBottom),
    [toolbarH, kbVisible, kbHeight, insetsBottom],
  );

  return { bottomAnim, spacer, kbVisible, kbHeight, onToolbarLayout };
}
