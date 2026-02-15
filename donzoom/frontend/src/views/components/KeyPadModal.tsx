import React from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import KeyPad from './KeyPad';
import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';

interface KeypadModalProps {
  visible: boolean;
  onClose: () => void;
  onInput: (amount: number) => void;
  currentValue: number;
}

const KeypadModal = ({
  visible,
  onClose,
  onInput,
  currentValue,
}: KeypadModalProps) => {
  const handleConfirm = () => {
    onClose();
  };

  const handleKeypadInput = (newValue: number) => {
    onInput(newValue);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.amountText}>
            {currentValue.toLocaleString()}원
          </Text>
          <KeyPad onInput={handleKeypadInput} currentValue={currentValue} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}>
              <Text style={styles.confitmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  amountText: {
    fontSize: 24,
    fontFamily: fonts.MEDIUM,
    textAlign: 'right',
    marginBottom: 20,
    color: colors.BLACK,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: colors.BLUE_100,
  },
  buttonText: {
    color: colors.BLUE_100,
    fontFamily: fonts.MEDIUM,
  },
  confitmText: {
    color: colors.WHITE,
    fontFamily: fonts.MEDIUM,
  },
});

export default KeypadModal;
