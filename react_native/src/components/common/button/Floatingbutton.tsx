import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { semanticNumber } from '@/styles/semantic-number';
import { semanticColor } from '@/styles/semantic-color';
import { semanticFont } from '@/styles/semantic-font';
import { colors } from '@/styles/color';
import IconPlus from '@/assets/icons/IconPlus.svg';

interface FloatingbuttonProps {
  isContent?: boolean;
  onPress: () => void;
}

const Floatingbutton = ({ isContent = true, onPress }: FloatingbuttonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showLabel, setShowLabel] = useState(isContent);
  const [labelWidth, setLabelWidth] = useState(44);

  const size = useRef(new Animated.Value(isContent ? 1 : 0)).current;
  const fade = useRef(new Animated.Value(isContent ? 1 : 0)).current;

  useEffect(() => {
    if (isContent) {
      setShowLabel(true);
      Animated.parallel([
        Animated.timing(size, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.sequence([
        Animated.timing(fade, {
          toValue: 0,
          duration: 10,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(size, {
          toValue: 0,
          duration: 200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start(() => {
        setShowLabel(false);
      });
    }
  }, [isContent, size, fade]);

  const paddingH = size.interpolate({
    inputRange: [0, 1],
    outputRange: [semanticNumber.spacing[14], semanticNumber.spacing[16]],
  });

  const targetTextWidth = Math.ceil(labelWidth);
  const scale = size.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] });
  const textWidth = size.interpolate({ inputRange: [0, 1], outputRange: [0, targetTextWidth] });

  const textOpacity = fade;
  const textTranslateX = fade.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={styles.touchField}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: isPressed ? semanticColor.floating.uploadPressed : semanticColor.floating.uploadEnabled,
            paddingHorizontal: paddingH,
            transform: [{ scale }],
          },
        ]}>
        <IconPlus
          width={24}
          height={24}
          stroke={semanticColor.icon.brandOnDark}
          strokeWidth={semanticNumber.stroke.bold}
        />

        {showLabel && (
          <Animated.View
            style={{
              overflow: 'hidden',
              width: textWidth,
              opacity: textOpacity,
              transform: [{ translateX: textTranslateX }],
              justifyContent: 'center',
            }}
            pointerEvents="none">
            <Text numberOfLines={1} ellipsizeMode="clip" style={styles.text}>
              등록하기
            </Text>
          </Animated.View>
        )}
      </Animated.View>
      <View style={styles.measureBox} pointerEvents="none">
        <Text style={styles.text} numberOfLines={1} onLayout={e => setLabelWidth(e.nativeEvent.layout.width)}>
          등록하기
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  touchField: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    paddingRight: semanticNumber.spacing[16],
    paddingBottom: semanticNumber.spacing[12],
  },
  container: {
    flexDirection: 'row',
    boxSizing: 'content-box',
    alignSelf: 'flex-start',
    gap: semanticNumber.spacing[2],
    paddingHorizontal: semanticNumber.spacing[16],
    paddingVertical: semanticNumber.spacing[14],
    borderRadius: semanticNumber.borderRadius.full,
    borderWidth: semanticNumber.stroke.bold,
    borderColor: semanticColor.floating.uploadBorder,

    shadowColor: colors.alpha.black15,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    color: semanticColor.text.brandOnDark,
    ...semanticFont.label.medium,
    includeFontPadding: false as any,
  },
  measureBox: {
    position: 'absolute',
    opacity: 0,
    left: -9999,
  },
});

export default Floatingbutton;
