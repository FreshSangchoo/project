import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';

interface Bank {
  id: string;
  name: string;
}

interface Recipient {
  accountNumber: string;
}

interface TransferRecipientModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectRecipient: (recipient: Recipient) => void;
}

const TransferRecipientModal: React.FC<TransferRecipientModalProps> = ({
  visible,
  onClose,
  onSelectRecipient,
}) => {
  const [accountNumber, setAccountNumber] = useState<string>('');

  const handleConfirm = () => {
    if (accountNumber) {
      onSelectRecipient({accountNumber});
      onClose();
    } else {
      Alert.alert('입력 오류', '은행과 계좌번호를 모두 입력해주세요.', [
        {text: '확인'},
      ]);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>이체 대상 선택</Text>

          <Text style={styles.label}>계좌번호</Text>
          <TextInput
            style={styles.input}
            placeholder="계좌번호를 입력하세요"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}>
              <Text style={styles.confirmText}>확인</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
  },
  bankItem: {
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  selectedBankItem: {
    backgroundColor: '#e0e0e0',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.GRAY_50,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontFamily: fonts.MEDIUM,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
  },
  confirmText: {
    color: colors.WHITE,
    fontFamily: fonts.MEDIUM,
  },
});

export default TransferRecipientModal;
