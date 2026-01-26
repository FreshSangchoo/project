import AuthCode from '@/pages/auth/AuthCode';
import EmailCheck from '@/pages/auth/EmailCheck';
import EmailEnter from '@/pages/auth/EmailEnter';
import EmailLogin from '@/pages/auth/EmailLogin';
import ForgotEmail from '@/pages/auth/ForgotEmail';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ForgotPasswordViaEmail from '@/pages/auth/ForgotPasswordViaEmail';
import SetNickname from '@/pages/auth/SetNickname';
import SetPassword from '@/pages/auth/SetPassword';
import Welcome from '@/pages/auth/Welcome';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/types/auth-stack';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="EmailEnter" component={EmailEnter} />
      <Stack.Screen name="EmailCheck" component={EmailCheck} />
      <Stack.Screen name="EmailLogin" component={EmailLogin} />
      <Stack.Screen name="AuthCode" component={AuthCode} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="ForgotPasswordViaEmail" component={ForgotPasswordViaEmail} />
      <Stack.Screen name="ForgotEmail" component={ForgotEmail} />
      <Stack.Screen name="SetNickname" component={SetNickname} />
      <Stack.Screen name="SetPassword" component={SetPassword} />
    </Stack.Navigator>
  );
};

export default AuthStackNavigator;
