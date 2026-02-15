import { colors } from "@/constants/colors";
import { fonts } from "@/constants/font";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function DepositAlarmScreen() {
  const transactionData = [
    { date: '2024.9.2. 14시 23분 03초', marketName: '싸피문구점', historyType: '사용한 금액', amount: '-25000원', remainingBalance: '1,234,567원' },
    { date: '2024.9.1. 10시 10분 45초', marketName: '싸피커피', historyType: '사용한 금액', amount: '-4500원', remainingBalance: '1,209,567원' },
    { date: '2024.8.30. 09시 05분 12초', marketName: '싸피마트', historyType: '사용한 금액', amount: '-12000원', remainingBalance: '1,197,567원' },
    { date: '2024.8.29. 17시 45분 55초', marketName: '싸피서점', historyType: '사용한 금액', amount: '-32000원', remainingBalance: '1,165,567원' },
    { date: '2024.8.28. 12시 22분 10초', marketName: '싸피식당', historyType: '사용한 금액', amount: '-15000원', remainingBalance: '1,150,567원' },
    { date: '2024.8.27. 16시 33분 44초', marketName: '급여 입금', historyType: '입금', amount: '+200000원', remainingBalance: '1,350,567원' },
    { date: '2024.8.26. 14시 11분 19초', marketName: '싸피옷가게', historyType: '사용한 금액', amount: '-45000원', remainingBalance: '1,305,567원' },
    { date: '2024.8.25. 18시 00분 00초', marketName: '싸피영화관', historyType: '사용한 금액', amount: '-12000원', remainingBalance: '1,293,567원' },
    { date: '2024.8.24. 13시 55분 27초', marketName: '보너스 지급', historyType: '입금', amount: '+100000원', remainingBalance: '1,393,567원' },
    { date: '2024.8.23. 10시 40분 33초', marketName: '싸피슈퍼', historyType: '사용한 금액', amount: '-8000원', remainingBalance: '1,385,567원' },
  ];
  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Text>필터</Text>
      </View>
      <ScrollView style={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
        {transactionData.map((transaction, index) => (
          <View key={index} style={[styles.accountHistoryCard, transaction.amount.startsWith('+') && { backgroundColor: colors.YELLOW_75 }]}>
            <View style={styles.cardTopContainer}>
              <Text>{transaction.date}</Text>
            </View>
            <View style={styles.cardMiddleContainer}>
              <View>
                <Text style={styles.marketName}>{transaction.marketName}</Text>
              </View>
              <View style={styles.cardMiddleRightContainer}>
                <Text style={styles.historyType}>{transaction.historyType}</Text>
                <Text style={[styles.amount, transaction.amount.startsWith('+') && { color: colors.BLUE_100 }]}>{transaction.amount}</Text>
              </View>
            </View>
            <View style={styles.cardBottomContainer}>
              <Text>남은 금액</Text>
              <Text>{transaction.remainingBalance}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container:{
    flex: 1,
  },
  accountHistoryCard: {
    height: 115,
    flexShrink: 0,
    paddingHorizontal: 30,
    backgroundColor: colors.WHITE,
    borderBottomColor: colors.GRAY_75,
    borderBottomWidth: 1,
  },
  filterContainer:{
    height:45,
    paddingLeft:18,
    justifyContent:'center',
    backgroundColor:colors.WHITE,
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
    fontFamily:fonts.BOLD,
    marginTop: 'auto',
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
    fontSize: 18,
  },
  cardBottomContainer: {
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  scrollViewContent: {
    flexGrow:1,
    paddingBottom: 20,
  },
});