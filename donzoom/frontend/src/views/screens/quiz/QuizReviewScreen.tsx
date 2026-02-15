import {useState} from 'react';
import {useQuizStore} from '@/stores/useQuizStore';
import {Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';

import Correct from '@/assets/correct.svg';
import NotCorrect from '@/assets/notCorrect.svg';
import {useRoute} from '@react-navigation/native';

function QuizReviewScreen({navigation}: any) {
  const {params} = useRoute();
  const {groupIndex}: any = params;
  const {
    reviewQuizQuestions,
    currentQuestionIndex,
    selectedAnswer,
    setSelectedAnswer,
  } = useQuizStore();
  const currentQuestion = reviewQuizQuestions[groupIndex*3+currentQuestionIndex];

  const [isModalVisible, setModalVisible] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  const clickAnswerPress = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    const isCorrect = currentQuestion?.correctAnswer === selectedAnswer;
    setIsAnswerCorrect(isCorrect);
    setModalVisible(true);
  };

  const handleViewComment = () => {
    setModalVisible(false);
    setSelectedAnswer(null);
    navigation.navigate('리뷰 해설', {groupIndex: groupIndex});
  };

  return (
    <View style={styles.container}>
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion?.question}</Text>
      </View>
      <View style={styles.answerContainer}>
        {currentQuestion?.answers.map((answer, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.answerBox,
              selectedAnswer === answer && styles.selectedAnswer,
            ]}
            onPress={() => clickAnswerPress(answer)}>
            <Text style={styles.answerText}>{answer}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>제출하기</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.image}>
              {isAnswerCorrect ? (
                <Correct width={60} height={60} />
              ) : (
                <NotCorrect width={60} height={60} />
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.correctText}>
                {isAnswerCorrect ? '정답입니다!' : '정답이 아니에요.'}
              </Text>
              <Text style={styles.explainText}>
                {currentQuestion?.answerExplanation}
              </Text>
            </View>
            <View style={styles.solutionButtonContainer}>
              <TouchableOpacity
                style={styles.viewCommentButton}
                onPress={handleViewComment}>
                <Text style={styles.viewCommentText}>해설 보기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    padding: 20,
    paddingTop: 30,
    backgroundColor: colors.WHITE,
  },
  questionContainer: {
    marginBottom: 30,
    justifyContent: 'center',
  },
  questionText: {
    color: colors.BLACK,
    fontFamily: fonts.BOLD,
    fontSize: 20,
    lineHeight: 30,
  },
  answerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerBox: {
    width: 350,
    height: 50,
    backgroundColor: colors.GRAY_25,
    marginBottom: 15,
    justifyContent: 'center',
    paddingLeft: 20,
    borderRadius: 12,
  },
  answerText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 16,
  },
  selectedAnswer: {
    backgroundColor: '#FFF7DE',
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 35,
    left: '50%',
    transform: [{translateX: -160}],
  },
  button: {
    width: 360,
    height: 50,
    borderRadius: 10,
    backgroundColor: colors.YELLOW_100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: 360,
    height: 'auto',
    borderRadius: 20,
    backgroundColor: colors.WHITE,
    justifyContent: 'center',
    padding: 30,
    paddingTop: 40,
    paddingBottom: 30,
  },
  image: {
    marginLeft: 3,
    marginBottom: 40,
  },
  textContainer: {
    marginHorizontal: 5,
  },
  solutionButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewCommentButton: {
    backgroundColor: colors.YELLOW_100,
    borderRadius: 10,
    width: 300,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewCommentText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 16,
  },
  correctText: {
    textAlign: 'left',
    color: colors.BLACK,
    fontFamily: fonts.BOLD,
    fontSize: 20,
    marginBottom: 15,
  },
  explainText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
});

export default QuizReviewScreen;
