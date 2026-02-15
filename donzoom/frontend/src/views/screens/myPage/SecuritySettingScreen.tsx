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

import NextIcon from 'react-native-vector-icons/MaterialIcons';

function SecuritySettingScreen({navigation}: any) {
  const [isOn, setIsOn] = useState(false);

  const toggleSwitch = () => {
    setIsOn(previousState => !previousState);
  };
  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.optionContainer}>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionHeaderText}>지문인증 설정</Text>
          </View>
          <View style={styles.toggleContainer}>
            <TouchableOpacity onPress={toggleSwitch}>
              <FontAwesome
                name={isOn ? 'toggle-on' : 'toggle-off'}
                size={30}
                color={isOn ? colors.BLUE_100 : '#B0BEC5'}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.optionContainer}>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionHeaderText}>비밀번호 변경</Text>
          </View>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={{marginLeft: 46}}
              onPress={() => navigation.navigate('비밀번호 설정')}>
              <NextIcon name="navigate-next" size={30} color={colors.BLACK} />
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
    marginBottom: 30,
    alignItems: 'center',
  },
  optionTextContainer: {
    marginLeft: 20,
    width: 280,
  },
  optionHeaderText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 18,
  },
  toggleContainer: {
    marginRight: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexGrow: 1,
  },
});

export default SecuritySettingScreen;
