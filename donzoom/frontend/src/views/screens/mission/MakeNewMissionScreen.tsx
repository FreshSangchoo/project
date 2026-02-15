import React, {useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import {colors} from '@/constants/colors';
import InputField from '@/views/components/InputField';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomCalendar from '@/views/components/CustomCalendar';
import { fonts } from '@/constants/font';

const MakeNewMissionScreen = ({navigation}: any) => {
  const [text, setText] = useState('');
  const [textCount, setTextCount] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); //선택된 날짜

  const onChangeText = (input: any) => {
    if (input.length <= 20) {
      setText(input);
      setTextCount(input.length);
    }
  };

  const handleDateSelect = (date: any) => {
    setSelectedDate(date);
  };

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };
  // 버튼 diabled: 글자안썼거나 날짜선택안하면 true
  const disabled = textCount === 0 || selectedDate === null;
  const selectedDateString = (selectedDate || '').replaceAll('-', '.');
  return (
    <SafeAreaView style={{flex:1, backgroundColor:colors.WHITE}}>
      <View style={styles.container}>
        <Text style={styles.text}>어떤 미션을 요청할까요?</Text>
        <View style={styles.missionBox}>
          <View style={styles.input}>
            <InputField
              autoFocus
              inputMode="text"
              style={{color: colors.BLACK}}
              placeholder="미션 내용을 입력하세요"
              onChangeText={onChangeText}
              value={text}
            />
            <Text>{textCount}/20</Text>
          </View>
          <TouchableOpacity
            onPress={toggleCalendar} // 캘린더 모달, 다른데 클릭하면 내려가
            style={styles.dateSettingContainer}>
            <Icon name="edit-calendar" size={25} />
            <Text style={styles.dateSettingText}>
              {selectedDate
                ? `기한: ${selectedDateString} 까지`
                : '기한 설정하기'}
            </Text>
          </TouchableOpacity>
        </View>
        <Modal
          transparent={true}
          visible={showCalendar}
          onRequestClose={toggleCalendar}>
          <TouchableWithoutFeedback onPress={toggleCalendar}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <CustomCalendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                />
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <TouchableOpacity
          style={disabled ? styles.inAcitve : styles.Active}
          disabled={disabled}
          onPress={() =>
            navigation.navigate('MakeNewMissionPay', {
              text: text,
              selectedDate: selectedDate,
            })
          }>
          <Text style={styles.buttonText}>다음</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    marginTop: 20,
    alignItems: 'center',
  },
  text: {
    fontFamily: fonts.BOLD,
    fontSize: 25,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  missionBox: {
    alignItems: 'center',
    width: 300,
    padding: 30,
    borderRadius: 10,
    backgroundColor: colors.YELLOW_100,
  },
  input: {
    width: 250,
    height: 50,
    borderRadius: 10,
    backgroundColor: colors.WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  dateSettingContainer: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  dateSettingText: {
    fontFamily: fonts.BOLD,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  inAcitve: {
    marginTop: 10,
    width: 300,
    height: 45,
    borderRadius: 10,
    backgroundColor: colors.GRAY_50,
    justifyContent: 'center',
  },
  Active: {
    marginTop: 10,
    width: 300,
    height: 45,
    borderRadius: 10,
    backgroundColor: colors.BLUE_100,
    justifyContent: 'center',
  },
  buttonText: {
    textAlign: 'center',
    fontFamily: fonts.MEDIUM,
    color: colors.WHITE,
    fontSize: 18,
  },
});

export default MakeNewMissionScreen;
