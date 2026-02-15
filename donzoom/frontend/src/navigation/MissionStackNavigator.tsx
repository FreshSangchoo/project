import {colors} from '@/constants/colors';
import MakeNewMissionScreen from '@/views/screens/mission/MakeNewMissionScreen';
import MakeNewMissionPayScreen from '@/views/screens/mission/MakeNewMissionPayScreen';
import MakeNewMissionCompleteScreen from '@/views/screens/mission/MakeNewMIssionCompleteScreen';

import MissionHomeScreen from '@/views/screens/mission/MissionHomeScreen';

import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {StyleSheet, Text} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MissionHomeChildScreen from '@/views/screens/mission/child/MissionHomeChildScreen';
import { fonts } from '@/constants/font';
const Stack = createNativeStackNavigator();

const MissionStackNavigator = ({route}:any) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: {
          fontFamily: fonts.MEDIUM,
          fontWeight: '500',
          fontSize: 20,
        },
        headerTitleAlign: 'center', // 헤더 제목 정렬
      }}>
      <Stack.Screen
        name="아이미션"
        component={MissionHomeChildScreen}
        options={({navigation}) => ({
          title: '미션',
          headerLeft: () => {
            return (
              <Icon
                name="arrow-left"
                size={25}
                onPress={() => navigation.navigate('홈화면')}
              />
            );
          },
        })}
      />
      <Stack.Screen
        name="부모미션"
        component={MissionHomeScreen}
        options={({navigation}) => ({
          title: '미션',
          headerRight: () => {
            return (
              <Text
                onPress={() => navigation.navigate('MakeNewMission')}
                style={{color: colors.BLUE_100}}>
                추가
              </Text>
            );
          },
          headerLeft: () => {
            return (
              <Icon
                name="arrow-left"
                size={25}
                onPress={() => navigation.navigate('홈화면')}
              />
            );
          },
        })}
      />
      <Stack.Screen
        name="MakeNewMission"
        component={MakeNewMissionScreen}
        options={{title: '미션 생성'}}
      />
      <Stack.Screen
        name="MakeNewMissionPay"
        component={MakeNewMissionPayScreen}
        options={{
          title: '미션 생성',
          headerStyle: {backgroundColor: colors.YELLOW_25},
          headerShadowVisible:false,
        }}
      />
      <Stack.Screen
        name="MakeNewMissionComplete"
        component={MakeNewMissionCompleteScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({});

export default MissionStackNavigator;
