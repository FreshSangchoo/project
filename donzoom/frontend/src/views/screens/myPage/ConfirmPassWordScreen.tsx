import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import PasswordPad from '@/views/components/PasswordPad';
import {useCallback, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {useRoute, RouteProp, useFocusEffect} from '@react-navigation/native';
import usePasswordStore from '@/stores/usePasswordStore';

// Route props 타입 정의
type RouteParams = {
  params: {
    newPassword: string;
  };
};

function ConfirmPassWordScreen({navigation}: any) {
  const {password, setPassword} = usePasswordStore();
  const [error, setError] = useState<string>(''); // 오류 메시지 상태

  // useRoute 훅을 통해 newPassword를 안전하게 받아옴
  const route = useRoute<RouteProp<RouteParams>>();
  const newPassword = route.params?.newPassword; // NewPassWordScreen.tsx에서 전달된 새 비밀번호

  useFocusEffect(
    useCallback(() => {
      return () => {
        setPassword('');
      };
    }, []),
  );

  const updateValue = (newValue: string) => {
    if (newValue.length <= 6) {
      setPassword(newValue);
    }

    if (newValue.length === 6) {
      if (newValue === newPassword) {
        setError(''); // 오류 메시지 초기화
        setPassword(newPassword);
        navigation.navigate('계좌시작하기', {password: newPassword});
        Alert.alert('비밀번호 설정이 완료되었습니다.');
      } else {
        setError('비밀번호가 일치하지 않습니다.');
        setPassword(''); // 비밀번호를 틀리면 입력 초기화
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
        <Text style={styles.inputText}>비밀번호를 다시 입력해주세요</Text>
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
    marginBottom: 10,
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

export default ConfirmPassWordScreen;
