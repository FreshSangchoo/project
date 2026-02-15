import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import PasswordPad from '@/views/components/PasswordPad';
import {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

function InputPassWordScreen({navigation}: any) {
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  // 초기 비밀번호 더미
  const correctPassword = '000000';

  const updateValue = (newValue: string) => {
    if (newValue.length <= 6) {
      setPassword(newValue);
    }
    if (newValue.length === 6) {
      if (newValue === correctPassword) {
        setError('');
        navigation.navigate('NewPassWordScreen');
      } else {
        setError('비밀번호가 일치하지 않습니다.');
        setPassword('');
      }
    }
  };
  const renderPasswordCircles = () => {
    const circles = [];
    const passwordLength = password.length;

    for (let i = 0; i < 6; i++) {
      circles.push(
        <View
          key={i}
          style={[styles.circle, i < passwordLength && styles.filledCircle]}
        />,
      );
    }
    return circles;
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.inputText}>비밀번호를 입력해주세요</Text>
        <View style={styles.passwordContainer}>{renderPasswordCircles()}</View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
      <View style={styles.padContainer}>
        <PasswordPad onInput={updateValue} currentValue={password} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: colors.WHITE,
  },
  textContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputText: {
    color: colors.BLACK,
    fontFamily: fonts.MEDIUM,
    fontSize: 24,
    marginBottom: 30,
  },
  passwordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 240,
    marginBottom: 20,
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 10,
    backgroundColor: '#D9D9D9',
  },
  filledCircle: {
    backgroundColor: colors.BLACK,
  },
  errorText: {
    color: colors.RED_100,
    fontSize: 14,
    fontFamily: fonts.MEDIUM,
    marginTop: 10,
  },
  padContainer: {
    backgroundColor: colors.YELLOW_25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default InputPassWordScreen;
