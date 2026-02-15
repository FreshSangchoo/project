import {RequestTransfer, getAccount} from '@/api/account';
import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import useAccount from '@/hooks/queries/useAccount';
import useAccountBalance from '@/hooks/useAccountInfo';
import {useSignupStore} from '@/stores/useAuthStore';
import useTransferStore from '@/stores/useTransferStore';
import {Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

export default function TransferScreen3({navigation}: any) {
  const {
    account,
    balance,
    name: accountName,
    error,
    refetch,
  } = useAccountBalance();
  const {accountNo, amount, name: holderName, setName} = useTransferStore();
  const {transferMutation, useGetAccountHolder} = useAccount();
  const {name} = useSignupStore();
  const transfer: RequestTransfer = {
    depositAccountNo: accountNo,
    depositTransactionSummary: holderName,
    transactionBalance: amount,
    withdrawalAccountNo: account,
    withdrawalTransactionSummary: name,
  };

  const onPressNext = () => {
    // navigation.navigate('송금4');
    transferMutation.mutate(transfer, {
      onSuccess: () => {
        console.log('success');
        refetch();
        Alert.alert('이체 되었습니다.');
        navigation.navigate('홈화면');
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.transferInfoContainer}>
        <View style={styles.transferInfoHeaderContainer}>
          <View style={styles.headerTopContainer}>
            <Text style={styles.headerTopLeftText}>{holderName}</Text>
            <Text style={styles.headerTopRightText}>님에게</Text>
          </View>
          <View style={styles.headerBottomContainer}>
            <Text style={styles.headerBottomLeftText}>
              {parseInt(amount).toLocaleString()}원
            </Text>
            <Text style={styles.headerBottomRightText}>을 이체합니다</Text>
          </View>
        </View>
        <View style={styles.recipientInfoOptionContainer}>
          <Text style={styles.innerLeftText}>출금계좌</Text>
          <Text style={styles.innerRightText}>{accountNo}</Text>
        </View>
        <View style={styles.recipientInfoOptionContainer}>
          <Text style={styles.innerLeftText}>받는분</Text>
          <Text style={styles.innerRightText}>{holderName}</Text>
        </View>
        <View style={styles.recipientInfoOptionContainer}>
          <Text style={styles.innerLeftText}>보낼금액</Text>
          <Text style={styles.innerRightText}>10,000원</Text>
        </View>
        <View style={styles.recipientInfoOptionContainer}>
          <Text style={styles.innerLeftText}>받는 통장 표기</Text>
          <Text style={styles.innerRightText}>{name}</Text>
        </View>
        <View style={styles.recipientInfoOptionContainer}>
          <Text style={styles.innerLeftText}>내 통장 표기</Text>
          <Text style={styles.innerRightText}>{holderName}</Text>
        </View>
        <View style={styles.recipientInfoOptionContainer}>
          <Text style={styles.innerLeftText}>이체일</Text>
          <Text style={styles.innerRightText}>
            {new Date().toLocaleString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
              timeZone: 'Asia/Seoul',
            })}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.nextButtonContainer}
        onPress={onPressNext}>
        <Text style={styles.nextButtonText}>이체하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // 화면 전체를 차지하도록 설정
    justifyContent: 'flex-start', // 내용이 화면 상단에 위치하도록 설정
    alignItems: 'stretch', // 자식 컴포넌트가 화면의 가로를 채우도록 설정
    paddingHorizontal: 30,
    backgroundColor: colors.YELLOW_25,
  },
  transferInfoContainer: {
    backgroundColor: colors.WHITE,
    height: 368,
    borderRadius: 12,
    marginTop: 20,
    marginHorizontal: 19,
  },
  transferInfoHeaderContainer: {
    paddingHorizontal: 24,
    height: 84,
    paddingTop: 20,
  },
  headerTopContainer: {
    flexGrow: 1,
    flexDirection: 'row',
  },
  headerBottomContainer: {
    flexGrow: 1,
    flexDirection: 'row',
    paddingBottom: 19,
    borderBottomColor: colors.GRAY_100,
    borderBottomWidth: 1,
  },
  headerTopLeftText: {
    fontFamily: fonts.MEDIUM,
    color: colors.BLUE_100,
    fontSize: 18,
    marginTop: 'auto',
  },
  headerTopRightText: {
    fontFamily: fonts.MEDIUM,
    fontSize: 16,
    marginTop: 'auto',
  },
  headerBottomLeftText: {
    fontFamily: fonts.BOLD,
    fontSize: 18,
    marginTop: 'auto',
  },
  headerBottomRightText: {
    fontFamily: fonts.MEDIUM,
    fontSize: 16,
    marginTop: 'auto',
  },
  recipientInfoOptionContainer: {
    marginHorizontal: 24,
    flexDirection: 'row',
    flexGrow: 1,
    alignItems: 'center',
    borderTopColor: colors.GRAY_25,
    borderTopWidth: 1,
  },
  nextButtonContainer: {
    marginTop: 'auto',
    marginBottom: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.WHITE,
    height: 55,
    borderRadius: 10,
  },
  nextButtonText: {
    fontFamily: fonts.BOLD,
    fontSize: 18,
  },
  innerLeftText: {
    fontFamily: fonts.MEDIUM,
    fontSize: 12,
  },
  innerRightText: {
    fontFamily: fonts.MEDIUM,
    fontSize: 12,
    marginLeft: 'auto',
  },
});
