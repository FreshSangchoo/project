import {createNativeStackNavigator} from '@react-navigation/native-stack';
import TransferScreen2 from '@/views/screens/account/TransferScreen2';
import TransferScreen3 from '@/views/screens/account/TransferScreen3';
import TransferScreen4 from '@/views/screens/account/TransferScreen4';
import TransferScreen from '@/views/screens/account/TransferScreen';
import AccountHistoryScreen from '@/views/screens/account/AccountHistoryScreen';
import {colors} from '@/constants/colors';
import {fonts} from '@/constants/font';
import AccountHistoryEmailScreen from '@/views/screens/account/AccountHistoryEmailScreen';

const TransferNavigator = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{headerTitleAlign: 'center'}}>
      <Stack.Screen
        name="거래내역"
        component={AccountHistoryScreen}
        options={{
          title: '거래내역 조회',
          headerStyle: {
            backgroundColor: colors.YELLOW_100,
          },
          headerTintColor: colors.BLACK,
          headerTitleStyle: {
            fontFamily: fonts.MEDIUM,
          },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="아이 거래내역"
        component={AccountHistoryEmailScreen}
        options={{
          title: '아이 거래내역 조회',
          headerStyle: {
            backgroundColor: colors.YELLOW_100,
          },
          headerTintColor: colors.BLACK,
          headerTitleStyle: {
            fontFamily: fonts.MEDIUM,
          },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="송금"
        component={TransferScreen}
        options={{
          title: '아이에게 송금하기',
          headerStyle: {
            backgroundColor: colors.YELLOW_25,
          },
          headerTintColor: colors.BLACK,
          headerTitleStyle: {
            fontFamily: fonts.MEDIUM,
          },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen name="송금2" component={TransferScreen2} />
      <Stack.Screen name="송금3" component={TransferScreen3} />
      <Stack.Screen name="송금4" component={TransferScreen4} />
    </Stack.Navigator>
  );
};

export default TransferNavigator;
