import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AccountInitScreen from '@/views/screens/account/AccountInitScreen';
import TermsAgreementScreen from '@/views/screens/account/TermsAgreementScreen';
import NewPassWordScreen from '@/views/screens/myPage/NewPassWordScreen';
import ConfirmPassWordScreen from '@/views/screens/myPage/ConfirmPassWordScreen';
import ChildrenMainScreen from '@/views/screens/main/ChildrenMainScreen';

const AccountInitNavigator = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{headerTitleAlign: 'center'}}>
      <Stack.Screen name="약관동의" component={TermsAgreementScreen} />
      <Stack.Screen name="비밀번호설정" component={NewPassWordScreen} />
      <Stack.Screen name="비밀번호확인" component={ConfirmPassWordScreen} />
      <Stack.Screen name="계좌시작하기" component={AccountInitScreen} />
    </Stack.Navigator>
  );
};

export default AccountInitNavigator;
