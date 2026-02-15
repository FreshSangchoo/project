import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {StyleSheet} from 'react-native';
import MyInformationScreen from '@/views/screens/myPage/MyInformationScreen';
import AlarmSettingScreen from '@/views/screens/myPage/AlarmSettingScreen';
import SecuritySettingScreen from '@/views/screens/myPage/SecuritySettingScreen';
import LoginScreen from '@/views/screens/auth/LoginScreen';
import InputPassWordScreen from '@/views/screens/myPage/InputPassWordScreen';
import NewPassWordScreen from '@/views/screens/myPage/NewPassWordScreen';
import ConfirmPassWordScreen from '@/views/screens/myPage/ConfirmPassWordScreen';
import QRCodeGenerator from '@/views/components/QRCodeGenerator';
import AccountInitScreen from '@/views/screens/account/AccountInitScreen';

const MyInformationNavigator = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{headerTitleAlign: 'center'}}>
      <Stack.Screen name="설정화면" component={MyInformationScreen} />
      <Stack.Screen name="보안 설정" component={SecuritySettingScreen} />
      <Stack.Screen name="QR 생성" component={QRCodeGenerator} />
      <Stack.Screen name="계좌 생성" component={AccountInitScreen} />
      <Stack.Screen
        name="비밀번호 설정"
        component={InputPassWordScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="NewPassWordScreen"
        component={NewPassWordScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="비밀번호확인"
        component={ConfirmPassWordScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen name="알림 설정" component={AlarmSettingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({});

export default MyInformationNavigator;
