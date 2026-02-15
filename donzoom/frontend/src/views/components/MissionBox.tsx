import React, {useRef, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import {colors} from '../../constants/colors';
import { fonts } from '@/constants/font';
//TODO: 필요할경우 미션박스 컴포넌트 React.memo로 리팩토링
interface MissionProps {
  missionTitle: string;
  missionPay: number;
  missionDate: string;
  onPress: () => void;
  isSelected: boolean;
  buttonOne: string;
  buttonTwo: string;
  onPressButtonOne: () => void;
  onPressButtonTwo: () => void;
}

const MissionBox = ({
  missionTitle,
  missionPay,
  missionDate,
  onPress,
  isSelected,
  buttonOne,
  buttonTwo,
  onPressButtonOne,
  onPressButtonTwo,
}: MissionProps) => {
  const animatedWidth = useRef(new Animated.Value(1)).current;
  const animatedButtonWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedWidth, {
        toValue: isSelected ? 0.8 : 1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(animatedButtonWidth, {
        toValue: isSelected ? 1 : 0,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isSelected]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress}>
        <Animated.View
          style={[
            styles.boxContainer,
            {
              width: animatedWidth.interpolate({
                inputRange: [0.8, 1],
                outputRange: [240, 350],
              }),
            },
          ]}>
          {/* 박스 크기 조정하*/}
          <Text style={styles.largeText}> {missionTitle} </Text>
          <Text style={styles.mediumText}>{missionPay.toLocaleString()}원</Text>
          <Text style={styles.smallText}>
            {missionDate}까지
          </Text>
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.buttonContainer,
          {
            width: animatedButtonWidth.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 100], //글자 길이도 이거보다 짧아야함
            }),
            opacity: animatedButtonWidth,
          },
        ]}>
        <TouchableOpacity
          style={styles.modifyButton}
          onPress={onPressButtonOne}>
          <Text style={styles.buttonOneText}>{buttonOne}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onPressButtonTwo}>
          <Text style={styles.buttonTwoText}>{buttonTwo}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center', // 버튼 정렬
    marginVertical: 10,
  },
  buttonContainer: {
    overflow: 'hidden',
  },
  modifyButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    marginLeft: 20,
    marginBottom: 5,
    borderColor: colors.BLACK,
    borderRadius: 10,
    backgroundColor: colors.BLUE_100,
    borderWidth: 1,
  },
  cancelButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    marginLeft: 20,
    marginBottom: 5,
    borderColor: colors.BLACK,
    borderRadius: 10,
    backgroundColor: colors.WHITE,
    borderWidth: 1,
  },
  buttonOneText: {
    fontFamily: fonts.MEDIUM,
    fontSize: 15,
    color: colors.WHITE,
  },
  buttonTwoText: {
    fontFamily: fonts.MEDIUM,
    fontSize: 15,
    color: colors.BLACK,
  },
  boxContainer: {
    // 미션 박스 스타일
    padding: 20,
    height: 130,
    borderColor: colors.BLACK,
    backgroundColor: colors.YELLOW_50,
    borderRadius: 10,
    justifyContent: 'center',
  },
  largeText: {
    fontSize: 20,
    marginBottom: 10,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    textAlign: 'right',
  },
  mediumText: {
    fontSize: 15,
    marginBottom: 5,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    textAlign: 'right',
  },
  smallText: {
    fontSize: 15,
    marginBottom: 5,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    textAlign: 'right',
  },
});

export default MissionBox;
