import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import {colors} from '@/constants/colors';

interface PasswordPadProps {
  onInput: (value: string) => void;
  currentValue: string;
}

const PasswordPad = ({onInput, currentValue}: PasswordPadProps) => {
  useEffect(() => {}, [currentValue]);

  const handlePress = (btnValue: string) => {
    let newValue: string;
    if (btnValue === '←') {
      newValue = currentValue.slice(0, -1);
    } else if (btnValue !== ' ') {
      newValue = currentValue + btnValue;
    } else {
      return;
    }
    onInput(newValue);
  };

  const renderButton = (btnValue: string) => (
    <TouchableOpacity
      style={styles.button}
      onPress={() => {
        handlePress(btnValue);
      }}>
      {btnValue === '←' ? (
        <Text style={{fontSize: 32}}>←</Text>
      ) : (
        <Text style={styles.buttonText}>{btnValue}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <View style={styles.keypadContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, ' ', 0].map((num, index) => (
          <React.Fragment key={`button-${num}-${index}`}>
            {renderButton(num.toString())}
          </React.Fragment>
        ))}
        <View key="delete-button">{renderButton('←')}</View>
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
    fontSize: 25,
  },
});

export default PasswordPad;
