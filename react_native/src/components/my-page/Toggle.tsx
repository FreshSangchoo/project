import { semanticColor } from '@/styles/semantic-color';
import { semanticNumber } from '@/styles/semantic-number';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity } from 'react-native';

interface ToggleProps {
  onToggle: () => void;
  isOn: boolean;
  isIOS?: boolean;
  disabled?: boolean;
}

function Toggle({ onToggle, isOn, isIOS, disabled }: ToggleProps) {
  const [animatedValue] = useState(new Animated.Value(isOn ? 1 : 0));

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isOn ? 1 : 0,
      duration: 100,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [isOn, animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: isIOS ? [2, 18] : [2, 24],
  });

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onToggle}
      style={
        isIOS
          ? [iosStyles.toggleContainer, isOn ? iosStyles.toggleOn : iosStyles.toggleOff]
          : [
              styles.toggleContainer,
              isOn && styles.toggleOn,
              disabled && styles.toggleOnDisabled,
              !isOn && styles.toggleOff,
            ]
      }>
      <Animated.View
        style={[
          isIOS ? iosStyles.knobContainer : styles.knobContainer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    width: 54,
    height: 32,
    borderRadius: semanticNumber.borderRadius.full,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: semanticColor.toggle.on,
  },
  toggleOff: {
    backgroundColor: semanticColor.toggle.off,
  },
  toggleOnDisabled: {
    backgroundColor: '#A5A5A5',
  },
  knobContainer: {
    width: 28,
    height: 28,
    borderRadius: semanticNumber.borderRadius.full,
    backgroundColor: semanticColor.toggle.knob,
  },
});

const iosStyles = StyleSheet.create({
  toggleContainer: {
    width: 44,
    height: 28,
    borderRadius: semanticNumber.borderRadius.full,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: '#34C759',
  },
  toggleOff: {
    backgroundColor: semanticColor.toggle.off,
  },
  toggleOnInOff: {
    backgroundColor: semanticColor.icon.tertiary,
  },
  knobContainer: {
    width: 24,
    height: 24,
    borderRadius: semanticNumber.borderRadius.full,
    backgroundColor: semanticColor.toggle.knob,
  },
});

export default Toggle;
