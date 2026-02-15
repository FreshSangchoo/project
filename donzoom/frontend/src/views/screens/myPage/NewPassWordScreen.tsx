import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import PasswordPad from '@/views/components/PasswordPad';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

function NewPassWordScreen({navigation}: any) {
  const [newPassword, setNewPassword] = useState<string>(''); // 새 비밀번호

  useFocusEffect(
    useCallback(() => {
      return () => {
        setNewPassword('');
      };
    }, []),
  );

  const updateValue = (newValue: string) => {
    if (newValue.length <= 6) {
      setNewPassword(newValue); // 새 비밀번호를 설정
    }
    if (newValue.length === 6) {
      // newValue를 바로 넘겨줌 (setState 비동기 동작을 고려)
      navigation.navigate('비밀번호확인', {newPassword: newValue});
    }
  };

  const renderPasswordCircles = () => {
    const circles = [];
    const passwordLength = newPassword.length;

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
        <Text style={styles.inputText}>새 비밀번호를 입력해주세요</Text>
        <View style={styles.passwordContainer}>{renderPasswordCircles()}</View>
      </View>
      <View style={styles.padContainer}>
        <PasswordPad onInput={updateValue} currentValue={newPassword} />
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
  padContainer: {
    backgroundColor: colors.YELLOW_25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NewPassWordScreen;
