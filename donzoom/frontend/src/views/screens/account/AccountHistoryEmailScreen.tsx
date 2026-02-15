import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import useAccount from '@/hooks/queries/useAccount';
import {useChildrenStore} from '@/stores/useChildrenStore';
import {Pressable, ScrollView} from 'react-native';
import {StyleSheet, Text, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';

function AccountHistoryEmailScreen({navigation}: any) {
  const {selectedChild} = useChildrenStore();
  const {useGetAccountHistoryEmail} = useAccount();
  const {data} = useGetAccountHistoryEmail(
    selectedChild!.accountNumber,
    '20241001',
    '20241020',
    'A',
    'DESC',
    selectedChild!.email,
  );

  const transactionList = data?.rec.list;

  interface RawTransaction {
    transactionUniqueNo: string;
    transactionDate: string;
    transactionTime: string;
    transactionType: string;
    transactionTypeName: string;
    transactionAccountNo: string;
    transactionBalance: string;
    transactionAfterBalance: string;
    transactionSummary: string;
    transactionMemo: string;
  }

  interface TransformedTransaction {
    date: string;
    marketName: string;
    historyType: string;
    amount: string;
    remainingBalance: string;
  }

  const transformTransactionData = (
    rawData: RawTransaction[] | undefined,
  ): TransformedTransaction[] => {
    console.log(rawData);
    if (!rawData) return [];

    return rawData.map((transaction: RawTransaction) => {
      const date = new Date(
        parseInt(transaction.transactionDate.slice(0, 4)),
        parseInt(transaction.transactionDate.slice(4, 6)) - 1,
        parseInt(transaction.transactionDate.slice(6, 8)),
        parseInt(transaction.transactionTime.slice(0, 2)),
        parseInt(transaction.transactionTime.slice(2, 4)),
        parseInt(transaction.transactionTime.slice(4, 6)),
      );

      const formattedDate = `${date.getFullYear()}.${
        date.getMonth() + 1
      }.${date.getDate()}. ${date.getHours()}시 ${date.getMinutes()}분 ${date.getSeconds()}초`;

      const historyType =
        transaction.transactionType === '1' ? '입금된 금액' : '사용한 금액';
      const amount =
        transaction.transactionType === '1'
          ? `+${parseInt(transaction.transactionBalance).toLocaleString()}원`
          : `-${parseInt(transaction.transactionBalance).toLocaleString()}원`;

      return {
        date: formattedDate,
        marketName: transaction.transactionSummary,
        historyType: historyType,
        amount: amount,
        remainingBalance: `${parseInt(
          transaction.transactionAfterBalance,
        ).toLocaleString()}원`,
      };
    });
  };

  const transactionData = transformTransactionData(transactionList);

  return (
    <View style={styles.container}>
      <View style={styles.accountInfoContainer}>
        <View style={styles.parentAccountInfoContainer}>
          <View style={styles.parentInfoTop}>
            <Text style={styles.parentInfoTopBankInfo}>아이 계좌 번호</Text>
            <View style={{flexDirection: 'row', gap: 5}}>
              <Text style={styles.parentInfoTopBankInfo}>싸피은행</Text>
              <Text style={styles.parentInfoTopBankInfo}>
                {selectedChild?.accountNumber}
              </Text>
            </View>
          </View>
          <View style={styles.parentInfoMiddle}>
            <Text style={styles.parentBalanceHeader}>남은 금액</Text>
            <Text style={styles.parentBalanceText}>
              {String(selectedChild?.balance).toLocaleString()}원
            </Text>
          </View>
          <Pressable
            style={styles.parentInfoBottom}
            onPress={() =>
              navigation.navigate('송금', {
                accountNo: selectedChild?.accountNumber,
              })
            }>
            <Text style={styles.textMid}>용돈 보내기</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.accountHistoryContainer}>
        <View style={styles.accountHistoryHeader}>
          <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <Path
              d="M17.7973 16.8188L13.469 12.4914C14.7236 10.9852 15.3491 9.05344 15.2156 7.09784C15.0821 5.14224 14.1998 3.31339 12.7522 1.99175C11.3046 0.670112 9.40324 -0.0425679 7.44359 0.00196836C5.48394 0.0465046 3.6169 0.844828 2.23087 2.23087C0.844828 3.6169 0.0465046 5.48394 0.00196836 7.44359C-0.0425679 9.40324 0.670112 11.3046 1.99175 12.7522C3.31339 14.1998 5.14224 15.0821 7.09784 15.2156C9.05344 15.3491 10.9852 14.7236 12.4914 13.469L16.8188 17.7973C16.883 17.8616 16.9593 17.9126 17.0433 17.9473C17.1272 17.9821 17.2172 18 17.3081 18C17.3989 18 17.4889 17.9821 17.5729 17.9473C17.6568 17.9126 17.7331 17.8616 17.7973 17.7973C17.8616 17.7331 17.9126 17.6568 17.9473 17.5729C17.9821 17.4889 18 17.3989 18 17.3081C18 17.2172 17.9821 17.1272 17.9473 17.0433C17.9126 16.9593 17.8616 16.883 17.7973 16.8188ZM1.40222 7.62624C1.40222 6.39525 1.76726 5.1919 2.45116 4.16836C3.13506 3.14483 4.10712 2.34708 5.24441 1.876C6.38171 1.40492 7.63315 1.28166 8.84049 1.52182C10.0478 1.76197 11.1568 2.35475 12.0273 3.2252C12.8977 4.09564 13.4905 5.20466 13.7307 6.412C13.9708 7.61934 13.8476 8.87078 13.3765 10.0081C12.9054 11.1454 12.1077 12.1174 11.0841 12.8013C10.0606 13.4852 8.85724 13.8503 7.62624 13.8503C5.97609 13.8484 4.39405 13.1921 3.22722 12.0253C2.06038 10.8584 1.40405 9.2764 1.40222 7.62624Z"
              fill="black"
            />
          </Svg>
          <View style={styles.calendarContainer}>
            <Svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <Path
                d="M7.80463 12.9131C7.86656 12.9722 7.91569 13.0424 7.94921 13.1197C7.98273 13.1969 7.99998 13.2797 7.99998 13.3633C7.99998 13.4469 7.98273 13.5297 7.94921 13.607C7.91569 13.6842 7.86656 13.7544 7.80463 13.8135C7.7427 13.8726 7.66917 13.9195 7.58825 13.9515C7.50733 13.9835 7.42061 14 7.33302 14C7.24543 14 7.1587 13.9835 7.07778 13.9515C6.99686 13.9195 6.92334 13.8726 6.86141 13.8135L0.195501 7.4502C0.133523 7.39111 0.0843567 7.32093 0.0508111 7.24368C0.0172654 7.16643 -1.23854e-06 7.08362 -1.22392e-06 7C-1.2093e-06 6.91638 0.0172654 6.83357 0.0508111 6.75632C0.0843569 6.67907 0.133524 6.60889 0.195501 6.54979L6.86141 0.186482C6.98649 0.0670803 7.15613 1.24789e-06 7.33302 1.28215e-06C7.50991 1.3164e-06 7.67955 0.0670804 7.80463 0.186482C7.92971 0.305884 7.99998 0.467827 7.99998 0.636687C7.99998 0.805546 7.92971 0.967489 7.80463 1.08689L1.60951 7L7.80463 12.9131Z"
                fill="black"
              />
            </Svg>
            <Text style={styles.textMid}>2024년 10월</Text>
            <Svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <Path
                d="M0.195365 1.08689C0.133432 1.02777 0.0843046 0.957581 0.0507868 0.880336C0.0172689 0.803089 1.6482e-05 0.720297 1.64747e-05 0.636686C1.64674e-05 0.553076 0.0172689 0.470283 0.0507867 0.393037C0.0843046 0.315791 0.133432 0.245603 0.195365 0.186481C0.257298 0.127359 0.330824 0.0804622 0.411743 0.0484654C0.492662 0.0164697 0.579391 6.4873e-07 0.666978 6.41073e-07C0.754564 6.33416e-07 0.841294 0.0164696 0.922213 0.0484654C1.00313 0.0804621 1.07666 0.127359 1.13859 0.186481L7.8045 6.5498C7.86647 6.60889 7.91564 6.67907 7.94919 6.75632C7.98273 6.83357 8 6.91638 8 7C8 7.08362 7.98273 7.16643 7.94919 7.24368C7.91564 7.32093 7.86647 7.39111 7.8045 7.45021L1.13859 13.8135C1.01351 13.9329 0.843868 14 0.666979 14C0.49009 14 0.320446 13.9329 0.195366 13.8135C0.0702867 13.6941 1.76021e-05 13.5322 1.75873e-05 13.3633C1.75726e-05 13.1945 0.0702867 13.0325 0.195366 12.9131L6.39049 7L0.195365 1.08689Z"
                fill="black"
              />
            </Svg>
          </View>
          <Svg width="18" height="16" viewBox="0 0 18 16" fill="none">
            <Path
              d="M0.75 3.75588H3.84375C4.00898 4.40119 4.38428 4.97316 4.91048 5.38161C5.43669 5.79006 6.08387 6.01176 6.75 6.01176C7.41613 6.01176 8.06331 5.79006 8.58952 5.38161C9.11572 4.97316 9.49102 4.40119 9.65625 3.75588H17.25C17.4489 3.75588 17.6397 3.67686 17.7803 3.53621C17.921 3.39556 18 3.20479 18 3.00588C18 2.80697 17.921 2.6162 17.7803 2.47555C17.6397 2.3349 17.4489 2.25588 17.25 2.25588H9.65625C9.49102 1.61057 9.11572 1.0386 8.58952 0.630153C8.06331 0.221702 7.41613 0 6.75 0C6.08387 0 5.43669 0.221702 4.91048 0.630153C4.38428 1.0386 4.00898 1.61057 3.84375 2.25588H0.75C0.551088 2.25588 0.360322 2.3349 0.21967 2.47555C0.0790178 2.6162 0 2.80697 0 3.00588C0 3.20479 0.0790178 3.39556 0.21967 3.53621C0.360322 3.67686 0.551088 3.75588 0.75 3.75588ZM6.75 1.50588C7.04667 1.50588 7.33668 1.59386 7.58335 1.75868C7.83003 1.9235 8.02229 2.15777 8.13582 2.43186C8.24935 2.70595 8.27906 3.00755 8.22118 3.29852C8.1633 3.58949 8.02044 3.85676 7.81066 4.06654C7.60088 4.27632 7.33361 4.41918 7.04264 4.47706C6.75166 4.53494 6.45006 4.50523 6.17597 4.3917C5.90189 4.27817 5.66762 4.08591 5.5028 3.83924C5.33797 3.59256 5.25 3.30255 5.25 3.00588C5.25 2.60806 5.40804 2.22653 5.68934 1.94522C5.97064 1.66392 6.35218 1.50588 6.75 1.50588ZM17.25 11.2559H15.6562C15.491 10.6106 15.1157 10.0386 14.5895 9.63015C14.0633 9.2217 13.4161 9 12.75 9C12.0839 9 11.4367 9.2217 10.9105 9.63015C10.3843 10.0386 10.009 10.6106 9.84375 11.2559H0.75C0.551088 11.2559 0.360322 11.3349 0.21967 11.4756C0.0790178 11.6162 0 11.807 0 12.0059C0 12.2048 0.0790178 12.3956 0.21967 12.5362C0.360322 12.6769 0.551088 12.7559 0.75 12.7559H9.84375C10.009 13.4012 10.3843 13.9732 10.9105 14.3816C11.4367 14.7901 12.0839 15.0118 12.75 15.0118C13.4161 15.0118 14.0633 14.7901 14.5895 14.3816C15.1157 13.9732 15.491 13.4012 15.6562 12.7559H17.25C17.4489 12.7559 17.6397 12.6769 17.7803 12.5362C17.921 12.3956 18 12.2048 18 12.0059C18 11.807 17.921 11.6162 17.7803 11.4756C17.6397 11.3349 17.4489 11.2559 17.25 11.2559ZM12.75 13.5059C12.4533 13.5059 12.1633 13.4179 11.9166 13.2531C11.67 13.0883 11.4777 12.854 11.3642 12.5799C11.2506 12.3058 11.2209 12.0042 11.2788 11.7132C11.3367 11.4223 11.4796 11.155 11.6893 10.9452C11.8991 10.7354 12.1664 10.5926 12.4574 10.5347C12.7483 10.4768 13.0499 10.5065 13.324 10.6201C13.5981 10.7336 13.8324 10.9259 13.9972 11.1725C14.162 11.4192 14.25 11.7092 14.25 12.0059C14.25 12.4037 14.092 12.7852 13.8107 13.0665C13.5294 13.3478 13.1478 13.5059 12.75 13.5059Z"
              fill="black"
            />
          </Svg>
        </View>
        <ScrollView
          style={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}>
          {transactionData.length === 0 ? (
            <View style={styles.noTransactionContainer}>
              <Text style={styles.noTransactionText}>
                거래 내역이 없습니다.
              </Text>
            </View>
          ) : (
            transactionData.map((transaction, index) => (
              <View key={index} style={styles.accountHistoryCard}>
                <View style={styles.cardTopContainer}>
                  <Text style={styles.amountText}>{transaction.date}</Text>
                </View>
                <View style={styles.cardMiddleContainer}>
                  <View>
                    <Text style={styles.marketName}>
                      {transaction.marketName}
                    </Text>
                  </View>
                  <View style={styles.cardMiddleRightContainer}>
                    <Text
                      style={[
                        styles.amount,
                        transaction.historyType === '입금된 금액' &&
                          styles.plusAmount,
                      ]}>
                      {transaction.amount}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardBottomContainer}>
                  <Text style={styles.amountText}>잔액 </Text>
                  <Text style={styles.amountText}>
                    {transaction.remainingBalance}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 0,
    margin: 0,
    flexGrow: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  text: {
    fontFamily: fonts.LIGHT,
    color: colors.BLACK,
  },
  textMid: {
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    fontSize: 18,
  },
  amountText: {
    fontFamily: fonts.MEDIUM,
    color: colors.GRAY_100,
    fontSize: 12,
    paddingTop: 10,
  },
  plusAmount: {
    color: colors.BLUE_100,
  },
  bb: {
    color: colors.RED_100,
  },
  accountInfoContainer: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.YELLOW_100,
  },
  parentAccountInfoContainer: {
    width: 350,
    height: 166,
    backgroundColor: colors.WHITE,
    borderRadius: 10,
  },
  parentInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    flexGrow: 1,
    justifyContent: 'space-around',
  },
  parentInfoTopBankInfo: {
    fontFamily: fonts.MEDIUM,
    fontSize: 12,
    color: colors.BLACK,
  },
  parentInfoMiddle: {
    flexDirection: 'row',
    width: '100%',
    flexGrow: 1,
    paddingHorizontal: 15,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderBottomColor: colors.BLACK,
    borderBottomWidth: 1,
  },
  parentBalanceHeader: {
    marginTop: 'auto',
    marginBottom: 16,
    fontFamily: fonts.MEDIUM,
    fontSize: 16,
    color: colors.BLACK,
  },
  parentBalanceText: {
    marginTop: 'auto',
    marginBottom: 16,
    marginLeft: 10,
    fontFamily: fonts.MEDIUM,
    fontSize: 25,
    color: colors.BLACK,
  },
  parentInfoBottom: {
    flexDirection: 'row',
    width: '100%',
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTop: {
    width: '100%',
    flexGrow: 1,
    backgroundColor: colors.YELLOW_100,
    marginLeft: 60,
  },
  infoTopTop: {
    width: '100%',
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: colors.YELLOW_100,
  },
  accountNumberHeaderContainer: {
    width: 74,
    height: 22,
    // backgroundColor: colors.YELLOW_50,
    borderRadius: 6,
    marginTop: 'auto',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.YELLOW_50,
  },
  infoTopBottom: {
    width: '100%',
    flexGrow: 1,
    justifyContent: 'center',
  },
  accountNumberContentsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.YELLOW_100,
    marginLeft: 10,
  },
  accountNumber: {
    fontFamily: 'GmarketSansTTFBold',
    marginLeft: 8,
  },
  infoBottom: {
    width: '100%',
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  balanceContainer: {
    marginLeft: 5,
    flexDirection: 'row',
  },
  balanceHeaderContainer: {
    justifyContent: 'flex-end',
  },
  balanceTextContainer: {
    justifyContent: 'flex-end',
  },
  balanceHeader: {
    fontFamily: fonts.MEDIUM,
    fontSize: 16,
    color: colors.BLACK,
  },
  balanceText: {
    fontFamily: fonts.MEDIUM,
    fontSize: 25,
    color: colors.BLACK,
    marginLeft: 30,
    marginRight: 30,
  },
  accountHistoryContainer: {
    flex: 1,
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 20,
    backgroundColor: colors.WHITE,
  },
  accountHistoryHeader: {
    flexDirection: 'row',
    height: 58,
    backgroundColor: colors.WHITE,
    paddingHorizontal: 9,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: colors.BLACK,
    borderBottomWidth: 1,
  },
  accountHistoryCard: {
    height: 130,
    flexShrink: 0,
    paddingHorizontal: 9,
    backgroundColor: colors.WHITE,
    borderBottomColor: colors.GRAY_100,
    borderBottomWidth: 1,
  },
  cardTopContainer: {
    marginTop: 14,
  },
  cardMiddleContainer: {
    height: 40,
    marginTop: 10,
    flexDirection: 'row',
  },
  marketName: {
    marginTop: 'auto',
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    fontSize: 18,
  },
  cardMiddleRightContainer: {
    marginLeft: 'auto',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  historyType: {
    marginTop: 'auto',
    fontSize: 12,
  },
  amount: {
    marginLeft: 4,
    marginTop: 'auto',
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    fontSize: 18,
  },
  cardBottomContainer: {
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },

  scrollViewContent: {
    paddingBottom: 20,
  },

  bottomConatiner: {
    height: 78,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonContainer: {
    width: 102,
    height: 29,
    backgroundColor: colors.YELLOW_100,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  balance: {
    fontFamily: fonts.LIGHT,
    color: colors.BLACK,
  },
  calendarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  noTransactionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  noTransactionText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 20,
  },
});

export default AccountHistoryEmailScreen;
