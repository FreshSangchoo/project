import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import useAccount from '@/hooks/queries/useAccount';
import useAccountBalance from '@/hooks/useAccountInfo';
import useTransferStore from '@/stores/useTransferStore';
import KeypadModal from '@/views/components/KeyPadModal';
import TransferRecipientModal from '@/views/components/TransferModal';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Recipient {
  accountNumber: string;
}

export default function TransferScreen({route, navigation}: any) {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [keypadModalVisible, setKeypadModalVisible] = useState<boolean>(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(
    null,
  );
  const {account, balance, error, refetch} = useAccountBalance();
  const {accountNo, amount, setAccountNo, setAmount} = useTransferStore();
  const {useGetAccountHolder} = useAccount();

  useEffect(() => {
    console.log(
      'Received accountNo from QRCodeScanner:',
      route.params?.accountNo,
    );
    if (route.params?.accountNo) {
      setAccountNo(route.params.accountNo);
    }
    console.log('이거잉거이거이거ㅣ: ', accountNo);
  }, [route.params?.accountNo, setAccountNo]);

  useFocusEffect(
    useCallback(() => {
      setAmount('0');
    }, []),
  );

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleSelectRecipient = (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    setModalVisible(false);
    setAccountNo(recipient.accountNumber);
  };

  const handleOpenKeypadModal = () => {
    setKeypadModalVisible(true);
  };

  const handleCloseKeypadModal = () => {
    setKeypadModalVisible(false);
  };

  const handleAmountChange = (newAmount: number) => {
    setAmount(newAmount + '');
  };
  const accountCheck = useGetAccountHolder(accountNo).isSuccess;

  const onPressNext = () => {
    if (Number(balance) < Number(amount)) {
      console.log(balance);
      console.log(amount);
      Alert.alert('잔액이 부족합니다.');
    } else if (accountNo === '') {
      Alert.alert('계좌번호를 확인해주세요.');
    } else if (amount === '0') {
      Alert.alert('보낼금액을 확인해주세요.');
    } else {
      if (accountCheck) {
        navigation.navigate('송금2');
      } else {
        Alert.alert('계좌번호를 확인해주세요.');
      }
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.menuHeaderText}>출금계좌</Text>
      <View style={styles.myAccountInfoContainer}>
        <View style={styles.myAccountTextContainer}>
          <Text style={styles.myAccountTextHeader}>내 계좌</Text>
          <Text style={styles.myAccountTextContext}>싸피 {account}</Text>
        </View>
        <View style={styles.myAccountTextContainer}>
          <Text style={styles.withdrawableAmountTextHeader}>출금가능금액</Text>
          <Text style={styles.withdrawableAmountTextContext}>
            {parseInt(balance).toLocaleString()}원
          </Text>
        </View>
      </View>
      <Text style={styles.menuHeaderText}>입금대상</Text>
      <Pressable
        style={styles.recipientAccountInfoContainer}
        onPress={handleOpenModal}>
        <Text style={styles.recipientAccountInfoText}>
          {route.params?.accountNo
            ? `${route.params?.accountNo}`
            : '받을 대상을 선택해 주세요'}
        </Text>
      </Pressable>

      <TransferRecipientModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onSelectRecipient={handleSelectRecipient}
      />

      <Text style={styles.menuHeaderText}>보낼금액</Text>
      <Pressable
        style={styles.amountInputContainer}
        onPress={handleOpenKeypadModal}>
        <Text style={styles.amountInputText}>
          {amount === '0'
            ? '보낼 금액을 입력해 주세요'
            : `${parseInt(amount).toLocaleString()}원`}
        </Text>
      </Pressable>

      <KeypadModal
        visible={keypadModalVisible}
        onClose={handleCloseKeypadModal}
        onInput={handleAmountChange}
        currentValue={parseInt(amount)}
      />

      <TouchableOpacity
        style={styles.nextButtonContainer}
        onPress={onPressNext}>
        <Text style={styles.nextButtonText}>다음</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingHorizontal: 30,
    backgroundColor: colors.YELLOW_25,
  },
  myAccountInfoContainer: {
    backgroundColor: colors.WHITE,
    height: 73,
    borderRadius: 12,
  },
  myAccountTextContainer: {
    flexDirection: 'row',
    flexGrow: 1,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  recipientAccountInfoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.WHITE,
    height: 55,
    borderRadius: 12,
  },
  amountInputContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.WHITE,
    height: 55,
    borderRadius: 12,
  },
  menuHeaderText: {
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    fontSize: 12,
    paddingTop: 23,
    paddingBottom: 8,
  },
  recipientAccountInfoText: {
    fontFamily: fonts.MEDIUM,
    fontSize: 16,
  },
  amountInputText: {
    fontFamily: fonts.MEDIUM,
    fontSize: 16,
  },
  myAccountTextHeader: {
    fontFamily: fonts.MEDIUM,
    fontSize: 12,
    color: colors.BLACK,
  },
  myAccountTextContext: {
    fontFamily: fonts.MEDIUM,
    marginLeft: 'auto',
    fontSize: 12,
    color: colors.BLACK,
  },
  withdrawableAmountTextHeader: {
    fontFamily: fonts.MEDIUM,
    color: colors.BLUE_100,
    marginLeft: 'auto',
    fontSize: 12,
  },
  withdrawableAmountTextContext: {
    fontFamily: fonts.BOLD,
    color: colors.BLUE_100,
    marginLeft: 10,
    fontSize: 12,
  },
  nextButtonContainer: {
    marginTop: 'auto',
    marginBottom: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.WHITE,
    height: 55,
    borderRadius: 12,
  },
  nextButtonText: {
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    fontSize: 18,
  },
});
