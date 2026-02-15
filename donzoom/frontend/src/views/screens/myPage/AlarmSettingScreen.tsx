import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
} from 'react-native';
import {useState} from 'react';

function AlarmSettingScreen() {
  const [isServiceOn, setIsServiceOn] = useState(false);
  const [isInvestOn, setIsInvestOn] = useState(false);
  const [isEventOn, setIsEventOn] = useState(false);

  const toggleServiceSwitch = () => {
    setIsServiceOn(previousState => !previousState);
  };
  const toggleInvestSwitch = () => {
    setIsInvestOn(previousState => !previousState);
  };
  const toggleEventSwitch = () => {
    setIsEventOn(previousState => !previousState);
  };
  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.optionContainer}>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionHeaderText}>서비스 알림</Text>
            <Text style={styles.optionContextText}>
              입출금 알림, 미션 달성 등에 대한 주요 알림을 받아볼게요.
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <TouchableOpacity onPress={toggleServiceSwitch}>
              <FontAwesome
                name={isServiceOn ? 'toggle-on' : 'toggle-off'}
                size={30}
                color={isServiceOn ? colors.BLUE_100 : '#B0BEC5'}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.optionContainer}>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionHeaderText}>투자 알림</Text>
            <Text style={styles.optionContextText}>
              투자 종목의 최고가, 최저가 등에 대한 정보를 받아볼게요.
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <TouchableOpacity onPress={toggleInvestSwitch}>
              <FontAwesome
                name={isInvestOn ? 'toggle-on' : 'toggle-off'}
                size={30}
                color={isInvestOn ? colors.BLUE_100 : '#B0BEC5'}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.optionContainer}>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionHeaderText}>이벤트 알림</Text>
            <Text style={styles.optionContextText}>
              진행중인 이벤트 등 광고성 알림에 대한 정보를 받아볼게요.
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <TouchableOpacity onPress={toggleEventSwitch}>
              <FontAwesome
                name={isEventOn ? 'toggle-on' : 'toggle-off'}
                size={30}
                color={isEventOn ? colors.BLUE_100 : '#B0BEC5'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
    paddingHorizontal: 10,
    minHeight: '100%',
    backgroundColor: colors.WHITE,
  },
  optionContainer: {
    flexDirection: 'row',
  },
  optionTextContainer: {
    marginLeft: 20,
    width: 280,
    marginBottom: 20,
  },
  optionHeaderText: {
    color: colors.BLACK,
    fontFamily: fonts.BOLD,
    marginTop: 6,
    fontSize: 18,
    marginBottom: 6,
  },
  optionContextText: {
    color: colors.GRAY_50,
    fontFamily: fonts.MEDIUM,
    fontSize: 14,
    lineHeight: 18,
  },
  toggleContainer: {
    marginRight: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexGrow: 1,
  },
});

export default AlarmSettingScreen;
