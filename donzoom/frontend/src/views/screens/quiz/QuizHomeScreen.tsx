import { colors } from '@/constants/colors';
import { fonts } from '@/constants/font';
import { useCallback, useEffect, useState } from 'react';
import { useQuizStore } from '@/stores/useQuizStore';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import CheckCalendar from '@/assets/CheckCalendar.svg';
import useQuiz from '@/hooks/queries/useQuiz';

interface MarkedDates {
  [key: string]: {
    marked: boolean;
  };
}

function QuizHomeScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const [quizData, setQuizData] = useState<any[]>([]);
  const [quizCompletedDates, setQuizCompletedDates] = useState<MarkedDates>({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const setTodaysQuizQuestions = useQuizStore(
    state => state.setTodaysQuizQuestions,
  );
  const { setReviewQuizQuestions, reviewQuizQuestions } = useQuizStore();
  const { todayQuizMutation, solvedQuizMutation } = useQuiz();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const transformQuizData = (quizes: any[]) => {
    return quizes.map(quiz => ({
      quizId: quiz.id,
      question: quiz.question,
      answers: [quiz.option1, quiz.option2, quiz.option3, quiz.option4],
      correctAnswer: quiz.answer,
      explanations: quiz.explanations.split('\n'),
      answerExplanation: quiz.answerExplanation,
    }));
  };

  useEffect(() => {
    if (solvedQuizMutation.data) {
      startReviewQuiz();
      const solvedQuizDates = solvedQuizMutation.data;
      console.log('solvedQD: ', solvedQuizDates);

      const markedDates = solvedQuizDates.reduce(
        (acc: MarkedDates, quiz: { createdAt: string }) => {
          const quizDate = formatDate(quiz.createdAt);
          acc[quizDate] = { marked: true };
          return acc;
        },
        {} as MarkedDates,
      );
      console.log('markedDates: ', markedDates);
      setQuizCompletedDates(markedDates);
    }
  }, [solvedQuizMutation.data]);

  // 오늘의 퀴즈 시작하기
  const startTodayQuiz = async () => {
    const { data: quizes } = await todayQuizMutation.refetch();
    // console.log('quizes: ', quizes);
    if (quizes && quizes.length > 0) {
      const transformedQuizes = transformQuizData(quizes);
      setQuizData(transformedQuizes);
      setTodaysQuizQuestions(transformedQuizes, quizes[0].quiz_id);
      navigation.navigate('오늘의 퀴즈');
    } else {
      setIsModalVisible(true);
    }
  };

  // 다시풀기
  const startReviewQuiz = () => {
    const solvedQuizes = solvedQuizMutation.data;

    if (solvedQuizes && solvedQuizes.length > 0) {
      let selectedQuizes = [];

      if (solvedQuizes.length > 9) {
        selectedQuizes = solvedQuizes
          .sort(() => 0.5 - Math.random())
          .slice(0, 9);
      } else {
        selectedQuizes = solvedQuizes;
      }
      const transformedQuizes = transformQuizData(selectedQuizes);
      // console.log('quizGroups: ', quizGroups);
      setReviewQuizQuestions(transformedQuizes);
    }
  };

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // 주어진 날짜에서 요일을 계산하는 함수
  const getWeekday = (dateString: string): number => {
    const date = new Date(dateString);
    return date.getDay(); // 0: 일요일, 1: 월요일, ... 6: 토요일
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl onRefresh={onRefresh} refreshing={refreshing} />
      }>
      <View>
        <View style={styles.calendarContainer}>
          <View style={styles.calendarTextContainer}>
            <Text style={styles.calendarTitle}>퀴즈 달력</Text>
            {/* <Text style={styles.calendarDescription}>
              3일 연속 퀴즈를 풀었어요!
            </Text> */}
          </View>
          <View style={styles.calendar}>
            <Calendar
              current={today}
              dayComponent={({date}: {date: DateData}) => {
                const dateKey = `${date.year}-${String(date.month).padStart(
                  2,
                  '0',
                )}-${String(date.day).padStart(2, '0')}`;
                const isMarked = !!quizCompletedDates[dateKey];
                const isToday = dateKey === today;
                const weekday = getWeekday(dateKey);
                const textColor =
                  weekday === 0
                    ? styles.sundayText
                    : weekday === 6
                    ? styles.saturdayText
                    : styles.defaultText;

                return (
                  <TouchableOpacity style={styles.dayContainer}>
                    <Text
                      style={[
                        styles.dayText,
                        textColor,
                        isToday && styles.todayText,
                      ]}>
                      {date.day}
                    </Text>
                    {isMarked && (
                      <CheckCalendar
                        width={30}
                        height={30}
                        style={styles.checkCalendar}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              monthFormat={'yyyy년 MM월'}
              theme={{
                arrowColor: colors.BLACK,
                textDayFontFamily: fonts.MEDIUM,
                textMonthFontFamily: fonts.BOLD,
                textDayHeaderFontFamily: fonts.MEDIUM,
              }}
            />
          </View>
        </View>
        <View style={styles.todayContainer}>
          <View style={styles.todayTextContainer}>
            <Text style={styles.todayTitle}>오늘의 퀴즈</Text>
            <Text style={styles.todayDescription}>
              오늘의 퀴즈를 풀고 모의투자 시드머니를 얻어보세요!
            </Text>
          </View>
          <View style={styles.todayContentBox}>
            <View style={styles.todayContentText}>
              <Text style={styles.todayContentTitle}>
                새로운 퀴즈가 도착했어요!
              </Text>
              <Text style={styles.todayContentDescription}>3문제</Text>
            </View>
            <TouchableOpacity
              style={styles.todayContentButton}
              onPress={startTodayQuiz}>
              <Text style={styles.todayContentButtonText}>시작하기</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                오늘의 퀴즈를 다 풀었습니다!
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}>
                <Text style={styles.closeButtonText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <View style={styles.reviewContainer}>
          <View style={styles.reviewTextContainer}>
            <Text style={styles.reviewTitle}>퀴즈 다시풀기</Text>
            <Text style={styles.reviewDescription}>
              퀴즈를 다시 풀고 나의 경제 지식을 점검해보세요!
            </Text>
          </View>

          <View style={styles.reviewContentContainer}>
            {reviewQuizQuestions.length > 0 &&
              reviewQuizQuestions
                .reduce((groups: any[][], question, index) => {
                  // Group questions into sets of 3
                  if (index % 3 === 0) {
                    groups.push(reviewQuizQuestions.slice(index, index + 3));
                  }
                  return groups;
                }, [])
                .map((group, groupIndex) => {
                  if (groupIndex < 3) {
                    return (
                      <View key={groupIndex} style={styles.reviewContentsBox}>
                        <View style={styles.reviewContentText}>
                          <Text style={styles.reviewContentTitle}>
                            다시풀기 {groupIndex + 1}
                          </Text>
                          <Text style={styles.reviewContentDescription}>
                            {group.length}문제
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.reviewContentButton}
                          onPress={() => {
                            navigation.navigate('퀴즈 리뷰', {
                              groupIndex: groupIndex,
                            });
                          }}>
                          <Text style={styles.reviewContentButtonText}>
                            다시풀기
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }
                })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    // paddingBottom: 45,
    backgroundColor: colors.WHITE,
  },
  todayContainer: {
    marginTop: 10,
    marginBottom: 5,
  },
  todayTextContainer: {
    marginBottom: 20,
  },
  todayTitle: {
    fontSize: 20,
    color: colors.BLACK,
    fontFamily: fonts.BOLD,
    marginBottom: 6,
  },
  todayDescription: {
    fontFamily: fonts.MEDIUM,
    color: colors.GRAY_75,
  },
  todayContentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: colors.WHITE,
    height: 80,
    justifyContent: 'space-between',
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },
  todayContentText: {},
  todayContentTitle: {
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    fontSize: 15,
    marginBottom: 5,
  },
  todayContentDescription: {
    fontFamily: fonts.MEDIUM,
    color: colors.GRAY_50,
  },
  todayContentButton: {
    width: 92,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.YELLOW_100,
  },
  todayContentButtonText: {
    color: colors.WHITE,
    fontFamily: fonts.MEDIUM,
    fontSize: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.WHITE,
    padding: 20,
    borderRadius: 10,
    width: '80%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    color: colors.BLACK,
    fontSize: 18,
    fontFamily: fonts.MEDIUM,
    marginTop: 20,
    marginBottom: 30,
  },
  closeButton: {
    backgroundColor: colors.YELLOW_100,
    padding: 10,
    borderRadius: 8,
    width: '30%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 16,
  },
  reviewContainer: {
    marginTop: 10,
    marginBottom: 5,
  },
  reviewTextContainer: {
    marginBottom: 20,
  },
  reviewTitle: {
    fontSize: 20,
    color: colors.BLACK,
    fontFamily: fonts.BOLD,
    marginBottom: 6,
  },
  reviewDescription: {
    fontFamily: fonts.MEDIUM,
    color: colors.GRAY_75,
  },
  reviewContentContainer: {},
  reviewContentText: {},
  reviewContentsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: colors.WHITE,
    height: 80,
    justifyContent: 'space-between',
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },
  reviewContentTitle: {
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    fontSize: 15,
    marginBottom: 5,
  },
  reviewContentDescription: {
    fontFamily: fonts.MEDIUM,
    color: colors.GRAY_50,
  },
  reviewContentButton: {
    width: 92,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.YELLOW_100,
  },
  reviewContentButtonText: {
    color: colors.WHITE,
    fontFamily: fonts.MEDIUM,
    fontSize: 15,
  },
  calendarContainer: {},
  calendarTextContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  calendarTitle: {
    fontSize: 20,
    color: colors.BLACK,
    fontFamily: fonts.BOLD,
    marginRight: 10,
  },
  calendarDescription: {
    fontFamily: fonts.MEDIUM,
    color: colors.GRAY_75,
  },
  calendar: {
    borderRadius: 12,
    borderColor: colors.GRAY_75,
    borderWidth: 0.3,
    marginBottom: 20,
    padding: 10,
  },
  dayContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 20,
  },
  dayText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
  },
  todayText: {
    color: colors.YELLOW_100,
  },
  saturdayText: {
    color: colors.BLUE_100,
  },
  sundayText: {
    color: colors.RED_100,
  },
  defaultText: {
    color: colors.BLACK,
  },
  headerText: {
    fontSize: 20,
    color: colors.BLACK,
    fontFamily: fonts.BOLD,
    textAlign: 'center',
  },
  checkCalendar: {
    position: 'absolute',
    top: -6,
    left: -8,
  },
});

export default QuizHomeScreen;
