import React from 'react';
import {
  Dimensions,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {colors} from '@/constants/colors';

const deviceHeight = Dimensions.get('screen').height;

interface CustomButtonProps extends PressableProps {
  label: string;
  variant?: 'sns' | 'auth';
  inValid?: boolean;
  isParent?: boolean;
}

function CustomButton({
  label,
  variant = 'auth',
  inValid = false,
  isParent,
  ...props
}: CustomButtonProps) {
  const backgroundColor = isParent ? colors.BLUE_100 : colors.YELLOW_100;
  const textColor = isParent ? colors.WHITE : colors.BLACK;

  return (
    <Pressable style={styles.container} {...props}>
      <View style={[styles[variant], {backgroundColor}]}>
        <Text style={[styles[`${variant}Text`], {color: textColor}]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 3,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  inValid: {
    opacity: 0.5,
  },
  sns: {
    width: 50,
    height: 30,
    // backgroundColor: colors.YELLOW_100,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  snsText: {
    // color: colors.WHITE,
    fontFamily: 'GmarketSansTTFBold',
    fontSize: 16,
    textAlign: 'center',
  },
  auth: {
    width: 250,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 5,
    backgroundColor: colors.YELLOW_100,
  },
  authText: {
    // color: colors.BLACK,
    fontFamily: 'GmarketSansTTFBold',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CustomButton;
