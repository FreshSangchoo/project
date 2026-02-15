import {useQuizStore} from '@/stores/useQuizStore';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import {useRoute} from '@react-navigation/native';

function QuizReviewExplanationScreen({navigation}: any) {
  const {params} = useRoute();
  const {groupIndex}: any = params;
  const {reviewQuizQuestions, currentQuestionIndex, setCurrentQuestionIndex} = useQuizStore();
  const currentQuestion =
    reviewQuizQuestions[groupIndex*3+currentQuestionIndex];
  console.log("CQ",currentQuestion);
  const handleNextQuestion = () => {
    if (currentQuestionIndex < reviewQuizQuestions.length-groupIndex*3- 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      navigation.navigate('퀴즈 리뷰', {groupIndex: groupIndex}); // 다음 문제로 이동
    } else {
      setCurrentQuestionIndex(0);
      navigation.navigate('퀴즈'); // 마지막 문제이면 홈으로
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
        {currentQuestion.answers.map((answer, index) => (
          <View key={index}>
            <Text style={styles.answerText}>
              {index + 1}. {answer}
            </Text>
            <Text style={styles.explanationText}>
              {currentQuestion.explanations[index]}
            </Text>
          </View>
        ))}
        <View style={styles.conclusionContainer}>
          <View style={styles.conclusion}>
            <Text style={styles.conclusionText}>결론</Text>
            <Text style={styles.conclusionDescription}>
              {currentQuestion.answerExplanation}
            </Text>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleNextQuestion}
            style={styles.nextButton}>
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex < reviewQuizQuestions.length-groupIndex*3- 1
                ? '다음 문제'
                : '홈으로'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
    backgroundColor: colors.WHITE,
  },
  questionText: {
    color: colors.BLACK,
    fontFamily: fonts.BOLD,
    fontSize: 30,
    marginBottom: 50,
    lineHeight: 38,
  },
  answerText: {
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    fontSize: 20,
    marginLeft: 10,
    marginBottom: 5,
  },
  explanationText: {
    color: colors.GRAY_75,
    fontFamily: fonts.MEDIUM,
    fontSize: 16,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 40,
    lineHeight: 22,
  },
  conclusionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  conclusionText: {
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
    fontSize: 20,
    marginBottom: 5,
  },
  conclusionDescription: {
    color: colors.GRAY_75,
    fontFamily: fonts.MEDIUM,
    fontSize: 16,
    lineHeight: 22,
  },
  conclusion: {
    width: 360,
    borderColor: colors.YELLOW_100,
    borderWidth: 2,
    borderRadius: 10,
    padding: 30,
    justifyContent: 'center',
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    width: 360,
    height: 50,
    borderRadius: 10,
    backgroundColor: colors.YELLOW_100,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: fonts.MEDIUM,
    color: colors.BLACK,
  },
});

export default QuizReviewExplanationScreen;
