import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import {colors} from '@/constants/colors';
import { fonts } from '@/constants/font';

//부모 컴포넌트에서 updateValue함수와 변경대상인 value를 작성하고
//<KeyPad onInput={updateValue} currentValue={value}/> 처럼 props 전달하여
// 필요한 경우 하나의 변수를 부모컴포넌트와 키패드에서 함께 관리할수 있도록 구현됨

const KeyPad = ({
  onInput,
  currentValue,
}: {
  onInput: (value: number) => void;
  currentValue: number;
}) => {
  useEffect(() => {}, [currentValue]);

  const handlePress = (btnValue: string) => {
    let newValue: number;
    if (btnValue === '←') {
      newValue = Math.floor(currentValue / 10);
    } else if (btnValue !== ' ') {
      let digit = parseInt(btnValue);
      newValue = currentValue * 10 + digit;
    } else {
      return;
    }
    onInput(newValue);
  };

  const renderButton = (btnValue: string, key: string) => (
    <TouchableOpacity
      key={key}
      style={styles.button}
      onPress={() => {
        handlePress(btnValue);
      }}>
      {btnValue === '←' ? (
        <Text style={{fontSize: 35}}>←</Text>
      ) : (
        <Text style={styles.buttonText}>{btnValue}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <View style={styles.keypadContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, ' ', 0].map((num, index) =>
          renderButton(num.toString(), `btn-${num}-${index}`),
        )}
        {renderButton('←', 'btn-back')}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  keypadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 360,
    height: 320,
  },
  button: {
    width: 120,
    height: 80,
    paddingVertical: 15,
    paddingHorizontal: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 25,
    fontWeight:'500',
  },
});

export default KeyPad;
