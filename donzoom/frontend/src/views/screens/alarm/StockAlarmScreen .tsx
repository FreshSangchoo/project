import { colors } from "@/constants/colors";
import { fonts } from "@/constants/font";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Feather from 'react-native-vector-icons/Feather'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

export default function StockAlarmScreen() {
  const transactionData = [
    {
      date: '2024-09-02T14:23:03',
      cardType: '모의 투자',
      content: '금값이 1%이상 올랐어요!',
      price: '278,069원',
      isPositive: true,  // 긍정적인 알림
    },
    {
      date: '2024-09-01T10:10:45',
      cardType: '퀴즈 미션',
      content: '투자금 500포인트가 들어왔어요!',
      remainingPoint: '170,500P',
      isPositive: true,  // 긍정적인 알림
    },
    {
      date: '2024-08-30T09:05:12',
      cardType: '모의 투자',
      content: '투자금이 50,000원 감소했어요!',
      price: '-50,000원',
      isPositive: false,  // 부정적인 알림
    },
    {
      date: '2024-08-29T17:45:55',
      cardType: '퀴즈 미션',
      content: '퀴즈를 틀려서 포인트가 차감되었어요!',
      remainingPoint: '-10,000P',
      isPositive: false,  // 부정적인 알림
    },
  ];

  // 날짜를 현재 시간과 비교해 상대적인 시간을 계산하는 함수
  const getRelativeTime = (dateString: string) => {
    // '2024.9.2. 14시 23분 03초' 형식을 ISO 형식으로 변환
    const transactionDate = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - transactionDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}초 전`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}분 전`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}시간 전`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}일 전`;
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Text>필터</Text>
      </View>
      <ScrollView style={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
        {transactionData.map((transaction, index) => (
          <View
            key={index}
            style={[
              styles.alarmCard,
              { backgroundColor: transaction.isPositive ? colors.YELLOW_75 : colors.WHITE }
            ]}
          >
            <View style={styles.cardHeaderContainer}>
              <Text style={styles.cardTypeText}>{transaction.cardType}</Text>
              <Text style={styles.cardTimeLineText}>{getRelativeTime(transaction.date)}</Text>
            </View>
            <View style={styles.cardBottomContainer}>
              {/* 아이콘을 동적으로 선택 */}
              {transaction.cardType === '모의 투자' ? (
                <Feather
                  style={styles.leftIcon}
                  name={transaction.isPositive ? 'trending-up' : 'trending-down'}
                  size={30}
                />
              ) : (
                <FontAwesome5
                  style={styles.leftIcon}
                  name="coins"
                  size={30}
                />
              )}
              <View style={styles.contentContainer}>
                <Text style={styles.contentText}>{transaction.content}</Text>
                {transaction.price && <Text style={styles.contentText}>({transaction.price})</Text>}
                {transaction.remainingPoint && <Text style={styles.contentText}>({transaction.remainingPoint})</Text>}
              </View>
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
  alarmCard: {
    height: 91,
    flexShrink: 0,
    paddingTop: 14,
    paddingHorizontal: 17,
    backgroundColor: colors.WHITE,
    borderBottomColor: colors.GRAY_50,
    borderBottomWidth: 1,
  },
  filterContainer:{
    height:45,
    paddingLeft:18,
    justifyContent:'center',
    backgroundColor:colors.WHITE,
  },
  cardHeaderContainer: {
    marginBottom: 8,
    flexDirection: 'row',
    height: 18,
  },
  cardBottomContainer: {
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  contentContainer: {
    flexGrow: 1,
    height: 40,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  cardTypeText: {
    fontFamily: fonts.BOLD,
    fontSize: 16,
  },
  cardTimeLineText: {
    fontFamily: fonts.MEDIUM,
    fontSize: 10,
    marginLeft: 'auto',
  },
  leftIcon: {
    marginRight: 14,
  },
  contentText: {
    fontFamily: fonts.LIGHT,
    fontSize: 16,
  }
});