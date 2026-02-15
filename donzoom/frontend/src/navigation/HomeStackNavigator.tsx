import DrawMachineScreen from '@/views/screens/draw/DrawMachineScreen';
import HomeScreen from '@/views/screens/HomeScreen';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Text, TouchableOpacity} from 'react-native';
import {StyleSheet} from 'react-native';

import CollectionButton from '@/assets/collectionButton.svg';
import DrawCollectionScreen from '@/views/screens/draw/DrawCollectionScreen';
import QuizHomeScreen from '@/views/screens/quiz/QuizHomeScreen';
import QuizScreen from '@/views/screens/quiz/QuizScreen';
import QuizExplanationScreen from '@/views/screens/quiz/QuizExplanationScreen';
import MakeNewMissionScreen from '@/views/screens/mission/MakeNewMissionScreen';
import MissionHomeScreen from '@/views/screens/mission/MissionHomeScreen';
import {colors} from '@/constants/colors';
import AccountHistoryScreen from '@/views/screens/account/AccountHistoryScreen';
import AlarmScreen from '@/views/screens/alarm/AlarmScreen';
import MyInformationScreen from '@/views/screens/myPage/MyInformationScreen';
import QRCodeScanner from '@/views/components/QRCodeScanner';
import TransferNavigator from './TransferNavigator';
import AccountInitScreen from '@/views/screens/account/AccountInitScreen';
import MissionStackNavigator from './MissionStackNavigator';
import InvestStackNavigator from './InvestStackNavigator';
import MyInformationNavigator from './MyInformationNavigator';
import AccountInitNavigator from './AccountInitNavigator';
import TransferScreen from '@/views/screens/account/TransferScreen';
import {fonts} from '@/constants/font';
import TransferScreen2 from '@/views/screens/account/TransferScreen2';
import TransferScreen3 from '@/views/screens/account/TransferScreen3';
import TransferScreen4 from '@/views/screens/account/TransferScreen4';
import QuizReviewScreen from '@/views/screens/quiz/QuizReviewScreen';
import QuizReviewExplanationScreen from '@/views/screens/quiz/QuizReviewExplanationScreen';
import AccountHistoryEmailScreen from '@/views/screens/account/AccountHistoryEmailScreen';

const HomeStackNavigator = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{headerTitleAlign: 'center'}}>
      <Stack.Screen
        name="홈화면"
        component={HomeScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen name="알림" component={AlarmScreen} />
      <Stack.Screen
        name="설정"
        component={MyInformationNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="계좌관리"
        component={TransferNavigator}
        options={{headerShown: false}}
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
        name="계좌개설"
        component={AccountInitNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="QRCodeScanner"
        component={QRCodeScanner}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="송금"
        component={TransferScreen}
        options={{
          title: '송금하기',
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
      <Stack.Screen
        name="송금2"
        component={TransferScreen2}
        options={{
          title: '송금하기',
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
      <Stack.Screen
        name="송금3"
        component={TransferScreen3}
        options={{
          title: '송금하기',
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
      <Stack.Screen
        name="송금4"
        component={TransferScreen4}
        options={{
          title: '송금하기',
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
      <Stack.Screen
        name="부모미션"
        component={MissionStackNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="아이미션"
        component={MissionStackNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="모의투자"
        component={InvestStackNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen name="퀴즈" component={QuizHomeScreen} />
      <Stack.Screen name="오늘의 퀴즈" component={QuizScreen} />
      <Stack.Screen name="해설" component={QuizExplanationScreen} />
      <Stack.Screen name="퀴즈 리뷰" component={QuizReviewScreen} />
      <Stack.Screen name="리뷰 해설" component={QuizReviewExplanationScreen} />
      <Stack.Screen
        name="픽뽑기"
        component={DrawMachineScreen}
        options={({navigation}) => ({
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('픽수집함')}>
              <CollectionButton width={24} height={24} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="픽수집함" component={DrawCollectionScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({});

export default HomeStackNavigator;
